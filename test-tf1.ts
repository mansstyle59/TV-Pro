import fetch from "node-fetch";

async function testFetchAll() {
  const rs = await fetch("http://localhost:3000/api/channels");
  const channels = await rs.json();
  console.log("Channels type:", typeof channels, Array.isArray(channels) ? channels.length : channels);
}

testFetchAll();
