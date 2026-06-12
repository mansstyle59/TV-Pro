import React from "react";
import { Channel } from "../types";
import { motion } from "motion/react";
import { Info } from "lucide-react";
import { ChannelLogo } from "./ChannelLogo";

interface ChannelGridProps {
  title: string;
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  selectedChannelId?: number;
  onShowInfo?: (channel: Channel) => void;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({ title, channels, onChannelSelect, selectedChannelId, onShowInfo }) => {
  if (channels.length === 0) return null;

  return (
    <div className="space-y-6 px-4 sm:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-1 h-10 bg-brand-500 rounded-full shadow-[0_0_15px_#FF7900]" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em]">Découverte</span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tighter">{title}</h2>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
        {channels.map((channel, index) => {
          const isSelected = selectedChannelId === channel.id;
          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => onChannelSelect(channel)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChannelSelect(channel);
                }
              }}
              role="button"
              tabIndex={0}
              className={`cursor-pointer aspect-square relative group bg-gray-100 border overflow-hidden rounded-xl transition-all flex flex-col items-center justify-center p-3 sm:p-5 hover:scale-110 active:scale-95 duration-500 shadow-xl outline-hidden ${
                isSelected 
                  ? "border-brand-500 ring-4 ring-brand-500/10 shadow-2xl shadow-brand-500/20" 
                  : "border-gray-200 hover:border-white/20"
              }`}
            >
              {/* Background Glow on Hover */}
              <div className="absolute inset-0 bg-linear-to-br from-brand-500/0 to-brand-500/0 group-hover:from-brand-500/5 group-hover:to-brand-500/10 transition-all duration-700" />
              
              <div className="w-full h-full relative z-10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                 <ChannelLogo logo={channel.logo} name={channel.name} className="w-full h-full object-contain filter group-hover:brightness-125 transition-all duration-300 drop-shadow-lg" />
              </div>
              
              {/* Technical Info Button 'i' */}
              {onShowInfo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onShowInfo(channel);
                  }}
                  className="absolute top-1 left-1 sm:top-2 sm:left-2 z-30 p-1 bg-gray-50/80 hover:bg-[#FF7900] text-gray-900 rounded-lg border border-gray-300 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 shadow-xl"
                  title="Détails techniques du flux"
                >
                  <Info size={10} className="sm:w-3 sm:h-3 text-gray-900" />
                </button>
              )}

              {/* Hover Badge - Glassmorphic */}
              <div className="absolute inset-x-0 bottom-2 px-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500 z-20">
                 <div className="bg-white/80 backdrop-blur-xl py-1 rounded-full text-center border border-gray-300 shadow-2xl">
                    <span className="text-[7px] md:text-[9px] font-black text-gray-900 uppercase tracking-tighter truncate block px-2">
                       {channel.name}
                    </span>
                 </div>
              </div>

              {/* Quality Label - Refined */}
              {channel.qualityLabel && (
                 <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-20">
                    <span className={`text-[6px] sm:text-[8px] font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-2xl border border-gray-300 ${
                      channel.qualityLabel.includes('SD') ? 'bg-orange-500/90 text-gray-900' : 'bg-emerald-500/90 text-gray-900'
                    }`}>
                       {channel.qualityLabel}
                    </span>
                 </div>
              )}

              {isSelected && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_12px_#FF7900] animate-pulse z-30" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
