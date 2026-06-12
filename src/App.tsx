import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  RefreshCw, 
  Tv, 
  Heart, 
  Settings, 
  X, 
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
import { ExtendedEpgPanel } from "./components/ExtendedEpgPanel";
import { getApiUrl, getAppBaseUrl, isGitHubPages } from "./utils/urlHelper";
import { getCustomLogos, saveCustomLogo, normalizeName, fallbackLogoMap } from "./utils/logoHelper";
import { FALLBACK_CHANNELS, getFallbackLcnMap } from "./utils/fallbackChannels";
import { getFallbackEpgCurrentAndNext } from "./utils/fallbackEpg";
import { 
  getSavedXtreamCredentials, 
  saveXtreamCredentials, 
  setXtreamEnabled, 
  fetchXtreamCategoriesList, 
  fetchXtreamChannelsByCategory, 
  XtreamCategory,
  authenticateXtream
} from "./utils/xtreamClient";

interface DisplayChannel extends Channel {
  category: string;
  serverCount: number;
  core: string;
  qualityLabel?: string;
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
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<DisplayChannel | null>(null);
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
      return {
        ...c,
        name: cleanName(c.name),
        core,
        category: c.categoryOverride || categorizeChannel(c.name),
        qualityLabel: getQualityLabel(c.name)
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
  }, [channels, qualityFilter]);

  // Remove duplicate server variants for screen selection list
  const dedupeByCore = (list: DisplayChannel[]) => {
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
  };

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
      const list = dedupeByCore(categorisedList);
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
    const list = dedupeByCore(categorisedList);
    if (cat === "Tous") return list.length;
    if (cat === "Favoris") return list.filter(c => favorites.includes(c.id)).length;
    if (cat === "Récents") return recentIds.length;
    return list.filter(c => c.category === cat).length;
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
    let list = dedupeByCore(categorisedList);
    
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
              const fullChannelList = dedupeByCore(categorisedList);
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
    const list = dedupeByCore(categorisedList);
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
    <div id="root-layout" className="min-h-screen bg-black text-white antialiased overflow-hidden select-none relative font-sans">
      
      {/* Floating Selector Menu Trigger - Elegant visual anchor when not watching */}
      {!selectedChannel && (
        <button
          id="tv-hub-menu-btn"
          onClick={() => setShowDrawer(true)}
          className="fixed top-5 left-5 z-[80] flex items-center gap-2.5 px-4.5 py-3 bg-black/60 hover:bg-black/85 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-[#FF7900]/50 text-white font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-2xl group hover:scale-[1.03] active:scale-95 animate-fade-in"
        >
          <Tv size={14} className="text-[#FF7900] group-hover:rotate-12 transition-transform" />
          <span>Menu TV</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
        </button>
      )}

      {/* Main Full-page Video Player Area */}
      <main className="w-full h-screen relative bg-black flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 text-neutral-400 select-none">
            <div className="relative mb-2">
              <div className="w-20 h-20 border-4 border-[#FF7900]/10 border-t-[#FF7900] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Tv size={20} className="text-[#FF7900] animate-pulse" />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF7900] animate-pulse">
              Synchronisation des flux
            </p>
          </div>
        ) : selectedChannel ? (
          <div className="w-full h-full relative font-sans" id="theater-player-container">
            <HlsPlayer
              url={getActiveStreamUrl(selectedChannel)}
              channelName={selectedChannel.name}
              programTitle={selectedChannel.epg?.current?.title}
              programDesc={selectedChannel.epg?.current?.desc}
              programImage={selectedChannel.epg?.current?.image || selectedChannel.epg?.current?.icon}
              onBack={() => setSelectedChannel(null)}
              onMenuTV={() => setShowDrawer(true)}
              onFatalError={handleStreamError}
              isFavorite={favorites.includes(selectedChannel.id)}
              onToggleFavorite={() => toggleFavorite(selectedChannel.id)}
              fullViewport={true}
            />

            {/* STB-Style Floating Channel Zapping HUD Overlay */}
            <AnimatePresence>
              {showZappingHUD && zappingNumber && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -20 }}
                  className="absolute top-12 right-12 z-50 bg-neutral-950/90 border-2 border-[#FF7900]/40 rounded-2xl p-5 shadow-[0_0_40px_rgba(255,121,0,0.25)] flex flex-col items-center gap-1 cursor-none pointer-events-none select-none"
                >
                  <span className="text-[9px] font-black text-neutral-400 tracking-[0.25em] uppercase">ZAPPING DIRECT</span>
                  <div className="font-mono text-3xl font-black text-[#FF7900] tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span className="opacity-40 font-semibold">CH</span>
                    <span>{zappingNumber.padStart(3, "0")}</span>
                  </div>
                  <div className="w-12 h-1 bg-neutral-900 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.1, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-[#FF7900] to-orange-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : categorisedList.length > 0 ? (
          <div className="w-full h-full overflow-y-auto pt-24 pb-20 px-4 sm:px-8 flex flex-col gap-6 max-w-7xl mx-auto text-sans animate-fade-in select-none">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-[#FF7900] rounded-full shadow-[0_0_15px_#FF7900]" />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black text-[#FF7900] uppercase tracking-[0.35em] leading-none mb-1">DENDEN TV</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">Chaînes en Direct</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDrawerTab("recherche");
                    setShowDrawer(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 hover:bg-neutral-900 rounded-xl border border-white/5 hover:border-[#FF7900]/30 text-[10px] uppercase tracking-wider font-extrabold text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  <Search size={12} className="text-[#FF7900]" />
                  <span>Recherche</span>
                </button>
                <button
                  onClick={() => {
                    setDrawerTab("settings");
                    setShowDrawer(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 hover:bg-neutral-900 rounded-xl border border-white/5 hover:border-[#FF7900]/30 text-[10px] uppercase tracking-wider font-extrabold text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  <Settings size={12} className="text-[#FF7900]" />
                  <span>Paramètres</span>
                </button>
              </div>
            </div>

            {/* Square Grid of channel blocks */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 pb-8">
              {dedupeByCore(categorisedList).map((ch, idx) => {
                const isFavorite = favorites.includes(ch.id);
                return (
                  <motion.button
                    key={ch.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: Math.min(idx * 0.005, 0.12) }}
                    onClick={() => playChannel(ch)}
                    className="aspect-square rounded-2xl bg-[#151d2a]/50 hover:bg-[#151d2a]/95 border border-white/5 hover:border-[#FF7900]/40 flex flex-col items-center justify-center relative p-3 transition-all duration-300 group shadow-lg hover:scale-110 active:scale-95 cursor-pointer"
                    title={ch.name}
                  >
                    {/* Heart badge if bookmarked */}
                    {isFavorite && (
                      <div className="absolute top-1.5 right-1.5">
                        <Heart size={8} className="text-red-500 fill-current" />
                      </div>
                    )}

                    <div className="scale-105 group-hover:scale-115 transition-transform duration-300">
                      <ChannelLogo logo={ch.logo} name={ch.name} />
                    </div>

                    <div className="absolute inset-x-0 bottom-1.5 px-1 bg-black/5 rounded-b-2xl">
                      <p className="text-[6.5px] font-black uppercase text-neutral-400 group-hover:text-white truncate tracking-wider leading-none text-center">
                        {ch.name}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
            <Tv size={42} className="text-neutral-700 mb-2" />
            <p className="text-xs font-black uppercase tracking-widest text-[#FF7900]">
              Aucune chaîne disponible
            </p>
            <p className="text-[10.5px] text-neutral-500 max-w-sm">
              Configurez vos identifiants Xtream Codes ou réessayez avec de nouveaux serveurs M3U.
            </p>
            <button
              onClick={() => {
                setDrawerTab("settings");
                setShowDrawer(true);
              }}
              className="mt-4 px-4 py-2 bg-neutral-900 border border-white/5 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 text-white transition-all"
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
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black z-[110] backdrop-blur-sm cursor-pointer"
            />

            {/* Floating Obsidian navigation panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-neutral-950/95 backdrop-blur-3xl z-[120] border-r border-white/5 shadow-2xl flex flex-col h-full overflow-hidden"
            >
              <div className="p-5 pb-4 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-sans font-light text-white text-[15px] tracking-[0.2em] uppercase leading-none">
                      DENDEN <span className="font-semibold text-[#FF7900]">TV</span>
                    </h3>
                    <p className="text-[7px] font-semibold tracking-[0.15em] text-neutral-500 uppercase mt-1 leading-none">
                      PANEL DE CONTRÔLE
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 cursor-pointer hover:bg-white/[0.05] rounded-lg transition-all border border-transparent hover:border-white/5 text-neutral-500 hover:text-neutral-200"
                  title="Fermer le menu"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Drawer View Swapper Tabs (Ultra-sleek borderless inline segmented elements) */}
              <div className="px-5 py-2.5 bg-neutral-950/20 border-b border-white/[0.04] flex items-center justify-between text-[10px] tracking-[0.1em] uppercase font-bold text-neutral-500 flex-shrink-0">
                <div className="flex gap-5">
                  <button
                    onClick={() => setDrawerTab("channels")}
                    className={`pb-1 transition-all relative ${
                      drawerTab === "channels" 
                        ? "text-[#FF7900] font-black" 
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    Chaînes
                    {drawerTab === "channels" && (
                      <motion.div 
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#FF7900]" 
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setDrawerTab("settings")}
                    className={`pb-1 transition-all relative ${
                      drawerTab === "settings" 
                        ? "text-[#FF7900] font-black" 
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    Configuration
                    {drawerTab === "settings" && (
                      <motion.div 
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#FF7900]" 
                      />
                    )}
                  </button>
                </div>
                <div className="text-[7px] font-mono text-neutral-600 tracking-wider">
                  LIVE CONTROLLER
                </div>
              </div>

              {/* TAB 1 CONTENT: Live TV Selector */}
              {drawerTab === "channels" && (
                <div className="flex-grow flex flex-col overflow-hidden h-full">
                  
                  {/* Slim Horizontal Category Badge Scroller */}
                  <div className="px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0 border-b border-white/[0.03] bg-neutral-950/40">
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
                          className={`px-3 py-1.5 rounded-full text-[9px] font-medium tracking-wider flex-shrink-0 flex items-center gap-1.5 transition-all duration-255 border ${
                            isActive 
                              ? "bg-[#FF7900]/10 border-[#FF7900]/40 text-white shadow-[0_0_12px_rgba(255,121,0,0.1)]" 
                              : "bg-neutral-900/60 text-neutral-400 border-white/[0.04] hover:text-neutral-200 hover:bg-neutral-900/90"
                          }`}
                        >
                          <span className="text-[10px]">{details.icon}</span>
                          <span className="font-bold uppercase text-[7.5px] tracking-[0.05em]">{details.label}</span>
                          <span className="text-[7px] text-[#FF7900] bg-white/[0.04] px-1 rounded-sm font-mono font-bold">
                            {getCategoryCount(cat)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Main Pane: Clean single list */}
                  <div className="flex-grow flex flex-col h-full overflow-hidden">
                    
                    {/* Modern Refined Search Input & Sorting Controls Area */}
                    <div className="p-3 border-b border-white/[0.03] space-y-2 flex-shrink-0 bg-neutral-950/20">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" size={11} strokeWidth={2.5} />
                        <input
                          id="drawer-search-input"
                          type="text"
                          placeholder="Rechercher une chaîne..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-neutral-950/45 border border-white/[0.04] hover:border-white/[0.08] focus:border-[#FF7900]/30 rounded-lg pl-7.5 pr-8 py-1.5 text-[10px] text-white placeholder-neutral-600 focus:outline-none transition-all font-sans font-light"
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>

                      {/* Tactile Segmented Sorting Controls */}
                      <div className="flex items-center justify-between text-[7.5px] font-black uppercase tracking-wider text-neutral-500 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span>Trier par</span>
                          <div className="flex gap-1 bg-black/45 p-0.5 rounded-md border border-white/[0.03]">
                            <button
                              onClick={() => setSortBy("lcn")}
                              className={`px-2 py-0.5 rounded text-[7px] transition-all cursor-pointer ${
                                sortBy === "lcn" 
                                  ? "bg-[#FF7900] text-white font-black" 
                                  : "text-neutral-500 hover:text-neutral-300"
                              }`}
                            >
                              IPTV
                            </button>
                            <button
                              onClick={() => setSortBy("name")}
                              className={`px-2 py-0.5 rounded text-[7px] transition-all cursor-pointer ${
                                sortBy === "name" 
                                  ? "bg-[#FF7900] text-white font-black" 
                                  : "text-neutral-500 hover:text-neutral-300"
                              }`}
                            >
                              Nom (A-Z)
                            </button>
                            <button
                              onClick={() => setSortBy("favs")}
                              className={`px-2 py-0.5 rounded text-[7px] transition-all cursor-pointer flex items-center gap-0.5 ${
                                sortBy === "favs" 
                                  ? "bg-[#FF7900] text-white font-black" 
                                  : "text-neutral-500 hover:text-neutral-300"
                              }`}
                            >
                              ★ Favoris
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span>Affichage</span>
                          <div className="flex gap-1 bg-black/45 p-0.5 rounded-md border border-white/[0.03]">
                            <button
                              onClick={() => setDrawerChannelView("list")}
                              className={`px-2 py-0.5 rounded text-[7px] transition-all cursor-pointer flex items-center gap-1 ${
                                drawerChannelView === "list"
                                  ? "bg-[#FF7900] text-white font-black"
                                  : "text-neutral-500 hover:text-neutral-300"
                              }`}
                              title="Vue Liste"
                            >
                              <List size={8} />
                              Liste
                            </button>
                            <button
                              onClick={() => setDrawerChannelView("grid")}
                              className={`px-2 py-0.5 rounded text-[7px] transition-all cursor-pointer flex items-center gap-1 ${
                                drawerChannelView === "grid"
                                  ? "bg-[#FF7900] text-white font-black"
                                  : "text-neutral-500 hover:text-neutral-300"
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
                      <div className="px-3 py-2 border-b border-white/[0.03] bg-neutral-950/30 flex-shrink-0 animate-fade-in">
                        <p className="text-[7.5px] font-black uppercase text-neutral-500 tracking-wider mb-2 flex items-center gap-1">
                          <Clock size={9} className="text-[#FF7900]" />
                          Dernières lectures
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {recentIds
                            .map(id => dedupeByCore(categorisedList).find(c => c.id === id))
                            .filter((c): c is DisplayChannel => !!c)
                            .slice(0, 8)
                            .map((ch) => {
                              const isCurrent = selectedChannel?.id === ch.id;
                              return (
                                <button
                                  key={`recent-quick-${ch.id}`}
                                  onClick={() => playChannel(ch)}
                                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                                    isCurrent 
                                      ? "bg-[#FF7900]/10 border-[#FF7900]/30 text-white shadow-[0_0_8px_rgba(255,121,0,0.15)]" 
                                      : "bg-neutral-900 border-white/[0.03] hover:border-white/[0.1] text-neutral-300 hover:text-white"
                                  }`}
                                  title={`Lancer ${ch.name}`}
                                >
                                  <div className="w-4 h-4 rounded-md overflow-hidden bg-neutral-950 flex items-center justify-center p-0.5 border border-white/5 flex-shrink-0">
                                    {ch.logo ? (
                                      <img src={ch.logo} className="object-contain w-full h-full max-h-3" alt="" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Tv size={8} className="text-[#FF7900]" />
                                    )}
                                  </div>
                                  <span className="text-[9px] font-semibold truncate max-w-[70px] uppercase tracking-wide">
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
                          <div className="w-5 h-5 border-[1.5px] border-neutral-800 border-t-[#FF7900] rounded-full animate-spin" />
                          <p className="text-[7.5px] font-bold uppercase tracking-widest text-neutral-500 mt-1 animate-pulse">
                            Mise à jour...
                          </p>
                        </div>
                      ) : filteredChannels.length === 0 ? (
                        <div className="py-24 text-center space-y-1 px-4">
                          <Info size={14} className="text-neutral-600 mx-auto" />
                          <p className="text-[8.5px] uppercase font-black tracking-widest text-[#FF7900]">
                            Aucun flux disponible
                          </p>
                          <p className="text-[8px] text-neutral-500 leading-normal max-w-xs mx-auto">
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
                                  // Auto-dismiss on mobile or touchscreens
                                  if (window.innerWidth < 768) {
                                    setShowDrawer(false);
                                  }
                                }}
                                className={`aspect-square rounded-xl bg-neutral-900/40 hover:bg-neutral-900/80 border flex items-center justify-center relative transition-all duration-150 group shrink-0 ${
                                  isCurrent 
                                    ? "bg-white/[0.04] border-[#FF7900] shadow-[0_0_12px_rgba(255,121,0,0.15)]" 
                                    : isKeyboardFocused
                                    ? "bg-[#FF7900]/10 border-[#FF7900]/25 shadow-[inset_0_0_8px_rgba(255,121,0,0.1)]"
                                    : "border-white/[0.04] hover:border-white/[0.12]"
                                }`}
                                title={ch.name}
                              >
                                {/* Left active indicator dot */}
                                {isCurrent && (
                                  <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-[#FF7900]" />
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
                                <div className="absolute inset-x-0 bottom-0 bg-black/90 py-1 px-1 rounded-b-xl border-t border-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                  <p className="text-[6.5px] font-black uppercase text-center text-white truncate tracking-wider leading-none">
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
                                }}
                                className={`flex items-center gap-2 p-2 hover:bg-white/[0.02] border transition-all duration-150 rounded-lg cursor-pointer group relative ${
                                  isCurrent 
                                    ? "bg-white/[0.03] border-white/5" 
                                    : isKeyboardFocused
                                    ? "bg-[#FF7900]/10 border-[#FF7900]/25 shadow-[inset_0_0_8px_rgba(255,121,0,0.1)]"
                                    : "border-transparent"
                                }`}
                              >
                                {/* Left active line indicator */}
                                {isCurrent && (
                                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#FF7900] rounded-r" />
                                )}

                                {/* Stylized STB LCN Rank index */}
                                <span className="text-[8px] font-mono font-bold text-neutral-600 group-hover:text-[#FF7900] transition-colors w-4.5 text-right flex-shrink-0 select-none">
                                  {(idx + 1).toString().padStart(2, '0')}
                                </span>
   
                                {/* Left: Component logo */}
                                <ChannelLogo logo={ch.logo} name={ch.name} />

                                {/* Center: Title & EPG Details */}
                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className={`text-[11.5px] font-semibold uppercase tracking-wide truncate leading-tight ${isCurrent ? "text-[#FF7900]" : "text-neutral-200 group-hover:text-white transition-colors"}`}>
                                      {ch.name}
                                    </h4>
                                    {ch.qualityLabel && (
                                      <span className="text-[6px] px-1 py-0.5 bg-neutral-900 text-neutral-500 rounded border border-white/[0.04] uppercase font-mono font-bold leading-none">
                                        {ch.qualityLabel}
                                      </span>
                                    )}
                                  </div>

                                  {hasEpg ? (
                                    <div className="space-y-0.5 mt-0.5">
                                      <p className="text-[9px] text-neutral-400 font-light truncate leading-tight">
                                        {currentProgram.title}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        {currentProgram.category && (
                                          <span className="inline-block text-[7px] font-medium uppercase tracking-wider text-neutral-500 leading-none">
                                            {currentProgram.category}
                                          </span>
                                        )}
                                        
                                        {currentProgram.start && (
                                          <span className="text-[7px] font-mono text-neutral-600 leading-none">
                                            {new Date(currentProgram.start).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Minimalist Timeline visual bar */}
                                      <div className="w-full bg-neutral-900 h-[1.5px] rounded-full overflow-hidden mt-1 max-w-[100px]">
                                        {(() => {
                                          const start = new Date(currentProgram.start).getTime();
                                          const stop = new Date(currentProgram.stop).getTime();
                                          const now = Date.now();
                                          const progress = Math.min(100, Math.max(0, ((now - start) / (stop - start)) * 100));
                                          return (
                                            <div 
                                              className="h-full bg-gradient-to-r from-[#FF7900] to-orange-500 rounded-full" 
                                              style={{ width: `${progress}%` }} 
                                            />
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[7px] font-semibold tracking-wider text-[#FF7900]/30 uppercase mt-0.5">
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
                                    className="p-1 px-1.5 rounded bg-white/[0.02] hover:bg-white/[0.08] text-neutral-500 hover:text-[#FF7900] transition-colors border border-white/[0.04] cursor-pointer flex items-center gap-1"
                                    title="Détails du programme & Guide TV"
                                  >
                                    <Info size={9.5} className="text-neutral-500 group-hover:text-[#FF7900] transition-colors" />
                                    <span className="text-[6.5px] font-bold tracking-wider">EPG</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(ch.id);
                                    }}
                                    className="p-1 px-[7px] rounded text-neutral-500 transition-colors cursor-pointer"
                                    title={favorites.includes(ch.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                                  >
                                    <Heart 
                                      size={9.5} 
                                      className={
                                        favorites.includes(ch.id) 
                                          ? "text-red-500 fill-current opacity-100" 
                                          : "opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-white"
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
                            className="px-3 py-1.5 bg-neutral-950/40 hover:bg-neutral-900/60 hover:border-white/5 border border-transparent rounded-lg text-[7px] font-black tracking-widest text-neutral-500 hover:text-neutral-300 transition-all cursor-pointer"
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
                  <div className="space-y-2 border-b border-white/5 pb-5">
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Sliders size={12} className="text-[#FF7900]" />
                      Qualité d'affichage
                    </h4>
                    <p className="text-[9.5px] text-neutral-500 leading-normal">
                      Filtrez l'affichage des flux en fonction de la définition vidéo détectée.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <button
                        onClick={() => setQualityFilter("all")}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                          qualityFilter === "all" 
                            ? "bg-white text-black border-white" 
                            : "bg-neutral-900 text-neutral-400 border-white/5 hover:border-neutral-700"
                        }`}
                      >
                        Tous les flux
                      </button>
                      <button
                        onClick={() => setQualityFilter("hd")}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                          qualityFilter === "hd" 
                            ? "bg-[#FF7900] text-white border-[#FF7900]" 
                            : "bg-neutral-900 text-neutral-400 border-white/5 hover:border-neutral-700"
                        }`}
                      >
                        HD Premium Uniquement
                      </button>
                    </div>
                  </div>

                  {/* Personal API endpoint overrides */}
                  <div className="space-y-3 border-b border-white/5 pb-5">
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Plug size={12} className="text-[#FF7900]" />
                      Point de terminaison (API)
                    </h4>
                    <span className="text-[8.5px] font-mono text-neutral-600 block leading-tight">
                      Actuel : {getAppBaseUrl()}
                    </span>
                    {isGitHubPages() && (
                      <div className="p-3 rounded-lg bg-[#FF7900]/5 border border-[#FF7900]/20 text-[9px] text-neutral-300 leading-relaxed space-y-1.5 font-sans">
                        <p className="font-bold flex items-center gap-1.5 text-[#FF7900]">
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
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7900] font-mono"
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
                        className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[9px] uppercase tracking-widest rounded-lg border border-white/5 transition-all text-center"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem("backend_server_url");
                          setCustomBackendUrl("");
                          loadChannels(true);
                        }}
                        className="px-4 py-2 bg-transparent hover:text-white text-neutral-500 font-bold text-[9px] uppercase tracking-widest transition-all text-center"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  {/* Logo Customizer Override Section */}
                  <div className="space-y-3 border-b border-white/5 pb-5">
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#FF7900]" />
                      Logos de chaînes personnalisés
                    </h4>
                    <p className="text-[9.5px] text-neutral-500 leading-normal">
                      Associez un logo officiel ou de secours à n'importe quelle chaîne si son logo par défaut est manquant.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">
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
                          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-[#FF7900] font-sans"
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
                            <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                              URL du Logo officiel ou personnalisé
                            </label>
                            <input
                              type="text"
                              placeholder="https://example.com/logo.png"
                              value={customLogoUrlInput}
                              onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7900] font-mono"
                            />
                          </div>

                          {(() => {
                            const norm = normalizeName(selectedLogoChannelName);
                            const suggested = fallbackLogoMap[norm];
                            if (suggested && customLogoUrlInput !== suggested) {
                              return (
                                <div className="p-3 rounded-xl bg-neutral-950/60 border border-[#FF7900]/20 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-neutral-300 flex items-center gap-1">
                                      <Sparkles size={11} className="text-[#FF7900]" />
                                      Logo officiel du dépôt GitHub détecté !
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 p-1.5 bg-black rounded-lg border border-white/5 flex items-center justify-center">
                                      <img src={suggested} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[8px] font-mono text-neutral-400 truncate max-w-[200px]">
                                        {suggested.split("/").pop()}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomLogoUrlInput(suggested);
                                          setLogoSettingsMessage("✓ Logo officiel chargé. Cliquez sur Enregistrer.");
                                        }}
                                        className="mt-1 text-[8px] text-[#FF7900] hover:underline font-black uppercase tracking-widest cursor-pointer block"
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
                            <p className="text-[9px] font-semibold text-[#FF7900] transition-all">
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
                              className="flex-1 py-1.5 bg-[#FF7900] text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all text-center"
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
                              className="px-4 py-1.5 bg-neutral-900 text-neutral-400 hover:text-white font-bold text-[9px] uppercase tracking-widest rounded-lg border border-white/5 transition-all text-center"
                            >
                              Réinitialiser
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Live export of customized playlist */}
                  <div className="space-y-3 border-b border-white/5 pb-5">
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <FileDown size={12} className="text-[#FF7900]" />
                      Exporter vos chaînes
                    </h4>
                    <p className="text-[9.5px] text-neutral-500 leading-relaxed">
                      Téléchargez un fichier de playlist M3U dynamique compatible avec VLC, Kodi, Enigma2, Smarters ou d'autres formats multimédias externes.
                    </p>
                    <button
                      onClick={handleDownloadM3U}
                      className="w-full py-2.5 bg-neutral-900 border border-white/5 hover:border-[#FF7900]/30 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <FileDown size={12} className="text-[#FF7900]" />
                      Télécharger la playlist .M3U
                    </button>
                  </div>

                  {/* Personal Xtream Codes client integrator config */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                        <Radio size={12} className="text-[#FF7900]" />
                        Intégrateur Xtream Codes
                      </h4>
                      {xtreamInput.enabled && (
                        <span className="px-2 py-0.5 rounded text-[7px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 uppercase tracking-widest animate-pulse">
                          ACTIF
                        </span>
                      )}
                    </div>
                    <form onSubmit={handleSaveXtream} className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                          Adresse du Serveur Xtream
                        </label>
                        <input
                          type="url"
                          placeholder="http://iptv-provider.com:8080"
                          value={xtreamInput.server}
                          onChange={(e) => setXtreamInput(p => ({ ...p, server: e.target.value }))}
                          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7900] font-sans"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                            Nom d'utilisateur
                          </label>
                          <input
                            type="text"
                            placeholder="username"
                            value={xtreamInput.username}
                            onChange={(e) => setXtreamInput(p => ({ ...p, username: e.target.value }))}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7900] font-sans"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                            Mot de passe
                          </label>
                          <input
                            type="password"
                            placeholder="password"
                            value={xtreamInput.password}
                            onChange={(e) => setXtreamInput(p => ({ ...p, password: e.target.value }))}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF7900] font-sans"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 py-1 select-none">
                        <input
                          type="checkbox"
                          id="cors_proxy"
                          checked={xtreamInput.useCorsProxy}
                          onChange={(e) => setXtreamInput(p => ({ ...p, useCorsProxy: e.target.checked }))}
                          className="rounded border-white/10 bg-neutral-950 text-[#FF7900] focus:ring-[#FF7900] w-3.5 h-3.5 cursor-pointer"
                        />
                        <label htmlFor="cors_proxy" className="text-[9px] font-bold text-neutral-500 cursor-pointer hover:text-neutral-400">
                          Activer le contournement CORS local (Proxy)
                        </label>
                      </div>

                      {xtreamStatus && (
                        <div className="p-3 bg-neutral-900 border border-white/5 rounded-xl text-[8.5px] text-neutral-400 font-medium leading-relaxed">
                          ⚡ Statut : {xtreamStatus}
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-[#FF7900] text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all text-center shadow-lg"
                        >
                          Enregistrer & Connecter
                        </button>
                        {xtreamInput.enabled && (
                          <button
                            type="button"
                            onClick={handleDisableXtream}
                            className="px-4 py-3 bg-red-950/40 hover:bg-red-950/80 text-red-500 border border-red-500/25 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
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
              <div className="p-5 border-t border-white/5 bg-neutral-900/30 flex items-center justify-between text-[8px] font-mono text-neutral-500 flex-shrink-0">
                <span>DENDENTV PRO v3.4.1</span>
                <span className="text-[#FF7900] font-bold uppercase tracking-widest">
                  ABONNÉ PREMIUM
                </span>
              </div>

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
