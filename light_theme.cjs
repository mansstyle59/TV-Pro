const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if(isDirectory) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(path.join(dir, f));
    }
  });
}

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalDetails = content;
    
    // Backgrounds
    content = content.replace(/bg-neutral-950/g, 'bg-gray-50');
    content = content.replace(/bg-\[\#0B0B0B\]/g, 'bg-gray-100');
    content = content.replace(/bg-\[\#050505\]/g, 'bg-white');
    content = content.replace(/bg-\[\#0e0e0e\]/g, 'bg-gray-50');
    content = content.replace(/bg-black/g, 'bg-white');
    content = content.replace(/bg-neutral-900/g, 'bg-gray-100');
    content = content.replace(/bg-neutral-800/g, 'bg-gray-200');
    content = content.replace(/bg-white\/5/g, 'bg-black/5');
    content = content.replace(/bg-white\/10/g, 'bg-black/10');
    content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-black/5');
    content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-black/5');
    content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-black/5');
    
    // Text colors
    content = content.replace(/text-white/g, 'text-gray-900');
    content = content.replace(/text-neutral-350/g, 'text-gray-700');
    content = content.replace(/text-neutral-300/g, 'text-gray-700');
    content = content.replace(/text-neutral-400/g, 'text-gray-600');
    content = content.replace(/text-neutral-500/g, 'text-gray-500');
    
    // Borders
    content = content.replace(/border-white\/5/g, 'border-gray-200');
    content = content.replace(/border-white\/10/g, 'border-gray-300');
    content = content.replace(/border-white\/\[0\.03\]/g, 'border-gray-200');
    content = content.replace(/border-white\/\[0\.04\]/g, 'border-gray-200');
    content = content.replace(/border-white\/\[0\.05\]/g, 'border-gray-200');
    content = content.replace(/border-white\/\[0\.1\]/g, 'border-gray-300');
    
    if (content !== originalDetails) {
      fs.writeFileSync(filePath, content);
    }
  }
});
console.log('Theme lightened!');
