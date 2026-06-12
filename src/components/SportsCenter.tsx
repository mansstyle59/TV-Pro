import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  MapPin, 
  Trophy, 
  ChevronRight, 
  Tv, 
  Filter, 
  CalendarDays, 
  Bell, 
  BellRing, 
  Play, 
  Sparkles, 
  Check, 
  Activity, 
  Radio, 
  Clock, 
  Compass,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChannelLogo } from './ChannelLogo';

interface EpgProgramme {
  title: string;
  start?: string;
  stop?: string;
  desc?: string;
}

interface Channel {
  id: number | string;
  name: string;
  logo?: string;
  category?: string;
  qualityLabel?: string;
  core?: string;
  epg?: {
    current: EpgProgramme | null;
    next?: EpgProgramme | null;
  };
}

interface SportsCenterProps {
  channels: Channel[];
  onPlayChannel: (channel: Channel) => void;
}

export function SportsCenter({ channels, onPlayChannel }: SportsCenterProps) {
  const [sportsSubTab, setSportsSubTab] = useState<"live" | "calendar" | "watchlist">("live");
  const [activeMonth, setActiveMonth] = useState("Juin");
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("Tous");
  
  // States for Live tab
  const [liveSearchQuery, setLiveSearchQuery] = useState("");
  const [liveNetworkFilter, setLiveNetworkFilter] = useState("Tous");
  
  const [followedEvents, setFollowedEvents] = useState<number[]>([]);

  const toggleFollow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowedEvents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const sports = ["Tous", "Football", "Coupe du Monde", "Tennis", "Rugby", "F1", "Cyclisme", "Multisports", "Basket", "Football Américain", "Sports Mécaniques", "Boxe", "MMA"];

  const events = useMemo(() => [
    { id: 1, month: "Février", date: "6 - 22 Février 2026", name: "Jeux Olympiques d'Hiver", sport: "Multisports", location: "Milan-Cortina, Italie", image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 2, month: "Février", date: "8 Février 2026", name: "Super Bowl LX", sport: "Football Américain", location: "Santa Clara, USA", image: "https://images.unsplash.com/photo-1508344928928-7137b2f427ed?auto=format&fit=crop&q=80&w=1600", broadcaster: "beIN Sports 1" },
    { id: 3, month: "Février", date: "6 Fév - 21 Mars 2026", name: "Tournoi des Six Nations", sport: "Rugby", location: "Europe", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 10, month: "Mai", date: "24 Mai 2026", name: "Grand Prix de Monaco", sport: "F1", location: "Monaco", image: "https://images.unsplash.com/photo-1534158914592-062992fbe0ea?auto=format&fit=crop&q=80&w=1600", broadcaster: "Canal+" },
    { id: 4, month: "Mai", date: "24 Mai - 7 Juin 2026", name: "Roland-Garros", sport: "Tennis", location: "Paris, France", image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 5, month: "Mai", date: "30 Mai 2026", name: "Finale Ligue des Champions", sport: "Football", location: "Budapest, Hongrie", image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1600", broadcaster: "Canal+" },
    { id: 6, month: "Juin", date: "11 Juin - 19 Juillet 2026", name: "Coupe du Monde de la FIFA 2026™", sport: "Football", location: "USA, Canada, Mexique", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    
    // Nouveaux événements DAZN
    { id: 1001, month: "Juin", date: "Ce Soir - 20:45", name: "RSC Anderlecht vs Club Brugge", sport: "Football", location: "Lotto Park, Bruxelles", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1600", broadcaster: "DAZN" },
    { id: 1002, month: "Juin", date: "Samedi - 23:00", name: "PFL Europe: Paris", sport: "MMA", location: "Accor Arena, Paris", image: "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&q=80&w=1600", broadcaster: "DAZN" },
    { id: 1003, month: "Juin", date: "Dimanche - 21:00", name: "Championnat du Monde Boxe", sport: "Boxe", location: "Riyadh, Arabie Saoudite", image: "https://images.unsplash.com/photo-1552072092-7f9b8d63fd53?auto=format&fit=crop&q=80&w=1600", broadcaster: "DAZN" },

    // Nouveaux événements Coupe du Monde
    { id: 601, month: "Juin", date: "11 Juin 2026 - 20:00", name: "Mexique vs Match d'Ouverture", sport: "Coupe du Monde", location: "Azteca, Mexico", image: "https://images.unsplash.com/photo-1518605368461-1e12d1b0d235?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 602, month: "Juin", date: "12 Juin 2026 - 21:00", name: "USA vs Match Gr. B", sport: "Coupe du Monde", location: "SoFi Stadium, LA", image: "https://images.unsplash.com/photo-1551280338-c6ce19163e7b?auto=format&fit=crop&q=80&w=1600", broadcaster: "beIN Sports 1" },
    { id: 603, month: "Juin", date: "12 Juin 2026 - 18:00", name: "Canada vs Match Gr. C", sport: "Coupe du Monde", location: "BMO Field, Toronto", image: "https://images.unsplash.com/photo-1575361204481-42ab85c1eb07?auto=format&fit=crop&q=80&w=1600", broadcaster: "beIN Sports 1" },
    { id: 604, month: "Juin", date: "15 Juin 2026 - 20:00", name: "Belgique vs Maroc", sport: "Coupe du Monde", location: "MetLife Stadium, NJ", image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 605, month: "Juin", date: "16 Juin 2026 - 21:00", name: "France vs Brésil", sport: "Coupe du Monde", location: "Azteca, Mexico", image: "https://images.unsplash.com/photo-1518091043644-c1d44570a2c9?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 606, month: "Juin", date: "17 Juin 2026 - 21:00", name: "USA vs Espagne", sport: "Coupe du Monde", location: "SoFi Stadium, LA", image: "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=1600", broadcaster: "M6" },
    { id: 607, month: "Juin", date: "18 Juin 2026 - 15:00", name: "Allemagne vs Japon", sport: "Coupe du Monde", location: "Mercedes-Benz, Atlanta", image: "https://images.unsplash.com/photo-1503614867175-68078351586a?auto=format&fit=crop&q=80&w=1600", broadcaster: "beIN Sports 1" },
    { id: 608, month: "Juin", date: "20 Juin 2026 - 21:00", name: "Argentine vs Pays-Bas", sport: "Coupe du Monde", location: "Hard Rock Stadium, Miami", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 609, month: "Juin", date: "22 Juin 2026 - 21:00", name: "France vs Portugal", sport: "Coupe du Monde", location: "AT&T Stadium, Dallas", image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=1600", broadcaster: "M6" },
    { id: 610, month: "Juin", date: "24 Juin 2026 - 18:00", name: "Belgique vs Canada", sport: "Coupe du Monde", location: "BMO Field, Toronto", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 611, month: "Juin", date: "26 Juin 2026 - 21:00", name: "Espagne vs Italie", sport: "Coupe du Monde", location: "MetLife Stadium, NJ", image: "https://images.unsplash.com/photo-1431631551065-22a36b51b32d?auto=format&fit=crop&q=80&w=1600", broadcaster: "M6" },
    { id: 612, month: "Juin", date: "28 Juin 2026 - 16:00", name: "Huitièmes de Finale 1", sport: "Coupe du Monde", location: "NRG Stadium, Houston", image: "https://images.unsplash.com/photo-1557339352-5956e54e4efc?auto=format&fit=crop&q=80&w=1600", broadcaster: "beIN Sports 1" },
    { id: 613, month: "Juin", date: "30 Juin 2026 - 20:00", name: "Huitièmes de Finale 4", sport: "Coupe du Monde", location: "Mercedes-Benz, Atlanta", image: "https://images.unsplash.com/photo-1561053720-7f2e1e07dbaf?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 614, month: "Juillet", date: "4 Juillet 2026 - 17:00", name: "Quarts de Finale", sport: "Coupe du Monde", location: "Gillette Stadium, Boston", image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 615, month: "Juillet", date: "9 Juillet 2026 - 20:00", name: "Demi-Finale 1", sport: "Coupe du Monde", location: "AT&T Stadium, Dallas", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    { id: 616, month: "Juillet", date: "10 Juillet 2026 - 20:00", name: "Demi-Finale 2", sport: "Coupe du Monde", location: "Mercedes-Benz, Atlanta", image: "https://images.unsplash.com/photo-1553152531-bcbc0d99ba64?auto=format&fit=crop&q=80&w=1600", broadcaster: "M6" },
    { id: 617, month: "Juillet", date: "19 Juillet 2026 - 21:00", name: "Finale Coupe du Monde 2026™", sport: "Coupe du Monde", location: "MetLife Stadium, NJ", image: "https://images.unsplash.com/photo-1518605368461-1e12d1b0d235?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },

    { id: 7, month: "Juin", date: "13 - 14 Juin 2026", name: "24 Heures du Mans", sport: "Sports Mécaniques", location: "Le Mans, France", image: "https://images.unsplash.com/photo-1558500201-1e9a3b6d47f9?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 8, month: "Juin", date: "29 Juin - 12 Juillet 2026", name: "Wimbledon", sport: "Tennis", location: "Londres, UK", image: "https://images.unsplash.com/photo-1622279457486-62dcc4a4bd13?auto=format&fit=crop&q=80&w=1600", broadcaster: "beIN Sports 1" },
    { id: 9, month: "Juillet", date: "4 - 26 Juillet 2026", name: "Tour de France", sport: "Cyclisme", location: "France, Espagne", image: "https://images.unsplash.com/photo-1554923303-91185b2ee3df?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 11, month: "Août", date: "31 Août - 13 Sept. 2026", name: "US Open", sport: "Tennis", location: "New York, USA", image: "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&q=80&w=1600", broadcaster: "Eurosport 1" },
  ], []);

  // Bulletproof fuzzy matching between event broadcaster & real live channel list
  const getMatchedChannel = (broadcasterName: string): Channel | null => {
    if (!broadcasterName || channels.length === 0) return null;
    const lowerBroadcaster = broadcasterName.toLowerCase().trim();
    
    // Normalize function to strip accents, spaces, dashes
    const normalize = (str: string) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""); // keep only alphanumeric
    };

    const normB = normalize(lowerBroadcaster);
    
    // 1. Exact match on normalized channel names or cores
    let match = channels.find(c => {
      const normC = normalize(c.name || "");
      const normCore = normalize(c.core || "");
      return normC === normB || normCore === normB;
    });
    if (match) return match;

    // 2. Specialty mapping rules
    // beIN Sports mapping
    if (normB.includes("beinsport")) {
      const numMatch = lowerBroadcaster.match(/\d+/);
      const num = numMatch ? numMatch[0] : "";
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("bein") && (num ? nameLower.includes(num) : !/\d+/.test(nameLower));
      });
      if (match) return match;
    }

    // Canal+ mapping
    if (normB.includes("canal")) {
      const isSport = normB.includes("sport");
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("canal") && (isSport ? nameLower.includes("sport") : !nameLower.includes("sport"));
      });
      if (match) return match;
    }

    // Eurosport mapping
    if (normB.includes("eurosport")) {
      const numMatch = lowerBroadcaster.match(/\d+/);
      const num = numMatch ? numMatch[0] : "";
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("eurosport") && (num ? nameLower.includes(num) : !/\d+/.test(nameLower));
      });
      if (match) return match;
    }

    // RMC Sport mapping
    if (normB.includes("rmc")) {
      const numMatch = lowerBroadcaster.match(/\d+/);
      const num = numMatch ? numMatch[0] : "";
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("rmc") && (num ? nameLower.includes(num) : !/\d+/.test(nameLower));
      });
      if (match) return match;
    }

    // France Télévisions (France 2, France 3, France 4-5)
    if (normB.includes("francetv") || normB.includes("francetele")) {
      match = channels.find(c => c.name.toLowerCase().includes("france 2") || c.name.toLowerCase().includes("france 2"));
      if (match) return match;
    }

    // L'Équipe
    if (normB.includes("lequipe") || normB.includes("equipe")) {
      match = channels.find(c => c.name.toLowerCase().includes("equipe") || c.name.toLowerCase().includes("équipe"));
      if (match) return match;
    }

    // 3. Fallback partial maps
    return channels.find(c => {
      const normC = normalize(c.name || "");
      return normC.includes(normB) || normB.includes(normC);
    }) || null;
  };

  const handlePlayBroadcaster = (broadcasterName: string) => {
    const matched = getMatchedChannel(broadcasterName);
    if (matched) {
      onPlayChannel(matched);
    } else {
      // If we don't have it, try to find ANY active sports channel
      const sportChannel = activeSportsChannels[0];
      if (sportChannel) {
        onPlayChannel(sportChannel);
      } else if (channels.length > 0) {
        onPlayChannel(channels[0]);
      }
    }
  };

  // Identify real active sport channels in active configuration
  const activeSportsChannels = useMemo(() => {
    return channels.filter(c => {
      const cat = (c.category || "").toLowerCase();
      const name = (c.name || "").toLowerCase();
      return (
        cat.includes("sport") || 
        cat.includes("foot") ||
        cat.includes("l'équipe") ||
        name.includes("sport") || 
        name.includes("bein") || 
        name.includes("eurosport") || 
        name.includes("rmc") || 
        name.includes("dazn") || 
        name.includes("foot") || 
        name.includes("golf") || 
        name.includes("canal+ s") ||
        name.includes("canal+s") ||
        name.includes("chasse") || 
        name.includes("auto moto") || 
        name.includes("l'equipe") || 
        name.includes("l'équipe")
      );
    });
  }, [channels]);

  // Filtered live channels based on search & network filters
  const filteredLiveChannels = useMemo(() => {
    return activeSportsChannels.filter(c => {
      const name = (c.name || "").toLowerCase();
      const matchesSearch = name.includes(liveSearchQuery.toLowerCase().trim()) || 
                            (c.epg?.current?.title || "").toLowerCase().includes(liveSearchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (liveNetworkFilter === "Tous") return true;
      
      const normNetwork = liveNetworkFilter.toLowerCase();
      if (normNetwork === "canal+") return name.includes("canal") && !name.includes("sport");
      if (normNetwork === "canal+ sport") return name.includes("canal") && name.includes("sport");
      return name.includes(normNetwork);
    });
  }, [activeSportsChannels, liveSearchQuery, liveNetworkFilter]);

  // Filtered events based on filters
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(eventSearchQuery.toLowerCase().trim()) || 
                          e.location.toLowerCase().includes(eventSearchQuery.toLowerCase().trim()) ||
                          e.broadcaster.toLowerCase().includes(eventSearchQuery.toLowerCase().trim());
      const matchSport = selectedSport === "Tous" || e.sport === selectedSport;
      const matchMonth = e.month === activeMonth || eventSearchQuery.length > 2; // Override month if searching
      return matchSearch && matchSport && matchMonth;
    });
  }, [events, eventSearchQuery, selectedSport, activeMonth]);

  // Filtered watchlist events
  const watchlistEvents = useMemo(() => {
    return events.filter(e => followedEvents.includes(e.id));
  }, [events, followedEvents]);

  return (
    <div className="bg-[#050505] min-h-screen text-white pb-32">
      {/* Premium Hero Banner with Adaptive Accents */}
      <div className="relative pt-24 pb-12 px-6 md:px-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=2000" 
            alt="Sports Stadium" 
            className="w-full h-full object-cover opacity-15 saturate-150" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
        </div>
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-[#FF7900]/10 blur-[130px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3 mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3 mix-blend-screen" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-[#FF7900] to-[#cc6000] p-2.5 rounded-2xl shadow-lg shadow-[#FF7900]/20">
                <Trophy size={26} className="text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-[0.25em] text-[#FF7900] uppercase block">NexTv Premium</span>
                <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-white font-display">
                  Portail Sports
                </h1>
              </div>
            </div>
            <p className="text-neutral-400 max-w-xl text-base leading-relaxed font-medium">
              Le meilleur de vos compétitions en direct : accédez à vos flux TV sportifs en 1 clic et suivez l'agenda des grands tournois de l'année 2026.
            </p>
          </div>

          {/* Core Navigation Sub-tabs */}
          <div className="bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5 flex gap-1 relative z-10 backdrop-blur-xl shrink-0">
            <button
              onClick={() => setSportsSubTab("live")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all duration-300 ${
                sportsSubTab === "live"
                  ? "bg-[#FF7900] text-white shadow-lg shadow-[#FF7900]/25"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Radio size={14} className={sportsSubTab === "live" ? "animate-pulse text-white" : "text-neutral-500"} />
              En Direct ({activeSportsChannels.length})
            </button>
            <button
              onClick={() => setSportsSubTab("calendar")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all duration-300 ${
                sportsSubTab === "calendar"
                  ? "bg-[#FF7900] text-white shadow-lg shadow-[#FF7900]/25"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <CalendarDays size={14} />
              Calendrier ({events.length})
            </button>
            <button
              onClick={() => setSportsSubTab("watchlist")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all duration-300 relative ${
                sportsSubTab === "watchlist"
                  ? "bg-[#FF7900] text-white shadow-lg shadow-[#FF7900]/25"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Bell size={14} />
              Suivis
              {watchlistEvents.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-neutral-950">
                  {watchlistEvents.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
        <AnimatePresence mode="wait">
          
          {/* ======================= TAB: EN DIRECT (LIVE TV SPORTS) ======================= */}
          {sportsSubTab === "live" && (
            <motion.div
              key="live-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Filter controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-900/40 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                {/* Search in Sport channels */}
                <div className="relative w-full md:w-80">
                  <input 
                    type="text" 
                    value={liveSearchQuery}
                    onChange={(e) => setLiveSearchQuery(e.target.value)}
                    placeholder="Filtrer vos chaînes sportives..."
                    className="w-full bg-[#0F0F0F] border border-white/10 hover:border-white/20 focus:border-[#FF7900] focus:bg-[#121212] rounded-2xl py-3 pl-10 pr-4 outline-none transition-all placeholder:text-neutral-500 text-sm text-white"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                </div>

                {/* Micro logo quick filter */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
                  {["Tous", "Canal+", "beIN Sport", "Eurosport", "RMC", "DAZN"].map(network => (
                    <button
                      key={network}
                      onClick={() => setLiveNetworkFilter(network)}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                        liveNetworkFilter === network 
                          ? "bg-[#FF7900]/15 border-[#FF7900]/30 text-[#FF7900]" 
                          : "bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {network}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of live channels */}
              {filteredLiveChannels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredLiveChannels.map((channel) => {
                    const epgActive = channel.epg?.current;
                    return (
                      <div
                        key={channel.id}
                        onClick={() => onPlayChannel(channel)}
                        className="group relative bg-[#0e0e0e] hover:bg-[#121212] border border-white/5 hover:border-[#FF7900]/40 rounded-2xl p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl"
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF7900]/5 rounded-full blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="space-y-4">
                          {/* Channel Logo & Badging info */}
                          <div className="flex items-start justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden shrink-0">
                              <ChannelLogo 
                                logo={channel.logo} 
                                name={channel.name} 
                                className="w-full h-full object-contain filter brightness-95" 
                              />
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {channel.qualityLabel && (
                                <span className="bg-neutral-900 text-neutral-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border border-white/5 shadow">
                                  {channel.qualityLabel}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[8px] font-black bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded tracking-wide uppercase">
                                <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" /> Direct
                              </span>
                            </div>
                          </div>

                          {/* Channel Name */}
                          <div>
                            <h3 className="font-extrabold text-neutral-100 group-hover:text-white text-sm line-clamp-1 leading-tight tracking-tight">
                              {channel.name}
                            </h3>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-black block mt-0.5">
                              {channel.category || "Sports"}
                            </span>
                          </div>

                          {/* Live EPG Information */}
                          {epgActive ? (
                            <div className="bg-[#050505] p-3 rounded-xl border border-white/5 space-y-1.5">
                              <span className="text-[9px] uppercase font-black text-[#FF7900] tracking-widest flex items-center gap-1.5">
                                <Activity size={10} /> En Cours
                              </span>
                              <p className="text-[11px] font-bold text-neutral-200 line-clamp-1 leading-snug">
                                {channel.epg?.current?.title}
                              </p>
                              {/* Micro Timeline Indicator */}
                              <div className="h-1 bg-neutral-900 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#FF7900] to-cyan-500 w-2/3 rounded-full" />
                              </div>
                            </div>
                          ) : (
                            <div className="bg-[#050505]/40 p-2.5 rounded-xl border border-[#151515] text-center">
                              <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold block">
                                Flux Live Actif ⚡
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Watch button inside card */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-neutral-400 group-hover:text-white text-xs">
                          <span className="font-semibold text-[10px] uppercase tracking-widest group-hover:text-[#FF7900] transition-colors">
                            Lancer le flux
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-neutral-900 group-hover:bg-[#FF7900] group-hover:text-white flex items-center justify-center transition-all duration-300 border border-white/5">
                            <Play size={12} fill="currentColor" strokeWidth={0} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-3xl bg-neutral-900/10">
                  <div className="w-20 h-20 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-neutral-500">
                    <Radio size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Aucune chaîne trouvée</h3>
                  <p className="text-neutral-400 text-sm max-w-sm">
                    Aucune chaîne sportive ne correspond à vos filtres de recherche. Veuillez modifier vos filtres.
                  </p>
                  <button 
                    onClick={() => { setLiveSearchQuery(""); setLiveNetworkFilter("Tous"); }}
                    className="mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ======================= TAB: CALENDRIER (SPORTS EVENTS) ======================= */}
          {sportsSubTab === "calendar" && (
            <motion.div
              key="calendar-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Dynamic Filter Header */}
              <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center bg-neutral-900/30 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                {/* Search query */}
                <div className="relative w-full lg:w-80 shrink-0">
                  <input 
                    type="text" 
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    placeholder="Equipe, pays, diffuseur..."
                    className="w-full bg-[#0F0F0F] border border-white/10 hover:border-white/20 focus:border-[#FF7900] focus:bg-[#121212] rounded-2xl py-3 pl-10 pr-4 outline-none transition-all placeholder:text-neutral-500 text-sm text-white"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                </div>

                {/* Sports Horizontal Rail */}
                <div className="overflow-x-auto no-scrollbar pb-1 w-full flex gap-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-neutral-500 uppercase tracking-widest mr-2 select-none border-r border-white/10 pr-4">
                    <Filter size={12} /> Sports
                  </span>
                  {sports.filter(s => events.some(e => e.sport === s) || s === "Tous").map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSport(s)}
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                        selectedSport === s 
                          ? "bg-[#FF7900] text-white shadow-md shadow-[#FF7900]/10"
                          : "bg-transparent text-neutral-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Months Vertical/Horizontal timeline list */}
              <div className="overflow-x-auto no-scrollbar pb-2">
                <div className="flex gap-2">
                  {months.map(m => (
                    <button
                      key={m}
                      onClick={() => { setActiveMonth(m); setEventSearchQuery(""); }}
                      className={`px-5 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] whitespace-nowrap transition-all duration-200 ${
                        !eventSearchQuery && activeMonth === m
                          ? "bg-white text-black shadow-lg shadow-white/10 scale-102"
                          : "bg-[#0E0E0E] text-neutral-400 hover:text-white border border-white/5"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events Grid layout */}
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEvents.map((event) => {
                    const matchedChan = getMatchedChannel(event.broadcaster);
                    const isFollowed = followedEvents.includes(event.id);
                    
                    return (
                      <div
                        key={event.id}
                        onClick={() => handlePlayBroadcaster(event.broadcaster)}
                        className="group relative flex flex-col bg-[#0e0e0e] border border-white/5 hover:border-[#FF7900]/40 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-2xl h-[330px]"
                      >
                        {/* Event Photo with gradients */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                          <img 
                            src={event.image} 
                            alt={event.name} 
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 brightness-[0.55] group-hover:brightness-[0.65]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black via-neutral-950/70 to-transparent" />
                        </div>

                        {/* Content inside photo container */}
                        <div className="relative z-10 flex flex-col h-full justify-between p-5">
                          {/* Top row: Sport Tag & Notifications Flag */}
                          <div className="flex justify-between items-start gap-4">
                            <span className="bg-white/10 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-white shadow-xl">
                              {event.sport}
                            </span>

                            <button 
                              onClick={(e) => toggleFollow(event.id, e)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md border transition-all ${
                                isFollowed 
                                  ? 'bg-[#FF7900] text-white border-[#FF7900] shadow-lg shadow-[#FF7900]/25' 
                                  : 'bg-black/45 border-white/10 text-white hover:bg-black/80 hover:scale-105'
                              }`}
                              title="Suivre cet événement"
                            >
                              {isFollowed ? <BellRing size={14} className="animate-bounce" /> : <Bell size={14} />}
                            </button>
                          </div>

                          {/* Bottom info blocks */}
                          <div className="space-y-3">
                            {/* Date Line */}
                            <div className="flex items-center gap-1.5 text-[#FF7900] font-black uppercase tracking-widest text-[9px] drop-shadow-md">
                              <Calendar size={11} /> {event.date}
                            </div>

                            {/* Title */}
                            <h3 className="font-extrabold text-white text-lg leading-tight tracking-tight line-clamp-2 drop-shadow-md group-hover:text-amber-400 transition-colors">
                              {event.name}
                            </h3>

                            {/* Location tag */}
                            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                              <MapPin size={11} className="text-[#FF7900]" />
                              <span className="truncate">{event.location}</span>
                            </div>

                            {/* Match Play Badging & Channel Finder Sync */}
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                              {matchedChan ? (
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-xl">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                  <span className="text-[10px] font-black uppercase tracking-wide">
                                    {matchedChan.name} (Direct)
                                  </span>
                                </div>
                              ) : (
                                <div className="bg-white/5 border border-white/10 text-neutral-300 px-2.5 py-1.5 rounded-xl">
                                  <span className="text-[10px] font-black uppercase tracking-wide">
                                    Disponible sur {event.broadcaster}
                                  </span>
                                </div>
                              )}

                              <div className="w-8 h-8 rounded-full bg-[#FF7900] text-white flex items-center justify-center group-hover:scale-105 transition-all shadow-md">
                                <Play size={10} fill="currentColor" strokeWidth={0} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-3xl bg-neutral-900/10">
                  <div className="w-20 h-20 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-neutral-500">
                    <CalendarDays size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Aucun événement</h3>
                  <p className="text-neutral-400 text-sm max-w-sm">
                    Il n'y a aucun événement majeur prévu pour {activeMonth} dans ce sport.
                  </p>
                  <button 
                    onClick={() => { setEventSearchQuery(""); setSelectedSport("Tous"); setActiveMonth("Juin"); }}
                    className="mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ======================= TAB: WATCHLIST (SUIVIS) ======================= */}
          {sportsSubTab === "watchlist" && (
            <motion.div
              key="watchlist-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-neutral-900/20 p-6 rounded-3xl border border-white/5 space-y-2">
                <span className="text-[10px] font-black text-[#FF7900] uppercase tracking-[0.2em] block">Mes Alertes Compétitions</span>
                <h2 className="text-2xl font-black uppercase tracking-tight">Vos Événements Suivis</h2>
                <p className="text-neutral-500 text-sm">
                  Retrouvez ici tous les grands événements sportifs que vous avez marqués pour recevoir des alertes de diffusion de match.
                </p>
              </div>

              {watchlistEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {watchlistEvents.map((event) => {
                    const matchedChan = getMatchedChannel(event.broadcaster);
                    return (
                      <div
                        key={event.id}
                        onClick={() => handlePlayBroadcaster(event.broadcaster)}
                        className="group relative flex flex-col bg-[#0e0e0e] border border-white/5 hover:border-[#FF7900]/40 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 shadow-2xl h-[310px]"
                      >
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                          <img 
                            src={event.image} 
                            alt={event.name} 
                            className="w-full h-full object-cover brightness-[0.55]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black via-neutral-950/70 to-transparent" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between p-5">
                          <div className="flex justify-between items-start gap-4">
                            <span className="bg-white/10 backdrop-blur-xl px-2.5 py-1.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-white">
                              {event.sport}
                            </span>
                            <button 
                              onClick={(e) => toggleFollow(event.id, e)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FF7900] text-white border border-[#FF7900] shadow-lg shadow-[#FF7900]/25"
                            >
                              <BellRing size={14} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5 text-[#FF7900] font-black uppercase tracking-widest text-[9px]">
                              <Calendar size={11} /> {event.date}
                            </div>
                            <h3 className="font-extrabold text-white text-base leading-tight tracking-tight line-clamp-2">
                              {event.name}
                            </h3>
                            <div className="flex items-center justify-between border-t border-white/5 pt-2">
                              {matchedChan ? (
                                <span className="text-[10.5px] font-bold text-emerald-400">
                                  🔴 En Direct sur {matchedChan.name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-neutral-400">
                                  Disponible sur {event.broadcaster}
                                </span>
                              )}
                              <div className="w-7 h-7 bg-[#FF7900] text-white rounded-full flex items-center justify-center">
                                <Play size={10} fill="currentColor" strokeWidth={0} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-neutral-900/15 p-6">
                  <Bell size={40} className="text-neutral-600 mb-4 animate-bounce" />
                  <p className="text-base font-extrabold text-white uppercase tracking-tight">Aucun événement suivi</p>
                  <p className="text-neutral-500 text-xs max-w-sm mt-1">
                    Parcourez le calendrier des grands matchs et cliquez sur la cloche pour suivre vos compétitions favorites.
                  </p>
                  <button 
                    onClick={() => setSportsSubTab("calendar")}
                    className="mt-6 px-4 py-2 bg-[#FF7900] hover:bg-[#cc6000] rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-[#FF7900]/10"
                  >
                    Explorer le Calendrier
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
