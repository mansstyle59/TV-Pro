import React, { useState, useMemo, useEffect } from 'react';
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
  AlertCircle,
  TrendingUp,
  Cpu,
  Bookmark,
  Mic,
  Share2,
  RefreshCw,
  Send,
  X
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

interface MatchEvent {
  id: number;
  sport: string;
  tournament: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  time: string;
  countdown: string;
  commentator: string;
  broadcaster: string;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  score?: string;
  minute?: string;
}

export function SportsCenter({ channels, onPlayChannel }: SportsCenterProps) {
  const [sportsSubTab, setSportsSubTab] = useState<"matchs" | "live" | "calendar" | "watchlist">("matchs");
  const [activeMonth, setActiveMonth] = useState("Juin");
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("Tous");
  
  // Telegram banner close state
  const [showTelegramBanner, setShowTelegramBanner] = useState(true);

  // States for Live Tab
  const [liveSearchQuery, setLiveSearchQuery] = useState("");
  const [liveNetworkFilter, setLiveNetworkFilter] = useState("Tous");
  
  const [followedEvents, setFollowedEvents] = useState<number[]>([]);

  // Simulated live minutes & scores updates
  const [simulatedMinutes, setSimulatedMinutes] = useState({ match1: 72, match2: 43, match3: 15 });
  const [simulatedScores, setSimulatedScores] = useState({ match1: "2 - 1", match2: "0 - 0", match3: "6-4, 3-2" });

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedMinutes(prev => {
        const nextM1 = prev.match1 < 90 ? prev.match1 + 1 : 72;
        const nextM2 = prev.match2 < 45 ? prev.match2 + 1 : 41;
        const nextM3 = prev.match3 < 60 ? prev.match3 + 1 : 15;
        return { match1: nextM1, match2: nextM2, match3: nextM3 };
      });
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const toggleFollow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFollowedEvents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const sports = ["Tous", "Football", "Coupe du Monde", "Tennis", "Rugby", "F1", "Cyclisme", "Multisports", "Basket", "Football Américain", "Sports Mécaniques", "Boxe", "MMA"];

  // Matches of the day inspired precisely by the Yacyn TV layout
  const todaysMatches = useMemo<MatchEvent[]>(() => [
    {
      id: 201,
      sport: "Football",
      tournament: "Coupe du Monde",
      teamA: "Canada",
      teamB: "Bosnie-Herzégovine",
      flagA: "🇨🇦",
      flagB: "🇧🇦",
      time: "09:00 PM",
      countdown: "Dans 3h 20m",
      commentator: "Khalil Al Balushi",
      broadcaster: "beIN Max 1",
      status: "UPCOMING"
    },
    {
      id: 202,
      sport: "Football",
      tournament: "Coupe du Monde",
      teamA: "États-Unis",
      teamB: "Paraguay",
      flagA: "🇺🇸",
      flagB: "🇵🇾",
      time: "03:00 AM",
      countdown: "Dans 9h 20m",
      commentator: "Ali Muhammad Ali",
      broadcaster: "beIN Max 2",
      status: "UPCOMING"
    },
    {
      id: 203,
      sport: "Football",
      tournament: "Euro 2026",
      teamA: "France",
      teamB: "Belgique",
      flagA: "🇫🇷",
      flagB: "🇧🇪",
      time: "08:45 PM",
      countdown: "En Direct",
      score: "2 - 1",
      minute: `${simulatedMinutes.match1}'`,
      commentator: "Grégoire Margotton",
      broadcaster: "TF1",
      status: "LIVE"
    },
    {
      id: 204,
      sport: "Football",
      tournament: "La Liga",
      teamA: "Real Madrid",
      teamB: "FC Barcelone",
      flagA: "🇪🇸",
      flagB: "🇪🇸",
      time: "09:00 PM",
      countdown: "En Direct",
      score: "1 - 1",
      minute: "Mi-temps",
      commentator: "Benjamin Da Silva",
      broadcaster: "beIN Sports 1",
      status: "LIVE"
    },
    {
      id: 205,
      sport: "Tennis",
      tournament: "Roland-Garros",
      teamA: "N. Djokovic",
      teamB: "R. Nadal",
      flagA: "🇷🇸",
      flagB: "🇪🇸",
      time: "03:00 PM",
      countdown: "En Direct",
      score: simulatedScores.match3,
      minute: "Set 2",
      commentator: "Eurosport Team",
      broadcaster: "Eurosport 1",
      status: "LIVE"
    },
    {
      id: 206,
      sport: "MMA",
      tournament: "PFL Europe Paris",
      teamA: "Doumbé",
      teamB: "Baki",
      flagA: "🇫🇷",
      flagB: "🇫🇷",
      time: "10:30 PM",
      countdown: "Dans 4h 50m",
      commentator: "DAZN Commentator",
      broadcaster: "DAZN",
      status: "UPCOMING"
    },
    {
      id: 207,
      sport: "Football",
      tournament: "Pro League",
      teamA: "RSC Anderlecht",
      teamB: "Club Brugge",
      flagA: "🇧🇪",
      flagB: "🇧🇪",
      time: "08:45 PM",
      countdown: "Ce soir",
      commentator: "Belgian French Mic",
      broadcaster: "DAZN",
      status: "UPCOMING"
    }
  ], [simulatedMinutes, simulatedScores]);

  const events = useMemo(() => [
    { id: 1, month: "Février", date: "6 - 22 Février 2026", name: "Jeux Olympiques d'Hiver", sport: "Multisports", location: "Milan-Cortina, Italie", image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 2, month: "Février", date: "8 Février 2026", name: "Super Bowl LX", sport: "Football Américain", location: "Santa Clara, USA", image: "https://images.unsplash.com/photo-1508344928928-7137b2f427ed?auto=format&fit=crop&q=80&w=1600", broadcaster: "beIN Sports 1" },
    { id: 3, month: "Février", date: "6 Fév - 21 Mars 2026", name: "Tournoi des Six Nations", sport: "Rugby", location: "Europe", image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 10, month: "Mai", date: "24 Mai 2026", name: "Grand Prix de Monaco", sport: "F1", location: "Monaco", image: "https://images.unsplash.com/photo-1534158914592-062992fbe0ea?auto=format&fit=crop&q=80&w=1600", broadcaster: "Canal+" },
    { id: 4, month: "Mai", date: "24 Mai - 7 Juin 2026", name: "Roland-Garros", sport: "Tennis", location: "Paris, France", image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=1600", broadcaster: "France 2" },
    { id: 5, month: "Mai", date: "30 Mai 2026", name: "Finale Ligue des Champions", sport: "Football", location: "Budapest, Hongrie", image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1600", broadcaster: "Canal+" },
    { id: 6, month: "Juin", date: "11 Juin - 19 Juillet 2026", name: "Coupe du Monde de la FIFA 2026™", sport: "Football", location: "USA, Canada, Mexique", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1600", broadcaster: "TF1" },
    
    { id: 1001, month: "Juin", date: "Ce Soir - 20:45", name: "RSC Anderlecht vs Club Brugge", sport: "Football", location: "Lotto Park, Bruxelles", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1600", broadcaster: "DAZN" },
    { id: 1002, month: "Juin", date: "Samedi - 23:00", name: "PFL Europe: Paris", sport: "MMA", location: "Accor Arena, Paris", image: "https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&q=80&w=1600", broadcaster: "DAZN" },
    { id: 1003, month: "Juin", date: "Dimanche - 21:00", name: "Championnat du Monde Boxe", sport: "Boxe", location: "Riyadh, Arabie Saoudite", image: "https://images.unsplash.com/photo-1552072092-7f9b8d63fd53?auto=format&fit=crop&q=80&w=1600", broadcaster: "DAZN" },

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

  // Fuzzy match between team/broadcaster & real channel list
  const getMatchedChannel = (broadcasterName: string): Channel | null => {
    if (!broadcasterName || channels.length === 0) return null;
    const lowerBroadcaster = broadcasterName.toLowerCase().trim();
    
    const normalize = (str: string) => {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    };

    const normB = normalize(lowerBroadcaster);
    
    let match = channels.find(c => {
      const normC = normalize(c.name || "");
      const normCore = normalize(c.core || "");
      return normC === normB || normCore === normB;
    });
    if (match) return match;

    if (normB.includes("beinsport") || normB.includes("beinmax")) {
      const numMatch = lowerBroadcaster.match(/\d+/);
      const num = numMatch ? numMatch[0] : "";
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("bein") && (num ? nameLower.includes(num) : !/\d+/.test(nameLower));
      });
      if (match) return match;
    }

    if (normB.includes("canal")) {
      const isSport = normB.includes("sport");
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("canal") && (isSport ? nameLower.includes("sport") : !nameLower.includes("sport"));
      });
      if (match) return match;
    }

    if (normB.includes("eurosport")) {
      const numMatch = lowerBroadcaster.match(/\d+/);
      const num = numMatch ? numMatch[0] : "";
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("eurosport") && (num ? nameLower.includes(num) : !/\d+/.test(nameLower));
      });
      if (match) return match;
    }

    if (normB.includes("rmc")) {
      const numMatch = lowerBroadcaster.match(/\d+/);
      const num = numMatch ? numMatch[0] : "";
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("rmc") && (num ? nameLower.includes(num) : !/\d+/.test(nameLower));
      });
      if (match) return match;
    }

    if (normB.includes("francetv") || normB.includes("france")) {
      const numMatch = lowerBroadcaster.match(/\d+/);
      const num = numMatch ? numMatch[0] : "2"; // Default to France 2
      match = channels.find(c => {
        const nameLower = c.name.toLowerCase();
        return nameLower.includes("france") && nameLower.includes(num);
      });
      if (match) return match;
    }

    if (normB.includes("lequipe") || normB.includes("equipe")) {
      match = channels.find(c => c.name.toLowerCase().includes("equipe") || c.name.toLowerCase().includes("équipe"));
      if (match) return match;
    }

    return channels.find(c => {
      const normC = normalize(c.name || "");
      return normC.includes(normB) || normB.includes(normC);
    }) || null;
  };

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

  const handlePlayBroadcaster = (broadcasterName: string) => {
    const matched = getMatchedChannel(broadcasterName);
    if (matched) {
      onPlayChannel(matched);
    } else {
      const sportChannel = activeSportsChannels[0];
      if (sportChannel) {
        onPlayChannel(sportChannel);
      } else if (channels.length > 0) {
        onPlayChannel(channels[0]);
      }
    }
  };

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

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(eventSearchQuery.toLowerCase().trim()) || 
                          e.location.toLowerCase().includes(eventSearchQuery.toLowerCase().trim()) ||
                          e.broadcaster.toLowerCase().includes(eventSearchQuery.toLowerCase().trim());
      const matchSport = selectedSport === "Tous" || e.sport === selectedSport;
      const matchMonth = e.month === activeMonth || eventSearchQuery.length > 2;
      return matchSearch && matchSport && matchMonth;
    });
  }, [events, eventSearchQuery, selectedSport, activeMonth]);

  const watchlistEvents = useMemo(() => {
    return events.filter(e => followedEvents.includes(e.id));
  }, [events, followedEvents]);

  // Today's matches filtered by selection
  const filteredMatches = useMemo(() => {
    return todaysMatches.filter(m => {
      if (selectedSport === "Tous") return true;
      if (selectedSport === "Coupe du Monde") return m.tournament === "Coupe du Monde";
      return m.sport === selectedSport;
    });
  }, [todaysMatches, selectedSport]);

  return (
    <div className="text-gray-100 min-h-screen pb-32 w-full">
      
      {/* Dynamic Telegram Broadcaster Read Banner precisely replicating Yacyn TV screenshot */}
      {showTelegramBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-purple-900/60 border border-purple-500/20 backdrop-blur-xl rounded-2xl p-3.5 mb-6 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <Send size={15} className="text-purple-300 transform -rotate-12" />
            </div>
            <div>
              <p className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                <span>Rejoins notre Telegram pour les nouveautés !</span>
                <span className="bg-purple-500 text-neutral-950 font-black text-[8px] px-1.5 py-0.5 rounded animate-pulse">NOUVEAU</span>
              </p>
              <p className="text-[10px] text-purple-200/80">
                L'actualité des streams en direct et les annonces de matchs d'aujourd'hui.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href="https://t.me/" 
              target="_blank" 
              rel="noreferrer" 
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-neutral-950 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-md cursor-pointer"
            >
              Visiter
            </a>
            <button 
              onClick={() => setShowTelegramBanner(false)}
              className="w-7 h-7 rounded-lg hover:bg-purple-800/40 text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Immersive Sub-header for Sports Center */}
      <div className="relative pt-6 pb-8 border-b border-white/[0.03] overflow-hidden rounded-3xl bg-gradient-to-b from-purple-950/10 to-transparent mb-8">
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[200px] bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 mix-blend-screen" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-purple-400 uppercase">Yacyn Live Engine</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Trophy size={20} className="text-purple-400" /> Événements & Matchs
            </h2>
            <p className="text-xs text-neutral-400 max-w-xl">
              Les directs et programmations en un clin d'œil. Ne ratez aucun derby de la Coupe du Monde.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="bg-[#0b121e]/80 p-1 border border-white/[0.04] rounded-xl flex gap-1 backdrop-blur-xl shrink-0 self-start lg:self-center">
            
            <button
              onClick={() => setSportsSubTab("matchs")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                sportsSubTab === "matchs"
                  ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Activity size={12} className={sportsSubTab === "matchs" ? "animate-pulse" : "text-neutral-500"} />
              Matchs du Jour ({todaysMatches.length})
            </button>

            <button
              onClick={() => setSportsSubTab("live")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                sportsSubTab === "live"
                  ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Radio size={12} />
              Chaînes Direct ({activeSportsChannels.length})
            </button>

            <button
              onClick={() => setSportsSubTab("calendar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                sportsSubTab === "calendar"
                  ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <CalendarDays size={12} />
              Grands Tournois
            </button>

            <button
              onClick={() => setSportsSubTab("watchlist")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer relative ${
                sportsSubTab === "watchlist"
                  ? "bg-purple-600 text-white font-black shadow-md shadow-purple-600/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Bookmark size={12} />
              Favoris
              {watchlistEvents.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center">
                  {watchlistEvents.length}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ======================= SUB-TAB: MATCHS DU JOUR (YACYN PRECISE REPLICA) ======================= */}
        {sportsSubTab === "matchs" && (
          <motion.div
            key="matchs-tab-sports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            {/* Quick Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.01] p-4 rounded-2xl border border-white/[0.03]">
              <div className="flex items-center gap-2 select-none">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00a8e1]">Mise à jour automatique par minute</span>
              </div>

              {/* Horizontal sports categorization rail */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
                {["Tous", "Football", "Coupe du Monde", "Tennis", "MMA"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSport(s)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                      selectedSport === s 
                        ? "bg-purple-600 text-white font-black"
                        : "bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Match Cards precisely matching the Yacyn TV layout from screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.map((match) => {
                const isLive = match.status === 'LIVE';
                const matchedChan = getMatchedChannel(match.broadcaster);

                return (
                  <div
                    key={match.id}
                    onClick={() => {
                      if (matchedChan) {
                        onPlayChannel(matchedChan);
                      } else {
                        handlePlayBroadcaster(match.broadcaster);
                      }
                    }}
                    className="relative bg-[#090b14]/90 hover:bg-[#121626]/90 border border-purple-500/10 hover:border-purple-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-lg"
                  >
                    {/* Background Light Beam effect */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20" />
                    
                    {/* Top line with sport indicator and live badge */}
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <span className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                        {match.sport}
                      </span>

                      {/* Live versus upcoming badge */}
                      {isLive ? (
                        <div className="flex items-center gap-1.5 text-[8.5px] font-black bg-red-600 text-white px-2.5 py-0.5 rounded border border-red-505/20 uppercase tracking-widest animate-pulse shadow-md shadow-red-600/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                          <span>EN DIRECT — {match.minute}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[8.5px] font-bold bg-white/[0.03] text-neutral-400 px-2 py-0.5 rounded border border-white/[0.05]">
                          <Clock size={9} />
                          <span>FIN DE COMPTE</span>
                        </div>
                      )}
                    </div>

                    {/* Main Matchup section with two countries & flags exactly like Yacyn TV */}
                    <div className="grid grid-cols-3 items-center mb-5 relative z-10">
                      
                      {/* Team A on Left */}
                      <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-[54px] h-[54px] rounded-full bg-[#161a29] border-2 border-purple-500/20 flex items-center justify-center text-3xl shadow-md select-none group-hover:scale-105 transition-transform duration-300">
                          {match.flagA}
                        </div>
                        <span className="text-xs font-extrabold text-neutral-200 uppercase tracking-wide group-hover:text-purple-300 transition-colors">
                          {match.teamA}
                        </span>
                      </div>

                      {/* Middle time block & countdown trigger */}
                      <div className="flex flex-col items-center justify-center text-center space-y-1">
                        
                        {/* Time or Active Score */}
                        {isLive ? (
                          <div className="font-mono text-xl font-black text-white bg-red-600/10 tracking-widest px-3 py-1.5 rounded-lg border border-red-600/30">
                            {match.score}
                          </div>
                        ) : (
                          <div className="font-mono text-[14px] font-bold text-white bg-white/[0.02] tracking-wider px-3.5 py-1 rounded-lg border border-white/5 shadow">
                            {match.time}
                          </div>
                        )}

                        {/* Sub-label showing remaining time or sets */}
                        <div className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
                          {match.countdown}
                        </div>
                      </div>

                      {/* Team B on Right */}
                      <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div className="w-[54px] h-[54px] rounded-full bg-[#161a29] border-2 border-purple-500/20 flex items-center justify-center text-3xl shadow-md select-none group-hover:scale-105 transition-transform duration-300">
                          {match.flagB}
                        </div>
                        <span className="text-xs font-extrabold text-neutral-200 uppercase tracking-wide group-hover:text-purple-300 transition-colors">
                          {match.teamB}
                        </span>
                      </div>

                    </div>

                    {/* Footer segment with Commentator, Tournament and Channel (with matched channels link) */}
                    <div className="grid grid-cols-3 pt-3 border-t border-white/[0.04] text-[9px] uppercase tracking-wider text-neutral-400 relative z-10 text-left">
                      
                      {/* Column 1: Commentator */}
                      <div className="flex items-center gap-1.5 text-neutral-300 min-w-0">
                        <Mic size={11} className="text-purple-400 shrink-0" />
                        <span className="truncate" title={match.commentator}>
                          {match.commentator}
                        </span>
                      </div>

                      {/* Column 2: Tournament */}
                      <div className="flex items-center justify-center gap-1.5 text-neutral-300 px-1 min-w-0">
                        <Trophy size={11} className="text-purple-400 shrink-0" />
                        <span className="truncate" title={match.tournament}>
                          {match.tournament}
                        </span>
                      </div>

                      {/* Column 3: Broadcaster link */}
                      <div className="flex items-center justify-end gap-1.5 min-w-0">
                        {matchedChan ? (
                          <span className="font-black text-emerald-400 flex items-center gap-1 truncate max-w-full">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse block" />
                            {matchedChan.name}
                          </span>
                        ) : (
                          <span className="text-neutral-400 truncate max-w-full">
                            {match.broadcaster}
                          </span>
                        )}
                        <Play size={8} fill="currentColor" strokeWidth={0} className="text-purple-400 shrink-0" />
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ======================= SUB-TAB: CHAÎNES SPORT ======================= */}
        {sportsSubTab === "live" && (
          <motion.div
            key="live-tab-sports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.01] p-4 rounded-2xl border border-white/[0.03]">
              {/* Search in Sport channels */}
              <div className="relative w-full md:w-80">
                <input 
                  type="text" 
                  value={liveSearchQuery}
                  onChange={(e) => setLiveSearchQuery(e.target.value)}
                  placeholder="Rechercher une chaîne sportive..."
                  className="w-full bg-[#080d16] border border-white/[0.06] hover:border-white/15 focus:border-[#00a8e1]/40 focus:bg-[#0c1322] rounded-xl py-2.5 pl-9 pr-4 text-xs text-white outline-none transition-all placeholder:text-neutral-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={13} />
              </div>

              {/* Quick Broadcaster filtering */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none w-full md:w-auto pb-1">
                {["Tous", "Canal+", "beIN Sport", "Eurosport", "RMC", "DAZN"].map(network => (
                  <button
                    key={network}
                    onClick={() => setLiveNetworkFilter(network)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                      liveNetworkFilter === network 
                        ? "bg-purple-600/20 border-purple-500/30 text-purple-300" 
                        : "bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    {network}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of live channels */}
            {filteredLiveChannels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredLiveChannels.map((channel) => {
                  const epgActive = channel.epg?.current;
                  return (
                    <div
                      key={channel.id}
                      onClick={() => onPlayChannel(channel)}
                      className="group relative bg-[#060c18]/60 hover:bg-[#0a1224]/80 border border-white/[0.03] hover:border-purple-500/30 rounded-2xl p-4.5 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-xl bg-white/[0.015] border border-white/[0.05] p-2 flex items-center justify-center relative shrink-0">
                            <ChannelLogo 
                              logo={channel.logo} 
                              name={channel.name} 
                              className="w-full h-full object-contain filter" 
                              containerClassName="w-full h-full bg-transparent p-0 ring-0 shadow-none border-0"
                            />
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {channel.qualityLabel && (
                              <span className="bg-[#00a8e1]/10 text-[#00a8e1] px-1 py-0.5 rounded text-[7.5px] font-black tracking-widest uppercase">
                                {channel.qualityLabel}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[7.5px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/15 px-1.5 py-0.5 rounded tracking-wide uppercase">
                              <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse block" /> Direct
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-bold text-white group-hover:text-purple-300 text-xs line-clamp-1 leading-tight transition-colors duration-200">
                            {channel.name}
                          </h3>
                          <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-semibold block mt-0.5">
                            {channel.category || "Sports"}
                          </span>
                        </div>

                        {epgActive ? (
                          <div className="bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.03] space-y-1">
                            <span className="text-[8px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
                              <Activity size={8} /> En cours
                            </span>
                            <p className="text-[10px] font-semibold text-neutral-200 line-clamp-1 leading-snug">
                              {channel.epg?.current?.title}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white/[0.005] py-2 rounded-lg border border-dashed border-white/[0.02] text-center">
                            <span className="text-[8.5px] text-neutral-500 uppercase tracking-wider block font-semibold">
                              Flux Direct 🟢
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-white/[0.03] flex items-center justify-between text-neutral-400 group-hover:text-white text-[9.5px]">
                        <span className="font-bold uppercase tracking-widest group-hover:text-purple-300 transition-colors">
                          Regarder le direct
                        </span>
                        <Play size={8} fill="currentColor" strokeWidth={0} className="text-purple-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/[0.04] rounded-2xl bg-white/[0.005]">
                <Radio size={24} className="text-neutral-600 mb-3" />
                <h3 className="text-sm font-bold text-neutral-300">Aucune chaîne trouvée</h3>
                <p className="text-neutral-500 text-xs max-w-xs mt-1">
                  Recherchez des réseaux sportifs plus spécifiques comme "beIN" ou "Canal".
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ======================= SUB-TAB: GRANDS TOURNOIS (CALENDRIER ACCUEIL) ======================= */}
        {sportsSubTab === "calendar" && (
          <motion.div
            key="calendar-tab-sports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center bg-white/[0.015] p-4 rounded-2xl border border-white/[0.04]">
              <div className="relative w-full lg:w-72 shrink-0">
                <input 
                  type="text" 
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  placeholder="Équipe, sport, Pays..."
                  className="w-full bg-[#080d16] border border-white/[0.06] hover:border-white/15 focus:border-[#00a8e1]/40 focus:bg-[#0c1322] rounded-xl py-2 pl-8 pr-3 text-xs text-white outline-none transition-all placeholder:text-neutral-500"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" size={12} />
              </div>

              <div className="overflow-x-auto scrollbar-none pb-1 w-full flex items-center gap-1">
                <span className="text-[8px] font-bold text-purple-400 uppercase tracking-wider mr-2 pr-3 border-r border-white/10 shrink-0">
                  Filtre Sport
                </span>
                {sports.filter(s => events.some(e => e.sport === s) || s === "Tous").map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSport(s)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                      selectedSport === s 
                        ? "bg-purple-600 text-white font-black"
                        : "bg-transparent text-neutral-400 hover:text-white hover:bg-white/[0.015]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Horizontal Months */}
            <div className="overflow-x-auto scrollbar-none py-1">
              <div className="flex gap-1.5">
                {months.map(m => (
                  <button
                    key={m}
                    onClick={() => { setActiveMonth(m); setEventSearchQuery(""); }}
                    className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                      !eventSearchQuery && activeMonth === m
                        ? "bg-white text-black border-white font-black"
                        : "bg-[#060b13] text-neutral-400 border-white/[0.04] hover:border-white/10"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Events Grid */}
            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredEvents.map((event) => {
                  const matchedChan = getMatchedChannel(event.broadcaster);
                  const isFollowed = followedEvents.includes(event.id);
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => handlePlayBroadcaster(event.broadcaster)}
                      className="group relative flex flex-col bg-[#050b14] border border-white/[0.03] hover:border-purple-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 h-64"
                    >
                      {/* Photo BG */}
                      <div className="absolute inset-0 w-full h-full overflow-hidden scale-100">
                        <img 
                          src={event.image} 
                          alt={event.name} 
                          className="w-full h-full object-cover brightness-[0.35] group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#040912] via-[#040912]/50 to-transparent" />
                      </div>

                      {/* Foreground metadata */}
                      <div className="relative z-10 flex flex-col h-full justify-between p-4">
                        <div className="flex justify-between items-start gap-4">
                          <span className="bg-white/5 backdrop-blur-md px-2 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest text-[#00a8e1] border border-white/[0.05]">
                            {event.sport}
                          </span>

                          <button 
                            onClick={(e) => toggleFollow(event.id, e)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer ${
                              isFollowed 
                                ? 'bg-purple-600 text-white border-purple-600' 
                                : 'bg-white/5 border-white/10 text-white hover:bg-white hover:text-black'
                            }`}
                            title="Suivre"
                          >
                            {isFollowed ? <BellRing size={11} className="animate-bounce" /> : <Bell size={11} />}
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1 text-[#00a8e1] font-bold uppercase tracking-wider text-[8px]">
                            <Calendar size={10} /> {event.date}
                          </div>

                          <h4 className="font-extrabold text-white text-xs sm:text-[13px] leading-snug group-hover:text-purple-300 transition-colors duration-200 line-clamp-2">
                            {event.name}
                          </h4>

                          <div className="flex items-center gap-1 text-neutral-400 text-[8px] tracking-wide">
                            <MapPin size={9} strokeWidth={2.5} className="text-[#00a8e1]" />
                            <span className="truncate">{event.location}</span>
                          </div>

                          <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                            {matchedChan ? (
                              <span className="text-[8.5px] font-extrabold text-emerald-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse block" /> {matchedChan.name} Link
                              </span>
                            ) : (
                              <span className="text-[8.5px] text-neutral-400 font-semibold truncate max-w-[80%]">
                                Diffuseur: {event.broadcaster}
                              </span>
                            )}
                            <Play size={8} fill="currentColor" strokeWidth={0} className="text-purple-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.04] rounded-2xl bg-white/[0.005]">
                <CalendarDays size={20} className="text-neutral-600 mb-2" />
                <h4 className="text-xs font-bold text-neutral-300">Aucun tournoi planifié</h4>
                <p className="text-neutral-500 text-xs mt-1">Aucune compétition correspondante n'est répertoriée pour {activeMonth}.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ======================= SUB-TAB: FAVORIS (WATCHLIST ALERTES) ======================= */}
        {sportsSubTab === "watchlist" && (
          <motion.div
            key="watchlist-tab-sports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            <div className="bg-white/[0.015] p-5 rounded-2xl border border-white/[0.03] space-y-1">
              <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest block">Notification Center</span>
              <h3 className="text-base font-extrabold text-white">Vos Alertes Tournois</h3>
              <p className="text-neutral-400 text-[11px]">
                Activez vos favoris pour anticiper les grandes diffusions mondiales et basculer sur la chaîne TV au coup d'envoi.
              </p>
            </div>

            {watchlistEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {watchlistEvents.map((event) => {
                  const matchedChan = getMatchedChannel(event.broadcaster);
                  return (
                    <div
                      key={event.id}
                      onClick={() => handlePlayBroadcaster(event.broadcaster)}
                      className="group relative flex flex-col bg-[#050b14] border border-white/[0.03] hover:border-purple-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 h-64"
                    >
                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.name} 
                          className="w-full h-full object-cover brightness-[0.35]"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#040912] via-[#040912]/50 to-transparent" />
                      </div>

                      <div className="relative z-10 flex flex-col h-full justify-between p-4">
                        <div className="flex justify-between items-start">
                          <span className="bg-white/5 px-2 py-0.5 rounded text-[7.5px] font-bold text-white border border-white/[0.05]">
                            {event.sport}
                          </span>
                          <button 
                            onClick={(e) => toggleFollow(event.id, e)}
                            className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center cursor-pointer shadow animate-bounce"
                          >
                            <BellRing size={11} className="text-neutral-950" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="text-[#00a8e1] font-bold text-[8px] uppercase tracking-wider flex items-center gap-1">
                            <Clock size={9} /> {event.date}
                          </div>
                          
                          <h4 className="font-extrabold text-white text-xs line-clamp-2 leading-snug">
                            {event.name}
                          </h4>

                          <div className="pt-2 border-t border-white/[0.05] flex justify-between items-center text-[8.5px]">
                            {matchedChan ? (
                              <span className="font-bold text-emerald-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse block" /> Direct sur {matchedChan.name}
                              </span>
                            ) : (
                              <span className="text-neutral-400">Canal: {event.broadcaster}</span>
                            )}
                            <Play size={8} className="text-purple-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/[0.03] rounded-2xl p-6 bg-white/[0.005]">
                <Bell size={24} className="text-neutral-600 mb-3" />
                <h4 className="text-xs font-bold text-neutral-300">Aucun suivi de compétition en cours</h4>
                <p className="text-neutral-500 text-xs max-w-xs mt-1">
                  Parcourez le catalogue des Grands Tournois et appuyez sur la cloche pour activer les alertes de diffusion.
                </p>
                <button 
                  onClick={() => setSportsSubTab("calendar")}
                  className="mt-4 px-4 py-2 bg-purple-600/10 border border-purple-500/30 hover:bg-purple-600/20 rounded-lg text-purple-300 font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Ouvrir le calendrier
                </button>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
