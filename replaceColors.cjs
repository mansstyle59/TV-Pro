const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/sky-500/g, 'brand-500');
      content = content.replace(/sky-400/g, 'brand-500');
      content = content.replace(/sky-600/g, 'brand-600');
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('src');
console.log('Replaced sky-* with brand-*');
