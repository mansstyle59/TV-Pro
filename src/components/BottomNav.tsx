import { motion } from "motion/react";
import { Home, Trophy, Search, Star, User, Settings, Calendar, Tv } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "chaines", label: "Chaînes TV", icon: Tv },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "recherche", label: "Recherche", icon: Search },
    { id: "favoris", label: "Favoris", icon: Star },
  ];

  return (
    <div className="fixed bottom-2 left-4 right-4 md:left-1/4 md:right-1/4 z-[100] lg:hidden pb-safe">
      <nav className="bg-[#151515]/70 backdrop-blur-2xl border border-white/10 rounded-2xl px-2 py-2 flex justify-around items-center w-full shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-12 h-10 transition-all outline-none group gap-0.5"
            >
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon 
                  size={isActive ? 22 : 20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? "text-[#FF7900]" : "text-[#A0A0A0] group-hover:text-white transition-colors"} 
                />
                <span className={`text-[7px] font-bold uppercase tracking-widest transition-colors ${isActive ? "text-[#FF7900]" : "text-[#A0A0A0]"}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
