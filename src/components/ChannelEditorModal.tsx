import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Save, Tv, Copy, Edit3, Image as ImageIcon } from "lucide-react";
import { Channel } from "../types";
import { getCustomNames, saveCustomName, getCustomLogos, saveCustomLogo, normalizeName } from "../utils/logoHelper";

interface ChannelEditorModalProps {
  channel: Channel;
  onClose: () => void;
  onSaved: () => void;
}

export function ChannelEditorModal({ channel, onClose, onSaved }: ChannelEditorModalProps) {
  const norm = normalizeName(channel.name);
  const [name, setName] = useState(channel.name);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    // initialize from local storage overrides
    const customNames = getCustomNames();
    const customLogos = getCustomLogos();
    
    // We try to find the override either by string ID or norm
    if (customNames[String(channel.id)]) {
      setName(customNames[String(channel.id)]);
    } else if (customNames[norm]) {
      setName(customNames[norm]);
    } else {
      // It's possible the current channel.name is already overridden but let's be safe
      setName(channel.name);
    }

    if (customLogos[norm]) {
      setLogoUrl(customLogos[norm]);
    }
  }, [channel, norm]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Saving custom name against ID to be more specific, or norm
    saveCustomName(String(channel.id), name);
    saveCustomLogo(channel.name, logoUrl); 
    onSaved();
    onClose();
  };

  const handleCopyClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(err => console.error("Clipboard copy failed", err));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-sm bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#27272a]/50">
          <h3 className="text-[15px] font-black text-gray-50 flex items-center gap-2 tracking-wide">
            <Edit3 size={16} className="text-[#3b82f6]" />
            ÉDITER LA CHAÎNE
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 flex flex-col gap-5">
          {/* Default Read-only Info */}
          <div className="flex gap-2 p-3 bg-black/30 rounded-xl border border-white/5 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
               <Tv size={16} className="text-gray-500 flex-shrink-0" />
               <div className="min-w-0">
                 <p className="text-[10px] text-gray-500 uppercase font-black truncate">ID / Original</p>
                 <p className="text-xs text-gray-300 font-mono truncate">{channel.id}</p>
               </div>
            </div>
            <button
               type="button"
               onClick={() => handleCopyClipboard(String(channel.id))}
               className="p-2 text-gray-500 hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded-lg cursor-pointer"
               title="Copier l'ID"
            >
               <Copy size={14} />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              Nom affiché
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: TF1 FHD"
                className="w-full bg-[#09090b] border border-white/10 focus:border-[#3b82f6]/50 rounded-xl pl-3 pr-10 py-2.5 text-sm text-gray-50 placeholder-neutral-700 outline-none transition-all focus:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
              />
               <button
                 type="button"
                 onClick={() => handleCopyClipboard(name)}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md cursor-pointer"
                 title="Copier le nom"
               >
                 <Copy size={14} />
               </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              URL du Logo <span className="text-[9px] text-neutral-600 font-normal">(optionnel)</span>
            </label>
            <div className="relative flex gap-2">
              <input
                type="text"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#09090b] border border-white/10 focus:border-[#3b82f6]/50 rounded-xl px-3 py-2.5 text-sm text-gray-50 placeholder-neutral-700 outline-none transition-all focus:shadow-[0_0_15px_rgba(59,130,246,0.1)] font-mono text-[11px]"
              />
            </div>
            {logoUrl && (
              <div className="mt-2 aspect-video bg-black/50 rounded-lg border border-white/5 flex items-center justify-center overflow-hidden h-20 w-32 relative mx-auto">
                <img src={logoUrl} alt="Preview" className="object-contain w-full h-full p-2" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#3b82f6] to-blue-600 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold uppercase tracking-wider text-sm shadow-[0_4px_20px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.4)] transition-all active:scale-[0.98] cursor-pointer"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </form>
      </motion.div>
    </div>
  );
}
