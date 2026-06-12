import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Tv, 
  Play, 
  CalendarDays, 
  RefreshCw, 
  AlertCircle,
  Hash,
  Sparkles,
  Info
} from "lucide-react";
import { EpgProgramme } from "../types";
import { formatEpgTime, getEpgProgress } from "../utils/epgUtils";
import { generateFallbackEpg } from "../utils/fallbackEpg";
import { getApiUrl } from "../utils/urlHelper";
import { ChannelLogo } from "./ChannelLogo";

interface ExtendedEpgPanelProps {
  channel: {
    id: number;
    name: string;
    logo?: string;
    category?: string;
    qualityLabel?: string;
    epg?: {
      current: EpgProgramme | null;
      next: EpgProgramme | null;
    };
  };
  onClose: () => void;
  onPlay: () => void;
}

export function ExtendedEpgPanel({ channel, onClose, onPlay }: ExtendedEpgPanelProps) {
  const [programmes, setProgrammes] = useState<EpgProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom interactive state for viewing details of any program in the list
  const [detailedProgram, setDetailedProgram] = useState<EpgProgramme | null>(null);

  const fetchEpgData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const resp = await fetch(getApiUrl(`/api/epg/${encodeURIComponent(channel.name)}`));
      if (!resp.ok) throw new Error("API Indisponible");
      const data = await resp.json();
      
      if (data.success && Array.isArray(data.programmes) && data.programmes.length > 0) {
        setProgrammes(data.programmes);
        
        // Match current active program to showcase first
        const now = Date.now();
        const active = data.programmes.find((p: EpgProgramme) => {
          const s = new Date(p.start).getTime();
          const e = new Date(p.stop).getTime();
          return now >= s && now <= e;
        });
        
        if (active) {
          setDetailedProgram(active);
        } else {
          setDetailedProgram(data.programmes[0]);
        }
      } else {
        // Fallback
        const fallbackList = generateFallbackEpg(channel.name);
        setProgrammes(fallbackList);
        initFallbackDetails(fallbackList);
      }
    } catch (err) {
      console.warn("Could not retrieve active EPG from backend, using fallback list.", err);
      const fallbackList = generateFallbackEpg(channel.name);
      setProgrammes(fallbackList);
      initFallbackDetails(fallbackList);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const initFallbackDetails = (list: EpgProgramme[]) => {
    const now = Date.now();
    const active = list.find(p => {
      const s = new Date(p.start).getTime();
      const e = new Date(p.stop).getTime();
      return now >= s && now <= e;
    });
    setDetailedProgram(active || list[0] || null);
  };

  useEffect(() => {
    fetchEpgData();
    
    // Auto refresh every 45s for live timing drift
    const timer = setInterval(() => {
      fetchEpgData(true);
    }, 45000);
    
    return () => clearInterval(timer);
  }, [channel.name]);

  const isCurrentActive = (prog: EpgProgramme) => {
    const now = Date.now();
    const s = new Date(prog.start).getTime();
    const e = new Date(prog.stop).getTime();
    return now >= s && now <= e;
  };

  const isPastProgram = (prog: EpgProgramme) => {
    return Date.now() > new Date(prog.stop).getTime();
  };

  // Find currently broadcasted show for a quick "Back to Live" trigger if selected show differs
  const currentBroadcastedShow = programmes.find(isCurrentActive);
  const showBackToLive = detailedProgram && currentBroadcastedShow && (detailedProgram.start !== currentBroadcastedShow.start);

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 26, stiffness: 240 }}
      className="absolute inset-x-0 top-0 bottom-0 bg-gray-50 flex flex-col h-full z-50 overflow-hidden"
    >
      {/* Upper Navigation Row */}
      <div className="p-4 bg-gray-100/60 border-b border-gray-200 backdrop-blur-md flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-black text-gray-600 hover:text-gray-900 uppercase tracking-wider transition-colors py-1 cursor-pointer"
        >
          <ChevronLeft size={16} className="text-[#FF7900]" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-1.5 bg-white/40 px-2 py-1 rounded-lg border border-gray-200 font-mono text-[9px] text-[#FF7900] font-bold">
          <CalendarDays size={10} />
          <span>Guide 24H</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
        
        {/* Channel Fast Launcher Hero Card */}
        <div className="p-4 bg-gradient-to-b from-neutral-900/40 via-neutral-950/20 to-neutral-950 border-b border-gray-200 space-y-3 shrink-0">
          <div className="flex items-start gap-3.5">
            <ChannelLogo logo={channel.logo} name={channel.name} />
            <div className="min-w-0 flex-grow select-text">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide truncate">
                  {channel.name}
                </h3>
                {channel.qualityLabel && (
                  <span className="text-[6.5px] px-1 bg-[#FF7900]/10 text-[#FF7900] border border-[#FF7900]/20 rounded font-mono font-bold uppercase leading-none">
                    {channel.qualityLabel}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-gray-600 font-medium tracking-wide mt-1 capitalize">
                Catégorie : <span className="font-semibold text-gray-700">{channel.category || "Inconnue"}</span>
              </p>
            </div>

            {/* Tactical Cast Action button */}
            <button
              onClick={onPlay}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#FF7900] to-[#cc6000] hover:from-[#cc6000] hover:to-[#FF7900] text-black font-black text-[9px] uppercase tracking-wider rounded-lg transition-all duration-300 active:scale-95 shadow-lg shadow-[#FF7900]/10 cursor-pointer"
            >
              <Play size={9} fill="currentColor" />
              <span>Regarder</span>
            </button>
          </div>
        </div>

        {/* Detailed Program Card View (Fills the requirement perfectly!) */}
        {detailedProgram ? (
          <div className="px-4 pb-2 shrink-0">
            <div className="bg-gray-100/50 rounded-2xl border border-gray-200 p-4 space-y-3 relative overflow-hidden bg-radial-at-t from-neutral-900/20 to-neutral-950">
              
              {/* Image banner backdrop if present */}
              {detailedProgram.image ? (
                <div className="w-full h-24 rounded-lg overflow-hidden relative border border-gray-200 select-none bg-white">
                  <img 
                    src={detailedProgram.image} 
                    alt="" 
                    referrerPolicy="no-referrer" 
                    className="w-full h-full object-cover filter brightness-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  
                  {isCurrentActive(detailedProgram) && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-[7px] font-black tracking-widest text-gray-900 rounded uppercase animate-pulse shadow-sm">
                      <Play size={7} fill="currentColor" />
                      Direct
                    </span>
                  )}
                </div>
              ) : (
                isCurrentActive(detailedProgram) && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-[7px] font-black tracking-widest text-gray-900 rounded uppercase animate-pulse">
                      <Play size={7} fill="currentColor" />
                      Direct
                    </span>
                  </div>
                )
              )}

              {/* Title & timing details */}
              <div className="space-y-1 select-text">
                <h4 className="text-[12.5px] font-bold text-gray-900 tracking-tight leading-snug">
                  {detailedProgram.title}
                </h4>
                
                <div className="flex items-center gap-2 text-[9px] text-gray-600">
                  <span className="text-[#FF7900] font-mono font-bold bg-[#FF7900]/5 px-1.5 py-0.5 rounded border border-[#FF7900]/10 shrink-0">
                    {formatEpgTime(detailedProgram.start)} — {formatEpgTime(detailedProgram.stop)}
                  </span>
                  {detailedProgram.category && (
                    <span className="text-gray-500 font-extrabold uppercase tracking-widest text-[8px]">
                      {detailedProgram.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Comprehensive Un-cropped description */}
              {detailedProgram.desc ? (
                <div className="bg-white/20 p-2.5 rounded-xl border border-white/[0.02] max-h-36 overflow-y-auto select-text">
                  <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                    {detailedProgram.desc}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 italic font-medium">
                  Aucun synopsis ou information de description disponible pour cette émission.
                </p>
              )}

              {/* Live Program Progress bar */}
              {isCurrentActive(detailedProgram) && (
                <div className="space-y-1.5 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                    <span>Progression du direct</span>
                    <span className="text-[#FF7900] font-bold">
                      {getEpgProgress(detailedProgram.start, detailedProgram.stop)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden border border-white/[0.02]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF7900] to-[#cc6000] rounded-full transition-all duration-1000" 
                      style={{ width: `${getEpgProgress(detailedProgram.start, detailedProgram.stop)}%` }} 
                    />
                  </div>
                </div>
              )}

              {/* Back to live button overlay if reviewing schedule */}
              {showBackToLive && (
                <button
                  onClick={() => setDetailedProgram(currentBroadcastedShow)}
                  className="w-full mt-1.5 py-1.5 bg-gray-50/90 border border-[#FF7900]/25 hover:border-[#FF7900]/50 text-gray-700 hover:text-gray-900 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-xs hover:scale-[1.01]"
                >
                  <Sparkles size={10} className="text-[#FF7900]" />
                  <span>Revenir au programme en direct</span>
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* 24-Hour EPG Schedule (Loaded from REST endpoint) */}
        <div className="p-4 border-t border-gray-200 space-y-3 flex-grow flex flex-col">
          <div className="flex items-center justify-between">
            <h5 className="text-[9px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-1.5">
              <Clock size={11} className="text-[#FF7900]" />
              Grille horaire complète (24H)
            </h5>
            
            <button
              onClick={() => fetchEpgData()}
              className={`p-1 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer ${loading ? "animate-spin" : ""}`}
              title="Rafraîchir les programmes"
              disabled={loading}
            >
              <RefreshCw size={11} />
            </button>
          </div>

          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center py-10 gap-2.5">
              <div className="w-6 h-6 border-2 border-[#FF7900]/20 border-t-[#FF7900] rounded-full animate-spin" />
              <p className="text-[8px] font-mono font-bold text-gray-500 tracking-widest uppercase">
                Récupération de la grille ...
              </p>
            </div>
          ) : error ? (
            <div className="flex-grow flex flex-col items-center justify-center py-10 text-center gap-2">
              <AlertCircle size={20} className="text-red-500/80" />
              <p className="text-[9px] text-gray-600 font-medium">Chargement EPG restreint</p>
            </div>
          ) : programmes.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-10 text-center">
              <p className="text-[9px] text-gray-500">Aucun log programme enregistré.</p>
            </div>
          ) : (
            <div className="relative pl-3 space-y-2">
              {/* Vertical dotted timeline track anchor */}
              <div className="absolute left-1 top-2 bottom-2 w-[1px] bg-gray-100 border-l border-dashed border-gray-300" />

              {programmes.map((prog, idx) => {
                const live = isCurrentActive(prog);
                const past = isPastProgram(prog);
                const isSelected = detailedProgram && detailedProgram.start === prog.start;

                return (
                  <button
                    key={`${channel.id}-prog-${idx}`}
                    onClick={() => setDetailedProgram(prog)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-3 transition-all relative cursor-pointer outline-none ${
                      isSelected 
                        ? "bg-[#FF7900]/5 border-[#FF7900]/30 shadow-md shadow-[#FF7900]/1" 
                        : live 
                        ? "bg-[#FF7900]/5 border-gray-200 hover:border-gray-300" 
                        : "bg-transparent border-transparent hover:bg-white/[0.01] hover:border-gray-200"
                    } ${past ? "opacity-35 hover:opacity-75 transition-opacity" : ""}`}
                  >
                    {/* Left dot marker relative to time */}
                    <div className="absolute -left-[14px] top-4.5 z-10 w-2 h-2 rounded-full bg-gray-50 border border-gray-300 flex items-center justify-center">
                      <div className={`w-1 h-1 rounded-full ${
                        live ? "bg-[#FF7900]" : "bg-neutral-600"
                      }`} />
                    </div>

                    {/* Time frame label */}
                    <span className={`text-[8.5px] font-mono font-black shrink-0 pt-0.5 min-w-8 ${
                      live ? "text-[#FF7900]" : "text-gray-500"
                    }`}>
                      {formatEpgTime(prog.start)}
                    </span>

                    {/* Title and minor layout overview */}
                    <div className="flex-grow min-w-0 pr-1.5">
                      <h6 className={`text-[10.5px] font-semibold leading-tight truncate ${
                        isSelected || live ? "text-gray-900" : "text-gray-700"
                      }`}>
                        {prog.title}
                      </h6>
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        {prog.category && (
                          <span className="text-[7px] font-black uppercase tracking-wider text-gray-500">
                            {prog.category}
                          </span>
                        )}
                        {live && (
                          <span className="text-[6.5px] font-bold text-[#FF7900] uppercase tracking-wide flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-[#FF7900] animate-pulse" />
                            Direct
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right action visual indicator */}
                    <div className="shrink-0 pt-1 text-neutral-600 hover:text-gray-600">
                      <Info size={11} className={isSelected ? "text-[#FF7900]" : "text-neutral-600"} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
