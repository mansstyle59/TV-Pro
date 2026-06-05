const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  const sources = [
    "https://www.free-epg.de/api/epg?country=FR",
    "https://xmltvfr.fr/xmltv/xmltv_fr.xml",
    "https://raw.githubusercontent.com/Catch-up-TV-and-More/xmltv/master/tv_guide_fr.xml"
  ];

  console.log("=== Testing EPG Sources ===");
  for (const url of sources) {
    try {
      console.log(`\nFetching ${url}...`);
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    } catch(err) {
      console.error(`Error:`, err.message);
    }
  }
}

run();
