import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative w-24 h-24 bg-brand-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(255,121,0,0.3)]">
              <img src="./pwa-192x192.svg" alt="App Icon" className="w-14 h-14" />
              
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 0px rgba(255,121,0,0)", 
                    "0 0 20px rgba(255,121,0,0.5)", 
                    "0 0 0px rgba(255,121,0,0)"
                  ] 
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-3xl"
              />
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-gray-900 font-black text-xl tracking-widest uppercase"
            >
              LIVE TV
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
