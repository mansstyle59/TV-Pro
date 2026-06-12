import fetch from "node-fetch";

async function testChannels() {
  const response = await fetch("https://vavoo.to/channels", {
    headers: {
      "User-Agent": "VAVOO/2.6",
      "X-VAVOO-CLIENT": "2.6",
      "X-VAVOO-DEVICE": "berry",
      "Accept": "application/json"
    }
  });

  const channels = await response.json();
  const frChannels = channels.filter(c => c.country === "France");
  console.log(frChannels.slice(0, 5));
}

testChannels();
