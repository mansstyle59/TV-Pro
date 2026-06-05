const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  const url = "https://xmltvfr.fr/xmltv/xmltv_fr.xml";
  console.log(`Downloading and analyzing XMLTV programmes from ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Failed to fetch:", res.status);
      return;
    }
    const text = await res.text();
    const blocks = text.match(/<channel[\s\S]*?<\/channel>/gi) || [];
    const progs = text.match(/<programme[\s\S]*?<\/programme>/gi) || [];
    console.log(`Parsed ${blocks.length} channels and ${progs.length} programmes.`);

    // Map channels
    const channels = {};
    for (const b of blocks) {
      const idMatch = b.match(/id="([^"]+)"/);
      const nameMatch = b.match(/<display-name[^>]*>([\s\S]*?)<\/display-name>/);
      if (idMatch && nameMatch) {
        channels[idMatch[1]] = nameMatch[1].trim();
      }
    }

    // Count programs per channel ID
    const counts = {};
    for (const p of progs) {
      const chanMatch = p.match(/channel="([^"]+)"/);
      if (chanMatch) {
        const id = chanMatch[1];
        counts[id] = (counts[id] || 0) + 1;
      }
    }

    console.log("\nProgram counts for some top channels:");
    Object.keys(counts).slice(0, 30).forEach(id => {
      console.log(` - ID: "${id}" (Name: "${channels[id] || 'Unknown'}") => ${counts[id]} programmes`);
    });

    console.log("\nSpecific lookups:");
    ["DAZN.fr", "NRJ12.fr", "TF1.fr", "M6.fr", "GameOne.fr", "DiscoveryChannel.fr", "DiscoveryScience.fr", "InfosportPlus.fr"].forEach(id => {
      console.log(` - ID: "${id}" (Name: "${channels[id] || 'Unknown'}") => ${counts[id] || 0} programmes`);
    });

  } catch(e) {
    console.error(e);
  }
}

run();
