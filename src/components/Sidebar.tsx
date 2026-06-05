import { motion } from "motion/react";
import { Home, Tv, Search, Star, User, Trophy, Settings } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "recherche", label: "Recherche", icon: Search },
    { id: "favoris", label: "Favoris", icon: Star },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#0B0B0B] border-r border-[#151515] p-4 z-50">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 bg-linear-to-br from-[#1E88FF] to-blue-800 rounded-xl flex items-center justify-center">
          <Tv className="text-white" size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter uppercase leading-none text-white">TV PRO</h1>
          <p className="text-[8px] font-black text-[#1E88FF]/80 uppercase tracking-[0.2em] mt-1">Premium Vision</p>
        </div>
      </div>

      <nav className="flex-grow space-y-0.5">
        <p className="px-4 py-2 text-[9px] font-bold text-[#A0A0A0] uppercase tracking-widest">Global</p>
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? "bg-[#151515] text-[#1E88FF]" 
                  : "text-[#A0A0A0] hover:text-white"
              }`}
            >
              <Icon 
                size={18} 
                className={`${isActive ? "text-[#1E88FF]" : "group-hover:translate-x-0.5"} transition-all duration-300`} 
                strokeWidth={isActive ? 3 : 2}
              />
              <span className={`text-xs font-bold tracking-tight uppercase ${isActive ? "text-white" : "group-hover:translate-x-0.5"} transition-all duration-300`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="bg-[#151515] p-4 rounded-xl border border-white/5 relative overflow-hidden group">
          <p className="text-[9px] font-bold text-[#1E88FF] uppercase tracking-widest mb-1.5">Abonnement</p>
          <h4 className="text-xs font-black text-white uppercase tracking-tight mb-0.5">PREMIUM 4K HDR</h4>
          <p className="text-[8px] text-[#A0A0A0] font-bold uppercase tracking-widest">Accès illimité</p>
          <button className="mt-3 w-full py-2 bg-white text-black rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
            Gérer
          </button>
        </div>
        
        <button 
          onClick={() => onTabChange("profil")}
          className="w-full text-left flex items-center gap-3 px-2 py-2.5 border-t border-[#151515] hover:bg-[#151515] rounded-xl transition-all group/sidebarprofile"
        >
           <div className="w-8 h-8 bg-brand-500 text-white rounded-full border border-brand-500/20 group-hover/sidebarprofile:border-brand-500/50 flex items-center justify-center text-[10px] font-black shadow-lg shadow-brand-500/10">
             DD
           </div>
           <div className="flex-grow">
             <p className="text-[10px] font-bold text-white leading-none group-hover/sidebarprofile:text-brand-500 transition-colors">Denis Dewulf</p>
             <p className="text-[7px] text-[#A0A0A0] font-bold uppercase tracking-widest mt-0.5">Abonné Premium</p>
           </div>
        </button>
      </div>
    </aside>
  );
}
