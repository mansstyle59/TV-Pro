import { useState } from "react";
import { motion } from "motion/react";
import { Copy, Download, Plug, ExternalLink, PlaySquare, MonitorPlay, Tv, Rocket, Check, RefreshCw } from "lucide-react";
import { getAppBaseUrl, getApiUrl } from "../utils/urlHelper";

export function Integrations() {
  const [copiedApp, setCopiedApp] = useState<string | null>(null);
  const host = getAppBaseUrl();

  const [shortXtreamUrl, setShortXtreamUrl] = useState<string>("");
  const [shorteningXtream, setShorteningXtream] = useState<boolean>(false);

  const [shortM3uUrl, setShortM3uUrl] = useState<string>("");
  const [shorteningM3u, setShorteningM3u] = useState<boolean>(false);

  const [shortXmltvUrl, setShortXmltvUrl] = useState<string>("");
  const [shorteningXmltv, setShorteningXmltv] = useState<boolean>(false);

  const generateShortUrl = async (url: string, setShortUrl: (u: string) => void, setLoading: (l: boolean) => void) => {
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl(`/api/shorten?url=${encodeURIComponent(url)}`));
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.shortUrl) {
          setShortUrl(data.shortUrl);
        }
      }
    } catch (err) {
      console.error("Failed to shorten URL:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, appName: string) => {
    let success = false;
    
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (err) {
        console.warn("navigator.clipboard failed, trying fallback...", err);
      }
    }
    
    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback copy failed", err);
      }
    }

    if (success) {
      setCopiedApp(appName);
      setTimeout(() => {
        setCopiedApp(null);
      }, 2000);
    }
  };

  const mhubUrl = `${host}/mhub`;
  const m3uLink = `${host}/api/playlist.m3u`;
  const sportsM3uLink = `${host}/api/sports.m3u`;
  const xmltvLink = `${host}/api/xmltv.xml`;
  const vlcLink = `vlc://${m3uLink}`;

  const apps = [
    {
      name: "Lokke (MHub)",
      icon: Tv,
      color: "text-[#FF7900]",
      bg: "bg-[#FF7900]/10",
      borderHover: "group-hover:border-[#FF7900]/30",
      desc: "Installez l'application en collant cette URL courte directement dans le navigateur intégré de Lokke.",
      actionText: "Copier le Lien",
      actionLink: "#",
      actionIcon: Copy,
      copyText: mhubUrl,
      isCopyOnly: true
    },
    {
      name: "Jellyfin",
      icon: MonitorPlay,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      borderHover: "group-hover:border-rose-500/30",
      desc: "Ajoutez la playlist M3U en tant que tuner TV en direct (Tuner M3U) et le lien XMLTV comme source EPG (Guide XMLTV).",
      actionText: "Copier le M3U",
      actionLink: "#",
      actionIcon: Copy,
      copyText: m3uLink,
      isCopyOnly: true,
      extraCopyText: xmltvLink,
      extraCopyKey: "jellyfin_extra"
    },
    {
      name: "VLC Media Player",
      icon: PlaySquare,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      borderHover: "group-hover:border-orange-500/30",
      desc: "Ouvrez le flux réseau ou téléchargez la liste m3u pour VLC.",
      actionText: "Ouvrir dans VLC",
      actionLink: vlcLink,
      actionIcon: ExternalLink,
      copyText: m3uLink
    },
    {
      name: "Kodi",
      icon: MonitorPlay,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      borderHover: "group-hover:border-blue-500/30",
      desc: "Utilisez PVR IPTV Simple Client. Configurez la playlist M3U et l'adresse XMLTV pour charger le guide des programmes.",
      actionText: "Télécharger M3U",
      actionLink: m3uLink,
      actionIcon: Download,
      copyText: m3uLink,
      download: true,
      extraCopyText: xmltvLink,
      extraCopyKey: "kodi_extra"
    },
    {
      name: "TiviMate / IPTV Smarters",
      icon: Tv,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      borderHover: "group-hover:border-emerald-500/30",
      desc: "Idéal pour Smart TV. Remplissez le lien du fichier M3U et l'URL de l'EPG (XMLTV) pour une intégration complète.",
      actionText: "Copier le Lien",
      actionLink: "#",
      actionIcon: Copy,
      copyText: m3uLink,
      isCopyOnly: true,
      extraCopyText: xmltvLink,
      extraCopyKey: "iptv_extra"
    },
    {
      name: "API Xtream Codes",
      icon: Plug,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      borderHover: "group-hover:border-amber-500/30",
      desc: "Idéal pour les applications modernes d'IPTV (Smarters, TiviMate, XCIPTV). Renseignez l'hôte et connectez-vous avec vos identifiants.",
      actionText: "Copier l'Hôte",
      actionLink: "#",
      actionIcon: Copy,
      copyText: host,
      isCopyOnly: true,
      isXtream: true
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="mb-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
          Installation <span className="text-[#FF7900]">Rapide</span>
        </h2>
        <p className="text-sm font-medium text-[#A0A0A0]">
          Exportez et intégrez vos chaînes en un clic sur vos logiciels préférés.
        </p>
      </header>

      {/* Hero M3U Category Downloader */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#151d2a] to-[#090e17] border border-[#FF7900]/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#FF7900]/5 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF7900]/20 to-[#FF7900]/10 border border-[#FF7900]/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7900] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7900]">Triée par Catégories & Logos Inclus</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
            Lien Rapide de Téléchargement M3U
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-semibold font-sans">
            Téléchargez instantanément votre playlist <code className="text-[#FF7900] font-mono bg-black/60 px-1 py-0.5 rounded border border-white/5 font-semibold text-xs">playlist.m3u</code> contenant l'ensemble de vos chaînes <strong className="text-white">classées par catégories</strong>, avec <strong className="text-white">tous les logos</strong> configurés et rattachés pour vos lecteurs IPTV (VLC, Kodi, TiviMate, etc.).
          </p>
        </div>
        <div className="z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <a
            href={m3uLink}
            download="playlist.m3u"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#FF7900] to-[#cc6000] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#FF7900]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download size={18} strokeWidth={3} />
            Télécharger (.m3u)
          </a>
          <button
            onClick={() => copyToClipboard(m3uLink, "direct_m3u_top")}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white rounded-xl text-xs font-black uppercase tracking-wider border border-white/5 transition-all cursor-pointer"
          >
            {copiedApp === "direct_m3u_top" ? (
              <>
                <Check size={18} className="text-emerald-400" />
                Copié !
              </>
            ) : (
              <>
                <Copy size={18} />
                Copier l'URL
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sports Special Category Downloader */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121E16] to-[#0D120E] border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Spécial Chaînes de Sports</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
            Playlist M3U Spéciale Sports
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-semibold">
            Générez une playlist <code className="text-emerald-400 font-mono bg-black/60 px-1 py-0.5 rounded border border-white/5 font-semibold text-xs">sports.m3u</code> contenant uniquement les chaînes de sport et d'événements (beIN Sports, Eurosport, RMC Sport, Canal+ Sport, L'Équipe, Automoto, etc.). Idéale pour les décodeurs, Smart TV et lecteurs IPTV externes !
          </p>
        </div>
        <div className="z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <a
            href={sportsM3uLink}
            download="sports.m3u"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download size={18} strokeWidth={3} />
            Télécharger (.m3u)
          </a>
          <button
            onClick={() => copyToClipboard(sportsM3uLink, "sports_m3u_top")}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#142319] hover:bg-[#1a3224] text-white rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/15 transition-all cursor-pointer"
          >
            {copiedApp === "sports_m3u_top" ? (
              <>
                <Check size={18} className="text-emerald-400" />
                Copié !
              </>
            ) : (
              <>
                <Copy size={18} />
                Copier l'URL
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apps.map((app, idx) => (
          <motion.div 
            key={idx}
            className="bg-[#151515] rounded-xl p-6 border border-white/5 relative overflow-hidden group flex flex-col justify-between"
            whileHover={{ y: -5 }}
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 ${app.bg} ${app.color} rounded-xl flex items-center justify-center`}>
                  <app.icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">{app.name}</h3>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-6 font-medium leading-relaxed min-h-[40px]">
                {app.desc}
              </p>
            </div>

            {app.isXtream ? (
              <div className="space-y-4 min-w-0">
                <div className="space-y-2">
                  <div className={`bg-[#0B0B0B] p-3 rounded-lg flex flex-col gap-2 border border-[#2A2A2A] ${app.borderHover} transition-colors min-w-0`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#FF7900] uppercase tracking-wider block mb-1">Hôte épuré (recommandé sans https)</span>
                        <span className="text-xs font-mono text-gray-200 break-all select-all font-semibold">
                          {host.replace(/^https?:\/\//, "")}
                        </span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(host.replace(/^https?:\/\//, ""), "xtream_host_clean")} 
                        className={`p-2 rounded-md transition-colors flex-shrink-0 ${copiedApp === "xtream_host_clean" ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white'}`} 
                        title="Copier l'hôte épuré"
                      >
                        {copiedApp === "xtream_host_clean" ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={`bg-[#0B0B0B] p-3 rounded-lg flex flex-col gap-2 border border-[#2A2A2A] ${app.borderHover} transition-colors min-w-0`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#FF7900] uppercase tracking-wider block mb-1">URL Complète (avec https://)</span>
                        <span className="text-xs font-mono text-gray-200 break-all select-all">
                          {host}
                        </span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(host, "xtream_host")} 
                        className={`p-2 rounded-md transition-colors flex-shrink-0 ${copiedApp === "xtream_host" ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white'}`} 
                        title="Copier l'URL complète"
                      >
                        {copiedApp === "xtream_host" ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Row for shortened Host */}
                  <div className={`bg-[#0B0B0B] p-3 rounded-lg flex flex-col gap-2 border border-[#2A2A2A] ${app.borderHover} transition-colors min-w-0`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#FF7900] uppercase tracking-wider block mb-1">Hôte Raccourci (pour télécommande)</span>
                        <div className="flex items-center gap-2 mt-1">
                          {shorteningXtream ? (
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <RefreshCw size={12} className="animate-spin text-[#FF7900]" /> Génération...
                            </span>
                          ) : shortXtreamUrl ? (
                            <span className="text-xs font-mono text-emerald-400 break-all select-all font-bold">
                              {shortXtreamUrl.replace(/^https?:\/\//, "")}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => generateShortUrl(host, setShortXtreamUrl, setShorteningXtream)}
                              className="text-[9px] bg-neutral-900 hover:bg-[#FF7900]/10 hover:border-[#FF7900]/30 border border-white/10 px-2.5 py-1.5 rounded-lg text-white font-black uppercase tracking-wider transition-all pointer-events-auto cursor-pointer"
                            >
                              Rétrécir l'adresse
                            </button>
                          )}
                        </div>
                      </div>
                      {shortXtreamUrl && (
                        <button 
                          onClick={() => copyToClipboard(shortXtreamUrl.replace(/^https?:\/\//, ""), "xtream_short_clean")} 
                          className={`p-2 rounded-md transition-colors flex-shrink-0 ${copiedApp === "xtream_short_clean" ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white'}`} 
                          title="Copier l'hôte raccourci"
                        >
                          {copiedApp === "xtream_short_clean" ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className={`bg-[#0B0B0B] p-3 rounded-lg flex justify-between items-center border border-[#2A2A2A] ${app.borderHover} transition-colors`}>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Username</span>
                        <span className="text-xs font-mono text-gray-200 font-semibold truncate">user</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard("user", "xtream_user")} 
                        className={`p-1.5 rounded-md transition-colors ${copiedApp === "xtream_user" ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white'}`} 
                        title="Copier l'utilisateur"
                      >
                        {copiedApp === "xtream_user" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className={`bg-[#0B0B0B] p-3 rounded-lg flex justify-between items-center border border-[#2A2A2A] ${app.borderHover} transition-colors`}>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Password</span>
                        <span className="text-xs font-mono text-gray-200 font-semibold truncate">pass</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard("pass", "xtream_pass")} 
                        className={`p-1.5 rounded-md transition-colors ${copiedApp === "xtream_pass" ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white'}`} 
                        title="Copier le mot de passe"
                      >
                        {copiedApp === "xtream_pass" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 leading-normal font-medium">
                  <span className="text-amber-500 font-bold uppercase block mb-1">⚠️ ERREUR FRÉQUENTE :</span>
                  L'adresse de votre serveur est très longue. Veillez à bien copier ou saisir l'adresse <strong className="text-white text-xs underline font-bold">complète</strong> (commençant par <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded text-white text-[10px]">ais-pre-</code>). Ne recopiez pas uniquement la fin visible !
                </div>
              </div>
            ) : (
              <div className="space-y-2 min-w-0">
                <div className={`bg-[#0B0B0B] p-3 rounded-lg flex items-center justify-between border border-[#2A2A2A] ${app.borderHover} transition-colors min-w-0`}>
                  <span className="text-xs font-mono text-gray-300 truncate mr-4 min-w-0">
                    {app.extraCopyText ? "M3U: " : ""}{app.copyText.replace(/^https?:\/\//, "")}
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                      onClick={() => copyToClipboard(app.copyText, app.name)} 
                      className={`p-2 rounded-md transition-colors flex-shrink-0 ${copiedApp === app.name ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white'}`} 
                      title="Copier le M3U"
                    >
                      {copiedApp === app.name ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    {!app.isCopyOnly && (
                      <a 
                        href={app.actionLink} 
                        download={app.download ? true : undefined}
                        className={`p-2 hover:bg-white/10 rounded-md transition-colors ${app.color} flex-shrink-0`}
                        title={app.actionText}
                      >
                        <app.actionIcon size={16} />
                      </a>
                    )}
                  </div>
                </div>

                {app.extraCopyText && (
                  <div className={`bg-[#0B0B0B] p-3 rounded-lg flex items-center justify-between border border-[#2A2A2A] ${app.borderHover} transition-colors min-w-0`}>
                    <span className="text-xs font-mono text-gray-300 truncate mr-4 min-w-0">
                      EPG: {app.extraCopyText.replace(/^https?:\/\//, "")}
                    </span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        onClick={() => copyToClipboard(app.extraCopyText, app.extraCopyKey || app.name + "_extra")} 
                        className={`p-2 rounded-md transition-colors flex-shrink-0 ${copiedApp === (app.extraCopyKey || app.name + "_extra") ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-white'}`} 
                        title="Copier l'EPG XMLTV"
                      >
                        {copiedApp === (app.extraCopyKey || app.name + "_extra") ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Unified Smart TV URL Shortener block */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#151d2a] to-[#090e17] border border-[#FF7900]/20 relative overflow-hidden shadow-2xl text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#FF7900]/5 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="z-10 relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF7900]/10 rounded-xl flex items-center justify-center border border-[#FF7900]/20 text-[#FF7900]">
              <Tv size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Raccourcisseur d'URL pour Smart TV & Box IPTV
              </h3>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                Saisie facile à la télécommande (Smarters, TiviMate, Apple TV...)
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 leading-relaxed font-semibold">
            Taper de longues adresses sur votre téléviseur est laborieux. Générez ci-dessous un lien <span className="text-[#FF7900] underline font-bold">le plus court possible</span> (ex: <code className="font-mono bg-black/40 px-1 py-0.5 rounded border border-white/5 text-[#FF7900]">is.gd/abc</code>) pour l'entrer en quelques clics !
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* M3U Link Slot */}
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Format M3U</span>
                <span className="text-xs font-bold text-white block">Playlist de chaînes</span>
                <p className="text-[11px] text-neutral-500 font-medium">Pour charger toutes vos catégories de chaînes.</p>
              </div>
              
              <div className="space-y-2 pt-2">
                {shortM3uUrl ? (
                  <div className="bg-black/50 p-2.5 rounded-lg border border-emerald-500/20 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-emerald-400 break-all truncate font-bold font-semibold select-all">{shortM3uUrl}</code>
                    <button
                      onClick={() => copyToClipboard(shortM3uUrl, "short_m3u_copy")}
                      className="p-1 px-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex-shrink-0 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {copiedApp === "short_m3u_copy" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => generateShortUrl(m3uLink, setShortM3uUrl, setShorteningM3u)}
                    disabled={shorteningM3u}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {shorteningM3u ? (
                      <>
                        <RefreshCw size={12} className="animate-spin text-[#FF7900]" /> Génération...
                      </>
                    ) : (
                      "Créer URL Courte"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* EPG XMLTV Slot */}
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">Format XMLTV</span>
                <span className="text-xs font-bold text-white block">Guide des programmes (EPG)</span>
                <p className="text-[11px] text-neutral-500 font-medium">Pour afficher le programme TV en direct.</p>
              </div>
              
              <div className="space-y-2 pt-2">
                {shortXmltvUrl ? (
                  <div className="bg-black/50 p-2.5 rounded-lg border border-emerald-500/20 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-emerald-400 break-all truncate font-bold font-semibold select-all">{shortXmltvUrl}</code>
                    <button
                      onClick={() => copyToClipboard(shortXmltvUrl, "short_xmltv_copy")}
                      className="p-1 px-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex-shrink-0 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {copiedApp === "short_xmltv_copy" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => generateShortUrl(xmltvLink, setShortXmltvUrl, setShorteningXmltv)}
                    disabled={shorteningXmltv}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {shorteningXmltv ? (
                      <>
                        <RefreshCw size={12} className="animate-spin text-[#FF7900]" /> Génération...
                      </>
                    ) : (
                      "Créer URL Courte"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Xtream Host Slot */}
            <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">API Xtream Codes</span>
                <span className="text-xs font-bold text-white block">Hôte de connexion du serveur</span>
                <p className="text-[11px] text-neutral-500 font-medium">Pour vous connecter avec "user" et "pass".</p>
              </div>
              
              <div className="space-y-2 pt-2">
                {shortXtreamUrl ? (
                  <div className="bg-black/50 p-2.5 rounded-lg border border-emerald-500/20 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-emerald-400 break-all truncate font-bold font-semibold select-all">{shortXtreamUrl}</code>
                    <button
                      onClick={() => copyToClipboard(shortXtreamUrl, "short_xtream_copy")}
                      className="p-1 px-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors flex-shrink-0 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {copiedApp === "short_xtream_copy" ? "Copié !" : "Copier"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => generateShortUrl(host, setShortXtreamUrl, setShorteningXtream)}
                    disabled={shorteningXtream}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {shorteningXtream ? (
                      <>
                        <RefreshCw size={12} className="animate-spin text-[#FF7900]" /> Génération...
                      </>
                    ) : (
                      "Créer URL Courte"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-[11px] text-emerald-300 leading-normal font-bold">
            ℹ️ CONSEIL SMART TV : Les serveurs de redirection et URL courtes sont entièrement supportés par les lecteurs IPTV de Smart TV (TiviMate, IPTV Smarters...). Les redirections vers les playlists et le guide TV sont transparentes !
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-gradient-to-r from-[#FF7900]/10 to-transparent p-6 rounded-xl border border-[#FF7900]/20 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0">
          <div className="mt-1 bg-[#FF7900]/20 p-2 rounded-lg text-[#FF7900] flex-shrink-0">
            <Rocket size={20} />
          </div>
          <div className="min-w-0 flex-1 w-full">
            <h3 className="text-white font-bold mb-2">URLs universelles</h3>
            <p className="text-sm text-gray-400 mb-2">Vous n'utilisez pas ces logiciels ? Voici les liens standards :</p>
            <ul className="text-sm space-y-4 mt-4 text-gray-300">
              <li className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <span className="sm:min-w-[125px] font-semibold text-white flex-shrink-0 text-xs sm:text-sm">M3U Globale:</span>
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 w-full max-w-lg justify-between min-w-0">
                  <code className="font-mono text-xs text-gray-300 truncate pr-2 select-all">{m3uLink}</code>
                  <button 
                    onClick={() => copyToClipboard(m3uLink, "m3u_universal")}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
                    title="Copier le lien"
                  >
                    {copiedApp === "m3u_universal" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <span className="sm:min-w-[125px] font-semibold text-white flex-shrink-0 text-xs sm:text-sm">M3U Sports:</span>
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-emerald-500/10 w-full max-w-lg justify-between min-w-0">
                  <code className="font-mono text-xs text-emerald-400 truncate pr-2 select-all font-semibold">{sportsM3uLink}</code>
                  <button 
                    onClick={() => copyToClipboard(sportsM3uLink, "m3u_sports_universal")}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0 p-1"
                    title="Copier le lien"
                  >
                    {copiedApp === "m3u_sports_universal" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </li>
              <li className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <span className="sm:min-w-[125px] font-semibold text-white flex-shrink-0 text-xs sm:text-sm">XMLTV EPG:</span>
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 w-full max-w-lg justify-between min-w-0">
                  <code className="font-mono text-xs text-gray-300 truncate pr-2 select-all">{xmltvLink}</code>
                  <button 
                    onClick={() => copyToClipboard(xmltvLink, "xmltv_universal")}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
                    title="Copier le lien"
                  >
                    {copiedApp === "xmltv_universal" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
