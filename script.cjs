const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startIndex = code.indexOf('{/* SPORTS TAB */}');
const endIndex = code.indexOf('{/* FAVORIS TAB */}');

if (startIndex > -1 && endIndex > -1) {
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex);
  
  const replacement = `{/* SPORTS TAB */}
            <div className={activeTab === "sports" ? "animate-tab-fade-in block" : "hidden"}>
              <SportsCenter channels={categorisedList} onPlayChannel={(ch) => { handleChannelSelect(ch); setActiveTab("player"); }} />
            </div>

            `;
            
  fs.writeFileSync('src/App.tsx', before + replacement + after);
  console.log("Successfully replaced SPORTS TAB");
} else {
  console.error("Could not find start or end index");
}
