const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function run() {
  const innerUrl = "https://vavoo.to/play/2837052978/index.m3u8";
  console.log("=== STEP 1: Fetching original ===");
  const res1 = await fetch(innerUrl, {
    redirect: "manual",
    headers: {
      "User-Agent": "VAVOO/2.6",
      "X-VAVOO-CLIENT": "2.6"
    }
  });
  const location = res1.headers.get("location");
  console.log("Location:", location);

  if (!location) {
    console.log("No location redirected.");
    return;
  }

  // Header options to test
  const tests = [
    {
      name: "No headers",
      headers: {}
    },
    {
      name: "Only User-Agent Mozilla",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    },
    {
      name: "Mozilla User-Agent + Accept All",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    },
    {
      name: "Only Vavoo Client no User-Agent",
      headers: {
        "X-VAVOO-CLIENT": "2.6"
      }
    }
  ];

  for (const t of tests) {
    console.log(`\n=== STEP 2: Test with: ${t.name} ===`);
    try {
      const res = await fetch(location, { headers: t.headers });
      console.log("Status:", res.status);
      const text = await res.text();
      console.log("Body start:", text.slice(0, 200));
    } catch(err) {
      console.error("Error:", err.message);
    }
  }
}

run();
