'use strict';
const fs = require('fs');
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
const H    = { 'apikey': KEY, 'Authorization': 'Bearer '+KEY, 'Content-Type': 'application/json' };

async function getAll(col) {
  const rows = [];
  let from = 0;
  for (;;) {
    const r = await fetch(`${BASE}/rest/v1/coins?cc=eq.SS&select=${col}&limit=2000&offset=${from}`, { headers: H });
    const d = await r.json();
    if (!d.length) break;
    rows.push(...d);
    if (d.length < 2000) break;
    from += 2000;
  }
  return rows;
}

function count(rows, col) {
  const c = {};
  for (const r of rows) c[r[col]||'(null)'] = (c[r[col]||'(null)']||0)+1;
  return Object.entries(c).sort((a,b)=>b[1]-a[1]);
}

async function main() {
  console.log('Fetching Sasanian metal data...');
  const metals = await getAll('metal');
  console.log('\n=== METALS ('+metals.length+' total) ===');
  count(metals,'metal').forEach(([k,v])=>console.log(v+'\t'+k));

  console.log('\nFetching Sasanian ruler data...');
  const rulers = await getAll('ruler');
  console.log('\n=== RULERS (top 40) ===');
  count(rulers,'ruler').slice(0,40).forEach(([k,v])=>console.log(v+'\t'+k));

  console.log('\nFetching Sasanian mint data...');
  const mints = await getAll('mint');
  console.log('\n=== MINTS (top 50) ===');
  count(mints,'mint').slice(0,50).forEach(([k,v])=>console.log(v+'\t'+k));
}

main().catch(e => { console.error(e); process.exit(1); });
