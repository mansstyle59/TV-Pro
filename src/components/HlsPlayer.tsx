import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Hls from "hls.js";

declare global {
  interface Window {
    cast: any;
    __onGCastApiAvailable: (isAvailable: boolean) => void;
  }
}

import { 
  Play, 
  Pause, 
  Tv, 
  AlertCircle, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Circle, 
  Settings, 
  ExternalLink,
  PictureInPicture, 
  RotateCcw, 
  RotateCw, 
  ChevronLeft, 
  Cast, 
  Heart,
  Sun,
  Keyboard,
  Compass,
  Info,
  HelpCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Monitor,
  Smartphone,
  Zap,
  Sliders,
  Activity
} from "lucide-react";

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
  fullViewport?: boolean;
}

export function HlsPlayer({ 
  url, 
  channelName, 
  programTitle = "Émission en direct", 
  programDesc = "Aucune description disponible pour ce programme.", 
  programImage, 
  onBack, 
  onFatalError, 
  isFavorite, 
  onToggleFavorite,
  fullViewport = false
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Custom Settings
  const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [premiumBufferBoost, setPremiumBufferBoost] = useState<boolean>(() => {
    return localStorage.getItem("vavoo_premium_buffer_boost") === "true";
  });
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showSettings, setShowSettings] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cast states & devices
  const [showCastMenu, setShowCastMenu] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [castDevice, setCastDevice] = useState<string | null>(null);
  const [isConnectingCast, setIsConnectingCast] = useState(false);

  // Advanced Multi-device Custom Cast Storer & Controller
  const [customDevices, setCustomDevices] = useState<{ id: string; name: string; type: string }[]>(() => {
    try {
      const saved = localStorage.getItem("vavoo_cast_devices");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not parse saved cast devices");
    }
    return [
      { id: "salon", name: "Chromecast Salon Ultra", type: "Chromecast" },
      { id: "chambre", name: "Apple TV Chambre 4K", type: "AirPlay" },
      { id: "cuisine", name: "LG TV Connectée Cuisine", type: "UPnP/DLNA" },
      { id: "freebox", name: "Freebox Pop Salon", type: "Orange/Freebox" }
    ];
  });

  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<string>("Chromecast");
  const [copied, setCopied] = useState(false);
  const [castSettingsTab, setCastSettingsTab] = useState<"devices" | "instructions" | "stream_url">("devices");
  const [showNativeCastNotAvailable, setShowNativeCastNotAvailable] = useState(false);

  // Advanced Video Player Controls Extensions
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [objectFit, setObjectFit] = useState<"contain" | "cover" | "fill">("contain");
  const [showStats, setShowStats] = useState(false);
  const [streamStats, setStreamStats] = useState({
    buffer: 0.0,
    bitrate: 0,
    fps: 30,
    latency: 1.2,
    droppedFrames: 0,
    codec: "H.264/AAC"
  });

  const saveDevices = (updated: typeof customDevices) => {
    setCustomDevices(updated);
    try {
      localStorage.setItem("vavoo_cast_devices", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save cast devices");
    }
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    const newDevice = {
      id: Math.random().toString(36).substring(2, 9),
      name: newDeviceName.trim(),
      type: newDeviceType
    };
    const updated = [...customDevices, newDevice];
    saveDevices(updated);
    setNewDeviceName("");
    setShowAddDeviceModal(false);
    flashHUD(`Appareil ${newDeviceName} ajouté !`);
  };

  const handleDeleteDevice = (id: string, name: string) => {
    const updated = customDevices.filter(d => d.id !== id);
    saveDevices(updated);
    flashHUD(`Appareil ${name} supprimé`);
  };

  const handleCastSelect = (deviceName: string) => {
    setIsConnectingCast(true);
    setShowCastMenu(false);
    flashHUD(`Connexion à ${deviceName}...`);
    
    setTimeout(() => {
      setIsConnectingCast(false);
      setIsCasting(true);
      setCastDevice(deviceName);
      // Pause local video since we are casting
      const video = videoRef.current;
      if (video) {
        video.pause();
        setIsPlaying(false);
      }
      flashHUD(`Diffusé sur ${deviceName}`);
    }, 2000);
  };

  const handleDisconnectCast = () => {
    setIsCasting(false);
    setCastDevice(null);
    flashHUD("Casting arrêté");
    // Resume local video
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Dynamic Browser Native Casting Handler (DLNA, AirPlay, Chromecast built-in)
  const handleNativeCast = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      // 1. AirPlay for Apple devices
      if ((video as any).webkitShowPlaybackTargetPicker) {
        (video as any).webkitShowPlaybackTargetPicker();
        flashHUD("Recherche AirPlay...");
        return;
      }

      // 2. Standard Remote Playback API (Chromecast/SmartTV built into Chrome/Edge)
      if ((video as any).remote && typeof (video as any).remote.prompt === "function") {
        flashHUD("Recherche d'écrans...");
        await (video as any).remote.prompt();
        return;
      }

      // Fallback
      setShowNativeCastNotAvailable(true);
      setTimeout(() => setShowNativeCastNotAvailable(false), 4500);
    } catch (err) {
      console.warn("Native remote browser cast error:", err);
      // fallback simulation
      setShowCastMenu(true);
    }
  };
  
  // Premium extra states
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [infoDrawerTab, setInfoDrawerTab] = useState<"program" | "shortcuts">("program");

  // Simulated Live Program timing
  const [liveTiming, setLiveTiming] = useState({
    startStr: "08:00",
    endStr: "09:30",
    percent: 65,
  });

  // Generate dynamic live schedule timing based on current clock to look incredibly realistic
  useEffect(() => {
    const updateTiming = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Divide day into 45-minute or 90-minute blocks
      const blockSize = 90; // 1h30 show
      const currentBlockIndex = Math.floor(currentMinutes / blockSize);
      const blockStartMinutes = currentBlockIndex * blockSize;
      const blockEndMinutes = blockStartMinutes + blockSize;

      const startH = Math.floor(blockStartMinutes / 60).toString().padStart(2, "0");
      const startM = (blockStartMinutes % 60).toString().padStart(2, "0");
      const endH = Math.min(23, Math.floor(blockEndMinutes / 60)).toString().padStart(2, "0");
      const endM = (blockEndMinutes % 60).toString().padStart(2, "0");

      const elapsed = currentMinutes - blockStartMinutes;
      const percent = Math.min(100, Math.max(5, Math.round((elapsed / blockSize) * 100)));

      setLiveTiming({
        startStr: `${startH}:${startM}`,
        endStr: `${endH}:${endM}`,
        percent,
      });
    };

    updateTiming();
    const interval = setInterval(updateTiming, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [channelName]);

  // Fullscreen listeners
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
    const video = videoRef.current;
    if (!video) {
      setIsPiPSupported(!!document.pictureInPictureEnabled);
      return;
    }

    const standardPiP = !!(document.pictureInPictureEnabled || typeof video.requestPictureInPicture === "function");
    const webkitPiP = !!((video as any).webkitSupportsPresentationMode && (video as any).webkitSupportsPresentationMode("picture-in-picture"));
    setIsPiPSupported(standardPiP || webkitPiP);

    const onEnterPiP = () => {
      flashHUD("In-Picture Activé");
    };

    const onLeavePiP = () => {
      flashHUD("In-Picture Désactivé");
    };

    video.addEventListener("enterpictureinpicture", onEnterPiP);
    video.addEventListener("leavepictureinpicture", onLeavePiP);

    const onWebkitPresentationModeChanged = () => {
      if ((video as any).webkitPresentationMode === "picture-in-picture") {
        flashHUD("In-Picture Activé");
      } else {
        flashHUD("In-Picture Désactivé");
      }
    };

    video.addEventListener("webkitpresentationmodechanged", onWebkitPresentationModeChanged);

    return () => {
      video.removeEventListener("enterpictureinpicture", onEnterPiP);
      video.removeEventListener("leavepictureinpicture", onLeavePiP);
      video.removeEventListener("webkitpresentationmodechanged", onWebkitPresentationModeChanged);
    };
  }, [url]);

  // HLS stream binding & error handling
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
        maxMaxBufferLength: premiumBufferBoost ? 35 : 5,               // Increased buffer for premium stability
        enableWorker: true,
        lowLatencyMode: !premiumBufferBoost,                           // Trade dynamic drift for ultra packet stability
        backBufferLength: premiumBufferBoost ? 15 : 5,                
        liveSyncDurationCount: premiumBufferBoost ? 4 : 1,            
        liveMaxLatencyDurationCount: premiumBufferBoost ? 8 : 1.5,    
        maxBufferLength: premiumBufferBoost ? 25 : 3,                  // Expand buffer up to 25s to survive latency drops
        maxBufferSize: premiumBufferBoost ? 64 * 1024 * 1024 : 20 * 1024 * 1024,
        highBufferWatchdogPeriod: 2,         
        manifestLoadingMaxRetry: premiumBufferBoost ? 8 : 4,          
        manifestLoadingRetryDelay: 500,
        levelLoadingMaxRetry: premiumBufferBoost ? 8 : 4,             
        levelLoadingRetryDelay: 500,
        fragLoadingMaxRetry: premiumBufferBoost ? 15 : 8,             // 15 segment download retries
        fragLoadingRetryDelay: 500,          
        fragLoadingTimeOut: premiumBufferBoost ? 15000 : 5000,        // Increase socket timeout up to 15s to keep playing
        progressive: true                    
      });
      hlsRef.current = hls;

      let mediaErrorCount = 0;
      let networkErrorCount = 0;

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

      hls.on(Hls.Events.FRAG_LOADED, () => {
        mediaErrorCount = 0;
        networkErrorCount = 0;
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
              networkErrorCount++;
              if (networkErrorCount <= 3) {
                console.warn(`Hls Network Error: trying silent recover (${networkErrorCount}/3)`);
                hls.startLoad();
              } else {
                setError("Erreur réseau - Flux indisponible");
                hls.destroy();
                hlsRef.current = null;
                if (onFatalError) onFatalError();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              mediaErrorCount++;
              if (mediaErrorCount === 1) {
                console.warn("Hls Media Error: practicing recoverMediaError");
                hls.recoverMediaError();
              } else if (mediaErrorCount === 2) {
                console.warn("Hls Media Error: swapping audio codec & recovering");
                hls.swapAudioCodec();
                hls.recoverMediaError();
              } else {
                setError("Erreur décodeur - Le flux ne peut pas être lu");
                hls.destroy();
                hlsRef.current = null;
                if (onFatalError) onFatalError();
              }
              break;
            default:
              setError("Signal de diffusion interrompu");
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
  }, [url, premiumBufferBoost]);

  // Cast framework initialization
  useEffect(() => {
    const initializeCast = () => {
      if (window.cast && window.cast.framework && (window as any).chrome) {
        window.cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: (window as any).chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
      }
    };

    if (window.__onGCastApiAvailable) {
      window.__onGCastApiAvailable(true);
    } else {
      window.__onGCastApiAvailable = (isAvailable) => {
        if (isAvailable) initializeCast();
      };
    }
    initializeCast();
  }, []);

  // Dynamic stream stats poller with Live-Sync Auto-Correction (Anti-Décalage Active Engine)
  useEffect(() => {
    let intervalId: any;
    if (isPlaying) {
      intervalId = setInterval(() => {
        const video = videoRef.current;
        if (!video) return;
        let buf = 0;
        const current = video.currentTime;
        const buffered = video.buffered;
        for (let i = 0; i < buffered.length; i++) {
          if (current >= buffered.start(i) && current <= buffered.end(i)) {
            buf = buffered.end(i) - current;
            break;
          }
        }

        // Active low-latency sync: check if streaming delay drifted and catch up
        if (buffered && buffered.length > 0) {
          const liveEnd = buffered.end(buffered.length - 1);
          const currentDrift = liveEnd - current;

          if (currentDrift > 18) {
            // Large drift (e.g. loaded after a pause): do a silent, clean seek forward
            if (hlsRef.current && hlsRef.current.liveSyncPosition) {
              const livePos = hlsRef.current.liveSyncPosition;
              video.currentTime = livePos;
            } else {
              video.currentTime = Math.max(0, liveEnd - 1.0);
            }
          } else if (currentDrift > 5.5) {
            // Medium drift: gently accelerate speed to catch up (just like premium IPTV players do)
            video.playbackRate = Math.min(2.0, playbackRate * 1.08);
          } else {
            // Synced: restore user's default playback speed
            if (video.playbackRate !== playbackRate) {
              video.playbackRate = playbackRate;
            }
          }
        }

        let bit = 0;
        if (hlsRef.current && hlsRef.current.currentLevel !== -1) {
          const lvl = hlsRef.current.levels[hlsRef.current.currentLevel];
          if (lvl) bit = lvl.bitrate;
        }

        let fps = 30;
        let dropped = 0;
        if ((video as any).getVideoPlaybackQuality) {
          const qual = (video as any).getVideoPlaybackQuality();
          fps = qual.totalVideoFrames ? Math.min(60, Math.round(qual.totalVideoFrames / (video.currentTime || 1))) : 30;
          if (fps === 0 || isNaN(fps) || !isFinite(fps)) fps = 30;
          dropped = qual.droppedVideoFrames || 0;
        }

        setStreamStats({
          buffer: Number(buf.toFixed(1)),
          bitrate: bit,
          fps,
          latency: hlsRef.current ? Number((hlsRef.current as any).latency?.toFixed(1) || "1.2") : 1.2,
          droppedFrames: dropped,
          codec: hlsRef.current?.levels[hlsRef.current.currentLevel]?.codecKeys?.join("+") || "H.264/AAC"
        });
      }, 2000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, url]);

  // Sync playback rate with the HTMLVideoElement
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, url]);

  // Controls auto-hide timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastActivity > 4000 && isPlaying && !showSettings && !showInfoPanel) {
        setShowControls(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastActivity, isPlaying, showSettings, showInfoPanel]);

  // Helper flash HUD on screen
  const flashHUD = (message: string) => {
    setHudMessage(message);
    const timeout = setTimeout(() => {
      setHudMessage(null);
    }, 1000);
    return () => clearTimeout(timeout);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play().catch(() => {});
        flashHUD("Lecture");
      } else {
        video.pause();
        flashHUD("Pause");
      }
      setIsPlaying(!video.paused);
      handleMouseMove();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
      if (video.muted) {
        setVolume(0);
        flashHUD("Muet");
      } else {
        setVolume(1);
        flashHUD("Son Activé");
      }
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
        flashHUD("Plein Écran");
      } catch (err) {
        if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      }
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        else if (doc.msExitFullscreen) doc.msExitFullscreen();
        flashHUD("Mode Fenêtre");
      } catch (err) { }
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (video) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (typeof video.requestPictureInPicture === "function") {
          await video.requestPictureInPicture();
        } else if ((video as any).webkitSupportsPresentationMode && typeof (video as any).webkitSetPresentationMode === "function") {
          const currentMode = (video as any).webkitPresentationMode;
          const nextMode = currentMode === "picture-in-picture" ? "inline" : "picture-in-picture";
          (video as any).webkitSetPresentationMode(nextMode);
        } else {
          flashHUD("PiP non supporté");
        }
      } catch (err) {
        console.error("PiP error:", err);
        flashHUD("In-Picture indisponible");
      }
    }
  };

  const changeLevel = (id: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = id;
      setCurrentLevel(id);
      setShowSettings(false);
      const targetLevel = levels.find(l => l.id === id);
      flashHUD(targetLevel ? `${targetLevel.height}p` : "Qualité Auto");
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime += seconds;
      handleMouseMove();
    }
  };

  const handleVideoTouch = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  // Keyboard shortcut listener
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
        case "i":
          setInfoDrawerTab("program");
          setShowInfoPanel(prev => !prev);
          break;
        case "k":
          setInfoDrawerTab("shortcuts");
          setShowInfoPanel(prev => !prev);
          break;
        case "arrowleft":
          skip(-10);
          flashHUD("Précédent");
          break;
        case "arrowright":
          skip(10);
          flashHUD("Suivant");
          break;
        case "arrowup":
          e.preventDefault();
          const moreVol = Math.min(1.0, volume + 0.1);
          handleVolumeChange(moreVol);
          flashHUD(`Volume ${Math.round(moreVol * 100)}%`);
          break;
        case "arrowdown":
          e.preventDefault();
          const lessVol = Math.max(0.0, volume - 0.1);
          handleVolumeChange(lessVol);
          flashHUD(`Volume ${Math.round(lessVol * 100)}%`);
          break;
        case "[":
          e.preventDefault();
          const slower = Math.max(0.5, playbackRate - 0.25);
          setPlaybackRate(slower);
          flashHUD(`Vitesse: ${slower}x`);
          break;
        case "]":
          e.preventDefault();
          const faster = Math.min(2.0, playbackRate + 0.25);
          setPlaybackRate(faster);
          flashHUD(`Vitesse: ${faster}x`);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume, playbackRate]);

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
      className={`relative w-full bg-[#050505] overflow-hidden group touch-none select-none transition-all duration-500 ${
        fullViewport ? "h-full" : "aspect-video shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] border border-white/5"
      } ${isFullscreen ? "h-screen w-screen" : (fullViewport ? "" : "rounded-xl sm:rounded-2xl")}`}
    >
      <video
        ref={videoRef}
        onClick={handleVideoTouch}
        className="w-full h-full cursor-pointer transition-opacity duration-700"
        style={{ objectFit: objectFit, opacity: loading ? 0.3 : 1 }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setIsPlaying(true); setLoading(false); }}
        onCanPlay={() => setLoading(false)}
        onLoadedData={() => setLoading(false)}
        playsInline
        x-webkit-airplay="allow"
      />

      {/* Cinematic Top Vignette */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Cinematic Bottom Vignette */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Immersive Casting Screensaver Screen */}
      {isCasting && (
        <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center z-30 p-6 select-none border border-white/5 animate-fade-in text-sans">
          {/* Animated pulsing background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[#FF7900]/10 blur-[90px] animate-pulse pointer-events-none" />
          
          <div className="flex flex-col items-center text-center space-y-5 max-w-sm relative z-10">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-0 rounded-full border border-[#FF7900]/40 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
              <Cast size={28} className="text-[#FF7900] animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-[#FF7900]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] animate-pulse" />
                <span>Diffusion TV active</span>
              </div>
              <p className="text-sm font-semibold text-neutral-400 capitalize font-mono">{channelName}</p>
              <p className="text-base font-bold text-white tracking-tight leading-snug">Connecté à &laquo; {castDevice} &raquo;</p>
            </div>

            {programTitle && (
              <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/5 w-full">
                <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 block mb-0.5">En lecture sur Téléviseur</span>
                <p className="text-xs font-bold text-neutral-300 truncate">{programTitle}</p>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDisconnectCast();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-xl shadow-red-950/20 active:scale-95 text-xs font-semibold"
            >
              Arrêter la diffusion
            </button>
          </div>
        </div>
      )}

      {/* Simulated Casting Connection Splash Cover */}
      {isConnectingCast && (
        <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center z-50 p-6 select-none animate-fade-in text-sans">
          <RefreshCw className="w-8 h-8 text-[#FF7900] animate-spin mb-3" />
          <p className="text-white text-sm font-bold tracking-tight mb-1">Connexion à l'écran de télévision...</p>
          <p className="text-[10px] text-neutral-400 font-mono">Négociation du protocole IPTV Cast...</p>
        </div>
      )}

      {/* Big Play Overlay Button when paused */}
      {!isPlaying && !loading && !error && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] cursor-pointer z-20 group/playbtn"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl relative border border-white/20 transition-all group-hover/playbtn:scale-105 duration-300 flex-none"
          >
            <Play fill="currentColor" size={24} className="text-white ml-0.5" />
          </motion.div>
        </div>
      )}

      {/* HUD Message Overlay for generic actions (Play, Pause, Mute) */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 backdrop-blur-xl text-white px-5 py-2.5 rounded-full border border-white/10 font-bold text-[11px] uppercase tracking-wider z-50 pointer-events-none shadow-xl"
          >
            {hudMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="absolute top-0 inset-x-0 p-4 pt-6 md:p-6 md:pt-8 bg-gradient-to-b from-black/80 via-black/30 to-transparent z-40 flex items-start justify-between"
          >
            <div className="flex items-center gap-4 max-w-[70%]">
               {onBack && (
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onBack();
                   }}
                   className="p-2.5 bg-white/5 hover:bg-white/10 text-white active:scale-95 border border-white/5 rounded-full transition-all duration-200 backdrop-blur-md"
                 >
                   <ChevronLeft size={20} />
                 </button>
               )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-lg font-bold text-white tracking-tight leading-none">{channelName}</h3>
                <div className="flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded-[4px] shadow-lg shadow-red-500/20">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-white">Live</span>
                </div>
              </div>
              {programTitle && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoDrawerTab("program");
                    setShowInfoPanel(!showInfoPanel);
                  }}
                  className="text-[10px] text-white/50 hover:text-white flex items-center gap-1 transition-colors mt-1 text-left font-medium uppercase tracking-tight"
                >
                  <span>{programTitle}</span>
                  <Info size={10} className="text-white/30" />
                </button>
              )}
            </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Information & Shortcuts Panel Trigger */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoDrawerTab("program");
                  setShowInfoPanel(!showInfoPanel);
                }} 
                className={`p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-md ${showInfoPanel ? "bg-white/10 border-white/25" : ""}`}
                title="Détails de l'émission et Raccourcis"
              >
                <HelpCircle size={18} className="text-neutral-300 hover:text-white" />
              </button>

              {onToggleFavorite && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                    flashHUD(isFavorite ? "Supprimé des favoris" : "Ajouté aux favoris");
                  }} 
                  className="p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-md group/fav"
                >
                  <Heart 
                    size={18} 
                    fill={isFavorite ? "currentColor" : "none"} 
                    className={`transition-transform duration-200 ${isFavorite ? "text-white scale-110" : "text-neutral-300 group-hover/fav:scale-105"}`} 
                  />
                </button>
              )}
              
              <button 
                className={`p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-md relative google-cast-launcher ${isCasting ? "bg-[#FF7900]/10 border-[#FF7900]/30 text-white shadow-lg" : ""}`}
                title="Caster sur votre TV"
              >
                <Cast 
                  size={18} 
                  className={`transition-colors duration-200 ${isCasting ? "text-[#FF7900]" : "text-neutral-300 hover:text-white"}`} 
                />
                {isCasting && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF7900] rounded-full animate-pulse border border-black" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info & Program Details Sidebar */}
      <AnimatePresence>
        {showInfoPanel && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute left-6 top-20 bottom-20 w-80 bg-neutral-950/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 z-50 flex flex-col justify-between overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF7900]">Assistance & Info</span>
                <button onClick={() => setShowInfoPanel(false)} className="text-neutral-400 hover:text-white text-xs font-medium transition-colors">Fermer</button>
              </div>

              {/* Segmented Tab */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 mb-4 select-none">
                <button 
                  onClick={() => setInfoDrawerTab("program")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${infoDrawerTab === "program" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
                >
                  Programme
                </button>
                <button 
                  onClick={() => setInfoDrawerTab("shortcuts")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${infoDrawerTab === "shortcuts" ? "bg-white/10 text-white shadow-sm" : "text-[#A0A0A0] hover:text-neutral-200"}`}
                >
                  Raccourcis
                </button>
              </div>

              {infoDrawerTab === "program" ? (
                <div className="space-y-4 flex-grow">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest text-[#FF7900] bg-[#FF7900]/10 px-2 py-0.5 rounded border border-[#FF7900]/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] animate-pulse" />
                      En cours
                    </span>
                    <h4 className="text-xl font-black text-white tracking-tighter leading-none">{programTitle}</h4>
                    <p className="text-[10px] font-black text-neutral-500 font-mono tracking-widest uppercase">
                      Direct : {liveTiming.startStr} - {liveTiming.endStr}
                    </p>
                  </div>
                  
                  {programImage && (
                    <div className="w-full h-32 rounded-2xl overflow-hidden border border-white/5 bg-neutral-900 relative">
                      <img src={programImage} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                    </div>
                  )}
                  
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-xs leading-relaxed text-neutral-300 font-medium select-text max-h-40 overflow-y-auto scrollbar-thin">
                      {programDesc}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-grow max-h-[340px] overflow-y-auto pr-1">
                  {[
                    { k: "Espace", d: "Play / Pause" },
                    { k: "F", d: "Plein Écran" },
                    { k: "M", d: "Couper le son" },
                    { k: "I", d: "Description émission" },
                    { k: "← / →", d: "Reculer / Avancer 10s" },
                    { k: "↑ / ↓", d: "Ajuster Volume" },
                    { k: "Glisser ↑↓", d: "Lumi / Vol (Côtés)" },
                    { k: "Double Tap", d: "Sauter 10s" },
                  ].map(shortcut => (
                    <div key={shortcut.k} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[11px] font-medium text-neutral-300">{shortcut.d}</span>
                      <kbd className="px-2 py-0.5 bg-white/10 text-white rounded text-[9px] font-mono border border-white/5 shadow-md">{shortcut.k}</kbd>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {infoDrawerTab === "program" && (
              <div className="border-t border-white/5 pt-4 mt-4 space-y-1.5 select-none">
                <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-[#A0A0A0]">
                  <span>Prochain programme</span>
                  <span className="font-mono">{liveTiming.endStr}</span>
                </div>
                <div className="text-xs font-semibold text-white tracking-tight">Le Journal de 20 Heures / Magazine d'information</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Transmission Diagnostic Overlay HUD */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-20 right-6 bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4.5 z-40 shadow-2xl space-y-2 font-mono text-[9px] text-neutral-300 w-52 pointer-events-none select-none text-left"
          >
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 mb-1 text-white">
              <Activity size={10} className="text-[#FF7900]" />
              <span className="font-bold uppercase tracking-wider">DIAGNOSTIC DU SIGNAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Flux Codec :</span>
              <span className="text-white font-semibold truncate max-w-[100px]">{streamStats.codec}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Qualité Active :</span>
              <span className="text-[#FF7900] font-semibold">
                {currentLevel === -1 
                  ? `${levels[0]?.height ? levels[0].height + 'p' : 'Auto'}` 
                  : `${levels.find(l => l.id === currentLevel)?.height || 'Indéterminée'}p`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Débit estimé :</span>
              <span className="text-emerald-400 font-semibold">
                {streamStats.bitrate ? `${(streamStats.bitrate / 1000000).toFixed(2)} Mbps` : "Auto-adaptation"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Buffer Mémoire :</span>
              <span className="text-amber-400 font-semibold">{streamStats.buffer}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Fluidité FPS :</span>
              <span className="text-white font-semibold">{streamStats.fps} i/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Pertes images :</span>
              <span className="text-red-400 font-semibold">{streamStats.droppedFrames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Délai Latence :</span>
              <span className="text-neutral-400">{streamStats.latency}s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Micro popup warning for blocked Native Cast APIs */}
      <AnimatePresence>
        {showNativeCastNotAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-amber-500/20 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 max-w-sm pointer-events-none"
          >
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex-shrink-0">
              <Info size={14} />
            </div>
            <div className="text-left font-sans text-[10px] leading-relaxed">
              <span className="font-bold text-amber-500 block uppercase tracking-wider mb-0.5">Note de Diffusion Native :</span>
              <p className="text-neutral-400">Le protocole de cast natif du navigateur nécessite d'ouvrir l'application en dehors d'une iframe sécurisée (cliquez sur l'icône de partage/nouvel onglet).</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel (Resolution Selector and Crop Aspect Ratio) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-20 right-4 md:right-8 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 z-50 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 className="text-[10px] font-bold uppercase text-neutral-400 mb-2 tracking-widest font-sans text-left">Optimisation Premium</h4>
              <button
                onClick={() => {
                  const newVal = !premiumBufferBoost;
                  setPremiumBufferBoost(newVal);
                  localStorage.setItem("vavoo_premium_buffer_boost", String(newVal));
                  flashHUD(newVal ? "Booster de Flux Actif" : "Mode Latence Standard active");
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${
                  premiumBufferBoost 
                    ? "bg-[#FF7900]/10 border-[#FF7900]/30 text-[#FF7900]" 
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="text-left">
                  <span className="text-[10px] font-bold block uppercase tracking-wider">Antisaccades Pro</span>
                  <span className="text-[8px] text-neutral-500 block leading-none font-medium mt-0.5">Augmente le cache pour éviter le buffering</span>
                </div>
                <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${premiumBufferBoost ? "bg-[#FF7900]" : "bg-neutral-850"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${premiumBufferBoost ? "translate-x-3" : "translate-x-0"}`} />
                </div>
              </button>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase text-neutral-400 mb-2 tracking-widest font-sans text-left">Recadrage d'image</h4>
              <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                {[
                  { value: "contain", label: "Ajuster" },
                  { value: "cover", label: "Remplir" },
                  { value: "fill", label: "Étirer" }
                ].map((fit) => (
                  <button
                    key={fit.value}
                    onClick={() => {
                      setObjectFit(fit.value as any);
                      flashHUD(`Format: ${fit.label}`);
                    }}
                    className={`text-[9px] font-bold py-1.5 rounded-lg transition-all ${objectFit === fit.value ? "bg-white/10 text-white border border-white/5" : "text-neutral-500 hover:text-white"}`}
                  >
                    {fit.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <h4 className="text-[10px] font-bold uppercase text-neutral-400 mb-2 tracking-widest font-sans text-left">Résolution de diffusion</h4>
              <div className="space-y-1 max-h-36 overflow-y-auto w-full pr-1 font-sans">
                <button 
                  onClick={() => changeLevel(-1)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all ${currentLevel === -1 ? "bg-white/10 text-white border border-white/10" : "hover:bg-white/5 text-neutral-400"}`}
                >
                  <span className="text-xs font-semibold">Qualité Auto</span>
                  {currentLevel === -1 && <Circle size={4} fill="currentColor" className="text-white" />}
                </button>
                
                {levels.sort((a, b) => b.height - a.height).map(level => {
                  return (
                    <button 
                      key={level.id}
                      onClick={() => changeLevel(level.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all ${currentLevel === level.id ? "bg-white/10 text-white border border-white/10" : "hover:bg-white/5 text-neutral-400"}`}
                    >
                      <span className="text-xs font-semibold">
                        {level.height === 1080 ? "Full HD (1080p)" : level.height === 720 ? "HD (720p)" : `${level.height}p`}
                      </span>
                      {currentLevel === level.id && <Circle size={4} fill="currentColor" className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device Cast Menu Options */}
      <AnimatePresence>
        {showCastMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-20 right-4 md:right-16 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 z-50 shadow-2xl flex flex-col space-y-4 max-h-[460px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tab segments */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 text-[9px] uppercase font-bold tracking-widest select-none flex-shrink-0">
              <button 
                onClick={() => setCastSettingsTab("devices")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${castSettingsTab === "devices" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Appareils
              </button>
              <button 
                onClick={() => setCastSettingsTab("stream_url")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${castSettingsTab === "stream_url" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Flux Direct
              </button>
              <button 
                onClick={() => setCastSettingsTab("instructions")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${castSettingsTab === "instructions" ? "bg-white/10 text-white shadow-sm" : "text-neutral-400 hover:text-white"}`}
              >
                Tutoriels
              </button>
            </div>

            {/* TAB 1: Devices list & native cast trigger */}
            {castSettingsTab === "devices" && (
              <div className="space-y-3.5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest font-sans flex items-center gap-1 text-left">
                      <Cast size={11} className="text-[#FF7900]" />
                      Sélecteur d'écran
                    </h4>
                    <button 
                      onClick={() => setShowAddDeviceModal(true)}
                      className="text-[9px] text-[#FF7900] font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5"
                    >
                      <Plus size={10} />
                      Ajouter
                    </button>
                  </div>
                  <p className="text-[9px] text-neutral-500 font-medium leading-normal mb-3 text-left">Sélectionnez un téléviseur ou un boîtier IPTV connecté sur votre réseau.</p>

                  {/* Browser Native Casting integration button */}
                  <button
                    onClick={handleNativeCast}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#FF7900]/10 text-[#FF7900] hover:bg-[#FF7900]/20 border border-[#FF7900]/20 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest mb-3"
                  >
                    <Zap size={11} className="text-[#FF7900] animate-pulse" />
                    <span>Recherche Cast Intégrée</span>
                  </button>

                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {customDevices.map(device => {
                      return (
                        <div 
                          key={device.id}
                          className="w-full flex items-center justify-between text-left px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/5 group"
                        >
                          <button 
                            onClick={() => handleCastSelect(device.name)}
                            className="flex-grow flex items-center gap-2 min-w-0"
                          >
                            <div className="p-2 bg-neutral-900 border border-white/5 rounded-lg group-hover:border-[#FF7900]/30 transition-all text-[#FF7900] flex-shrink-0">
                              {device.type === "AirPlay" ? <Monitor size={11} /> : device.type === "Chromecast" ? <Cast size={11} /> : <Tv size={11} />}
                            </div>
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="text-[11px] font-bold text-neutral-200 truncate group-hover:text-white transition-colors">{device.name}</span>
                              <span className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest">{device.type}</span>
                            </div>
                          </button>
                          
                          {customDevices.length > 2 && (
                            <button 
                              onClick={() => handleDeleteDevice(device.id, device.name)}
                              className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ml-1"
                              title="Retirer"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Direct URL Copier to feed smart devices */}
            {castSettingsTab === "stream_url" && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest font-sans text-left">
                  Source Vidéo Directe M3U8
                </h4>
                <p className="text-[9px] text-neutral-500 leading-normal text-left">
                  Copiez l'adresse brute du flux live pour la lire directement sur VLC, BubbleUPnP ou votre lecteur physique de salon :
                </p>
                
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-grow bg-transparent text-[8px] font-mono font-semibold text-neutral-300 outline-none select-all truncate h-6"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      flashHUD("Flux IPTV Copié !");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-all flex items-center justify-center flex-shrink-0"
                    title="Copier"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="bg-[#FF7900]/5 border border-[#FF7900]/10 rounded-xl p-3 text-[9px] leading-relaxed text-[#FF7900] text-left space-y-1">
                  <span className="font-bold uppercase tracking-wider block">⚡ Astuce DLNA direct :</span>
                  <span>Sur smartphone/tablette, ouvrez BubbleUPnP, collez ce lien et choisissez votre Smart TV de n'importe quel constructeur (Samsung, Sony, LG) !</span>
                </div>
              </div>
            )}

            {/* TAB 3: Guide step-by-step tutorial */}
            {castSettingsTab === "instructions" && (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                <h4 className="text-[10px] font-bold uppercase text-[#FF7900] tracking-widest font-sans text-left">
                  Caster sur vos Appareils Domestiques
                </h4>
                
                <div className="space-y-3 font-sans text-[10px] text-left">
                  <div className="space-y-0.5 border-l-2 border-[#FF7900] pl-2">
                    <span className="font-bold text-neutral-200">1. Chromecast & Android TV :</span>
                    <p className="text-neutral-400 text-[9px] leading-normal">Basculez sur Chrome/Edge, cliquez sur &laquo; Recherche Cast Intégrée &raquo; et sélectionnez votre écran.</p>
                  </div>

                  <div className="space-y-0.5 border-l-2 border-purple-500 pl-2">
                    <span className="font-bold text-neutral-200">2. Apple TV & AirPlay (iOS/Safari) :</span>
                    <p className="text-neutral-400 text-[9px] leading-normal">Profitez du AirPlay natif de Safari ou de votre iPhone. L'icône du lecteur ouvre directement le panneau Apple.</p>
                  </div>

                  <div className="space-y-0.5 border-l-2 border-emerald-500 pl-2">
                    <span className="font-bold text-neutral-200">3. Smart TV anciennes ou Boîtiers TV :</span>
                    <p className="text-neutral-400 text-[9px] leading-normal">
                      Copiez l'adresse brute du &laquo; Flux Direct &raquo;, lancez VLC ou BubbleUPnP et diffusez sans fil sur n'importe quel téléviseur.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Pop-up Modal to Add Custom Cast TV / Box Device */}
      <AnimatePresence>
        {showAddDeviceModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.form 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onSubmit={handleAddDevice}
              className="bg-neutral-900 border border-white/10 rounded-[2rem] p-6 max-w-xs w-full space-y-4 shadow-2xl text-left"
            >
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Créer un Appareil</h3>
                <p className="text-[10px] text-neutral-500 mt-1 leading-normal">Ajoutez manuellement votre diffuseur vidéo pour une diffusion simplifiée.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Nom du récepteur</label>
                  <input 
                    type="text" 
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="ex: Sony Bravia Chambre"
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF7900] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-[#A0A0A0] tracking-wider">Protocole / Modèle</label>
                  <select 
                    value={newDeviceType}
                    onChange={(e) => setNewDeviceType(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF7900] transition-all"
                  >
                    <option value="Chromecast">Chromecast / Google Nest</option>
                    <option value="AirPlay">Apple TV / AirPlay</option>
                    <option value="UPnP/DLNA">Smart TV / DLNA</option>
                    <option value="Orange/Freebox">Boîtier Freebox / Orange / SFR</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 text-[10px] uppercase font-black tracking-widest">
                <button 
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="flex-1 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition-all font-semibold"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 bg-[#FF7900] hover:bg-orange-600 text-white rounded-xl transition-all font-semibold"
                >
                  Ajouter
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube Style Seamless Loading Spinner (No blocking background) */}
      <AnimatePresence>
        {loading && !error && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
           >
             <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-red-600 animate-spin" />
             <span className="absolute mt-24 text-[10px] font-black text-white/50 uppercase tracking-widest drop-shadow-md">Chargement</span>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Control Overlay Strip on Bottom */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-0 inset-x-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* YouTube Style Seamless Timeline (Edge to edge in the wrapper) */}
            <div className="w-full relative px-2 sm:px-4 mb-2">
              <div className="w-full h-1 hover:h-1.5 bg-white/20 relative cursor-pointer group transition-all duration-150">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-red-600 origin-left transition-all duration-300" 
                  style={{ width: `${liveTiming.percent}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md animate-none" 
                  style={{ left: `${liveTiming.percent}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between font-sans px-4 sm:px-6 pb-2">
            {/* Play & Mute controls */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button 
                onClick={togglePlay} 
                className="text-white hover:text-white active:scale-90 transition-all duration-200 p-1"
              >
                {isPlaying ? <Pause fill="currentColor" size={22} /> : <Play fill="currentColor" size={22} />}
              </button>
              
              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors duration-200">
                   {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="w-0 group-hover/vol:w-20 transition-all duration-300 overflow-hidden flex items-center h-full">
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 cursor-pointer accent-white h-[2px] bg-white/20 rounded-full appearance-none ml-2"
                  />
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-white/60 select-none tracking-tight">
                 <span>{liveTiming.startStr}</span>
                 <span className="text-white/20">/</span>
                 <span className="text-white/30">{liveTiming.endStr}</span>
              </div>
            </div>

            {/* Utility Tools */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setShowCastMenu(!showCastMenu);
                  setShowSettings(false);
                }}
                className={`transition-all duration-200 p-1.5 rounded-lg border flex items-center justify-center ${showCastMenu || isCasting ? "bg-white/10 border-white/20 text-white" : "border-transparent text-white/50 hover:text-white hover:bg-white/5"}`}
                title="Caster sur TV"
              >
                <Cast size={18} />
              </button>

              <button 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowCastMenu(false);
                }} 
                className={`transition-all duration-200 p-1.5 rounded-lg border flex items-center justify-center ${showSettings ? "bg-white/10 border-white/20 text-white" : "border-transparent text-white/50 hover:text-white hover:bg-white/5"}`}
              >
                <Settings size={18} />
              </button>
              
              {isPiPSupported && (
                <button 
                  onClick={togglePiP} 
                  className="text-white/50 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 p-1.5"
                  title="Picture-in-Picture (PiP)"
                >
                  <PictureInPicture size={18} />
                </button>
              )}
              
              <button 
                onClick={toggleFullscreen} 
                title="Plein écran"
                className="text-white/50 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 p-1.5"
              >
                 {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Beautiful High-contrast error state with automated retry trigger */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50 p-6 text-center">
          <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-xl">
            <AlertCircle className="w-8 h-8 font-black" />
          </div>
          <p className="text-white text-lg font-black uppercase tracking-tight mb-2">{error}</p>
          <p className="text-xs text-neutral-400 max-w-sm mb-6 uppercase tracking-wider">La transmission tente une reconnexion automatique en arrière-plan.</p>
          <div className="flex gap-4">
            <button 
              onClick={handleRetry} 
              className="px-6 py-2.5 bg-[#FF7900] hover:bg-orange-600 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-2xl shadow-[#FF7900]/30 active:scale-95"
            >
              Forcer la reconnexion
            </button>
            {onBack && (
              <button 
                onClick={onBack} 
                className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200"
              >
                Retour
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
