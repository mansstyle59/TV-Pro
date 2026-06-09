import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, X, Edit, Check, Trash2, Plus, RotateCcw, Globe, Tv, List, Filter, ArrowRight, Hash, RefreshCw, Loader2, Database, Download, Upload, Activity, AlertCircle, CheckCircle2, ChevronRight, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Channel } from '../types';
import { getApiUrl } from '../utils/urlHelper';

interface DisplayChannel extends Channel {
  category?: string;
  isCustom?: boolean;
}

interface Props {
  channels: DisplayChannel[];
  reload: () => void;
}

type Tab = 'active' | 'discovery' | 'add' | 'lcn' | 'system';

const DEFAULT_LCN_MAP: Record<string, number> = {
  "tf1": 1,
  "france2": 2,
  "france3": 3,
  "canalplus": 4,
  "france5": 5,
  "m6": 6,
  "arte": 7,
  "c8": 8,
  "w9": 9,
  "tmc": 10,
  "tfx": 11,
  "nrj12": 12,
  "lcp": 13,
  "france4": 14,
  "culturebox": 14,
  "bfmtv": 15,
  "bfm": 15,
  "cnews": 16,
  "cstar": 17,
  "gulli": 18,
  "franceo": 19,
  "tf1seriesfilms": 20,
  "tf1series": 20,
  "lequipe": 21,
  "6ter": 22,
  "rmcstory": 23,
  "rmcdecouverte": 24,
  "cherie25": 25,
  "lci": 26,
  "franceinfo": 27,
  "laune": 301,
  "tipik": 302,
  "latrois": 303,
  "rtltvi": 304,
  "clubrtl": 305,
  "plugrtl": 306,
  "ab3": 307,
  "abxplore": 308,
  "ln24": 309,
};

export const ChannelAdmin: React.FC<Props> = ({ channels, reload }) => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", logo: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New features state
  const [streamStates, setStreamStates] = useState<Record<string, { status: 'online' | 'offline' | 'testing', latency?: number, error?: string }>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [activesCategory, setActivesCategory] = useState("Toutes");
  const [uploadStatus, setUploadStatus] = useState({ success: false, error: "", message: "" });
  const [isRestoring, setIsRestoring] = useState(false);

  // LCN numbering table state
  const [lcnMap, setLcnMap] = useState<Record<string, number>>({});
  const [lcnSearch, setLcnSearch] = useState("");
  const [isLoadingLcn, setIsLoadingLcn] = useState(false);
  const [lcnStatusMessage, setLcnStatusMessage] = useState("");

  // Discovery Catalog state
  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogCountries, setCatalogCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("France");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  // New custom channel form state
  const [addForm, setAddForm] = useState({ name: "", category: "Sports", logo: "", streamUrl: "" });
  const [addError, setAddError] = useState("");

  const filteredChannels = channels.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.categoryOverride || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activesCategory === "Toutes" || (c.categoryOverride || c.category) === activesCategory;
    return matchesSearch && matchesCategory;
  });

  const testSingleStream = async (id: string | number, url?: string) => {
    setStreamStates(prev => ({ ...prev, [String(id)]: { status: 'testing' } }));
    try {
      const res = await fetch(getApiUrl("/api/admin/channels/test-stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, url })
      });
      const data = await res.json();
      if (data.status) {
        setStreamStates(prev => ({
          ...prev,
          [String(id)]: {
            status: data.status,
            latency: data.latency,
            error: data.error
          }
        }));
      } else {
        setStreamStates(prev => ({
          ...prev,
          [String(id)]: {
            status: 'offline',
            error: data.error || "Erreur de test"
          }
        }));
      }
    } catch (err: any) {
      setStreamStates(prev => ({
        ...prev,
        [String(id)]: {
          status: 'offline',
          error: err.message || "Erreur réseau"
        }
      }));
    }
  };

  const testAllStreams = async () => {
    if (testingAll) return;
    setTestingAll(true);
    // Grab channels with a limit to avoid server-side concurrency issues
    const listToTest = filteredChannels.slice(0, 20);
    for (const c of listToTest) {
      // Small parallelisation/delay to stagger requests nicely
      testSingleStream(c.id, c.isCustom ? (c as any).streamUrl : undefined);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    setTestingAll(false);
  };

  const handleBackupRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsRestoring(true);
    setUploadStatus({ success: false, error: "", message: "" });
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (!content || (typeof content !== 'object')) {
            throw new Error("Le fichier de sauvegarde doit être un JSON d'administration valide.");
          }
          const res = await fetch(getApiUrl("/api/admin/restore"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ backup: content })
          });
          const data = await res.json();
          if (data.success) {
            setUploadStatus({ success: true, error: "", message: "Configuration restaurée ! Les changements sont appliqués." });
            reload();
          } else {
            setUploadStatus({ success: false, error: data.error || "Échec de la restauration.", message: "" });
          }
        } catch (err: any) {
          setUploadStatus({ success: false, error: err.message || "Format JSON de sauvegarde corrompu ou invalide.", message: "" });
        } finally {
          setIsRestoring(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setUploadStatus({ success: false, error: "Impossible de lire le fichier.", message: "" });
      setIsRestoring(false);
    }
  };

  const fetchLcnMap = async () => {
    setIsLoadingLcn(true);
    setLcnStatusMessage("");
    try {
      const res = await fetch(getApiUrl("/api/admin/lcn"));
      const data = await res.json();
      if (data.success) {
        setLcnMap(data.lcnMap);
      }
    } catch (err) {
      console.error("Error fetching LCN map", err);
    } finally {
      setIsLoadingLcn(false);
    }
  };

  const handleUpdateLcnValue = (core: string, value: string) => {
    const num = value === "" ? 9999 : parseInt(value, 10);
    setLcnMap(prev => ({
      ...prev,
      [core]: isNaN(num) ? 9999 : num
    }));
  };

  const handleSaveLcnMap = async () => {
    setIsLoadingLcn(true);
    setLcnStatusMessage("");
    try {
      const res = await fetch(getApiUrl("/api/admin/lcn/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lcnMap })
      });
      const data = await res.json();
      if (data.success) {
        setLcnStatusMessage("Table de numérotation LCN enregistrée !");
        reload();
      } else {
        setLcnStatusMessage(data.error || "Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      console.error(err);
      setLcnStatusMessage("Échec de connexion.");
    } finally {
      setIsLoadingLcn(false);
    }
  };

  const handleAutoUpdateLcn = async () => {
    setIsLoadingLcn(true);
    setLcnStatusMessage("");
    try {
      const res = await fetch(getApiUrl("/api/admin/lcn/auto-update"), {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setLcnMap(data.lcnMap);
        setLcnStatusMessage(data.message || "Table LCN mise à jour avec succès !");
        reload();
      } else {
        setLcnStatusMessage("Échec de la mise à jour automatique.");
      }
    } catch (err) {
      console.error(err);
      setLcnStatusMessage("Échec de connexion.");
    } finally {
      setIsLoadingLcn(false);
    }
  };

  const handleResetLcnMap = async () => {
    if (!window.confirm("Voulez-vous vraiment réinitialiser la table de numérotation LCN ? All-dessus de vos modifications manuelles.")) return;
    setIsLoadingLcn(true);
    setLcnStatusMessage("");
    try {
      const res = await fetch(getApiUrl("/api/admin/lcn/reset"), {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setLcnMap(data.lcnMap);
        setLcnStatusMessage("Table LCN réinitialisée aux valeurs par défaut.");
        reload();
      }
    } catch (err) {
      console.error(err);
      setLcnStatusMessage("Échec de la réinitialisation.");
    } finally {
      setIsLoadingLcn(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'discovery') {
      fetchCatalog();
    } else if (activeTab === 'lcn') {
      fetchLcnMap();
    }
  }, [activeTab, selectedCountry, catalogSearch]);

  const fetchCatalog = async () => {
    setIsCatalogLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCountry) params.set("country", selectedCountry);
      if (catalogSearch) params.set("search", catalogSearch);
      
      const res = await fetch(getApiUrl(`/api/admin/vavoo-catalog?${params.toString()}`));
      const data = await res.json();
      if (data.success) {
        setCatalog(data.channels);
        setCatalogCountries(data.countries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const toggleChannelActivation = async (id: number | string, action: 'activate' | 'deactivate') => {
    try {
      const res = await fetch(getApiUrl("/api/admin/channels/bulk-toggle"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], action })
      });
      if (res.ok) {
        if (activeTab === 'discovery') {
           // Local update for better UX
           reload();
        } else {
           reload();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number | string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer/masquer la chaîne "${name}" ?`)) return;
    try {
      const res = await fetch(getApiUrl("/api/admin/channels/delete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (c: DisplayChannel) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, category: c.categoryOverride || c.category || "", logo: c.logo || "" });
  };

  const saveEdit = async (id: number | string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/channels/edit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm })
      });
      if (res.ok) {
        setEditingId(null);
        reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.category || !addForm.streamUrl) {
      setAddError("Le nom, la catégorie et l'URL du flux sont obligatoires.");
      return;
    }
    setAddError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/channels/add"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setAddForm({ name: "", category: "Sports", logo: "", streamUrl: "" });
        setActiveTab('active');
        reload();
      } else {
        const data = await res.json();
        setAddError(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      console.error(err);
      setAddError("Échec de connexion au serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetConfig = async () => {
    if (!window.confirm("Rétablir la configuration d'usine ?")) return;
    try {
      const res = await fetch(getApiUrl("/api/admin/channels/reset"), {
        method: "POST"
      });
      if (res.ok) reload();
    } catch (err) {
      console.error(err);
    }
  };

  const activeIds = new Set(channels.map(c => String(c.id)));

  return (
    <div className="space-y-6 pt-2">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/5 space-x-8 px-2 overflow-x-auto scrollbar-none">
         {[
           { id: 'active', label: 'Actives', icon: List },
           { id: 'discovery', label: 'Catalogue Vavoo', icon: Globe },
           { id: 'add', label: 'Ajouter M3U8', icon: Plus },
           { id: 'lcn', label: 'Table LCN', icon: Hash }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as Tab)}
             className={`pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${
               activeTab === tab.id ? "text-brand-500" : "text-neutral-500 hover:text-white"
             }`}
           >
             <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
             {tab.label}
             {activeTab === tab.id && (
               <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />
             )}
           </button>
         ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'active' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                <div className="relative flex-grow sm:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Rechercher parmi les chaînes actives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
                
                {/* Dynamically populate categories filter */}
                <div className="flex items-center gap-2 bg-neutral-900/50 border border-white/10 rounded-xl px-3 sm:w-56 shrink-0">
                  <Filter size={12} className="text-neutral-500 shrink-0" />
                  <select
                    value={activesCategory}
                    onChange={e => setActivesCategory(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold uppercase tracking-tight focus:outline-none w-full py-2 cursor-pointer"
                  >
                    {["Toutes", ...Array.from(new Set(channels.map(c => c.categoryOverride || c.category || "Inconnue")))]
                      .map(cat => (
                        <option key={cat} value={cat} className="bg-neutral-900 text-white">{cat}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={testAllStreams}
                  disabled={testingAll || filteredChannels.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-brand-500/50 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-400 transition-all disabled:opacity-50"
                >
                  {testingAll ? (
                    <Loader2 size={12} className="animate-spin text-brand-500" />
                  ) : (
                    <Activity size={12} />
                  )}
                  {testingAll ? "Analyse..." : "Tester 20 flux"}
                </button>

                <button
                  onClick={handleResetConfig}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <RotateCcw size={12} />
                  Réinitialiser
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredChannels.map(c => {
                const isEditing = editingId === c.id;
                const isCustom = String(c.id).includes('custom_');
                
                return (
                  <div key={c.id} className="p-4 bg-neutral-900 border border-white/5 rounded-2xl md:rounded-[1.8rem] group active:scale-[0.99] transition-all hover:bg-neutral-800/50 hover:border-white/10 hover:shadow-xl">
                    {isEditing ? (
                      <div className="space-y-3">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-neutral-500 uppercase tracking-widest px-1">Nom du canal</label>
                            <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={e => setEditForm({...editForm, name: e.target.value})} 
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-500 outline-none" 
                              placeholder="Nom"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-neutral-500 uppercase tracking-widest px-1">Catégorie</label>
                            <input 
                              type="text" 
                              value={editForm.category} 
                              onChange={e => setEditForm({...editForm, category: e.target.value})} 
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-500 outline-none" 
                              placeholder="Catégorie"
                            />
                         </div>
                         <div className="flex gap-2 justify-end pt-1">
                            <button onClick={() => setEditingId(null)} className="px-4 py-2 text-[9px] font-black text-neutral-500 hover:text-white uppercase tracking-widest font-mono">Annuler</button>
                            <button onClick={() => saveEdit(c.id)} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand-500/20">Sauvegarder</button>
                         </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center p-2 overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors shadow-inner">
                            {c.logo ? <img src={c.logo} alt="" loading="lazy" className="max-w-full max-h-full object-contain filter group-hover:brightness-110 transition-all" /> : <Tv size={20} className="text-neutral-800" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <h4 className="text-sm font-black text-white line-clamp-1 tracking-tight">{c.name}</h4>
                               {isCustom && <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-lg uppercase tracking-tight">MANUEL</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                               <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.15em]">{c.categoryOverride || c.category}</p>
                               <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                               
                               {/* Interactive test diagnostics */}
                               {streamStates[String(c.id)] ? (
                                 streamStates[String(c.id)].status === 'testing' ? (
                                   <span className="flex items-center gap-1 text-[8px] text-brand-500 font-mono font-black uppercase tracking-widest animate-pulse">
                                      <Loader2 size={10} className="animate-spin" /> Diagnostic...
                                   </span>
                                 ) : streamStates[String(c.id)].status === 'online' ? (
                                   <span className="flex items-center gap-1 text-[8px] text-emerald-400 font-mono font-black uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow-inner">
                                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping shrink-0" /> {streamStates[String(c.id)].latency}ms
                                   </span>
                                 ) : (
                                   <span className="flex items-center gap-1 text-[8px] text-red-500 font-mono font-black uppercase tracking-widest bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 shrink-0" title={streamStates[String(c.id)].error || "Erreur de connexion"}>
                                      Hors-ligne
                                   </span>
                                 )
                               ) : (
                                 <span className="text-[8px] text-neutral-500 font-mono font-black uppercase tracking-widest">Inconnu</span>
                               )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => testSingleStream(c.id, c.isCustom ? (c as any).streamUrl : undefined)} 
                            disabled={streamStates[String(c.id)]?.status === 'testing'}
                            className="p-2.5 text-neutral-500 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all disabled:opacity-50" 
                            title="Tester le flux"
                          >
                             <Activity size={16} />
                          </button>
                          <button onClick={() => handleEdit(c)} className="p-2.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Modifier"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(c.id, c.name)} className="p-2.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Supprimer"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'discovery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="relative flex-grow">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                 <input
                   type="text"
                   placeholder="Chercher dans le catalogue global..."
                   value={catalogSearch}
                   onChange={e => setCatalogSearch(e.target.value)}
                   className="w-full bg-neutral-900/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-brand-500/50"
                 />
               </div>
               <div className="flex items-center gap-2 bg-neutral-900/50 border border-white/10 rounded-xl px-3 min-w-[140px]">
                  <Filter size={12} className="text-neutral-500" />
                  <select 
                    value={selectedCountry} 
                    onChange={e => setSelectedCountry(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold uppercase tracking-tight focus:outline-none w-full py-2"
                  >
                    {catalogCountries.map(country => (
                      <option key={country} value={country} className="bg-neutral-900">{country}</option>
                    ))}
                  </select>
               </div>
            </div>

            {isCatalogLoading ? (
              <div className="flex items-center justify-center p-20 animate-pulse text-xs font-black uppercase text-neutral-500 tracking-widest">
                 Chargement du catalogue...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {catalog.map(item => {
                  const isActive = activeIds.has(String(item.id));
                  return (
                    <div key={item.id} className="p-3 bg-neutral-900 border border-white/5 rounded-xl flex items-center justify-between group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-black rounded p-1 shrink-0 flex items-center justify-center">
                          {item.logo ? <img src={item.logo} alt="" loading="lazy" className="max-w-full max-h-full object-contain" /> : <Globe size={14} className="text-neutral-800" />}
                        </div>
                        <span className="text-[11px] font-bold text-white truncate pr-2">{item.name}</span>
                      </div>
                      <button
                        onClick={() => toggleChannelActivation(item.id, isActive ? 'deactivate' : 'activate')}
                        className={`p-1.5 px-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                          isActive 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white" 
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        {isActive ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto py-4">
            <form onSubmit={handleAddChannel} className="p-8 bg-neutral-900 border border-white/5 rounded-[2rem] space-y-6 shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500">
                    <Plus size={24} />
                 </div>
                 <div>
                    <h4 className="text-base font-black text-white uppercase tracking-tighter">Ajouter un flux M3U8</h4>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Intégrez vos propres chaînes personnalisées</p>
                 </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Nom de la chaîne</label>
                      <input
                        type="text"
                        placeholder="Ex: My Movie Channel"
                        value={addForm.name}
                        onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Catégorie</label>
                      <select
                        value={addForm.category}
                        onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 font-bold uppercase tracking-tight"
                      >
                        <option value="TNT & Généralistes">TNT & Généralistes</option>
                        <option value="Sports">Sports</option>
                        <option value="Cinéma & Séries">Cinéma & Séries</option>
                        <option value="Documentaires">Documentaires</option>
                        <option value="Actualités">Actualités</option>
                        <option value="Jeunesse">Jeunesse</option>
                        <option value="Musique">Musique</option>
                        <option value="Belgique 🇧🇪">Belgique 🇧🇪</option>
                        <option value="Divertissement">Divertissement</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">URL du flux (.m3u8 / .ts)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={addForm.streamUrl}
                    onChange={e => setAddForm({ ...addForm, streamUrl: e.target.value })}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">URL de l'image (Logo)</label>
                   <input
                    type="text"
                    placeholder="https://..."
                    value={addForm.logo}
                    onChange={e => setAddForm({ ...addForm, logo: e.target.value })}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
                   />
                </div>
              </div>

              {addError && <p className="text-[10px] text-red-500 font-black uppercase text-center bg-red-500/10 py-2 rounded-lg">{addError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-500 hover:bg-brand-600 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-500/20"
              >
                {isSubmitting ? "Enregistrement..." : "Confirmer l'ajout"}
                <ArrowRight size={18} />
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'lcn' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-6 bg-neutral-900 border border-white/5 rounded-2xl md:rounded-[2rem] space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <Hash size={24} />
                     </div>
                     <div>
                        <h4 className="text-base font-black text-white uppercase tracking-tighter">Numérotation LCN</h4>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Optimisez la disposition automatique des bouquets TV français</p>
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                     <button
                       onClick={handleAutoUpdateLcn}
                       disabled={isLoadingLcn}
                       className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-950 border border-white/10 hover:border-brand-500/50 hover:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-400 transition-all cursor-pointer disabled:opacity-50"
                     >
                        {isLoadingLcn ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        Forcer Auto-LCN
                     </button>
                     <button
                       onClick={handleResetLcnMap}
                       disabled={isLoadingLcn}
                       className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-950 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-red-400 transition-all cursor-pointer disabled:opacity-50"
                     >
                        <RotateCcw size={12} />
                        Réinitialiser
                     </button>
                     <button
                       onClick={handleSaveLcnMap}
                       disabled={isLoadingLcn}
                       className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-lg shadow-brand-500/10 cursor-pointer disabled:opacity-50"
                     >
                        {isLoadingLcn ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Sauvegarder
                     </button>
                  </div>
               </div>

               {lcnStatusMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="p-3 text-[10px] font-black uppercase tracking-wider text-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20"
                  >
                     {lcnStatusMessage}
                  </motion.div>
               )}

               <div className="relative w-full">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                 <input
                   type="text"
                   placeholder="Rechercher une chaîne ou un identifiant core..."
                   value={lcnSearch}
                   onChange={e => setLcnSearch(e.target.value)}
                   className="w-full bg-black/45 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500/50"
                 />
               </div>

               <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                  {isLoadingLcn && Object.keys(lcnMap).length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 text-xs font-black uppercase text-neutral-500 tracking-widest gap-2">
                        <Loader2 size={24} className="animate-spin text-brand-500" />
                        Chargement de la table...
                     </div>
                  ) : (
                     Object.entries(lcnMap)
                       .filter(([core]) => core.toLowerCase().includes(lcnSearch.toLowerCase()))
                       .sort((a, b) => Number(a[1]) - Number(b[1]))
                       .map(([core, currentVal]) => (
                          <div key={core} className="flex items-center justify-between p-3.5 bg-neutral-950/40 border border-white/[0.03] rounded-xl hover:border-white/10 transition-all">
                             <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase font-mono">
                                   #
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-xs font-black text-white font-mono tracking-tight">{core}</p>
                                   <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-500">
                                         Standard: {DEFAULT_LCN_MAP[core] || "Non défini"}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  value={currentVal === 9999 ? "" : currentVal}
                                  placeholder="Non ordonné"
                                  onChange={e => handleUpdateLcnValue(core, e.target.value)}
                                  className="w-20 bg-neutral-900 border border-white/10 focus:border-brand-500/50 rounded-lg px-3 py-1.5 text-xs text-center text-white font-black animate-none"
                                />
                             </div>
                          </div>
                       ))
                  )}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Stats Section */}
              <div className="lg:col-span-1 bg-neutral-900 border border-white/5 p-6 rounded-2xl md:rounded-[2rem] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Rapport d'État</h4>
                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">État actuel du tuner local</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/[0.02]">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Chaînes</span>
                    <span className="text-sm font-black font-mono text-white">{channels.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/[0.02]">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Chaînes Personnalisées</span>
                    <span className="text-sm font-black font-mono text-amber-400">
                      {channels.filter(c => String(c.id).includes('custom_')).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/[0.02]">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">LCN Mappés</span>
                    <span className="text-sm font-black font-mono text-indigo-400">{Object.keys(lcnMap).length}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Actions & Database */}
              <div className="lg:col-span-2 bg-neutral-900 border border-white/5 p-6 rounded-2xl md:rounded-[2rem] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-neutral-800 text-neutral-400 rounded-xl">
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Gestion des Données (Sauvegardes)</h4>
                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Sauvegardez vos numérotations, logos et flux personnalisés</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Backup Card */}
                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 hover:border-brand-500/20 transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-brand-400 mb-1">
                        <Download size={14} />
                        <span className="text-xs font-black uppercase tracking-wider">Exporter</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide leading-relaxed">
                        Générez un fichier JSON contenant toute la configuration actuelle (LCN, chaînes ajoutées, ajustements).
                      </p>
                    </div>
                    <a
                      href={getApiUrl("/api/admin/backup")}
                      download="tv-aggregator-config.json"
                      className="w-full py-2 bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all"
                    >
                      Télécharger .json
                    </a>
                  </div>

                  {/* Restore Card */}
                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 hover:border-brand-500/20 transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <Upload size={14} />
                        <span className="text-xs font-black uppercase tracking-wider">Importer</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide leading-relaxed">
                        Restaurez une sauvegarde précédente. Attention, cela remplacera les données en cours.
                      </p>
                    </div>
                    <label className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer block">
                      {isRestoring ? "Restauration..." : "Charger sauvegarde"}
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleBackupRestore}
                        className="hidden"
                        disabled={isRestoring}
                      />
                    </label>
                  </div>
                </div>

                {uploadStatus.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-wider text-[9px] text-center rounded-xl flex items-center justify-center gap-2">
                    <AlertCircle size={12} />
                    {uploadStatus.error}
                  </div>
                )}
                {uploadStatus.message && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-wider text-[9px] text-center rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 size={12} />
                    {uploadStatus.message}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
