const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  console.log("=== Fetching Channels with active EPG states ===");
  try {
    const res = await fetch("http://localhost:3000/api/channels");
    if (!res.ok) {
      console.log(`API not available or status ${res.status}. Trying to fetch schema/EPG cache directly...`);
      return;
    }
    const data = await res.json();
    if (!data.success) {
      console.error("API returned failure:", data);
      return;
    }

    const chans = data.channels || [];
    console.log(`Total channels returned: ${chans.length}`);

    const mapped = chans.filter(c => c.epg && c.epg.current);
    const unmapped = chans.filter(c => !c.epg || !c.epg.current);

    console.log(`Mapped channels (${mapped.length}):`);
    mapped.slice(0, 10).forEach(c => {
      console.log(` - MATCHED: ${c.name} -> EPG Current: ${c.epg.current.title}`);
    });

    console.log(`\nUnmapped channels (${unmapped.length}):`);
    unmapped.forEach(c => {
      console.log(` - MISSING: ${c.name}`);
    });
  } catch(err) {
    console.error("Error connecting to local server:", err.message);
  }
}

run();
