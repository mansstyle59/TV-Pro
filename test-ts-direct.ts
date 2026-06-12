import fetch from "node-fetch";

async function testTsDirect() {
  const rs = await fetch("http://localhost:3000/api/channels");
  const channels = await rs.json();
  const c = channels.channels.find((ch: any) => ch.name.includes("TF1"));
  if (!c) {
    console.log("no tf1");
    return;
  }
  const url = `http://localhost:3000/api/stream/${c.id}/index.m3u8`;
  console.log(`Fetching ${url}`);
  const rs2 = await fetch(url);
  const text = await rs2.text();
  const tsURLMatch = text.match(/http.*stream-ts\?url=([^\s]+)/);
  if (tsURLMatch) {
    const rawTS = decodeURIComponent(tsURLMatch[1]);
    console.log("Raw TS URL:", rawTS);

    console.log("Trying to fetch directly WITHOUT headers:");
    try {
      const db = await fetch(rawTS);
      console.log("Status without headers:", db.status);
    } catch(err) {
      console.log(err);
    }
  }
}

testTsDirect();
