import React, { useState } from 'react';
import { ShieldCheck, Search, X, Edit, Check, Trash2, Plus, RotateCcw, HelpCircle } from 'lucide-react';
import { Channel } from '../types';

interface DisplayChannel extends Channel {
  category?: string;
  isCustom?: boolean;
}

interface Props {
  channels: DisplayChannel[];
  reload: () => void;
}

export const ChannelAdmin: React.FC<Props> = ({ channels, reload }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", logo: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New custom channel form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "Sports", logo: "", streamUrl: "" });
  const [addError, setAddError] = useState("");

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.categoryOverride?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number | string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer/masquer la chaîne "${name}" ?`)) return;
    try {
      const res = await fetch("/api/admin/channels/delete", {
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
      const res = await fetch("/api/admin/channels/edit", {
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
      const res = await fetch("/api/admin/channels/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setAddForm({ name: "", category: "Sports", logo: "", streamUrl: "" });
        setShowAddForm(false);
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
    if (!window.confirm("Êtes-vous sûr de vouloir restaurer la configuration d'origine ? Cela supprimera toutes les modifications de noms, catégories, chaînes masquées et flux personnalisés.")) return;
    try {
      const res = await fetch("/api/admin/channels/reset", {
        method: "POST"
      });
      if (res.ok) reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Top Header Controls with reset and add toggle */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Gestion des Chaînes</h3>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Configurez l'antenne et ajoutez des flux</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Fermer" : "Ajouter un flux M3U8"}
          </button>
          
          <button
            onClick={handleResetConfig}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 active:scale-95 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            title="Réinitialiser l'IPTV à l'état d'usine"
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Dynamic Add Form Drawer/Box */}
      {showAddForm && (
        <form onSubmit={handleAddChannel} className="p-6 bg-neutral-900 border border-white/5 rounded-3xl space-y-4 shadow-xl">
          <h4 className="text-xs font-black text-[#1E88FF] uppercase tracking-widest">Nouveau Flux IPTV</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">Nom de la Chaîne</label>
              <input
                type="text"
                placeholder="Ex: Canal+ Foot"
                value={addForm.name}
                onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">Catégorie</label>
              <select
                value={addForm.category}
                onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="TNT & Généralistes">TNT & Généralistes</option>
                <option value="Sports">Sports</option>
                <option value="Cinéma">Cinéma</option>
                <option value="Séries">Séries</option>
                <option value="Documentaires">Documentaires</option>
                <option value="Actualités">Actualités</option>
                <option value="Belgique 🇧🇪">Belgique 🇧🇪</option>
                <option value="Jeunesse">Jeunesse</option>
                <option value="Musique">Musique</option>
                <option value="Divertissement">Divertissement</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">URL du stream (.m3u8)</label>
              <input
                type="text"
                placeholder="Ex: https://exemple.com/lives/canalsport.m3u8"
                value={addForm.streamUrl}
                onChange={e => setAddForm({ ...addForm, streamUrl: e.target.value })}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block">URL du Logo (Optionnel)</label>
              <input
                type="text"
                placeholder="Ex: https://exemple.com/logos/canalsport.png"
                value={addForm.logo}
                onChange={e => setAddForm({ ...addForm, logo: e.target.value })}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {addError && <p className="text-[10px] text-red-500 uppercase font-bold tracking-wider">{addError}</p>}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-95 transition-all"
            >
              Sauvegarder le Flux
            </button>
          </div>
        </form>
      )}

      {/* Channel Search box */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Rechercher une chaîne à modifier ou masquer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50"
        />
      </div>

      {/* Channels List with proper limits */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {filteredChannels.slice(0, 100).map(c => {
          const isAddedCustom = String(c.id).startsWith("custom_");
          return (
            <div key={c.id} className="p-4 bg-neutral-950/50 border border-white/5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between md:items-center group hover:border-white/10 transition-colors">
              {editingId === c.id ? (
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                    placeholder="Nom de la chaîne"
                  />
                  <input 
                    type="text" 
                    value={editForm.category} 
                    onChange={e => setEditForm({...editForm, category: e.target.value})} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                    placeholder="Catégorie"
                  />
                  <input 
                    type="text" 
                    value={editForm.logo} 
                    onChange={e => setEditForm({...editForm, logo: e.target.value})} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" 
                    placeholder="URL du logo"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center p-2">
                    {c.logo ? <img src={c.logo} alt={c.name} className="max-w-full max-h-full object-contain" /> : <ShieldCheck size={20} className="text-neutral-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white uppercase tracking-widest">{c.name}</p>
                      {isAddedCustom && (
                        <span className="text-[7px] bg-[#1E88FF]/20 text-[#1E88FF] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#1E88FF]/20">M3U8</span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{c.categoryOverride || c.category || "Inconnu"}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {editingId === c.id ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-neutral-800 text-neutral-400 hover:text-white rounded-lg">
                      <X size={16} />
                    </button>
                    <button disabled={isSubmitting} onClick={() => saveEdit(c.id)} className="p-2 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg">
                      <Check size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(c)} className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-neutral-800 text-neutral-400 hover:text-white rounded-lg" title="Éditer la chaîne">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg" title={isAddedCustom ? "Supprimer définitivement" : "Masquer la chaîne"}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filteredChannels.length > 100 && (
          <p className="text-center text-xs text-neutral-500 uppercase tracking-widest p-4">
            + {filteredChannels.length - 100} autres chaînes (utilisez la recherche)
          </p>
        )}
      </div>
    </div>
  );
};
