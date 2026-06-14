import React from 'react';
import { ChannelLogo } from './ChannelLogo';

interface ChannelTileProps {
  channel: any;
  onClick: () => void;
}

export const ChannelTile: React.FC<ChannelTileProps> = ({ channel, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center p-4 rounded-2xl bg-[#1a1f24] hover:bg-[#252c33] border border-white/10 hover:border-[#00a8e1]/50 transition-all duration-300 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#00a8e1] shadow-md"
    >
      <div className="flex items-center justify-center w-16 h-16 mr-4 shrink-0">
        <ChannelLogo name={channel.name} logo={channel.logo} containerClassName="w-16 h-16" className="object-contain" />
      </div>
      <div className="flex flex-col flex-1 truncate">
        <span className="text-[14px] text-white/90 font-semibold uppercase tracking-wider truncate leading-snug">
          {channel.name}
        </span>
        <div className="flex gap-2 mt-1">
          <span className="text-[9px] bg-red-600/90 text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight shadow-sm">Live</span>
          <span className="text-[9px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight backdrop-blur">HD</span>
        </div>
      </div>
    </button>
  );
};
