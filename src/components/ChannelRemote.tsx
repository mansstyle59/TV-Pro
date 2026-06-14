import React, { useState } from 'react';
import { ChannelLogo } from './ChannelLogo';
import { X, Search } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
}

interface ChannelRemoteProps {
  channels: Channel[];
  onChannelSelect: (channel: Channel) => void;
  onClose: () => void;
  activeChannelId?: string;
}

export const ChannelRemote: React.FC<ChannelRemoteProps> = ({ channels, onChannelSelect, onClose, activeChannelId }) => {
  const [search, setSearch] = useState('');

  const filtered = channels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="absolute inset-0 bg-[#0a0e12]/95 backdrop-blur-3xl z-50 flex flex-col p-6 animate-in fade-in zoom-in-98 duration-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white/90 tracking-tighter">Chaînes</h2>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <X size={24} className="text-white/80" />
        </button>
      </div>
      
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-[#00a8e1]/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input
          type="text"
          placeholder="Rechercher une chaîne..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1f24] py-4 pl-12 pr-6 rounded-2xl text-md text-white/90 placeholder:text-white/30 focus:outline-none border border-white/10 focus:border-[#00a8e1]/50 transition-all shadow-lg focus:shadow-[0_0_20px_rgba(0,168,225,0.1)] relative"
        />
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-24 pr-2">
        {filtered.map(ch => (
          <button
            key={ch.id}
            onClick={() => { onChannelSelect(ch); onClose(); }}
            className={`group flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 ${
              activeChannelId === ch.id 
                ? 'bg-[#00a8e1]/10 border-[#00a8e1]' 
                : 'bg-[#1a1f24] border-white/5 hover:bg-[#252c33] hover:border-white/10'
            }`}
          >
            <ChannelLogo name={ch.name} logo={ch.logo} containerClassName="w-20 h-20 mb-3" className="object-contain" />
            <span className="text-[10px] text-white/80 font-bold text-center uppercase tracking-wider truncate w-full">
              {ch.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
