import { motion } from "motion/react";
import { Home, Tv, Trophy, Settings, Plug } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "integrations", label: "Serveur & APIs", icon: Plug },
    { id: "settings_tab", label: "Paramètres", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 bg-[#040912]/40 backdrop-blur-3xl border-r border-white/[0.03] p-6 z-40 shrink-0">
      {/* Editorial Typographic Header */}
      <div className="flex items-center gap-2 px-1.5 mb-10 select-none">
        <Tv size={15} className="text-[#00a8e1]" strokeWidth={2} />
        <h1 className="text-sm font-bold tracking-[0.25em] text-white">
          DENDEN<span className="text-[#00a8e1] font-extrabold">TV</span>
        </h1>
      </div>

      {/* Navigation list */}
      <nav className="flex-grow space-y-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all duration-300 group cursor-pointer relative ${
                isActive 
                  ? "text-[#00a8e1] bg-[#00a8e1]/[0.03]" 
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.015]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  size={16} 
                  className={`transition-colors duration-300 ${isActive ? "text-[#00a8e1]" : "text-gray-400 group-hover:text-gray-300"}`} 
                  strokeWidth={1.5}
                />
                <span className="text-xs font-medium tracking-wide">
                  {tab.label}
                </span>
              </div>

              {isActive && (
                <motion.div 
                  layoutId="sidebarActiveIndicator"
                  className="w-1 h-3.5 bg-[#00a8e1] rounded-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Premium Footer with minimalist design */}
      <div className="mt-auto pt-6 border-t border-white/[0.03] flex items-center justify-between select-none px-1.5">
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-semibold text-gray-200">Denis Dewulf</span>
          <span className="text-[9px] text-[#00a8e1] font-semibold tracking-wider uppercase mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00a8e1] animate-pulse" />
            Premium 4K
          </span>
        </div>
        <button 
          onClick={() => onTabChange("settings_tab")}
          title="Paramètres de l'application"
          className="p-1.5 rounded-lg hover:bg-white/[0.04] text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <Settings size={14} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
