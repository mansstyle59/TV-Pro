import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Info, Calendar, ChevronRight, X, Play } from "lucide-react";
import { EpgProgramme } from "../types";
import { formatEpgTime, getEpgProgress } from "../utils/epgUtils";
import { getApiUrl } from "../utils/urlHelper";
import { generateFallbackEpg } from "../utils/fallbackEpg";

interface EpgTimelineProps {
  channelName: string;
  onClose: () => void;
  onProgramClick?: (program: EpgProgramme) => void;
}

export function EpgTimeline({ channelName, onClose, onProgramClick }: EpgTimelineProps) {
  const [programmes, setProgrammes] = useState<EpgProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFullEpg() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(getApiUrl(`/api/epg/${encodeURIComponent(channelName)}`));
        if (!response.ok) throw new Error("Server EPG unavailable");
        const data = await response.json();
        if (data.success && Array.isArray(data.programmes) && data.programmes.length > 0) {
          setProgrammes(data.programmes);
        } else {
          console.log("No backend EPG data for " + channelName + ", generating client-side fallback...");
          setProgrammes(generateFallbackEpg(channelName));
        }
      } catch (err) {
        console.warn("EPG server offline. Generating dynamic client schedule...", err);
        setProgrammes(generateFallbackEpg(channelName));
      } finally {
        setLoading(false);
      }
    }
    fetchFullEpg();
  }, [channelName]);

  const isCurrent = (start: string, stop: string) => {
    const now = Date.now();
    return now >= new Date(start).getTime() && now <= new Date(stop).getTime();
  };

  const isPast = (stop: string) => {
    return Date.now() > new Date(stop).getTime();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-full bg-neutral-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-neutral-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center text-brand-500">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Guide TV 24h</h3>
            <p className="text-[10px] font-black text-[#FF7900] uppercase tracking-widest">{channelName}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-2xl transition-all active:scale-95 border border-white/5"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Chargement de la grille...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <Info size={32} />
            </div>
            <p className="text-sm font-bold text-neutral-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-neutral-800 transition-all"
            >
              Réessayer
            </button>
          </div>
        ) : programmes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <Clock size={40} className="text-neutral-700" />
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Aucun programme trouvé</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Vertical Line */}
            <div className="absolute left-[54px] top-4 bottom-4 w-px bg-white/5" />
            
            <div className="space-y-6">
              {programmes.map((prog, idx) => {
                const current = isCurrent(prog.start, prog.stop);
                const past = isPast(prog.stop);
                
                return (
                  <motion.div 
                    key={`${prog.start}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex items-start gap-10 group ${past ? 'opacity-40' : 'opacity-100'}`}
                  >
                    {/* Time */}
                    <div className="flex-shrink-0 w-14 text-right pt-1">
                      <span className={`text-xs font-mono font-black ${current ? 'text-brand-500' : 'text-neutral-500'}`}>
                        {formatEpgTime(prog.start)}
                      </span>
                    </div>

                    {/* Dot */}
                    <div className="relative mt-2 flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 bg-neutral-950 z-10 relative transition-transform duration-300 group-hover:scale-125 ${
                        current 
                          ? 'border-brand-500 shadow-[0_0_10px_rgba(255,121,0,0.8)]' 
                          : 'border-white/10'
                      }`} />
                      {current && (
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-brand-500 animate-ping opacity-50" />
                      )}
                    </div>

                    {/* Program Info */}
                    <div 
                      onClick={() => onProgramClick?.(prog)}
                      className={`flex-grow p-5 rounded-[1.5rem] border transition-all duration-300 relative overflow-hidden cursor-help ${
                        current 
                          ? 'bg-brand-500/10 border-brand-500/30' 
                          : 'bg-neutral-900/50 border-white/5 hover:border-white/10 hover:bg-neutral-800/50'
                      }`}
                    >
                      {current && (
                         <div className="absolute top-0 right-0 p-3">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600 text-[8px] font-black text-white rounded-md uppercase tracking-widest animate-pulse shadow-lg">
                               <Play size={8} fill="currentColor" />
                               Direct
                            </span>
                         </div>
                      )}

                      <div className="flex flex-col md:flex-row gap-5">
                        {prog.image && (
                          <div className="w-full md:w-32 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-black shrink-0 border border-white/5">
                            <img 
                              src={prog.image} 
                              alt="" 
                              loading="lazy"
                              className="w-full h-full object-cover filter brightness-75 group-hover:brightness-100 transition-all duration-500" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="flex-grow">
                          <h4 className={`text-sm md:text-base font-black tracking-tight mb-2 ${current ? 'text-white' : 'text-neutral-300'}`}>
                            {prog.title}
                          </h4>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-[9px] font-mono font-bold text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded-full border border-white/5">
                              {formatEpgTime(prog.start)} — {formatEpgTime(prog.stop)}
                            </span>
                            {prog.category && (
                              <span className="text-[9px] font-black text-[#FF7900]/80 uppercase tracking-widest">
                                {prog.category}
                              </span>
                            )}
                          </div>
                          {prog.desc && (
                            <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed font-medium">
                              {prog.desc}
                            </p>
                          )}
                          
                          {current && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                               <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getEpgProgress(prog.start, prog.stop)}%` }}
                                    className="h-full bg-brand-500"
                                  />
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
