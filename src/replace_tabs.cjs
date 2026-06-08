const fs = require('fs');
const filePath = 'src/App.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Target block at the ending of App.tsx main tabs
const targetText = `             </motion.div>
           ) : (
             <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <HelpCircle size={48} className="text-neutral-800" />
                <p className="text-neutral-500 font-black uppercase tracking-widest text-xs tracking-tight">Section en développement</p>
             </div>
           )}
         </AnimatePresence>
       </main>`;

const normalizedTarget = targetText.replace(/\r?\n/g, '\n');
const normalizedContent = content.replace(/\r?\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const replacementText = `              </div>
            </div>

            {/* UNKNOWN TAB FALLBACK */}
            <div className={!["accueil", "recherche", "sports", "favoris", "admin", "profil"].includes(activeTab) ? "animate-tab-fade-in block" : "hidden"}>
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                 <HelpCircle size={48} className="text-neutral-800" />
                 <p className="text-neutral-500 font-black uppercase tracking-widest text-xs tracking-tight">Section en développement</p>
              </div>
            </div>
          </>
        )}
      </main>`.replace(/\r?\n/g, '\n');

  const linesep = content.includes('\r\n') ? '\r\n' : '\n';
  const newContent = normalizedContent.replace(normalizedTarget, replacementText).split('\n').join(linesep);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('SUCCESS: Persistent tabs ending refactored and balanced successfully.');
} else {
  console.error('ERROR: Could not find target tags block at lines 3550-3561.');
}
