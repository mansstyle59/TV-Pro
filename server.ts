import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Readable } from "stream";

interface Channel {
  country: string;
  id: number;
  name: string;
  p?: number;
  logo?: string;
  category?: string;
  categoryOverride?: string;
}

const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json());
const PORT = 3000;

// Favorites routes
app.get("/api/favorites/:userId", (req, res) => {
  res.json([]);
});
app.post("/api/favorites", (req, res) => {
  res.json({ success: true });
});
app.delete("/api/favorites/:userId/:channelId", (req, res) => {
  res.json({ success: true });
});

// Admin Channel overrides
const CHANNELS_CONFIG_PATH = path.join(process.cwd(), "channels-config.json");
function loadChannelsConfig() {
  try {
    if (fs.existsSync(CHANNELS_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CHANNELS_CONFIG_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("Error loading channels config", err);
  }
  return { hiddenChannelIds: [], editedChannels: {} };
}
function saveChannelsConfig(config: any) {
  try {
    fs.writeFileSync(CHANNELS_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving channels config", err);
  }
}

const DEFAULT_LCN_MAP: Record<string, number> = {
  "tf1": 1, "france2": 2, "france3": 3, "canalplus": 4, "france5": 5, "m6": 6, "arte": 7, "c8": 8, "w9": 9, "tmc": 10,
  "tfx": 11, "nrj12": 12, "lcp": 13, "france4": 14, "culturebox": 14, "bfmtv": 15, "bfm": 15, "cnews": 16, "cstar": 17,
  "gulli": 18, "franceo": 19, "tf1seriesfilms": 20, "tf1series": 20, "lequipe": 21, "6ter": 22, "rmcstory": 23,
  "rmcdecouverte": 24, "cherie25": 25, "lci": 26, "franceinfo": 27,
};

let cachedChannels: Channel[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ✅ FALLBACK CHANNELS si Vavoo ne répond pas
const FALLBACK_CHANNELS: Channel[] = [
  { country: "France", id: 1, name: "TF1", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-fr.png", category: "TNT" },
  { country: "France", id: 2, name: "France 2", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-2-fr.png", category: "TNT" },
  { country: "France", id: 3, name: "France 3", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-3-fr.png", category: "TNT" },
  { country: "France", id: 4, name: "Canal+", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-fr.png", category: "Premium" },
  { country: "France", id: 5, name: "France 5", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-5-fr.png", category: "TNT" },
  { country: "France", id: 6, name: "M6", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/m6-fr.png", category: "TNT" },
  { country: "France", id: 7, name: "Arte", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/arte-fr.png", category: "TNT" },
  { country: "France", id: 8, name: "C8", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/c8-fr.png", category: "TNT" },
  { country: "France", id: 15, name: "BFM TV", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bfm-tv-fr.png", category: "Info" },
  { country: "France", id: 26, name: "LCI", logo: "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lci-fr.png", category: "Info" },
];

async function fetchAppChannels(force = false): Promise<Channel[]> {
  const now = Date.now();
  if (cachedChannels && !force && (now - lastFetchTime < CACHE_TTL)) {
    console.log("✅ Serving TV channels from server cache...");
    return cachedChannels;
  }

  console.log("🔄 Fetching channels from Vavoo (avec fallback)...");
  
  const sources = [
    "https://vavoo.to/channels",
    "https://www.vavoo.to/channels",
    "https://vavoo.tv/channels"
  ];

  for (const url of sources) {
    try {
      console.log(`📡 Tentative: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-VAVOO-CLIENT": "2.6",
          "X-VAVOO-DEVICE": "berry",
          "Accept": "application/json"
        },
        signal: AbortSignal.timeout(8000) // 8 second timeout per source
      });

      if (response.ok) {
        const channels: Channel[] = await response.json();
        if (Array.isArray(channels) && channels.length > 0) {
          console.log(`✅ Succès! ${channels.length} chaînes chargées depuis ${url}`);
          cachedChannels = channels;
          lastFetchTime = now;
          return channels;
        }
      } else {
        console.warn(`⚠️ ${url} - Status: ${response.status}`);
      }
    } catch (err) {
      console.warn(`❌ Erreur ${url}:`, (err as any).message);
    }
  }

  // ✅ FALLBACK: Utiliser les chaînes par défaut
  console.log("⚠️ Vavoo indisponible - Utilisation des chaînes de secours");
  cachedChannels = FALLBACK_CHANNELS;
  lastFetchTime = now;
  return FALLBACK_CHANNELS;
}

// Placeholder pour EPG et Logos (à implémenter si nécessaire)
let epgChannels: any[] = [];
let epgProgrammesByChannel: Record<string, any[]> = {};
let channelLogoMap: Record<string, string> = {};

function getEpgForChannel(channelName: string) {
  return null;
}

function getLogoForChannel(channelName: string, epgLogo?: string, vavooLogo?: string): string | undefined {
  return vavooLogo || epgLogo;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ✅ API Endpoint principal
app.get("/api/channels", async (req, res) => {
  const force = req.query.force === "true";
  try {
    const channels = await fetchAppChannels(force);
    const config = loadChannelsConfig();
    const hiddenSet = new Set((config.hiddenChannelIds || []).map((id: any) => String(id)));
    
    const channelsWithEpg = channels.map(chan => {
      const overrides = config.editedChannels?.[chan.id] || {};
      const channelName = overrides.name || chan.name;
      const epgInfo = getEpgForChannel(channelName);
      const logo = getLogoForChannel(channelName, epgInfo?.logo, chan.logo);
      
      return {
        ...chan,
        name: channelName,
        logo: overrides.logo || logo,
        categoryOverride: overrides.category,
        epg: epgInfo ? {
          current: epgInfo.current,
          next: epgInfo.next
        } : undefined
      };
    }).filter(chan => !hiddenSet.has(String(chan.id)));

    res.json({
      success: true,
      lastFetch: lastFetchTime,
      count: channelsWithEpg.length,
      channels: channelsWithEpg,
      lcnMap: DEFAULT_LCN_MAP,
      note: cachedChannels === FALLBACK_CHANNELS ? "Utilisation des chaînes de secours - Vavoo indisponible" : "Données live depuis Vavoo"
    });
  } catch (err: any) {
    console.error("❌ API error:", err);
    res.status(500).json({
      success: false,
      error: "Erreur serveur - veuillez réessayer"
    });
  }
});

// Stubs pour les autres endpoints
app.post("/api/admin/channels/delete", (req, res) => {
  res.json({ success: true });
});

app.post("/api/admin/channels/edit", (req, res) => {
  res.json({ success: true });
});

app.post("/api/admin/channels/add", (req, res) => {
  res.json({ success: true, channel: {} });
});

app.post("/api/admin/channels/reset", (req, res) => {
  res.json({ success: true });
});

app.get("/api/admin/backup", (req, res) => {
  res.json({});
});

app.post("/api/admin/restore", (req, res) => {
  res.json({ success: true });
});

app.post("/api/admin/channels/test-stream", async (req, res) => {
  res.json({ success: true, status: "online", latency: 100 });
});

app.get("/api/epg/grid", (req, res) => {
  res.json({ success: true, grid: [] });
});

app.get("/api/epg/:channelName", (req, res) => {
  res.json({ success: false, error: "EPG non disponible" });
});

// Stream proxies
app.get("/api/stream/:id/index.m3u8", (req, res) => {
  const { id } = req.params;
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.send(`#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\n/api/stream-ts?url=https://example.com/${id}.ts\n#EXT-X-ENDLIST`);
});

app.get("/api/stream-ts", async (req, res) => {
  res.status(503).send("Streaming non disponible - Vavoo indisponible");
});

// Vite/Static files
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Development mode - Initializing Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Production mode - Serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n✅ Serveur démarré sur http://localhost:${PORT}\n`);
    
    // Preload channels
    console.log("⚙️ Préchargement des chaînes TV...");
    fetchAppChannels(true).then(channels => {
      console.log(`✅ ${channels.length} chaînes préchargées\n`);
    }).catch(err => {
      console.warn("⚠️ Erreur préchargement:", err);
    });
  });
}).catch(err => {
  console.error("❌ Vite setup failed:", err);
});
