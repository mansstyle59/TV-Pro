import { motion } from "motion/react";
import { Home, Trophy, Settings, Plug } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "integrations", label: "APIs", icon: Plug },
    { id: "settings_tab", label: "Options", icon: Settings },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[99] lg:hidden pb-safe">
      <nav className="bg-[#040912]/75 backdrop-blur-xl border border-white/[0.04] rounded-2xl px-2 py-2 flex justify-around items-center w-full shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
               key={tab.id}
               onClick={() => onTabChange(tab.id)}
               className="relative flex flex-col items-center justify-center w-14 h-11 transition-all outline-none group gap-0.5 cursor-pointer"
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon 
                  size={18} 
                  strokeWidth={isActive ? 2 : 1.5} 
                  className={isActive ? "text-[#00a8e1]" : "text-gray-400 group-hover:text-gray-200 transition-colors"} 
                />
                <span className={`text-[8.5px] font-semibold tracking-wide transition-colors ${isActive ? "text-white" : "text-gray-500"}`}>
                  {tab.label}
                </span>
              </div>
              {isActive && (
                <motion.div 
                  layoutId="bottomTabIndicator"
                  className="absolute bottom-0 w-5 h-[2px] bg-[#00a8e1] rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

