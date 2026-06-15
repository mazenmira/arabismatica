'use strict';
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  const f = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(f)) {
    for (const l of fs.readFileSync(f,'utf8').split('\n')) {
      const m = l.match(/^([^#=]+)=(.*)/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g,'');
    }
  }
}
loadEnv();

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  // Get distinct dyn values for IS coins
  let all = [], offset = 0;
  while (true) {
    const r = await fetch(
      `${BASE}/rest/v1/coins?select=dyn&cc=eq.IS&dyn=not.is.null&limit=1000&offset=${offset}`,
      { headers: { 'apikey': KEY, 'Authorization': 'Bearer '+KEY } }
    );
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) break;
    all = all.concat(d);
    if (d.length < 1000) break;
    offset += 1000;
  }

  const counts = {};
  for (const r of all) counts[r.dyn] = (counts[r.dyn] || 0) + 1;
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);

  console.log(`\nDistinct dyn values in IS coins (${all.length} total rows):\n`);
  for (const [d,c] of sorted) {
    console.log(`  ${c.toString().padStart(6)} | ${d}`);
  }
  console.log(`\nTotal distinct dynasties: ${sorted.length}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
