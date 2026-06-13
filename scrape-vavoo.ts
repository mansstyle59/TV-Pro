import fetch from "node-fetch";

// Helper to manually follow redirects while retaining necessary custom headers
interface FetchResult {
  response: any;
  finalUrl: string;
}

async function getVavooSignature(): Promise<string> {
  const guestUrls = [
    "https://vavoo.tv/api/box/guest",
    "https://www.vavoo.tv/api/box/guest",
    "https://www.vavoo.to/api/box/guest"
  ];
  const payload = {
    platform: "Android",
    version: "2.6",
    service: "1.2.26",
    service_version: "1.2.26",
    branch: "master"
  };

  for (const url of guestUrls) {
    try {
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

      if (response.ok) {
        const data: any = await response.json();
        let sig = "";
        if (data && data.response) {
          sig = data.response.signed || data.response.token || "";
        } else if (Array.isArray(data)) {
          sig = data[0]?.signed || data[0]?.sig || "";
        } else if (data && typeof data === "object") {
          sig = data.signed || data.sig || "";
        }
        if (sig) return sig;
      }
    } catch (e) {}
  }
  return "";
}

async function fetchWithRedirects(initialUrl: string, sig: string, maxRedirects = 5): Promise<FetchResult> {
  let currentUrl = initialUrl;
  let redirects = 0;
  
  while (redirects < maxRedirects) {
    const headers: Record<string, string> = {
      "User-Agent": "VAVOO/2.6",
      "X-VAVOO-CLIENT": "2.6",
      "X-VAVOO-DEVICE": "berry",
      "Accept": "*/*",
      "Connection": "keep-alive"
    };

    if (sig && currentUrl.includes("vavoo.to")) {
      headers["Referer"] = "https://www.vavoo.to/";
      headers["X-VAVOO-AUTH"] = sig;
      headers["X-VAVOO-SIGNATURE"] = sig;
    }

    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers
    });
    
    if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) {
      const location = response.headers.get("location");
      if (!location) {
        return { response, finalUrl: currentUrl };
      }
      currentUrl = new URL(location, currentUrl).toString();
      redirects++;
    } else {
      return { response, finalUrl: currentUrl };
    }
  }
  throw new Error("Too many redirects");
}

async function runScrape() {
  console.log("Fetching channels list from vavoo.to/channels...");
  const channelsResponse = await fetch("https://vavoo.to/channels", {
    headers: {
      "User-Agent": "VAVOO/2.6",
      "X-VAVOO-CLIENT": "2.6",
      "X-VAVOO-DEVICE": "berry",
      "Accept": "application/json"
    }
  });

  if (!channelsResponse.ok) {
    console.error("Failed to fetch channels. Status:", channelsResponse.status);
    return;
  }

  const channels: any = await channelsResponse.json();
  const frChannels = channels.filter((c: any) => c.country === "France").slice(0, 10);
  
  console.log(`Found ${channels.length} total channels. Sampling ${frChannels.length} French channels for direct streaming URL resolution:`);
  console.log("=================================================");

  const sig = await getVavooSignature();
  console.log("Aquired signature token successfully:", sig ? `${sig.slice(0, 15)}...` : "None");
  console.log("=================================================");

  for (const ch of frChannels) {
    const playUrl = `https://vavoo.to/play/${ch.id}/index.m3u8`;
    try {
      const { response, finalUrl } = await fetchWithRedirects(playUrl, sig);
      if (response.ok) {
        console.log(`Channel: ${ch.name}`);
        console.log(`  - Direct Stream URL: ${finalUrl}`);
        console.log(`  - Status: ACTIVE [HTTP ${response.status}]`);
      } else {
        console.log(`Channel: ${ch.name}`);
        console.log(`  - Direct Stream URL: NOT FOUND`);
        console.log(`  - Status: FAILED [HTTP ${response.status}]`);
      }
    } catch (err: any) {
      console.log(`Channel: ${ch.name}`);
      console.log(`  - Direct Stream URL: NOT FOUND`);
      console.log(`  - Error: ${err.message}`);
    }
    console.log("-------------------------------------------------");
  }
}

runScrape();
