/**
 * node scripts/extract-coins.js /path/to/index.html
 * Extracts the D=[...] coin array → src/data/coins.json
 */
const fs = require('fs');
const path = require('path');
const htmlPath = process.argv[2] || '../public/index.html';
if (!fs.existsSync(htmlPath)) { console.error('File not found:', htmlPath); process.exit(1); }
const html = fs.readFileSync(htmlPath, 'utf-8');
const start = html.indexOf('const D=[');
const end = html.indexOf('];', start) + 2;
if (start === -1) { console.error('const D=[ not found'); process.exit(1); }
let coins;
try { coins = eval('(' + html.slice(start).replace('const D=','') + ')'); } catch(e) { console.error('Parse error',e); process.exit(1); }
const out = path.join(__dirname,'../src/data/coins.json');
fs.mkdirSync(path.dirname(out), {recursive:true});
fs.writeFileSync(out, JSON.stringify(coins));
console.log(`Extracted ${coins.length} coins → src/data/coins.json`);
