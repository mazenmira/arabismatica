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
  console.log('AUDIT — Islamic mint variants (top 80 by count)');
  console.log('══════════════════════════════════════════════════════════\n');
  const rows = await getAll('mint,mint_ar', 'cc=eq.IS&mint=neq.');
  const counts = {};
  const arMap  = {};
  for (const r of rows) {
    counts[r.mint] = (counts[r.mint] || 0) + 1;
    if (r.mint_ar) arMap[r.mint] = r.mint_ar;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 80);
  console.log('count | mint_ar              | mint');
  console.log('─'.repeat(70));
  for (const [m, c] of sorted) {
    console.log(`${String(c).padStart(5)} | ${(arMap[m] || '').padEnd(20)} | ${m}`);
  }
  return sorted.length;
}

async function consolidate() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('CONSOLIDATION — Mint variants → canonical names');
  console.log('══════════════════════════════════════════════════════════\n');

  let total = 0;

  // ── al-Qahira (Cairo) ─────────────────────────────────────────────
  console.log('al-Qahira variants:');
  const qahiraVariants = ['Cairo', '[al-Qahira]', 'al-Qāhira', 'Qahira', 'al-Qâhira', 'al-Kahira', 'Al-Qahira', 'Kahira'];
  for (const v of qahiraVariants) {
    total += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(v)}`,
      { mint: 'al-Qahira', mint_ar: 'القاهرة' },
      `"${v}" → al-Qahira`
    );
  }

  // ── Nishapur ──────────────────────────────────────────────────────
  console.log('\nNishapur variants:');
  const nishapurVariants = [
    'Naysabur', 'Nīshāpūr', 'Nishapur', 'Nishabur', 'Nishapour',
    'Abarshahr', 'Nīsābūr', 'Nisabur', 'Nīshāpur', 'Neyshabur',
  ];
  for (const v of nishapurVariants) {
    total += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(v)}`,
      { mint: 'Nishapur', mint_ar: 'نيسابور' },
      `"${v}" → Nishapur`
    );
  }

  // ── Damascus ──────────────────────────────────────────────────────
  console.log('\nDamascus variants:');
  const damascusVariants = ['Dimashq', 'دمشق', 'Dimashk', 'Dimasq', 'Damascus (Dimashq)', 'Dimišq'];
  for (const v of damascusVariants) {
    total += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(v)}`,
      { mint: 'Damascus', mint_ar: 'دمشق' },
      `"${v}" → Damascus`
    );
  }

  // ── Azerbaijan ────────────────────────────────────────────────────
  console.log('\nAzerbaijan variants:');
  const azerbaijanVariants = [
    'Adharbayjan', 'Adharbayjān', 'Atropatene', 'Azerbayjan',
    'Adherbaygan', 'Aderbaigan', 'Azerbaijan (Adharbayjan)',
  ];
  for (const v of azerbaijanVariants) {
    total += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(v)}`,
      { mint: 'Azerbaijan', mint_ar: 'أذربيجان' },
      `"${v}" → Azerbaijan`
    );
  }

  // ── Merv (Marw) ───────────────────────────────────────────────────
  console.log('\nMerv variants:');
  const mervVariants = ['Marw', 'Mary', 'Marv', 'MLW', 'Marw (Merv)', 'Merw', 'Mery'];
  for (const v of mervVariants) {
    total += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(v)}`,
      { mint: 'Merv', mint_ar: 'مرو' },
      `"${v}" → Merv`
    );
  }

  console.log(`\nConsolidation total: ${total} rows updated`);
  return total;
}

async function stripBrackets() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('BRACKET REMOVAL — strip [] and () from mint names');
  console.log('══════════════════════════════════════════════════════════\n');

  // Fetch all IS mints with brackets
  const rows = await getAll('id,mint,mint_ar', 'cc=eq.IS&mint=neq.');
  const bracketed = rows.filter(r => /[\[\]\(\)]/.test(r.mint));

  console.log(`Found ${bracketed.length} mints containing brackets.`);

  // Build unique mint→cleaned mapping
  const seen = new Map();
  for (const r of bracketed) {
    const cleaned = r.mint
      .replace(/^\[|\]$/g, '')        // strip leading [ or trailing ]
      .replace(/\s*\([^)]*\)/g, '')   // strip parenthetical suffixes like (city)
      .replace(/\s*\[[^\]]*\]/g, '')  // strip bracketed qualifiers
      .trim();
    if (cleaned && cleaned !== r.mint) {
      seen.set(r.mint, cleaned);
    }
  }

  console.log(`Distinct bracket patterns to clean: ${seen.size}`);
  let total = 0;
  for (const [original, cleaned] of seen) {
    total += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(original)}`,
      { mint: cleaned },
      `"${original}" → "${cleaned}"`
    );
  }
  console.log(`\nBracket removal total: ${total} rows updated`);
  return total;
}

async function finalCount() {
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const distinct = new Set(rows.map(r => r.mint));
  console.log(`\n✅ Final distinct Islamic mint count: ${distinct.size}`);
}

async function main() {
  await audit();
  await consolidate();
  await stripBrackets();
  await finalCount();
  console.log('\n✅ Task 1 complete.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
