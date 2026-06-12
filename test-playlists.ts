import fetch from "node-fetch";

async function testFetchAll() {
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
  console.log("M3u8 Status:", rs2.status);
  const text = await rs2.text();
  console.log(text.substring(0, 500));
}

testFetchAll();
