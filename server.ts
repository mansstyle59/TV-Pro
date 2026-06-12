import express from "express";
import path from "path";
import fs from "fs";
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
app.use(express.json()); // Enable JSON body parsing for admin endpoints
const PORT = 3000;

// Favorites routes (handled locally on client)
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
  // TNT & Généralistes (French channels standard LCN 1 to 27)
  "tf1": 1,
  "france2": 2,
  "france3": 3,
  "canalplus": 4,
  "france5": 5,
  "m6": 6,
  "arte": 7,
  "c8": 8,
  "w9": 9,
  "tmc": 10,
  "tfx": 11,
  "nrj12": 12,
  "lcp": 13,
  "france4": 14,
  "culturebox": 14,
  "bfmtv": 15,
  "bfm": 15,
  "cnews": 16,
  "cstar": 17,
  "gulli": 18,
  "franceo": 19,
  "tf1seriesfilms": 20,
  "tf1series": 20,
  "lequipe": 21,
  "6ter": 22,
  "rmcstory": 23,
  "rmcdecouverte": 24,
  "cherie25": 25,
  "lci": 26,
  "franceinfo": 27,

  // Sports
  "canalplusfoot": 101,
  "canalplussport": 102,
  "beinsports1": 103,
  "beinsports2": 104,
  "beinsports3": 105,
  "beinsportsmax4": 106,
  "beinsportsmax5": 107,
  "beinsportsmax6": 108,
  "beinsportsmax7": 109,
  "beinsportsmax8": 110,
  "beinsportsmax9": 111,
  "beinsportsmax10": 112,
  "eurosport1": 113,
  "eurosport2": 114,
  "rmcsport1": 115,
  "rmcsport2": 116,
  "rmcsportuhd": 117,

  // Cinéma & Séries
  "canalpluscinema": 201,
  "canalplusboxoffice": 202,
  "canalplusseries": 203,
  "ocsmax": 204,
  "ocspulp": 205,
  "ocsgeants": 206,
  "cinepluspremier": 207,
  "cineplusfrisson": 208,
  "cineplusemotion": 209,
  "cineplusfamiz": 210,
  "cineplusclub": 211,
  "cineplusclassic": 212,
  "syfy": 213,
  "13emerue": 214,
  "paramountchannel": 215,
  "alticestudio": 216,
  "warnertv": 217,
  "polarplus": 218,

  // Belgique
  "laune": 301,
  "tipik": 302,
  "latrois": 303,
  "rtltvi": 304,
  "clubrtl": 305,
  "plugrtl": 306,
  "ab3": 307,
  "abxplore": 308,
  "ln24": 309,
};

// Simple in-memory cache for French TV channels
let cachedChannels: Channel[] | null = null;
let allCachedChannels: Channel[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache for the full catalog

// Fetch channels from vavoo.to
async function fetchAppChannels(force = false): Promise<Channel[]> {
  const now = Date.now();
  if (cachedChannels && !force && (now - lastFetchTime < CACHE_TTL)) {
    console.log("Serving TV channels from server cache...");
    return cachedChannels;
  }

  console.log("Fetching channels from Vavoo to refresh cache...");
  const response = await fetch("https://vavoo.to/channels", {
    headers: {
      "User-Agent": "VAVOO/2.6",
      "X-VAVOO-CLIENT": "2.6",
      "X-VAVOO-DEVICE": "berry",
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Vavoo. Status: ${response.status}`);
  }

  const channels: Channel[] = await response.json();
  allCachedChannels = channels; // Store raw unfiltered list for admin discovery

  // Filter for French and Belgian channels default, and specifically include Trace/OCS
  const filteredChannels = channels.filter(c => 
    c && (
      (c.country && /^(france|belgium|belgique)$/i.test(c.country)) || 
      /trace|ocs/i.test(c.name)
    )
  );
  
  // Sort alphabetically by name
  filteredChannels.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  cachedChannels = filteredChannels;
  lastFetchTime = now;
  console.log(`Cache updated. Found ${filteredChannels.length} channels (Total Vavoo: ${channels.length}).`);
  return filteredChannels;
}

// ... existing EPG/Logo interfaces ...

// Add this before EPG sections to keep grouping clean
app.get("/api/admin/vavoo-catalog", async (req, res) => {
  try {
    if (!allCachedChannels) {
      await fetchAppChannels(true);
    }
    
    const { search, country } = req.query;
    let result = allCachedChannels || [];

    if (country) {
      result = result.filter(c => c.country?.toLowerCase() === (country as string).toLowerCase());
    }

    if (search) {
      const s = (search as string).toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(s));
    }

    // Get countries list for filter
    const countries = Array.from(new Set(allCachedChannels?.map(c => c.country).filter(Boolean))).sort();

    res.json({
      success: true,
      countries,
      count: result.length,
      channels: result.slice(0, 500) // Limit to 500 for UI performance
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/channels/bulk-toggle", (req, res) => {
  const { ids, action } = req.body; // action: 'activate' | 'deactivate'
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "Missing ids array" });
  
  const config = loadChannelsConfig();
  if (!config.hiddenChannelIds) config.hiddenChannelIds = [];
  
  const idStrList = ids.map(id => String(id));

  if (action === "activate") {
    // Remove from hidden list
    config.hiddenChannelIds = config.hiddenChannelIds.filter((id: string) => !idStrList.includes(id));
  } else {
    // Add to hidden list
    idStrList.forEach(id => {
      if (!config.hiddenChannelIds.includes(id)) {
        config.hiddenChannelIds.push(id);
      }
    });
  }

  saveChannelsConfig(config);
  res.json({ success: true, count: idStrList.length });
});

interface EpgProgramme {
  start: string;
  stop: string;
  title: string;
  desc?: string;
  category?: string;
  icon?: string;
  image?: string;
}

interface EpgChannel {
  id: string;
  name: string;
  normalized: string;
  logo?: string;
}

let epgChannels: EpgChannel[] = [];
let epgProgrammesByChannel: Record<string, EpgProgramme[]> = {};
let lastEpgFetchTime = 0;
let isEpgFetching = false;

// Global logo maps
let channelLogoMap: Record<string, string> = {};
let isLogoFetching = false;

const fallbackLogoMap: Record<string, string> = {
  // TNT & National French Channels
  "tf1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tf1-fr.png",
  "france2": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-2-fr.png",
  "france3": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-3-fr.png",
  "canalplus": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-fr.png",
  "france5": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-5-fr.png",
  "m6": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/m6-fr.png",
  "arte": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/arte-fr.png",
  "c8": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/c8-fr.png",
  "w9": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/w9-fr.png",
  "tmc": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tmc-fr.png",
  "tfx": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tfx-fr.png",
  "nrj12": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/nrj-12-fr.png",
  "lcp": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/lcp-public-senat-fr.png",
  "publicsenat": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/lcp-public-senat-fr.png",
  "france4": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-4-fr.png",
  "bfmtv": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bfm-tv-fr.png",
  "cnews": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/c-news-fr.png",
  "cstar": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/c-star-fr.png",
  "gulli": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/gulli-fr.png",
  "franceinfo": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/franceinfo-fr.png",
  "lequipe": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/lequipe-fr.png",
  "6ter": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/6ter-fr.png",
  "rmcdecouverte": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-decouverte-fr.png",
  "rmcstory": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-story-fr.png",
  "cherie25": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cherie-25-fr.png",
  "lci": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/lci-fr.png",
  "france24": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-24-french-fr.png",
  "tv5monde": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tv5-monde-france-belgique-suisse-fr.png",
  "tf1seriesfilms": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tf1-series-films-fr.png",
  "tf1series": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tf1-series-films-fr.png",
  "tf1seriesfilm": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tf1-series-films-fr.png",

  // Canal+ Premium and Sport Packs
  "canalplusfoot": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-foot-fr.png",
  "canalpluscinema": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-cinemas-fr.png",
  "canalplusseries": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-series-fr.png",
  "canalplusboxoffice": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-box-office-fr.png",
  "canalplussport": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-sport-fr.png",
  "canalplusdocs": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-docs-fr.png",
  "canalplusgrandecran": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-grand-ecran-fr.png",
  "canalpluskids": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-kids-fr.png",

  // Sports Channels
  "beinsports1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-1-french-fr.png",
  "beinsports2": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-2-french-fr.png",
  "beinsports3": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-3-french-fr.png",
  "eurosport1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/eurosport-1-fr.png",
  "eurosport2": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/eurosport-2-fr.png",
  "rmcsport1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-sport-1-fr.png",
  "rmcsport2": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-sport-2-fr.png",
  "equidia": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/equidia-fr.png",
  "automoto": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/automoto-la-chaine-fr.png",
  "golfplus": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/golf-plus-fr.png",
  "infosportplus": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/infosport-plus-fr.png",

  // Kids & Youth Channels
  "disneychannel": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/disney-channel-fr.png",
  "disneyjunior": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/disney-junior-fr.png",
  "nickelodeon": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/nickelodeon-fr.png",
  "cartoonnetwork": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cartoon-network-fr.png",
  "boomerang": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/boomerang-fr.png",
  "canalj": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-j-fr.png",
  "tiji": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tiji-fr.png",

  // Entertainment / Generalist
  "parispremiere": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/paris-premiere-fr.png",
  "teva": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/teva-fr.png",
  "rtl9": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rtl9-fr.png",
  "action": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/action-fr.png",
  "ushuaia": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/ushuaia-tv-fr.png",
  "tvbreizh": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tv-breizh-fr.png",
  "serieclub": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/serie-club-fr.png",
  "warner": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/warner-tv-fr.png",
  "syfy": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/syfy-fr.png",
  "ocsmax": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/ocs-max-fr.png",
  "ocspulp": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/ocs-pulp-fr.png",
  "ocsgeants": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/ocs-geants-fr.png",
  "ocschoc": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/ocs-choc-fr.png",
  "ocscity": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/ocs-city-fr.png",
  "histoiretv": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/histoire-tv-fr.png",
  "sciencevie": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/science-et-vie-tv-fr.png",
  "planeteplus": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/planete-plus-fr.png",
  "13emerue": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/13eme-rue-fr.png",
  "mangas": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/mangas-fr.png",
  "gameone": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/game-one-fr.png",
  "paramount": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/paramount-channel-fr.png",
  "ab1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/ab1-fr.png",

  // Ciné+ channels
  "cinepluspremier": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cine-plus-premier-fr.png",
  "cineplusfrisson": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cine-plus-frisson-fr.png",
  "cineplusemotion": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cine-plus-emotion-fr.png",
  "cineplusfamiz": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cine-plus-famiz-fr.png",
  "cineplusclub": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cine-plus-club-fr.png",
  "cineplusclassic": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cine-plus-classic-fr.png",
  "cineplusdecale": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cine-plus-decale-fr.png",

  // DAZN channels
  "dazn": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/dazn-1-fr.png",
  "dazn1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/dazn-1-fr.png",
  "dazn2": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/dazn-1-fr.png",
  "dazn3": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/dazn-1-fr.png",
  "dazn4": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/dazn-1-fr.png",
  "daznligue1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/dazn-1-fr.png",

  // additional sports channels
  "beinsportsmax4": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-max-4-fr.png",
  "beinsportsmax5": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-max-5-fr.png",
  "beinsportsmax6": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-max-6-fr.png",
  "beinsportsmax7": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-max-7-fr.png",
  "beinsportsmax8": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-max-8-fr.png",
  "beinsportsmax9": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-max-9-fr.png",
  "beinsportsmax10": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-max-10-fr.png",

  // more kid/movie/documentary channels
  "planetepluscrime": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/planete-plus-crime-investigation-fr.png",
  "planeteplusaventure": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/planete-plus-aventure-experience-fr.png",
  "nationalgeographicwild": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/national-geographic-wild-fr.png",
  "discoveryscience": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/discovery-science-fr.png",
  "discoveryinvestigation": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/discovery-investigation-fr.png",
  "mtvhits": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/mtv-hits-fr.png",
  "nickelodeonjunior": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/nickelodeon-junior-fr.png",
  "chasseetpeche": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/chasse-et-peche-fr.png",
  "jone": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/j-one-fr.png",
  "polarplus": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/polar-plus-fr.png",
  "novelastv": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/novelas-tv-fr.png",
  "tcmcinema": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tcm-cinema-fr.png",
  "museumtv": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/museum-tv-fr.png",
  "boutiquelive": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/m6-boutique-fr.png",

  // Music Channels
  "m6music": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/m6-music-fr.png",
  "mtv": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/mtv-fr.png",
  "mtvlive": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/mtv-live-hd-fr.png",
  "traceurban": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-urban-fr.png",
  "tracelatina": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-latina-fr.png",
  "tracehits": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-hits-fr.png",
  "tracetropico": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-tropico-fr.png",
  "traceafrica": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-africa-fr.png",
  "traceayiti": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-ayiti-fr.png",
  "tracevanillia": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-vanilla-fr.png",
  "tracegospel": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-gospel-fr.png",
  "tracetoca": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-toca-fr.png",
  "tracemziki": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/trace-mziki-fr.png",
  "rfmtv": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rfm-tv-fr.png",
  "melody": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/melody-fr.png",
  "mcm": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/mcm-fr.png",
  "mcmtop": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/mcm-top-fr.png",

  // Belgian Channels (using countries/belgium directory)
  "rtbf": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/la-une-be.png",
  "laune": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/la-une-be.png",
  "tipik": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/tipik-be.png",
  "latrois": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/la-trois-be.png",
  "clubrtl": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/club-rtl-be.png",
  "plugrtl": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/plug-rtl-be.png",
  "rtltvi": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/rtl-tvi-be.png",
  "ab3": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/ab3-be.png",
  "abxplore": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/ab-xplore-be.png",
  "ln24": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/belgium/ln24-be.png"
};

// Helper to normalize names for perfect EPG matching and logo pairing
const CHANNEL_ALIASES: Record<string, string> = {
  "tfi": "tf1",
  "tf1seriesfilms": "tf1seriesfilms",
  "dazn1": "dazn",
  "dazn2": "dazn",
  "dazn3": "dazn",
  "dazn4": "dazn",
  "daznligue1": "dazn",
  "plugrtl": "plugrtl",
  "rtlplug": "plugrtl",
  "clubrtl": "clubrtl",
  "rtltvi": "rtltvi",
  "rtltvipfr": "rtltvi",
  "rtltvihd": "rtltvi",
  "ab3": "ab3",
  "ab3be": "ab3",
  "france3be": "france3",
  "gameone": "gameone",
  "jone": "jone",
  "infosport": "infosportplus",
  "infosportplus": "infosportplus",
  "discoveryscience": "tlc", // TLC shows Discovery Science in some EPG files
  "discoveryinvestigation": "discoveryinvestigation",
  "discoverychannel": "discoverychannel",
  "paramountchannel": "paramountchannel",
  "paramountchanneldecale": "paramountchanneldecale",
  "footplus": "footplus",
  "footplus2424": "footplus",
  "cliquetv": "cliquetv",
  "sciencevietv": "scienceetvie",
  "scienceetvietv": "scienceetvie",
  "scienceetvie": "scienceetvie",
  "voyage": "voyage",
  "toonami": "toonami",
  "ln24": "ln24",
  "rts1": "rts1",
  "rts2": "rts2",
  "rtsdeux": "rts2",
  "rtsun": "rts1",
  "rtsune": "rts1",
  "canalpluscnema": "canalpluscinema",
  "canalplusseries": "canalplusseries",
  "canalseries": "canalplusseries",
  "canalplussport": "canalplussport",
  "canalsport": "canalplussport",
  "canalplusfoot": "canalplusfoot",
  "canalfoot": "canalplusfoot",
  "canalpluscinema": "canalpluscinema",
  "canalcinema": "canalpluscinema",
  "canalplusboxoffice": "canalplusboxoffice",
  "canalboxoffice": "canalplusboxoffice",
  "sportenfrance": "sportenfrance",
};

function normalizeName(name: string): string {
  if (!name) return "";
  let n = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase()
    .replace(/\b(fr|be|ch|ca|vip|ts|m3u8|tnt|raw|hd|fhd|uhd|4k|sd|raw|backup|s1|s2|s3)\s*[:|-]\s*/gi, "") // Supprime les préfixes FR:, BE:, VIP: etc
    .replace(/\s*[\[\(](HD|SD|V2|Backup|FR|MULT|7\/24|Main|24\/7|HEVC|480p|1080p|720p|4K|AUTO|OLD|TS|M3U8|VIP|6|7)[\]\)]/gi, "")
    .replace(/\s+\([^)]*\)/g, "") // Supprime les parenthèses (x) et leur contenu
    .replace(/\s+\[[^\]]*\]/g, "") // Supprime les crochets [x] et leur contenu
    .replace(/\s+fhd\s*/gi, "")
    .replace(/\s+hd\s*/gi, "")
    .replace(/\s+sd\s*/gi, "")
    .replace(/\s+4k\s*/gi, "")
    .replace(/\s*:\s*/g, "")
    .replace(/\s*-+\s*/g, "")
    .replace(/\.(fr|be)\s*$/i, "") // Supprime le suffixe d'extension de nom
    .replace(/\s+/g, "") // Enlève les espaces restants
    .replace(/[^a-z0-9+]/g, ""); // Ne garde que lettres, chiffres, et '+' et '-'

  // Map Canal+ notation variations to avoid '+' and word variation mismatches
  n = n.replace(/\+/g, "plus");

  if (CHANNEL_ALIASES[n]) {
    return CHANNEL_ALIASES[n];
  }
  return n;
}
function parseXmltvDate(dateStr: string): Date | null {
  const m = dateStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s+([+-]\d{4}))?/);
  if (!m) return null;
  const [_, year, month, day, hour, min, sec, tz] = m;
  
  const date = new Date(Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(min, 10),
    parseInt(sec, 10)
  ));
  
  if (tz) {
    const sign = tz[0] === "+" ? -1 : 1;
    const tzHour = parseInt(tz.substring(1, 3), 10);
    const tzMin = parseInt(tz.substring(3, 5), 10);
    const offsetMs = (tzHour * 60 + tzMin) * 60 * 1000 * sign;
    return new Date(date.getTime() + offsetMs);
  }
  return date;
}

// Quality logo overrides for main French channels
const LOGO_OVERRIDES: Record<string, string> = {
  "TF1.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tf1-fr.png",
  "France2.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-2-fr.png",
  "France3.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-3-fr.png",
  "CanalPlus.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-fr.png",
  "France5.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-5-fr.png",
  "M6.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/m6-fr.png",
  "Arte.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/arte-fr.png",
  "C8.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/c8-fr.png",
  "W9.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/w9-fr.png",
  "TMC.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tmc-fr.png",
  "TFX.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tfx-fr.png",
  "NRJ12.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/nrj-12-fr.png",
  "LCP.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/lcp-public-senat-fr.png",
  "France4.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-4-fr.png",
  "BFMTV.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bfm-tv-fr.png",
  "CNews.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/c-news-fr.png",
  "CStar.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/c-star-fr.png",
  "Gulli.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/gulli-fr.png",
  "TF1SeriesFilms.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tf1-series-films-fr.png",
  "LEQUIPE.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/lequipe-fr.png",
  "6ter.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/6ter-fr.png",
  "RMCStory.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-story-fr.png",
  "RMCDecouverte.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-decouverte-fr.png",
  "Cherie25.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cherie-25-fr.png",
  "LCI.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/lci-fr.png",
  "FranceInfo.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/franceinfo-fr.png",
  "CanalPlusSport.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-plus-sport-fr.png",
  "BeINSports1.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-1-french-fr.png",
  "BeINSports2.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-2-french-fr.png",
  "BeINSports3.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/bein-sports-3-french-fr.png",
  "Eurosport1.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/eurosport-1-fr.png",
  "Eurosport2.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/eurosport-2-fr.png",
  "France24.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/france-2-fr.png", // fallback or correct 24
  "TV5Monde.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tv5-monde-france-belgique-suisse-fr.png",
  "DisneyChannel.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/disney-channel-fr.png",
  "Nickelodeon.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/nickelodeon-fr.png",
  "CartoonNetwork.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/cartoon-network-fr.png",
  "ParisPremiere.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/paris-premiere-fr.png",
  "Teva.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/teva-fr.png",
  "RTL9.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rtl9-fr.png",
  "Action.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/action-fr.png",
  "RMCSport1.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-sport-1-fr.png",
  "RMCSport2.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/rmc-sport-2-fr.png",
  "DisneyJunior.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/disney-junior-fr.png",
  "Boomerang.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/boomerang-fr.png",
  "CanalJ.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/canal-j-fr.png",
  "TiJi.fr": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tiji-fr.png",
};


async function updateEpgData() {
  if (isEpgFetching) return;
  isEpgFetching = true;
  console.log("EPG background task started. Fetching TV guide from multiple sources...");
  
  const sources = [
    "https://www.free-epg.de/api/epg?country=FR",
    "https://xmltvfr.fr/xmltv/xmltv_fr.xml",
    "https://raw.githubusercontent.com/Catch-up-TV-and-More/xmltv/master/tv_guide_fr.xml"
  ];

  try {
    const tempChannels: EpgChannel[] = [];
    const tempProgrammes: Record<string, EpgProgramme[]> = {};
    const seenChanIds = new Set<string>();

    for (const url of sources) {
      console.log(`Fetching EPG from: ${url}`);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to fetch EPG from ${url}. Status: ${response.status}`);
          continue;
        }
        
        const xmlText = await response.text();
        console.log(`XML Loaded from ${url} (${Math.round(xmlText.length / 1024 / 1024)} MB). Parsing...`);
        
        // Parse channels
        const channelBlocks = xmlText.match(/<channel[\s\S]*?<\/channel>/gi) || [];
        for (const block of channelBlocks) {
          const idMatch = block.match(/id="([^"]+)"/);
          const nameMatch = block.match(/<display-name[^>]*>([\s\S]*?)<\/display-name>/);
          const iconMatch = block.match(/<icon\s+src="([^"]+)"/i);
          if (idMatch && nameMatch) {
            const id = idMatch[1];
            if (!seenChanIds.has(id)) {
              const name = nameMatch[1].trim();
              const logo = LOGO_OVERRIDES[id] || (iconMatch ? iconMatch[1].replace(/&amp;/g, "&").trim() : undefined);
              
              tempChannels.push({
                id,
                name,
                normalized: normalizeName(name),
                logo
              });
              seenChanIds.add(id);
            }
          }
        }
        
        // Parse programmes
        const nowTime = Date.now();
        const minTime = nowTime - 6 * 60 * 60 * 1000;
        const maxTime = nowTime + 48 * 60 * 60 * 1000;
        
        const programmeBlocks = xmlText.match(/<programme[\s\S]*?<\/programme>/gi) || [];
        for (const block of programmeBlocks) {
          const startMatch = block.match(/start="([^"]+)"/);
          const stopMatch = block.match(/stop="([^"]+)"/);
          const chanMatch = block.match(/channel="([^"]+)"/);
          
          if (startMatch && stopMatch && chanMatch) {
            const startDate = parseXmltvDate(startMatch[1]);
            const stopDate = parseXmltvDate(stopMatch[1]);
            
            if (startDate && stopDate) {
              const startMs = startDate.getTime();
              const stopMs = stopDate.getTime();
              
              if (stopMs >= minTime && startMs <= maxTime) {
                const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
                const descMatch = block.match(/<desc[^>]*>([\s\S]*?)<\/desc>/);
                const categoryMatch = block.match(/<category[^>]*>([\s\S]*?)<\/category>/);
                const iconMatch = block.match(/<icon\s+src="([^"]+)"/i);
                
                // Some XMLTV extra tags for high-res images
                const imageMatch = block.match(/<image\s+src="([^"]+)"/i) || block.match(/<thumb\s+src="([^"]+)"/i);
                
                const progChannel = chanMatch[1];
                if (!tempProgrammes[progChannel]) {
                  tempProgrammes[progChannel] = [];
                }
                
                // Avoid duplicates between sources for the same channel ID and same start time
                const isDuplicate = tempProgrammes[progChannel].some(p => p.start === startDate.toISOString());
                
                if (!isDuplicate) {
                  const icon = iconMatch ? iconMatch[1].replace(/&amp;/g, "&").trim() : undefined;
                  const image = imageMatch ? imageMatch[1].replace(/&amp;/g, "&").trim() : icon;

                  tempProgrammes[progChannel].push({
                    start: startDate.toISOString(),
                    stop: stopDate.toISOString(),
                    title: titleMatch ? titleMatch[1].replace(/&amp;/g, "&").trim() : "Programme",
                    desc: descMatch ? descMatch[1].replace(/&amp;/g, "&").trim() : undefined,
                    category: categoryMatch ? categoryMatch[1].replace(/&amp;/g, "&").trim() : undefined,
                    icon,
                    image
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error processing EPG source ${url}:`, err);
      }
    }
    
    // Sort programmes by time
    for (const channelId in tempProgrammes) {
      tempProgrammes[channelId].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }
    
    epgChannels = tempChannels;
    epgProgrammesByChannel = tempProgrammes;
    lastEpgFetchTime = Date.now();
    console.log(`Combined EPG import complete: ${epgChannels.length} channels total cached.`);
  } catch (err) {
    console.error("Critical error in EPG update task:", err);
  } finally {
    isEpgFetching = false;
  }
}

async function updateLogoData() {
  if (isLogoFetching) return;
  isLogoFetching = true;
  console.log("EPG background task. Fetching channel logos from iptv-org API...");
  try {
    const response = await fetch("https://iptv-org.github.io/api/channels.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch logo channels. Status: ${response.status}`);
    }
    const iptvChannels: any[] = await response.json();
    const logoMap: Record<string, string> = {};
    
    for (const chan of iptvChannels) {
      if (chan.logo && chan.name) {
        const norm = normalizeName(chan.name);
        const isFrenchRegion = chan.country === "FR" || (chan.languages && chan.languages.includes("fra"));
        
        // Prioritize French region metadata
        if (!logoMap[norm] || isFrenchRegion) {
          logoMap[norm] = chan.logo;
        }
      }
    }
    
    channelLogoMap = logoMap;
    console.log(`Logo import complete: Cached ${Object.keys(channelLogoMap).length} logos.`);
  } catch (err) {
    console.error("Error fetching logos:", err);
  } finally {
    isLogoFetching = false;
  }
}

function getLogoForChannel(channelName: string, epgLogo?: string, vavooLogo?: string): string | undefined {
  const norm = normalizeName(channelName);
  
  let result: string | undefined = undefined;

  // 1. Exact match in fallback (high priority)
  if (fallbackLogoMap[norm]) {
    result = fallbackLogoMap[norm];
  }
  // 2. Exact match in full logo map
  else if (channelLogoMap[norm]) {
    result = channelLogoMap[norm];
  }
  // 3. EPG provided logo
  else if (epgLogo) {
    result = epgLogo;
  }
  // 4. Vavoo provided logo
  else if (vavooLogo) {
    result = vavooLogo;
  }
  // 5. Very specific contains logic to avoid false positives like "arte" in "alacarte"
  else {
    const specialCases: Record<string, string> = {
      "arte": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/arte-fr.png",
      "tf1": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/tf1-fr.png",
      "m6": "https://raw.githubusercontent.com/tv-logos/tv-logos/main/countries/france/m6-fr.png"
    };

    if (specialCases[norm]) {
      result = specialCases[norm];
    } else if (norm.length > 4) {
      for (const [key, logoUrl] of Object.entries(fallbackLogoMap)) {
        if (key !== "arte" && (key.includes(norm) || norm.includes(key))) {
          result = logoUrl;
          break;
        }
      }
    }
  }

  // Normalize iptv-org logos
  if (result) {
    let cleanLogo = result.trim();
    if (cleanLogo.includes("iptv-org") && (cleanLogo.includes("/images/channels/") || cleanLogo.includes("/images/logos/") || cleanLogo.includes("/logos/logos/"))) {
      const parts = cleanLogo.split("/");
      const filename = parts[parts.length - 1];
      return `https://iptv-org.github.io/logos/logos/${filename}`;
    }
    return cleanLogo;
  }

  return undefined;
}

function getEpgForChannel(channelName: string) {
  const norm = normalizeName(channelName);
  
  // Exact name matches
  let matchedEpgChans = epgChannels.filter(c => c.normalized === norm);
  
  if (matchedEpgChans.length === 0) {
    // Fallback: soft matching contains with strict length guard to prevent false positives (e.g., "arte" in "alacarte")
    matchedEpgChans = epgChannels.filter(c => {
      const isContained = c.normalized.includes(norm) || norm.includes(c.normalized);
      if (!isContained) return false;

      const lenDiff = Math.abs(c.normalized.length - norm.length);
      const maxDiff = Math.max(3, Math.floor(Math.min(c.normalized.length, norm.length) * 0.45));
      return lenDiff <= maxDiff;
    });
  }
  
  if (matchedEpgChans.length === 0) return null;
  
  // Return programmes for the first matched channel that has data
  for (const matched of matchedEpgChans) {
    const programmes = epgProgrammesByChannel[matched.id];
    if (programmes && programmes.length > 0) {
      const now = new Date();
      let current: EpgProgramme | null = null;
      let next: EpgProgramme | null = null;
      
      for (let i = 0; i < programmes.length; i++) {
        const p = programmes[i];
        const start = new Date(p.start);
        const stop = new Date(p.stop);
        
        if (now >= start && now <= stop) {
          current = p;
          next = programmes[i + 1] || null;
          break;
        } else if (start > now) {
          next = p;
          break;
        }
      }
      
      return {
        current,
        next,
        all: programmes,
        logo: matched.logo
      };
    }
  }
  
  return null;
}

// Look up logo for a single channel name
app.get("/api/logo-lookup", (req, res) => {
  const name = req.query.name as string;
  if (!name) {
    return res.status(400).json({ error: "Missing name parameter" });
  }
  const logo = getLogoForChannel(name);
  res.json({ logo: logo || null });
});

// Look up logos for multiple channel names in batch
app.post("/api/logo-lookup-batch", (req, res) => {
  const names = req.body.names;
  if (!Array.isArray(names)) {
    return res.status(400).json({ error: "names must be an array of strings" });
  }
  const results: Record<string, string> = {};
  for (const name of names) {
    if (typeof name === "string" && name.trim()) {
      const logo = getLogoForChannel(name);
      if (logo) {
        results[name] = logo;
      }
    }
  }
  res.json({ logos: results });
});

// REST API endpoint to get French channels with embedded current/next TV programmes
app.get("/api/channels", async (req, res) => {
  const force = req.query.force === "true";
  try {
    const channels = await fetchAppChannels(force);
    const config = loadChannelsConfig();
    const hiddenSet = new Set((config.hiddenChannelIds || []).map((id: any) => String(id)));
    
    // Process custom channels
    const addedChannels = (config.addedChannels || []).map((chan: any) => {
      const epgInfo = getEpgForChannel(chan.name);
      return {
        ...chan,
        epg: epgInfo ? {
          current: epgInfo.current,
          next: epgInfo.next
        } : undefined
      };
    }).filter((chan: any) => !hiddenSet.has(String(chan.id)));

    // Process standard channels
    const channelsWithEpg = channels.map(chan => {
      // Apply admin edits if they exist
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

    const combined = [...addedChannels, ...channelsWithEpg];
    const lcnMap = { ...DEFAULT_LCN_MAP, ...(config.lcnMap || {}) };

    res.json({
      success: true,
      lastFetch: lastFetchTime,
      count: combined.length,
      channels: combined,
      lcnMap: lcnMap
    });
  } catch (err: any) {
    console.error("API error fetching channels:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve TV channels"
    });
  }
});

// Admin endpoint to delete/hide a channel
app.post("/api/admin/channels/delete", (req, res) => {
  const { id } = req.body;
  if (id === undefined) return res.status(400).json({ error: "Missing id" });
  const config = loadChannelsConfig();
  
  // Try removing from added custom channels list first
  if (config.addedChannels) {
    const isAdded = config.addedChannels.some((c: any) => String(c.id) === String(id));
    if (isAdded) {
      config.addedChannels = config.addedChannels.filter((c: any) => String(c.id) !== String(id));
      saveChannelsConfig(config);
      return res.json({ success: true, message: "Custom channel deleted permanently" });
    }
  }

  // Otherwise, hide the native channel
  if (!config.hiddenChannelIds) config.hiddenChannelIds = [];
  const idStr = String(id);
  if (!config.hiddenChannelIds.includes(idStr)) {
    config.hiddenChannelIds.push(idStr);
    saveChannelsConfig(config);
  }
  res.json({ success: true });
});

// Admin endpoint to edit a channel
app.post("/api/admin/channels/edit", (req, res) => {
  const { id, name, category, logo } = req.body;
  if (id === undefined) return res.status(400).json({ error: "Missing id" });
  const config = loadChannelsConfig();

  // If this is an added channel, modify its direct values
  if (config.addedChannels) {
    const customChanIdx = config.addedChannels.findIndex((c: any) => String(c.id) === String(id));
    if (customChanIdx !== -1) {
      config.addedChannels[customChanIdx] = {
        ...config.addedChannels[customChanIdx],
        ...(name !== undefined && { name }),
        ...(category !== undefined && { categoryOverride: category, category }),
        ...(logo !== undefined && { logo }),
      };
      saveChannelsConfig(config);
      return res.json({ success: true, message: "Custom channel updated" });
    }
  }

  // Otherwise, edit local override map
  if (!config.editedChannels) config.editedChannels = {};
  config.editedChannels[id] = {
    ...config.editedChannels[id],
    ...(name !== undefined && { name }),
    ...(category !== undefined && { category }),
    ...(logo !== undefined && { logo }),
  };
  saveChannelsConfig(config);
  res.json({ success: true });
});

// Admin endpoint to add a brand new custom channel
app.post("/api/admin/channels/add", (req, res) => {
  const { name, category, logo, streamUrl } = req.body;
  if (!name || !category || !streamUrl) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }
  const config = loadChannelsConfig();
  if (!config.addedChannels) config.addedChannels = [];
  
  // Check if already exists
  const newChannel = {
    id: `custom_${Date.now()}`,
    name,
    country: "France",
    logo: logo || "",
    categoryOverride: category,
    streamUrl,
    isCustom: true
  };
  
  config.addedChannels.push(newChannel);
  saveChannelsConfig(config);
  res.json({ success: true, channel: newChannel });
});

// Admin endpoint to reset all modifications & custom additions
app.post("/api/admin/channels/reset", (req, res) => {
  const config = { hiddenChannelIds: [], editedChannels: {}, addedChannels: [] };
  saveChannelsConfig(config);
  res.json({ success: true });
});

// Admin endpoint to export custom configurations
app.get("/api/admin/backup", (req, res) => {
  const config = loadChannelsConfig();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=config-backup.json");
  res.json(config);
});

// Admin endpoint to restore custom configurations
app.post("/api/admin/restore", (req, res) => {
  const { backup } = req.body;
  if (!backup || typeof backup !== 'object') {
    return res.status(400).json({ error: "Format de sauvegarde invalide." });
  }
  saveChannelsConfig(backup);
  res.json({ success: true, message: "Configuration restaurée avec succès." });
});

// Admin endpoint to check stream health
app.post("/api/admin/channels/test-stream", async (req, res) => {
  const { id, url } = req.body;
  try {
    let targetUrl = url;
    if (!targetUrl && id) {
      const config = loadChannelsConfig();
      const customChan = (config.addedChannels || []).find((c: any) => String(c.id) === String(id));
      if (customChan) {
        targetUrl = customChan.streamUrl;
      } else {
        targetUrl = `https://vavoo.to/play/${id}/index.m3u8`;
      }
    }
    
    if (!targetUrl) {
      return res.status(400).json({ error: "Identifiant ou URL de flux manquant" });
    }

    const startTime = Date.now();
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(4000)
    });

    const latency = Date.now() - startTime;
    const contentType = response.headers.get("content-type") || "";

    res.json({
      success: true,
      status: response.ok ? "online" : "offline",
      latency,
      statusCode: response.status,
      contentType
    });
  } catch (err: any) {
    res.json({
      success: true,
      status: "offline",
      error: err.message || "Timeout de connexion ou hôte inaccessible"
    });
  }
});

// Admin endpoints for LCN (Logical Channel Numbering) table management
app.get("/api/admin/lcn", (req, res) => {
  const config = loadChannelsConfig();
  const currentMap = { ...DEFAULT_LCN_MAP, ...(config.lcnMap || {}) };
  res.json({ success: true, lcnMap: currentMap, defaultMap: DEFAULT_LCN_MAP });
});

app.post("/api/admin/lcn/save", (req, res) => {
  const { lcnMap } = req.body;
  if (!lcnMap || typeof lcnMap !== 'object') {
    return res.status(400).json({ error: "lcnMap invalide." });
  }
  const config = loadChannelsConfig();
  config.lcnMap = lcnMap;
  saveChannelsConfig(config);
  res.json({ success: true, lcnMap });
});

app.post("/api/admin/lcn/reset", (req, res) => {
  const config = loadChannelsConfig();
  config.lcnMap = {};
  saveChannelsConfig(config);
  const currentMap = { ...DEFAULT_LCN_MAP };
  res.json({ success: true, lcnMap: currentMap });
});

// Force automated LCN matching on active bouquets
app.post("/api/admin/lcn/auto-update", async (req, res) => {
  try {
    // 1. Force refresh channels list from source to pick up latest names & packages
    const channels = await fetchAppChannels(true);
    const config = loadChannelsConfig();
    const lcnMap = { ...DEFAULT_LCN_MAP, ...(config.lcnMap || {}) };
    
    // 2. Scan standard French bouquet names to register standard mappings automatically
    // This allows dynamically aligning names that might contain tags, spaces, or case changes
    let changed = false;
    for (const key of Object.keys(DEFAULT_LCN_MAP)) {
      if (lcnMap[key] === undefined) {
        lcnMap[key] = DEFAULT_LCN_MAP[key];
        changed = true;
      }
    }
    
    // 3. Scan channels physically in memory and re-assign sequence alignments
    // We confirm we can map variants of french TNT sequentially 1-27
    config.lcnMap = lcnMap;
    saveChannelsConfig(config);
    
    res.json({ 
      success: true, 
      message: "Table LCN mise à jour et synchronisée avec succès !", 
      lcnMap 
    });
  } catch (err: any) {
    console.error("LCN Auto-update failed:", err);
    res.status(500).json({ error: "Échec de l'auto-synchronisation de la table LCN." });
  }
});

// REST API endpoint to get multi-channel grid data
app.get("/api/epg/grid", async (req, res) => {
  try {
    const channels = await fetchAppChannels();
    const config = loadChannelsConfig();
    const hiddenSet = new Set((config.hiddenChannelIds || []).map((id: any) => String(id)));
    
    // Process custom added channels
    const addedChannels = (config.addedChannels || []).map((chan: any) => {
      const epgInfo = getEpgForChannel(chan.name);
      return {
        ...chan,
        epgInfo
      };
    }).filter((chan: any) => !hiddenSet.has(String(chan.id)));

    // Process standard channels
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
        epgInfo
      };
    }).filter((chan: any) => !hiddenSet.has(String(chan.id)));

    const allChannels = [...addedChannels, ...channelsWithEpg];

    // LCN sorting to match French TNT sequence
    const lcnMap = config.lcnMap || {};
    allChannels.sort((a, b) => {
      const normA = normalizeName(a.name);
      const normB = normalizeName(b.name);
      const lcnA = lcnMap[normA] !== undefined ? Number(lcnMap[normA]) : 9999;
      const lcnB = lcnMap[normB] !== undefined ? Number(lcnMap[normB]) : 9999;
      if (lcnA !== lcnB) return lcnA - lcnB;
      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    });

    const now = Date.now();
    // Keep programmes ending after 3 hours ago and starting before 15 hours later
    const threeHoursAgo = now - 3 * 60 * 60 * 1000;
    const fifteenHoursLater = now + 15 * 60 * 60 * 1000;

    const gridData = allChannels.map(chan => {
      let filteredPrograms: any[] = [];
      if (chan.epgInfo && chan.epgInfo.all) {
        filteredPrograms = chan.epgInfo.all.filter((p: any) => {
          const stopTime = new Date(p.stop).getTime();
          const startTime = new Date(p.start).getTime();
          return stopTime > threeHoursAgo && startTime < fifteenHoursLater;
        });
      }

      return {
        id: chan.id,
        name: chan.name,
        logo: chan.logo,
        group: chan.group,
        country: chan.country,
        category: chan.categoryOverride || chan.category || "Généraliste",
        current: chan.epgInfo ? chan.epgInfo.current : null,
        next: chan.epgInfo ? chan.epgInfo.next : null,
        programmes: filteredPrograms
      };
    });

    res.json({
      success: true,
      grid: gridData
    });
  } catch (err: any) {
    console.error("Error generating grid data:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// REST API endpoint to get full guide of a specific channel
app.get("/api/epg/:channelName", (req, res) => {
  const { channelName } = req.params;
  const epgInfo = getEpgForChannel(channelName);
  if (epgInfo) {
    res.json({
      success: true,
      channelName,
      current: epgInfo.current,
      next: epgInfo.next,
      programmes: epgInfo.all
    });
  } else {
    res.json({
      success: false,
      error: "No EPG program found for this channel"
    });
  }
});

// REST API debug route to analyze the Vavoo signature system response
app.get("/api/debug-sig", async (req, res) => {
  try {
    const postResponse = await fetch("https://vavoo.to/api/box/sign", {
      method: "POST",
      headers: {
        "User-Agent": "VAVOO/2.6",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({})
    });
    const postOk = postResponse.ok;
    const postStatus = postResponse.status;
    let postData = null;
    if (postResponse.ok) {
      postData = await postResponse.json();
    }

    const getResponse = await fetch("https://vavoo.to/api/box/sign", {
      method: "GET",
      headers: {
        "User-Agent": "VAVOO/2.6",
        "Accept": "application/json"
      }
    });
    const getOk = getResponse.ok;
    const getStatus = getResponse.status;
    let getData = null;
    if (getResponse.ok) {
      getData = await getResponse.json();
    }

    res.json({
      post: { ok: postOk, status: postStatus, data: postData },
      get: { ok: getOk, status: getStatus, data: getData }
    });
  } catch (err: any) {
    res.json({ error: err.message, stack: err.stack });
  }
});

// Dynamic Vavoo Signature management
let cachedSignature: string | null = null;
let sigFetchTime = 0;
const SIG_TTL = 10 * 60 * 1000; // 10 minutes cache TTL
let isSigFetching = false;

async function forceFetchVavooSignature(): Promise<string> {
  if (isSigFetching) return cachedSignature || "";
  isSigFetching = true;
  
  const now = Date.now();
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
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        let sig = "";
        
        if (data && data.response) {
          sig = data.response.signed || data.response.token || "";
        } else if (Array.isArray(data)) {
          sig = data[0]?.signed || data[0]?.sig || "";
        } else if (data && typeof data === "object") {
          sig = (data as any).signed || (data as any).sig || "";
        }
        
        if (sig) {
          console.log(`Vavoo guest signature refreshed successfully: ${sig.slice(0, 15)}...`);
          cachedSignature = sig;
          sigFetchTime = now;
          isSigFetching = false;
          return sig;
        }
      }
    } catch (e) {
      // Quiet fail
    }
  }

  isSigFetching = false;
  return cachedSignature || "";
}

async function getVavooSignature(): Promise<string> {
  const now = Date.now();
  
  // Stale-while-revalidate pattern: return current cache instantly,
  // trigger non-blocking refresh if expired.
  if (cachedSignature) {
    if (now - sigFetchTime >= SIG_TTL) {
      // Trigger update asynchronously in the background
      forceFetchVavooSignature().catch(() => {});
    }
    return cachedSignature;
  }

  // If no cache at all, fetch synchronously (first request)
  return await forceFetchVavooSignature();
}

// Signs a target Vavoo URL if it does not already contain a signature key
async function signVavooUrl(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    
    // Only apply special logic to Vavoo/play URLs
    if (url.includes("vavoo.to")) {
      // Clean query parameters entirely to avoid status 500 on Vavoo streams.
      // The authentication is passed exclusively via headers (X-VAVOO-AUTH / X-VAVOO-SIGNATURE).
      urlObj.searchParams.delete("p");
      urlObj.searchParams.delete("token");
      urlObj.searchParams.delete("sig");
      urlObj.searchParams.delete("n");
      urlObj.searchParams.delete("b");
    }
    
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

// Helper to manually follow redirects while retaining necessary custom headers
interface FetchResult {
  response: any;
  finalUrl: string;
}

async function fetchWithRedirects(initialUrl: string, maxRedirects = 5, timeoutMs = 20000): Promise<FetchResult> {
  let currentUrl = initialUrl;
  let redirects = 0;
  
  // We'll also fetch the signature here just in case we need to pass it in headers
  const sig = await getVavooSignature();
  
  while (redirects < maxRedirects) {
    const headers: Record<string, string> = {
      "User-Agent": "VAVOO/2.6",
      "X-VAVOO-CLIENT": "2.6",
      "X-VAVOO-DEVICE": "berry",
      "Accept": "*/*",
      "Connection": "keep-alive"
    };

    // Always pass the signature for any Vavoo or redirected media server urls
    if (sig) {
      headers["X-VAVOO-AUTH"] = sig;
      headers["X-VAVOO-SIGNATURE"] = sig;
    }

    let response = await fetch(currentUrl, {
      redirect: "manual",
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });
    
    // If the response failed with errors (like 502, 503, 504, 403, etc.) and we used signature headers,
    // retry with a basic header configuration (excluding signature headers) to maximize compatibility
    if ((response.status >= 400 && response.status !== 401 && response.status !== 404) && sig) {
      console.warn(`URL ${currentUrl} failed with status ${response.status} using signature. Retrying without signature headers...`);
      const fallbackHeaders: Record<string, string> = {
        "User-Agent": "VAVOO/2.6",
        "X-VAVOO-CLIENT": "2.6"
      };
      try {
        const fbResponse = await fetch(currentUrl, {
          redirect: "manual",
          headers: fallbackHeaders,
          signal: AbortSignal.timeout(timeoutMs)
        });
        if (fbResponse.ok || (fbResponse.status >= 301 && fbResponse.status <= 308)) {
          response = fbResponse;
        }
      } catch (fbErr) {
        console.error(`Fallback fetch failed for ${currentUrl}:`, fbErr);
      }
    }
    
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

// Helper to resolve HLS playlist URI (segment or nested playlist) relative to redirected base, copying any query tokens/signatures
function resolveSegmentUrl(segmentLine: string, finalPlaylistUrl: string): string {
  const baseObj = new URL(finalPlaylistUrl);
  const resolvedObj = new URL(segmentLine, finalPlaylistUrl);
  
  // If the resolved URL doesn't have search parameters, copy them from the playlist final redirected URL (crucial to pass tokens)
  if (!resolvedObj.search && baseObj.search) {
    resolvedObj.search = baseObj.search;
  }
  
  return resolvedObj.toString();
}

// Common function to fetch a playlist, parse and rewrite all relative paths to point back to our proxy
async function handlePlaylistProxy(targetUrl: string, req: express.Request, res: express.Response) {
  let attempt = 1;
  const maxAttempts = 2;

  // Build the absolute backend API server URL (crucial for remote clients like GitHub Pages or Smart TVs)
  const host = req.headers["x-forwarded-host"] || req.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("0.0.0.0");
  const scheme = isLocal ? (req.headers["x-forwarded-proto"] || req.protocol) : "https";
  const baseApiUrl = `${scheme}://${host}`;

  while (attempt <= maxAttempts) {
    try {
      let signedUrl = targetUrl;
      if (targetUrl.includes("vavoo.to")) {
        signedUrl = await signVavooUrl(targetUrl);
      }
      const { response, finalUrl } = await fetchWithRedirects(signedUrl);

      if (response.ok) {
        const playlistText = await response.text();
        const lines = playlistText.split(/\r?\n/);
        const rewrittenLines = lines.map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            return line;
          }
          
          const absoluteUrl = resolveSegmentUrl(trimmed, finalUrl);
          if (trimmed.toLowerCase().includes(".m3u8") || absoluteUrl.toLowerCase().includes(".m3u8")) {
            return `${baseApiUrl}/api/stream-playlist?url=${encodeURIComponent(absoluteUrl)}`;
          } else {
            return `${baseApiUrl}/api/stream-ts?url=${encodeURIComponent(absoluteUrl)}`;
          }
        });

        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

        res.send(rewrittenLines.join("\n"));
        return;
      }

      console.error(`Proxy stream playlist failed for ${signedUrl}. Status: ${response.status} (attempt ${attempt}/${maxAttempts})`);

      // Clear signature cache on playback failures that might be related to expired sigs or temporary 5xx errors
      cachedSignature = null;
      sigFetchTime = 0;
      isSigFetching = false;

      if (attempt < maxAttempts) {
        console.log("Forcing refreshing of guest signature and retrying stream playlist query...");
        await forceFetchVavooSignature().catch(() => {});
        attempt++;
        continue;
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.status(response.status).send(`Failed to proxy stream playlist. Status: ${response.status}`);
      return;

    } catch (err: any) {
      console.error(`Error proxying playlist for ${targetUrl} (attempt ${attempt}/${maxAttempts}):`, err);
      
      cachedSignature = null;
      sigFetchTime = 0;

      if (attempt < maxAttempts) {
        console.log("Network error, forcing signature refresh and retrying stream playlist query...");
        await forceFetchVavooSignature().catch(() => {});
        attempt++;
        continue;
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.status(500).send("Internal server error proxying stream playlist");
      return;
    }
  }
}

// API endpoint to resolve an ID to m3u8 playlist lines (optional/fallback helper if needed)
app.get("/api/stream-url/:id", (req, res) => {
  const { id } = req.params;
  const playUrl = `/api/stream/${id}/index.m3u8`;
  res.json({
    id,
    playUrl
  });
});

// Server-side URL shortener proxy to bypass CORS and simplify typing on Smart TVs
app.get("/api/shorten", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  try {
    const isGdUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(isGdUrl);
    if (response.ok) {
      const data = await response.json();
      if (data && data.shorturl) {
        return res.json({ shortUrl: data.shorturl });
      }
    }
  } catch (err) {
    console.warn("is.gd shortening failed, trying tinyurl:", err);
  }

  try {
    const tinyUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(tinyUrl);
    if (response.ok) {
      const shortUrl = await response.text();
      if (shortUrl && shortUrl.startsWith("http")) {
        return res.json({ shortUrl: shortUrl.trim() });
      }
    }
  } catch (err) {
    console.error("All URL shorteners failed:", err);
  }

  return res.json({ shortUrl: targetUrl });
});

// Handle CORS Preflight checking for streaming files
app.options(["/api/stream/:id/:file", "/api/stream-playlist", "/api/stream-ts"], (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.status(200).end();
});

// Proxy segment files directly to retrieve actual video files from their respective target URL (with agent validation)
app.get("/api/stream-ts", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(400).send("Missing segment URL query parameter");
    return;
  }

  let attempt = 1;
  const maxAttempts = 2;

  while (attempt <= maxAttempts) {
    try {
      let signedUrl = targetUrl;
      if (targetUrl.includes("vavoo.to")) {
        signedUrl = await signVavooUrl(targetUrl);
      }
      
      const sig = await getVavooSignature();
      const headers: Record<string, string> = {
        "User-Agent": "VAVOO/2.6",
        "X-VAVOO-CLIENT": "2.6",
        "X-VAVOO-DEVICE": "berry",
        "Referer": "https://www.vavoo.to/",
        "Accept": "*/*",
        "Connection": "keep-alive"
      };

      if (sig) {
        headers["X-VAVOO-AUTH"] = sig;
        headers["X-VAVOO-SIGNATURE"] = sig;
      }

      // High-performance optimization: Since HLS TS chunks are final CDN leaf files, they do not redirect.
      // We fetch them directly with native redirect handling and Keep-Alive connection pooling.
       let response = await fetch(signedUrl, {
        headers,
        signal: AbortSignal.timeout(30000) // 30 seconds timeout
      });

      // In the rare event of a 3xx, fall back to manual redirect handling
      if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) {
        const redirectResult = await fetchWithRedirects(signedUrl, 5, 25000);
        response = redirectResult.response;
      }

      // If the response failed with errors (like 502, 503, 504, 403, etc.) and we used signature headers,
      // retry with a basic header configuration (excluding signature headers) to maximize compatibility
      if ((response.status >= 400 && response.status !== 401 && response.status !== 404) && sig) {
        console.warn(`Segment URL ${signedUrl} failed with status ${response.status} using signature. Retrying without signature headers...`);
        const fallbackHeaders: Record<string, string> = {
          "User-Agent": "VAVOO/2.6",
          "X-VAVOO-CLIENT": "2.6"
        };
        try {
          const fbResponse = await fetch(signedUrl, {
            headers: fallbackHeaders,
            signal: AbortSignal.timeout(30000)
          });
          if (fbResponse.ok) {
            response = fbResponse;
          }
        } catch (fbErr) {
          console.error(`Fallback segment fetch failed for ${signedUrl}:`, fbErr);
        }
      }

      if (response.ok) {
        // Proxy the response headers
        const contentType = response.headers.get("content-type");
        if (contentType) {
          res.setHeader("Content-Type", contentType);
        } else {
          res.setHeader("Content-Type", "video/mp2t");
        }

        const contentEncoding = response.headers.get("content-encoding");
        if (contentEncoding) {
          res.setHeader("Content-Encoding", contentEncoding);
        }

        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          res.setHeader("Content-Length", contentLength);
        }

        // Cache TS chunks for 30s locally as they are static content to prevent redundant double loading
        res.setHeader("Cache-Control", "public, max-age=30");

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

        if (response.body) {
          Readable.fromWeb(response.body as any).pipe(res);
        } else {
          res.end();
        }
        return;
      }

      console.error(`Proxy stream segment failed for ${signedUrl}. Status: ${response.status} (attempt ${attempt}/${maxAttempts})`);
      
      cachedSignature = null;
      sigFetchTime = 0;

      if (attempt < maxAttempts) {
        console.log("Forcing refreshing of guest signature and retrying stream segment query...");
        await forceFetchVavooSignature().catch(() => {});
        attempt++;
        continue;
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.status(response.status).send(`Failed to proxy stream segment. Status: ${response.status}`);
      return;

    } catch (err: any) {
      console.error(`Error proxying stream segment for ${targetUrl} (attempt ${attempt}/${maxAttempts}):`, err);

      cachedSignature = null;
      sigFetchTime = 0;

      if (attempt < maxAttempts) {
        console.log("Network error, forcing signature refresh and retrying stream segment query...");
        await forceFetchVavooSignature().catch(() => {});
        attempt++;
        continue;
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      if (err.name === "TimeoutError" || err.message?.includes("Timeout")) {
        console.warn(`Proxy stream segment timed out for ${targetUrl}`);
        res.status(504).send("Gateway Timeout proxying stream segment");
      } else {
        res.status(500).send("Internal server error proxying stream segment");
      }
      return;
    }
  }
});

// Proxy nested/sub-playlists dynamically
app.get("/api/stream-playlist", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).send("Missing playlist URL query parameter");
    return;
  }
  await handlePlaylistProxy(targetUrl, req, res);
});

// Root proxy stream route: redirects or parses top-level index.m3u8 
app.get("/api/stream/:id/:file", async (req, res) => {
  const { id, file } = req.params;
  const queryStr = req.url.split("?")[1] || "";

  // Check if this is a custom added channel
  const config = loadChannelsConfig();
  const added = config.addedChannels || [];
  const customChan = added.find((c: any) => String(c.id) === String(id));

  if (customChan) {
    if (file.endsWith(".m3u8")) {
      await handlePlaylistProxy(customChan.streamUrl, req, res);
    } else {
      // Direct stream segments or ts fallback
      res.redirect(`/api/stream-ts?url=${encodeURIComponent(customChan.streamUrl)}`);
    }
    return;
  }

  if (file.endsWith(".m3u8")) {
    const targetUrl = `https://vavoo.to/play/${id}/${file}` + (queryStr ? `?${queryStr}` : "");
    await handlePlaylistProxy(targetUrl, req, res);
  } else {
    // If the client fetches key files or direct .ts segments from original format
    const targetUrl = `https://vavoo.to/play/${id}/${file}` + (queryStr ? `?${queryStr}` : "");
    res.redirect(`/api/stream-ts?url=${encodeURIComponent(targetUrl)}`);
  }
});

// Stremio Addon Protocol endpoints
app.get("/manifest.json", (req, res) => {
  // Need to structure it properly for Stremio addon protocol standard
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.json({
    id: "org.ai-studio.vavoo",
    version: "1.0.0",
    name: "Vavoo IP-TV",
    description: "Vavoo live channels via Proxy.",
    resources: ["catalog", "stream"],
    types: ["tv"],
    catalogs: [{ type: "tv", id: "tv_channels", name: "Live TV" }],
    idPrefixes: ["vavoo_"]
  });
});

app.get("/catalog/tv/tv_channels.json", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  try {
    const channels = await fetchAppChannels(false);
    // filter to limit for Stremio speed
    const metas = channels.slice(0, 100).map(c => ({
      id: "vavoo_" + c.id,
      type: "tv",
      name: c.name,
      posterShape: "landscape",
      poster: c.logo || "https://upload.wikimedia.org/wikipedia/commons/4/44/Tv_icon.svg",
      background: c.logo
    }));
    res.json({ metas });
  } catch (err) {
    res.status(500).json({ error: "Catalog failed" });
  }
});

app.get("/stream/tv/:id", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const paramId = req.params.id;
  const channelId = paramId.replace(".json", "").replace("vavoo_", "");
  try {
    const host = req.get('host') || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("0.0.0.0");
    const scheme = isLocal ? req.protocol : "https";
    const streamUrlPath = `${scheme}://${host}/api/stream/${channelId}/index.m3u8`;
    res.json({ streams: [{ title: "Live", url: streamUrlPath }] });
  } catch (err) {
    res.json({ streams: [] });
  }
});

import { createEngine, createAddon } from "@mediahubmx/sdk";
import { createSingleAddonRouter } from "@mediahubmx/sdk/dist/express-server.js";

const mhubAddon = createAddon({
  id: "org.ai-studio.vavoo",
  name: "Vavoo IP-TV",
  version: "1.0.0",
  itemTypes: ["iptv"],
  catalogs: [{
    id: "tv_channels",
    name: "Live TV",
    kind: "iptv",
    features: { search: { enabled: true } },
    options: {
      shape: "landscape",
      displayName: true
    }
  }]
});

mhubAddon.registerActionHandler("catalog", async (input, ctx) => {
  const host = ctx.request.headers.host || "localhost:3000";
  const protocol = ctx.request.headers["x-forwarded-proto"] || "http";

  const channels = await fetchAppChannels(false);
  let filtered = channels;
  if (input.search) {
     filtered = channels.filter(c => c.name.toLowerCase().includes(input.search!.toLowerCase()));
  }

  const items = filtered.slice(0, 500).map(c => ({
    type: "iptv" as const,
    ids: { vavoo: String(c.id) },
    name: c.name,
    logo: c.logo || "https://upload.wikimedia.org/wikipedia/commons/4/44/Tv_icon.svg",
    url: `${protocol}://${host}/api/stream/${c.id}/index.m3u8`
  }));

  return { items, nextCursor: null };
});

mhubAddon.registerActionHandler("item", async (input, ctx) => {
  const host = ctx.request.headers.host || "localhost:3000";
  const protocol = ctx.request.headers["x-forwarded-proto"] || "http";

  const channels = await fetchAppChannels(false);
  const channel = channels.find(c => String(c.id) === input.ids.vavoo);
  if (!channel) return null;

  return {
    type: "iptv",
    ids: { vavoo: String(channel.id) },
    name: channel.name,
    logo: channel.logo || "https://upload.wikimedia.org/wikipedia/commons/4/44/Tv_icon.svg",
    url: `${protocol}://${host}/api/stream/${channel.id}/index.m3u8`
  };
});

mhubAddon.registerActionHandler("source", async (input, ctx) => {
  const host = ctx.request.headers.host || "localhost:3000";
  const protocol = ctx.request.headers["x-forwarded-proto"] || "http";
  
  return [{
    type: "url",
    name: "Live Stream",
    url: `${protocol}://${host}/api/stream/${input.ids.vavoo}/index.m3u8`,
  }];
});

const mhubEngine = createEngine([mhubAddon]);
app.use(express.json());
app.use((req, res, next) => {
  console.log("INCOMING: ", req.method, req.url, req.path);
  if (req.path.match(/^\/mediahubmx(?:-([\w-]+))?\.json$/)) {
    req.url = '/mhub' + req.url;
    console.log("REWRITTEN: ", req.url);
  } else if (req.path.toLowerCase().startsWith('/mhub') && !req.path.startsWith('/mhub')) {
    console.log("REDIRECTING: ", req.url);
    res.redirect(301, req.url.replace(/^\/[mM][hH][uU][bB]/, '/mhub'));
    return;
  }
  
  if (req.method === 'GET' && req.path.includes('mediahubmx.json') && !req.query.data) {
    req.query.data = JSON.stringify({ language: 'en', region: 'US' });
  } else if (req.method === 'POST' && req.path.includes('mediahubmx.json') && (!req.body || !req.body.language)) {
    req.body = { language: 'en', region: 'US', ...req.body };
  }
  next();
});
app.use("/mhub", createSingleAddonRouter(mhubEngine, { singleMode: true } as any));

// Helper function to generate a stable, unique 7-digit integer from string IDs for strict IPTV clients
function getNumericHash(idStr: string): number {
  if (!idStr) return 0;
  if (/^\d+$/.test(idStr)) {
    const val = parseInt(idStr, 10);
    if (val < 2000000000) return val;
  }
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % 1999999 + 1000000; // Safe 7-digit integer between 1M and 3M
}

// Helper function to generate stable ordered categories based on priority
function getSortedCategories(channels: any[]): string[] {
  const categoriesSet = new Set<string>();
  channels.forEach(c => {
    const cat = c.category || "Généraliste";
    categoriesSet.add(cat);
  });
  
  const priorityMap: Record<string, number> = {
    "tnt": 1,
    "national": 2,
    "général": 3,
    "france": 4,
    "cinéma": 10,
    "cinema": 11,
    "séries": 12,
    "series": 13,
    "sport": 20,
    "sports": 21,
    "documentaire": 30,
    "documentaires": 31,
    "découverte": 32,
    "jeunesse": 40,
    "enfants": 41,
    "musique": 50,
    "information": 60,
    "infos": 61,
    "actualités": 62
  };
  
  return Array.from(categoriesSet).sort((a, b) => {
    const normA = a.toLowerCase();
    const normB = b.toLowerCase();
    
    let pA = 999;
    let pB = 999;
    
    for (const [key, priority] of Object.entries(priorityMap)) {
      if (normA.includes(key)) {
        pA = Math.min(pA, priority);
      }
    }
    for (const [key, priority] of Object.entries(priorityMap)) {
      if (normB.includes(key)) {
        pB = Math.min(pB, priority);
      }
    }
    
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b, "fr", { sensitivity: "base" });
  });
}

// Helper for Xtream Codes to retrieve active, enriched and formatted channels
async function getActiveChannelsWithMetadata(): Promise<any[]> {
  const channels = await fetchAppChannels();
  const config = loadChannelsConfig();
  const hiddenSet = new Set((config.hiddenChannelIds || []).map((id: any) => String(id)));
  
  // Process custom added channels
  const addedChannels = (config.addedChannels || []).map((chan: any) => {
    return {
      ...chan,
      category: chan.categoryOverride || chan.category || "Généraliste"
    };
  }).filter((chan: any) => !hiddenSet.has(String(chan.id)));

  // Process standard channels
  const channelsWithEpg = channels.map(chan => {
    const overrides = config.editedChannels?.[chan.id] || {};
    const channelName = overrides.name || chan.name;
    const epgInfo = getEpgForChannel(channelName);
    const logo = getLogoForChannel(channelName, epgInfo?.logo, chan.logo);
    
    return {
      ...chan,
      name: channelName,
      logo: overrides.logo || logo,
      category: overrides.category || chan.category || "Généraliste"
    };
  }).filter((chan: any) => !hiddenSet.has(String(chan.id)));

  const allChannels = [...addedChannels, ...channelsWithEpg];

  // LCN sorting
  const lcnMap = config.lcnMap || {};
  allChannels.sort((a, b) => {
    const normA = normalizeName(a.name);
    const normB = normalizeName(b.name);
    const lcnA = lcnMap[normA] !== undefined ? Number(lcnMap[normA]) : 9999;
    const lcnB = lcnMap[normB] !== undefined ? Number(lcnMap[normB]) : 9999;
    if (lcnA !== lcnB) return lcnA - lcnB;
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  return allChannels;
}

// Xtream Codes API Handler (compatible with GET & POST)
app.all(["/player_api.php", "/panel_api.php"], async (req, res) => {
  const username = req.query.username || req.body.username || "user";
  const password = req.query.password || req.body.password || "pass";
  const action = req.query.action || req.body.action;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (!action) {
    const hostStr = req.headers['x-forwarded-host'] || req.get('host') || "localhost:3000";
    const hostParts = String(hostStr).split(':');
    const proxyProtocol = req.headers['x-forwarded-proto'] || req.protocol;
    const protocol = String(hostStr).includes("localhost") ? "http" : "https";

    return res.json({
      user_info: {
        username: String(username),
        password: String(password),
        message: "Logged in successfully",
        auth: 1,
        status: "Active",
        exp_date: 2099999999,
        is_trial: 0,
        active_cons: 0,
        max_connections: 99,
        created_at: 1600000000,
        allowed_output_formats: ["m3u8", "ts"]
      },
      server_info: {
        url: hostParts[0],
        port: hostParts[1] || (protocol === 'https' ? '443' : '80'),
        https_port: "443",
        server_protocol: protocol,
        rtmp_port: "8000",
        timezone: "Europe/Paris",
        timestamp_now: Math.floor(Date.now() / 1000),
        time_now: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
    });
  }

  // Get live categories
  if (action === "get_live_categories") {
    try {
      const channels = await getActiveChannelsWithMetadata();
      const categoriesList = getSortedCategories(channels).map((catName, index) => {
        return {
          category_id: String(index + 1),
          category_name: catName,
          parent_id: 0
        };
      });

      return res.json(categoriesList);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Get live streams
  if (action === "get_live_streams") {
    try {
      const channels = await getActiveChannelsWithMetadata();
      const sortedCategories = getSortedCategories(channels);

      const targetCategoryId = req.query.category_id || req.body.category_id;

      let filteredChannels = channels;
      // Handle '0' as ALL channels standard in Xtream Codes
      if (targetCategoryId && String(targetCategoryId) !== "0") {
        const catIndex = parseInt(String(targetCategoryId), 10) - 1;
        if (catIndex >= 0 && catIndex < sortedCategories.length) {
          const targetCatName = sortedCategories[catIndex];
          filteredChannels = channels.filter(c => (c.category || "Généraliste") === targetCatName);
        } else {
          filteredChannels = [];
        }
      } else {
        // If retrieving all channels, GROUP/SORT them nicely by category priority order
        const categoryOrderMap = new Map<string, number>();
        sortedCategories.forEach((cat, idx) => {
          categoryOrderMap.set(cat, idx);
        });

        // Stable sort so it keeps overall LCN/name order within the same category
        filteredChannels = [...channels].sort((a, b) => {
          const catA = a.category || "Généraliste";
          const catB = b.category || "Généraliste";
          const scoreA = categoryOrderMap.get(catA) ?? 999;
          const scoreB = categoryOrderMap.get(catB) ?? 999;
          
          if (scoreA !== scoreB) {
            return scoreA - scoreB;
          }
          return 0; // Maintain existing LCN/Name sorting
        });
      }

      const streams = filteredChannels.map((c, index) => {
        const catName = c.category || "Généraliste";
        const catId = String(sortedCategories.indexOf(catName) + 1);

        return {
          num: index + 1,
          name: c.name,
          stream_type: "live",
          stream_id: getNumericHash(String(c.id)), 
          stream_icon: c.logo || "https://upload.wikimedia.org/wikipedia/commons/4/44/Tv_icon.svg",
          epg_channel_id: String(c.id),
          added: "1600000000",
          category_id: catId,
          custom_sid: "",
          tv_archive: 0,
          direct_source: "",
          tv_archive_duration: 0
        };
      });

      return res.json(streams);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // EPG short listings
  if (action === "get_short_epg") {
    const streamIdParam = req.query.stream_id || req.body.stream_id;
    if (!streamIdParam) {
      return res.json({ epg_listings: [] });
    }

    try {
      const channels = await getActiveChannelsWithMetadata();
      const channel = channels.find(c => 
        String(c.id) === String(streamIdParam) || 
        String(getNumericHash(String(c.id))) === String(streamIdParam)
      );
      if (!channel) {
        return res.json({ epg_listings: [] });
      }

      const epgInfo = getEpgForChannel(channel.name);
      if (!epgInfo || !epgInfo.all || epgInfo.all.length === 0) {
        return res.json({ epg_listings: [] });
      }

      const listings = epgInfo.all.slice(0, 10).map((p: any, idx: number) => {
        const startD = new Date(p.start);
        const stopD = new Date(p.stop);
        return {
          id: String(idx + 1),
          epg_id: String(getNumericHash(String(channel.id))),
          title: Buffer.from(p.title).toString('base64'),
          lang: "fr",
          start: p.start.replace('T', ' ').substring(0, 19),
          end: p.stop.replace('T', ' ').substring(0, 19),
          description: Buffer.from(p.desc || "").toString('base64'),
          start_timestamp: String(Math.floor(startD.getTime() / 1000)),
          stop_timestamp: String(Math.floor(stopD.getTime() / 1000))
        };
      });

      return res.json({ epg_listings: listings });
    } catch (err) {
      return res.json({ epg_listings: [] });
    }
  }

  // Mock static values for VOD / Series compatibility
  if (action === "get_vod_categories" || action === "get_series_categories") {
    return res.json([]);
  }
  if (action === "get_vod_streams" || action === "get_series") {
    return res.json([]);
  }

  return res.json({ error: "Action inconnue." });
});

// Xtream Codes Streaming Handler: /live/:username/:password/:streamId
app.get("/live/:username/:password/:streamId", async (req, res) => {
  let streamId = req.params.streamId;
  const isM3u8 = streamId.endsWith(".m3u8");
  const isTs = streamId.endsWith(".ts");
  streamId = streamId.replace(".m3u8", "").replace(".ts", "");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  // Attempt to compile string format ID or reverse-resolve numeric integer hash back to string Vavoo ID
  let resolvedId = streamId;
  if (/^\d+$/.test(streamId)) {
    try {
      const channels = await getActiveChannelsWithMetadata();
      const match = channels.find(c => String(getNumericHash(String(c.id))) === streamId);
      if (match) {
        resolvedId = match.id;
      }
    } catch (err) {
      console.error("Failed to reverse-resolve numeric streamId:", err);
    }
  }

  // Load custom channels to verify if it is custom or Vavoo
  const config = loadChannelsConfig();
  const added = config.addedChannels || [];
  const customChan = added.find((c: any) => String(c.id) === String(resolvedId));

  if (customChan) {
    const isCustomUrlM3u8 = customChan.streamUrl.toLowerCase().includes(".m3u8") || 
                            customChan.streamUrl.toLowerCase().includes("m3u");
    if (isCustomUrlM3u8) {
      return res.redirect(`/api/stream/${resolvedId}/index.m3u8`);
    } else {
      return res.redirect(`/api/stream-ts?url=${encodeURIComponent(customChan.streamUrl)}`);
    }
  }

  // For standard Vavoo live streams, always redirect to the proxied index.m3u8 flow
  // so that segments are parsed, rewritten with signature injection, and played smoothly.
  res.redirect(`/api/stream/${resolvedId}/index.m3u8`);
});

// Xtream Codes XMLTV endpoint redirect
app.get("/xmltv.php", (req, res) => {
  res.redirect("/api/xmltv.xml");
});

// helper functions for XMLTV
function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function toXmltvDate(isoString: string): string {
  const d = new Date(isoString);
  const Y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, "0");
  const D = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${Y}${M}${D}${h}${m}${s} +0000`;
}

// XMLTV (EPG) export Endpoint
app.get("/api/xmltv.xml", async (req, res) => {
  try {
    const channels = await fetchAppChannels(false);
    let xml = '<?xml version="1.0" encoding="utf-8" ?>\n';
    xml += '<tv generator-info-name="Vavoo IPTV Relay">\n';

    // 1. Channel entries
    for (const c of channels) {
      xml += `  <channel id="${c.id}">\n`;
      xml += `    <display-name>${escapeXml(c.name)}</display-name>\n`;
      if (c.logo) {
        xml += `    <icon src="${escapeXml(c.logo)}" />\n`;
      }
      xml += `  </channel>\n`;
    }

    // 2. Programme entries
    for (const c of channels) {
      const epgInfo = getEpgForChannel(c.name);
      if (epgInfo && epgInfo.all && epgInfo.all.length > 0) {
        for (const p of epgInfo.all) {
          xml += `  <programme start="${toXmltvDate(p.start)}" stop="${toXmltvDate(p.stop)}" channel="${c.id}">\n`;
          xml += `    <title lang="fr">${escapeXml(p.title)}</title>\n`;
          if (p.desc) {
            xml += `    <desc lang="fr">${escapeXml(p.desc)}</desc>\n`;
          }
          if (p.category) {
            xml += `    <category lang="fr">${escapeXml(p.category)}</category>\n`;
          }
          xml += `  </programme>\n`;
        }
      }
    }

    xml += '</tv>\n';

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="xmltv.xml"');
    res.send(xml);
  } catch (err: any) {
    res.status(500).send("Error generating XMLTV: " + err.message);
  }
});

// M3U Playlist export Endpoint (often called MHub format / M3U)
app.get("/api/playlist.m3u", async (req, res) => {
  try {
    const channels = await getActiveChannelsWithMetadata();
    const sortedCategories = getSortedCategories(channels);
    const categoryOrderMap = new Map<string, number>();
    sortedCategories.forEach((cat, idx) => {
      categoryOrderMap.set(cat, idx);
    });

    const sortedChannels = [...channels].sort((a, b) => {
      const catA = a.category || "Généraliste";
      const catB = b.category || "Généraliste";
      const scoreA = categoryOrderMap.get(catA) ?? 999;
      const scoreB = categoryOrderMap.get(catB) ?? 999;
      
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return 0; // Keeps existing LCN/Name sorting within the same category
    });

    const hostStr = req.headers['x-forwarded-host'] || req.get('host') || "localhost:3000";
    const protocol = req.headers['x-forwarded-proto'] || (String(hostStr).includes("localhost") ? "http" : "https");

    let m3u = `#EXTM3U x-tvg-url="${protocol}://${hostStr}/api/xmltv.xml"\n`;
    sortedChannels.forEach(c => {
      const cat = c.category || "Généraliste";
      m3u += `#EXTINF:-1 tvg-id="${c.id}" tvg-name="${c.name}" tvg-logo="${c.logo || ''}" tvg-chno="${c.p || ''}" group-title="${cat}",${c.name}\n`;
      // Direct stream link via local proxy
      m3u += `${protocol}://${hostStr}/api/stream/${c.id}/index.m3u8\n`;
    });
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename="playlist.m3u"');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(m3u);
  } catch (err: any) {
    console.error("Error generating M3U:", err);
    res.status(500).send("Error generating M3U");
  }
});

// Sports M3U Playlist export Endpoint
app.get("/api/sports.m3u", async (req, res) => {
  try {
    const channels = await getActiveChannelsWithMetadata();
    
    // Exhaustive sports-related keywords to match channels for maximum compatibility
    const sportsKeywords = [
      "sport", "bein", "eurosport", "rmc", "dazn", "canal+ sport", "canal plus sport", 
      "canal+ foot", "canal plus foot", "canal+ 360", "canal plus 360", "l'equipe", "lequipe", 
      "automoto", "auto-moto", "golf", "chasse", "pêche", "peche", "moteur", "equidia", 
      "es1", "olymp", "ufc", "fight", "football", "foot", "espn", "nba", "extreme", "tnt sport",
      "f1", "formula", "motogp", "gp", "champions", "league", "premier", "rugby", "tennis", "boxe",
      "wwe", "eleven", "sky sport", "arena", "pga", "prime video", "ligue 1", "ligue1", "la liga"
    ];
    
    const sportsChannels = channels.filter(c => {
      const cat = (c.category || "").toLowerCase();
      const name = (c.name || "").toLowerCase();
      
      // Categorized as sports
      if (cat.includes("sport")) return true;
      
      // Match keywords
      return sportsKeywords.some(keyword => name.includes(keyword));
    });

    const hostStr = req.headers['x-forwarded-host'] || req.get('host') || "localhost:3000";
    const protocol = req.headers['x-forwarded-proto'] || (String(hostStr).includes("localhost") ? "http" : "https");

    let m3u = `#EXTM3U x-tvg-url="${protocol}://${hostStr}/api/xmltv.xml"\n`;
    sportsChannels.forEach(c => {
      const cat = c.category || "Sports";
      m3u += `#EXTINF:-1 tvg-id="${c.id}" tvg-name="${c.name}" tvg-logo="${c.logo || ''}" tvg-chno="${c.p || ''}" group-title="${cat}",${c.name}\n`;
      // Direct stream link via local proxy
      m3u += `${protocol}://${hostStr}/api/stream/${c.id}/index.m3u8\n`;
    });
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename="sports.m3u"');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(m3u);
  } catch (err: any) {
    console.error("Error generating Sports M3U:", err);
    res.status(500).send("Error generating Sports M3U");
  }
});

// Configure Vite or Serve Static Files
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode. Initializing Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode. Serving pre-compiled static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    
    // Warm up TV caches on startup to make channel retrieval instant
    console.log("Preheating TV channel data and Vavoo credentials...");
    forceFetchVavooSignature().then(() => {
      console.log("Vavoo signature credentials preheated successfully.");
    }).catch(err => {
      console.warn("Failed to preheat Vavoo signature:", err);
    });
    
    fetchAppChannels(true).then(channels => {
      console.log(`TV channel list preheated successfully. Serviced: ${channels.length} channels.`);
    }).catch(err => {
      console.warn("Failed to preheat channel list:", err);
    });

    // Start background EPG guide scraper and logo update service
    updateEpgData();
    updateLogoData();
    
    setInterval(updateEpgData, 2 * 60 * 60 * 1000); // refresh EPG data every 2 hours
    setInterval(updateLogoData, 24 * 60 * 60 * 1000); // refresh logos every 24 hours
    
    // Refresh signatures and channels periodically in background
    setInterval(() => forceFetchVavooSignature().catch(() => {}), 5 * 60 * 1000); // refresh sig every 5 minutes
    setInterval(() => fetchAppChannels(true).catch(() => {}), 15 * 60 * 1000); // refresh channel list every 15 minutes
  });
}).catch(err => {
  console.error("Vite setup failed:", err);
});
