import React from "react";
import { motion } from "motion/react";
import { Info } from "lucide-react";
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
  const progress = currentProgram ? getEpgProgress(currentProgram.start, currentProgram.stop) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(channel)}
      onMouseEnter={() => onMouseEnter?.(channel)}
      className={`relative flex-shrink-0 ${className || "w-52 sm:w-72 md:w-[360px]"} group cursor-pointer transition-all duration-500 ease-out`}
     >
      {/* Thumbnail Area with Enhanced Border/Shadow */}
      <div className={`aspect-video relative overflow-hidden bg-gray-100 rounded-xl border transition-all duration-500 ${
        isPlaying 
          ? "border-brand-500/50 ring-4 ring-brand-500/10 shadow-2xl shadow-brand-500/20" 
          : "border-gray-200 group-hover:border-gray-300 shadow-xl"
      }`}>
        {currentProgram?.image || currentProgram?.icon || channel.logo ? (
          <img
            src={currentProgram?.image || currentProgram?.icon || channel.logo}
            alt={currentProgram?.title || channel.name}
            loading="lazy"
            className={`w-full h-full transition-transform duration-1000 ease-out group-hover:scale-110 ${
              currentProgram?.image || currentProgram?.icon ? "object-cover" : "object-contain p-8 opacity-40"
            }`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-200">
             <span className="text-[10px] font-black uppercase text-neutral-700 tracking-[0.2em]">{channel.name}</span>
          </div>
        )}
        
        {/* Deep Gradient Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-linear-to-b from-neutral-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex gap-1.5">
              {currentProgram && (
                 <div className="px-2 py-1 bg-white/60 backdrop-blur-xl border border-gray-300 text-[7px] md:text-[9px] font-black text-gray-900 rounded-lg flex items-center gap-1.5 uppercase tracking-[0.1em] shadow-2xl">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                   EN DIRECT
                 </div>
              )}
              {channel.qualityLabel && (
                 <div className={`px-2 py-1 ${channel.qualityLabel.includes('SD') ? 'bg-orange-500/80' : 'bg-emerald-500/80'} backdrop-blur-xl border border-gray-300 text-[7px] md:text-[9px] font-black text-gray-900 rounded-lg flex items-center uppercase tracking-widest shadow-2xl`}>
                   {channel.qualityLabel}
                 </div>
              )}
            </div>

            {/* Channel Logo Container */}
            <div className={`w-8 h-8 md:w-10 md:h-10 bg-black/10 backdrop-blur-2xl rounded-xl border border-gray-300 flex items-center justify-center p-1.5 md:p-2 shadow-2xl transition-all duration-500 group-hover:bg-white/20 group-hover:scale-110`}>
              <ChannelLogo logo={channel.logo} name={channel.name} className="w-full h-full object-contain" />
            </div>
        </div>

        {/* Play Icon - Polished Design */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
           <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FF7900]/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,168,225,0.4)] text-gray-900">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
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
             className="absolute bottom-3 right-3 z-30 p-1.5 sm:p-2 bg-gray-50/80 hover:bg-[#FF7900] text-gray-900 rounded-xl border border-gray-300 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 shadow-xl"
             title="Détails techniques du flux"
           >
             <Info size={12} className="text-gray-900" />
           </button>
        )}

        {/* Progress Bar - Thicker and Glowy */}
        {currentProgram && progress > 0 && (
           <div className="absolute inset-x-0 bottom-0 h-1 bg-black/5 overflow-hidden">
              <motion.div 
                className="h-full bg-[#FF7900] shadow-[0_0_15px_rgba(0,168,225,1)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
           </div>
        )}
      </div>

      {/* Enhanced Info Area */}
      <div className="mt-2.5 px-2 space-y-1">
         <div className="flex items-center justify-between gap-3">
           <h4 className="text-xs md:text-sm font-black text-gray-900 tracking-tight leading-tight line-clamp-1 group-hover:text-[#FF7900] transition-colors duration-300">
              {currentProgram?.title || channel.name}
           </h4>
           {currentProgram && (
             <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
               {formatEpgTime(currentProgram.start)}
             </span>
           )}
         </div>
         
         <div className="flex items-center gap-2">
            <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">{channel.name}</span>
            <div className="w-1 h-1 bg-gray-200 rounded-full" />
            <span className="text-[9px] md:text-[10px] font-bold text-[#FF7900]/60 uppercase tracking-widest">
              {channel.categoryOverride || channel.category}
            </span>
         </div>
      </div>
    </motion.div>
  );
}
