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
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
        {channels.map((channel, index) => {
          const isSelected = selectedChannelId === channel.id;
          return (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: Math.min(0.2, index * 0.012), ease: "easeOut" }}
              onClick={() => onChannelSelect(channel)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChannelSelect(channel);
                }
              }}
              role="button"
              tabIndex={0}
              className={`cursor-pointer aspect-[4/5] relative group bg-white hover:bg-white border overflow-hidden rounded-2xl transition-all flex flex-col items-center justify-between p-3 hover:scale-105 active:scale-95 duration-300 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.06)] outline-none select-none ${
                isSelected 
                  ? "border-[#FF7900] ring-2 ring-[#FF7900]/15 shadow-[0_16px_32px_-12px_rgba(255,121,0,0.22)]" 
                  : "border-gray-200/70 hover:border-gray-300 hover:shadow-[0_18px_36px_-12px_rgba(255,121,0,0.12)]"
              }`}
            >
              {/* Subtle visual gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#FF7900]/0 to-[#FF7900]/0 group-hover:from-transparent group-hover:to-[#FF7900]/[0.025] transition-all duration-300 pointer-events-none" />
              
              {/* Quality Label Badge */}
              {channel.qualityLabel && (
                 <div className="absolute top-1.5 right-1.5 z-20 scale-90 sm:scale-100">
                    <span className={`text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm border border-black/5 ${
                      channel.qualityLabel.includes('SD') ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                       {channel.qualityLabel}
                    </span>
                 </div>
              )}

              {/* Technical Info Button 'i' */}
              {onShowInfo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onShowInfo(channel);
                  }}
                  className="absolute top-1.5 left-1.5 z-30 p-1 bg-white/95 hover:bg-[#FF7900] hover:text-white text-gray-800 rounded-lg border border-gray-200 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer"
                  title="Détails techniques du flux"
                >
                  <Info size={11} />
                </button>
              )}

              {/* Centered spacious Logo wrapper */}
              <div className="w-full flex-1 flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-105">
                 <ChannelLogo 
                   logo={channel.logo} 
                   name={channel.name} 
                   className="w-full h-full object-contain filter group-hover:brightness-105" 
                   containerClassName="w-16 h-16 sm:w-20 sm:h-20 max-w-full max-h-full bg-transparent p-0 ring-0 shadow-none border-0"
                 />
              </div>

              {/* Fixed Bottom Label Area */}
              <div className="w-full text-center mt-1 sm:mt-2 pt-1 sm:pt-1.5 border-t border-gray-100/70 shrink-0">
                 <span className="text-[9px] sm:text-[10.5px] font-extrabold text-gray-800 uppercase tracking-tighter truncate block px-0.5 group-hover:text-[#FF7900] transition-colors duration-200">
                    {channel.name}
                 </span>
              </div>

              {/* Pulse Active Dot */}
              {isSelected && (
                <div className="absolute top-2.5 right-2 sm:right-2.5 w-1.5 h-1.5 bg-[#FF7900] rounded-full shadow-[0_0_8px_#FF7900] animate-pulse z-30" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
