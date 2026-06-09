import React, { useState, useEffect } from "react";
import { Plug, ShieldCheck, RefreshCw, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { 
  getSavedXtreamCredentials, 
  saveXtreamCredentials, 
  setXtreamEnabled, 
  authenticateXtream, 
  XtreamAccountInfo 
} from "../utils/xtreamClient";

interface XtreamConfigWidgetProps {
  onSuccess: () => void;
}

export function XtreamConfigWidget({ onSuccess }: XtreamConfigWidgetProps) {
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [useCorsProxy, setUseCorsProxy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<XtreamAccountInfo | null>(null);

  // Load initial settings
  useEffect(() => {
    const creds = getSavedXtreamCredentials();
    setServer(creds.server);
    setUsername(creds.username);
    setPassword(creds.password);
    setUseCorsProxy(creds.useCorsProxy);
    setEnabled(creds.enabled);

    if (creds.enabled && creds.server && creds.username) {
      // Quietly fetch subscription status
      authenticateXtream().then(res => {
        if (res.success && res.accountInfo) {
          setAccountInfo(res.accountInfo);
        }
      });
    }
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!server || !username || !password) {
      setError("Veuillez remplir tous les champs requis.");
      setLoading(false);
      return;
    }

    // Standardize URL protocol
    let formattedServer = server.trim();
    if (!formattedServer.startsWith("http://") && !formattedServer.startsWith("https://")) {
      formattedServer = "http://" + formattedServer;
    }
    formattedServer = formattedServer.replace(/\/$/, "");

    try {
      // 1. Temporarily save credentials to authenticate
      saveXtreamCredentials(formattedServer, username, password, useCorsProxy);
      
      const authResult = await authenticateXtream();
      
      if (authResult.success && authResult.accountInfo) {
        setAccountInfo(authResult.accountInfo);
        setXtreamEnabled(true);
        setEnabled(true);
        onSuccess(); // Refresh channel lists inside parent App
      } else {
        setError(authResult.error || "Lettre d'authentification incorrecte");
        setXtreamEnabled(false);
        setEnabled(false);
      }
    } catch (err) {
      setError("Échec de connexion au serveur Xtream. Vérifiez le domaine.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setXtreamEnabled(false);
    setEnabled(false);
    setAccountInfo(null);
    onSuccess(); // Triggers reload to default Vavoo/Fallback playlists
  };

  const handleReset = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer tous vos identifiants Xtream Codes ?")) {
      localStorage.removeItem("xtream_server");
      localStorage.removeItem("xtream_username");
      localStorage.removeItem("xtream_password");
      localStorage.removeItem("xtream_cors_proxy");
      localStorage.removeItem("xtream_enabled");
      
      setServer("");
      setUsername("");
      setPassword("");
      setUseCorsProxy(false);
      setEnabled(false);
      setAccountInfo(null);
      setError(null);
      onSuccess();
    }
  };

  return (
    <div className="bg-[#0D0D0D] rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 bg-neutral-950/40 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 text-orange-500">
            <Plug size={22} className={enabled ? "animate-pulse" : ""} />
          </div>
          <div className="text-left space-y-0.5">
            <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              Xtream Codes API
              {enabled && (
                <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-500/15 uppercase tracking-widest animate-pulse">
                  Connecté
                </span>
              )}
            </h4>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
              Importez vos propres flux & EPG en direct
            </p>
          </div>
        </div>
        
        {enabled && (
          <div className="flex gap-2">
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-neutral-900 text-neutral-400 hover:text-white border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer"
            >
              Désactiver
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Effacer
            </button>
          </div>
        )}
      </div>

      {/* Main Panel Content */}
      <div className="p-6 sm:p-8 space-y-6">
        {enabled && accountInfo ? (
          /* Subscription Dashboard */
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 bg-neutral-950/40 border border-white/5 rounded-2xl text-left">
                <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Abonné</span>
                <span className="text-xs font-bold text-white uppercase tracking-tight block truncate">{accountInfo.username}</span>
              </div>
              
              <div className="p-4 bg-neutral-950/40 border border-white/5 rounded-2xl text-left">
                <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Expiration</span>
                <span className="text-xs font-bold text-[#FF7900] uppercase tracking-tight block">{accountInfo.expiryDate}</span>
              </div>
              
              <div className="p-4 bg-neutral-950/40 border border-white/5 rounded-2xl text-left">
                <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Statut Client</span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-tight block">{accountInfo.status}</span>
              </div>
              
              <div className="p-4 bg-neutral-950/40 border border-white/5 rounded-2xl text-left">
                <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Connexions</span>
                <span className="text-xs font-bold text-white uppercase tracking-tight block">
                  {accountInfo.activeConnections} / {accountInfo.maxConnections}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#FF7900]/5 border border-[#FF7900]/10 rounded-2xl flex items-start gap-4 text-left">
              <ShieldCheck size={18} className="text-[#FF7900] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">Lecteur Synchrone Xtream</span>
                <p className="text-[11px] text-neutral-400 font-medium leading-relaxed font-sans">
                  Le protocole Xtream est entièrement connecté. Les listes thématiques, programmes de streaming .TS et guides TV (EPG) sont chargés de manière isolée et sécurisée.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Login Configuration Form */
          <form onSubmit={handleConnect} className="space-y-4 text-left">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/15 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-300 font-bold leading-normal">{error}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-wider block">Adresse du Serveur</label>
              <input
                type="text"
                placeholder="http://votre-serveur.com:8080"
                value={server}
                onChange={e => setServer(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 font-mono transition-colors"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-wider block">Identifiant</label>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 font-mono transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-wider block">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 pr-10 text-xs text-white focus:outline-none focus:border-orange-500 font-mono transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-950/40 rounded-2xl flex items-center justify-between border border-white/5 mt-2">
              <div className="text-left space-y-0.5">
                <span className="text-[10px] font-bold text-white block uppercase tracking-wide">Contournement CORS</span>
                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Recommandé pour hébergement statique (GitHub Pages)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useCorsProxy} 
                  onChange={e => setUseCorsProxy(e.target.checked)}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-white border border-white/5"></div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-[#FF7900] text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl hover:from-orange-500 hover:to-orange-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Connexion en cours...
                  </>
                ) : (
                  "Valider et Importer la Playlist"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
