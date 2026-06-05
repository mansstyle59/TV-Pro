import React from "react";
import { motion } from "motion/react";
import { Channel } from "../types";
import { formatEpgTime, getEpgProgress } from "../utils/epgUtils";

export interface ProgramCardProps {
  channel: Channel;
  onClick: (channel: Channel) => void;
  isPlaying?: boolean;
  className?: string;
}

const LogoImage: React.FC<{ logo?: string; name: string }> = ({ logo, name }) => {
  const [error, setError] = React.useState(false);

  const initials = React.useMemo(() => {
    return name
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .map(p => p[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || name.slice(0, 2).toUpperCase();
  }, [name]);
  
  if (error || !logo) {
    return (
      <span className="text-[10px] font-black text-white/90 leading-none select-none uppercase">
        {initials}
      </span>
    );
  }
  
  return (
    <img 
      src={logo} 
      alt={name}
      className="w-full h-full object-contain"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
};

export const ProgramCard: React.FC<ProgramCardProps> = ({ channel, onClick, isPlaying, className }) => {
  const currentProgram = channel.epg?.current;
  const progress = currentProgram ? getEpgProgress(currentProgram.start, currentProgram.stop) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(channel)}
      className={`relative flex-shrink-0 ${className || "w-52 sm:w-72 md:w-[360px]"} rounded-[1.25rem] md:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 group mb-2 outline-none ${
        isPlaying ? "ring-[3px] ring-brand-500 shadow-[0_0_30px_rgba(30,136,255,0.4)]" : ""
      }`}
    >
      {/* Thumbnail Area */}
      <div className="aspect-video relative overflow-hidden bg-neutral-900 shadow-xl rounded-[1.25rem] md:rounded-[2rem]">
        {currentProgram?.image || currentProgram?.icon || channel.logo ? (
          <img
            src={currentProgram?.image || currentProgram?.icon || channel.logo}
            alt={currentProgram?.title || channel.name}
            className={`w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 ${
              currentProgram?.image || currentProgram?.icon ? "object-cover" : "object-contain p-6 md:p-8 opacity-50"
            }`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-900 border border-white/5">
             <span className="text-[9px] md:text-[10px] font-black uppercase text-neutral-600 tracking-widest">{channel.name}</span>
          </div>
        )}
        
        {/* Subtle Dark Gradient Overlay at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 right-2 md:top-3 md:left-3 md:right-3 flex justify-between items-start">
           {/* Quality & Live */}
           <div className="flex gap-1.5 md:gap-2">
             {currentProgram && (
                <div className="px-1.5 md:px-2 py-0.5 md:py-1 bg-red-600/90 backdrop-blur-xl text-[7px] md:text-[8px] font-black text-white rounded-[4px] md:rounded-[6px] flex items-center gap-1 md:gap-1.5 uppercase tracking-widest shadow-xl">
                  <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-white rounded-full animate-pulse object-cover" />
                  DIRECT
                </div>
             )}
             {channel.qualityLabel && (
                <div className={`px-1.5 md:px-2 py-0.5 md:py-1 ${channel.qualityLabel.includes('SD') ? 'bg-orange-500/80' : 'bg-emerald-500/80'} backdrop-blur-xl text-[7px] md:text-[8px] font-black text-white rounded-[4px] md:rounded-[6px] flex items-center uppercase tracking-widest shadow-xl border border-white/10`}>
                  {channel.qualityLabel}
                </div>
             )}
           </div>

            {/* Channel Logo */}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-neutral-900/80 backdrop-blur-2xl rounded-lg md:rounded-xl border border-white/10 flex items-center justify-center p-1 md:p-1.5 shadow-2xl overflow-hidden group-hover:scale-110 transition-transform">
              <LogoImage logo={channel.logo} name={channel.name} />
            </div>
        </div>

        {/* Play Icon overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="w-10 h-10 md:w-12 md:h-12 bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-2xl pl-1 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
           </div>
        </div>

        {/* Progress Bar (Attached strictly to bottom edge) */}
        {currentProgram && (
           <div className="absolute inset-x-0 bottom-0 h-1 md:h-1.5 bg-white/10">
              <motion.div 
                className="h-full bg-brand-500 shadow-[0_0_10px_rgba(30,136,255,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
           </div>
        )}
      </div>

      {/* Info Area (Below thumbnail like YouTube) */}
      <div className="pt-2.5 px-0.5 pb-1">
         <h4 className="text-xs md:text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-brand-500 transition-colors">
            {currentProgram?.title || channel.name}
         </h4>
         <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-1.5 line-clamp-1">
            <span className="text-[9px] md:text-[11px] font-medium text-neutral-400">{channel.name}</span>
            {currentProgram && Array.isArray(currentProgram) === false && (
               <>
                  <div className="w-0.5 md:w-1 h-0.5 md:h-1 bg-neutral-600 rounded-full shrink-0" />
                  <span className="text-[9px] md:text-[11px] font-bold text-brand-500 truncate whitespace-nowrap">
                     {formatEpgTime(currentProgram.start)} - {formatEpgTime(currentProgram.stop)}
                  </span>
               </>
            )}
            {currentProgram?.category && (
               <>
                  <div className="w-0.5 md:w-1 h-0.5 md:h-1 bg-neutral-600 rounded-full shrink-0" />
                  <span className="text-[9px] md:text-[11px] font-medium text-neutral-500 truncate">{currentProgram.category}</span>
               </>
            )}
         </div>
      </div>
    </motion.div>
  );
}
