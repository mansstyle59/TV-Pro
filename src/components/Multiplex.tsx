import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Hls from "hls.js";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RotateCcw, 
  X, 
  Grid, 
  Columns, 
  Square,
  Search,
  Check,
  ChevronDown,
  Tv,
  Zap,
  Activity,
  Maximize2
} from "lucide-react";
import { Channel } from "../types";

interface MultiplexProps {
  channels: Channel[];
}

interface SelectedSlot {
  slotId: number;
  channel: Channel | null;
  isPlaying: boolean;
  isMuted: boolean;
  quality: number; // -1 for auto
}

export function Multiplex({ channels }: MultiplexProps) {
  const [gridSize, setGridSize] = useState<1 | 2 | 4>(4);
  const [slots, setSlots] = useState<SelectedSlot[]>([
    { slotId: 1, channel: null, isPlaying: false, isMuted: true, quality: -1 },
    { slotId: 2, channel: null, isPlaying: false, isMuted: true, quality: -1 },
    { slotId: 3, channel: null, isPlaying: false, isMuted: true, quality: -1 },
    { slotId: 4, channel: null, isPlaying: false, isMuted: true, quality: -1 },
  ]);

  // Audio focus model (only one screen can play audio at a time)
  const [activeAudioSlot, setActiveAudioSlot] = useState<number | null>(null);

  // Search and channel selection modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSelectSlotId, setActiveSelectSlotId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  // Get unique categories
  const categories = ["Tous", ...Array.from(new Set(channels.map(c => c.categoryOverride || "Généraliste")))];

  const filteredChannels = channels.filter(chan => {
    const matchesSearch = chan.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || (chan.categoryOverride || "Généraliste") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStreamUrl = (channel: Channel) => {
    return `/api/stream/${channel.id}/index.m3u8${channel.p ? `?p=${channel.p}` : ""}`;
  };

  const handleSelectChannel = (channel: Channel) => {
    if (activeSelectSlotId !== null) {
      setSlots(prev => prev.map(slot => {
        if (slot.slotId === activeSelectSlotId) {
          // If first selected channel, let's unmute it to focus audio
          const isFirstChannel = prev.every(s => s.channel === null);
          if (isFirstChannel) {
            setActiveAudioSlot(activeSelectSlotId);
          }
          return {
            ...slot,
            channel,
            isPlaying: true,
            isMuted: activeAudioSlot !== activeSelectSlotId
          };
        }
        return slot;
      }));
      setModalOpen(false);
      setActiveSelectSlotId(null);
      setSearchQuery("");
    }
  };

  const togglePlaySlot = (slotId: number) => {
    setSlots(prev => prev.map(s => {
      if (s.slotId === slotId) {
        return { ...s, isPlaying: !s.isPlaying };
      }
      return s;
    }));
  };

  const toggleMuteSlot = (slotId: number) => {
    if (activeAudioSlot === slotId) {
      // If muting the currently active audio, set none active
      setActiveAudioSlot(null);
      setSlots(prev => prev.map(s => s.slotId === slotId ? { ...s, isMuted: true } : s));
    } else {
      // Unmuting this slot -> mute all other slots to prevent overlap audio chaos
      setActiveAudioSlot(slotId);
      setSlots(prev => prev.map(s => {
        if (s.slotId === slotId) {
          return { ...s, isMuted: false };
        }
        return { ...s, isMuted: true };
      }));
    }
  };

  const clearSlot = (slotId: number) => {
    setSlots(prev => prev.map(s => {
      if (s.slotId === slotId) {
        if (activeAudioSlot === slotId) {
          setActiveAudioSlot(null);
        }
        return { ...s, channel: null, isPlaying: false, isMuted: true };
      }
      return s;
    }));
  };

  // Adjust running slots list to match active grid size
  const activeSlots = slots.slice(0, gridSize);

  return (
    <div className="space-y-6 text-sans">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#0F0F0F] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF7900]/5 blur-[80px] rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF7900] animate-pulse" />
            <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-[#FF7900]">Module Multiview Pro</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Multiplex Premium</h2>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Diffusez jusqu'à 4 flux TV en simultané pour ne rater aucun match.</p>
        </div>

        {/* Grid size selection */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-white/5 relative z-10 shrink-0">
          {[
            { size: 1, label: "Simple", icon: Square },
            { size: 2, label: "Duo (Splitscreen)", icon: Columns },
            { size: 4, label: "Quad (4 Écrans)", icon: Grid },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = gridSize === item.size;
            return (
              <button
                key={item.size}
                onClick={() => setGridSize(item.size as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isSelected 
                    ? "bg-[#FF7900] text-white shadow-lg shadow-[#FF7900]/10" 
                    : "text-[#A0A0A0] hover:text-white"
                }`}
              >
                <Icon size={12} strokeWidth={isSelected ? 3 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Container */}
      <div className={`grid gap-4 ${
        gridSize === 1 
          ? "grid-cols-1" 
          : gridSize === 2 
            ? "grid-cols-1 md:grid-cols-2" 
            : "grid-cols-1 md:grid-cols-2"
      }`}>
        {activeSlots.map((slot) => (
          <div 
            key={slot.slotId}
            className={`aspect-video relative rounded-2xl overflow-hidden bg-neutral-950 border transition-all duration-500 flex flex-col justify-between ${
              slot.channel 
                ? activeAudioSlot === slot.slotId
                  ? "border-[#FF7900] shadow-[0_0_30px_rgba(255,121,0,0.15)] ring-1 ring-[#FF7900]/50" 
                  : "border-white/10"
                : "border-dashed border-white/10 hover:border-[#FF7900]/30 hover:bg-neutral-900/10 cursor-pointer"
            }`}
            onClick={() => {
              if (!slot.channel) {
                setActiveSelectSlotId(slot.slotId);
                setModalOpen(true);
              }
            }}
          >
            {slot.channel ? (
              <MultiplexPlayerCell 
                slot={slot}
                streamUrl={getStreamUrl(slot.channel)}
                onClear={() => clearSlot(slot.slotId)}
                onToggleMute={() => toggleMuteSlot(slot.slotId)}
                onTogglePlay={() => togglePlaySlot(slot.slotId)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                  <Tv size={18} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-white uppercase tracking-widest mb-0.5">Écran {slot.slotId}</p>
                  <p className="text-[9px] text-[#A0A0A0] font-bold uppercase tracking-wider">Cliquez pour assigner une chaîne</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL CHANNEL SELECTOR */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setModalOpen(false);
                setActiveSelectSlotId(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-neutral-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative shadow-2xl"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Tv size={14} className="text-[#FF7900]" />
                    Assigner l'Écran {activeSelectSlotId}
                  </h3>
                  <p className="text-[9px] text-[#A0A0A0] font-bold uppercase tracking-wider mt-0.5">Sélecteur de flux IPTV de haute qualité</p>
                </div>
                <button 
                  onClick={() => {
                    setModalOpen(false);
                    setActiveSelectSlotId(null);
                  }}
                  className="p-1.5 hover:bg-white/5 text-neutral-400 hover:text-white rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Filters */}
              <div className="p-4 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-grow">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="text" 
                    placeholder="Rechercher une chaîne..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/5 rounded-xl text-xs font-semibold text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF7900]/50 transition-colors"
                  />
                </div>
                {/* Categories */}
                <div className="flex gap-1 overflow-x-auto shrink-0 pb-1 md:pb-0 max-w-md">
                  {categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest shrink-0 transition-all ${
                        selectedCategory === cat 
                          ? "bg-white/10 text-white border border-white/10" 
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {categories.length > 5 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-neutral-900 border border-white/5 rounded-lg text-[9px] px-2 py-1 font-bold uppercase text-neutral-400 focus:outline-none"
                    >
                      <option value="Tous">Autres...</option>
                      {categories.slice(5).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Channels List */}
              <div className="flex-grow overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredChannels.length > 0 ? (
                  filteredChannels.map((chan) => (
                    <div
                      key={chan.id}
                      onClick={() => handleSelectChannel(chan)}
                      className="group flex flex-col p-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/5 hover:border-[#FF7900]/30 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#FF7900]/0 group-hover:bg-[#FF7900]/5 blur-2xl rounded-full transition-transform duration-700 pointer-events-none" />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-neutral-950 border border-white/5 p-1 rounded-lg flex items-center justify-center shrink-0">
                          {chan.logo ? (
                            <img src={chan.logo} alt={chan.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <Tv size={14} className="text-neutral-500" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs font-black text-white uppercase tracking-tight truncate group-hover:text-[#FF7900] transition-colors">{chan.name}</h4>
                          <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5 mt-1 truncate">{chan.categoryOverride || "Généraliste"}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-2">
                    <Tv className="w-8 h-8 text-neutral-600 animate-pulse" />
                    <p className="text-xs font-semibold text-neutral-400">Aucune chaîne trouvée</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MultiplexPlayerCellProps {
  slot: SelectedSlot;
  streamUrl: string;
  onClear: () => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
}

function MultiplexPlayerCell({ slot, streamUrl, onClear, onToggleMute, onTogglePlay }: MultiplexPlayerCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      // Custom Hls configs, with lowLatencyMode and larger retries for stable multi-streaming
      const hls = new Hls({
        maxMaxBufferLength: 8,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 2,
        liveSyncDurationCount: 2,
        maxBufferLength: 5,
        fragLoadingMaxRetry: 10,
        fragLoadingRetryDelay: 500,
        progressive: true
      });
      
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (slot.isPlaying) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        if (slot.isPlaying) video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setError(true);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Synchronize playing states
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (slot.isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [slot.isPlaying]);

  // Synchronize muted states
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = slot.isMuted;
  }, [slot.isMuted]);

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen();
    } else if ((video as any).mozRequestFullScreen) {
      (video as any).mozRequestFullScreen();
    }
  };

  return (
    <div className="absolute inset-0 group bg-black overflow-hidden flex items-center justify-center">
      {/* Video element */}
      <video
        ref={videoRef}
        playsInline
        className="w-full h-full object-contain"
      />

      {/* Loading Overlay */}
      {loading && !error && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <Activity size={24} className="text-[#FF7900] animate-spin" />
          <p className="text-[8px] font-bold text-[#A0A0A0] uppercase tracking-widest">Calcul du flux...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
          <Tv size={16} className="text-red-500 animate-pulse" />
          <p className="text-[9px] font-black uppercase text-red-500 tracking-wider">Erreur de diffusion</p>
          <p className="text-[7px] font-bold text-neutral-500 uppercase">Le signal a été interrompu par le diffuseur</p>
        </div>
      )}

      {/* Active Streaming Borders & Sound indicator */}
      {!slot.isMuted && !loading && (
        <div className="absolute top-3 left-3 bg-[#FF7900] text-white text-[7px] font-black px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg select-none uppercase tracking-widest animate-fade-in z-20">
          <span className="flex items-center gap-0.5">
            <span className="w-0.5 h-1.5 bg-white animate-pulse" style={{ animationDelay: '0.1s' }} />
            <span className="w-0.5 h-2.5 bg-white animate-pulse" style={{ animationDelay: '0.3s' }} />
            <span className="w-0.5 h-1 bg-white animate-pulse" style={{ animationDelay: '0.5s' }} />
          </span>
          <span>Audio Actif</span>
        </div>
      )}

      {/* Top right Channel Identity Badge */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/5 flex items-center gap-2 select-none z-20 opacity-100 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-bold text-white tracking-tight leading-none uppercase">{slot.channel?.name}</span>
      </div>

      {/* Hover Controller HUD Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 z-30">
        
        {/* Top controls (Clear / Change Channel) */}
        <div className="flex justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            title="Retirer cette chaîne"
            className="p-1 px-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg transition-all text-[8px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 shadow-lg"
          >
            <X size={10} />
            <span>Fermer</span>
          </button>
        </div>

        {/* Bottom controls (Play/Pause, Mute/Unmute, Fullscreen) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 transition-all active:scale-95"
            >
              {slot.isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
              className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest ${
                !slot.isMuted 
                  ? "bg-[#FF7900] border-[#FF7900] text-white hover:bg-[#FF7900]/90 animate-pulse" 
                  : "bg-white/10 border-white/10 text-white hover:bg-white/20"
              }`}
            >
              {slot.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
              <span>{!slot.isMuted ? "Sourdine" : "Écouter"}</span>
            </button>
          </div>

          <button
            onClick={handleFullscreen}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg transition-all active:scale-95"
          >
            <Maximize2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
