import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HlsPlayer } from "./components/HlsPlayer";
import { ChannelCarousel } from "./components/ChannelCarousel";
import { ProgramCard } from "./components/ProgramCard";
import { BottomNav } from "./components/BottomNav";
import { Sidebar } from "./components/Sidebar";
import { ChannelGrid } from "./components/ChannelGrid";
import { ChannelAdmin } from "./components/ChannelAdmin";
import { EpgTimeline } from "./components/EpgTimeline";
import { SplashScreen } from "./components/SplashScreen";
import { StreamInfoModal } from "./components/StreamInfoModal";
import { SportsCenter } from "./components/SportsCenter";
import { AccessCodeGate } from "./components/AccessCodeGate";
import { formatEpgTime, getEpgProgress } from "./utils/epgUtils";
import { Integrations } from "./components/Integrations";
import { getApiUrl } from "./utils/urlHelper";

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
      </div>
    );
  }

  return <img src={logo} alt={name} loading="lazy" className={className} onError={() => setError(true)} />;
}

interface Channel {
  country: string;
  id: number | string;
  name: string;
  p?: number;
  logo?: string;
  category?: string;
  categoryOverride?: string;
}

let LCN_MAP: Record<string, number> = {};

function getCoreName(name: string): string {
  const lower = name.toLowerCase();
  const bracketMatch = name.match(/\[(.*?)\]/);
  if (bracketMatch) return bracketMatch[1];
  
  const parenMatch = name.match(/\(([^)]*)\)/);
  if (parenMatch) return parenMatch[1];

  if (lower.includes("s1")) return "S1";
  if (lower.includes("s2")) return "S2";
  if (lower.includes("s3")) return "S3";
  if (lower.includes("vip")) return "VIP";
  
  return "Source";
}

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<DisplayChannel | null>(null);
  const [activeTab, setActiveTab] = useState("accueil");
  const [failedChannels, setFailedChannels] = useState(new Set<number | string>());
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem("vavoo_authorized") === "true";
  });
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [favorites, setFavorites] = useState<Set<number | string>>(() => {
    try {
      const saved = localStorage.getItem("vavoo_favorites");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist favorites
  useEffect(() => {
    localStorage.setItem("vavoo_favorites", JSON.stringify([...favorites]));
  }, [favorites]);

  // Load channels with improved error handling
  const loadChannels = useCallback(async (forceRefetch = false) => {
    if (forceRefetch) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = getApiUrl(`/api/channels${forceRefetch ? "?force=true" : ""}`);
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.channels)) {
        if (data.lcnMap) {
          LCN_MAP = data.lcnMap;
        }
        setChannels(data.channels);
        setError(null);
      } else {
        throw new Error(data.error || "Format de réponse invalide");
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des chaînes:", err);
      const errorMessage = err.name === 'AbortError' 
        ? "Délai d'attente dépassé. Vérifiez votre connexion Internet."
        : err.message || "Impossible de charger les chaînes. Vérifiez votre connexion.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthorized) {
      loadChannels();
    }
  }, [isAuthorized, loadChannels]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    if (!isAuthorized || loading) return;
    
    const interval = setInterval(() => {
      loadChannels(true);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthorized, loading, loadChannels]);

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
    return "TNT & Généralistes";
  };

  const enrichChannels = (list: Channel[]): DisplayChannel[] => {
    return list.map(c => {
      const category = c.categoryOverride || categorizeChannel(c.name);
      const core = getCoreName(c.name);
      return {
        ...c,
        category,
        serverCount: 1,
        core,
        qualityLabel: "FHD"
      };
    });
  };

  const categorisedList = useMemo(() => enrichChannels(channels), [channels]);

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
          return 1;
        };
        return getQualityVal(b.qualityLabel) - getQualityVal(a.qualityLabel);
      });
      return sortedStreams[0];
    });

    return representatives;
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
    return getApiUrl(`/api/stream/${channel.id}/index.m3u8${channel.p ? `?p=${channel.p}` : ""}`);
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
        case "ArrowDown":
          e.preventDefault();
          if (focusedRow === 0) setFocusedRow(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (focusedRow > 0) setFocusedRow(focusedRow - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (focusedRow === 1 && focusedIndex < channelsInTNT.length - 1) {
            setFocusedIndex(focusedIndex + 1);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (focusedRow === 1 && focusedIndex > 0) {
            setFocusedIndex(focusedIndex - 1);
          }
          break;
        case "Enter":
          e.preventDefault();
          if (focusedRow === 1 && channelsInTNT[focusedIndex]) {
            setSelectedChannel(channelsInTNT[focusedIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedRow, focusedIndex, categorisedList, activeTab]);

  const handleLogout = () => {
    setIsAuthorized(false);
    localStorage.removeItem("vavoo_authorized");
  };

  // Splash & Access Gate
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthorized) {
    return <AccessCodeGate onAuthorized={() => setIsAuthorized(true)} />;
  }

  if (!channels.length && !error && loading) {
    return (
      <div className="w-full h-screen bg-neutral-950 flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#FF7900] rounded-full animate-spin" />
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Chargement des flux en cours...</p>
      </div>
    );
  }

  if (selectedChannel && activeTab === "direct") {
    return (
      <div className="w-full h-screen bg-black flex flex-col">
        <HlsPlayer 
          url={getActiveStreamUrl(selectedChannel)}
          channelName={selectedChannel.name}
          onBack={() => {
            setSelectedChannel(null);
            setActiveTab("accueil");
          }}
          onFatalError={handleStreamError}
          isFavorite={favorites.has(selectedChannel.id)}
          onToggleFavorite={() => {
            setFavorites(prev => {
              const next = new Set(prev);
              if (next.has(selectedChannel.id)) {
                next.delete(selectedChannel.id);
              } else {
                next.add(selectedChannel.id);
              }
              return next;
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-white font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {error && activeTab === "accueil" && (
            <div className="m-4 p-4 bg-red-950/20 border border-red-500/20 rounded-2xl">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              <button
                onClick={() => loadChannels(true)}
                className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all"
              >
                {refreshing ? "Rafraîchissement..." : "Réessayer"}
              </button>
            </div>
          )}

          {activeTab === "accueil" && (
            <div className="space-y-8 p-6">
              <ChannelCarousel 
                channels={dedupeByCore(categorisedList.filter(c => c.category === "TNT & Généralistes"))}
                title="TNT & Généralistes"
                onChannelSelect={(channel) => {
                  setSelectedChannel(channel);
                  setActiveTab("direct");
                }}
              />
              
              {["Sports", "Cinéma & Séries", "Documentaires", "Jeunesse", "Musique", "Actualités"].map(cat => (
                <ChannelCarousel
                  key={cat}
                  channels={dedupeByCore(categorisedList.filter(c => c.category === cat))}
                  title={cat}
                  onChannelSelect={(channel) => {
                    setSelectedChannel(channel);
                    setActiveTab("direct");
                  }}
                />
              ))}
            </div>
          )}

          {activeTab === "grille" && <ChannelGrid channels={categorisedList} onChannelSelect={(c) => { setSelectedChannel(c); setActiveTab("direct"); }} />}
          {activeTab === "admin" && <ChannelAdmin />}
          {activeTab === "epg" && selectedChannel && <EpgTimeline channelName={selectedChannel.name} onClose={() => setActiveTab("accueil")} />}
          {activeTab === "sports" && <SportsCenter />}
          {activeTab === "integrations" && <Integrations />}
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
