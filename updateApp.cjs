const fs = require("fs");
let app = fs.readFileSync("src/App.tsx", "utf-8");
const startTag = `          ) : activeTab === "sports" ? (`;
const endTag = `          ) : activeTab === "profil" ? (`;
const startIndex = app.indexOf(startTag);
const endIndex = app.indexOf(endTag);
if (startIndex !== -1 && endIndex !== -1) {
  const newFav = `          ) : activeTab === "favoris" ? (
            <motion.div 
              key="favoris"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-16 sm:space-y-24 pb-40 min-h-[60vh] max-w-7xl mx-auto px-6 pt-12"
            >
               <div className="flex flex-col space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#1E88FF]/10 rounded-2xl flex items-center justify-center border border-[#1E88FF]/20">
                        <Heart size={24} className="text-[#1E88FF]" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Vos Favoris</h2>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#A0A0A0]">Listes de vos cha\xEEnes pr\xE9f\xE9r\xE9es</p>
                     </div>
                  </div>
                  
                  {favoritesList.length > 0 ? (
                    <ChannelGrid 
                       title={\`\${favoritesList.length} cha\xEEnes sauvegard\xE9es\`}
                       channels={favoritesList} 
                       onChannelSelect={handleChannelSelect}
                       selectedChannelId={selectedChannel?.id}
                    />
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[2rem] border border-[#151515] bg-[#0B0B0B]">
                       <Heart size={48} className="text-[#151515]" />
                       <div>
                          <p className="text-lg font-bold text-white uppercase tracking-tight">Aucun favori</p>
                          <p className="text-[10px] uppercase tracking-widest text-[#A0A0A0] mt-1">Ajoutez des cha\xEEnes avec le bouton coeur</p>
                       </div>
                    </div>
                  )}
               </div>
            </motion.div>
`;
  app = app.substring(0, startIndex) + newFav + app.substring(endIndex);
}
fs.writeFileSync("src/App.tsx", app);
console.log("Replaced sports with favoris");
