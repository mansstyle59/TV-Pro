const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  const url = "https://xmltvfr.fr/xmltv/xmltv_fr.xml";
  console.log(`Downloading and analyzing channel blocks from ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Failed to fetch:", res.status);
      return;
    }
    const text = await res.text();
    const blocks = text.match(/<channel[\s\S]*?<\/channel>/gi) || [];
    console.log(`Total channel blocks found: ${blocks.length}`);

    const sample = [];
    for (const block of blocks) {
      const idMatch = block.match(/id="([^"]+)"/);
      const nameMatch = block.match(/<display-name[^>]*>([\s\S]*?)<\/display-name>/);
      if (idMatch && nameMatch) {
        sample.push({
          id: idMatch[1],
          name: nameMatch[1].trim()
        });
      }
    }

    console.log(`Parsed ${sample.length} channels.`);
    console.log("Some examples:");
    sample.slice(0, 30).forEach(c => {
      console.log(` - ID: "${c.id}" => Name: "${c.name}"`);
    });

    // Search for some missing ones
    const targets = ["game", "nrj", "discovery", "paramount", "rmc", "dazn", "infosport", "canal", "rtl", "rts", "plurial", "clique"];
    console.log("\nSearching for match keywords:");
    targets.forEach(t => {
      const found = sample.filter(c => c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t));
      console.log(`Keyword "${t}": found ${found.length} channels.`);
      found.slice(0, 5).forEach(f => {
        console.log(`   * ID: "${f.id}" => Name: "${f.name}"`);
      });
    });

  } catch (err) {
    console.error("Error analyzing:", err);
  }
}

run();
