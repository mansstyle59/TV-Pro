import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Channel } from "../types";
import { ProgramCard } from "./ProgramCard";

interface ChannelCarouselProps {
  title: string;
  channels: Channel[];
  selectedChannelId?: number;
  onChannelSelect: (channel: Channel) => void;
  onSeeAll?: () => void;
}

export const ChannelCarousel: React.FC<ChannelCarouselProps> = ({ title, channels, selectedChannelId, onChannelSelect, onSeeAll }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [channels]);

  const scrollParams = { behavior: 'smooth' as ScrollBehavior };
  
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({ left: -scrollAmount, ...scrollParams });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, ...scrollParams });
    }
  };

  if (channels.length === 0) return null;

  return (
    <div className="space-y-4 md:space-y-6 group">
      <div className="px-6 md:px-10 flex items-end justify-between">
        <div className="flex items-center gap-4">
           {/* Minimalist Tab/Line Indicator */}
           <div className="w-1.5 h-8 bg-brand-500 rounded-full shadow-[0_0_12px_rgba(30,136,255,0.6)]" />
           <div>
             <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">{title}</h2>
             <p className="text-[10px] font-black tracking-[0.2em] text-neutral-500 uppercase mt-1">
                {channels.length} Chaînes
             </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={scrollLeft}
              disabled={!showLeftArrow}
              className={`p-2 rounded-full border border-white/10 backdrop-blur-xl transition-all ${
                showLeftArrow ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-110" : "bg-neutral-950 text-neutral-600 cursor-not-allowed"
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={scrollRight}
              disabled={!showRightArrow}
              className={`p-2 rounded-full border border-white/10 backdrop-blur-xl transition-all ${
                showRightArrow ? "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-110" : "bg-neutral-950 text-neutral-600 cursor-not-allowed"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          {onSeeAll && (
            <button 
              onClick={onSeeAll}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl text-[10px] font-black text-neutral-400 hover:text-white uppercase tracking-widest transition-all"
            >
              Explorer tout
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto px-6 md:px-10 pb-6 pt-2 scrollbar-none scroll-smooth snap-x"
        >
          {channels.map((channel) => (
            <div key={channel.id} className="snap-start shrink-0">
               <ProgramCard
                 channel={channel}
                 onClick={onChannelSelect}
                 isPlaying={selectedChannelId === channel.id}
               />
            </div>
          ))}
          {/* Spacer for end of scroll */}
          <div className="flex-shrink-0 w-6 md:w-10" />
        </div>
        
        {/* Subtle Side Fades to hint scrolling */}
        <div className={`absolute inset-y-0 left-0 w-8 md:w-20 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </div>
  );
}
