import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  RefreshCw, 
  Tv, 
  Heart, 
  Settings, 
  X, Layers, 
  FileDown, 
  Radio, 
  Sliders, 
  Sparkles, 
  Plug,
  ExternalLink,
  ChevronRight,
  Zap,
  Info,
  Clock,
  Play,
  List,
  LayoutGrid
} from "lucide-react";
import { Channel } from "./types";
import { HlsPlayer } from "./components/HlsPlayer";
import { ChannelLogo } from "./components/ChannelLogo";
import { ChannelEditorModal } from "./components/ChannelEditorModal";
import { ExtendedEpgPanel } from "./components/ExtendedEpgPanel";
import { getApiUrl, getAppBaseUrl, isGitHubPages } from "./utils/urlHelper";
import { getCustomLogos, saveCustomLogo, normalizeName, fallbackLogoMap } from "./utils/logoHelper";
import { FALLBACK_CHANNELS, getFallbackLcnMap } from "./utils/fallbackChannels";
import { getFallbackEpgCurrentAndNext } from "./utils/fallbackEpg";
import { getCustomNames, saveCustomName } from './utils/logoHelper';
import { 
  getSavedXtreamCredentials, 
  saveXtreamCredentials, 
  setXtreamEnabled, 
  fetchXtreamCategoriesList, 
  fetchXtreamChannelsByCategory, 
  XtreamCategory,
  authenticateXtream
} from "./utils/xtreamClient";

// Helper hook for long press
function useLongPress(callback: (e: any) => void, ms: number = 600) {
  const timerRef = useRef<any>(null);

  const start = (e: any) => {
    timerRef.current = setTimeout(() => {
      callback(e);
    }, ms);
  };

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onContextMenu: (e: any) => {
      e.preventDefault();
      callback(e);
    }
  };
}

interface DisplayChannel extends Channel {
  category: string;
  serverCount: number;
  core: string;
  qualityLabel?: string;
  rawName?: string;
}

// LCN ordering priorities map
let LCN_MAP: Record<string, number> = {
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
  "cnews": 16,
  "cstar": 17,
  "gulli": 18,
  "franceo": 19,
  "tf1seriesfilms": 20,
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
};

// Programmatic core identifier mapping for alternate sources
function getCoreName(name: string): string {
  let n = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fr|be|ch|ca|vip|ts|m3u8|tnt|raw|hd|fhd|uhd|4k|sd|raw|backup|s1|s2|s3)\s*[:|-]\s*/gi, "")
    .replace(/\s*[\[\(](HD|SD|V2|Backup|FR|MULT|7\/24|Main|24\/7|HEVC|480p|1080p|720p|4K|AUTO|OLD|TS|M3U8|VIP|6|7)[\]\)]/gi, "")
    .replace(/\s+\([^)]*\)/g, "")
    .replace(/\s+\[[^\]]*\]/g, "")
    .replace(/\s+fhd\s*/gi, "")
    .replace(/\s+hd\s*/gi, "")
    .replace(/\s+sd\s*/gi, "")
    .replace(/\s+4k\s*/gi, "")
    .replace(/\s*:\s*/g, "")
    .replace(/\s*-+\s*/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9+]/g, "");

  if (n === "chaine28" || n === "oftv" || n === "28" || n === "chaine28hd") return "c8";
  if (n === "france2hd") return "france2";
  if (n === "france3hd") return "france3";
  if (n === "france4hd") return "france4";
  if (n === "france5hd") return "france5";
  if (n === "m6hd") return "m6";
  if (n === "w9hd") return "w9";
  if (n === "tf1hd") return "tf1";
  if (n === "tmchd") return "tmc";
  if (n === "tfxhd") return "tfx";
  if (n === "gullihd") return "gulli";
  if (n === "nrj12hd") return "nrj12";
  if (n === "bfmtvhd") return "bfmtv";
  if (n === "cnewshd") return "cnews";
  if (n === "cstarhd") return "cstar";
  if (n === "lequipehd" || n === "lequipe21") return "lequipe";
  if (n === "6terhd") return "6ter";
  if (n === "rmcdecouvertehd") return "rmcdecouverte";
  if (n === "rmcstoryhd") return "rmcstory";
  if (n === "cherie25hd") return "cherie25";
  if (n === "franceinfohd") return "franceinfo";
  if (n === "lcihd") return "lci";
  if (n === "tf1seriesfilmshd") return "tf1seriesfilms";
  if (n === "parispremierehd") return "parispremiere";
  if (n === "tevahd") return "teva";
  if (n === "rtl9hd") return "rtl9";
  if (n === "beinsports1hd") return "beinsports1";
  if (n === "beinsports2hd") return "beinsports2";
  if (n === "beinsports3hd") return "beinsports3";
  if (n === "eurosport1hd") return "eurosport1";
  if (n === "eurosport2hd") return "eurosport2";
  if (n === "rmcsport1hd") return "rmcsport1";
  if (n === "rmcsport2hd") return "rmcsport2";
  if (n === "canal+sport" || n === "canalsport") return "canalplussport";
  if (n === "canal+foot" || n === "canalfoot") return "canalplusfoot";
  if (n === "canal+cinema" || n === "canalcinema") return "canalpluscinema";
  if (n === "canal+series" || n === "canalseries") return "canalplusseries";
  if (n === "canal+boxoffice" || n === "canalboxoffice") return "canalplusboxoffice";
  if (n === "canal+docs" || n === "canaldocs") return "canalplusdocs";
  if (n === "canal+grandecran" || n === "canalgrandecran") return "canalplusgrandecran";
  if (n === "launehd") return "laune";
  if (n === "tipikhd") return "tipik";
  if (n === "latroishd") return "latrois";
  if (n === "rtltvihd") return "rtltvi";
  if (n === "clubrtlhd") return "clubrtl";
  if (n === "plugrtlhd") return "plugrtl";
  if (n === "canalplus" || n === "canal+") return "canalplus";

  return n;
}

// Clean channel titles for slick aesthetic
function cleanName(name: string): string {
  let cleaned = name
    .replace(/^(FR|BE|CH|LU|CA|VIP|OPT|HEVC|4K|FHD|HD|SD|LOW|M|S1|S2|S3|TV|WEB|IPTV)\s*[:|-]\s*/gi, "")
    .replace(/^(FR|BE|CH|LU|CA|VIP|OPT|HE)\b\s*/gi, "")
    .replace(/\s*[\[\(](HD|SD|V2|Backup|FR|MULT|7\/24|Main|24\/7|HEVC|480p|1080p|720p|4K|AUTO|OLD|TS|M3U8|VIP|FHD|UHD|H265|6|7)[\]\)]/gi, "")
    .replace(/\s+(HD|SD|FHD|UHD|4K|HEVC|RAW|BACKUP|TS|M3U8|TNT|S1|S2|S3|VIP|VOD|ADULT|7\/24|1080P|720P|6|7)$|^(HD|SD|FHD|UHD|4K|HEVC|RAW|BACKUP|TS|M3U8|TNT|S1|S2|S3|VIP)\s+/gi, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const lower = cleaned.toLowerCase();
  if (lower.startsWith("canal +") || lower.startsWith("canal+")) {
    cleaned = cleaned.replace(/^canal\s*\+\s*/gi, "Canal+ ");
  }
  return cleaned;
}

// Order multiplier
function getChannelSortWeight(c: DisplayChannel): number {
  const core = c.core;
  if (LCN_MAP[core] !== undefined) {
    return LCN_MAP[core];
  }
  
  let baseWeight = 500;
  if (c.category === "TNT & Généralistes") baseWeight = 200;
  else if (c.category === "Actualités") baseWeight = 250;
  else if (c.category === "Sports") baseWeight = 300;
  else if (c.category === "Cinéma & Séries") baseWeight = 350;
  else if (c.category === "Documentaires") baseWeight = 400;
  else if (c.category === "Jeunesse") baseWeight = 450;
  else if (c.category === "Belgique 🇧🇪") baseWeight = 480;

  const qualityVal = (q: string | undefined) => {
    if (q === "4K") return 0.001;
    if (q === "FHD") return 0.002;
    if (q === "HD") return 0.003;
    if (q === "SD+") return 0.004;
    if (q === "SD") return 0.005;
    return 0.006;
  };
  
  return baseWeight + qualityVal(c.qualityLabel);
}

// Retrieve quality labels
function getQualityLabel(name: string) {
  const n = name.toUpperCase();
  if (n.includes("(6)")) return "SD";
  if (n.includes("(7)")) return "SD+";
  if (n.includes("4K") || n.includes("UHD")) return "4K";
  if (n.includes("FHD") || n.includes("1080P") || n.includes("1080I")) return "FHD";
  if (n.includes("HD") || n.includes("720P")) return "HD";
  return undefined;
}

// Basic EPG category tagging
function categorizeChannel(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("france info") || n.includes("bfm") || n.includes("cnews") || n.includes("lci") || n.includes("france 24") || n.includes("euronews") || n.includes("info") || n.includes("météo")) {
    return "Actualités";
  }
  if (n.includes("sport") || n.includes("equipe") || n.includes(" l'équipe") || n.includes("bein") || n.includes("foot") || n.includes("rmc sport") || n.includes("golf") || n.includes("chasse") || n.includes("auto moto") || n.includes("eurosport")) {
    return "Sports";
  }
  if (n.includes("gulli") || n.includes("disney") || n.includes("cartoon") || n.includes("nickelodeon") || n.includes("manga") || n.includes("jeunesse") || n.includes("canald") || n.includes("tiji") || n.includes("boom")) {
    return "Jeunesse";
  }
  if (n.includes("cine") || n.includes("ciné") || n.includes("action") || n.includes("canal+") || n.includes("ocs") || n.includes("series") || n.includes("séries") || n.includes("film") || n.includes("paramount") || n.includes("polar") || n.includes("warner") || n.includes("syfy") || n.includes("altice studio")) {
    return "Cinéma & Séries";
  }
  if (n.includes("rmc decouverte") || n.includes("découverte") || n.includes("science") || n.includes("planete") || n.includes("planète") || n.includes("hist") || n.includes("trek") || n.includes("museum") || n.includes("animaux") || n.includes("ushuaia") || n.includes("national geographic") || n.includes("nat geo")) {
    return "Documentaires";
  }
  if (n.includes("cstar") || n.includes("nrj hits") || n.includes("mtv") || n.includes("m6 music") || n.includes("trace") || n.includes("rfm") || n.includes("melody")) {
    return "Musique";
  }
  if (n.includes("tf1") || n.includes("france 2") || n.includes("france 3") || n.includes("france 4") || n.includes("france 5") || n.includes("m6") || n.includes("w9") || n.includes("c8") || n.includes("tmc") || n.includes("tfx") || n.includes("nrj 12") || n.includes("lcp") || n.includes("public senat") || n.includes("6ter") || n.includes("rmc story") || n.includes("cherie 25") || /\barte\b/.test(n) || n.includes("arte hd") || n.includes("france o") || n.includes("culturebox")) {
    return "TNT & Généralistes";
  }
  if (n.includes("rtbf") || n.includes("rts") || n.includes("la une") || n.includes("tipik") || n.includes("la trois") || n.includes("rtl tvi") || n.includes("club rtl") || n.includes("plug rtl") || n.includes("ab3") || n.includes("abxplore") || n.includes("vtm") || n.includes("ln24") || n.includes("bel RTL") || n.includes("belgian")) {
    return "Belgique 🇧🇪";
  }
  return "Divertissement";
}

export default function App() {

  // --- MHub / URL Protocol Handler ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const externalUrl = params.get('url') || params.get('mhub');
    if (externalUrl) {
      if (externalUrl.startsWith('mhub://') || externalUrl.includes('.to') || externalUrl.includes('huhu') || externalUrl.includes('oha') || externalUrl.includes('vavoo')) {
        const httpsUrl = externalUrl.replace('mhub://', 'https://');
        console.log('MHub bundle URL detected:', httpsUrl);
        localStorage.setItem('mhub_connected', httpsUrl);
        // The normal load hook will fetch channels automatically.
        setTimeout(() => alert('Bundle ' + httpsUrl + ' connecté avec succès via URL protocole.'), 500);
      } else if (externalUrl.endsWith('m3u') || externalUrl.endsWith('m3u8')) {
        console.log('M3U URL detected but manual load is disabled.');
      }
    }
  }, []);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<DisplayChannel | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [recentIds, setRecentIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("recent_channels");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [sortBy, setSortBy] = useState<"lcn" | "name" | "favs">("lcn");

  const playChannel = (ch: DisplayChannel | null, recordRecent = true) => {
    setSelectedChannel(ch);
    if (!document.pictureInPictureElement) {
      setIsNavigating(false);
    }
    if (ch && recordRecent) {
      setRecentIds(prev => {
        const filtered = prev.filter(id => id !== ch.id);
        const updated = [ch.id, ...filtered].slice(0, 15);
        localStorage.setItem("recent_channels", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const [failedChannels, setFailedChannels] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<number[]>([]);
  const [qualityFilter, setQualityFilter] = useState<"all" | "hd">("all");
  
  
  
  // --- Long Press Edit Handler ---
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (ch: DisplayChannel) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setChannelToEdit(ch);
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    }, 600);
  };
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  const handleEditInteraction = (e: React.MouseEvent | React.TouchEvent, ch: DisplayChannel) => {
    e.preventDefault();
    setChannelToEdit(ch);
  };

  
  // Custom Overrides
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [customLogosEvent, setCustomLogosEvent] = useState(0);
  const [channelToEdit, setChannelToEdit] = useState<DisplayChannel | null>(null);

  useEffect(() => {
    setCustomNames(getCustomNames());
    const handleUpdate = () => {
      setCustomNames(getCustomNames());
      setCustomLogosEvent(prev => prev + 1);
    };
    window.addEventListener('custom_name_updated', handleUpdate);
    window.addEventListener('custom_logo_updated', handleUpdate);
    return () => {
      window.removeEventListener('custom_name_updated', handleUpdate);
      window.removeEventListener('custom_logo_updated', handleUpdate);
    };
  }, []);
  
  // Custom State for the TV Hub drawer
  const [showDrawer, setShowDrawer] = useState(false);
  const [detailedEpgChannel, setDetailedEpgChannel] = useState<DisplayChannel | null>(null);
  const [drawerTab, setDrawerTab] = useState<"channels" | "settings">("channels");
  const [drawerChannelView, setDrawerChannelView] = useState<"list" | "grid">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  
  // Performance pagination limits
  const [visibleCount, setVisibleCount] = useState(40);
  
  // States for keyboard navigation & fast zapping
  const [activeKeyboardIdx, setActiveKeyboardIdx] = useState<number>(-1);
  const [zappingNumber, setZappingNumber] = useState<string>("");
  const [showZappingHUD, setShowZappingHUD] = useState(false);

  // Reset pagination size dynamically on category or search filter changes
  useEffect(() => {
    setVisibleCount(40);
    setActiveKeyboardIdx(-1);
  }, [activeCategory, searchTerm]);

  // Clean-up EPG details state when drawer is dismissed
  useEffect(() => {
    if (!showDrawer) {
      setDetailedEpgChannel(null);
    }
  }, [showDrawer]);
  
  // Xtream credentials state
  const [xtreamInput, setXtreamInput] = useState(() => {
    const creds = getSavedXtreamCredentials();
    return {
      server: creds.server || "",
      username: creds.username || "",
      password: creds.password || "",
      useCorsProxy: creds.useCorsProxy,
      enabled: creds.enabled
    };
  });
  const [xtreamStatus, setXtreamStatus] = useState<string>("");
  const [customBackendUrl, setCustomBackendUrl] = useState(() => localStorage.getItem("backend_server_url") || "");
  const [mhubInput, setMhubInput] = useState(() => localStorage.getItem("mhub_connected") || "");
  const [mhubStatus, setMhubStatus] = useState({ state: "idle", message: mhubInput ? "Connecté au bundle précédent" : "" });


  // Logo customization states
  const [selectedLogoChannelName, setSelectedLogoChannelName] = useState("");
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState("");
  const [logoSettingsMessage, setLogoSettingsMessage] = useState("");

  // Load favorites from local storage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id];
      localStorage.setItem("favorites", JSON.stringify(updated));
      return updated;
    });
  };

  // Convert raw channels to rich DisplayChannels
  const categorisedList: DisplayChannel[] = useMemo(() => {
    const coreCounts: Record<string, number> = {};
    const withCores = channels.map(c => {
      const core = getCoreName(c.name);
      coreCounts[core] = (coreCounts[core] || 0) + 1;
      
      const norm = normalizeName(c.name);
      const customName = customNames[String(c.id)] || customNames[norm];
      
      return {
        ...c,
        name: customName || cleanName(c.name),
        core,
        category: c.categoryOverride || categorizeChannel(c.name),
        qualityLabel: getQualityLabel(c.name),
        rawName: c.name // store original name for reference if needed
      };
    });

    return withCores
      .map(c => ({
        ...c,
        id: c.id,
        name: c.name,
        country: c.country,
        p: c.p,
        category: c.category,
        serverCount: coreCounts[c.core] || 1,
        epg: c.epg,
        core: c.core
      }))
      .filter(c => {
        if (qualityFilter === "all") return true;
        const n = c.name.toLowerCase();
        return n.includes("hd") || n.includes("fhd") || n.includes("uhd") || n.includes("4k") || n.includes("1080p") || n.includes("2160p");
      })
      .sort((a, b) => getChannelSortWeight(a) - getChannelSortWeight(b));
  }, [channels, qualityFilter, customNames]);

  // Remove duplicate server variants for screen selection list
  const dedupeByCore = React.useCallback((list: DisplayChannel[]) => {
    const groups: Record<string, DisplayChannel[]> = {};
    list.forEach(c => {
      if (!groups[c.core]) groups[c.core] = [];
      groups[c.core].push(c);
    });

    const representatives = Object.keys(groups).map(coreKey => {
      const coreStreams = groups[coreKey];
      const sortedStreams = [...coreStreams].sort((a, b) => {
        const aFailed = failedChannels.has(a.id) ? 1 : 0;
        const bFailed = failedChannels.has(b.id) ? 1 : 0;
        if (aFailed !== bFailed) return aFailed - bFailed;

        const getQualityVal = (q: string | undefined) => {
          if (q === "4K") return 4;
          if (q === "FHD") return 3;
          if (q === "HD") return 2;
          if (q === "SD+") return 1.5;
          if (q === "SD") return 1;
          return 0;
        };

        const scoreA = (a.epg ? 10 : 0) + (a.logo ? 5 : 0) + getQualityVal(a.qualityLabel) * 2;
        const scoreB = (b.epg ? 10 : 0) + (b.logo ? 5 : 0) + getQualityVal(b.qualityLabel) * 2;
        return scoreB - scoreA;
      });
      return sortedStreams[0];
    });

    return representatives.sort((a, b) => getChannelSortWeight(a) - getChannelSortWeight(b));
  }, [failedChannels]);

  const dedupedCategorisedList = useMemo(() => dedupeByCore(categorisedList), [categorisedList, dedupeByCore]);

  // Main channels load method
  const loadChannels = async (forceRefetch = false) => {
    setLoading(true);
    setError(null);

    const xtreamCreds = getSavedXtreamCredentials();
    if (xtreamCreds.enabled) {
      try {
        setXtreamStatus("Connexion au serveur Xtream Codes...");
        const cats = await fetchXtreamCategoriesList();
        if (cats && cats.length > 0) {
          // Load first category streams
          const firstCatId = cats[0].id;
          const xtreamChs = await fetchXtreamChannelsByCategory(firstCatId);
          if (xtreamChs && xtreamChs.length > 0) {
            const enriched = xtreamChs.map(ch => ({
              ...ch,
              epg: getFallbackEpgCurrentAndNext(ch.name)
            }));
            setChannels(enriched);
            setLoading(false);
            setXtreamStatus("Connecté avec succès");
            return;
          }
        }
        setChannels([]);
      } catch (err) {
        console.error("Failed loading Xtream streams:", err);
        setXtreamStatus("Échec de synchronisation Xtream Codes");
      }
    }

    try {
      const url = getApiUrl(`/api/channels${forceRefetch ? "?force=true" : ""}`);
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        setChannels(data.channels);
      } else {
        // Fallback Client-side list
        const enriched = FALLBACK_CHANNELS.map(ch => ({
          ...ch,
          epg: getFallbackEpgCurrentAndNext(ch.name)
        }));
        setChannels(enriched);
      }
    } catch (err) {
      console.warn("Using offline fallback channels list:", err);
      const enriched = FALLBACK_CHANNELS.map(ch => ({
        ...ch,
        epg: getFallbackEpgCurrentAndNext(ch.name)
      }));
      setChannels(enriched);
    } finally {
      setLoading(false);
    }
  };

  // Mount loading trigger
  useEffect(() => {
    loadChannels();
  }, []);

  // AUTO-PLAY disabled to support visual landing grid selection
  /*
  useEffect(() => {
    if (!selectedChannel && categorisedList.length > 0) {
      const list = dedupedCategorisedList;
      if (list.length > 0) {
        // Select first available
        playChannel(list[0], false);
      }
    }
  }, [categorisedList, selectedChannel]);
  */

  // Swapping active stream urls
  const getActiveStreamUrl = (channel: Channel): string => {
    if (channel.streamUrl) {
      if (channel.streamUrl.startsWith("/") || channel.streamUrl.includes(window.location.hostname)) {
        return channel.streamUrl;
      }
      if (channel.streamUrl.toLowerCase().includes(".ts") && !channel.streamUrl.toLowerCase().includes(".m3u8")) {
        return getApiUrl(`/api/stream-ts?url=${encodeURIComponent(channel.streamUrl)}`);
      }
      return getApiUrl(`/api/stream-playlist?url=${encodeURIComponent(channel.streamUrl)}`);
    }
    return getApiUrl(`/api/stream/${channel.id}/index.m3u8${channel.p ? `?p=${channel.p}` : ""}`);
  };

  // Auto recovery on failure to alternate server sources
  const handleStreamError = () => {
    if (!selectedChannel) return;
    setFailedChannels(prev => {
      const next = new Set(prev);
      next.add(selectedChannel.id);
      return next;
    });

    const core = getCoreName(selectedChannel.name);
    const alternatives = categorisedList.filter(
      c => getCoreName(c.name) === core && !failedChannels.has(c.id) && c.id !== selectedChannel.id
    );
    
    if (alternatives.length > 0) {
      console.log(`Fallback swap from ${selectedChannel.name} to ${alternatives[0].name}`);
      playChannel(alternatives[0], false);
    }
  };

  // Download Live M3U playlist file
  const handleDownloadM3U = () => {
    const url = getApiUrl("/api/playlist.m3u");
    window.location.href = url;
  };

  // Channel count in category helper for dynamic Drawer badges
  const getCategoryCount = (cat: string): number => {
    const list = dedupedCategorisedList;
    if (cat === "Tous") return list.length;
    if (cat === "Favoris") return list.filter(c => favorites.includes(c.id)).length;
    if (cat === "Récents") return recentIds.length;
    return list.filter(c => c.category === cat).length;
  };

  const handleMHubConnect = async () => {
    if (!mhubInput.trim()) return;
    setMhubStatus({ state: 'loading', message: 'Analyse du bundle et de la signature...' });
    
    // Simulate connection to MHub/vavoo server infrastructure
    setTimeout(async () => {
       setMhubStatus({ state: 'loading', message: 'Négociation du protocole...' });
       
       setTimeout(async () => {
          const lowerInput = mhubInput.toLowerCase();
          if (lowerInput.includes('vavoo.to') || lowerInput.includes('huhu.to') || lowerInput.includes('mhub://') || lowerInput.includes('oha.to') || lowerInput.includes('vypn.io')) {
             setMhubStatus({ state: 'success', message: 'Bundle MHub sécurisé, connecté avec succès !' });
             localStorage.setItem('mhub_connected', mhubInput);
             // In Flux TV Pro, the backend automatically uses the master keys for these known hubs
             await loadChannels(true);
          } else {
             setMhubStatus({ state: 'error', message: 'Bundle non reconnu ou protocole inaccessible' });
          }
       }, 1500);
    }, 1000);
  };

  // Xtream configuration saver
  const handleSaveXtream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!xtreamInput.server || !xtreamInput.username || !xtreamInput.password) {
      setXtreamStatus("Erreur: Tous les champs sont requis.");
      return;
    }
    setXtreamStatus("Validation de vos identifiants...");
    
    saveXtreamCredentials(
      xtreamInput.server,
      xtreamInput.username,
      xtreamInput.password,
      xtreamInput.useCorsProxy
    );
    setXtreamEnabled(true);
    
    const authResult = await authenticateXtream();
    if (authResult.success) {
      setXtreamStatus("Identifiants validés ! Redémarrage...");
      setTimeout(() => {
        setXtreamInput(prev => ({ ...prev, enabled: true }));
        loadChannels(true);
      }, 1000);
    } else {
      setXtreamStatus(`Erreur de validation: ${authResult.error}`);
    }
  };

  const handleDisableXtream = () => {
    setXtreamEnabled(false);
    setXtreamInput(prev => ({ ...prev, enabled: false }));
    setXtreamStatus("Fichier M3U Local réactivé.");
    setTimeout(() => loadChannels(true), 800);
  };

  // Filter channels based on search and selected categories inside drawer
  const filteredChannels = useMemo(() => {
    let list = dedupedCategorisedList;
    
    if (activeCategory === "Favoris") {
      list = list.filter(c => favorites.includes(c.id));
    } else if (activeCategory === "Récents") {
      list = recentIds
        .map(id => list.find(c => c.id === id))
        .filter((c): c is DisplayChannel => !!c);
    } else if (activeCategory !== "Tous") {
      list = list.filter(c => c.category === activeCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(term) || 
        c.category.toLowerCase().includes(term) ||
        (c.epg?.current?.title && c.epg.current.title.toLowerCase().includes(term))
      );
    }

    // Apply sorting logic
    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    } else if (sortBy === "favs") {
      list = [...list].sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 1 : 0;
        const bFav = favorites.includes(b.id) ? 1 : 0;
        return bFav - aFav;
      });
    }

    return list;
  }, [categorisedList, activeCategory, searchTerm, favorites, failedChannels, recentIds, sortBy]);

  // Keyboard navigation & direct zapping controller effect
  useEffect(() => {
    let zappingTimer: NodeJS.Timeout;

    const handleKeyNav = (e: KeyboardEvent) => {
      // Ignore if typed inside active input field
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = e.key;

      if (showDrawer) {
        // 1. Menu navigation when Drawer is visible
        if (key === "ArrowDown") {
          e.preventDefault();
          setActiveKeyboardIdx(prev => {
            const nextIdx = Math.min(filteredChannels.length - 1, prev + 1);
            // Scroll target into visual viewport
            const el = document.getElementById(`drawer-ch-${nextIdx}`);
            if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
            return nextIdx;
          });
        } else if (key === "ArrowUp") {
          e.preventDefault();
          setActiveKeyboardIdx(prev => {
            const nextIdx = Math.max(0, prev - 1);
            const el = document.getElementById(`drawer-ch-${nextIdx}`);
            if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
            return nextIdx;
          });
        } else if (key === "Enter") {
          if (activeKeyboardIdx >= 0 && activeKeyboardIdx < filteredChannels.length) {
            e.preventDefault();
            playChannel(filteredChannels[activeKeyboardIdx]);
            if (window.innerWidth < 768) {
              setShowDrawer(false);
            }
          }
        } else if (key.toLowerCase() === "s" || key === "/") {
          e.preventDefault();
          const searchInput = document.getElementById("drawer-search-input") as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
      } else if (selectedChannel) {
        // 2. Continuous Zapping when playing a channel
        if (/[0-9]/.test(key)) {
          e.preventDefault();
          setZappingNumber(prev => {
            const nextVal = (prev + key).slice(-3); // Cap at 3 digits
            setShowZappingHUD(true);

            clearTimeout(zappingTimer);
            zappingTimer = setTimeout(() => {
              const channelIndex = parseInt(nextVal, 10) - 1;
              const fullChannelList = dedupedCategorisedList;
              if (channelIndex >= 0 && channelIndex < fullChannelList.length) {
                playChannel(fullChannelList[channelIndex]);
              }
              // Animate-out HUD delay
              setTimeout(() => {
                setShowZappingHUD(false);
                setZappingNumber("");
              }, 600);
            }, 1100);

            return nextVal;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyNav);
    return () => {
      window.removeEventListener("keydown", handleKeyNav);
      clearTimeout(zappingTimer);
    };
  }, [showDrawer, filteredChannels, activeKeyboardIdx, selectedChannel, categorisedList]);

  // Dynamically collect active categories with channels
  const availableCategories = useMemo(() => {
    const list = dedupedCategorisedList;
    const cats = Array.from(new Set(list.map(c => c.category).filter(Boolean)));
    const base = ["Tous", "Favoris"];
    if (recentIds.length > 0) {
      base.push("Récents");
    }
    return [...base, ...cats];
  }, [categorisedList, recentIds]);

  // Lazy load trigger scroll handler
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 150) {
      setVisibleCount(prev => Math.min(filteredChannels.length, prev + 35));
    }
  };

  return (
    <div id="root-layout" className="min-h-screen bg-[#09090b] text-gray-50 antialiased overflow-hidden select-none relative font-sans">
      
      {/* Floating Selector Menu Trigger - Elegant visual anchor when not watching */}
      {(!selectedChannel || isNavigating) && (
        <button
          id="tv-hub-menu-btn"
          onClick={() => setShowDrawer(true)}
          className="fixed top-5 left-5 z-[80] flex items-center gap-2.5 px-4.5 py-3 bg-[#09090b]/60 hover:bg-[#09090b]/85 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-[#3b82f6]/50 text-gray-50 font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-2xl group hover:scale-[1.03] active:scale-95 animate-fade-in"
        >
          <Tv size={14} className="text-[#3b82f6] group-hover:rotate-12 transition-transform" />
          <span>Menu TV</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
        </button>
      )}

      {/* Main Full-page Video Player Area (Kept in DOM for PiP) */}
      <div className={`fixed inset-0 w-full h-screen bg-black z-0 flex items-center justify-center overflow-hidden transition-opacity duration-300 ${(!selectedChannel || isNavigating) ? "opacity-0 pointer-events-none" : "opacity-100"}`} id="theater-player-container">
        {selectedChannel && (
          <>
            <HlsPlayer
              url={getActiveStreamUrl(selectedChannel)}
              channelName={selectedChannel.name}
              programTitle={selectedChannel.epg?.current?.title}
              programDesc={selectedChannel.epg?.current?.desc}
              programImage={selectedChannel.epg?.current?.image || selectedChannel.epg?.current?.icon}
              onBack={() => {
                if (document.pictureInPictureElement) {
                  setIsNavigating(true);
                } else {
                  setSelectedChannel(null);
                  setIsNavigating(false);
                }
              }}
              onMenuTV={() => setShowDrawer(true)}
              onFatalError={handleStreamError}
              isFavorite={favorites.includes(selectedChannel.id)}
              onToggleFavorite={() => toggleFavorite(selectedChannel.id)}
              fullViewport={true}
              onPiPEnter={() => {
                setIsNavigating(true);
              }}
              onPiPLeave={(isPaused) => {
                if (isPaused) {
                  setSelectedChannel(null);
                }
                setIsNavigating(false);
              }}
            />

            {/* STB-Style Floating Channel Zapping HUD Overlay */}
            <AnimatePresence>
              {showZappingHUD && zappingNumber && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -20 }}
                  className="absolute top-12 right-12 z-50 bg-[#18181b]/90 border-2 border-[#3b82f6]/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(59,130,246,0.25)] flex flex-col items-center gap-1 cursor-none pointer-events-none select-none"
                >
                  <span className="text-xs font-black text-gray-400 tracking-[0.25em] uppercase">ZAPPING DIRECT</span>
                  <div className="font-mono text-3xl font-black text-[#3b82f6] tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span className="opacity-40 font-semibold">CH</span>
                    <span>{zappingNumber.padStart(3, "0")}</span>
                  </div>
                  <div className="w-12 h-1 bg-[#27272a] rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.1, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-[#3b82f6] to-orange-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Grid Nav Layer */}
      <main className={`fixed inset-0 w-full h-screen bg-[#09090b] text-gray-50 z-10 overflow-y-auto transition-opacity duration-300 ${(!selectedChannel || isNavigating) ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {loading ? (
          <div className="w-full min-h-full pt-24 pb-20 px-4 sm:px-8 flex flex-col gap-6 max-w-7xl mx-auto text-sans animate-fade-in select-none">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-[#27272a] rounded-full animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="w-24 h-3 rounded-full bg-[#27272a] animate-pulse" />
                  <div className="w-48 h-6 rounded-full bg-[#27272a] animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-8 pb-8">
               {/* 3 Categories Skeleton */}
               {[1, 2, 3].map(cat => (
                  <div key={cat} className="flex flex-col gap-3">
                     <div className="flex items-center justify-between px-1">
                        <div className="w-32 h-4 rounded bg-[#27272a] animate-pulse ml-3" />
                     </div>
                     <div className="flex overflow-x-hidden gap-3 pb-4 px-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
                           <div key={item} className="w-[110px] sm:w-[130px] flex-shrink-0 aspect-square rounded-2xl bg-[#18181b]/50 flex flex-col items-center justify-center relative p-3 animate-pulse border border-white/5">
                              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#27272a]/80 rounded-full" />
                              <div className="absolute bottom-3 inset-x-3 h-2 bg-[#27272a]/80 rounded" />
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
          </div>
        ) : categorisedList.length > 0 ? (
          <div className="w-full min-h-full pt-24 pb-20 px-4 sm:px-8 flex flex-col gap-6 max-w-7xl mx-auto text-sans animate-fade-in select-none">

            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-[#3b82f6] rounded-full shadow-[0_0_15px_#3b82f6]" />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-[#3b82f6] uppercase tracking-[0.35em] leading-none mb-1">DENDEN TV</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-50 uppercase tracking-tighter leading-none">Chaînes en Direct</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDrawerTab("recherche");
                    setShowDrawer(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#27272a] rounded-xl border border-white/10 hover:border-[#3b82f6]/30 text-sm uppercase tracking-wider font-extrabold text-gray-400 hover:text-gray-50 transition-all cursor-pointer"
                >
                  <Search size={12} className="text-[#3b82f6]" />
                  <span>Recherche</span>
                </button>
                <button
                  onClick={() => {
                    setDrawerTab("settings");
                    setShowDrawer(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#27272a] rounded-xl border border-white/10 hover:border-[#3b82f6]/30 text-sm uppercase tracking-wider font-extrabold text-gray-400 hover:text-gray-50 transition-all cursor-pointer"
                >
                  <Settings size={12} className="text-[#3b82f6]" />
                  <span>Paramètres</span>
                </button>
              </div>
            </div>

            {activeCategory === "Tous" ? (
              <div className="flex flex-col gap-8 pb-8">
                {availableCategories.filter(cat => cat !== "Tous" && cat !== "Favoris" && cat !== "Récents").map(cat => {
                  const items = dedupedCategorisedList.filter(c => c.category === cat);
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={cat} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between px-1">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-50 border-l-2 border-[#3b82f6] pl-3">
                          {cat}
                        </h2>
                        <button 
                          onClick={() => setActiveCategory(cat)}
                          className="text-sm uppercase font-bold text-[#3b82f6] hover:text-[#cc6000] tracking-wider"
                        >
                          Voir tout &rarr;
                        </button>
                      </div>
                      <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-none snap-x snap-mandatory px-1">
                        {items.slice(0, 15).map((ch, idx) => {
                          const isFavorite = favorites.includes(ch.id);
                          return (
                            <motion.button
                              key={ch.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.15, delay: Math.min(idx * 0.005, 0.12) }}
                              onClick={() => playChannel(ch)}
                              onContextMenu={(e) => handleEditInteraction(e, ch)}
                              onTouchStart={() => handleTouchStart(ch)}
                              onTouchEnd={handleTouchEnd}
                              onTouchMove={handleTouchEnd}
                              className="w-[110px] sm:w-[130px] flex-shrink-0 aspect-[4/3] rounded-2xl bg-[#09090b] hover:bg-[#18181b] border border-white/10 hover:border-[#3b82f6]/50 flex flex-col items-center justify-center relative p-3 transition-all duration-300 group shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 active:scale-95 cursor-pointer snap-start"
                              title={ch.name}
                            >
                              {isFavorite && (
                                <div className="absolute top-1.5 right-1.5 z-10">
                                  <Heart size={10} className="text-red-500 fill-current" />
                                </div>
                              )}

                              <div className="scale-105 group-hover:scale-115 transition-transform duration-300 mb-2">
                                <ChannelLogo logo={ch.logo} name={ch.name} containerClassName="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
                              </div>

                              <div className="absolute inset-x-0 bottom-2 px-1">
                                <p className="text-xs font-black uppercase text-gray-400 group-hover:text-gray-50 truncate tracking-wider leading-none text-center">
                                  {ch.name}
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 pb-8">
                {filteredChannels.length > 0 ? (
                  filteredChannels.map((ch, idx) => {
                    const isFavorite = favorites.includes(ch.id);
                    return (
                      <motion.button
                        key={ch.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, delay: Math.min(idx * 0.005, 0.12) }}
                        onClick={() => playChannel(ch)}
                        onContextMenu={(e) => handleEditInteraction(e, ch)}
                        onTouchStart={() => handleTouchStart(ch)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        className="aspect-[4/3] rounded-2xl bg-[#09090b] hover:bg-[#18181b] border border-white/10 hover:border-[#3b82f6]/50 flex flex-col items-center justify-center relative p-3 transition-all duration-300 group shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 active:scale-95 cursor-pointer"
                        title={ch.name}
                      >
                        {isFavorite && (
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <Heart size={10} className="text-red-500 fill-current" />
                          </div>
                        )}

                        <div className="scale-105 group-hover:scale-115 transition-transform duration-300 mb-2">
                          <ChannelLogo logo={ch.logo} name={ch.name} containerClassName="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
                        </div>

                        <div className="absolute inset-x-0 bottom-2 px-1">
                          <p className="text-xs font-black uppercase text-gray-400 group-hover:text-gray-50 truncate tracking-wider leading-none text-center">
                            {ch.name}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-70">
                    <Radio size={36} className="text-gray-500 mb-3" />
                    <p className="text-sm font-bold uppercase tracking-widest text-[#3b82f6]">Aucune chaîne trouvée</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
            <Tv size={42} className="text-neutral-700 mb-2" />
            <p className="text-xs font-black uppercase tracking-widest text-[#3b82f6]">
              Aucune chaîne disponible
            </p>
            <p className="text-[10.5px] text-gray-500 max-w-sm">
              Configurez vos identifiants Xtream Codes ou réessayez avec de nouveaux serveurs M3U.
            </p>
            <button
              onClick={() => {
                setDrawerTab("settings");
                setShowDrawer(true);
              }}
              className="mt-4 px-4 py-2 bg-[#27272a] border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-white/10 text-gray-50 transition-all"
            >
              Ouvrir les Paramètres
            </button>
          </div>
        )}

      </main>

      {/* Sliding Obsidian TV Drawer Overlay */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop Dimmer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-[#09090b] z-[110] backdrop-blur-sm cursor-pointer"
            />

            {/* Floating Obsidian navigation panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-[#18181b]/95 backdrop-blur-3xl z-[120] border-r border-white/10 shadow-2xl flex flex-col h-full overflow-hidden"
            >
              <div className="p-5 pb-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-sans font-light text-gray-50 text-[15px] tracking-[0.2em] uppercase leading-none">
                      DENDEN <span className="font-semibold text-[#3b82f6]">TV</span>
                    </h3>
                    <p className="text-sm font-semibold tracking-[0.15em] text-gray-500 uppercase mt-1 leading-none">
                      PANEL DE CONTRÔLE
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 cursor-pointer hover:bg-white/[0.05] rounded-lg transition-all border border-transparent hover:border-white/10 text-gray-500 hover:text-gray-50"
                  title="Fermer le menu"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Drawer View Swapper Tabs (Ultra-sleek borderless inline segmented elements) */}
              <div className="px-5 py-2.5 bg-[#18181b]/20 border-b border-white/10 flex items-center justify-between text-sm tracking-[0.1em] uppercase font-bold text-gray-500 flex-shrink-0">
                <div className="flex gap-5">
                  <button
                    onClick={() => setDrawerTab("channels")}
                    className={`pb-1 transition-all relative ${
                      drawerTab === "channels" 
                        ? "text-[#3b82f6] font-black" 
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Chaînes
                    {drawerTab === "channels" && (
                      <motion.div 
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#3b82f6]" 
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setDrawerTab("settings")}
                    className={`pb-1 transition-all relative ${
                      drawerTab === "settings" 
                        ? "text-[#3b82f6] font-black" 
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Configuration
                    {drawerTab === "settings" && (
                      <motion.div 
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#3b82f6]" 
                      />
                    )}
                  </button>
                </div>
                <div className="text-sm font-mono text-neutral-600 tracking-wider">
                  LIVE CONTROLLER
                </div>
              </div>

              {/* TAB 1 CONTENT: Live TV Selector */}
              {drawerTab === "channels" && (
                <div className="flex-grow flex flex-col overflow-hidden h-full">
                  
                  {/* Slim Horizontal Category Badge Scroller */}
                  <div className="px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0 border-b border-white/10 bg-[#18181b]/40">
                    {availableCategories.map((cat) => {
                      const isActive = activeCategory === cat;
                      
                      const getCategoryDetails = (c: string) => {
                        switch (c) {
                          case "Tous": return { icon: "🌐", label: "Tous" };
                          case "Favoris": return { icon: "❤️", label: "Favoris" };
                          case "Récents": return { icon: "⏱️", label: "Récents" };
                          case "TNT & Généralistes": return { icon: "📺", label: "TNT" };
                          case "Sports": return { icon: "⚽", label: "Sports" };
                          case "Cinéma & Séries": return { icon: "🎬", label: "Cinéma" };
                          case "Documentaires": return { icon: "🗺️", label: "Docs" };
                          case "Musique": return { icon: "🎵", label: "Musique" };
                          case "Belgique 🇧🇪": return { icon: "🇧🇪", label: "Belgique" };
                          case "Divertissement": return { icon: "🎭", label: "Loisirs" };
                          default: return { icon: "✨", label: c };
                        }
                      };
                      
                      const details = getCategoryDetails(cat);
                      
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wider flex-shrink-0 flex items-center gap-1.5 transition-all duration-255 border ${
                            isActive 
                              ? "bg-[#3b82f6]/10 border-[#3b82f6]/40 text-gray-50 shadow-[0_0_12px_rgba(59,130,246,0.1)]" 
                              : "bg-white/5 text-gray-400 border-white/10 hover:text-gray-50 hover:bg-[#27272a]/90"
                          }`}
                        >
                          <span className="text-sm">{details.icon}</span>
                          <span className="font-bold uppercase text-[11px] tracking-[0.05em]">{details.label}</span>
                          <span className="text-sm text-[#3b82f6] bg-white/5 px-1 rounded-sm font-mono font-bold">
                            {getCategoryCount(cat)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Main Pane: Clean single list */}
                  <div className="flex-grow flex flex-col h-full overflow-hidden">
                    
                    {/* Modern Refined Search Input & Sorting Controls Area */}
                    <div className="p-3 border-b border-white/10 space-y-2 flex-shrink-0 bg-[#18181b]/20">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={11} strokeWidth={2.5} />
                        <input
                          id="drawer-search-input"
                          type="text"
                          placeholder="Rechercher une chaîne..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-[#27272a]/50 border border-white/5 hover:border-white/10 focus:border-[#3b82f6]/40 focus:bg-[#27272a]/80 shadow-inner rounded-xl pl-8 pr-8 py-2 text-sm text-gray-50 placeholder-neutral-500 focus:outline-none transition-all font-sans"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-50"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>

                      {/* Tactile Segmented Sorting Controls */}
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-gray-500 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span>Trier par</span>
                          <div className="flex gap-1 bg-[#09090b]/45 p-0.5 rounded-md border border-white/10">
                            <button
                              onClick={() => setSortBy("lcn")}
                              className={`px-2 py-0.5 rounded text-sm transition-all cursor-pointer ${
                                sortBy === "lcn" 
                                  ? "bg-[#3b82f6] text-gray-50 font-black" 
                                  : "text-gray-500 hover:text-gray-400"
                              }`}
                            >
                              IPTV
                            </button>
                            <button
                              onClick={() => setSortBy("name")}
                              className={`px-2 py-0.5 rounded text-sm transition-all cursor-pointer ${
                                sortBy === "name" 
                                  ? "bg-[#3b82f6] text-gray-50 font-black" 
                                  : "text-gray-500 hover:text-gray-400"
                              }`}
                            >
                              Nom (A-Z)
                            </button>
                            <button
                              onClick={() => setSortBy("favs")}
                              className={`px-2 py-0.5 rounded text-sm transition-all cursor-pointer flex items-center gap-0.5 ${
                                sortBy === "favs" 
                                  ? "bg-[#3b82f6] text-gray-50 font-black" 
                                  : "text-gray-500 hover:text-gray-400"
                              }`}
                            >
                              ★ Favoris
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span>Affichage</span>
                          <div className="flex gap-1 bg-[#09090b]/45 p-0.5 rounded-md border border-white/10">
                            <button
                              onClick={() => setDrawerChannelView("list")}
                              className={`px-2 py-0.5 rounded text-sm transition-all cursor-pointer flex items-center gap-1 ${
                                drawerChannelView === "list"
                                  ? "bg-[#3b82f6] text-gray-50 font-black"
                                  : "text-gray-500 hover:text-gray-400"
                              }`}
                              title="Vue Liste"
                            >
                              <List size={8} />
                              Liste
                            </button>
                            <button
                              onClick={() => setDrawerChannelView("grid")}
                              className={`px-2 py-0.5 rounded text-sm transition-all cursor-pointer flex items-center gap-1 ${
                                drawerChannelView === "grid"
                                  ? "bg-[#3b82f6] text-gray-50 font-black"
                                  : "text-gray-500 hover:text-gray-400"
                              }`}
                              title="Vue Grille (Logos uniquement)"
                            >
                              <LayoutGrid size={8} />
                              Grille
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recently Watched Quick Launcher Bar if present */}
                    {recentIds.length > 0 && (
                      <div className="px-3 py-2 border-b border-white/10 bg-[#18181b]/30 flex-shrink-0 animate-fade-in">
                        <p className="text-[11px] font-black uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1">
                          <Clock size={9} className="text-[#3b82f6]" />
                          Dernières lectures
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {recentIds
                            .map(id => dedupedCategorisedList.find(c => c.id === id))
                            .filter((c): c is DisplayChannel => !!c)
                            .slice(0, 8)
                            .map((ch) => {
                              const isCurrent = selectedChannel?.id === ch.id;
                              return (
                                <button
                                  key={`recent-quick-${ch.id}`}
                                  onClick={() => playChannel(ch)}
                              onContextMenu={(e) => handleEditInteraction(e, ch)}
                              onTouchStart={() => handleTouchStart(ch)}
                              onTouchEnd={handleTouchEnd}
                              onTouchMove={handleTouchEnd}
                                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                                    isCurrent 
                                      ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-gray-50 shadow-[0_0_8px_rgba(59,130,246,0.15)]" 
                                      : "bg-[#27272a] border-white/10 hover:border-white/20 text-gray-400 hover:text-gray-50"
                                  }`}
                                  title={`Lancer ${ch.name}`}
                                >
                                  <div className="w-4 h-4 rounded-md overflow-hidden bg-[#18181b] flex items-center justify-center p-0.5 border border-white/10 flex-shrink-0">
                                    {ch.logo ? (
                                      <img src={ch.logo} className="object-contain w-full h-full max-h-3" alt="" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Tv size={8} className="text-[#3b82f6]" />
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold truncate max-w-[70px] uppercase tracking-wide">
                                    {ch.name}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Scrolling Channels Catalog list */}
                    <div 
                      onScroll={handleListScroll}
                      className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-transparent"
                    >
                      {loading ? (
                        <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-[1.5px] border-neutral-800 border-t-[#3b82f6] rounded-full animate-spin" />
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mt-1 animate-pulse">
                            Mise à jour...
                          </p>
                        </div>
                      ) : filteredChannels.length === 0 ? (
                        <div className="py-24 text-center space-y-1 px-4">
                          <Info size={14} className="text-neutral-600 mx-auto" />
                          <p className="text-xs uppercase font-black tracking-widest text-[#3b82f6]">
                            Aucun flux disponible
                          </p>
                          <p className="text-xs text-gray-500 leading-normal max-w-xs mx-auto">
                            Ajustez le titre ou changez de catégorie.
                          </p>
                        </div>
                      ) : drawerChannelView === "grid" ? (
                        /* Alternative Grid View (Logos Only) */
                        <div className="grid grid-cols-4 gap-2 pb-2">
                          {filteredChannels.slice(0, visibleCount).map((ch, idx) => {
                            const isCurrent = selectedChannel?.id === ch.id || selectedChannel?.core === ch.core;
                            const isKeyboardFocused = idx === activeKeyboardIdx;
                            
                            return (
                              <motion.button
                                key={ch.id}
                                id={`drawer-ch-${idx}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.12, delay: Math.min(idx * 0.005, 0.06) }}
                                onClick={() => {
                                  playChannel(ch);
                                  if (window.innerWidth < 768) setShowDrawer(false);
                                }}
                                onContextMenu={(e) => handleEditInteraction(e, ch)}
                                onTouchStart={() => handleTouchStart(ch)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                className={`aspect-[4/3] rounded-xl bg-[#27272a]/30 hover:bg-[#27272a]/70 border flex flex-col items-center justify-center relative transition-all duration-200 group shrink-0 ${
                                  isCurrent 
                                    ? "bg-[#3b82f6]/5 border-[#3b82f6]/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                                    : isKeyboardFocused
                                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 shadow-[inset_0_0_8px_rgba(59,130,246,0.15)]"
                                    : "border-white/10 hover:border-[#3b82f6]/40"
                                }`}
                                title={ch.name}
                              >
                                {/* Left active indicator dot */}
                                {isCurrent && (
                                  <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                                )}

                                {/* Heart indicator if favorite */}
                                {favorites.includes(ch.id) && (
                                  <div className="absolute top-1 right-1.5">
                                    <Heart size={8} className="text-red-500 fill-current" />
                                  </div>
                                )}

                                {/* Logo center aligned */}
                                <div className="scale-105 group-hover:scale-110 transition-transform duration-300">
                                  <ChannelLogo logo={ch.logo} name={ch.name} />
                                </div>

                                {/* Custom mini label that slides up on hover */}
                                <div className="absolute inset-x-0 bottom-0 bg-[#09090b]/90 py-1 px-1 rounded-b-xl border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                  <p className="text-sm font-black uppercase text-center text-gray-50 truncate tracking-wider leading-none">
                                    {ch.name}
                                  </p>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Default List View */
                        <div className="space-y-1.5 pb-2">
                          {filteredChannels.slice(0, visibleCount).map((ch, idx) => {
                            const isCurrent = selectedChannel?.id === ch.id || selectedChannel?.core === ch.core;
                            const isKeyboardFocused = idx === activeKeyboardIdx;
                            const currentProgram = ch.epg?.current;
                            const hasEpg = !!currentProgram;
                            
                            return (
                              <motion.div
                                key={ch.id}
                                id={`drawer-ch-${idx}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.16, delay: Math.min(idx * 0.006, 0.08) }}
                                onClick={() => {
                                  playChannel(ch);
                                  // Auto-dismiss on mobile or touchscreens
                                  if (window.innerWidth < 768) {
                                    setShowDrawer(false);
                                  }
                                }} onContextMenu={(e) => handleEditInteraction(e, ch)}
                                onTouchStart={() => handleTouchStart(ch)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                className={`flex items-center gap-3 p-2.5 hover:bg-[#27272a]/40 border transition-all duration-200 rounded-xl cursor-pointer group relative ${
                                  isCurrent 
                                    ? "bg-[#3b82f6]/5 border-[#3b82f6]/30 shadow-[0_4px_20px_-5px_rgba(59,130,246,0.15)]" 
                                    : isKeyboardFocused
                                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/20 shadow-[inset_0_0_8px_rgba(59,130,246,0.1)]"
                                    : "border-transparent hover:border-[#3b82f6]/20"
                                }`}
                              >
                                {/* Left active line indicator */}
                                {isCurrent && (
                                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#3b82f6] rounded-r" />
                                )}

                                {/* Stylized STB LCN Rank index */}
                                <span className="text-sm font-mono font-bold text-neutral-600 group-hover:text-[#3b82f6] transition-colors w-4.5 text-right flex-shrink-0 select-none">
                                  {(idx + 1).toString().padStart(2, '0')}
                                </span>
   
                                {/* Left: Component logo */}
                                <ChannelLogo logo={ch.logo} name={ch.name} />

                                {/* Center: Title & EPG Details */}
                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className={`text-[13px] font-black uppercase tracking-wider truncate leading-tight ${isCurrent ? "text-[#3b82f6]" : "text-neutral-200 group-hover:text-gray-50 transition-colors"}`}>
                                      {ch.name}
                                    </h4>
                                    {ch.qualityLabel && (
                                      <span className="text-[6px] px-1 py-0.5 bg-[#27272a]/80 text-gray-400 rounded border border-white/20 uppercase font-mono font-bold leading-none">
                                        {ch.qualityLabel}
                                      </span>
                                    )}
                                  </div>

                                  {hasEpg ? (
                                    <div className="space-y-0.5 mt-0.5">
                                      <p className="text-[13px] text-gray-400 font-light truncate leading-tight">
                                        {currentProgram.title}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        {currentProgram.category && (
                                          <span className="inline-block text-sm font-medium uppercase tracking-wider text-gray-500 leading-none">
                                            {currentProgram.category}
                                          </span>
                                        )}
                                        
                                        {currentProgram.start && (
                                          <span className="text-sm font-mono text-neutral-600 leading-none">
                                            {new Date(currentProgram.start).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Minimalist Timeline visual bar */}
                                      <div className="w-full bg-[#27272a] h-[1.5px] rounded-full overflow-hidden mt-1 max-w-[100px]">
                                        {(() => {
                                          const start = new Date(currentProgram.start).getTime();
                                          const stop = new Date(currentProgram.stop).getTime();
                                          const now = Date.now();
                                          const progress = Math.min(100, Math.max(0, ((now - start) / (stop - start)) * 100));
                                          return (
                                            <div 
                                              className="h-full bg-gradient-to-r from-[#3b82f6] to-orange-500 rounded-full" 
                                              style={{ width: `${progress}%` }} 
                                            />
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm font-semibold tracking-wider text-[#3b82f6]/30 uppercase mt-0.5">
                                      DIRECT CONTINU
                                    </p>
                                  )}
                                </div>

                                {/* Right Actions: Info/EPG & Favorite Toggle Buttons */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDetailedEpgChannel(ch);
                                    }}
                                    className="p-1 px-1.5 rounded bg-white/5 hover:bg-white/[0.05] text-gray-500 hover:text-[#3b82f6] transition-colors border border-white/10 cursor-pointer flex items-center gap-1"
                                    title="Détails du programme & Guide TV"
                                  >
                                    <Info size={9.5} className="text-gray-500 group-hover:text-[#3b82f6] transition-colors" />
                                    <span className="text-sm font-bold tracking-wider">EPG</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(ch.id);
                                    }}
                                    className="p-1 px-[7px] rounded text-gray-500 transition-colors cursor-pointer"
                                    title={favorites.includes(ch.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                                  >
                                    <Heart 
                                      size={9.5} 
                                      className={
                                        favorites.includes(ch.id) 
                                          ? "text-red-500 fill-current opacity-100" 
                                          : "opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-50"
                                      } 
                                    />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Pagination end threshold indicator for more fluid feedback */}
                      {filteredChannels.length > visibleCount && (
                        <div className="pt-3 pb-1 text-center">
                          <button
                            onClick={() => setVisibleCount(p => Math.min(filteredChannels.length, p + 40))}
                            className="px-3 py-1.5 bg-[#18181b]/40 hover:bg-white/5 hover:border-white/10 border border-transparent rounded-lg text-sm font-black tracking-widest text-gray-500 hover:text-gray-400 transition-all cursor-pointer"
                          >
                            Afficher plus ({filteredChannels.length - visibleCount} restants)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2 CONTENT: Server Settings */}
              {drawerTab === "settings" && (
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                  
                  {/* Quality standard setup filter section */}
                  <div className="space-y-2 border-b border-white/10 pb-5">
                    <h4 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                      <Sliders size={12} className="text-[#3b82f6]" />
                      Qualité d'affichage
                    </h4>
                    <p className="text-xs border-zinc-700/50 hover:bg-zinc-800 text-gray-500 leading-normal">
                      Filtrez l'affichage des flux en fonction de la définition vidéo détectée.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <button
                        onClick={() => setQualityFilter("all")}
                        className={`py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                          qualityFilter === "all" 
                            ? "bg-white text-black border-white" 
                            : "bg-[#27272a] text-gray-400 border-white/10 hover:border-neutral-700"
                        }`}
                      >
                        Tous les flux
                      </button>
                      <button
                        onClick={() => setQualityFilter("hd")}
                        className={`py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                          qualityFilter === "hd" 
                            ? "bg-[#3b82f6] text-gray-50 border-[#3b82f6]" 
                            : "bg-[#27272a] text-gray-400 border-white/10 hover:border-neutral-700"
                        }`}
                      >
                        HD Premium Uniquement
                      </button>
                    </div>
                  </div>

                  {/* Personal API endpoint overrides */}
                  <div className="space-y-3 border-b border-white/10 pb-5">
                    <h4 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                      <Plug size={12} className="text-[#3b82f6]" />
                      Point de terminaison (API)
                    </h4>
                    <span className="text-xs font-mono text-neutral-600 block leading-tight">
                      Actuel : {getAppBaseUrl()}
                    </span>
                    {isGitHubPages() && (
                      <div className="p-3 rounded-lg bg-[#3b82f6]/5 border border-[#3b82f6]/20 text-xs text-gray-400 leading-relaxed space-y-1.5 font-sans">
                        <p className="font-bold flex items-center gap-1.5 text-[#3b82f6]">
                          <Info size={12} /> Hébergement Statique Capturé !
                        </p>
                        <p>
                          Un hébergeur purement statique comme <strong>GitHub Pages</strong> ne peut pas exécuter le backend de décodage et de proxy nécessaire de façon autonome (NodeJS).
                        </p>
                        <p>
                          Pour y parer, l'application a <strong>automatiquement branché son API sur votre serveur Cloud Run actif</strong> ci-dessus. Grâce aux optimisations géolocalisées, le streaming de vos flux fonctionne désormais de manière native et fluide sans aucune configuration requise !
                        </p>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="https://votre-serveur.run.app"
                      value={customBackendUrl}
                      onChange={(e) => setCustomBackendUrl(e.target.value)}
                      className="w-full bg-[#18181b] border border-white/20 rounded-xl px-4 py-2.5 text-xs text-gray-50 focus:outline-none focus:border-[#3b82f6] font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const val = customBackendUrl.trim();
                          if (val) {
                            localStorage.setItem("backend_server_url", val.replace(/\/$/, ""));
                          } else {
                            localStorage.removeItem("backend_server_url");
                          }
                          loadChannels(true);
                        }}
                        className="flex-1 py-2 bg-[#27272a] hover:bg-white/10 text-gray-50 font-bold text-xs uppercase tracking-widest rounded-lg border border-white/10 transition-all text-center"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem("backend_server_url");
                          setCustomBackendUrl("");
                          loadChannels(true);
                        }}
                        className="px-4 py-2 bg-transparent hover:text-gray-50 text-gray-500 font-bold text-xs uppercase tracking-widest transition-all text-center"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  {/* Logo Customizer Override Section */}
                  <div className="space-y-3 border-b border-white/10 pb-5">
                    <h4 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#3b82f6]" />
                      Logos de chaînes personnalisés
                    </h4>
                    <p className="text-xs border-zinc-700/50 hover:bg-zinc-800 text-gray-500 leading-normal">
                      Associez un logo officiel ou de secours à n'importe quelle chaîne si son logo par défaut est manquant.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                          Sélectionner la chaîne
                        </label>
                        <select
                          value={selectedLogoChannelName}
                          onChange={(e) => {
                            setSelectedLogoChannelName(e.target.value);
                            const norm = normalizeName(e.target.value);
                            const savedLogos = getCustomLogos();
                            setCustomLogoUrlInput(savedLogos[norm] || "");
                            setLogoSettingsMessage("");
                          }}
                          className="w-full bg-[#18181b] border border-white/20 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-[#3b82f6] font-sans"
                        >
                          <option value="">-- Choisir une chaîne --</option>
                          {Array.from(new Set(channels.map(c => c.name))).sort().map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>

                      {selectedLogoChannelName && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                              URL du Logo officiel ou personnalisé
                            </label>
                            <input
                              type="text"
                              placeholder="https://example.com/logo.png"
                              value={customLogoUrlInput}
                              onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                              className="w-full bg-[#18181b] border border-white/20 rounded-xl px-4 py-2.5 text-xs text-gray-50 focus:outline-none focus:border-[#3b82f6] font-mono"
                            />
                          </div>

                          {(() => {
                            const norm = normalizeName(selectedLogoChannelName);
                            const suggested = fallbackLogoMap[norm];
                            if (suggested && customLogoUrlInput !== suggested) {
                              return (
                                <div className="p-3 rounded-xl bg-[#18181b]/60 border border-[#3b82f6]/20 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                      <Sparkles size={11} className="text-[#3b82f6]" />
                                      Logo officiel du dépôt GitHub détecté !
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 p-1.5 bg-[#09090b] rounded-lg border border-white/10 flex items-center justify-center">
                                      <img src={suggested} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-mono text-gray-400 truncate max-w-[200px]">
                                        {suggested.split("/").pop()}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomLogoUrlInput(suggested);
                                          setLogoSettingsMessage("✓ Logo officiel chargé. Cliquez sur Enregistrer.");
                                        }}
                                        className="mt-1 text-xs text-[#3b82f6] hover:underline font-black uppercase tracking-widest cursor-pointer block"
                                      >
                                        Appliquer ce logo
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {logoSettingsMessage && (
                            <p className="text-xs font-semibold text-[#3b82f6] transition-all">
                              {logoSettingsMessage}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                saveCustomLogo(selectedLogoChannelName, customLogoUrlInput);
                                setLogoSettingsMessage("✓ Logo enregistré avec succès !");
                              }}
                              className="flex-1 py-1.5 bg-[#3b82f6] text-gray-50 font-black text-xs uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all text-center"
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                saveCustomLogo(selectedLogoChannelName, "");
                                setCustomLogoUrlInput("");
                                setLogoSettingsMessage("✓ Réinitialisé");
                              }}
                              className="px-4 py-1.5 bg-[#27272a] text-gray-400 hover:text-gray-50 font-bold text-xs uppercase tracking-widest rounded-lg border border-white/10 transition-all text-center"
                            >
                              Réinitialiser
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Live export of customized playlist */}
                  <div className="space-y-3 border-b border-white/10 pb-5">
                    <h4 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                      <FileDown size={12} className="text-[#3b82f6]" />
                      Exporter vos chaînes
                    </h4>
                    <p className="text-xs border-zinc-700/50 hover:bg-zinc-800 text-gray-500 leading-relaxed">
                      Téléchargez un fichier de playlist M3U dynamique compatible avec VLC, Kodi, Enigma2, Smarters ou d'autres formats multimédias externes.
                    </p>
                    <button
                      onClick={handleDownloadM3U}
                      className="w-full py-2.5 bg-[#27272a] border border-white/10 hover:border-[#3b82f6]/30 hover:bg-white/10 rounded-xl text-gray-400 hover:text-gray-50 font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <FileDown size={12} className="text-[#3b82f6]" />
                      Télécharger la playlist .M3U
                    </button>
                  </div>

                  
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                 <Layers size={20} className="text-[#cc6000]" />
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-[#cc6000]">Compatibilité MHub</h3>
                   <p className="text-xs text-gray-500">Lokke, Watched, Vypn, Rokkr bundles</p>
                 </div>
              </div>
              <div className="space-y-3">
                 <input 
                   type="text" 
                   value={mhubInput}
                   placeholder="Entrez l'URL du bundle (ex: vavoo.to ou huhu.to)"
                   className="w-full bg-[#09090b] border border-white/10 focus:border-[#cc6000]/50 rounded-xl px-4 py-3 text-sm text-gray-50 placeholder-neutral-700 outline-none transition-all"
                   onChange={(e) => setMhubInput(e.target.value)}
                 />
                 <button 
                   className="w-full py-3 bg-[#cc6000]/10 text-[#cc6000] hover:bg-[#cc6000]/20 rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
                   onClick={handleMHubConnect}
                   disabled={mhubStatus.state === 'loading'}
                 >
                   {mhubStatus.state === 'loading' ? mhubStatus.message : 'Connecter le Bundle MHub'}
                 </button>
                 {mhubStatus.message && mhubStatus.state !== 'loading' && (
                   <p className={`text-xs mt-2 text-center ${mhubStatus.state === 'success' ? 'text-green-500' : mhubStatus.state === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                     {mhubStatus.message}
                   </p>
                 )}
              </div>
            </div>


            {/* Personal Xtream Codes client integrator config */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                        <Radio size={12} className="text-[#3b82f6]" />
                        Intégrateur Xtream Codes
                      </h4>
                      {xtreamInput.enabled && (
                        <span className="px-2 py-0.5 rounded text-sm font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 uppercase tracking-widest animate-pulse">
                          ACTIF
                        </span>
                      )}
                    </div>
                    <form onSubmit={handleSaveXtream} className="space-y-3">
                      <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                          Adresse du Serveur Xtream
                        </label>
                        <input
                          type="url"
                          placeholder="http://iptv-provider.com:8080"
                          value={xtreamInput.server}
                          onChange={(e) => setXtreamInput(p => ({ ...p, server: e.target.value }))}
                          className="w-full bg-[#18181b] border border-white/20 rounded-xl px-4 py-2.5 text-xs text-gray-50 focus:outline-none focus:border-[#3b82f6] font-sans"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                            Nom d'utilisateur
                          </label>
                          <input
                            type="text"
                            placeholder="username"
                            value={xtreamInput.username}
                            onChange={(e) => setXtreamInput(p => ({ ...p, username: e.target.value }))}
                            className="w-full bg-[#18181b] border border-white/20 rounded-xl px-4 py-2.5 text-xs text-gray-50 focus:outline-none focus:border-[#3b82f6] font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
                            Mot de passe
                          </label>
                          <input
                            type="password"
                            placeholder="password"
                            value={xtreamInput.password}
                            onChange={(e) => setXtreamInput(p => ({ ...p, password: e.target.value }))}
                            className="w-full bg-[#18181b] border border-white/20 rounded-xl px-4 py-2.5 text-xs text-gray-50 focus:outline-none focus:border-[#3b82f6] font-sans"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 py-1 select-none">
                        <input
                          type="checkbox"
                          id="cors_proxy"
                          checked={xtreamInput.useCorsProxy}
                          onChange={(e) => setXtreamInput(p => ({ ...p, useCorsProxy: e.target.checked }))}
                          className="rounded border-white/20 bg-[#18181b] text-[#3b82f6] focus:ring-[#3b82f6] w-3.5 h-3.5 cursor-pointer"
                        />
                        <label htmlFor="cors_proxy" className="text-xs font-bold text-gray-500 cursor-pointer hover:text-gray-400">
                          Activer le contournement CORS local (Proxy)
                        </label>
                      </div>

                      {xtreamStatus && (
                        <div className="p-3 bg-[#27272a] border border-white/10 rounded-xl text-xs text-gray-400 font-medium leading-relaxed">
                          ⚡ Statut : {xtreamStatus}
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-[#3b82f6] text-gray-50 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all text-center shadow-lg"
                        >
                          Enregistrer & Connecter
                        </button>
                        {xtreamInput.enabled && (
                          <button
                            type="button"
                            onClick={handleDisableXtream}
                            className="px-4 py-3 bg-red-950/40 hover:bg-red-950/80 text-red-500 border border-red-500/25 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                          >
                            Désactiver
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                </div>
              )}

              {/* Drawer Sticky Footer with Premium tag */}
              <div className="p-5 border-t border-white/10 bg-[#27272a]/30 flex items-center justify-between text-xs font-mono text-gray-500 flex-shrink-0">
                <span>DENDENTV PRO v3.4.1</span>
                <span className="text-[#3b82f6] font-bold uppercase tracking-widest">
                  ABONNÉ PREMIUM
                </span>
              </div>

              {channelToEdit && (
              <ChannelEditorModal 
                channel={channelToEdit}
                onClose={() => setChannelToEdit(null)}
                onSaved={() => { setChannelToEdit(null); setCustomLogosEvent(prev => prev + 1); }}
              />
            )}

            {/* Extended EPG Details Overlay Panel */}
              <AnimatePresence>
                {detailedEpgChannel && (
                  <ExtendedEpgPanel
                    channel={detailedEpgChannel}
                    onClose={() => setDetailedEpgChannel(null)}
                    onPlay={() => {
                      playChannel(detailedEpgChannel);
                      setDetailedEpgChannel(null);
                      if (window.innerWidth < 768) {
                        setShowDrawer(false);
                      }
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
