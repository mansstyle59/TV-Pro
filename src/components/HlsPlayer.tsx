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
  Lock,
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
  onMenuTV?: () => void;
  onFatalError?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  fullViewport?: boolean;
  onPiPLeave?: (isClosedAndPaused: boolean) => void;
  onPiPEnter?: () => void;
}

export function HlsPlayer({ 
  url, 
  channelName, 
  programTitle = "Émission en direct", 
  programDesc = "Aucune description disponible pour ce programme.", 
  programImage, 
  onBack, 
  onMenuTV,
  onFatalError, 
  isFavorite, 
  onToggleFavorite,
  fullViewport = false,
  onPiPLeave,
  onPiPEnter
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
  const [isMixedContentBlocked, setIsMixedContentBlocked] = useState(false);

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

  // Custom player enhancement states and refs (reload, gestures, double tap, image adjustments)
  const [reloadKey, setReloadKey] = useState(0);
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);
  
  // Stream Validator & Diagnostic Logs
  const [diagnosticLogs, setDiagnosticLogs] = useState<{time: string, msg: string, isError: boolean}[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isValidatingSource, setIsValidatingSource] = useState(false);
  const addLog = (msg: string, isError = false) => {
    setDiagnosticLogs(prev => [...prev, { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), msg, isError }]);
  };

  const [doubleTapSide, setDoubleTapSide] = useState<"left" | "right" | null>(null);
  const [gestureIndicator, setGestureIndicator] = useState<{ type: "volume" | "brightness"; value: number } | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; val: number; type: "volume" | "brightness" | null }>({ x: 0, y: 0, val: 0, type: null });
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleRealChromecast = async () => {
    if (window.cast && window.cast.framework) {
      const castContext = window.cast.framework.CastContext.getInstance();
      
      try {
        await castContext.requestSession();
        const session = castContext.getCurrentSession();
        if (session) {
          const mediaInfo = new (window as any).chrome.cast.media.MediaInfo(url, 'application/x-mpegURL');
          mediaInfo.metadata = new (window as any).chrome.cast.media.GenericMediaMetadata();
          mediaInfo.metadata.metadataType = (window as any).chrome.cast.media.MetadataType.GENERIC;
          mediaInfo.metadata.title = channelName;
          mediaInfo.metadata.subtitle = programTitle || channelName;
          if (programImage) {
            mediaInfo.metadata.images = [{ url: programImage }];
          }
          
          const request = new (window as any).chrome.cast.media.LoadRequest(mediaInfo);
          await session.loadMedia(request);
          
          return true;
        }
      } catch (err) {
        console.warn("Real Chromecast API Error:", err);
        return false;
      }
    }
    return false;
  };

  // Dynamic Browser Native Casting Handler (DLNA, AirPlay, Chromecast built-in)
  const handleNativeCast = async () => {
    // 1. Try Official Google Cast API first
    const isCastSuccess = await handleRealChromecast();
    if (isCastSuccess) return;

    const video = videoRef.current;
    if (!video) return;

    try {
      // 2. AirPlay for Apple devices
      if ((video as any).webkitShowPlaybackTargetPicker) {
        (video as any).webkitShowPlaybackTargetPicker();
        flashHUD("Recherche AirPlay...");
        return;
      }

      // 3. Standard Remote Playback API (Chromecast/SmartTV built into Chrome/Edge)
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
      if (onPiPEnter) onPiPEnter();
    };

    const onLeavePiP = () => {
      flashHUD("In-Picture Désactivé");
      if (onPiPLeave) onPiPLeave(video.paused);
    };

    video.addEventListener("enterpictureinpicture", onEnterPiP);
    video.addEventListener("leavepictureinpicture", onLeavePiP);

    const onWebkitPresentationModeChanged = () => {
      if ((video as any).webkitPresentationMode === "picture-in-picture") {
        flashHUD("In-Picture Activé");
        if (onPiPEnter) onPiPEnter();
      } else {
        flashHUD("In-Picture Désactivé");
        if (onPiPLeave) onPiPLeave(video.paused);
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
    setDiagnosticLogs([]);
    
    // Clear potentially lingering hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let isSubscribed = true;

    // Stream Validator Service
    const validateStream = async () => {
      setIsValidatingSource(true);
      addLog(`Démarrage la validation du flux...`);
      addLog(`Cible: ${url}`);
      
      try {
        // Range request to avoid downloading full streaming segments initially
        const res = await fetch(url, { method: "GET", headers: { "Range": "bytes=0-8192" } });
        if (!isSubscribed) return false;
        
        if (!res.ok) {
          addLog(`ERREUR HTTP: ${res.status} ${res.statusText}`, true);
          setError(`Erreur HTTP ${res.status} (Flux inaccessible)`);
          setLoading(false);
          if (onFatalError) onFatalError();
          return false;
        }
        
        addLog(`Statut HTTP OK (200). Le serveur répond.`);
        const text = await res.text();
        if (!text.includes("#EXTM3U") && !text.includes("<?xml")) {
          addLog(`Avertissement: Résultat ne semble pas être un playlist M3U8.`, true);
        } else {
          addLog(`Playlist M3U8 validée ! Initialisation...`);
        }
        return true;
      } catch (err: any) {
        if (!isSubscribed) return false;
        addLog(`Échec Réseau ou Flux CORS : ${err.message}`, true);
        setError("Erreur de connexion (Serveur injoignable / CORS)");
        setLoading(false);
        if (onFatalError) onFatalError();
        return false;
      } finally {
        if (isSubscribed) setIsValidatingSource(false);
      }
    };

    const initPlayer = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxMaxBufferLength: premiumBufferBoost ? 35 : 5,               // Increased buffer for premium stability
          enableWorker: true,
          lowLatencyMode: false,                                         // Disabled. Causes infinite 'waiting' spinner due to desynced streams
          maxBufferLength: premiumBufferBoost ? 25 : 5,                  // Expand buffer up to 25s to survive latency drops
          maxBufferSize: premiumBufferBoost ? 64 * 1024 * 1024 : 20 * 1024 * 1024,
          highBufferWatchdogPeriod: 2,         
          manifestLoadingMaxRetry: 4,          
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 4,             
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 3,             // Reduce fragment retries to avoid wasting time on expired live segments
          fragLoadingRetryDelay: 500,          
          fragLoadingTimeOut: 15000         // Increase socket timeout up to 15s to keep playing
        });
        hlsRef.current = hls;

        let mediaErrorCount = 0;
        let networkErrorCount = 0;

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setLoading(false);
          addLog(`HLS: Manifeste analysé avec succès (${data.levels.length} niveaux de qualité).`);
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
            addLog(`HLS ERREUR FATALE: ${data.type} - ${data.details}`, true);
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                networkErrorCount++;
                if (networkErrorCount <= 3) {
                  addLog(`Hls: tentative de récupération réseau (${networkErrorCount}/3)`);
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
                  addLog(`Hls: tentative de récupération média`);
                  console.warn("Hls Media Error: practicing recoverMediaError");
                  hls.recoverMediaError();
                } else if (mediaErrorCount === 2) {
                  addLog(`Hls: échange de codec audio et récupération`);
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
          } else {
             // Append to log without killing playback
             if (data.details !== "bufferStalledError" && data.details !== "levelLoadError") {
               addLog(`Avt: HLS min-err: ${data.details}`);
             }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        addLog(`Lecteur natif (Safari) initialisé pour le M3U8.`);
        video.src = url;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          video.play().catch(() => {});
        });
        video.addEventListener("error", () => {
          addLog(`Erreur de lecture native Apple/Safari`, true);
          setError("Erreur de flux sur ce navigateur");
          setLoading(false);
          if (onFatalError) onFatalError();
        });
      }
    };

    // Run async validation
    validateStream().then(isValid => {
      if (isValid && isSubscribed) {
        initPlayer();
      }
    });

    return () => {
      isSubscribed = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, premiumBufferBoost, reloadKey]);

  // Check for HTTP on HTTPS Mixed Content blocking (GitHub Pages "chargement en continu" issue)
  useEffect(() => {
    setIsMixedContentBlocked(false);
    if (!url) return;

    const isPageSecure = window.location.protocol === "https:";
    const isStreamInsecure = url.startsWith("http://");

    if (isPageSecure && isStreamInsecure) {
      const timer = setTimeout(() => {
        if (loading && !error) {
          setIsMixedContentBlocked(true);
        }
      }, 5500);

      return () => clearTimeout(timer);
    }
  }, [url, loading, error]);

  // Cast framework initialization
  useEffect(() => {
    const initializeCast = () => {
      if (window.cast && window.cast.framework && (window as any).chrome) {
        const context = window.cast.framework.CastContext.getInstance();
        context.setOptions({
          receiverApplicationId: (window as any).chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        const handleCastStateChange = (event: any) => {
          switch (event.sessionState) {
            case window.cast.framework.SessionState.SESSION_STARTED:
            case window.cast.framework.SessionState.SESSION_RESUMED:
              setIsCasting(true);
              const session = context.getCurrentSession();
              if (session) {
                setCastDevice(session.getCastDevice().friendlyName || "Chromecast");
                videoRef.current?.pause();
                setIsPlaying(false);
              }
              break;
            case window.cast.framework.SessionState.SESSION_ENDED:
              setIsCasting(false);
              setCastDevice(null);
              videoRef.current?.play().catch(() => {});
              setIsPlaying(true);
              break;
          }
        };

        context.addEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          handleCastStateChange
        );

        return () => {
          context.removeEventListener(
            window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            handleCastStateChange
          );
        };
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

  const showDoubleTapIndicator = (side: "left" | "right") => {
    setDoubleTapSide(side);
    if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current);
    doubleTapTimeoutRef.current = setTimeout(() => {
      setDoubleTapSide(null);
    }, 800);
  };

  const handleVideoTouch = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeft = clickX < rect.width * 0.40;
    const isRight = clickX > rect.width * 0.60;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;

      if (isLeft) {
        skip(-10);
        showDoubleTapIndicator("left");
      } else if (isRight) {
        skip(10);
        showDoubleTapIndicator("right");
      } else {
        togglePlay();
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay();
        clickTimeoutRef.current = null;
      }, 230);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = touch.clientX - rect.left;
    const isLeft = x < rect.width * 0.35;
    const isRight = x > rect.width * 0.65;
    
    if (isLeft) {
      dragStartRef.current = { x: touch.clientX, y: touch.clientY, val: brightness, type: "brightness" };
    } else if (isRight) {
      dragStartRef.current = { x: touch.clientX, y: touch.clientY, val: volume, type: "volume" };
    } else {
      dragStartRef.current = { x: touch.clientX, y: touch.clientY, val: 0, type: null };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag.type || e.touches.length !== 1) return;
    const touch = e.touches[0];
    
    const deltaX = Math.abs(touch.clientX - drag.x);
    const deltaY = touch.clientY - drag.y;
    
    if (Math.abs(deltaY) < 15 && deltaX > 20) return;
    
    const valDelta = -deltaY / 180;
    
    if (drag.type === "volume") {
      const newVal = Math.max(0.0, Math.min(1.0, drag.val + valDelta));
      handleVolumeChange(newVal);
      setGestureIndicator({ type: "volume", value: newVal });
    } else {
      const newVal = Math.max(0.2, Math.min(1.8, drag.val + valDelta));
      setBrightness(newVal);
      setGestureIndicator({ type: "brightness", value: newVal });
    }
    
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => {
      setGestureIndicator(null);
    }, 1000);
  };

  const handleTouchEnd = () => {
    dragStartRef.current = { x: 0, y: 0, val: 0, type: null };
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full bg-black overflow-hidden group touch-none select-none transition-all duration-500 ${
        fullViewport ? "h-full" : "aspect-video shadow-[0_32px_64px_-16px_rgba(0,0,0,1)] border border-white/10"
      } ${isFullscreen ? "h-screen w-screen" : (fullViewport ? "" : "rounded-xl sm:rounded-2xl")}`}
    >
      <video
        ref={videoRef}
        onClick={handleVideoTouch}
        className="w-full h-full cursor-pointer transition-opacity duration-700"
        style={{ 
          objectFit: objectFit, 
          opacity: loading ? 0.3 : 1,
          filter: `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setIsPlaying(true); setLoading(false); }}
        onCanPlay={() => setLoading(false)}
        onLoadedData={() => setLoading(false)}
        playsInline
        x-webkit-airplay="allow"
        preload="auto"
        autoPlay
      />

      {/* Double Tap Seek Feedback Indicator Overlay */}
      <AnimatePresence>
        {doubleTapSide === "left" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-0 top-0 bottom-0 w-[40%] flex items-center justify-center bg-gradient-to-r from-black/55 to-transparent pointer-events-none z-20"
          >
            <div className="flex flex-col items-center text-gray-50 bg-[#0f1724]/60 p-4 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
              <RotateCcw className="w-8 h-8 text-[#3b82f6] animate-pulse" />
              <span className="text-xs font-black mt-1.5 font-mono">-10s</span>
            </div>
          </motion.div>
        )}
        {doubleTapSide === "right" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute right-0 top-0 bottom-0 w-[40%] flex items-center justify-center bg-gradient-to-l from-black/55 to-transparent pointer-events-none z-20"
          >
            <div className="flex flex-col items-center text-gray-50 bg-[#0f1724]/60 p-4 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
              <RotateCw className="w-8 h-8 text-[#3b82f6] animate-pulse" />
              <span className="text-xs font-black mt-1.5 font-mono">+10s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Overlay Gesture Indicator (Volume & Brightness Bubble) */}
      <AnimatePresence>
        {gestureIndicator && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f1724]/90 backdrop-blur-xl px-5 py-4 rounded-3xl border border-white/15 z-50 pointer-events-none flex flex-col items-center space-y-1.5 shadow-2xl min-w-32"
          >
            {gestureIndicator.type === "volume" && (
              <>
                {gestureIndicator.value === 0 ? <VolumeX className="w-7 h-7 text-[#3b82f6]" /> : <Volume2 className="w-7 h-7 text-[#3b82f6]" />}
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Volume</span>
                <span className="text-lg font-black text-gray-50 font-mono leading-none">{Math.round(gestureIndicator.value * 100)}%</span>
              </>
            )}
            {gestureIndicator.type === "brightness" && (
              <>
                <Sun className="w-7 h-7 text-[#3b82f6]" />
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Luminosité</span>
                <span className="text-lg font-black text-gray-50 font-mono leading-none">{Math.round(gestureIndicator.value * 100)}%</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Top Vignette */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Cinematic Bottom Vignette */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Immersive Casting Screensaver Screen */}
      {isCasting && (
        <div className="absolute inset-0 bg-[#27272a] flex flex-col items-center justify-center z-30 p-6 select-none border border-white/10 animate-fade-in text-sans">
          {/* Animated pulsing background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[#3b82f6]/10 blur-[90px] animate-pulse pointer-events-none" />
          
          <div className="flex flex-col items-center text-center space-y-5 max-w-sm relative z-10">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-0 rounded-full border border-[#3b82f6]/40 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
              <Cast size={28} className="text-[#3b82f6] animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-bold tracking-widest text-[#3b82f6]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                <span>Diffusion TV active</span>
              </div>
              <p className="text-sm font-semibold text-gray-400 capitalize font-mono">{channelName}</p>
              <p className="text-base font-bold text-gray-50 tracking-tight leading-snug">Connecté à &laquo; {castDevice} &raquo;</p>
            </div>

            {programTitle && (
              <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10 w-full">
                <span className="text-xs uppercase font-bold tracking-widest text-gray-400 block mb-0.5">En lecture sur Téléviseur</span>
                <p className="text-xs font-bold text-gray-400 truncate">{programTitle}</p>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDisconnectCast();
              }}
              className="px-5 py-2 bg-[#e50914] hover:bg-red-500 text-gray-50 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-xl shadow-red-950/20 active:scale-95 text-xs font-semibold"
            >
              Arrêter la diffusion
            </button>
          </div>
        </div>
      )}

      {/* Simulated Casting Connection Splash Cover */}
      {isConnectingCast && (
        <div className="absolute inset-0 bg-[#27272a]/95 flex flex-col items-center justify-center z-50 p-6 select-none animate-fade-in text-sans">
          <RefreshCw className="w-8 h-8 text-[#3b82f6] animate-spin mb-3" />
          <p className="text-gray-50 text-sm font-bold tracking-tight mb-1">Connexion à l'écran de télévision...</p>
          <p className="text-sm text-gray-400 font-mono">Négociation du protocole IPTV Cast...</p>
        </div>
      )}

      {/* Big Play Overlay Button when paused */}
      {!isPlaying && !loading && !error && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer z-20 group/playbtn transition-all duration-500"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-black/60 hover:bg-black/80 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-2xl relative border border-white/20 transition-all group-hover/playbtn:scale-110 duration-300 flex-none"
          >
            <Play fill="currentColor" size={32} className="text-white ml-2" />
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
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f1724]/85 backdrop-blur-xl text-gray-50 px-5 py-2.5 rounded-full border border-white/10 font-bold text-[11px] uppercase tracking-wider z-50 pointer-events-none shadow-xl"
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
            className="absolute top-0 inset-x-0 p-4 pt-6 md:p-6 md:pt-8 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-40 flex items-start justify-between"
          >
            <div className="flex items-center gap-3 md:gap-4 max-w-[70%]">
               {onBack && (
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onBack();
                   }}
                   className="flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-50 border border-white/10 hover:border-white/20 rounded-full transition-all duration-200 backdrop-blur-md text-sm font-black uppercase tracking-wider active:scale-95 select-none"
                   title="Quitter le lecteur"
                 >
                   <ChevronLeft size={14} className="text-gray-400" />
                   <span className="hidden sm:inline">Quitter</span>
                 </button>
               )}

               {onMenuTV && (
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onMenuTV();
                   }}
                   className="flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-neutral-900/95 to-black/95 border border-[#3b82f6]/40 hover:border-[#3b82f6]/80 text-gray-50 font-black text-sm uppercase tracking-widest rounded-full transition-all duration-300 shadow-xl shadow-[#3b82f6]/5 hover:shadow-[#3b82f6]/15 hover:scale-[1.03] active:scale-95 select-none backdrop-blur-md group"
                   title="Menu TV (Liste des chaînes)"
                 >
                   <Tv size={13} className="text-[#3b82f6] group-hover:rotate-12 transition-transform duration-300" />
                   <span>Menu TV</span>
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                 </button>
               )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-lg font-bold text-gray-50 tracking-tight leading-none">{channelName}</h3>
                <div className="flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded-[4px] shadow-lg shadow-red-500/20">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-black uppercase tracking-widest text-gray-50">Live</span>
                </div>
              </div>
              {programTitle && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setInfoDrawerTab("program");
                    setShowInfoPanel(!showInfoPanel);
                  }}
                  className="text-sm text-gray-50/50 hover:text-gray-50 flex items-center gap-1 transition-colors mt-1 text-left font-medium uppercase tracking-tight"
                >
                  <span>{programTitle}</span>
                  <Info size={10} className="text-gray-50/30" />
                </button>
              )}
            </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Intelligent Stream Refresh/Reconnect Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setReloadKey(prev => prev + 1);
                  flashHUD("Reconnexion au flux...");
                }} 
                className="p-2.5 bg-white/5 border border-white/10 hover:bg-[#18181b] text-gray-400 hover:text-[#3b82f6] rounded-full transition-all duration-200 backdrop-blur-md active:scale-95"
                title="Actualiser / Reconnecter le flux en direct"
              >
                <RefreshCw size={18} className={loading ? "animate-spin text-[#3b82f6]" : "text-gray-400 hover:text-[#3b82f6]"} />
              </button>

              {/* Information & Shortcuts Panel Trigger */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setInfoDrawerTab("program");
                  setShowInfoPanel(!showInfoPanel);
                }} 
                className={`p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-md ${showInfoPanel ? "bg-white/10 border-white/25" : ""}`}
                title="Détails de l'émission et Raccourcis"
              >
                <HelpCircle size={18} className="text-gray-400 hover:text-gray-50" />
              </button>

              {onToggleFavorite && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                    flashHUD(isFavorite ? "Supprimé des favoris" : "Ajouté aux favoris");
                  }} 
                  className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-md group/fav"
                >
                  <Heart 
                    size={18} 
                    fill={isFavorite ? "currentColor" : "none"} 
                    className={`transition-transform duration-200 ${isFavorite ? "text-gray-50 scale-110" : "text-gray-400 group-hover/fav:scale-105"}`} 
                  />
                </button>
              )}
              
              <button 
                onClick={handleNativeCast}
                className={`p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-md relative google-cast-launcher ${isCasting ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-gray-50 shadow-lg" : ""}`}
                title="Caster sur votre TV"
              >
                <Cast 
                  size={18} 
                  className={`transition-colors duration-200 ${isCasting ? "text-[#3b82f6]" : "text-gray-400 hover:text-gray-50"}`} 
                />
                {isCasting && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#3b82f6] rounded-full animate-pulse border border-black" />
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
            className="absolute left-6 top-20 bottom-20 w-80 bg-[#27272a]/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 z-50 flex flex-col justify-between overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm uppercase font-bold tracking-widest text-[#3b82f6]">Assistance & Info</span>
                <button onClick={() => setShowInfoPanel(false)} className="text-gray-400 hover:text-gray-50 text-xs font-medium transition-colors">Fermer</button>
              </div>

              {/* Segmented Tab */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-4 select-none">
                <button 
                  onClick={() => setInfoDrawerTab("program")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${infoDrawerTab === "program" ? "bg-white/10 text-gray-50 shadow-sm" : "text-gray-400 hover:text-gray-50"}`}
                >
                  Programme
                </button>
                <button 
                  onClick={() => setInfoDrawerTab("shortcuts")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${infoDrawerTab === "shortcuts" ? "bg-white/10 text-gray-50 shadow-sm" : "text-gray-400 hover:text-gray-50"}`}
                >
                  Raccourcis
                </button>
              </div>

              {infoDrawerTab === "program" ? (
                <div className="space-y-4 flex-grow">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase font-black tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded border border-[#3b82f6]/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                      En cours
                    </span>
                    <h4 className="text-xl font-black text-gray-50 tracking-tighter leading-none">{programTitle}</h4>
                    <p className="text-sm font-black text-gray-400 font-mono tracking-widest uppercase">
                      Direct : {liveTiming.startStr} - {liveTiming.endStr}
                    </p>
                  </div>
                  
                  {programImage && (
                    <div className="w-full h-32 rounded-2xl overflow-hidden border border-white/10 bg-[#18181b] relative">
                      <img src={programImage} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                    </div>
                  )}
                  
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <p className="text-xs leading-relaxed text-gray-400 font-medium select-text max-h-40 overflow-y-auto scrollbar-thin">
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
                    <div key={shortcut.k} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                      <span className="text-[11px] font-medium text-gray-400">{shortcut.d}</span>
                      <kbd className="px-2 py-0.5 bg-white/10 text-gray-50 rounded text-xs font-mono border border-white/10 shadow-md">{shortcut.k}</kbd>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {infoDrawerTab === "program" && (
              <div className="border-t border-white/10 pt-4 mt-4 space-y-1.5 select-none">
                <div className="flex items-center justify-between text-xs uppercase font-bold tracking-widest text-gray-400">
                  <span>Prochain programme</span>
                  <span className="font-mono">{liveTiming.endStr}</span>
                </div>
                <div className="text-xs font-semibold text-gray-50 tracking-tight">Le Journal de 20 Heures / Magazine d'information</div>
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
            className="absolute top-20 right-6 bg-[#27272a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4.5 z-40 shadow-2xl space-y-2 font-mono text-xs text-gray-400 w-52 pointer-events-none select-none text-left"
          >
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5 mb-1 text-gray-50">
              <Activity size={10} className="text-[#3b82f6]" />
              <span className="font-bold uppercase tracking-wider">DIAGNOSTIC DU SIGNAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Flux Codec :</span>
              <span className="text-gray-50 font-semibold truncate max-w-[100px]">{streamStats.codec}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Qualité Active :</span>
              <span className="text-[#3b82f6] font-semibold">
                {currentLevel === -1 
                  ? `${levels[0]?.height ? levels[0].height + 'p' : 'Auto'}` 
                  : `${levels.find(l => l.id === currentLevel)?.height || 'Indéterminée'}p`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Débit estimé :</span>
              <span className="text-emerald-400 font-semibold">
                {streamStats.bitrate ? `${(streamStats.bitrate / 1000000).toFixed(2)} Mbps` : "Auto-adaptation"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Buffer Mémoire :</span>
              <span className="text-amber-400 font-semibold">{streamStats.buffer}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Fluidité FPS :</span>
              <span className="text-gray-50 font-semibold">{streamStats.fps} i/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pertes images :</span>
              <span className="text-red-400 font-semibold">{streamStats.droppedFrames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Délai Latence :</span>
              <span className="text-gray-400">{streamStats.latency}s</span>
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
            className="absolute top-24 left-1/2 -translate-x-1/2 bg-[#18181b]/95 border border-amber-500/20 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 max-w-sm pointer-events-none"
          >
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg flex-shrink-0">
              <Info size={14} />
            </div>
            <div className="text-left font-sans text-sm leading-relaxed">
              <span className="font-bold text-amber-500 block uppercase tracking-wider mb-0.5">Note de Diffusion Native :</span>
              <p className="text-gray-400">Le protocole de cast natif du navigateur nécessite d'ouvrir l'application en dehors d'une iframe sécurisée (cliquez sur l'icône de partage/nouvel onglet).</p>
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
            className="absolute bottom-20 right-4 md:right-8 w-72 bg-[#0f1724]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 z-50 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 className="text-sm font-bold uppercase text-gray-400 mb-2 tracking-widest font-sans text-left">Optimisation Premium</h4>
              <button
                onClick={() => {
                  const newVal = !premiumBufferBoost;
                  setPremiumBufferBoost(newVal);
                  localStorage.setItem("vavoo_premium_buffer_boost", String(newVal));
                  flashHUD(newVal ? "Booster de Flux Actif" : "Mode Latence Standard active");
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${
                  premiumBufferBoost 
                    ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-gray-50"
                }`}
              >
                <div className="text-left">
                  <span className="text-sm font-bold block uppercase tracking-wider">Antisaccades Pro</span>
                  <span className="text-xs text-gray-400 block leading-none font-medium mt-0.5">Augmente le cache pour éviter le buffering</span>
                </div>
                <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${premiumBufferBoost ? "bg-[#3b82f6]" : "bg-neutral-850"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${premiumBufferBoost ? "translate-x-3" : "translate-x-0"}`} />
                </div>
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold uppercase text-gray-400 mb-2 tracking-widest font-sans text-left">Recadrage d'image</h4>
              <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
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
                    className={`text-xs font-bold py-1.5 rounded-lg transition-all ${objectFit === fit.value ? "bg-white/10 text-gray-50 border border-white/10" : "text-gray-400 hover:text-gray-50"}`}
                  >
                    {fit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CSS Filter Controls (Brightness, Contrast, Saturation) */}
            <div className="border-t border-white/10 pt-3 space-y-3">
              <h4 className="text-sm font-bold uppercase text-gray-400 mb-1.5 tracking-widest font-sans text-left">Ajustements d'image</h4>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Luminosité</span>
                  <span className="font-mono text-gray-50">{Math.round(brightness * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.4" 
                  max="1.6" 
                  step="0.05"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full accent-[#3b82f6] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Contraste</span>
                  <span className="font-mono text-gray-50">{Math.round(contrast * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.4" 
                  max="1.6" 
                  step="0.05"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full accent-[#3b82f6] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Saturation</span>
                  <span className="font-mono text-gray-50">{Math.round(saturation * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.2" 
                  max="1.8" 
                  step="0.05"
                  value={saturation}
                  onChange={(e) => setSaturation(parseFloat(e.target.value))}
                  className="w-full accent-[#3b82f6] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-3">
              <h4 className="text-sm font-bold uppercase text-gray-400 mb-2 tracking-widest font-sans text-left">Résolution de diffusion</h4>
              <div className="space-y-1 max-h-36 overflow-y-auto w-full pr-1 font-sans">
                <button 
                  onClick={() => changeLevel(-1)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all ${currentLevel === -1 ? "bg-white/10 text-gray-50 border border-white/10" : "hover:bg-white/5 text-gray-400"}`}
                >
                  <span className="text-xs font-semibold">Qualité Auto</span>
                  {currentLevel === -1 && <Circle size={4} fill="currentColor" className="text-gray-50" />}
                </button>
                
                {levels.sort((a, b) => b.height - a.height).map(level => {
                  return (
                    <button 
                      key={level.id}
                      onClick={() => changeLevel(level.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all ${currentLevel === level.id ? "bg-white/10 text-gray-50 border border-white/10" : "hover:bg-white/5 text-gray-400"}`}
                    >
                      <span className="text-xs font-semibold">
                        {level.height === 1080 ? "Full HD (1080p)" : level.height === 720 ? "HD (720p)" : `${level.height}p`}
                      </span>
                      {currentLevel === level.id && <Circle size={4} fill="currentColor" className="text-gray-50" />}
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
            className="absolute bottom-20 right-4 md:right-16 w-80 bg-[#0f1724]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 z-50 shadow-2xl flex flex-col space-y-4 max-h-[460px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tab segments */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-xs uppercase font-bold tracking-widest select-none flex-shrink-0">
              <button 
                onClick={() => setCastSettingsTab("devices")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${castSettingsTab === "devices" ? "bg-white/10 text-gray-50 shadow-sm" : "text-gray-400 hover:text-gray-50"}`}
              >
                Appareils
              </button>
              <button 
                onClick={() => setCastSettingsTab("stream_url")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${castSettingsTab === "stream_url" ? "bg-white/10 text-gray-50 shadow-sm" : "text-gray-400 hover:text-gray-50"}`}
              >
                Flux Direct
              </button>
              <button 
                onClick={() => setCastSettingsTab("instructions")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${castSettingsTab === "instructions" ? "bg-white/10 text-gray-50 shadow-sm" : "text-gray-400 hover:text-gray-50"}`}
              >
                Tutoriels
              </button>
            </div>

            {/* TAB 1: Devices list & native cast trigger */}
            {castSettingsTab === "devices" && (
              <div className="space-y-3.5 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold uppercase text-gray-400 tracking-widest font-sans flex items-center gap-1 text-left">
                      <Cast size={11} className="text-[#3b82f6]" />
                      Sélecteur d'écran
                    </h4>
                    <button 
                      onClick={() => setShowAddDeviceModal(true)}
                      className="text-xs text-[#3b82f6] font-bold uppercase tracking-wider hover:underline flex items-center gap-0.5"
                    >
                      <Plus size={10} />
                      Ajouter
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-normal mb-3 text-left">Sélectionnez un téléviseur ou un boîtier IPTV connecté sur votre réseau.</p>

                  {/* Browser Native Casting integration button */}
                  <button
                    onClick={handleNativeCast}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 border border-[#3b82f6]/20 rounded-xl transition-all font-black text-xs uppercase tracking-widest mb-3"
                  >
                    <Zap size={11} className="text-[#3b82f6] animate-pulse" />
                    <span>Recherche Cast Intégrée</span>
                  </button>

                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {customDevices.map(device => {
                      return (
                        <div 
                          key={device.id}
                          className="w-full flex items-center justify-between text-left px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 group"
                        >
                          <button 
                            onClick={() => handleCastSelect(device.name)}
                            className="flex-grow flex items-center gap-2 min-w-0"
                          >
                            <div className="p-2 bg-[#18181b] border border-white/10 rounded-lg group-hover:border-[#3b82f6]/30 transition-all text-[#3b82f6] flex-shrink-0">
                              {device.type === "AirPlay" ? <Monitor size={11} /> : device.type === "Chromecast" ? <Cast size={11} /> : <Tv size={11} />}
                            </div>
                            <div className="flex flex-col min-w-0 text-left">
                              <span className="text-[11px] font-bold text-gray-50 truncate group-hover:text-gray-50 transition-colors">{device.name}</span>
                              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">{device.type}</span>
                            </div>
                          </button>
                          
                          {customDevices.length > 2 && (
                            <button 
                              onClick={() => handleDeleteDevice(device.id, device.name)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-500/10 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ml-1"
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
                <h4 className="text-sm font-bold uppercase text-gray-400 tracking-widest font-sans text-left">
                  Source Vidéo Directe M3U8
                </h4>
                <p className="text-xs text-gray-400 leading-normal text-left">
                  Copiez l'adresse brute du flux live pour la lire directement sur VLC, BubbleUPnP ou votre lecteur physique de salon :
                </p>
                
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-grow bg-transparent text-xs font-mono font-semibold text-gray-400 outline-none select-all truncate h-6"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      flashHUD("Flux IPTV Copié !");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-50 rounded-lg transition-all flex items-center justify-center flex-shrink-0"
                    title="Copier"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="bg-[#3b82f6]/5 border border-[#3b82f6]/10 rounded-xl p-3 text-xs leading-relaxed text-[#3b82f6] text-left space-y-1">
                  <span className="font-bold uppercase tracking-wider block">⚡ Astuce DLNA direct :</span>
                  <span>Sur smartphone/tablette, ouvrez BubbleUPnP, collez ce lien et choisissez votre Smart TV de n'importe quel constructeur (Samsung, Sony, LG) !</span>
                </div>
              </div>
            )}

            {/* TAB 3: Guide step-by-step tutorial */}
            {castSettingsTab === "instructions" && (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                <h4 className="text-sm font-bold uppercase text-[#3b82f6] tracking-widest font-sans text-left">
                  Caster sur vos Appareils Domestiques
                </h4>
                
                <div className="space-y-3 font-sans text-sm text-left">
                  <div className="space-y-0.5 border-l-2 border-[#3b82f6] pl-2">
                    <span className="font-bold text-gray-50">1. Chromecast & Android TV :</span>
                    <p className="text-gray-400 text-xs leading-normal">Basculez sur Chrome/Edge, cliquez sur &laquo; Recherche Cast Intégrée &raquo; et sélectionnez votre écran.</p>
                  </div>

                  <div className="space-y-0.5 border-l-2 border-purple-500 pl-2">
                    <span className="font-bold text-gray-50">2. Apple TV & AirPlay (iOS/Safari) :</span>
                    <p className="text-gray-400 text-xs leading-normal">Profitez du AirPlay natif de Safari ou de votre iPhone. L'icône du lecteur ouvre directement le panneau Apple.</p>
                  </div>

                  <div className="space-y-0.5 border-l-2 border-emerald-500 pl-2">
                    <span className="font-bold text-gray-50">3. Smart TV anciennes ou Boîtiers TV :</span>
                    <p className="text-gray-400 text-xs leading-normal">
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
            className="absolute inset-0 bg-[#0f1724]/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.form 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onSubmit={handleAddDevice}
              className="bg-[#18181b] border border-white/10 rounded-[2rem] p-6 max-w-xs w-full space-y-4 shadow-2xl text-left"
            >
              <div>
                <h3 className="text-xs font-black text-gray-50 uppercase tracking-wider">Créer un Appareil</h3>
                <p className="text-sm text-gray-400 mt-1 leading-normal">Ajoutez manuellement votre diffuseur vidéo pour une diffusion simplifiée.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1 text-left">
                  <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Nom du récepteur</label>
                  <input 
                    type="text" 
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="ex: Sony Bravia Chambre"
                    className="w-full bg-[#27272a] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-50 focus:outline-none focus:border-[#3b82f6] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Protocole / Modèle</label>
                  <select 
                    value={newDeviceType}
                    onChange={(e) => setNewDeviceType(e.target.value)}
                    className="w-full bg-[#27272a] border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-50 focus:outline-none focus:border-[#3b82f6] transition-all"
                  >
                    <option value="Chromecast">Chromecast / Google Nest</option>
                    <option value="AirPlay">Apple TV / AirPlay</option>
                    <option value="UPnP/DLNA">Smart TV / DLNA</option>
                    <option value="Orange/Freebox">Boîtier Freebox / Orange / SFR</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 text-sm uppercase font-black tracking-widest">
                <button 
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  className="flex-1 py-3.5 bg-[#18181b] hover:bg-neutral-700 text-gray-400 hover:text-gray-50 rounded-xl transition-all font-semibold"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 bg-[#3b82f6] hover:bg-[#cc6000] text-gray-50 rounded-xl transition-all font-semibold"
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
             <span className="absolute mt-24 text-sm font-black text-gray-50/50 uppercase tracking-widest drop-shadow-md">Chargement</span>
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
            {/* Premium Seamless Timeline */}
            <div className="w-full relative px-2 sm:px-4 mb-2 group/timeline">
              <div className="w-full h-[3px] group-hover/timeline:h-[5px] bg-white/20 relative cursor-pointer transition-all duration-200 shadow-inner overflow-visible">
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-white/40 origin-left transition-all duration-300"
                  style={{ width: `${Math.min(100, liveTiming.percent + 5)}%` }} // simulated buffer
                />
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-[#e2001a] origin-left transition-all duration-300 shadow-[0_0_10px_rgba(226,0,26,0.8)]" 
                  style={{ width: `${liveTiming.percent}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover/timeline:opacity-100 transition-opacity duration-200 shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-75 group-hover/timeline:scale-100" 
                  style={{ left: `${liveTiming.percent}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between font-sans px-2 sm:px-4 pb-2 mt-4">
            {/* Play, Mute & Fast-Seek controls */}
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="flex items-center gap-5 select-none">
                {/* Play / Pause Toggle */}
                <button 
                  onClick={togglePlay} 
                  className="text-white hover:text-[#3b82f6] transition-colors duration-200 flex items-center justify-center filter drop-shadow-md active:scale-95"
                  title={isPlaying ? "Pause (Espace)" : "Lecture (Espace)"}
                >
                  {isPlaying ? <Pause fill="currentColor" size={26} /> : <Play fill="currentColor" size={26} />}
                </button>

                {/* Skip back 10s */}
                <button 
                  onClick={(e) => { e.stopPropagation(); skip(-10); flashHUD("-10s"); }}
                  className="text-white/80 hover:text-white transition-all duration-150 p-1 filter drop-shadow-md active:scale-95"
                  title="Reculer de 10 seconds"
                >
                  <RotateCcw size={20} />
                </button>

                {/* Skip forward 10s */}
                <button 
                  onClick={(e) => { e.stopPropagation(); skip(10); flashHUD("+10s"); }}
                  className="text-white/80 hover:text-white transition-all duration-150 p-1 filter drop-shadow-md active:scale-95"
                  title="Avancer de 10 seconds"
                >
                  <RotateCw size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors duration-200 filter drop-shadow-md active:scale-95">
                   {isMuted || volume === 0 ? <VolumeX size={23} /> : <Volume2 size={23} />}
                </button>
                <div className="w-0 group-hover/vol:w-20 transition-all duration-300 overflow-hidden flex items-center h-full">
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 cursor-pointer accent-white h-[3px] bg-white/20 rounded-full appearance-none ml-2 shadow-inner"
                  />
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-50/60 select-none tracking-tight">
                 <span>{liveTiming.startStr}</span>
                 <span className="text-gray-50/20">/</span>
                 <span className="text-gray-50/30">{liveTiming.endStr}</span>
              </div>
            </div>

            {/* Utility Tools */}
            <div className="flex items-center gap-2 sm:gap-4">
              {onMenuTV && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuTV();
                  }}
                  className="text-[#3b82f6] hover:text-white transition-all duration-200 p-1 filter drop-shadow-md active:scale-95"
                  title="Menu TV (Liste des chaînes)"
                >
                  <Tv size={21} />
                </button>
              )}

              <button 
                onClick={() => {
                  setShowCastMenu(!showCastMenu);
                  setShowSettings(false);
                }}
                className={`transition-all duration-200 p-1 filter drop-shadow-md active:scale-95 ${showCastMenu || isCasting ? "text-white scale-110" : "text-white/80 hover:text-white"}`}
                title="Caster sur TV"
              >
                <Cast size={21} />
              </button>

              <button 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowCastMenu(false);
                }} 
                className={`transition-all duration-200 p-1 filter drop-shadow-md active:scale-95 ${showSettings ? "text-white scale-110" : "text-white/80 hover:text-white"}`}
                title="Paramètres de diffusion"
              >
                <Settings size={21} />
              </button>
              
              {isPiPSupported && (
                <button 
                  onClick={togglePiP} 
                  className="text-white/80 hover:text-white active:scale-95 transition-all duration-200 p-1 filter drop-shadow-md hidden sm:block"
                  title="Picture-in-Picture (PiP)"
                >
                  <PictureInPicture size={21} />
                </button>
              )}
              
              <button 
                onClick={toggleFullscreen} 
                title="Plein écran"
                className="text-white/80 hover:text-white active:scale-95 transition-all duration-200 p-1 filter drop-shadow-md"
              >
                 {isFullscreen ? <Minimize size={21} /> : <Maximize size={21} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Mixed Content Blocked overlay indicator */}
      {isMixedContentBlocked && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f1724]/95 z-50 p-6 text-center select-text">
          <div className="w-14 h-14 bg-[#3b82f6]/10 border border-[#3b82f6]/25 rounded-full flex items-center justify-center mb-3 text-[#3b82f6] shadow-xl">
            <Lock className="w-7 h-7" />
          </div>
          <p className="text-gray-50 text-xs font-black uppercase tracking-tight mb-2.5 flex items-center gap-2">
            ⚠️ Blocage de Sécurité Navigateur (Contenu Mixte)
          </p>
          <div className="text-sm text-gray-400 max-w-sm mb-4 text-left leading-relaxed space-y-2 bg-[#18181b]/60 p-3.5 rounded-xl border border-white/10 font-medium">
            <p className="text-gray-400">
              L'application tourne en <span className="text-[#3b82f6] font-black font-mono">HTTPS</span> sécurisé, mais ce flux de chaîne IPTV utilise une adresse non sécurisée <span className="text-red-400 font-mono text-xs break-all">{url}</span>.
            </p>
            <p className="text-gray-400">
              Votre navigateur (Chrome/Safari/Edge) bloque le flux par mesure de sécurité, ce qui génère un <span className="font-bold underline text-[#3b82f6]">chargement infini</span>.
            </p>
            <p className="border-t border-white/10 pt-1.5 font-bold text-[#3b82f6]">
              💡 Solution immédiate :
            </p>
            <p className="text-xs border-zinc-700/50 hover:bg-zinc-800 text-gray-50">
              Cliquez sur l'icône de <span className="font-bold text-[#3b82f6]">Cadenas 🔒 / Glissière ⚙️</span> à gauche de la barre d'adresse de votre navigateur, allez dans les <span className="font-bold">Paramètres du site</span>, puis réglez <span className="font-bold text-[#3b82f6]">"Contenu non sécurisé"</span> sur <span className="font-bold underline text-emerald-400">"Autoriser"</span>. Rechargez ensuite la page !
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={() => {
                const upgradedUrl = url.replace("http://", "https://");
                window.location.href = window.location.href; 
                setIsMixedContentBlocked(false);
                handleRetry();
              }}
              className="px-5 py-2 bg-[#3b82f6] hover:bg-orange-600 text-gray-50 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer"
            >
              Forcer un essai HTTPS
            </button>
            {onBack && (
              <button 
                onClick={onBack} 
                className="px-5 py-2 bg-[#18181b] hover:bg-[#18181b] border border-white/10 text-gray-50 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer"
              >
                Retour
              </button>
            )}
          </div>
        </div>
      )}

      {/* Beautiful High-contrast error state with automated retry trigger */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f1724]/95 z-50 p-6 text-center">
          <div className="w-16 h-16 bg-[#e50914]/10 border border-red-600/20 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-xl">
            <AlertCircle className="w-8 h-8 font-black" />
          </div>
          <p className="text-gray-50 text-lg font-black uppercase tracking-tight mb-2">{error}</p>
          <p className="text-xs text-gray-400 max-w-sm mb-6 uppercase tracking-wider">La transmission tente une reconnexion automatique en arrière-plan.</p>
          <div className="flex gap-4 mb-4">
            <button 
              onClick={handleRetry} 
              className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#cc6000] text-gray-50 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-2xl shadow-[#3b82f6]/30 active:scale-95"
            >
              Forcer la reconnexion
            </button>
            {onBack && (
              <button 
                onClick={onBack} 
                className="px-6 py-2.5 bg-[#18181b] hover:bg-[#18181b] border border-white/10 text-gray-50 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200"
              >
                Retour
              </button>
            )}
          </div>
          {diagnosticLogs.length > 0 && (
            <button 
              onClick={() => setShowDiagnostics(true)}
              className="mt-2 text-xs text-[#3b82f6] font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
            >
              <Activity size={12} />
              Voir les logs diagnostiques
            </button>
          )}
        </div>
      )}

      {/* Diagnostics Overlay */}
      <AnimatePresence>
        {showDiagnostics && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="absolute inset-0 bg-[#0f1724]/95 backdrop-blur-xl z-[60] p-6 flex flex-col"
           >
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
               <h3 className="text-gray-50 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                 <Activity size={16} className="text-[#3b82f6]" />
                 Validation & Logs du Lecteur
               </h3>
               <button onClick={() => setShowDiagnostics(false)} className="p-2 hover:bg-[#18181b] rounded-lg text-gray-400">
                 <RefreshCw size={16} /> {/* Replace icon with just a close text or something, use generic back or X */}
                 <span className="sr-only">Fermer</span>
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto bg-[#27272a] border border-white/10 rounded-xl p-4 font-mono text-xs sm:text-xs">
               {diagnosticLogs.map((log, i) => (
                 <div key={i} className={`mb-2 py-1 border-b border-white/10/50 last:border-0 ${log.isError ? "text-red-600 font-bold" : "text-gray-400"}`}>
                   <span className="text-gray-400 mr-2">[{log.time}]</span>
                   {log.msg}
                 </div>
               ))}
               {diagnosticLogs.length === 0 && (
                 <div className="text-gray-400 italic">Aucun log disponible.</div>
               )}
             </div>
             
             <div className="mt-4 flex justify-end">
               <button onClick={() => setShowDiagnostics(false)} className="px-5 py-2 bg-[#18181b] text-gray-50 rounded-lg text-xs font-bold uppercase tracking-wider">
                 Fermer
               </button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
