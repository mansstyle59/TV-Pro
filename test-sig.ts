import fetch from "node-fetch";

async function testStream() {
  const url = "https://vavoo.tv/api/box/guest";
  const payload = {
    platform: "Android",
    version: "2.6",
    service: "1.2.26",
    service_version: "1.2.26",
    branch: "master"
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": "VAVOO/2.6",
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-VAVOO-CLIENT": "2.6",
      "X-VAVOO-DEVICE": "berry",
      "Referer": "https://www.vavoo.to/"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  const sig = data.response.signed;
  
  const streamRes = await fetch("https://vavoo.to/play/1971169307/index.m3u8", {
    headers: {
      "User-Agent": "VAVOO/2.6",
      "X-VAVOO-AUTH": sig,
      "X-VAVOO-SIGNATURE": sig,
      "X-VAVOO-CLIENT": "2.6",
      "X-VAVOO-DEVICE": "berry",
      "Referer": "https://www.vavoo.to/",
      "Accept": "*/*",
      "Connection": "keep-alive"
    }
  });
  console.log("M3U8 status:", streamRes.status);
  console.log(await streamRes.text());
}

testStream();
