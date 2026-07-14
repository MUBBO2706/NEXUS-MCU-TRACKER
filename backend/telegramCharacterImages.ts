import crypto from "crypto";

// Configuration for character images repository
export interface CharacterImageConfig {
  token: string;
  channelId: string;
}

export interface CharacterImageEntry {
  messageId: number;
  fileId: string;
  fileUniqueId?: string;
  updatedAt: number;
}

export type CharacterImageIndex = Record<string, CharacterImageEntry>;

// Layer 1 Cache: In-memory cache for fast runtime lookups of the index
let inMemoryIndexCache: CharacterImageIndex | null = null;
let inMemoryIndexPinnedMessageId: number | null = null;
let indexCacheTimestamp = 0;
const INDEX_CACHE_TTL = 30000; // 30 seconds TTL to check for updates across instances

// Layer 3 Cache: Image response cache (filename -> { bytes: Buffer, contentType: string, timestamp: number })
interface ImageResponseCacheEntry {
  bytes: Buffer;
  contentType: string;
  timestamp: number;
}
const imageResponseCache = new Map<string, ImageResponseCacheEntry>();
const IMAGE_RESPONSE_CACHE_TTL = 3600000; // 1 hour cache for image bytes

// File path cache (fileId -> { filePath: string, timestamp: number })
// Telegram file paths are valid for at least 1 hour, so we cache them for 30 minutes to reduce API calls
const filePathCache = new Map<string, { filePath: string; timestamp: number }>();
const FILE_PATH_CACHE_TTL = 1800000; // 30 minutes

// List of expected character filenames for validation/normalization
export const CHARACTER_FILENAMES = [
  "ironman.jpg",
  "captainamerica.jpg",
  "thor.jpg",
  "loki.jpg",
  "wanda.jpg",
  "spiderman.jpg",
  "blackwidow.jpg",
  "hulk.jpg",
  "hawkeye.jpg",
  "starlord.jpg",
  "doctorstrange.jpg",
  "blackpanther.jpg",
  "captainmarvel.jpg",
  "antman.jpg",
  "thanos.jpg"
];

// Helper to get Telegram Character bot configuration with fallback to main storage configurations
export function getCharacterConfig(): CharacterImageConfig {
  const token =
    process.env.TELEGRAM_CHARACTER_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.STORAGE_ACCESS_TOKEN;

  const channelId =
    process.env.TELEGRAM_CHARACTER_CHANNEL_ID ||
    process.env.TELEGRAM_STORAGE_CHANNEL_ID ||
    process.env.STORAGE_STORAGE_CHANNEL_ID;

  if (!token || !channelId) {
    throw new Error("TELEGRAM_CHARACTER_NOT_CONFIGURED");
  }

  return { token, channelId };
}

// Telegram HTTP helper
async function telegramRequest(token: string, endpoint: string, options?: RequestInit) {
  const url = `https://api.telegram.org/bot${token}/${endpoint}`;
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

// Upload file helper
async function uploadTelegramFile(
  token: string,
  chatId: string,
  filename: string,
  content: string
): Promise<{ messageId: number; fileId: string }> {
  const formData = new FormData();
  formData.append("chat_id", chatId);

  const blob = new Blob([content], { type: "application/json" });
  formData.append("document", blob, filename);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload index file to Telegram: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (!data.ok || !data.result?.document?.file_id) {
    throw new Error("Telegram upload succeeded but document file ID was missing from response");
  }

  return {
    messageId: data.result.message_id,
    fileId: data.result.document.file_id,
  };
}

// Update file helper (edit message media)
async function updateTelegramFile(
  token: string,
  chatId: string,
  messageId: number,
  filename: string,
  content: string
): Promise<{ messageId: number; fileId: string }> {
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("message_id", String(messageId));

  const mediaObject = {
    type: "document",
    media: "attach://docfile"
  };
  formData.append("media", JSON.stringify(mediaObject));

  const blob = new Blob([content], { type: "application/json" });
  formData.append("docfile", blob, filename);

  const response = await fetch(`https://api.telegram.org/bot${token}/editMessageMedia`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to update index file on Telegram: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (!data.ok || !data.result?.document?.file_id) {
    throw new Error("Telegram editMessageMedia succeeded but document file ID was missing from response");
  }

  return {
    messageId: data.result.message_id,
    fileId: data.result.document.file_id,
  };
}

// Download file helpers
async function getTelegramFilePath(token: string, fileId: string): Promise<string> {
  const cached = filePathCache.get(fileId);
  if (cached && Date.now() - cached.timestamp < FILE_PATH_CACHE_TTL) {
    return cached.filePath;
  }

  const data = await telegramRequest(token, `getFile?file_id=${fileId}`);
  if (!data.ok || !data.result?.file_path) {
    throw new Error("Failed to get file path from Telegram");
  }

  const filePath = data.result.file_path;
  filePathCache.set(fileId, { filePath, timestamp: Date.now() });
  return filePath;
}

async function downloadTelegramFileBinary(token: string, filePath: string): Promise<Buffer> {
  const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download binary file from Telegram: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Normalize filename to check if it's one of the expected character filenames
function normalizeFilename(filename: string | undefined): string | null {
  if (!filename) return null;
  const lower = filename.trim().toLowerCase();
  
  // Direct match in the expected list
  if (CHARACTER_FILENAMES.includes(lower)) {
    return lower;
  }

  // Check if any character name is a substring or close match (e.g. "iron_man.jpg", "ironman_portrait.jpg", "ironman")
  for (const expected of CHARACTER_FILENAMES) {
    const coreName = expected.replace(".jpg", "");
    if (lower.includes(coreName) || coreName.includes(lower)) {
      return expected;
    }
  }

  return null;
}

// Fetch message details by forwarding it to the same channel and then immediately deleting it
async function fetchMessageInfoByForwarding(token: string, channelId: string, messageId: number): Promise<any | null> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/forwardMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        from_chat_id: channelId,
        message_id: messageId,
        disable_notification: true,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.ok || !data.result) {
      return null;
    }

    const forwardedMsg = data.result;
    const newMsgId = forwardedMsg.message_id;

    // Immediately delete the forwarded duplicate message to clean up the channel
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          message_id: newMsgId,
        }),
      });
    } catch (delErr) {
      console.warn(`[Telegram Character Repo] Non-fatal: Failed to delete forwarded temporary message ${newMsgId}:`, delErr);
    }

    return forwardedMsg;
  } catch (err) {
    return null;
  }
}

// Scan channel messages and rebuild the complete image index
export async function scanChannelAndRebuildIndex(): Promise<CharacterImageIndex> {
  const { token, channelId } = getCharacterConfig();
  console.log(`[Telegram Character Repo] Initiating channel scan to rebuild index for channel: ${channelId}...`);

  // 1. Send a probe message to find the highest message ID in the channel, then delete it
  let maxId = 500; // conservative default fallback
  try {
    const probeResponse = await telegramRequest(token, "sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text: `🔍 [System Image Index Probe] ${Date.now()}`,
        disable_notification: true,
      }),
    });

    if (probeResponse.ok && probeResponse.result?.message_id) {
      maxId = probeResponse.result.message_id;
      console.log(`[Telegram Character Repo] Detected highest message ID in channel: ${maxId}`);
      
      // Immediately delete the probe message to keep the channel clean
      try {
        await telegramRequest(token, "deleteMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: channelId,
            message_id: maxId,
          }),
        });
      } catch (delErr) {
        console.warn(`[Telegram Character Repo] Non-fatal: Failed to delete probe message:`, delErr);
      }
    }
  } catch (probeErr) {
    console.warn(`[Telegram Character Repo] Probe message check failed, scanning up to default limit of 500:`, probeErr);
  }

  // 2. Scan message IDs in reverse order from maxId down to 1 (or max 500 messages depth to keep it fast)
  const newIndex: CharacterImageIndex = {};
  const expectedCount = CHARACTER_FILENAMES.length;
  let foundCount = 0;
  const minId = Math.max(1, maxId - 500);

  console.log(`[Telegram Character Repo] Scanning messages in reverse from message ID ${maxId} down to ${minId}...`);

  // Scan in small concurrent batches of 15 messages to prevent Telegram rate limiting and ensure speed
  const concurrency = 15;
  for (let currentId = maxId; currentId >= minId; currentId -= concurrency) {
    // Check if we have already found all expected characters
    if (foundCount >= expectedCount) {
      console.log(`[Telegram Character Repo] Found all ${expectedCount} characters! Stopping scan early.`);
      break;
    }

    const promises: Promise<void>[] = [];
    const batchIds: number[] = [];
    for (let i = 0; i < concurrency && (currentId - i) >= minId; i++) {
      batchIds.push(currentId - i);
    }

    for (const msgId of batchIds) {
      promises.push((async () => {
        const msg = await fetchMessageInfoByForwarding(token, channelId, msgId);
        if (!msg) return;

        let fileId = "";
        let fileUniqueId = "";
        let rawFilename = "";

        // Check if message has a document
        if (msg.document) {
          fileId = msg.document.file_id;
          fileUniqueId = msg.document.file_unique_id || "";
          rawFilename = msg.document.file_name || msg.caption || "";
        }
        // Check if message has a photo
        else if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
          const largestPhoto = msg.photo[msg.photo.length - 1];
          fileId = largestPhoto.file_id;
          fileUniqueId = largestPhoto.file_unique_id || "";
          rawFilename = msg.caption || "";
        }

        if (fileId) {
          const normalized = normalizeFilename(rawFilename);
          if (normalized) {
            // Only assign if not already found in this run (reverse scan means newer posts are kept)
            if (!newIndex[normalized]) {
              console.log(`[Telegram Character Repo] Found character portrait for ${normalized} in message ${msgId}`);
              newIndex[normalized] = {
                messageId: msgId,
                fileId,
                fileUniqueId,
                updatedAt: Date.now()
              };
              foundCount++;
            }
          }
        }
      })());
    }

    await Promise.all(promises);
  }

  // 3. Store the generated image index as a JSON document in Telegram Storage and PIN it
  const indexJsonStr = JSON.stringify(newIndex, null, 2);
  const indexFilename = "character_images_index.json";
  
  let finalMessageId = inMemoryIndexPinnedMessageId;
  let uploadSuccess = false;

  if (finalMessageId) {
    try {
      console.log(`[Telegram Character Repo] Attempting to update existing pinned index message ${finalMessageId}...`);
      const editResult = await updateTelegramFile(token, channelId, finalMessageId, indexFilename, indexJsonStr);
      finalMessageId = editResult.messageId;
      uploadSuccess = true;
    } catch (editErr) {
      console.warn(`[Telegram Character Repo] Failed to edit pinned index message, uploading a new one...`);
      finalMessageId = null;
    }
  }

  if (!uploadSuccess) {
    try {
      const uploadResult = await uploadTelegramFile(token, channelId, indexFilename, indexJsonStr);
      finalMessageId = uploadResult.messageId;
      
      // Pin the newly created index file message
      await telegramRequest(token, "pinChatMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          message_id: finalMessageId,
          disable_notification: true,
        }),
      });
      console.log(`[Telegram Character Repo] Created and pinned new index file at message ${finalMessageId}`);
    } catch (uploadErr) {
      console.error(`[Telegram Character Repo] CRITICAL: Failed to save the index file on Telegram:`, uploadErr);
    }
  }

  // Update memory cache
  inMemoryIndexCache = newIndex;
  inMemoryIndexPinnedMessageId = finalMessageId;
  indexCacheTimestamp = Date.now();

  return newIndex;
}

// Fetch character image index from persistent Telegram JSON document
export async function getCharacterImageIndex(forceFresh = false): Promise<CharacterImageIndex> {
  // Layer 1: In-Memory cache lookup
  if (!forceFresh && inMemoryIndexCache && (Date.now() - indexCacheTimestamp < INDEX_CACHE_TTL)) {
    return inMemoryIndexCache;
  }

  const { token, channelId } = getCharacterConfig();

  // Layer 2: Persistent Telegram JSON index lookup via getChat Pinned Message
  try {
    console.log(`[Telegram Character Repo] Retrieving chat info to find pinned index...`);
    const chatInfo = await telegramRequest(token, `getChat?chat_id=${channelId}`);
    const pinnedMessage = chatInfo.result?.pinned_message;

    if (pinnedMessage && pinnedMessage.document && pinnedMessage.document.file_name === "character_images_index.json") {
      const fileId = pinnedMessage.document.file_id;
      const filePath = await getTelegramFilePath(token, fileId);
      const content = (await downloadTelegramFileBinary(token, filePath)).toString("utf-8");
      
      const parsedIndex = JSON.parse(content) as CharacterImageIndex;
      inMemoryIndexCache = parsedIndex;
      inMemoryIndexPinnedMessageId = pinnedMessage.message_id;
      indexCacheTimestamp = Date.now();
      
      console.log(`[Telegram Character Repo] Successfully loaded persistent index from Telegram pinned message.`);
      return parsedIndex;
    }
  } catch (err) {
    console.warn(`[Telegram Character Repo] Persistent Telegram JSON index fetch failed:`, err);
  }

  // If no pinned message, or fetching failed, scan the channel to rebuild it
  console.log(`[Telegram Character Repo] Pinned index not found or unreachable. Rebuilding index via scan...`);
  return await scanChannelAndRebuildIndex();
}

// Retrieve character image bytes from the Telegram repository with automatic self-healing
export async function getCharacterImage(characterId: string): Promise<ImageResponseCacheEntry | null> {
  const normalizedCharId = characterId.toLowerCase();
  const filename = normalizedCharId.endsWith(".jpg") ? normalizedCharId : `${normalizedCharId}.jpg`;

  // Layer 3 Cache: Image response cache lookup
  const cachedImage = imageResponseCache.get(filename);
  if (cachedImage && (Date.now() - cachedImage.timestamp < IMAGE_RESPONSE_CACHE_TTL)) {
    return cachedImage;
  }

  const { token } = getCharacterConfig();

  // Get index
  let index = await getCharacterImageIndex();
  let entry = index[filename];

  // If missing from index, trigger a force fresh reload of the index (new upload check)
  if (!entry) {
    console.log(`[Telegram Character Repo] Image ${filename} not found in current index. Triggering index refresh...`);
    index = await getCharacterImageIndex(true);
    entry = index[filename];
  }

  if (!entry) {
    console.warn(`[Telegram Character Repo] Character ${filename} does not exist in Telegram channel repository.`);
    return null;
  }

  try {
    // Resolve file path and download
    const filePath = await getTelegramFilePath(token, entry.fileId);
    const bytes = await downloadTelegramFileBinary(token, filePath);
    
    const responseEntry: ImageResponseCacheEntry = {
      bytes,
      contentType: "image/jpeg",
      timestamp: Date.now()
    };

    // Cache the downloaded image response in memory (Layer 3)
    imageResponseCache.set(filename, responseEntry);
    return responseEntry;
  } catch (err: any) {
    // Automatic Self-Healing Trigger: Lookup/download failed (e.g. image deleted, replaced, stale file ID)
    console.warn(`[Telegram Character Repo] Fetch failed for ${filename} using cached file ID. Initiating automatic self-healing...`, err);
    
    try {
      // 1. Rebuild the complete index
      const freshIndex = await scanChannelAndRebuildIndex();
      const freshEntry = freshIndex[filename];

      if (!freshEntry) {
        throw new Error(`Self-healing failed: ${filename} was not found even after rebuilding the index.`);
      }

      // 2. Retry download with rebuilt file ID
      const filePath = await getTelegramFilePath(token, freshEntry.fileId);
      const bytes = await downloadTelegramFileBinary(token, filePath);
      
      const responseEntry: ImageResponseCacheEntry = {
        bytes,
        contentType: "image/jpeg",
        timestamp: Date.now()
      };

      imageResponseCache.set(filename, responseEntry);
      console.log(`[Telegram Character Repo] Self-healing successful! Serving recovered image for ${filename}`);
      return responseEntry;
    } catch (healErr) {
      console.error(`[Telegram Character Repo] Self-healing failed catastrophically:`, healErr);
      return null;
    }
  }
}

// Maps characterId or a source URL to its corresponding Telegram channel filename
export function getCharacterFilename(characterId?: string, url?: string): string | null {
  if (characterId) {
    const normalized = characterId.toLowerCase().trim();
    for (const filename of CHARACTER_FILENAMES) {
      if (filename.replace(".jpg", "") === normalized) {
        return filename;
      }
    }
  }

  if (url) {
    const lowerUrl = url.toLowerCase();
    
    // Direct checks for exact matches of character names in URL
    for (const filename of CHARACTER_FILENAMES) {
      const charName = filename.replace(".jpg", "");
      if (lowerUrl.includes("/" + charName + ".") || lowerUrl.includes("_" + charName + ".") || lowerUrl.endsWith(charName + ".jpg")) {
        return filename;
      }
    }

    // Secondary sub-string check
    for (const filename of CHARACTER_FILENAMES) {
      const charName = filename.replace(".jpg", "");
      if (lowerUrl.includes(charName)) {
        return filename;
      }
    }

    // Alternative Wikipedia and Unsplash name mappings to canonical characters
    const altMap: Record<string, string> = {
      "robertdowneyjr": "ironman.jpg",
      "robert_downey": "ironman.jpg",
      "chris_evans": "captainamerica.jpg",
      "steve_rogers": "captainamerica.jpg",
      "chris_hemsworth": "thor.jpg",
      "tom_hiddleston": "loki.jpg",
      "elizabeth_olsen": "wanda.jpg",
      "elizabetholsen": "wanda.jpg",
      "wanda_maximoff": "wanda.jpg",
      "tom_holland": "spiderman.jpg",
      "spider-man": "spiderman.jpg",
      "scarlett_johansson": "blackwidow.jpg",
      "scarlet_johansson": "blackwidow.jpg",
      "mark_ruffalo": "hulk.jpg",
      "bruce_banner": "hulk.jpg",
      "jeremy_renner": "hawkeye.jpg",
      "clint_barton": "hawkeye.jpg",
      "chris_pratt": "starlord.jpg",
      "star-lord": "starlord.jpg",
      "benedict_cumberbatch": "doctorstrange.jpg",
      "doctor_strange": "doctorstrange.jpg",
      "stephen_strange": "doctorstrange.jpg",
      "chadwick_boseman": "blackpanther.jpg",
      "black_panther": "blackpanther.jpg",
      "brie_larson": "captainmarvel.jpg",
      "captain_marvel": "captainmarvel.jpg",
      "paul_rudd": "antman.jpg",
      "ant-man": "antman.jpg",
      "josh_brolin": "thanos.jpg",
      "thanos": "thanos.jpg"
    };

    for (const [key, filename] of Object.entries(altMap)) {
      if (lowerUrl.includes(key)) {
        return filename;
      }
    }
  }

  return null;
}

