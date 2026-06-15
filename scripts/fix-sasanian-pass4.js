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
const H    = {
  'apikey': KEY,
  'Authorization': 'Bearer '+KEY,
  'Content-Type': 'application/json',
  'Prefer': 'count=exact,return=minimal',
};

async function patch(filter, body, label) {
  const url = `${BASE}/rest/v1/coins?${filter}`;
  const r = await fetch(url, { method:'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) {
    const t = await r.text();
    try { const msg = JSON.parse(t); console.error(`  ✗ ${label}: ${msg.code} — ${msg.message}`); }
    catch { console.error(`  ✗ ${label}: HTTP ${r.status}`); }
    return 0;
  }
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  console.log(`  ✓ ${label}: ${cnt} rows`);
  return parseInt(cnt)||0;
}

async function distinctSS(col) {
  const vals = {};
  let offset = 0;
  for (;;) {
    const r = await fetch(
      `${BASE}/rest/v1/coins?cc=eq.SS&select=${col}&limit=1000&offset=${offset}`,
      { headers: { 'apikey':KEY,'Authorization':'Bearer '+KEY } }
    );
    const d = await r.json();
    if (!d.length) break;
    for (const row of d) {
      const v = row[col] ?? '(null)';
      vals[v] = (vals[v]||0)+1;
    }
    if (d.length < 1000) break;
    offset += 1000;
  }
  return Object.entries(vals).sort((a,b)=>b[1]-a[1]);
}

async function main() {
  let total = 0;

  console.log('\n══ RULERS final cleanup ═════════════════════════════');

  // Bahram I still in old format "Varhran (Bahram) I, AD 273-276"
  total += await patch(
    'cc=eq.SS&ruler=ilike.*Varhran*I*',
    { ruler: 'Bahram I', ruler_ar: 'بهرام الأول' },
    'Varhran I → Bahram I'
  );

  // Remaining junk rulers (lowercase or denomination-based)
  const junk4 = [
    'bronze / base metal issues',
    'Billon tetradrachm',
    'AR ⅙ drachm (obol)',
    '1st crown, AD 457-c. 458',
    'AE coins or medals, Sharevar reverse',
    'Illegible / incomplete mint signatures',
    'illegible/unclear mints',
    'Depository',
    'DYWAN',
    'AV dinar',
    'AE fals / pashiz',
    'AR drachm-size',
    'Half drachm',
    'Quarter drachm',
    'Drachm',
  ];
  for (const junk of junk4) {
    total += await patch(
      `cc=eq.SS&ruler=eq.${encodeURIComponent(junk)}`,
      { ruler: '' },
      `"${junk.slice(0,35)}" → ''`
    );
  }

  // Catch any remaining lowercase-starting junk (not real ruler names)
  // Real ruler names always start with uppercase letter
  // We can't easily do case-sensitive filter in PostgREST, so target known patterns
  total += await patch('cc=eq.SS&ruler=ilike.bronze*', { ruler: '' }, 'bronze* → empty');
  total += await patch('cc=eq.SS&ruler=ilike.copper*', { ruler: '' }, 'copper* → empty');
  total += await patch('cc=eq.SS&ruler=ilike.illegible*', { ruler: '' }, 'illegible* → empty');
  total += await patch('cc=eq.SS&ruler=ilike.imitation*', { ruler: '' }, 'imitation* → empty');
  total += await patch('cc=eq.SS&ruler=ilike.uncertain*', { ruler: '' }, 'uncertain* → empty');
  total += await patch('cc=eq.SS&ruler=ilike.fake*', { ruler: '' }, 'fake* → empty');
  total += await patch('cc=eq.SS&ruler=ilike.contemporary*', { ruler: '' }, 'contemporary* → empty');

  // ════════════════════════════════════════════════════════
  // FINAL FINAL STATE
  // ════════════════════════════════════════════════════════
  console.log('\n══ FINAL STATE: Rulers (all unique, sorted by count) ════');
  const allRulers = await distinctSS('ruler');
  allRulers.forEach(([k,v]) => console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL STATE: Metals ══════════════════════════════════');
  (await distinctSS('metal')).forEach(([k,v]) => console.log(`  ${v}\t${k}`));

  console.log('\n══ FINAL STATE: Mints (top 30) ══════════════════════════');
  (await distinctSS('mint')).slice(0,30).forEach(([k,v]) => console.log(`  ${v}\t${k}`));

  console.log(`\n══ PASS 4 TOTAL ROWS UPDATED: ${total} ════════════════`);

  // Quick summary of what's clean
  console.log('\n══ SUMMARY ══════════════════════════════════════════════');
  const rulers = await distinctSS('ruler');
  const hasRuler = rulers.filter(([k])=>k!=='').reduce((s,[,v])=>s+v,0);
  const noRuler  = rulers.find(([k])=>k==='')?.[1]||0;
  console.log(`  Rulers: ${hasRuler} coins have identified ruler, ${noRuler} unidentified`);

  const metals = await distinctSS('metal');
  const hasMetal = metals.filter(([k])=>k!=='').reduce((s,[,v])=>s+v,0);
  const noMetal  = metals.find(([k])=>k==='')?.[1]||0;
  console.log(`  Metals: ${hasMetal} coins have metal, ${noMetal} without`);

  const mints = await distinctSS('mint');
  const hasMint = mints.filter(([k])=>k!==''&&k!=='(null)').reduce((s,[,v])=>s+v,0);
  const noMint  = (mints.find(([k])=>k==='')?.[1]||0)+(mints.find(([k])=>k==='(null)')?.[1]||0);
  console.log(`  Mints:  ${hasMint} coins have mint, ${noMint} without`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
