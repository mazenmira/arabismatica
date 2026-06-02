'use strict';
/**
 * Creates scripts/handoff.zip containing the 4 key deliverable files.
 * Uses Node.js child_process to call PowerShell's Compress-Archive.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(__dirname, 'handoff.zip');

const FILES = [
  'src/data/coins.json',
  'src/data/latest_additions.json',
  'src/components/catalogue/CataloguePage.tsx',
  'src/types/coin.ts',
];

// Verify all files exist
for (const f of FILES) {
  const full = path.join(ROOT, f);
  if (!fs.existsSync(full)) { console.error(`✗ Missing: ${full}`); process.exit(1); }
  const size = (fs.statSync(full).size / 1024).toFixed(1);
  console.log(`  ✓ ${f}  (${size} KB)`);
}

// Remove old zip if exists
if (fs.existsSync(OUT)) fs.unlinkSync(OUT);

// Build PowerShell Compress-Archive command
const pathList = FILES.map(f => `"${path.join(ROOT, f).replace(/\\/g,'/')}""`).join('","');
// Use a temp folder approach: copy files preserving structure into a temp dir, then zip
const tmpDir = path.join(__dirname, '_handoff_tmp');
if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });

for (const f of FILES) {
  const src  = path.join(ROOT, f);
  const dest = path.join(tmpDir, f);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Zip via PowerShell
const cmd = `powershell -Command "Compress-Archive -Path '${tmpDir.replace(/\\/g,'/')}/*' -DestinationPath '${OUT.replace(/\\/g,'/').replace(/'/g,"''")}' -Force"`;
execSync(cmd, { stdio: 'inherit' });

// Cleanup temp
fs.rmSync(tmpDir, { recursive: true });

const zipSize = (fs.statSync(OUT).size / (1024*1024)).toFixed(2);
console.log(`\n✅ handoff.zip created: ${OUT}`);
console.log(`   Size: ${zipSize} MB`);
console.log('   Contains:');
FILES.forEach(f => console.log(`     • ${f}`));
