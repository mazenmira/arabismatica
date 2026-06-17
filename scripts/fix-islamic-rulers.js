'use strict';
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  const f = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(f)) {
    for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = l.match(/^([^#=]+)=(.*)/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H    = {
  'apikey':        KEY,
  'Authorization': 'Bearer ' + KEY,
  'Content-Type':  'application/json',
  'Prefer':        'count=exact,return=minimal',
};

async function patch(filter, body, label) {
  const r = await fetch(`${BASE}/rest/v1/coins?${filter}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  const cr  = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  if (!r.ok) { const t = await r.text(); console.error(`  ✗ ${label}: ${t.slice(0, 200)}`); return 0; }
  const n = parseInt(cnt) || 0;
  console.log(`  ✓ ${label}: ${n} rows`);
  return n;
}

async function getAll(select, filter) {
  let all = [], offset = 0;
  while (true) {
    const r = await fetch(
      `${BASE}/rest/v1/coins?select=${select}&${filter}&limit=1000&offset=${offset}`,
      { headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY } }
    );
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) break;
    all = all.concat(d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function audit() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('AUDIT — Islamic ruler variants (top 50 by count)');
  console.log('══════════════════════════════════════════════════════════\n');
  const rows = await getAll('ruler,ruler_ar', 'cc=eq.IS&ruler=neq.');
  const counts = {};
  const arMap  = {};
  for (const r of rows) {
    counts[r.ruler] = (counts[r.ruler] || 0) + 1;
    if (r.ruler_ar) arMap[r.ruler] = r.ruler_ar;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 50);
  console.log('count | ruler_ar                    | ruler');
  console.log('─'.repeat(80));
  for (const [m, c] of sorted) {
    console.log(`${String(c).padStart(5)} | ${(arMap[m] || '').padEnd(27)} | ${m}`);
  }
  return sorted;
}

async function consolidateAbdAlMalik() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('CONSOLIDATION — Abd al-Malik variants');
  console.log('══════════════════════════════════════════════════════════\n');

  const variants = [
    'Abd al-Malik',
    'ʿAbd al-Malik',
    'Abd al-Malik b. Marwan',
    'Abd al-Malik ibn Marwan',
    "'Abd al-Malik b. Marwān",
    "'Abd al-Malik ibn Marwān",
    'Abd ul-Malik',
    'Abdul-Malik',
    'Abdel Malik ibn Marwan',
  ];

  let total = 0;
  for (const v of variants) {
    total += await patch(
      `cc=eq.IS&ruler=eq.${encodeURIComponent(v)}`,
      { ruler: 'Abd al-Malik ibn Marwan', ruler_ar: 'عبد الملك بن مروان' },
      `"${v}" → Abd al-Malik ibn Marwan`
    );
  }
  console.log(`\nAbd al-Malik total: ${total} rows updated`);
  return total;
}

async function clearJunkRulers() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('JUNK CLEARING — ruler values that are not real names');
  console.log('══════════════════════════════════════════════════════════\n');

  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const junkPatterns = [
    /^AH\s+\d/i,              // "AH 41" — date strings
    /^guerrero$/i,             // literal junk
    /^kirat$/i,
    /^drachm$/i,
    /^\[/,                     // leading bracket
    /^\d/,                     // leading digit
    /^mint$/i,
    /^help\s*id$/i,
    /^help\s*identify/i,
    /^\?+$/,                   // just question marks
    /^unknown$/i,
  ];

  const shortJunk = rows
    .map(r => r.ruler)
    .filter(r => r && r.length < 3 && r.trim().length < 3);

  const patternJunk = rows
    .map(r => r.ruler)
    .filter(r => r && junkPatterns.some(p => p.test(r.trim())));

  const allJunk = [...new Set([...shortJunk, ...patternJunk])];
  console.log(`Found ${allJunk.length} junk ruler values to clear.`);

  let total = 0;
  for (const v of allJunk) {
    total += await patch(
      `cc=eq.IS&ruler=eq.${encodeURIComponent(v)}`,
      { ruler: '' },
      `"${v}" → ''`
    );
  }
  console.log(`\nJunk clearing total: ${total} rows updated`);
  return total;
}

async function trimTrailingPunctuation() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('TRIM — strip trailing punctuation from ruler names');
  console.log('══════════════════════════════════════════════════════════\n');

  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const needsTrim = rows
    .map(r => r.ruler)
    .filter(r => r && /[,;.:]+$/.test(r));

  const seen = new Map();
  for (const r of needsTrim) {
    const cleaned = r.replace(/[,;.:]+$/, '').trim();
    if (cleaned && cleaned !== r) seen.set(r, cleaned);
  }

  console.log(`Found ${seen.size} ruler names with trailing punctuation.`);
  let total = 0;
  for (const [original, cleaned] of seen) {
    total += await patch(
      `cc=eq.IS&ruler=eq.${encodeURIComponent(original)}`,
      { ruler: cleaned },
      `"${original}" → "${cleaned}"`
    );
  }
  console.log(`\nTrim total: ${total} rows updated`);
  return total;
}

async function finalCount() {
  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const distinct = new Set(rows.map(r => r.ruler));
  console.log(`\n✅ Final distinct valid Islamic ruler count: ${distinct.size}`);
}

async function main() {
  await audit();
  await consolidateAbdAlMalik();
  await clearJunkRulers();
  await trimTrailingPunctuation();
  await finalCount();
  console.log('\n✅ Task 2 complete.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
