import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  RefreshCw, 
  Tv, 
  HelpCircle, 
  Radio,
  FileDown,
  Info,
  ChevronRight,
  Play,
  Share2,
  Heart,
  Trophy,
  Calendar,
  Clock,
  User,
  Settings,
  X,
  Bell,
  BellOff,
  Plus,
  Film,
  Music,
  Layers,
  Activity,
  Sparkles,
  Cpu,
  Monitor,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  LogOut,
  CreditCard,
  Zap,
  Globe,
  Plug
} from "lucide-react";
import { Channel, RegisteredUser } from "./types";
import { HlsPlayer } from "./components/HlsPlayer";
import { ChannelCarousel } from "./components/ChannelCarousel";
import { ProgramCard } from "./components/ProgramCard";
import { BottomNav } from "./components/BottomNav";
import { Sidebar } from "./components/Sidebar";
import { ChannelGrid } from "./components/ChannelGrid";
import { ChannelAdmin } from "./components/ChannelAdmin";
import { EpgTimeline } from "./components/EpgTimeline";
import { SplashScreen } from "./components/SplashScreen";
import { SportsCenter } from "./components/SportsCenter";
import { AuthComponent } from "./components/AuthComponent";
import { AccessCodeGate } from "./components/AccessCodeGate";
import { formatEpgTime, getEpgProgress } from "./utils/epgUtils";
import { useFirebase } from "./context/FirebaseProvider";

import { Integrations } from "./components/Integrations";

interface DisplayChannel extends Channel {
  category: string;
  serverCount: number;
  core: string;
  qualityLabel?: string;
}

interface ChannelLogoProps {
  logo?: string;
  name: string;
  className?: string;
}

function ChannelLogo({ logo, name, className = "w-full h-full object-contain" }: ChannelLogoProps) {
  const [error, setError] = useState(false);
  
  const initials = useMemo(() => {
    return name
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .map(p => p[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || name.slice(0, 2).toUpperCase();
  }, [name]);

  const gradientClass = useMemo(() => {
    const gradients = [
      "from-sky-600 to-indigo-600",
      "from-violet-600 to-fuchsia-600",
      "from-rose-600 to-pink-600",
      "from-emerald-600 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-purple-600 to-blue-600"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }, [name]);

  if (!logo || error) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradientClass} rounded-xl overflow-hidden border border-white/10 shadow-[inner_0_4px_12px_rgba(255,255,255,0.15)] p-1.5 relative group-hover:scale-105 transition-transform duration-500`}>
        {/* Subtle television scanlines design overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none rounded-xl" />
        
        {/* Slick top gloss overlay */}
        <div className="absolute top-0 inset-x-0 h-[45%] bg-white/10 rounded-t-xl skew-y-1 pointer-events-none" />
        
        <span className="text-white font-[900] text-center text-[10px] leading-none tracking-tight select-none uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] z-10 font-sans">
          {initials}
        </span>
        <span className="text-white/60 text-[6px] font-mono leading-none tracking-widest uppercase mt-1 z-10 font-[850] max-w-full truncate px-0.5">
          {name.slice(0, 8)}
        </span>
      </div>
    );
  }

  return (
    <img 
      src={logo} 
      alt={name}
      loading="lazy"
      className={className} 
      onError={() => setError(true)} 
      referrerPolicy="no-referrer"
    />
  );
}

// Helper to normalize channel names to group identical or backup servers together
function getCoreName(name: string): string {
  let n = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase()
    .replace(/\b(fr|be|ch|ca|vip|ts|m3u8|tnt|raw|hd|fhd|uhd|4k|sd|raw|backup|s1|s2|s3)\s*[:|-]\s*/gi, "")
    .replace(/\s*[\[\(](HD|SD|V2|Backup|FR|MULT|7\/24|Main|24\/7|HEVC|480p|1080p|720p|4K|AUTO|OLD|TS|M3U8|VIP|6|7)[\]\)]/gi, "")
    .replace(/\s+\([^)]*\)/g, "") // Supprime les parenthèses (x) et leur contenu
    .replace(/\s+\[[^\]]*\]/g, "") // Supprime les crochets [x] et leur contenu
    .replace(/\s+fhd\s*/gi, "")
    .replace(/\s+hd\s*/gi, "")
    .replace(/\s+sd\s*/gi, "")
    .replace(/\s+4k\s*/gi, "")
    .replace(/\s*:\s*/g, "")
    .replace(/\s*-+\s*/g, "")
    .replace(/\s+/g, "") // Enlève les espaces restants
    .replace(/[^a-z0-9+]/g, ""); // Ne garde que lettres, chiffres, et '+'

  // Aliases alignment with server
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

let LCN_MAP: Record<string, number> = {
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

function getChannelSortWeight(c: { name: string; category: string; core: string; qualityLabel?: string }): number {
  const core = c.core;
  let baseWeight = 9999;
  
  if (LCN_MAP[core] !== undefined) {
    baseWeight = LCN_MAP[core];
  } else {
    // Base values for categories when not explicitly defined in LCN_MAP
    let categoryBase = 5000;
    switch (c.category) {
      case "TNT & Généralistes":
        categoryBase = 1000;
        break;
      case "Sports":
        categoryBase = 2000;
        break;
      case "Cinéma & Séries":
        categoryBase = 3000;
        break;
      case "Documentaires":
        categoryBase = 4000;
        break;
      case "Actualités":
        categoryBase = 4500;
        break;
      case "Belgique 🇧🇪":
        categoryBase = 5000;
        break;
      case "Jeunesse":
        categoryBase = 6000;
        break;
      case "Divertissement":
        categoryBase = 7000;
        break;
      case "Musique":
        categoryBase = 8000;
        break;
      case "À La Carte":
        categoryBase = 9000;
        break;
    }

    // Fractional key based on core name characters (alphabetical fallback)
    let alphaVal = 0;
    for (let i = 0; i < Math.min(core.length, 5); i++) {
       const code = core.charCodeAt(i) - 97;
       alphaVal += (code >= 0 && code < 26 ? code : 25) / Math.pow(100, i + 1);
    }
    baseWeight = categoryBase + alphaVal;
  }

  // Add micro-fraction for stream quality to sort higher quality first within the same core
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


export default function App() {
  const { user, loading: firebaseLoading } = useFirebase();
  const [isAuthorized, setIsAuthorized] = useState(() => localStorage.getItem('isAuthorized') === 'true');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  
  // Auth state - simplified to use Firebase
  const isAuthenticated = !!user;
  const userEmail = user?.email || "";
  const userName = user?.displayName || user?.email?.split('@')[0] || "Utilisateur";
  
  const setIsAuthenticated = (val: boolean) => {};
  const setUserEmail = (val: string) => {};
  const setUserName = (val: string) => {};
  
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    const saved = localStorage.getItem("registeredUsers");
    if (saved) return JSON.parse(saved);
    // Initial admin account setup if empty
    const defaultAdmin: RegisteredUser = {
      id: "admin-1",
      name: "Utilisateur",
      email: "utilisateur@exemple.com",
      password: "admin", 
      registeredAt: new Date().toISOString(),
      role: "admin",
      subscriptionStatus: "active",
      renewalDate: "2027-01-01"
    };
    return [defaultAdmin];
  });
  const [adminView, setAdminView] = useState<"overview" | "users" | "channels">("overview");
  const [teamSearch, setTeamSearch] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", code: "" });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("Tous");
  const [homeCategory, setHomeCategory] = useState("Tous");
  const [qualityFilter, setQualityFilter] = useState<"all" | "hd">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("accueil");
  const [showFullEpg, setShowFullEpg] = useState(false);
  const [sportsSubTab, setSportsSubTab] = useState<string>("program");
  const [selectedChannel, setSelectedChannel] = useState<DisplayChannel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedChannels, setFailedChannels] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<number[]>([]);

  // Load favorites from backend or localStorage
  useEffect(() => {
    if (user) {
        fetch(`/api/favorites/${user.uid}`)
            .then(r => r.json())
            .then(setFavorites)
            .catch(e => console.error("Error loading favorites:", e));
    } else {
        const saved = localStorage.getItem("favorites");
        if (saved) setFavorites(JSON.parse(saved));
    }
  }, [user]);
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteTeams");
    return saved ? JSON.parse(saved) : ["France", "Belgique"];
  });
  const [matchReminders, setMatchReminders] = useState<(string | number)[]>(() => {
    const saved = localStorage.getItem("matchReminders");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeReminders, setActiveReminders] = useState<{id: number, title: string}[]>([]);
  const [history, setHistory] = useState<number[]>(() => {
    const saved = localStorage.getItem("watchHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("channelPlayCounts");
    return saved ? JSON.parse(saved) : {};
  });
  const [homeSorting, setHomeSorting] = useState<'standard' | 'popular'>(() => {
    const saved = localStorage.getItem("homeSorting");
    return (saved as 'standard' | 'popular') || 'standard';
  });
  const [prefetchedEpg, setPrefetchedEpg] = useState<Record<string, any>>({});
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  // Persist favorites when user is not logged in
  useEffect(() => {
    if (!user) {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, user]);

  useEffect(() => {
    localStorage.setItem("favoriteTeams", JSON.stringify(favoriteTeams));
  }, [favoriteTeams]);

  useEffect(() => {
    localStorage.setItem("matchReminders", JSON.stringify(matchReminders));
  }, [matchReminders]);

  useEffect(() => {
    localStorage.setItem("watchHistory", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("channelPlayCounts", JSON.stringify(playCounts));
  }, [playCounts]);

  useEffect(() => {
    localStorage.setItem("homeSorting", homeSorting);
  }, [homeSorting]);

  // Background check for match reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      // For the purpose of this demo, we'll simulate match times relative to current local time
      // In a real app, you'd parse match.date and match.time
      
      worldCupMatches.forEach(match => {
        if (matchReminders.includes(match.id)) {
           // Simple simulation: if we are within the same minute as match time (conceptual)
           // We'll just check if it matches a hardcoded "reminder trigger" for the demo
           // Or better: just show a simple notification when they turn it on if it's "today"
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [matchReminders]);

  const toggleMatchReminder = (matchId: string | number, matchTitle: string) => {
    setMatchReminders(prev => {
      const isSet = prev.includes(matchId);
      if (!isSet) {
        // Show immediate visual feedback
        const reminder = { id: Date.now(), title: `Rappel activé pour: ${matchTitle}` };
        setActiveReminders(prevTr => [...prevTr, reminder]);
        setTimeout(() => {
          setActiveReminders(prevTr => prevTr.filter(r => r.id !== reminder.id));
        }, 4000);
        return [...prev, matchId];
      } else {
        return prev.filter(id => id !== matchId);
      }
    });
  };

  const addToHistory = (id: number) => {
    setHistory(prev => [id, ...prev.filter(h => h !== id)].slice(0, 10));
    const findChan = categorisedList.find(c => c.id === id);
    if (findChan && findChan.core) {
      setPlayCounts(prev => ({
        ...prev,
        [findChan.core]: (prev[findChan.core] || 0) + 1
      }));
    }
  };

  const prefetchEpg = async (channelName: string) => {
    if (prefetchedEpg[channelName]) return;
    try {
      const response = await fetch(`/api/epg/${encodeURIComponent(channelName)}`);
      const data = await response.json();
      if (data.success) {
        setPrefetchedEpg(prev => ({ ...prev, [channelName]: data.programmes }));
      }
    } catch (err) {
      console.error("Prefetch failed:", err);
    }
  };

  const selectChannel = (channel: DisplayChannel) => {
    setIsPlayerLoading(true);
    setSelectedChannel(channel);
    addToHistory(channel.id);
    // Smooth transition simulation
    setTimeout(() => setIsPlayerLoading(false), 500);
  };

  const toggleFavorite = async (id: number) => {
    const isFav = favorites.includes(id);
    
    // Optimistic update
    setFavorites(prev => 
      isFav ? prev.filter(f => f !== id) : [...prev, id]
    );

    if (user) {
        if (isFav) {
            await fetch(`/api/favorites/${user.uid}/${id}`, { method: 'DELETE' });
        } else {
            await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, channelId: id })
            });
        }
    }
  };

  const toggleFavoriteTeam = (teamName: string) => {
    setFavoriteTeams(prev => 
      prev.includes(teamName) ? prev.filter(t => t !== teamName) : [...prev, teamName]
    );
  };

  // Live countdown to the World Cup 2026 Kickoff French Time (June 11, 2026 @ 22:00 -> UTC 2020/2026-06-11T20:00:00Z)
  const [timeLeft, setTimeLeft] = useState({ days: 6, hours: 12, minutes: 5, seconds: 40 });

  useEffect(() => {
    const kickoffTime = new Date("2026-06-11T20:00:00Z").getTime();

    const calculateTimer = () => {
      const now = Date.now();
      const diff = kickoffTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimer();
    const intervalId = setInterval(calculateTimer, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch channels from our Express API on mount
  const loadChannels = async (forceRefetch = false) => {
    if (forceRefetch) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = `/api/channels${forceRefetch ? "?force=true" : ""}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && Array.isArray(data.channels)) {
        if (data.lcnMap) {
          LCN_MAP = data.lcnMap;
        }
        setChannels(data.channels);
        // Do NOT auto-play/auto-select TF1 on open to allow displaying the ready-to-stream grid instead!
      } else {
        setError(data.error || "Une erreur est survenue lors du chargement des chaînes.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Impossible de contacter le serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  // Categorizer rule-set based on channel name
  const categorizeChannel = (name: string): string => {
    const n = name.toLowerCase();
    
    // News first for priority
    if (n.includes("france info") || n.includes("bfm") || n.includes("cnews") || n.includes("lci") || n.includes("france 24") || n.includes("euronews") || n.includes("info") || n.includes("météo")) {
      return "Actualités";
    }
    
    // Sports
    if (n.includes("sport") || n.includes("equipe") || n.includes(" l'équipe") || n.includes("bein") || n.includes("foot") || n.includes("rmc sport") || n.includes("golf") || n.includes("chasse") || n.includes("auto moto") || n.includes("eurosport")) {
      return "Sports";
    }
    
    // Kids
    if (n.includes("gulli") || n.includes("disney") || n.includes("cartoon") || n.includes("nickelodeon") || n.includes("manga") || n.includes("jeunesse") || n.includes("canald") || n.includes("tiji") || n.includes("boom")) {
      return "Jeunesse";
    }
    
    // Cinema
    if (n.includes("cine") || n.includes("ciné") || n.includes("action") || n.includes("canal+") || n.includes("ocs") || n.includes("series") || n.includes("séries") || n.includes("film") || n.includes("paramount") || n.includes("polar") || n.includes("warner") || n.includes("syfy") || n.includes("altice studio")) {
      return "Cinéma & Séries";
    }
    
    // Documentaries
    if (n.includes("rmc decouverte") || n.includes("découverte") || n.includes("science") || n.includes("planete") || n.includes("planète") || n.includes("hist") || n.includes("trek") || n.includes("museum") || n.includes("animaux") || n.includes("ushuaia") || n.includes("national geographic") || n.includes("nat geo")) {
      return "Documentaires";
    }

    // Music
    if (n.includes("cstar") || n.includes("nrj hits") || n.includes("mtv") || n.includes("m6 music") || n.includes("trace") || n.includes("rfm") || n.includes("melody")) {
      return "Musique";
    }

    // À La Carte channels specifically
    if (n.includes("à la carte") || n.includes("alacarte")) {
      return "À La Carte";
    }

    // Generalist / TNT
    if (n.includes("tf1") || n.includes("france 2") || n.includes("france 3") || n.includes("france 4") || n.includes("france 5") || n.includes("m6") || n.includes("w9") || n.includes("c8") || n.includes("tmc") || n.includes("tfx") || n.includes("nrj 12") || n.includes("lcp") || n.includes("public senat") || n.includes("6ter") || n.includes("rmc story") || n.includes("cherie 25") || /\barte\b/.test(n) || n.includes("arte hd") || n.includes("france o") || n.includes("culturebox")) {
      return "TNT & Généralistes";
    }

    // Belgian / Swiss siblings
    if (n.includes("rtbf") || n.includes("rts") || n.includes("la une") || n.includes("tipik") || n.includes("la trois") || n.includes("rtl tvi") || n.includes("club rtl") || n.includes("plug rtl") || n.includes("ab3") || n.includes("abxplore") || n.includes("vtm") || n.includes("ln24") || n.includes("bel RTL") || n.includes("belgian")) {
      return "Belgique 🇧🇪";
    }
    
    return "Divertissement";
  };

  // Nettoyer les noms des chaînes
  const cleanName = (name: string) => {
    let cleaned = name
      // Remove country prefixes like FR | BE | CH | etc
      .replace(/^(FR|BE|CH|LU|CA|VIP|OPT|HEVC|4K|FHD|HD|SD|LOW|M|S1|S2|S3|TV|WEB|IPTV)\s*[:|-]\s*/gi, "")
      .replace(/^(FR|BE|CH|LU|CA|VIP|OPT|HE)\b\s*/gi, "")
      // Remove suffixes like [HD], (SD), (6), (7), etc
      .replace(/\s*[\[\(](HD|SD|V2|Backup|FR|MULT|7\/24|Main|24\/7|HEVC|480p|1080p|720p|4K|AUTO|OLD|TS|M3U8|VIP|FHD|UHD|H265|6|7)[\]\)]/gi, "")
      // Remove common trailing labels
      .replace(/\s+(HD|SD|FHD|UHD|4K|HEVC|RAW|BACKUP|TS|M3U8|TNT|S1|S2|S3|VIP|VOD|ADULT|7\/24|1080P|720P|6|7)$|^(HD|SD|FHD|UHD|4K|HEVC|RAW|BACKUP|TS|M3U8|TNT|S1|S2|S3|VIP)\s+/gi, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    // Cas spécifiques pour TNT Française et Belgique
    const lower = cleaned.toLowerCase();
    // Major Bouquets Standardisation
    if (lower.includes("canal+") || lower.startsWith("canal +")) {
      cleaned = cleaned.replace(/canal\s*\+/gi, "Canal+");
      if (lower.includes("sport")) cleaned = "Canal+ Sport";
      if (lower.includes("cinema") || lower.includes("ciné")) cleaned = "Canal+ Cinéma";
      if (lower.includes("foot")) cleaned = "Canal+ Foot";
      if (lower.includes("series") || lower.includes("séries")) cleaned = "Canal+ Séries";
      if (lower.includes("kids")) cleaned = "Canal+ Kids";
      if (lower.includes("docs")) cleaned = "Canal+ Docs";
    }
    
    if (lower.includes("bein sport")) {
      cleaned = cleaned.replace(/bein\s*sports?\s*/gi, "beIN Sports ");
      if (lower.includes(" 1")) cleaned = "beIN Sports 1";
      if (lower.includes(" 2")) cleaned = "beIN Sports 2";
      if (lower.includes(" 3")) cleaned = "beIN Sports 3";
      if (lower.includes(" max")) {
        const num = lower.match(/max\s*(\d+)/)?.[1];
        cleaned = num ? `beIN Sports MAX ${num}` : "beIN Sports MAX";
      }
    }

    if (lower.includes("rmc sport")) {
       if (lower.includes(" 1")) cleaned = "RMC Sport 1";
       if (lower.includes(" 2")) cleaned = "RMC Sport 2";
       if (lower.includes("uhd")) cleaned = "RMC Sport UHD";
    }

    if (lower.includes("eurosport")) {
       if (lower.includes(" 1")) cleaned = "Eurosport 1";
       if (lower.includes(" 2")) cleaned = "Eurosport 2";
    }

    if (lower.includes("ocs")) {
      if (lower.includes("max")) cleaned = "OCS Max";
      if (lower.includes("geants") || lower.includes("géants")) cleaned = "OCS Géants";
      if (lower.includes("pulp")) cleaned = "OCS Pulp";
    }

    if (lower.includes("cine+") || lower.includes("ciné+")) {
      cleaned = cleaned.replace(/cine\s*\+/gi, "Ciné+");
      if (lower.includes("premier")) cleaned = "Ciné+ Premier";
      if (lower.includes("frisson")) cleaned = "Ciné+ Frisson";
      if (lower.includes("emotion") || lower.includes("émotion")) cleaned = "Ciné+ Émotion";
      if (lower.includes("famiz")) cleaned = "Ciné+ Famiz";
      if (lower.includes("club")) cleaned = "Ciné+ Club";
      if (lower.includes("classic")) cleaned = "Ciné+ Classic";
    }

    // France Télévisions
    if (lower.includes("france 2") || lower === "france2") return "France 2";
    if (lower.includes("france 3") || lower === "france3") return "France 3";
    if (lower.includes("france 4") || lower === "france4") return "France 4";
    if (lower.includes("france 5") || lower === "france5") return "France 5";
    if (lower.includes("france info") || lower === "franceinfo") return "France Info";
    if (lower.includes("culturebox")) return "Culturebox";
    if (lower.includes("france o") || lower === "franceo") return "France Ô";
    
    // Autres TNT
    if (lower.includes("tf1") && !lower.includes("series")) return "TF1";
    if (lower.includes("tf1 series") || lower.includes("tf1 séries")) return "TF1 Séries Films";
    if (lower.includes("m6") && !lower.includes("music")) return "M6";
    if (lower.includes("w9")) return "W9";
    if (lower.includes("tmc")) return "TMC";
    if (lower.includes("tfx")) return "TFX";
    if (lower.includes("nrj 12") || lower === "nrj12") return "NRJ 12";
    if (lower.includes("lcp")) return "LCP";
    if (lower.includes("public senat") || lower.includes("public sénat")) return "Public Sénat";
    if (lower.includes("bfm tv") || lower === "bfmtv") return "BFM TV";
    if (lower.includes("cnews")) return "CNews";
    if (lower.includes("cstar")) return "CStar";
    if (lower.includes("gulli")) return "Gulli";
    if (lower.includes("lequipe") || lower.includes("l'equipe")) return "L'Équipe";
    if (lower.includes("6ter")) return "6ter";
    if (lower.includes("rmc story") || lower === "rmcstory") return "RMC Story";
    if (lower.includes("rmc decouverte") || lower === "rmcdecouverte") return "RMC Découverte";
    if (lower.includes("cherie 25") || lower === "cherie25") return "Chérie 25";
    if (lower === "arte" || lower === "arte hd") return "ARTE";
    if (lower.includes("lci")) return "LCI";

    // Canal+ Group
    if (lower.includes("canal+ foot")) return "Canal+ Foot";
    if (lower.includes("canal+ sport")) return "Canal+ Sport";
    if (lower.includes("canal+ cinema") || lower.includes("canal+ ciné")) return "Canal+ Cinéma";
    if (lower.includes("canal+ series") || lower.includes("canal+ séries")) return "Canal+ Séries";
    if (lower.includes("canal+ box office")) return "Canal+ Box Office";
    if (lower === "canal+" || lower === "canal plus" || lower.includes("canal+ hd")) return "Canal+";
    
    // Belgique
    if (lower.includes("la une")) return "La Une";
    if (lower.includes("la deux")) return "La Deux";
    if (lower.includes("la trois")) return "La Trois";
    if (lower.includes("tipik")) return "Tipik";
    if (lower.includes("rtl tvi")) return "RTL TVI";
    if (lower.includes("club rtl")) return "Club RTL";
    if (lower.includes("plug rtl")) return "Plug RTL";

    // Sports & Others
    if (lower.includes("bein sports 1") || lower === "bein1") return "beIN Sports 1";
    if (lower.includes("bein sports 2") || lower === "bein2") return "beIN Sports 2";
    if (lower.includes("bein sports 3") || lower === "bein3") return "beIN Sports 3";
    if (lower.includes("eurosport 1") || lower === "eurosport1") return "EuroSport 1";
    if (lower.includes("eurosport 2") || lower === "eurosport2") return "EuroSport 2";
    if (lower.includes("rmc sport 1")) return "RMC Sport 1";
    if (lower.includes("rmc sport 2")) return "RMC Sport 2";
    if (lower.includes("paris premiere") || lower === "parispremiere") return "Paris Première";
    if (lower.includes("teva")) return "Téva";
    if (lower.includes("rtl9")) return "RTL9";
    if (lower.includes("ushuaia")) return "Ushuaïa TV";
    if (lower.includes("tv breizh")) return "TV Breizh";
    if (lower.includes("serie club") || lower === "serieclub") return "Série Club";
    if (lower.includes("mangas")) return "Mangas";
    if (lower.includes("game one")) return "Game One";
    if (lower.includes("disney channel")) return "Disney Channel";
    if (lower.includes("disney junior")) return "Disney Junior";
    if (lower.includes("nickelodeon")) return "Nickelodeon";
    if (lower.includes("cartoon network")) return "Cartoon Network";
    if (lower.includes("boomerang")) return "Boomerang";
    if (lower.includes("planete+")) return "Planète+";
    if (lower.includes("histoire tv")) return "Histoire TV";
    if (lower.includes("chasse et peche")) return "Chasse et Pêche";
    if (lower.includes("science et vie") || lower.includes("science & vie")) return "Science & Vie TV";
    if (lower.includes("m6 music") || lower === "m6music") return "M6 Music";
    if (lower.includes("mtv hits")) return "MTV Hits";
    if (lower.includes("mtv") && !lower.includes("hits")) return "MTV";
    if (lower.includes("trace urban") || lower === "traceurban") return "Trace Urban";
    if (lower.includes("rfm tv") || lower === "rfmtv") return "RFM TV";
    if (lower.includes("mcm top") || lower === "mcmtop") return "MCM Top";
    if (lower.includes("mcm") && !lower.includes("top")) return "MCM";
    if (lower.includes("melody")) return "Melody";
    if (lower.includes("histoire tv") || lower.includes("histoire") || lower === "histoiretv") return "Histoire TV";
    
    return cleaned;
  };

  // Detecter la qualité à partir du nom original
  const getQualityLabel = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes("(6)")) return "SD";
    if (n.includes("(7)")) return "SD+";
    if (n.includes("4K") || n.includes("UHD")) return "4K";
    if (n.includes("FHD") || n.includes("1080P") || n.includes("1080I")) return "FHD";
    if (n.includes("HD") || n.includes("720P")) return "HD";
    return undefined;
  };

  // Memoized categorization count and core name server grouping
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
      .sort((a, b) => {
        return getChannelSortWeight(a) - getChannelSortWeight(b);
      });
  }, [channels, qualityFilter]);

  // Helper to dedupe a list of channels by core name and select the absolute best active stream
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

    // Representatives must have their logical thematic and LCN ordering preserved
    return representatives.sort((a, b) => {
      if (homeSorting === "popular" && activeTab === "accueil") {
        const countA = playCounts[a.core] || 0;
        const countB = playCounts[b.core] || 0;
        if (countA !== countB) {
          return countB - countA;
        }
      }
      return getChannelSortWeight(a) - getChannelSortWeight(b);
    });
  };

  // Group channels by category
  const groupedChannels = useMemo(() => {
    const groups: Record<string, DisplayChannel[]> = {};
    
    dedupeByCore(categorisedList).forEach(c => {
      // Filter out specifically requested sports channels globally
      if (c.category === "Sports") {
        const forbiddenNames = ["BEIN SPORTS FOOTBALL", "DIRECTS L'ÉQUIPE", "DIRECTS L'EQUIPE"];
        if (forbiddenNames.some(name => c.name.includes(name))) return;
      }
      
      const isCustom = String(c.id).startsWith("custom_");
      const cat = isCustom ? "M3U8 Perso" : c.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });

    return groups;
  }, [categorisedList, failedChannels, homeSorting, playCounts]);

  const favoritesList = useMemo(() => {
    return categorisedList.filter(c => favorites.includes(c.id));
  }, [categorisedList, favorites]);

  // Sync selectedChannel with the latest data from list (important after refreshes)
  useEffect(() => {
    if (selectedChannel) {
      const latest = categorisedList.find(c => c.id === selectedChannel.id);
      if (latest && JSON.stringify(latest.epg) !== JSON.stringify(selectedChannel.epg)) {
        setSelectedChannel(latest);
      }
    }
  }, [categorisedList, selectedChannel]);

  const historyList = useMemo(() => {
    return history
      .map(id => categorisedList.find(c => c.id === id))
      .filter((c): c is DisplayChannel => !!c);
  }, [categorisedList, history]);

  // Find duplicate or backup servers for the active channel
  const alternativeChannels = useMemo(() => {
    if (!selectedChannel) return [];
    return categorisedList.filter(c => c.core === selectedChannel.core);
  }, [selectedChannel, categorisedList]);

  const getSourceLabel = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("hd")) return "HD";
    if (lower.includes("fhd")) return "FHD";
    if (lower.includes("hevc")) return "HEVC";
    if (lower.includes("raw")) return "RAW";
    if (lower.includes("backup")) return "Backup";
    
    const bracketMatch = name.match(/\[([^\]]*)\]/);
    if (bracketMatch) return bracketMatch[1];
    
    const parenMatch = name.match(/\(([^)]*)\)/);
    if (parenMatch) return parenMatch[1];

    if (lower.includes("s1")) return "S1";
    if (lower.includes("s2")) return "S2";
    if (lower.includes("s3")) return "S3";
    if (lower.includes("vip")) return "VIP";
    
    return "Source";
  };

  const handleStreamError = () => {
    if (!selectedChannel) return;
    
    // Mark as failed
    setFailedChannels(prev => {
      const next = new Set(prev);
      next.add(selectedChannel.id);
      return next;
    });

    // Find alternative from categorisedList (which is already sorted by quality)
    const core = getCoreName(selectedChannel.name);
    const alternatives = categorisedList.filter(c => getCoreName(c.name) === core && !failedChannels.has(c.id) && c.id !== selectedChannel.id);
    
    if (alternatives.length > 0) {
      console.log(`Auto-switching from ${selectedChannel.name} to ${alternatives[0].name}`);
      setSelectedChannel(alternatives[0]);
    }
  };

  const getActiveStreamUrl = (channel: Channel): string => {
    return `/api/stream/${channel.id}/index.m3u8${channel.p ? `?p=${channel.p}` : ""}`;
  };

  // Navigation focus state for TV/Keyboard
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedRow, setFocusedRow] = useState(0); // 0: Player, 1: Hero, 2: Carousels...

  // Keyboard navigation for Android TV / Desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "accueil") return;

      const channelsInTNT = dedupeByCore(categorisedList.filter(c => c.category === "TNT & Généralistes"));
      
      switch (e.key) {
        case "ArrowRight":
          setFocusedIndex(prev => Math.min(prev + 1, channelsInTNT.length - 1));
          break;
        case "ArrowLeft":
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (focusedIndex >= 0) {
            handleChannelSelect(channelsInTNT[focusedIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, categorisedList, focusedIndex]);

  const handleChannelSelect = (channel: Channel) => {
    setIsPlayerLoading(true);
    setSelectedChannel(channel);
    addToHistory(channel.id);
    setFocusedIndex(-1); // Reset focus when playing
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Simulate fast flow sync
    setTimeout(() => {
      setIsPlayerLoading(false);
    }, 600);
  };

  const handleSeeAll = (category: string) => {
    setSearchTerm(category);
    setActiveTab("recherche");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadM3U = () => {
    if (activeTab !== "admin") {
      alert("Accès réservé aux administrateurs");
      return;
    }
    if (channels.length === 0) return;

    let m3uContent = "#EXTM3U x-tvg-url=\"https://raw.githubusercontent.com/Catch-up-TV-and-More/xmltv/master/tv_guide_fr.xml\"\n\n";
    channels.forEach(channel => {
      const channelUrl = `${window.location.origin}/api/stream/${channel.id}/index.m3u8${channel.p ? `?p=${channel.p}` : ""}`;
      m3uContent += `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-country="FR" group-title="${categorizeChannel(channel.name)}",${channel.name}\n`;
      m3uContent += `#EXTVLCOPT:http-user-agent=VAVOO/2.6\n`;
      m3uContent += `${channelUrl}\n\n`;
    });

    const blob = new Blob([m3uContent], { type: "application/mpegurl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tv-france.m3u";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Smart Watch logic for matches
  const findBestChannel = (broadcaster: string): DisplayChannel | null => {
    const list = categorisedList;
    const lowerB = broadcaster.toLowerCase();
    
    // Exact match on clean name first
    let match = list.find(c => c.name.toLowerCase() === lowerB);
    if (match) return match;
    
    // Core name match
    const coreB = getCoreName(broadcaster);
    match = list.find(c => c.core === coreB);
    if (match) return match;
    
    // Partial match
    match = list.find(c => c.name.toLowerCase().includes(lowerB));
    return match || null;
  };

  const [sportFilter, setSportFilter] = useState("Tous");
  
  const liveEvents = [
    { id: 1, home: "Real Madrid", homeLogo: "https://upload.wikimedia.org/wikipedia/fr/thumb/c/c7/Logo_Real_Madrid.svg/1024px-Logo_Real_Madrid.svg.png", away: "Man City", awayLogo: "https://upload.wikimedia.org/wikipedia/fr/thumb/b/ba/Logo_Manchester_City_2016.svg/1200px-Logo_Manchester_City_2016.svg.png", status: "75'", score: "2 - 1", comp: "Ligue des Champions", broadcaster: "Canal+ Sport", category: "Football", img: "https://images.unsplash.com/photo-1574629810360-7efbc519098bc?auto=format&fit=crop&q=80&w=800" },
    { id: 2, home: "C. Alcaraz", homeLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Flag_of_Spain_%28Civil%29.svg/2560px-Flag_of_Spain_%28Civil%29.svg.png", away: "N. Djokovic", awayLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Serbia.svg/2560px-Flag_of_Serbia.svg.png", status: "2e Set", score: "6-4, 3-2", comp: "Roland Garros", broadcaster: "France 2", category: "Tennis", img: "https://images.unsplash.com/photo-1622279457486-62dcc4a4bd13?auto=format&fit=crop&q=80&w=800" },
    { id: 3, home: "Ferrari (Leclerc)", homeLogo: "https://upload.wikimedia.org/wikipedia/fr/thumb/0/01/Logo_Scuderia_Ferrari_2011.svg/1200px-Logo_Scuderia_Ferrari_2011.svg.png", away: "Red Bull (Verstappen)", awayLogo: "https://upload.wikimedia.org/wikipedia/fr/thumb/f/f5/Logo_Red_Bull_Racing_2022.svg/1200px-Logo_Red_Bull_Racing_2022.svg.png", status: "Tour 45/78", score: "P1 - P2", comp: "Grand Prix de Monaco", broadcaster: "Canal+", category: "Formule 1", img: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=800" },
  ];

  const worldCupMatches = [
    { id: 1, home: "Belgique", homeIso: "BE", away: "Maroc", awayIso: "MA", date: "2026-06-15", time: "20:00", stadium: "MetLife Stadium, NJ", broadcaster: "RTBF La Une", category: "Groupe A" },
    { id: 2, home: "France", homeIso: "FR", away: "Brésil", awayIso: "BR", date: "2026-06-16", time: "21:00", stadium: "Azteca, Mexico City", broadcaster: "TF1", category: "Groupe B" },
    { id: 3, home: "USA", homeIso: "US", away: "Espagne", awayIso: "ES", date: "2026-06-17", time: "18:00", stadium: "SoFi Stadium, LA", broadcaster: "M6", category: "Groupe C" },
    { id: 4, home: "Allemagne", homeIso: "DE", away: "Japon", awayIso: "JP", date: "2026-06-18", time: "15:00", stadium: "Mercedes-Benz, Atlanta", broadcaster: "Tipik", category: "Groupe D" },
  ];

  const tvProgramMatches = [
    { 
      id: "tp1",
      date: "Aujourd'hui",
      time: "18:00",
      discipline: "Football",
      title: "Turquie vs Géorgie",
      stage: "Match de préparation 🇹🇷",
      channels: ["beIN Sports 1"],
      status: "Terminé",
      isLive: false,
      league: "UEFA",
      icon: "Trophy"
    },
    { 
      id: "tp2",
      date: "Aujourd'hui",
      time: "21:00",
      discipline: "Football",
      title: "France vs Allemagne",
      stage: "Match Amical International 🇫🇷",
      channels: ["TF1"],
      status: "En Direct",
      isLive: true,
      league: "International",
      icon: "Trophy"
    },
    { 
      id: "tp_evening1",
      date: "Aujourd'hui",
      time: "22:45",
      discipline: "Football",
      title: "Le Débrief après-match",
      stage: "Analyse & Interviews 🎤",
      channels: ["TF1", "L'Equipe"],
      status: "À venir",
      isLive: false,
      league: "Special",
      icon: "Activity"
    },
    { 
      id: "tp_late",
      date: "Cette Nuit",
      time: "02:00",
      discipline: "Basket-ball",
      title: "Celtics vs Mavericks",
      stage: "NBA Finals - Game 1 🏀",
      channels: ["beIN Sports 1"],
      status: "À venir",
      isLive: false,
      league: "NBA",
      icon: "Activity"
    },
    { 
      id: "tp4",
      date: "Dimanche 7 Juin",
      time: "15:00",
      discipline: "Tennis",
      title: "Finale Roland Garros",
      stage: "Court Philippe Chatrier 🎾",
      channels: ["France 2", "Eurosport 1"],
      status: "À venir",
      isLive: false,
      league: "Grand Chelem",
      icon: "Globe"
    },
    { 
      id: "tp5",
      date: "Dimanche 7 Juin",
      time: "20:00",
      discipline: "Formule 1",
      title: "GP du Canada - La Course",
      stage: "Circuit Gilles-Villeneuve 🏎️",
      channels: ["Canal+"],
      status: "À venir",
      isLive: false,
      league: "F1 World Championship",
      icon: "Zap"
    },
    { 
      id: "tp6",
      date: "Dimanche 7 Juin",
      time: "21:00",
      discipline: "Football",
      title: "Argentine vs Équateur",
      stage: "Amical de préparation 🏆",
      channels: ["beIN Sports 2"],
      status: "À venir",
      isLive: false,
      league: "International",
      icon: "Trophy"
    },
    { 
      id: "tp7",
      date: "Lundi 8 Juin",
      time: "18:30",
      discipline: "Football",
      title: "Pologne vs Turquie",
      stage: "Match Amical ⚽",
      channels: ["L'Equipe"],
      status: "À venir",
      isLive: false,
      league: "International",
      icon: "Trophy"
    },
    { 
      id: "tp_bein1",
      date: "Lundi 8 Juin",
      time: "21:00",
      discipline: "Football",
      title: "Suisse vs Autriche",
      stage: "Amical International - beIN Choc ⚽",
      channels: ["beIN Sports 1"],
      status: "À venir",
      isLive: false,
      league: "Amical",
      icon: "Trophy"
    },
    { 
      id: "tp_bein2",
      date: "Lundi 8 Juin",
      time: "23:00",
      discipline: "Football",
      title: "Brésil vs Mexique",
      stage: "Tournée US - Direct Exclusif 🇧🇷",
      channels: ["beIN Sports 2"],
      status: "À venir",
      isLive: false,
      league: "Copa Prep",
      icon: "Trophy"
    },
    { 
      id: "tp8",
      date: "Mardi 9 Juin",
      time: "20:45",
      discipline: "Football",
      title: "Portugal vs Irlande",
      stage: "Dernier test avant l'Euro 🇵🇹",
      channels: ["L'Equipe"],
      status: "À venir",
      isLive: false,
      league: "International",
      icon: "Trophy"
    },
    { 
      id: "tp9",
      date: "Mardi 9 Juin",
      time: "21:00",
      discipline: "Basket-ball",
      title: "USA vs France",
      stage: "Préparation Olympique - Choc 🏀",
      channels: ["beIN Sports 1"],
      status: "À venir",
      isLive: false,
      league: "International",
      icon: "Activity"
    },
    { 
      id: "tp10",
      date: "Mercredi 10 Juin",
      time: "20:00",
      discipline: "Football",
      title: "France vs Italie",
      stage: "Dernier match de gala 🇫🇷",
      channels: ["TF1"],
      status: "À venir",
      isLive: false,
      league: "International",
      icon: "Trophy"
    },
    { 
      id: "tp11",
      date: "Jeudi 11 Juin",
      time: "20:00",
      discipline: "Football",
      title: "Cérémonie d'Ouverture",
      stage: "Kickoff World Cup 2026 🏟️",
      channels: ["TF1", "RTBF La Une"],
      status: "À venir",
      isLive: false,
      league: "World Cup",
      icon: "Sparkles"
    },
    { 
      id: "tp12",
      date: "Jeudi 11 Juin",
      time: "22:00",
      discipline: "Football",
      title: "USA vs Mexique",
      stage: "Match d'Ouverture - Groupe A ⚽",
      channels: ["TF1", "beIN Sports 1"],
      status: "À venir",
      isLive: false,
      league: "World Cup",
      icon: "Trophy"
    }
  ];

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);
    
    setTimeout(() => {
      const adminEmail = "dewulf.denis@gmail.com";
      const isUserAdmin = authForm.email.toLowerCase() === adminEmail;
      
      if (isLoginMode) {
        if (!authForm.email || !authForm.password) {
           setAuthError("Veuillez remplir tous les champs.");
           setIsAuthenticating(false);
           return;
        }
        
        // Find user
        const existingUser = registeredUsers.find(u => u.email.toLowerCase() === authForm.email.toLowerCase() && u.password === authForm.password);
        if (!existingUser && !isUserAdmin) {
          setAuthError("Identifiants incorrects.");
          setIsAuthenticating(false);
          return;
        }
        
        if (existingUser) {
           setUserName(existingUser.name);
           localStorage.setItem("userName", existingUser.name);
        } else if (isUserAdmin) { // Admin hardcoded fallback
           setUserName("Utilisateur");
           localStorage.setItem("userName", "Utilisateur");
        }
      } else {
        if (!authForm.name || !authForm.email || !authForm.password) {
           setAuthError("Veuillez remplir tous les champs pour l'inscription.");
           setIsAuthenticating(false);
           return;
        }
        
        // Check if email already exists
        if (registeredUsers.some(u => u.email.toLowerCase() === authForm.email.toLowerCase())) {
           setAuthError("Cet email est déjà utilisé.");
           setIsAuthenticating(false);
           return;
        }
        
        const newUser: RegisteredUser = {
          id: `user-${Date.now()}`,
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          registeredAt: new Date().toISOString(),
          role: isUserAdmin ? "admin" : "user",
          subscriptionStatus: "active",
          renewalDate: "2027-01-01"
        };
        
        setRegisteredUsers(prev => [...prev, newUser]);
        
        setUserName(authForm.name);
        localStorage.setItem("userName", authForm.name);
      }
      
      setUserEmail(authForm.email);
      localStorage.setItem("userEmail", authForm.email);
      
      setIsAdmin(isUserAdmin);
      localStorage.setItem("isAdmin", isUserAdmin.toString());
      
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticating(false);
    }, 1200);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("isAdmin");
    setActiveTab("accueil");
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthorized) {
    return <AccessCodeGate onAuthorized={() => setIsAuthorized(true)} />;
  }

  return (
    <div id="root-layout" className="min-h-screen bg-neutral-950 text-white flex flex-col lg:flex-row antialiased relative">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Visual Reminder Toasts */}
      <div className="fixed top-24 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeReminders.map(rem => (
            <motion.div
              key={rem.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="bg-neutral-900/90 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4 pointer-events-auto min-w-[280px]"
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                <Bell size={20} className="animate-bounce" />
              </div>
              <div className="flex-grow">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Rappel de Match</p>
                <p className="text-xs font-bold text-white mt-0.5">{rem.title}</p>
              </div>
              <button 
                onClick={() => setActiveReminders(p => p.filter(r => r.id !== rem.id))} 
                className="text-neutral-500 hover:text-white transition-colors"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex-grow flex flex-col min-w-0">
        {/* Isomorphic Premium Top Bar (Mobile + Desktop Enhanced) */}
        <header className="sticky top-0 z-[100] bg-[#0A0A0A]/80 backdrop-blur-3xl border-b border-neutral-800 py-3 select-none">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
            {/* Left Header Hub */}
            <div className="flex items-center gap-8">
              {/* Logo (Visually hidden on desktop since Sidebar is visible) */}
              <div className="flex items-center gap-3 group cursor-pointer lg:hidden" onClick={() => setActiveTab("accueil")}>
                <div className="w-10 h-10 bg-[#0c0c0d] border border-white/5 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 overflow-hidden">
                   <img src="/pwa-192x192.svg" alt="Flux Tv Pro" className="w-[102%] h-[102%] object-contain rounded-xl" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tighter leading-none text-white uppercase">Flux Tv Pro</h1>
                  <p className="text-[7px] font-black text-[#FF7900] uppercase tracking-[0.2em] mt-1">Premium Vision</p>
                </div>
              </div>

              {/* Add to Players Button */}
              <button
                onClick={() => setActiveTab("integrations")}
                className="flex items-center gap-2 px-3 py-2 bg-[#FF7900]/10 hover:bg-[#FF7900]/20 text-[#FF7900] rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-[#FF7900]/20 hover:border-[#FF7900]/40"
                title="Ajouter à Jellyfin, VLC, Kodi..."
              >
                <Plug size={16} />
                <span className="hidden sm:inline">Ajouter à...</span>
              </button>

              {/* Desktop Greeting & System Telemetry */}
              <div className="hidden lg:flex flex-col gap-0.5">
                <h2 className="text-lg font-black uppercase tracking-tighter text-white">
                  Bonjour, <span className="text-[#FF7900] italic">{userName.split(' ')[0]}</span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#666]">
                    Tableau de Bord
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-full">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_6px_#10b981]" />
                    <span className="text-[7.5px] font-black text-neutral-400 uppercase tracking-widest">Système Actif</span>
                  </div>
                </div>
              </div>

              {/* Quality Preset Buttons */}
              <div className="hidden md:flex items-center bg-neutral-900 border border-neutral-800 rounded-2xl p-1 gap-1">
                <button
                  onClick={() => setQualityFilter("all")}
                  className={`px-4 py-1.5 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${
                    qualityFilter === "all" ? "bg-neutral-800 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setQualityFilter("hd")}
                  className={`px-4 py-1.5 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${
                    qualityFilter === "hd" ? "bg-[#FF7900] text-white shadow-lg shadow-orange-500/20" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  HD Premium
                </button>
              </div>
            </div>

            {/* Right Header Hub */}
            <div className="flex items-center gap-4">
              {/* Global M3U Playlist Fast Link shortcut */}
              <button
                onClick={handleDownloadM3U}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-[#FF7900] hover:text-white border border-neutral-800 hover:border-[#FF7900]/30 rounded-2xl transition-all font-black text-[9px] uppercase tracking-widest"
                title="Exporter Playlist M3U"
              >
                <FileDown size={14} />
                <span>M3U Playlist</span>
              </button>

              {/* Profile Avatar Trigger */}
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab("profil")}
                  className={`flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-2xl transition-all ${
                    activeTab === "profil" 
                      ? "bg-[#FF7900] text-white shadow-xl shadow-orange-500/20 font-black" 
                      : "bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800"
                  }`}
                  title="Mon Profil Premium"
                >
                  <div className={`w-6 h-6 rounded-full text-[9px] font-black uppercase flex items-center justify-center transition-all ${
                    activeTab === "profil" 
                      ? "bg-white text-black" 
                      : "bg-[#FF7900] text-white"
                  }`}>
                    U
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                    Utilisateur
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

      {/* Hero / Player or Ready-to-Stream Grid Selection */}
      <AnimatePresence mode="wait">
        {selectedChannel ? (
          <motion.section 
            key="player-active"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pt-4 md:pt-6 pb-2"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative w-full">
              {/* Backglow for player */}
              <div className="absolute -inset-20 bg-[#FF7900]/10 blur-[100px] pointer-events-none hidden lg:block" />
              
              {/* Player Column */}
              <div className="lg:col-span-8 aspect-video relative z-10 bg-black">
                {isPlayerLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-neutral-950">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-[#FF7900]/20 border-t-[#FF7900] rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Tv size={24} className="text-brand-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-1 text-center px-6">
                      <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] animate-pulse">Synchronisation Flux Rapide</p>
                      <h4 className="text-xs font-black text-white/50 uppercase tracking-widest truncate max-w-[280px]">{selectedChannel.name}</h4>
                    </div>
                  </div>
                ) : (
                  <HlsPlayer 
                    url={getActiveStreamUrl(selectedChannel)} 
                    channelName={selectedChannel.name} 
                    programTitle={selectedChannel.epg?.current?.title}
                    programDesc={selectedChannel.epg?.current?.desc}
                    programImage={selectedChannel.epg?.current?.image || selectedChannel.epg?.current?.icon}
                    onBack={() => setSelectedChannel(null)}
                    onFatalError={handleStreamError}
                  />
                )}
              </div>

              {/* Info Column */}
              <div className="lg:col-span-4 p-4 lg:p-6 xl:p-8 flex flex-col h-full bg-neutral-900/50 backdrop-blur-3xl relative z-10 border-l border-white/5">
                <div className="flex-grow space-y-6 lg:space-y-8 block">
                  {/* Channel Identity */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-neutral-950 rounded-2xl p-2 flex items-center justify-center shadow-2xl border border-white/10 group/logo overflow-hidden">
                        <ChannelLogo logo={selectedChannel.logo} name={selectedChannel.name} className="w-full h-full object-contain filter group-hover/logo:scale-110 transition-transform" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tighter leading-none mb-1.5">{selectedChannel.name}</h2>
                        <div className="flex items-center gap-2">
                           <span className="px-2 py-0.5 bg-white/5 text-[9px] text-neutral-400 font-black rounded-full border border-white/10 uppercase tracking-widest">{selectedChannel.category}</span>
                           <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">{selectedChannel.country}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(selectedChannel.id)}
                      className={`p-3 rounded-2xl border transition-all hover:scale-110 active:scale-90 ${
                        favorites.includes(selectedChannel.id) 
                          ? "bg-red-500 text-white border-red-500 shadow-xl shadow-red-500/20" 
                          : "bg-white/5 border-white/10 text-neutral-500 hover:text-white"
                      }`}
                    >
                      <Heart size={22} fill={favorites.includes(selectedChannel.id) ? "currentColor" : "none"} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Program Info - Premium EPG Layout */}
                  <div className="bg-neutral-900/60 border border-white/5 rounded-3xl p-5 sm:p-6 overflow-hidden relative">
                    {selectedChannel?.name && (
                      <div className="absolute top-4 right-4 z-20">
                        <button 
                          onClick={() => setShowFullEpg(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500 hover:text-white border border-brand-500/20 text-brand-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 group/epg shadow-lg shadow-brand-500/10"
                        >
                          <Calendar size={12} className="group-hover/epg:scale-110 transition-transform" />
                          <span>Guide 24h</span>
                        </button>
                      </div>
                    )}
                    {selectedChannel.epg?.current ? (
                      <div className="relative z-10 space-y-6">
                        {/* EPG Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">En Direct</span>
                          </div>
                          
                          {selectedChannel.epg.current.category && (
                             <span className="px-2.5 py-1 bg-white/5 text-[9px] font-black text-neutral-400 rounded-lg uppercase tracking-widest border border-white/5">
                               {selectedChannel.epg.current.category}
                             </span>
                          )}
                        </div>

                        {/* Current Program Details */}
                        <div className="space-y-4">
                           {/* Has Image? */}
                           {(selectedChannel.epg.current.image || selectedChannel.epg.current.icon) && (
                              <div className="w-full h-32 sm:h-40 rounded-2xl overflow-hidden relative border border-white/10 mb-4 bg-neutral-950">
                                <img 
                                  src={selectedChannel.epg.current.image || selectedChannel.epg.current.icon} 
                                  alt={selectedChannel.epg.current.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover opacity-80"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                              </div>
                           )}

                           <div>
                             <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tighter text-white">
                               {selectedChannel.epg.current.title}
                             </h3>
                             <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-3 leading-relaxed font-medium mt-2">
                               {selectedChannel.epg.current.desc || "Description non disponible. Le flux continue."}
                             </p>
                           </div>
                           
                           {/* Timeline Progress */}
                           <div className="pt-2">
                             <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 font-bold mb-2">
                               <span>{formatEpgTime(selectedChannel.epg.current.start)}</span>
                               <span className="text-brand-500 animate-pulse text-[9px] uppercase tracking-widest">
                                 {Math.max(0, Math.round((new Date(selectedChannel.epg.current.stop).getTime() - Date.now()) / 60000))} min rest.
                               </span>
                               <span>{formatEpgTime(selectedChannel.epg.current.stop)}</span>
                             </div>
                             <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-white/5 relative">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${getEpgProgress(selectedChannel.epg.current.start, selectedChannel.epg.current.stop)}%` }}
                                 className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full shadow-[0_0_10px_rgba(30,136,255,0.5)]" 
                               />
                             </div>
                           </div>
                        </div>

                        {/* Next Program Preview */}
                        {selectedChannel.epg?.next && (
                          <div className="mt-6 pt-6 border-t border-white/5 relative">
                            {/* Vertical Timeline Connection Line */}
                            <div className="absolute top-0 left-[15px] -mt-[25px] h-[25px] w-px bg-white/10" />
                            <div className="absolute top-0 left-[13px] -mt-[4px] w-[5px] h-[5px] rounded-full bg-neutral-600 border border-neutral-900" />
                            
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 bg-white/5 rounded-xl border border-white/5 p-2 px-3 text-center min-w-[60px]">
                                <span className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">À Suivre</span>
                                <span className="block text-[11px] font-mono font-black text-white">{formatEpgTime(selectedChannel.epg.next.start)}</span>
                              </div>
                              <div className="flex-grow min-w-0">
                                <p className="text-[11px] sm:text-xs font-bold text-white truncate">{selectedChannel.epg.next.title}</p>
                                {selectedChannel.epg.next.category && (
                                  <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-1">{selectedChannel.epg.next.category}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                         <div className="w-10 h-10 rounded-full bg-neutral-800/50 flex items-center justify-center border border-white/5">
                            <Monitor size={18} className="text-neutral-500" />
                         </div>
                         <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">Programme Non Disponible</p>
                      </div>
                    )}
                  </div>
                  {/* Sources Selector - Redesigned */}
                  {alternativeChannels.length > 1 && (
                    <div className="pt-6 border-t border-neutral-800 space-y-4">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                           <Radio size={14} className="text-white" />
                           Serveurs & Qualités
                         </p>
                         <span className="text-[9px] font-black text-emerald-500 uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md tracking-wider flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           {alternativeChannels.length} FLUX
                         </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {alternativeChannels.map(alt => {
                          const isActive = alt.id === selectedChannel.id;
                          return (
                            <button
                              key={alt.id}
                              onClick={() => setSelectedChannel(alt)}
                              className={`flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                                isActive 
                                  ? "bg-brand-500/10 border-brand-500/30 ring-1 ring-brand-500/50" 
                                  : "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-600"
                              }`}
                            >
                              {isActive && (
                                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/20 blur-2xl pointer-events-none rounded-full" />
                              )}
                              
                              <div className="w-full flex items-start justify-between">
                                <span className={`text-[11px] font-black uppercase tracking-tight text-left leading-tight line-clamp-2 ${isActive ? "text-white" : "text-neutral-400 group-hover:text-white"}`}>
                                  {getSourceLabel(alt.name)}
                                </span>
                                {isActive && (
                                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-brand-500 rounded-full shadow-[0_0_12px_#FF7900] flex-shrink-0" />
                                )}
                              </div>
                              
                              <div className="w-full mt-auto flex items-center justify-between text-[9px] font-mono font-bold">
                                 <span className={isActive ? "text-brand-400" : "text-neutral-600"}>
                                   {isActive ? "CONNECTÉ" : "DISPO."}
                                 </span>
                                 <span className={isActive ? "text-white font-black" : "text-neutral-600"}>
                                   {isActive ? "~18ms" : "--"}
                                 </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section 
            key="startup-grid"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 pt-4 md:pt-6 pb-2 select-none"
          >
            <div className="bg-neutral-900/60 rounded-[2.5rem] border border-white/5 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF7900]/5 blur-[120px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                <div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-[#FF7900]/15 border border-[#FF7900]/30 rounded-full w-fit mb-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-[#FF7900] uppercase tracking-widest">Lanceur Rapide Direct TV</span>
                   </div>
                   <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight leading-none">
                     Chaînes TV en Haute Définition <span className="text-[#FF7900] italic">Prêtes à Lancer</span>
                   </h3>
                   <p className="text-[10px] sm:text-xs text-neutral-400 uppercase font-bold tracking-wider mt-1.5">
                     Cliquez sur l'un des carrés ci-dessous pour démarrer instantanément la lecture HD
                   </p>
                </div>
                
                <div className="flex gap-2 text-[9px] font-black tracking-widest uppercase bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
                   <span className="text-emerald-500">● 24 FLUX ACTIFS</span>
                   <span className="text-neutral-600">|</span>
                   <span className="text-neutral-400">LATENCE: 12ms</span>
                </div>
              </div>

              {/* Beautiful Grid of Quick Select TV Square Cards (Small squares) */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3.5">
                {(() => {
                  const coresToRender = [
                    "tf1", "france2", "france3", "canalplus", "france5", "m6", "arte", "c8", "w9", "tmc",
                    "tfx", "nrj12", "bfmtv", "cnews", "cstar", "gulli", "lequipe", "6ter", "rmcstory", "rmcdecouverte",
                    "cherie25", "beinsports1", "beinsports2", "eurosport1"
                  ];
                  
                  // Extract matching items from user's actual loaded playlist
                  const matchingChannels = dedupeByCore(categorisedList).filter(c => coresToRender.includes(c.core));
                  
                  if (matchingChannels.length === 0) {
                     return (
                       <div className="col-span-full py-10 text-center text-xs font-black text-neutral-500 uppercase tracking-widest">
                          Chargement des flux en cours...
                       </div>
                     );
                  }
                  
                  return matchingChannels.map((channel) => {
                     const isWcBroadcaster = channel.core === "tf1" || channel.core === "m6" || channel.core === "beinsports1";
                     return (
                       <motion.button
                         key={channel.id}
                         whileHover={{ scale: 1.08 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => handleChannelSelect(channel)}
                         className={`aspect-square bg-neutral-950 hover:bg-[#121212] border border-white/5 hover:border-[#FF7900]/45 rounded-2xl md:rounded-3xl p-3 flex flex-col items-center justify-center relative group transition-all duration-300 shadow-lg ${
                           isWcBroadcaster ? "ring-2 ring-yellow-500/10 hover:ring-yellow-500/30" : ""
                         }`}
                         title={`Lancer ${channel.name} en direct`}
                       >
                         {/* Subtle Background Inner Glow */}
                         <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         
                         {/* Channel Logo */}
                         <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center relative z-10 mt-1">
                           <ChannelLogo logo={channel.logo} name={channel.name} className="w-full h-full object-contain filter group-hover:brightness-110 group-hover:scale-105 transition-all duration-300 pointer-events-none" />
                         </div>
                         
                         {/* Tiny active signal icon */}
                         <div className="absolute top-2 right-2 flex items-center gap-1">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]" />
                         </div>

                         {/* Mini Name Badge */}
                         <span className="text-[8px] font-black text-white/50 group-hover:text-white uppercase tracking-tighter truncate w-full text-center mt-2.5 transition-colors">
                           {channel.name}
                         </span>
                         
                         {/* Golden Badge for coupe du monde diffuseur */}
                         {isWcBroadcaster && (
                           <div className="absolute -bottom-1 -left-1 bg-yellow-500 text-neutral-950 font-black text-[5.5px] tracking-widest px-1.5 py-0.5 rounded-br-lg rounded-tl-lg scale-90 border border-yellow-400/20">
                             WC2026
                           </div>
                         )}
                       </motion.button>
                     );
                  });
                })()}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <main className="flex-grow w-full max-w-[1600px] mx-auto pt-4 sm:pt-8 pb-40 px-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-neutral-500">
            <RefreshCw className="w-10 h-10 animate-spin mb-4 text-brand-500" />
            <p className="text-sm font-medium">Synchronisation des chaînes...</p>
          </div>
        ) : (
          <>
            {/* ACCUEIL TAB */}
            <div className={activeTab === "accueil" ? "animate-tab-fade-in block" : "hidden"}>
              <div className="space-y-4 sm:space-y-6 pb-20">

              {/* Minimalist Editorial Header */}
              <div className="px-6 md:px-10 pt-4 md:pt-6 pb-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
                 <div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter leading-none">
                       Votre Espace <span className="text-brand-500">Télévisuel</span>
                    </h2>
                    <p className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.2em] mt-4">
                       Bienvenue, {userName} • {isAdmin ? "Administrateur" : "Accès Premium"}
                    </p>
                 </div>
                 <div className="flex flex-wrap items-center gap-3">
                    {/* Tri de chaines option */}
                    <div className="flex bg-neutral-950 p-1 rounded-xl border border-white/5 shadow-inner">
                       <button
                         onClick={() => setHomeSorting('standard')}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                           homeSorting === 'standard'
                             ? "bg-brand-500 text-white shadow-lg shadow-brand-500/15"
                             : "text-neutral-500 hover:text-neutral-300"
                         }`}
                       >
                          Tri Standard
                       </button>
                       <button
                         onClick={() => setHomeSorting('popular')}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                           homeSorting === 'popular'
                             ? "bg-brand-500 text-white shadow-lg shadow-brand-500/15"
                             : "text-neutral-500 hover:text-neutral-300"
                         }`}
                       >
                          <span>Les Plus Regardées</span>
                          {(Object.values(playCounts) as number[]).some((v: number) => v > 0) && (
                            <span className="px-1 py-0.5 bg-white/10 text-white rounded-md text-[8px] font-mono leading-none">
                              {(Object.values(playCounts) as number[]).reduce((a: number, b: number) => a + b, 0)}
                            </span>
                          )}
                       </button>
                    </div>

                    <div className="px-4 py-3 bg-neutral-900 rounded-2xl border border-white/5 flex items-center justify-between gap-3 min-w-[140px]">
                       <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">En Direct</span>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                          <span className="text-sm font-black text-white font-mono">{dedupeByCore(categorisedList).length}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <AnimatePresence mode="wait">
                {dedupeByCore(categorisedList).length > 0 && (
                  (() => {
                    const topFeaturedChannel = dedupeByCore(categorisedList).find(c => c.epg?.current?.image) || dedupeByCore(categorisedList)[0];
                    if (!topFeaturedChannel) return null;
                    const current = topFeaturedChannel.epg?.current;
                    return (
                      <div className="px-4 md:px-6 relative w-full h-[320px] sm:h-[400px] lg:h-[500px] mb-2 font-sans">
                        <button 
                          onClick={() => handleChannelSelect(topFeaturedChannel)}
                          onMouseEnter={() => prefetchEpg(topFeaturedChannel.name)}
                          className="w-full h-full rounded-2xl overflow-hidden relative group text-left block border border-white/5 shadow-2xl"
                        >
                           {/* Background Image */}
                           {current?.image || current?.icon || topFeaturedChannel.logo ? (
                             <img 
                               src={current?.image || current?.icon || topFeaturedChannel.logo} 
                               alt={current?.title || topFeaturedChannel.name}
                               loading="lazy"
                               className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105"
                               referrerPolicy="no-referrer"
                             />
                           ) : (
                             <div className="absolute inset-0 w-full h-full bg-neutral-900 flex items-center justify-center">
                                <Tv size={64} className="text-white/10" />
                             </div>
                           )}

                           {/* Elegant Gradient Overlays */}
                           <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                           <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent" />
                           
                           {/* Content */}
                           <div className="absolute inset-0 p-6 md:p-16 flex flex-col justify-end">
                              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                                <div className="px-2 md:px-3 py-1 bg-red-600 rounded-full shadow-2xl flex items-center gap-1.5 md:gap-2 border border-white/20">
                                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                   <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest">En Direct</span>
                                </div>
                                <div className="px-2 md:px-3 py-1 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                                   <span className="text-[8px] md:text-[9px] font-black text-brand-500 uppercase tracking-widest">{topFeaturedChannel.category}</span>
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-6 justify-between">
                                <div className="max-w-3xl">
                                  <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-2 md:mb-3 group-hover:text-brand-500 transition-colors">
                                     {current?.title || topFeaturedChannel.name}
                                  </h2>
                                  {current && (
                                     <div className="flex items-center gap-3 mb-2 md:mb-4">
                                        <div className="px-2 md:px-3 py-0.5 md:py-1 bg-white/10 border border-white/20 rounded-lg backdrop-blur-md">
                                           <span className="text-[9px] md:text-[12px] font-black font-mono text-white tracking-widest">
                                             {formatEpgTime(current.start)} - {formatEpgTime(current.stop)}
                                           </span>
                                        </div>
                                     </div>
                                  )}
                                  {current?.desc && (
                                    <p className="text-xs sm:text-sm md:text-base font-medium text-neutral-300 line-clamp-2 md:line-clamp-3 w-full md:w-3/4">
                                       {current.desc}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                                   <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-500 flex items-center justify-center group-hover:scale-110 shadow-[0_0_30px_rgba(30,136,255,0.4)] transition-all">
                                      <Play size={20} className="text-white ml-1 md:w-6 md:h-6" fill="currentColor" />
                                   </div>
                                </div>
                              </div>
                              
                              {/* EPG Progress */}
                              {current && (
                                 <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${getEpgProgress(current.start, current.stop)}%` }}
                                      className="h-full bg-gradient-to-r from-brand-500 to-brand-400 shadow-[0_0_20px_rgba(14,165,233,0.8)]"
                                    />
                                 </div>
                              )}
                           </div>
                           
                           {/* Channel Logo floating top right */}
                           <div className="absolute top-8 right-8 w-16 h-16 bg-black/40 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl">
                              <ChannelLogo logo={topFeaturedChannel.logo} name={topFeaturedChannel.name} />
                            </div>
                         </button>
                      </div>
                    );
                  })()
                )}
              </AnimatePresence>

              {/* Quick Access Grid - Optimized */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 px-4 md:px-6">
                 {/* Favorites Row */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                             <Heart size={20} className="text-red-500" fill="currentColor" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Ma Sélection</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Accès Immédiat</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                       {favoritesList.length > 0 ? favoritesList.map(channel => (
                          <button
                            key={channel.id}
                            onClick={() => handleChannelSelect(channel)}
                            className="flex-shrink-0 w-32 group"
                          >
                             <div className="aspect-square bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 flex items-center justify-center mb-2 group-hover:border-red-500/30 transition-all group-hover:scale-105 shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChannelLogo logo={channel.logo} name={channel.name} className="w-full h-full object-contain relative z-10" />
                             </div>
                             <p className="text-[10px] font-black text-white text-center uppercase tracking-tight opacity-40 group-hover:opacity-100 transition-opacity truncate px-2">{channel.name}</p>
                          </button>
                       )) : (
                          <div className="w-full h-32 flex items-center justify-center bg-neutral-900/30 rounded-xl border border-dashed border-white/10">
                             <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Aucun favori enregistré</p>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* History Row */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20">
                             <RefreshCw size={20} className="text-brand-500" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Récemment Regardé</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Reprise à 0s</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                       {historyList.length > 0 ? historyList.slice(0, 8).map(channel => (
                          <button
                            key={channel.id}
                            onClick={() => handleChannelSelect(channel)}
                            className="flex-shrink-0 w-32 group"
                          >
                             <div className="aspect-square bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-6 flex items-center justify-center mb-2 group-hover:border-brand-500/30 transition-all group-hover:scale-105 shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <ChannelLogo logo={channel.logo} name={channel.name} className="w-full h-full object-contain relative z-10" />
                             </div>
                             <p className="text-[10px] font-black text-white text-center uppercase tracking-tight opacity-40 group-hover:opacity-100 transition-opacity truncate px-2">{channel.name}</p>
                          </button>
                       )) : (
                          <div className="w-full h-32 flex items-center justify-center bg-neutral-900/30 rounded-xl border border-dashed border-white/10">
                             <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Historique vide</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Discovery Rail - Programs with Image Previews */}
              <div className="space-y-2.5">
                 <div className="flex items-center justify-between px-6 md:px-10">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20 shadow-xl">
                          <Tv size={18} className="text-brand-500" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.2em]">Tendance Actuelle</span>
                          <h3 className="text-2xl font-black tracking-tighter uppercase text-white">Direct & Replay <span className="text-neutral-600 italic text-xl">Populaire</span></h3>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex gap-4 sm:gap-6 overflow-x-auto px-6 md:px-10 pb-4 scrollbar-none">
                    {dedupeByCore(categorisedList.filter(c => c.category === "TNT & Généralistes")).slice(0, 12).map(channel => {
                       const current = channel.epg?.current;
                       return (
                         <button
                           key={channel.id}
                           onClick={() => handleChannelSelect(channel)}
                           onMouseEnter={() => prefetchEpg(channel.name)}
                           className="flex-shrink-0 w-80 sm:w-[420px] group relative"
                         >
                            <div className="aspect-[21/9] w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/5 shadow-2xl relative transition-all duration-700 group-hover:border-brand-500/40 group-hover:shadow-[0_0_40px_rgba(30,136,255,0.15)]">
                               {current?.image || current?.icon ? (
                                 <img 
                                   src={current.image || current.icon} 
                                   loading="lazy"
                                   className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
                                   referrerPolicy="no-referrer" 
                                 />
                               ) : (
                                 <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center opacity-40">
                                    <Tv className="w-20 h-20 text-white/10" />
                                 </div>
                               )}
                               
                               <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                               
                               <div className="absolute top-4 sm:top-5 left-4 sm:left-5">
                                  <div className="px-3 py-1.5 bg-red-600 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/20">
                                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                     <span className="text-[9px] font-black text-white uppercase tracking-widest">En Direct</span>
                                  </div>
                               </div>

                               <div className="absolute top-4 sm:top-5 right-4 sm:right-5">
                                 <div className="w-10 h-10 bg-neutral-950 rounded-xl p-1.5 shadow-2xl border border-white/10 overflow-hidden">
                                    <ChannelLogo logo={channel.logo} name={channel.name} />
                                 </div>
                               </div>
                               
                               <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex flex-col justify-end">
                                  <h4 className="text-xl sm:text-2xl font-black text-white uppercase line-clamp-1 leading-none tracking-tighter group-hover:text-brand-500 transition-colors">
                                     {current?.title || channel.name}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-3">
                                     <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">{channel.name}</p>
                                     <div className="w-1 h-1 rounded-full bg-brand-500/30" />
                                     <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest leading-none">Qualité {channel.qualityLabel || "HD"}</p>
                                  </div>
                                  
                                  {current && (
                                     <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                        <motion.div 
                                          initial={{ width: 0 }}
                                          animate={{ width: `${getEpgProgress(current.start, current.stop)}%` }}
                                          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 shadow-[0_0_15px_rgba(14,165,233,0.5)]"
                                        />
                                     </div>
                                  )}
                               </div>
                            </div>
                         </button>
                       );
                    })}
                 </div>
              </div>

              {/* Spacer between sections */}
              <div className="w-full flex justify-center py-1">
                 <div className="w-16 h-[1px] bg-white/5 rounded-full" />
              </div>

              {/* Dynamic Discovery Sections - Curated Premium Order */}
              <div className="flex flex-col gap-3 sm:gap-4 pt-0">
                {(Object.entries(groupedChannels) as [string, DisplayChannel[]][])
                  .filter(([cat, catChannels]) => catChannels.length > 0 && cat !== "TNT & Généralistes")
                  .sort(([catA], [catB]) => {
                    const premiumOrder = [
                      "TNT & Généralistes",
                      "Sports",
                      "Cinéma & Séries",
                      "Documentaires",
                      "Actualités",
                      "Belgique 🇧🇪",
                      "Jeunesse",
                      "Musique",
                      "À La Carte",
                      "Divertissement"
                    ];
                    const iA = premiumOrder.indexOf(catA);
                    const iB = premiumOrder.indexOf(catB);
                    const valA = iA === -1 ? 999 : iA;
                    const valB = iB === -1 ? 999 : iB;
                    return valA - valB;
                  })
                  .map(([category, catChannels]) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                    >
                      <ChannelCarousel 
                        title={category}
                        channels={catChannels}
                        selectedChannelId={selectedChannel?.id}
                        onChannelSelect={handleChannelSelect}
                        onMouseEnter={(channel) => prefetchEpg(channel.name)}
                        onSeeAll={() => handleSeeAll(category)}
                      />
                    </motion.div>
                  ))}
              </div>

              {/* End of Home Branding */}
              <div className="py-20 flex flex-col items-center gap-8 opacity-20 hover:opacity-100 transition-opacity">
                 <div className="w-20 h-0.5 bg-brand-500 rounded-full" />
                 <p className="text-xs font-black text-white uppercase tracking-[1.5em] text-center ml-[1.5em]">FIN DU FLUX</p>
              </div>
              </div>
            </div>

            {/* RECHERCHE TAB */}
            <div className={activeTab === "recherche" ? "animate-tab-fade-in block" : "hidden"}>
              <div className="max-w-7xl mx-auto px-6 space-y-20 pb-40">
              <div className="relative pt-12 flex flex-col items-center text-center space-y-12">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
                 
                 <div className="space-y-3 md:space-y-4 relative z-10">
                    <span className="text-[9px] md:text-[10px] font-black text-brand-500 uppercase tracking-[0.5em]">Global Search Hub</span>
                    <h2 className="text-4xl md:text-8xl font-black tracking-tighter uppercase leading-none">Universal <br/><span className="italic bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">Discovery.</span></h2>
                 </div>
                 
                 <div className="w-full max-w-3xl relative z-10 group px-2 md:px-0">
                    <div className="absolute inset-0 bg-brand-500/10 blur-[60px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <div className="relative flex items-center bg-neutral-900 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all group-focus-within:border-brand-500/50 group-focus-within:bg-neutral-950 group-focus-within:shadow-[0_0_80px_rgba(30,136,255,0.2)]">
                       <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-neutral-500 group-focus-within:text-brand-500 transition-colors">
                          <Search size={24} className="md:w-8 md:h-8" />
                       </div>
                       <input 
                         type="text" 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         placeholder="Trouvez votre contenu Idéal..." 
                         className="flex-1 w-full min-w-0 bg-transparent border-none outline-none text-base sm:text-xl md:text-3xl font-black uppercase tracking-tighter text-white placeholder:text-neutral-700 p-2 md:p-4"
                       />
                       {searchTerm && (
                         <button 
                           onClick={() => setSearchTerm("")}
                           className="w-12 h-12 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-white transition-all shadow-md active:scale-90"
                         >
                           <X size={20} />
                         </button>
                       )}
                    </div>

                    {/* Category selection and Dynamic Search Filters */}
                    <div className="flex flex-wrap justify-center gap-3 mt-10 relative z-20">
                       {[
                         { icon: Layers, label: "Tous", category: "Tous" },
                         { icon: Tv, label: "TNT & Général", category: "TNT & Généralistes" },
                         { icon: Trophy, label: "Sports Live", category: "Sports" },
                         { icon: Film, label: "Cinéma & Séries", category: "Cinéma & Séries" },
                         { icon: Globe, label: "Documentaires", category: "Documentaires" },
                         { icon: Sparkles, label: "Jeunesse", category: "Jeunesse" },
                         { icon: Music, label: "Musique & Clips", category: "Musique" },
                         { icon: Globe, label: "Belgique 🇧🇪", category: "Belgique 🇧🇪" },
                         { icon: Layers, label: "Divertissements", category: "Divertissement" },
                       ].map(chip => {
                         const isActive = searchCategory === chip.category;
                         return (
                           <button 
                             key={chip.category}
                             onClick={() => {
                               setSearchCategory(chip.category);
                             }}
                             className={`px-5 py-3 rounded-full flex items-center gap-3 border transition-all duration-300 active:scale-95 shadow-[0_4px_25px_rgba(0,0,0,0.5)] ${
                               isActive 
                                 ? "bg-brand-500 text-white border-brand-500 font-extrabold scale-105 shadow-lg shadow-brand-500/30" 
                                 : "bg-neutral-900/50 backdrop-blur-xl border-white/5 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                             }`}
                           >
                              <chip.icon size={13} className={isActive ? "text-white animate-pulse" : "text-brand-500"} />
                              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{chip.label}</span>
                           </button>
                         );
                       })}
                    </div>
                 </div>
              </div>

              {(searchTerm || searchCategory) ? (
                <div className="space-y-12">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20">
                            <Layers size={24} className="text-brand-500" />
                         </div>
                         <div>
                            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">{searchTerm ? "Résultats :" : "Catalogue :"} <span className="text-brand-500 break-words">{searchTerm || searchCategory}</span></h3>
                            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-2">
                               Trouvé {dedupeByCore(
                                 categorisedList.filter(c => {
                                   if (searchCategory !== "Tous") {
                                     if (searchCategory === "Belgique 🇧🇪") {
                                       if (c.category !== "Belgique 🇧🇪") return false;
                                     } else {
                                       if (c.category !== searchCategory) return false;
                                     }
                                   }
                                   if (searchTerm) {
                                     const s = searchTerm.toLowerCase();
                                     return (
                                       c.name.toLowerCase().includes(s) || 
                                       c.core.toLowerCase().includes(s) ||
                                       c.category.toLowerCase().includes(s) ||
                                       c.epg?.current?.title.toLowerCase().includes(s)
                                     );
                                   }
                                   return true;
                                 })
                               ).length} correspondances uniques
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {dedupeByCore(
                      categorisedList.filter(c => {
                        if (searchCategory !== "Tous") {
                          if (searchCategory === "Belgique 🇧🇪") {
                            if (c.category !== "Belgique 🇧🇪") return false;
                          } else {
                            if (c.category !== searchCategory) return false;
                          }
                        }
                        if (searchTerm) {
                          const s = searchTerm.toLowerCase();
                          return (
                            c.name.toLowerCase().includes(s) || 
                            c.core.toLowerCase().includes(s) ||
                            c.category.toLowerCase().includes(s) ||
                            c.epg?.current?.title.toLowerCase().includes(s)
                          );
                        }
                        return true;
                      })
                    )
                      .slice(0, 150)
                      .map(channel => {
                        const isSelected = selectedChannel?.id === channel.id;
                        const current = channel.epg?.current;
                        return (
                          <motion.div
                            key={channel.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex"
                          >
                             <ProgramCard 
                                channel={channel} 
                                onClick={handleChannelSelect} 
                                isPlaying={selectedChannel?.id === channel.id}
                                className="w-full"
                             />
                          </motion.div>
                        );
                      })}
                   </div>

                   {dedupeByCore(categorisedList.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.core.toLowerCase().includes(searchTerm.toLowerCase()) || c.category.toLowerCase().includes(searchTerm.toLowerCase()) || c.epg?.current?.title.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 && (
                     <div className="py-40 flex flex-col items-center gap-10 text-center bg-neutral-900/40 rounded-[4rem] border border-dashed border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <div className="w-28 h-28 bg-neutral-950 rounded-[3rem] flex items-center justify-center text-neutral-700 border border-white/5 shadow-[20px_20px_60px_#09090b,-20px_-20px_60px_#111115] relative group">
                           <div className="absolute inset-0 bg-brand-500/10 blur-[30px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                           <Search size={48} strokeWidth={1.5} className="relative z-10 text-neutral-600" />
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-3xl font-black uppercase tracking-tighter text-white">Aucun Signal Détecté</h4>
                           <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest max-w-sm mx-auto">Vérifiez l'orthographe ou essayez une catégorie différente (Généraliste, Sport, Cinéma...)</p>
                        </div>
                     </div>
                   )}
                </div>
              ) : (
                <div className="max-w-6xl mx-auto space-y-24">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="bg-neutral-900/50 rounded-[4rem] p-12 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 blur-[100px] pointer-events-none group-hover:bg-brand-500/10 transition-colors duration-700" />
                         <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-brand-500/10 rounded-[2rem] flex items-center justify-center border border-brand-500/20 group-hover:scale-110 transition-transform duration-500">
                               <Trophy size={40} className="text-brand-500" />
                            </div>
                            <div>
                               <h4 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Sports <br/>Discovery</h4>
                               <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mt-2">{groupedChannels["Sports"]?.length || 45} Flux Actifs</p>
                            </div>
                         </div>
                         <div className="space-y-4 relative z-10">
                            {["Canal+ Sport", "beIN Sports", "Eurosport", "RMC Sport"].map(sport => (
                               <button 
                                 key={sport} 
                                 onClick={() => setSearchTerm(sport)}
                                 className="w-full flex items-center justify-between p-8 bg-neutral-950 rounded-3xl border border-white/5 hover:border-brand-500/40 transition-all hover:bg-neutral-900 group/item"
                               >
                                  <span className="text-sm font-black text-neutral-400 uppercase tracking-widest group-hover/item:text-white">{sport}</span>
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/item:bg-brand-500 group-hover/item:text-black transition-all">
                                     <ChevronRight size={20} />
                                  </div>
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="bg-neutral-900/50 rounded-[4rem] p-12 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
                         <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                               <Film size={40} className="text-emerald-500" />
                            </div>
                            <div>
                               <h4 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Cinéma <br/>& Séries</h4>
                               <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mt-2">{groupedChannels["Cinéma"]?.length || 32} Flux Actifs</p>
                            </div>
                         </div>
                         <div className="space-y-4 relative z-10">
                            {["Cin+ Premier", "OCS Geants", "Action", "Paramount"].map(movie => (
                               <button 
                                 key={movie} 
                                 onClick={() => setSearchTerm(movie)}
                                 className="w-full flex items-center justify-between p-8 bg-neutral-950 rounded-3xl border border-white/5 hover:border-emerald-500/40 transition-all hover:bg-neutral-900 group/item"
                               >
                                  <span className="text-sm font-black text-neutral-400 uppercase tracking-widest group-hover/item:text-white">{movie}</span>
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/item:bg-emerald-500 group-hover/item:text-black transition-all">
                                     <ChevronRight size={20} />
                                  </div>
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="bg-neutral-900/50 rounded-[4rem] p-12 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 blur-[100px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />
                         <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-orange-500/10 rounded-[2rem] flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                               <Globe size={40} className="text-orange-500" />
                            </div>
                            <div>
                               <h4 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Docu <br/>& Découverte</h4>
                               <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mt-2">{groupedChannels["Documentaires"]?.length || 38} Flux Actifs</p>
                            </div>
                         </div>
                         <div className="space-y-4 relative z-10">
                            {["National Geographic", "Discovery Channel", "Ushuaïa TV", "Planète+"].map(docue => (
                               <button 
                                 key={docue} 
                                 onClick={() => setSearchTerm(docue)}
                                 className="w-full flex items-center justify-between p-8 bg-neutral-950 rounded-3xl border border-white/5 hover:border-orange-500/40 transition-all hover:bg-neutral-900 group/item"
                               >
                                  <span className="text-sm font-black text-neutral-400 uppercase tracking-widest group-hover/item:text-white">{docue}</span>
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/item:bg-orange-500 group-hover/item:text-black transition-all">
                                     <ChevronRight size={20} />
                                  </div>
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="bg-neutral-900/50 rounded-[4rem] p-12 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-700" />
                         <div className="flex items-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-purple-500/10 rounded-[2rem] flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                               <Sparkles size={40} className="text-purple-500" />
                            </div>
                            <div>
                               <h4 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Jeunesse <br/>& Animation</h4>
                               <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest mt-2">{groupedChannels["Jeunesse"]?.length || 24} Flux Actifs</p>
                            </div>
                         </div>
                         <div className="space-y-4 relative z-10">
                            {["Disney Channel", "Cartoon Network", "Nickelodeon", "Boing"].map(kid => (
                               <button 
                                 key={kid} 
                                 onClick={() => setSearchTerm(kid)}
                                 className="w-full flex items-center justify-between p-8 bg-neutral-950 rounded-3xl border border-white/5 hover:border-purple-500/40 transition-all hover:bg-neutral-900 group/item"
                               >
                                  <span className="text-sm font-black text-neutral-400 uppercase tracking-widest group-hover/item:text-white">{kid}</span>
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/item:bg-purple-500 group-hover/item:text-black transition-all">
                                     <ChevronRight size={20} />
                                  </div>
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}
              </div>
            </div>

            {/* SPORTS TAB */}
            <div className={activeTab === "sports" ? "animate-tab-fade-in block" : "hidden"}>
              <SportsCenter channels={categorisedList} onPlayChannel={(ch) => handleChannelSelect(ch as any)} />
            </div>

            {/* FAVORIS TAB */}
            <div className={activeTab === "favoris" ? "animate-tab-fade-in block" : "hidden"}>
              <div className="space-y-16 sm:space-y-24 pb-40 min-h-[60vh] max-w-7xl mx-auto px-6 pt-12">
               <div className="flex flex-col space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#FF7900]/10 rounded-2xl flex items-center justify-center border border-[#FF7900]/20">
                        <Heart size={24} className="text-[#FF7900]" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Vos Favoris</h2>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#A0A0A0]">Listes de vos chaînes préférées</p>
                     </div>
                  </div>
                  
                  {favoritesList.length > 0 ? (
                    <ChannelGrid 
                       title={`${favoritesList.length} chaînes sauvegardées`}
                       channels={favoritesList} 
                       onChannelSelect={handleChannelSelect}
                       selectedChannelId={selectedChannel?.id}
                    />
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[2rem] border border-[#151515] bg-[#0B0B0B]">
                       <Heart size={48} className="text-[#151515]" />
                       <div>
                          <p className="text-lg font-bold text-white uppercase tracking-tight">Aucun favori</p>
                          <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] mt-1">Ajoutez des chaînes avec le bouton coeur</p>
                       </div>
                    </div>
                  )}
               </div>
              </div>
            </div>

            {/* INTEGRATIONS TAB */}
            <div className={activeTab === "integrations" ? "animate-tab-fade-in block" : "hidden"}>
              <div className="max-w-6xl mx-auto px-6 pb-40 pt-12">
                <Integrations />
              </div>
            </div>

            {/* ADMIN TAB */}
            <div className={activeTab === "admin" ? "animate-tab-fade-in block" : "hidden"}>
              <div className="max-w-6xl mx-auto px-6 pb-40 pt-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <Settings size={24} className="text-red-500" />
                </div>
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Administration</h2>
                   <p className="text-[10px] uppercase font-bold tracking-widest text-[#A0A0A0]">Gestion des chaînes et des flux</p>
                </div>
              </div>
              <ChannelAdmin channels={categorisedList} reload={() => loadChannels(true)} />
              </div>
            </div>

            {/* PROFIL TAB */}
            <div className={activeTab === "profil" ? "animate-tab-fade-in block" : "hidden"}>
              <div className="max-w-3xl mx-auto px-4 space-y-12 pb-40">
              <div className="flex flex-col items-center text-center space-y-6 pt-12">
                 <div className="relative group">
                   <div className="w-24 h-24 bg-gradient-to-br from-[#FF7900] to-orange-850 rounded-[2.2rem] flex items-center justify-center shadow-2xl ring-4 ring-[#FF7900]/25 group-hover:scale-105 transition-transform duration-300">
                      <span className="text-3xl font-black text-white">DD</span>
                   </div>
                   <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-4 border-neutral-950 w-7 h-7 rounded-full flex items-center justify-center" title="En Ligne">
                     <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                   </div>
                 </div>
                 {/* Admin toggle - only for demo */}
                 <button onClick={() => setActiveTab("admin")} className="text-[10px] text-neutral-500 uppercase tracking-widest hover:text-white">Accéder à l'Admin</button>
                 
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase text-white">{userName}</h2>
                    <p className="text-[#A0A0A0] text-[10px] font-bold tracking-widest uppercase">{userEmail}</p>
                    <div className="pt-2">
                       <span className={`px-3.5 py-1 text-[9px] font-black text-white rounded-full shadow-lg uppercase tracking-widest border ${isAdmin ? "bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/20 border-red-400/20" : "bg-gradient-to-r from-orange-600 to-[#FF7900] shadow-orange-500/20 border-orange-400/20"}`}>
                         {isAdmin ? "COMPTE ADMINISTRATEUR" : "MEMBRE PREMIUM SPECIALISTE"}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                 <div className="px-5 py-3 bg-neutral-900/50 border border-white/5 rounded-2xl flex items-center gap-3">
                    <Tv size={16} className="text-brand-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{categorisedList.length} Canaux</span>
                 </div>
                 <div className="px-5 py-3 bg-neutral-900/50 border border-white/5 rounded-2xl flex items-center gap-3">
                    <Heart size={16} className="text-red-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{favorites.length} Favoris</span>
                 </div>
                 <div className="px-5 py-3 bg-neutral-900/50 border border-white/5 rounded-2xl flex items-center gap-3">
                    <RefreshCw size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{history.length} Historique</span>
                 </div>
              </div>

              {isAdmin && (
                 <div className="bg-neutral-900/50 rounded-[3rem] border border-red-500/10 p-4 sm:p-8 space-y-2 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[50px] pointer-events-none" />
                    
                    <div className="px-6 py-4 flex items-center justify-between">
                       <h3 className="text-[10px] items-center flex gap-2 font-black uppercase tracking-[0.3em] text-red-500">
                         <ShieldCheck size={14} /> Tableau de Bord Admin
                       </h3>
                       {(adminView === "users" || adminView === "channels") && (
                         <button onClick={() => setAdminView("overview")} className="text-[10px] font-black uppercase text-neutral-400 hover:text-white transition-colors">
                            Retour
                         </button>
                       )}
                    </div>

                    {adminView === "overview" ? (
                      <>
                        <button onClick={() => setAdminView("users")} className="w-full group flex items-center justify-between p-6 sm:p-8 bg-neutral-950/50 rounded-3xl hover:bg-neutral-900 transition-colors border border-transparent hover:border-red-500/20">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all">
                                 <User size={20} />
                              </div>
                              <div className="text-left space-y-1">
                                 <p className="text-sm font-black text-white uppercase tracking-widest">Gestion des Utilisateurs</p>
                                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Gérer les comptes et accès ({registeredUsers.length} abonnés)</p>
                              </div>
                           </div>
                           <ChevronRight className="text-red-500/50 group-hover:text-red-500 group-hover:translate-x-2 transition-transform" />
                        </button>

                        <button onClick={() => setAdminView("channels")} className="w-full group flex items-center justify-between p-6 sm:p-8 bg-neutral-950/50 rounded-3xl hover:bg-neutral-900 transition-colors border border-transparent hover:border-red-500/20">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all">
                                 <Tv size={20} />
                              </div>
                              <div className="text-left space-y-1">
                                 <p className="text-sm font-black text-white uppercase tracking-widest">Gestion des Chaînes</p>
                                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Ajouter, modifier ou supprimer des chaînes ({channels.length} natives)</p>
                              </div>
                           </div>
                           <ChevronRight className="text-red-500/50 group-hover:text-red-500 group-hover:translate-x-2 transition-transform" />
                        </button>

                        <button className="w-full group flex items-center justify-between p-6 sm:p-8 bg-neutral-950/50 rounded-3xl hover:bg-neutral-900 transition-colors border border-transparent hover:border-red-500/20">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all">
                                 <CreditCard size={20} />
                              </div>
                              <div className="text-left space-y-1">
                                 <p className="text-sm font-black text-white uppercase tracking-widest">Abonnements & Paiements</p>
                                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Historique et renouvellements expirés</p>
                              </div>
                           </div>
                           <ChevronRight className="text-red-500/50 group-hover:text-red-500 group-hover:translate-x-2 transition-transform" />
                        </button>

                        <button className="w-full group flex items-center justify-between p-6 sm:p-8 bg-neutral-950/50 rounded-3xl hover:bg-neutral-900 transition-colors border border-transparent hover:border-red-500/20">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all">
                                 <Activity size={20} />
                              </div>
                              <div className="text-left space-y-1">
                                 <p className="text-sm font-black text-white uppercase tracking-widest">Serveurs & Statistiques</p>
                                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Charge CPU, Bande passante, Monitoring</p>
                              </div>
                           </div>
                           <ChevronRight className="text-red-500/50 group-hover:text-red-500 group-hover:translate-x-2 transition-transform" />
                        </button>
                      </>
                    ) : adminView === "users" ? (
                      <div className="space-y-4 pt-4">
                         <div className="flex items-center justify-between px-2 mb-4">
                            <h4 className="text-white font-black uppercase tracking-tight">Liste des Utilisateurs</h4>
                            <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full">{registeredUsers.length}</span>
                         </div>
                         <div className="space-y-3">
                           {registeredUsers.map(user => (
                              <div key={user.id} className="p-5 bg-neutral-950/50 border border-white/5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between md:items-center">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-neutral-900 text-neutral-400 rounded-xl flex items-center justify-center uppercase font-black text-sm border border-white/5">
                                       {user.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                         {user.name} 
                                         {user.role === "admin" && <span className="bg-red-500/20 text-red-500 text-[8px] px-2 py-0.5 rounded-sm">ADMIN</span>}
                                       </p>
                                       <p className="text-[10px] text-neutral-500 font-medium tracking-wider">{user.email}</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <div className={`px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest text-center ${user.subscriptionStatus === "active" ? "bg-brand-500/10 border-brand-500/20 text-brand-500" : "bg-neutral-900 border-white/10 text-neutral-500"}`}>
                                       {user.subscriptionStatus}
                                    </div>
                                    <button 
                                       onClick={() => {
                                          if (user.role === "admin" && registeredUsers.filter(u => u.role === "admin").length === 1) {
                                             alert("Impossible de supprimer le dernier administrateur.");
                                             return;
                                          }
                                          if(window.confirm(`Supprimer l'utilisateur ${user.name} ?`)) {
                                             setRegisteredUsers(prev => prev.filter(u => u.id !== user.id));
                                          }
                                       }}
                                       className="p-2 border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white transition-colors rounded-xl flex items-center justify-center"
                                       title="Supprimer l'utilisateur"
                                    >
                                       <X size={16} />
                                    </button>
                                 </div>
                              </div>
                           ))}
                         </div>
                      </div>
                    ) : adminView === "channels" ? (
                       <ChannelAdmin channels={categorisedList} reload={() => loadChannels(true)} />
                    ) : null}
                 </div>
              )}

              <div className="bg-neutral-900/50 rounded-[3rem] border border-white/5 p-4 sm:p-8 space-y-2">
                 <div className="px-6 py-4 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Multimédia</h3>
                 </div>

                 <button 
                    onClick={handleDownloadM3U} 
                    className="w-full group flex items-center justify-between p-6 sm:p-8 bg-neutral-950/50 rounded-3xl hover:bg-neutral-900 transition-colors border border-transparent hover:border-white/5"
                 >
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-white/5 flex items-center justify-center text-white group-hover:text-brand-500 group-hover:scale-110 transition-all">
                          <FileDown size={20} />
                       </div>
                       <div className="text-left space-y-1">
                          <p className="text-sm font-black text-white uppercase tracking-widest">Exporter Playlist M3U</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Pour VLC, iOS et Android TV</p>
                       </div>
                    </div>
                    <ChevronRight className="text-neutral-700 group-hover:translate-x-2 transition-transform" />
                 </button>

                 <button className="w-full group flex items-center justify-between p-6 sm:p-8 bg-neutral-950/50 rounded-3xl hover:bg-neutral-900 transition-colors border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-white/5 flex items-center justify-center text-white group-hover:text-emerald-400 group-hover:scale-110 transition-all">
                          <Tv size={20} />
                       </div>
                       <div className="text-left space-y-1">
                          <p className="text-sm font-black text-white uppercase tracking-widest">Associer une Smart TV</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Générez un code de connexion</p>
                       </div>
                    </div>
                    <div className="px-3 py-1 bg-neutral-900 border border-white/5 rounded-full">
                       <span className="text-[8px] font-black text-neutral-400 tracking-widest uppercase">Bientôt</span>
                    </div>
                 </button>

                 <div className="px-6 py-4 flex items-center justify-between mt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Système & Maintenance</h3>
                 </div>

                 <div className="p-6 sm:p-8 bg-neutral-950/50 rounded-3xl border border-transparent flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-white/5 flex items-center justify-center text-white">
                          <CreditCard size={20} />
                       </div>
                       <div className="text-left space-y-1">
                          <p className="text-sm font-black text-white uppercase tracking-widest">Abonnement Premium</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Renouvellement auto : 01/01/2027</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full">
                       <ShieldCheck size={12} className="text-brand-500" />
                       <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">Actif</span>
                    </div>
                 </div>

                 <div className="p-6 sm:p-8 bg-neutral-950/50 rounded-3xl border border-transparent flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-neutral-900 rounded-2xl border border-white/5 flex items-center justify-center text-white">
                          <Activity size={20} />
                       </div>
                       <div className="text-left space-y-1">
                          <p className="text-sm font-black text-white uppercase tracking-widest">État du Core</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">V4.2 • Latence 12ms</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Optimal</span>
                    </div>
                 </div>
              </div>

              <div className="flex justify-center pt-8">
                 <button onClick={handleLogout} className="px-8 py-4 bg-neutral-900/50 text-red-500 border border-red-500/10 hover:border-red-500/30 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:text-red-400 hover:bg-neutral-900 transition-all shadow-xl">
                    <LogOut size={16} /> Fermer la session
                 </button>
              </div>

            </div>
            </div>

            {/* UNKNOWN TAB FALLBACK */}
            <div className={!["accueil", "recherche", "sports", "favoris", "admin", "profil"].includes(activeTab) ? "animate-tab-fade-in block" : "hidden"}>
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                 <HelpCircle size={48} className="text-neutral-800" />
                 <p className="text-neutral-500 font-black uppercase tracking-widest text-xs tracking-tight">Section en développement</p>
              </div>
            </div>
          </>
        )}
      </main>
      </div>

      {/* EPG Timeline Overlay */}
      <AnimatePresence>
        {showFullEpg && selectedChannel && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullEpg(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-4xl h-full max-h-[90vh] z-10 transition-all">
              <EpgTimeline 
                channelName={selectedChannel.name} 
                onClose={() => setShowFullEpg(false)} 
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
