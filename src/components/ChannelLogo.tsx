import React from "react";
import { Tv, Sparkles, Trophy, Film, Music, Compass, AlertCircle } from "lucide-react";
import { getLogoForChannel } from "../utils/logoHelper";

interface ChannelLogoProps {
  logo?: string;
  name: string;
  className?: string;
  iconClassName?: string;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({ 
  logo, 
  name, 
  className = "w-full h-full object-contain rounded-lg", 
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

  // Determine a theme based on channel name keywords
  const theme = React.useMemo(() => {
    const n = name.toLowerCase();
    
    if (n.includes("sport") || n.includes("bein") || n.includes("foot") || n.includes("equipe") || n.includes("dazn") || n.includes("eurosport") || n.includes("combat") || n.includes("golf") || n.includes("fight")) {
      return {
        bg: "from-[#0F172A] via-[#1E1B4B] to-[#020617]",
        border: "border-orange-500/30",
        text: "text-orange-400",
        glow: "shadow-[0_0_12px_rgba(249,115,22,0.15)]",
        badge: "SPORTS",
        icon: trophyIcon
      };
    }
    
    if (n.includes("canal") || n.includes("plus") || n.includes("vip") || n.includes("pro") || n.includes("star")) {
      return {
        bg: "from-neutral-950 via-neutral-900 to-neutral-950",
        border: "border-amber-500/30",
        text: "text-amber-400 font-serif tracking-tight",
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.12)]",
        badge: "PREMIUM",
        icon: premiumIcon
      };
    }
    
    if (n.includes("cine") || n.includes("ciné") || n.includes("film") || n.includes("series") || n.includes("séries") || n.includes("ocs") || n.includes("action") || n.includes("syfy")) {
      return {
        bg: "from-[#1E1B4B] via-[#311042] to-[#0F051D]",
        border: "border-purple-500/30",
        text: "text-purple-300",
        glow: "shadow-[0_0_12px_rgba(168,85,247,0.15)]",
        badge: "CINÉ",
        icon: filmIcon
      };
    }
    
    if (n.includes("m6") || n.includes("music") || n.includes("hits") || n.includes("song") || n.includes("trace") || n.includes("cstar")) {
      return {
        bg: "from-[#0D091A] via-[#1E112A] to-[#120024]",
        border: "border-pink-500/30",
        text: "text-pink-400",
        glow: "shadow-[0_0_12px_rgba(236,72,153,0.15)]",
        badge: "MUSIC",
        icon: musicIcon
      };
    }

    if (n.includes("discover") || n.includes("science") || n.includes("planete") || n.includes("nat geo") || n.includes("national") || n.includes("ushuaia") || n.includes("decouverte") || n.includes("histoire")) {
      return {
        bg: "from-emerald-950/90 via-slate-900 to-teal-950/90",
        border: "border-emerald-500/25",
        text: "text-emerald-400",
        glow: "shadow-[0_0_10px_rgba(16,185,129,0.12)]",
        badge: "DOCS",
        icon: compassIcon
      };
    }

    if (n.includes("info") || n.includes("news") || n.includes("bfm") || n.includes("cnews") || n.includes("lci") || n.includes("24")) {
      return {
        bg: "from-stone-900 via-[#101A2C] to-slate-900",
        border: "border-blue-500/30",
        text: "text-blue-400",
        glow: "shadow-[0_0_10px_rgba(59,130,246,0.12)]",
        badge: "ACTU",
        icon: null
      };
    }

    // Default premium look tailored to our blue/cyan branding
    return {
      bg: "from-neutral-900 via-[#0F171E] to-neutral-950",
      border: "border-[#FF7900]/25",
      text: "text-white",
      glow: "shadow-[0_0_10px_rgba(0,168,225,0.1)]",
      badge: "LIVE TV",
      icon: null
    };
  }, [name]);

  const [updateKey, setUpdateKey] = React.useState(0);

  React.useEffect(() => {
    const handleUpdate = () => {
      setUpdateKey(prev => prev + 1);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("custom_logo_updated", handleUpdate);
      return () => {
        window.removeEventListener("custom_logo_updated", handleUpdate);
      };
    }
  }, []);

  // Normalize logos to the high-quality tv-logo and fallback logo map
  const parsedLogo = React.useMemo(() => {
    return getLogoForChannel(name, logo);
  }, [name, logo, updateKey]);

  // Reset error state when parsedLogo or name changes
  React.useEffect(() => {
    setError(false);
  }, [parsedLogo, name, updateKey]);

  // Custom vector icons helper
  function trophyIcon() {
    return <Trophy className="absolute top-1 right-1 w-2.5 h-2.5 text-orange-500/70" />;
  }
  function premiumIcon() {
    return <Sparkles className="absolute top-1 right-1 w-2.5 h-2.5 text-amber-500/70" />;
  }
  function filmIcon() {
    return <Film className="absolute top-1 right-1 w-2.5 h-2.5 text-purple-500/70" />;
  }
  function musicIcon() {
    return <Music className="absolute top-1 right-1 w-2.5 h-2.5 text-pink-500/70" />;
  }
  function compassIcon() {
    return <Compass className="absolute top-1 right-1 w-2.5 h-2.5 text-emerald-500/70" />;
  }

  // If there's an error loading or no logo provided, return premium stylized designer vector badge
  if (error || !parsedLogo || parsedLogo.trim() === "") {
    return (
      <div 
        className={`w-10 h-10 flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} border ${theme.border} ${theme.glow} rounded-xl relative select-none p-1 shrink-0 overflow-hidden group transition-all duration-300 hover:scale-[1.05]`}
        title={name}
      >
        {/* Decorative corner visual accent lines */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20 rounded-tl" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20 rounded-br" />
        
        {/* Mini Contextual Icon render */}
        {theme.icon && theme.icon()}

        {/* Glow behind initials */}
        <div className="absolute inset-0 bg-white/[0.02] mix-blend-overlay pointer-events-none" />

        {/* Main Monogram Text */}
        <span className={`font-black text-[11px] leading-tight text-center tracking-tight uppercase ${theme.text}`}>
          {initials}
        </span>

        {/* Small badge style text at bottom */}
        <span className="absolute bottom-0.5 inset-x-0 text-center text-[5.5px] font-bold tracking-widest text-white/45 uppercase scale-95 origin-center">
          {theme.badge}
        </span>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 shrink-0 bg-neutral-900/40 rounded-xl p-1 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-white/10 transition-all duration-300">
      <img 
        src={parsedLogo} 
        alt={name}
        loading="lazy"
        className={className}
        referrerPolicy="no-referrer"
        onError={() => {
          console.warn(`[Logo Fallback] Failed to load logo for channel: ${name}. falling back to initials.`);
          setError(true);
        }}
      />
    </div>
  );
};
