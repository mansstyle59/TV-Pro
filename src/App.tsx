import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  RefreshCw, 
  LayoutGrid, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Trophy, 
  ArrowLeft,
  Star,
  Settings,
  Tv
} from "lucide-react";
import { ChannelLogo } from "./components/ChannelLogo";
import { ChannelTile } from "./components/ChannelTile";
import { ChannelRemote } from "./components/ChannelRemote";
import { HlsPlayer } from "./components/HlsPlayer";
import { ChannelAdmin } from "./components/ChannelAdmin";
import { getSavedXtreamCredentials, fetchXtreamChannels } from "./utils/xtreamClient";

// ==========================================
// CONFIGURATION
// ==========================================

const CATEGORIES = [
  { id: "france", name: "France", badgeCount: 0, icon: "🇫🇷" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "cinema", name: "Cinéma", icon: "🎬" },
  { id: "series", name: "Séries", icon: "📺" },
  { id: "actualites", name: "Actualités", icon: "📰" },
  { id: "jeunesse", name: "Jeunesse", icon: "👨‍👩‍👧" },
  { id: "musique", name: "Musique", icon: "🎵" },
  { id: "documentaires", name: "Documentaires", icon: "📚" },
  { id: "divertissement", name: "Divertissement", icon: "🎭" },
];

const KEYWORDS = {
  sports: ["sport", "bein", "foot", "rmc", "eurosport", "dazn", "nba", "tennis", "rugby", "equidia", "automoto", "golf"],
  cinema: ["ciné", "film", "ocs", "canal+ cin", "cineplus", "paramount", "tcm", "action", "w9"],
  series: ["série", "polar", "fiction", "novelas", "serieclub", "syfy", "13eme"],
  actualites: ["info", "news", "bfm", "cnews", "lci", "france 24", "cnn", "euronews"],
  jeunesse: ["gulli", "tiji", "canal j", "disney", "nickelodeon", "toonami", "boomerang", "cartoon"],
  musique: ["musique", "trace", "melody", "mtv", "rfm", "mcm", "nrj", "w9"],
  documentaires: ["doc", "histoire", "découverte", "science", "planete", "nature", "voyage", "ushuaia", "chasse"],
  divertissement: ["diver", "comédie", "paris", "teva", "rtl9"],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"live_tv" | "sports">("live_tv");
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [showRemote, setShowRemote] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchQuery("");
  }, [selectedCategory]);

  // Fetch Channels
  const loadChannels = async (retries = 3) => {
    setLoading(true);
    for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch("/api/channels");
          const data = await res.json();
          if (data && data.success && Array.isArray(data.channels)) {
            // Filter for French channels only as requested
            // Channel country might be 'France' or 'FR'
            setChannels(data.channels.filter((c: any) => 
                c.country?.toLowerCase() === "france" || 
                c.country?.toLowerCase() === "fr" || 
                c.name.toLowerCase().includes("france")
            ));
            return; // Success
          }
        } catch (err) {
          console.error(`Attempt ${i + 1} failed:`, err);
        }
        // Wait a bit before retrying, skipping for last attempt
        if (i < retries - 1) await new Promise(r => setTimeout(r, 1000));
    }
    setLoading(false);
  };

  useEffect(() => { loadChannels(); }, []);
  
  const filteredCategories = useMemo(() => {
    return [...CATEGORIES].sort((a, b) => {
        if (a.id === 'france') return -1;
        if (b.id === 'france') return 1;
        if (a.id === 'sports') return -1;
        if (b.id === 'sports') return 1;
        return a.name.localeCompare(b.name);
    }).map(cat => {
        let count = 0;
        if(cat.id === "france") count = channels.length;
        else {
            count = channels.filter(ch => {
                const catName = ch.categoryOverride?.toLowerCase() || "";
                const groupTitle = ch.groupTitle?.toLowerCase() || "";
                const chName = ch.name.toLowerCase() || "";
                const catKeys = KEYWORDS[cat.id as keyof typeof KEYWORDS] || [];
                
                return (catName.includes(cat.id.toLowerCase())) ||
                       (groupTitle.includes(cat.id.toLowerCase())) ||
                       catKeys.some(key => chName.includes(key.toLowerCase()));
            }).length;
        }
        return { ...cat, count };
    });
  }, [channels]);

  const filteredChannels = useMemo(() => {
    if (!selectedCategory) return [];
    if(selectedCategory.id === "france") {
       let result = channels;
       if (searchQuery) {
          result = result.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
       }
       return result;
    }

    let result = channels.filter(ch => {
        const catName = ch.categoryOverride?.toLowerCase() || "";
        const groupTitle = ch.groupTitle?.toLowerCase() || "";
        
        const catKeys = KEYWORDS[selectedCategory.id as keyof typeof KEYWORDS] || [];
        
        return (catName.includes(selectedCategory.id.toLowerCase())) ||
               (groupTitle.includes(selectedCategory.id.toLowerCase())) ||
               catKeys.some(key => ch.name.toLowerCase().includes(key.toLowerCase()));
    });
    
    if (searchQuery) {
        result = result.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return result.sort((a, b) => {
        return a.name.localeCompare(b.name);
    });
  }, [selectedCategory, channels, searchQuery]);

  const channelGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredChannels.forEach(ch => {
      const name = ch.name || "Unknown";
      const base = name.replace(/\s*(4K|FHD|1080P|HD|720P|SD)\s*/gi, "").trim() || "Unknown";
      if (!groups[base]) groups[base] = [];
      groups[base].push(ch);
    });
    return groups;
  }, [filteredChannels]);

  return (
    <div className="min-h-screen bg-[#0f171e] font-sans text-white">
      <div className="w-full bg-[#0a0e12] min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="px-8 py-10 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-[#1a1f24] to-[#0a0e12]">
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            <Tv className="text-[#00a8e1]" size={36} />
            <span className="text-[#00a8e1]">Denden</span>TV
          </h1>
          <button 
            onClick={() => setShowAdminPanel(true)} 
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
          >
            <Settings size={22} />
          </button>
        </header>

        {/* Admin Panel */}
        <AnimatePresence>
          {showAdminPanel && (
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="absolute inset-0 bg-[#1a1f24] z-[200] p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">Configuration</h2>
                <button onClick={() => setShowAdminPanel(false)}><X size={24} /></button>
              </div>
              <ChannelAdmin channels={channels} reload={loadChannels} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {!activeChannel && (
          <div className="flex-1 p-4">
             {activeTab === "live_tv" && !selectedCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredCategories.map(cat => (
                    <div 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      role="button"
                      tabIndex={0}
                      className="bg-gradient-to-br from-[#1a1f24] to-[#13171b] border border-white/10 px-6 py-5 rounded-3xl flex items-center gap-6 hover:border-[#00a8e1]/50 hover:bg-[#1a1f24] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-950/20 group transform hover:-translate-y-1"
                    >
                       <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                       <div className="flex flex-col items-start text-left">
                         <span className="font-bold text-lg text-white/90 tracking-tight group-hover:text-white transition-colors">{cat.name}</span>
                         <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1 group-hover:text-white/60 transition-colors">{cat.count} chaînes</span>
                       </div>
                    </div>
                  ))}
                </div>
             )}

             {activeTab === "live_tv" && selectedCategory && (
                <div className="space-y-6">
                    <div className="sticky top-0 bg-[#0a0e12]/90 backdrop-blur-md pt-6 pb-6 z-20 space-y-6 px-4">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-base text-[#00a8e1] font-semibold hover:text-white transition-colors">
                                <ChevronLeft size={20} /> Retour
                            </button>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <span className="text-3xl">{selectedCategory.icon}</span>
                                {selectedCategory.name}
                            </h2>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher une chaîne..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1a1f24] py-4 pl-12 pr-4 rounded-2xl text-base text-white/90 placeholder:text-white/30 focus:outline-none border border-white/10 focus:border-[#00a8e1]/50 transition-all shadow-inner relative focus:shadow-[0_0_20px_rgba(0,168,225,0.1)]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 px-4 pb-20">
                        {filteredChannels.map(ch => (
                            <ChannelTile key={ch.id} channel={ch} onClick={() => setActiveChannel(ch)} />
                        ))}
                    </div>
                </div>
             )}

             {activeTab === "sports" && (
                <div className="p-6 text-center space-y-4">
                    <h2 className="text-2xl font-black">Programme Sportif</h2>
                    <p className="text-white/60 text-sm">Le moteur intelligent scanne les événements en direct...</p>
                    <div className="animate-pulse bg-white/5 p-6 rounded-3xl h-32" />
                </div>
             )}
          </div>
        )}

        {/* Player */}
        {activeChannel && (
            <div className="flex-1 flex flex-col relative">
                {showRemote && (
                    <ChannelRemote 
                        channels={channels} 
                        onChannelSelect={setActiveChannel} 
                        onClose={() => setShowRemote(false)}
                        activeChannelId={activeChannel.id}
                    />
                )}
                <button onClick={() => setActiveChannel(null)} className="p-4 flex items-center gap-2"><ArrowLeft size={20} /> Retour</button>
                <div className="flex-1 bg-black flex items-center justify-center relative">
                    <HlsPlayer 
                        url={activeChannel.streamUrl} 
                        channelName={activeChannel.name} 
                        onMenuTV={() => setShowRemote(true)}
                    />
                </div>
                <div className="p-4 flex justify-between items-center bg-[#1a1f24]">
                  <span className="font-bold">{activeChannel.name}</span>
                  <button onClick={() => setShowRemote(true)} className="px-4 py-2 bg-[#00a8e1] rounded-lg text-sm font-bold flex items-center gap-2">
                    <Tv size={16} /> Chaînes
                  </button>
                </div>
            </div>
        )}

        {/* Nav */}
        <nav className="flex justify-around p-4 bg-[#0f171e]/80 backdrop-blur border-t border-white/5">
          <button onClick={() => { setActiveTab("live_tv"); setSelectedCategory(null); }} className={activeTab === "live_tv" ? "text-[#00a8e1]" : "text-white/50"}><LayoutGrid size={24}/></button>
          <button onClick={() => setActiveTab("sports")} className={activeTab === "sports" ? "text-[#00a8e1]" : "text-white/50"}><Trophy size={24}/></button>
        </nav>
      </div>
    </div>
  );
}
