import React from "react";
import { motion } from "motion/react";
import { Info, Play } from "lucide-react";
import { Channel } from "../types";
import { formatEpgTime, getEpgProgress } from "../utils/epgUtils";
import { ChannelLogo } from "./ChannelLogo";

export interface ProgramCardProps {
  channel: Channel;
  onClick: (channel: Channel) => void;
  onMouseEnter?: (channel: Channel) => void;
  isPlaying?: boolean;
  className?: string;
  onShowInfo?: (channel: Channel) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ channel, onClick, onMouseEnter, isPlaying, className, onShowInfo }) => {
  const currentProgram = channel.epg?.current;
  const nextProgram = channel.epg?.next;
  const progress = currentProgram ? getEpgProgress(currentProgram.start, currentProgram.stop) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(channel)}
      onMouseEnter={() => onMouseEnter?.(channel)}
      className={`relative flex-shrink-0 ${className || "w-52 sm:w-72 md:w-[360px]"} group cursor-pointer transition-all duration-300 ease-out p-3 bg-white/75 hover:bg-white border rounded-2xl ${
        isPlaying 
          ? "border-[#FF7900]/40 ring-1 ring-[#FF7900]/10 shadow-[0_16px_36px_-12px_rgba(255,121,0,0.18)]" 
          : "border-gray-200/60 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_-12px_rgba(255,121,0,0.12)] hover:border-gray-300/80"
      }`}
    >
      {/* Thumbnail Area with Enhanced Border/Shadow */}
      <div className={`aspect-video relative overflow-hidden bg-gray-50 rounded-xl border transition-all duration-300 ${
        isPlaying 
          ? "border-brand-500/20" 
          : "border-gray-200/40 group-hover:border-gray-300/60"
      }`}>
        {currentProgram?.image || currentProgram?.icon || channel.logo ? (
          <img
            src={currentProgram?.image || currentProgram?.icon || channel.logo}
            alt={currentProgram?.title || channel.name}
            loading="lazy"
            className={`w-full h-full transition-transform duration-1000 ease-out group-hover:scale-110 ${
              currentProgram?.image || currentProgram?.icon ? "object-cover" : "object-contain p-8 opacity-45"
            }`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-gray-100">
             <span className="text-[10px] font-black uppercase text-neutral-600 tracking-[0.2em]">{channel.name}</span>
          </div>
        )}
        
        {/* Deep Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-75 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
            <div className="flex gap-1.5">
              {currentProgram && (
                 <div className="px-2 py-1 bg-red-600 border border-red-500/20 text-[7px] md:text-[9px] font-black text-white rounded-lg flex items-center gap-1 uppercase tracking-widest shadow-lg">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                   EN DIRECT
                 </div>
              )}
              {channel.qualityLabel && (
                 <div className={`px-2 py-1 ${channel.qualityLabel.includes('SD') ? 'bg-orange-500/90 text-white border-orange-400/20' : 'bg-emerald-600/95 text-white border-emerald-500/20'} border text-[7px] md:text-[9px] font-black rounded-lg flex items-center uppercase tracking-widest shadow-lg`}>
                   {channel.qualityLabel}
                 </div>
              )}
            </div>

            {/* Channel Logo Container with corrected nested classes */}
            <div className={`w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-md rounded-xl border border-white/25 flex items-center justify-center p-1 md:p-1.5 shadow-xl transition-all duration-300 group-hover:bg-white group-hover:scale-105 group-hover:border-white/40 ring-1 ring-black/5`}>
              <ChannelLogo logo={channel.logo} name={channel.name} className="w-full h-full object-contain" containerClassName="w-full h-full bg-transparent p-0 ring-0 shadow-none border-0" />
            </div>
        </div>

        {/* Play Icon - Polished Design */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-3 group-hover:translate-y-0 pointer-events-none z-10">
           <div className={`w-12 h-12 md:w-13 md:h-13 ${isPlaying ? "bg-red-600" : "bg-[#FF7900]"} text-white rounded-full flex items-center justify-center shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300 border border-white/30`}>
              <Play fill="currentColor" className="ml-1 text-white" size={20} />
           </div>
        </div>

        {/* Technical Info Button 'i' */}
        {onShowInfo && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               e.preventDefault();
               onShowInfo(channel);
             }}
             className="absolute bottom-3 right-3 z-30 p-1.5 sm:p-2 bg-white/80 hover:bg-[#FF7900] text-gray-900 rounded-xl border border-gray-200/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 shadow-xl cursor-pointer hover:text-white hover:border-[#FF7900]/30"
             title="Détails techniques du flux"
           >
             <Info size={12} />
           </button>
        )}

        {/* Progress Bar - Glowy Accent */}
        {currentProgram && progress > 0 && (
           <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40 overflow-hidden">
              <motion.div 
                className="h-full bg-[#FF7900] shadow-[0_0_12px_rgba(255,121,0,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
           </div>
        )}
      </div>

      {/* Enhanced Info Area */}
      <div className="mt-3 px-1 space-y-1">
         <div className="flex items-center justify-between gap-2">
           <h4 className="text-xs md:text-sm font-black text-gray-900 tracking-tight leading-tight line-clamp-1 group-hover:text-[#FF7900] transition-colors duration-200">
              {currentProgram?.title || channel.name}
           </h4>
           {currentProgram && (
             <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
               {formatEpgTime(currentProgram.start)}
             </span>
           )}
         </div>
         
         <div className="flex items-center gap-1.5 text-[9px] md:text-[10px]">
            <span className="font-extrabold text-[#FF7900] uppercase tracking-wider">{channel.name}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="font-semibold text-gray-400 uppercase tracking-wide truncate max-w-[120px]">
              {channel.categoryOverride || channel.category}
            </span>
         </div>

         {/* NEXT UP / À SUIVRE EPG ENHANCEMENT */}
         {nextProgram && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 text-[10px] sm:text-[11px] text-gray-500">
              <span className="font-black text-[8px] bg-gray-100 border border-gray-200 text-gray-500 px-1 py-0.2 rounded uppercase tracking-wider shrink-0 scale-90 origin-left">Suivant</span>
              <span className="font-medium text-gray-600 truncate text-left flex-1" title={nextProgram.title}>{nextProgram.title}</span>
              <span className="font-mono text-[9px] text-gray-400 shrink-0">{formatEpgTime(nextProgram.start)}</span>
            </div>
         )}
      </div>
    </motion.div>
  );
}
