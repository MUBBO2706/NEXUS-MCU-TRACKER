import { getTelegramConfig, uploadTelegramFile, getTelegramFilePath, downloadTelegramFile, updateTelegramFile, getMasterIndexMetadata, updateMasterIndexMetadata } from './telegramDb.js';

const DEVICE_MAPPINGS_FILENAME = 'device_mappings.json';
const GITHUB_DEVICES_URL = 'https://raw.githubusercontent.com/androidtrackers/certified-android-devices/master/by_model.json';

let localMappingsCache: Record<string, string> | null = null;
let telegramMessageId: number | null = null;
let telegramFileId: string | null = null;
let githubDataCache: Record<string, any> | null = null;

export async function resolveDeviceName(model: string): Promise<string | null> {
  if (!model || model === 'Unknown Device') return null;

  // 1. Check local memory cache
  if (localMappingsCache && localMappingsCache[model]) {
    return localMappingsCache[model];
  }

  // 2. Initialize from Telegram if not done yet
  if (!localMappingsCache) {
    try {
      const { token, chatId } = getTelegramConfig();
      // Let's use the master index to store mapping index, similar to user index
      // Or we can just try to fetch the file if we stored it in the index previously.
      // Wait, we need to save the file ID somewhere. We can save it in the MasterIndex.
      // Instead of touching MasterIndex, let's just make it simpler if possible. 
      // Actually we need to access MasterIndex to find this file.
      
      const metadata = await getMasterIndexMetadata(token, chatId);
      const mappingFile = metadata?.deviceMappingsFile;
      
      if (mappingFile && mappingFile.fileId) {
        telegramMessageId = mappingFile.messageId;
        telegramFileId = mappingFile.fileId;
        const filePath = await getTelegramFilePath(token, mappingFile.fileId);
        const contentStr = await downloadTelegramFile(token, filePath);
        localMappingsCache = JSON.parse(contentStr);
      } else {
        localMappingsCache = {};
      }
    } catch (e) {
      console.error('Failed to load device mappings from Telegram:', e);
      localMappingsCache = {};
    }
  }

  // Check again after loading from Telegram
  if (localMappingsCache[model]) {
    return localMappingsCache[model];
  }

  // 3. Resolve from Github database
  try {
    if (!githubDataCache) {
      console.log('Fetching Github device database...');
      const res = await fetch(GITHUB_DEVICES_URL);
      if (res.ok) {
        githubDataCache = await res.json();
      }
    }

    if (githubDataCache && githubDataCache[model]) {
      const entries = githubDataCache[model];
      // Find the entry that has a brand and name, prefer the most descriptive one
      let resolvedName = '';
      for (const entry of entries) {
        if (entry.name && entry.brand) {
          resolvedName = `${entry.brand} ${entry.name}`;
          break;
        } else if (entry.name) {
          resolvedName = entry.name;
        }
      }

      if (resolvedName) {
        // We found a match, update cache
        localMappingsCache[model] = resolvedName;
        await saveMappingsToTelegram();
        return resolvedName;
      }
    }
  } catch (e) {
    console.error('Failed to resolve device from Github:', e);
  }

  return null;
}

async function saveMappingsToTelegram() {
  if (!localMappingsCache) return;
  try {
    const { token, chatId } = getTelegramConfig();
    const contentStr = JSON.stringify(localMappingsCache, null, 2);
    
    let uploadedFile;
    if (telegramMessageId) {
      // update
      uploadedFile = await updateTelegramFile(
        token,
        chatId,
        telegramMessageId,
        DEVICE_MAPPINGS_FILENAME,
        contentStr,
        "Device Mappings Cache"
      );
    } else {
      // create
      uploadedFile = await uploadTelegramFile(
        token,
        chatId,
        DEVICE_MAPPINGS_FILENAME,
        contentStr,
        "Device Mappings Cache"
      );
    }

    telegramMessageId = uploadedFile.messageId;
    telegramFileId = uploadedFile.fileId;
    
    // Update the index to point to the new mapping file
    await updateMasterIndexMetadata(token, chatId, {
      deviceMappingsFile: {
        messageId: telegramMessageId,
        fileId: telegramFileId,
        updatedAt: Date.now()
      }
    });
    
    console.log(`Saved device mappings to Telegram (count: ${Object.keys(localMappingsCache).length})`);
  } catch (e) {
    console.error('Failed to save device mappings to Telegram:', e);
  }
}
