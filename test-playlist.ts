import fetch from "node-fetch";

async function testFetch() {
  const url = "http://localhost:3000/api/stream/1765873640/index.m3u8";
  const start = Date.now();
  console.log(`Fetching ${url}`);
  const rs = await fetch(url);
  console.log(rs.status, rs.headers.get("content-type"));
  const text = await rs.text();
  console.log("Text length:", text.length);
  // Log first 10 lines
  const lines = text.split("\n");
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    console.log(lines[i]);
  }
}

testFetch();
