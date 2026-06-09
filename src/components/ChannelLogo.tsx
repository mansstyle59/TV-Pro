import React from "react";
import { Tv } from "lucide-react";

interface ChannelLogoProps {
  logo?: string;
  name: string;
  className?: string;
  iconClassName?: string;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({ 
  logo, 
  name, 
  className = "w-full h-full object-contain", 
  iconClassName = "w-5 h-5 text-neutral-400" 
}) => {
  const [error, setError] = React.useState(false);

  // Generate elegant channel initials for fallback (e.g. TF1 -> TF1, France 2 -> FR2)
  const initials = React.useMemo(() => {
    let clean = name.trim();
    
    // Remove "FR |", "FR:", "HD -", etc.
    clean = clean.replace(/^(FR\s*[:|\\-]*\s*|FRANCE\s+|FRANCE\s+)/i, "");
    
    // If it's a number/simple text
    if (/^[0-9]+$/.test(clean)) {
      return clean;
    }

    const parts = clean.split(/[\s\-_]+/);
    if (parts.length >= 2) {
      const p1 = parts[0];
      const p2 = parts[1];
      if (/^France$/i.test(p1) && p2) {
        return `F${p2[0].toUpperCase()}`;
      }
      return (p1[0] + p2[0]).toUpperCase().slice(0, 3);
    }
    
    return clean.slice(0, 3).toUpperCase();
  }, [name]);

  // If there's an error loading or no logo provided, return premium stylized text initial
  if (error || !logo || logo.trim() === "") {
    return (
      <span 
        className="text-[10px] sm:text-xs font-black text-white/90 bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] border border-white/10 rounded-xl w-full h-full flex items-center justify-center uppercase select-none p-1 shadow-inner text-center font-sans tracking-wider"
        title={name}
      >
        {initials}
      </span>
    );
  }

  return (
    <img 
      src={logo} 
      alt={name}
      loading="lazy"
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        console.warn(`[Logo Fallback] Failed to load logo for channel: ${name}. falling back to initials.`);
        setError(true);
      }}
    />
  );
};
