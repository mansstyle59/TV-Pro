import { motion } from "motion/react";
import { Home, Tv, Search, Star, User, Trophy, Settings, Calendar, Plug } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "chaines", label: "Chaînes TV", icon: Tv },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "recherche", label: "Recherche", icon: Search },
    { id: "favoris", label: "Favoris", icon: Star },
    { id: "integrations", label: "Intégrations", icon: Plug },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-gray-100 border-r border-[#151515] p-4 z-50">
      <div className="flex items-center gap-3 px-2 mb-8" onClick={() => onTabChange("accueil")}>
        <img 
          src="./pwa-192x192.svg" 
          alt="DenDenTV Logo" 
          className="w-10 h-10 object-contain rounded-xl hover:scale-105 transition-transform duration-300 cursor-pointer" 
          referrerPolicy="no-referrer"
        />
        <div className="cursor-pointer">
          <h1 className="text-lg font-black tracking-tighter uppercase leading-none text-gray-900">DenDenTV</h1>
          <p className="text-[8px] font-black text-[#FF7900]/80 uppercase tracking-[0.2em] mt-1">Premium Vision</p>
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
                  ? "bg-[#1A242F] text-[#FF7900]" 
                  : "text-[#A0A0A0] hover:text-gray-900"
              }`}
            >
              <Icon 
                size={18} 
                className={`${isActive ? "text-[#FF7900]" : "group-hover:translate-x-0.5"} transition-all duration-300`} 
                strokeWidth={isActive ? 3 : 2}
              />
              <span className={`text-xs font-bold tracking-tight uppercase ${isActive ? "text-gray-900" : "group-hover:translate-x-0.5"} transition-all duration-300`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="bg-[#151515] p-4 rounded-xl border border-gray-200 relative overflow-hidden group">
          <p className="text-[9px] font-bold text-[#FF7900] uppercase tracking-widest mb-1.5">Abonnement</p>
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-tight mb-0.5">PREMIUM 4K HDR</h4>
          <p className="text-[8px] text-[#A0A0A0] font-bold uppercase tracking-widest">Accès illimité</p>
          <button className="mt-3 w-full py-2 bg-white text-black rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
            Gérer
          </button>
        </div>
        
        <button 
          onClick={() => onTabChange("profil")}
          className="w-full text-left flex items-center gap-3 px-2 py-2.5 border-t border-[#151515] hover:bg-[#151515] rounded-xl transition-all group/sidebarprofile"
        >
           <div className="w-8 h-8 bg-brand-500 text-gray-900 rounded-full border border-brand-500/20 group-hover/sidebarprofile:border-brand-500/50 flex items-center justify-center text-[10px] font-black shadow-lg shadow-brand-500/10">
             U
           </div>
           <div className="flex-grow">
             <p className="text-[10px] font-bold text-gray-900 leading-none group-hover/sidebarprofile:text-brand-500 transition-colors">Utilisateur</p>
             <p className="text-[7px] text-[#A0A0A0] font-bold uppercase tracking-widest mt-0.5">Abonné Premium</p>
           </div>
        </button>
      </div>
    </aside>
  );
}
