import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Channel } from "../types";
import { ProgramCard } from "./ProgramCard";

interface ChannelCarouselProps {
  title: string;
  channels: Channel[];
  selectedChannelId?: number;
  onChannelSelect: (channel: Channel) => void;
  onMouseEnter?: (channel: Channel) => void;
  onSeeAll?: () => void;
  onShowInfo?: (channel: Channel) => void;
}

export const ChannelCarousel: React.FC<ChannelCarouselProps> = ({ title, channels, selectedChannelId, onChannelSelect, onMouseEnter, onSeeAll, onShowInfo }) => {
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
    <div className="space-y-2 group">
      <div className="px-4 md:px-6 flex items-end justify-between">
        <div className="flex items-center gap-3">
           {/* Minimalist Tab/Line Indicator */}
           <div className="w-1 h-6 bg-brand-500 rounded-full shadow-[0_0_12px_rgba(30,136,255,0.6)]" />
           <div>
             <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">{title}</h2>
             <p className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase mt-0.5">
                {channels.length} Chaînes
             </p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={scrollLeft}
              disabled={!showLeftArrow}
              className={`p-1.5 rounded-full border border-gray-200 backdrop-blur-xl transition-all ${
                showLeftArrow ? "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-110" : "bg-gray-50 text-neutral-600 cursor-not-allowed"
              }`}
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={scrollRight}
              disabled={!showRightArrow}
              className={`p-1.5 rounded-full border border-gray-200 backdrop-blur-xl transition-all ${
                showRightArrow ? "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-110" : "bg-gray-50 text-neutral-600 cursor-not-allowed"
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          
          {onSeeAll && (
            <button 
              onClick={onSeeAll}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-black/5 border border-transparent hover:border-gray-200 rounded-lg text-[9px] font-black text-gray-600 hover:text-gray-900 uppercase tracking-widest transition-all"
            >
              Explorer
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto px-4 md:px-6 pb-4 pt-1 scrollbar-none scroll-smooth snap-x"
        >
          {channels.map((channel) => (
            <div key={channel.id} className="snap-start shrink-0">
               <ProgramCard
                 channel={channel}
                 onClick={onChannelSelect}
                 onMouseEnter={onMouseEnter}
                 isPlaying={selectedChannelId === channel.id}
                 className="w-44 sm:w-60"
                 onShowInfo={onShowInfo}
               />
            </div>
          ))}
          {/* Spacer for end of scroll */}
          <div className="flex-shrink-0 w-4 md:w-6" />
        </div>
        
        {/* Subtle Side Fades to hint scrolling */}
        <div className={`absolute inset-y-0 left-0 w-6 md:w-16 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-y-0 right-0 w-10 md:w-24 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} />
      </div>
    </div>
  );
}
