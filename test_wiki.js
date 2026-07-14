async function inspectFailed() {
  const targets = {
    "moonknight_tv": "Moon_Knight_(TV_series)",
    "moonknight_mini": "Moon_Knight_(miniseries)",
    "secretwars": "Avengers:_Secret_Wars"
  };

  for (const [key, wikiTitle] of Object.entries(targets)) {
    const url = `https://en.wikipedia.org/wiki/${wikiTitle}`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MCU-Companion/1.0'
        }
      });
      console.log(`URL: ${url} -> Status: ${response.status}`);
      const html = await response.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      console.log(`Page Title: ${titleMatch ? titleMatch[1] : "NONE"}`);
      
      const matchTable = html.match(/<table[^>]+class="[^"]*infobox[^"]*"[^>]*>/i);
      if (matchTable) {
        console.log("Matched infobox class!");
        const startIndex = matchTable.index;
        const endIndex = html.indexOf('</table>', startIndex);
        const infoboxHtml = html.substring(startIndex, endIndex);
        
        const matches = [...infoboxHtml.matchAll(/src="([^"]+)"/g)];
        let found = false;
        for (const m of matches) {
          const src = m[1];
          if (src.includes('upload.wikimedia.org/wikipedia')) {
            console.log(`  Found Image: ${src}`);
            found = true;
          }
        }
        if (!found) {
          console.log("  No wikimedia images found in infobox");
        }
      } else {
        console.log("  No infobox table found");
      }
    } catch (e) {
      console.error(e);
    }
  }
}

inspectFailed();
