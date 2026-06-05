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
}

const app = express();
app.use(express.json()); // Enable JSON body parsing for admin endpoints
const PORT = 3000;

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

// Simple in-memory cache for French TV channels
let cachedChannels: Channel[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

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
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Vavoo. Status: ${response.status}`);
  }

  const channels: Channel[] = await response.json();
  // Filter for French and Belgian channels
  const filteredChannels = channels.filter(c => c && c.country && /^(france|belgium|belgique)$/i.test(c.country));
  
  // Sort alphabetically by name
  filteredChannels.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  cachedChannels = filteredChannels;
  lastFetchTime = now;
  console.log(`Cache updated. Found ${filteredChannels.length} channels.`);
  return filteredChannels;
}

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
  "tf1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-fr.png",
  "france2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-2-fr.png",
  "france3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-3-fr.png",
  "canalplus": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-fr.png",
  "france5": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-5-fr.png",
  "m6": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/m6-fr.png",
  "arte": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/arte-fr.png",
  "c8": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/c8-fr.png",
  "w9": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/w9-fr.png",
  "tmc": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tmc-fr.png",
  "tfx": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tfx-fr.png",
  "nrj12": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/nrj-12-fr.png",
  "lcp": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lcp-public-senat-fr.png",
  "publicsenat": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lcp-public-senat-fr.png",
  "france4": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-4-fr.png",
  "bfmtv": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bfm-tv-fr.png",
  "cnews": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/c-news-fr.png",
  "cstar": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/c-star-fr.png",
  "gulli": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/gulli-fr.png",
  "franceinfo": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/franceinfo-fr.png",
  "lequipe": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lequipe-fr.png",
  "6ter": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/6ter-fr.png",
  "rmcdecouverte": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-decouverte-fr.png",
  "rmcstory": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-story-fr.png",
  "cherie25": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/cherie-25-fr.png",
  "lci": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lci-fr.png",
  "france24": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-24-french-fr.png",
  "tv5monde": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tv5-monde-france-belgique-suisse-fr.png",
  "tf1seriesfilms": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-series-films-fr.png",
  "tf1series": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-series-films-fr.png",
  "tf1seriesfilm": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-series-films-fr.png",

  // Canal+ Premium and Sport Packs
  "canalplusfoot": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-foot-fr.png",
  "canalpluscinema": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-cinemas-fr.png",
  "canalplusseries": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-series-fr.png",
  "canalplusboxoffice": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-box-office-fr.png",
  "canalplussport": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-sport-fr.png",
  "canalplusdocs": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-docs-fr.png",
  "canalplusgrandecran": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-grand-ecran-fr.png",
  "canalpluskids": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-kids-fr.png",

  // Sports Channels
  "beinsports1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bein-sports-1-french-fr.png",
  "beinsports2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bein-sports-2-french-fr.png",
  "beinsports3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bein-sports-3-french-fr.png",
  "eurosport1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/eurosport-1-fr.png",
  "eurosport2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/eurosport-2-fr.png",
  "rmcsport1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-sport-1-fr.png",
  "rmcsport2": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-sport-2-fr.png",
  "equidia": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/equidia-fr.png",
  "automoto": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/automoto-la-chaine-fr.png",
  "golfplus": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/golf-plus-fr.png",
  "infosportplus": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/infosport-plus-fr.png",

  // Kids & Youth Channels
  "disneychannel": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/disney-channel-fr.png",
  "disneyjunior": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/disney-junior-fr.png",
  "nickelodeon": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/nickelodeon-fr.png",
  "cartoonnetwork": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/cartoon-network-fr.png",
  "boomerang": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/boomerang-fr.png",
  "canalj": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-j-fr.png",
  "tiji": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tiji-fr.png",

  // Entertainment / Generalist
  "parispremiere": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/paris-premiere-fr.png",
  "teva": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/teva-fr.png",
  "rtl9": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rtl9-fr.png",
  "action": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/action-fr.png",
  "ushuaia": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/ushuaia-tv-fr.png",
  "tvbreizh": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tv-breizh-fr.png",
  "serieclub": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/serie-club-fr.png",
  "warner": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/warner-tv-fr.png",
  "syfy": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/syfy-fr.png",
  "ocsmax": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/ocs-max-fr.png",
  "ocspulp": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/ocs-pulp-fr.png",
  "ocsgeants": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/ocs-geants-fr.png",
  "histoiretv": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/histoire-tv-fr.png",
  "sciencevie": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/science-et-vie-tv-fr.png",
  "planeteplus": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/planete-plus-fr.png",
  "13emerue": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/13eme-rue-fr.png",
  "mangas": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/mangas-fr.png",
  "gameone": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/game-one-fr.png",
  "paramount": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/paramount-channel-fr.png",
  "ab1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/ab1-fr.png",

  // Music Channels
  "m6music": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/m6-music-fr.png",
  "mtv": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/mtv-fr.png",
  "mtvlive": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/mtv-live-hd-fr.png",
  "traceurban": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/trace-urban-fr.png",
  "rfmtv": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rfm-tv-fr.png",
  "melody": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/melody-fr.png",
  "mcm": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/mcm-fr.png",
  "mcmtop": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/mcm-top-fr.png",

  // Belgian Channels (using countries/belgium directory)
  "rtbf": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/la-une-be.png",
  "laune": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/la-une-be.png",
  "tipik": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/tipik-be.png",
  "latrois": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/la-trois-be.png",
  "clubrtl": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/club-rtl-be.png",
  "plugrtl": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/plug-rtl-be.png",
  "rtltvi": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/rtl-tvi-be.png",
  "ab3": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/ab3-be.png",
  "abxplore": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/ab-xplore-be.png",
  "ln24": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/belgium/ln24-be.png"
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
  "TF1.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-fr.png",
  "France2.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-2-fr.png",
  "France3.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-3-fr.png",
  "CanalPlus.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-fr.png",
  "France5.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-5-fr.png",
  "M6.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/m6-fr.png",
  "Arte.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/arte-fr.png",
  "C8.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/c8-fr.png",
  "W9.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/w9-fr.png",
  "TMC.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tmc-fr.png",
  "TFX.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tfx-fr.png",
  "NRJ12.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/nrj-12-fr.png",
  "LCP.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lcp-public-senat-fr.png",
  "France4.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-4-fr.png",
  "BFMTV.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bfm-tv-fr.png",
  "CNews.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/c-news-fr.png",
  "CStar.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/c-star-fr.png",
  "Gulli.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/gulli-fr.png",
  "TF1SeriesFilms.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-series-films-fr.png",
  "LEQUIPE.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lequipe-fr.png",
  "6ter.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/6ter-fr.png",
  "RMCStory.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-story-fr.png",
  "RMCDecouverte.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-decouverte-fr.png",
  "Cherie25.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/cherie-25-fr.png",
  "LCI.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/lci-fr.png",
  "FranceInfo.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/franceinfo-fr.png",
  "CanalPlusSport.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-plus-sport-fr.png",
  "BeINSports1.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bein-sports-1-french-fr.png",
  "BeINSports2.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bein-sports-2-french-fr.png",
  "BeINSports3.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/bein-sports-3-french-fr.png",
  "Eurosport1.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/eurosport-1-fr.png",
  "Eurosport2.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/eurosport-2-fr.png",
  "France24.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/france-24-french-fr.png",
  "TV5Monde.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tv5-monde-france-belgique-suisse-fr.png",
  "DisneyChannel.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/disney-channel-fr.png",
  "Nickelodeon.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/nickelodeon-fr.png",
  "CartoonNetwork.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/cartoon-network-fr.png",
  "ParisPremiere.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/paris-premiere-fr.png",
  "Teva.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/teva-fr.png",
  "RTL9.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rtl9-fr.png",
  "Action.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/action-fr.png",
  "RMCSport1.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-sport-1-fr.png",
  "RMCSport2.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/rmc-sport-2-fr.png",
  "DisneyJunior.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/disney-junior-fr.png",
  "Boomerang.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/boomerang-fr.png",
  "CanalJ.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/canal-j-fr.png",
  "TiJi.fr": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tiji-fr.png",
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
  
  // 1. Exact match in fallback (high priority)
  if (fallbackLogoMap[norm]) {
    return fallbackLogoMap[norm];
  }

  // 2. Exact match in full logo map
  if (channelLogoMap[norm]) {
    return channelLogoMap[norm];
  }
  
  // 3. EPG provided logo
  if (epgLogo) {
    return epgLogo;
  }

  // 4. Vavoo provided logo
  if (vavooLogo) {
    return vavooLogo;
  }
  
  // 5. Very specific contains logic to avoid false positives like "arte" in "alacarte"
  const specialCases: Record<string, string> = {
    "arte": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/arte-fr.png",
    "tf1": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/tf1-fr.png",
    "m6": "https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/france/m6-fr.png"
  };

  if (specialCases[norm]) return specialCases[norm];

  // Only use fuzzy matching if the name is sufficiently long or not a special case
  if (norm.length > 4) {
    for (const [key, logoUrl] of Object.entries(fallbackLogoMap)) {
      if (key !== "arte" && (key.includes(norm) || norm.includes(key))) {
        return logoUrl;
      }
    }
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

    res.json({
      success: true,
      lastFetch: lastFetchTime,
      count: combined.length,
      channels: combined
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
    "https://www.vavoo.tv/api/box/guest",
    "https://vavoo.tv/api/box/guest"
  ];

  const payload = {
    platform: "Windows NT x86 32-bit",
    version: "2.2",
    service_version: "1.2.24",
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
          "X-VAVOO-CLIENT": "2.6"
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
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
  // Removing the 'p' parameter is required because Vavoo returns 500 on direct '/play/' containing 'p=1'
  if (url.includes("/play/")) {
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has("p")) {
        urlObj.searchParams.delete("p");
        return urlObj.toString();
      }
    } catch (e) {
      // Return original on URL parser failures
    }
  }
  return url;
}

// Helper to manually follow redirects while retaining necessary custom headers
interface FetchResult {
  response: any;
  finalUrl: string;
}

async function fetchWithRedirects(initialUrl: string, maxRedirects = 5, timeoutMs = 6000): Promise<FetchResult> {
  let currentUrl = initialUrl;
  let redirects = 0;
  
  while (redirects < maxRedirects) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: {
        "User-Agent": "VAVOO/2.6",
        "X-VAVOO-CLIENT": "2.6",
        "Accept": "*/*"
      },
      signal: AbortSignal.timeout(timeoutMs)
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
async function handlePlaylistProxy(targetUrl: string, res: express.Response) {
  try {
    let signedUrl = targetUrl;
    if (targetUrl.includes("vavoo.to")) {
      signedUrl = await signVavooUrl(targetUrl);
    }
    const { response, finalUrl } = await fetchWithRedirects(signedUrl);

    if (!response.ok) {
      console.error(`Proxy stream playlist failed for ${signedUrl}. Status: ${response.status}`);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.status(response.status).send(`Failed to proxy stream playlist. Status: ${response.status}`);
      return;
    }

    const playlistText = await response.text();

    const lines = playlistText.split(/\r?\n/);
    const rewrittenLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }
      
      const absoluteUrl = resolveSegmentUrl(trimmed, finalUrl);
      if (trimmed.toLowerCase().includes(".m3u8") || absoluteUrl.toLowerCase().includes(".m3u8")) {
        return `/api/stream-playlist?url=${encodeURIComponent(absoluteUrl)}`;
      } else {
        return `/api/stream-ts?url=${encodeURIComponent(absoluteUrl)}`;
      }
    });

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    res.send(rewrittenLines.join("\n"));
  } catch (err: any) {
    console.error(`Server error proxying playlist for ${targetUrl}:`, err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(500).send("Internal server error proxying stream playlist");
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

  try {
    let signedUrl = targetUrl;
    if (targetUrl.includes("vavoo.to")) {
      signedUrl = await signVavooUrl(targetUrl);
    }
    
    // High-performance optimization: Since HLS TS chunks are final CDN leaf files, they do not redirect.
    // We fetch them directly with native redirect handling and Keep-Alive connection pooling.
    let response = await fetch(signedUrl, {
      headers: {
        "User-Agent": "VAVOO/2.6",
        "X-VAVOO-CLIENT": "2.6",
        "Accept": "*/*"
      },
      signal: AbortSignal.timeout(8000) // 8 seconds timeout
    });

    // In the rare event of a 3xx, fall back to manual redirect handling
    if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307 || response.status === 308) {
      const redirectResult = await fetchWithRedirects(signedUrl, 5, 8000);
      response = redirectResult.response;
    }

    if (!response.ok) {
      console.error(`Proxy stream segment failed for ${signedUrl}. Status: ${response.status}`);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.status(response.status).send(`Failed to proxy stream segment. Status: ${response.status}`);
      return;
    }

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
  } catch (err: any) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (err.name === "TimeoutError" || err.message?.includes("Timeout")) {
      console.warn(`Proxy stream segment timed out for ${targetUrl}`);
      res.status(504).send("Gateway Timeout proxying stream segment");
    } else {
      console.error(`Server error proxying stream segment for ${targetUrl}:`, err);
      res.status(500).send("Internal server error proxying stream segment");
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
  await handlePlaylistProxy(targetUrl, res);
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
      await handlePlaylistProxy(customChan.streamUrl, res);
    } else {
      // Direct stream segments or ts fallback
      res.redirect(`/api/stream-ts?url=${encodeURIComponent(customChan.streamUrl)}`);
    }
    return;
  }

  if (file.endsWith(".m3u8")) {
    const targetUrl = `https://vavoo.to/play/${id}/${file}` + (queryStr ? `?${queryStr}` : "");
    await handlePlaylistProxy(targetUrl, res);
  } else {
    // If the client fetches key files or direct .ts segments from original format
    const targetUrl = `https://vavoo.to/play/${id}/${file}` + (queryStr ? `?${queryStr}` : "");
    res.redirect(`/api/stream-ts?url=${encodeURIComponent(targetUrl)}`);
  }
});

// Configure Vite or Serve Static Files
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode. Initializing Vite middleware...");
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
