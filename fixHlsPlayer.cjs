const fs = require('fs');

const content = `import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Hls from "hls.js";
import { Play, Pause, Tv, AlertCircle, RefreshCw, Volume2, VolumeX, Maximize, Minimize, Circle, Settings, ExternalLink, RotateCcw, RotateCw, ChevronLeft, Cast, Heart } from "lucide-react";

interface HlsPlayerProps {
  url: string;
  channelName: string;
  programTitle?: string;
  programDesc?: string;
  programImage?: string;
  onBack?: () => void;
  onFatalError?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function HlsPlayer({ url, channelName, programTitle, programDesc, programImage, onBack, onFatalError, isFavorite, onToggleFavorite }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    setIsPiPSupported(document.pictureInPictureEnabled);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setLoading(true);
    setIsPlaying(false);
    setLevels([]);
    setCurrentLevel(-1);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLoading(false);
        const mappedLevels = data.levels.map((level, index) => ({
          id: index,
          height: level.height,
          bitrate: level.bitrate
        }));
        setLevels(mappedLevels);
        video.play().catch(() => console.log("Autoplay blocked"));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (hls.autoLevelEnabled) {
          setCurrentLevel(-1);
        } else {
          setCurrentLevel(data.level);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Erreur réseau - Tentative de reconnexion...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Erreur média - Récupération...");
              hls.recoverMediaError();
              break;
            default:
              setError("Signal temporairement interrompu");
              hls.destroy();
              hlsRef.current = null;
              if (onFatalError) onFatalError();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setError("Erreur de flux sur ce navigateur");
        setLoading(false);
        if (onFatalError) onFatalError();
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActivity > 4000 && isPlaying && !showSettings) {
        setShowControls(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastActivity, isPlaying, showSettings]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) video.play();
      else video.pause();
      setIsPlaying(!video.paused);
      handleMouseMove();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
      if (video.muted) setVolume(0);
      else setVolume(1);
    }
  };

  const handleVolumeChange = (v: number) => {
    const video = videoRef.current;
    if (video) {
      video.volume = v;
      setVolume(v);
      setIsMuted(v === 0);
      video.muted = v === 0;
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const doc = document as any;
    const el = container as any;
    const v = video as any;

    const currentFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

    if (!currentFullscreen) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (v.webkitEnterFullscreen) {
          v.webkitEnterFullscreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
      } catch (err) {
        if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        else if (doc.msExitFullscreen) doc.msExitFullscreen();
      } catch (err) { }
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (video && isPiPSupported) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch (err) {}
    }
  };

  const changeLevel = (id: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = id;
      setCurrentLevel(id);
      setShowSettings(false);
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime += seconds;
      handleMouseMove();
    }
  };

  // Double tap to seek logic
  let lastTap = 0;
  let tapTimeout: NodeJS.Timeout | null = null;
  const handleVideoTouch = (e: React.MouseEvent | React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (tapTimeout) clearTimeout(tapTimeout);
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      
      if (clientX > containerWidth / 2) {
        skip(10); // Forward
      } else {
        skip(-10); // Backward
      }
      e.preventDefault();
    } else {
      tapTimeout = setTimeout(() => {
        togglePlay();
      }, 300);
    }
    lastTap = currentTime;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        case "arrowleft":
          skip(-10);
          break;
        case "arrowright":
          skip(10);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    setLastActivity(Date.now());
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    const video = videoRef.current;
    if (url && video) {
      if (hlsRef.current) {
        hlsRef.current.loadSource(url);
        hlsRef.current.startLoad();
      } else {
        video.src = url;
        video.load();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={\`relative w-full aspect-video bg-[#0B0B0B] overflow-hidden shadow-2xl group border border-white/5 touch-none select-none transition-all \${isFullscreen ? "" : "rounded-2xl"}\`}
    >
      <video
        ref={videoRef}
        onClick={handleVideoTouch}
        onTouchEnd={(e) => {
          handleVideoTouch(e as unknown as React.MouseEvent);
        }}
        className="w-full h-full object-contain cursor-pointer"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 inset-x-0 p-4 pt-4 md:p-6 md:pt-8 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-40 flex items-start justify-between"
          >
            <div className="flex items-center gap-4 md:gap-6">
               {onBack && (
                 <button 
                   onClick={onBack}
                   className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
                 >
                   <ChevronLeft size={24} className="text-white" />
                 </button>
               )}
               <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                     <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter shadow-black drop-shadow-xl">{channelName}</h3>
                     {programTitle && (
                       <p className="text-xs md:text-sm font-bold text-[#A0A0A0] truncate max-w-sm">{programTitle}</p>
                     )}
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
              {onToggleFavorite && (
                <button onClick={onToggleFavorite} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                  <Heart size={20} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "text-[#1E88FF]" : "text-white"} />
                </button>
              )}
              <button onClick={() => {}} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md hidden sm:block">
                <Cast size={20} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-24 right-4 md:right-8 w-64 bg-[#151515]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 z-50 shadow-2xl"
          >
            <h4 className="text-xs font-bold uppercase text-[#A0A0A0] mb-3 tracking-widest">Qualité vidéo</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto w-full pr-1">
              <button 
                onClick={() => changeLevel(-1)}
                className={\`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all \${currentLevel === -1 ? "bg-[#1E88FF]/20 text-[#1E88FF]" : "hover:bg-white/10 text-white"}\`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest">Auto</span>
                {currentLevel === -1 && <Circle size={4} fill="currentColor" />}
              </button>
              
              {levels.sort((a, b) => b.height - a.height).map(level => {
                const isHD = level.height >= 720;
                return (
                  <button 
                    key={level.id}
                    onClick={() => changeLevel(level.id)}
                    className={\`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all \${currentLevel === level.id ? "bg-[#1E88FF]/20 text-[#1E88FF]" : "hover:bg-white/10 text-white"}\`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">{level.height}p {isHD && <span className="ml-1 px-1 bg-[#1E88FF] text-white rounded">HD</span>}</span>
                    {currentLevel === level.id && <Circle size={4} fill="currentColor" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loader */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-lg">
          <RefreshCw className="w-12 h-12 text-[#1E88FF] animate-spin" />
        </div>
      )}

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-40"
          >
            {/* Progress Bar Mocked for Live TV */}
            <div className="w-full h-1 bg-white/20 rounded-full mb-4 relative cursor-pointer group">
              <div className="absolute top-0 bottom-0 left-0 bg-[#1E88FF] w-full origin-left rounded-full shadow-[0_0_10px_#1E88FF] transition-all" />
              <div className="absolute -top-1.5 -bottom-1.5 right-0 w-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-6">
                <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                  {isPlaying ? <Pause fill="white" size={28} /> : <Play fill="white" size={28} />}
                </button>
                
                <div className="flex items-center gap-3 group/vol hidden sm:flex">
                  <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                     {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-0 group-hover/vol:w-20 transition-all cursor-pointer accent-[#1E88FF]"
                  />
                </div>
                
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                   <span className="text-[9px] font-bold text-white uppercase tracking-widest">En direct</span>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <button onClick={() => setShowSettings(!showSettings)} className="text-white hover:rotate-90 transition-transform">
                  <Settings size={22} />
                </button>
                
                {isPiPSupported && (
                  <button onClick={togglePiP} className="text-white hover:-translate-y-1 transition-transform">
                    <ExternalLink size={22} />
                  </button>
                )}
                
                <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
                   {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0B0B]/90 z-50">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-white font-bold mb-6 text-center">{error}</p>
          <button onClick={handleRetry} className="px-6 py-2 bg-[#1E88FF] text-white rounded-full font-bold">Réessayer</button>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/HlsPlayer.tsx', content);
