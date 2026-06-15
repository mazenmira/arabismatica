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
  const r = await fetch(`${BASE}/rest/v1/coins?${filter}`, { method:'PATCH', headers: H, body: JSON.stringify(body) });
  const cr = r.headers.get('content-range') || '';
  const cnt = cr.split('/')[1] || '?';
  if (!r.ok) { const t=await r.text(); console.error(`  ✗ ${label}: ${t.slice(0,120)}`); return 0; }
  console.log(`  ✓ ${label}: ${cnt} rows`);
  return parseInt(cnt) || 0;
}

async function getAll(filter) {
  let all = [], offset = 0;
  while (true) {
    const r = await fetch(`${BASE}/rest/v1/coins?${filter}&limit=1000&offset=${offset}`, {
      headers: { 'apikey': KEY, 'Authorization': 'Bearer '+KEY }
    });
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) break;
    all = all.concat(d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return all;
}

// ── TASK 1: Fix remaining Sasanian mints ─────────────────────────────────────

async function task1_sasanianMints() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TASK 1 — Fix remaining Sasanian mints');
  console.log('═══════════════════════════════════════════════════════');

  // Audit current state
  const rows = await getAll('select=mint&cc=eq.SS&mint=not.is.null');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  console.log(`\nCurrent mint distribution (${rows.length} coins with mint):`);
  for (const [m,c] of sorted) console.log(`  ${m}: ${c}`);

  // Mappings
  const MINT_MAPS = [
    // value_in_db → new_city_name
    // BBA → Ctesiphon (capital, common)
    ['BBA',  'Ctesiphon'],
    // MLW, MLWY → Merv
    ['MLW',  'Merv'],
    ['MLWY', 'Merv'],
    // ART → Ardeshir-Khwarrah (a.k.a. Firuzabad)
    ['ART',  'Ardeshir-Khwarrah'],
    // AS, SKS, SKST → Sakastan
    ['AS',   'Sakastan'],
    ['SKS',  'Sakastan'],
    ['SKST', 'Sakastan'],
    // ST, STH, STHR → Stakhr
    ['ST',   'Stakhr'],
    ['STH',  'Stakhr'],
    ['STHR', 'Stakhr'],
    // HL, HLY, HLYDY → Hulwan
    ['HL',   'Hulwan'],
    ['HLY',  'Hulwan'],
    ['HLYDY','Hulwan'],
    // GW, GO, GWK, GWGN → Gorgan
    ['GW',   'Gorgan'],
    ['GO',   'Gorgan'],
    ['GWK',  'Gorgan'],
    ['GWGN', 'Gorgan'],
    // KSH, KSh, KA → Kashvin (Qazvin)
    ['KSH',  'Kashvin'],
    ['KSh',  'Kashvin'],
    ['KA',   'Kashvin'],
    // AZ, AZR → Azerbaijan
    ['AZ',   'Azerbaijan'],
    ['AZR',  'Azerbaijan'],
    // AW, ARN → Aran (Caucasian Albania)
    ['ARN',  'Aran'],
    // WH → Gundeshapur (already may be mapped, but just in case)
    ['WH',   'Gundeshapur'],
    ['WYHC', 'Gundeshapur'],
    // Additional common ones
    ['YHWD', 'Yahudiyya'],
    ['NHW',  'Nihavand'],
    ['RJ',   'Ray'],
    ['MY',   'Maiyafariqin'],
    ['WNDAD', 'Veh-Ardashir'],
    ['WNDADAG', 'Veh-Ardashir'],
    ['GBY',  'Jey'],
    ['GLFT', 'Jundishapur'],
    // DA → Darabgird (already may be mapped)
    ['DA',   'Darabgird'],
    // WYH → Veh-Ardashir
    ['WYH',  'Veh-Ardashir'],
  ];

  console.log('\nApplying mint mappings...');
  let total = 0;
  for (const [from, to] of MINT_MAPS) {
    if (!counts[from]) continue; // skip if not present
    const n = await patch(
      `cc=eq.SS&mint=eq.${encodeURIComponent(from)}`,
      { mint: to },
      `${from} → ${to}`
    );
    total += n;
  }

  // Clear unresolvable mints (short codes, quoted strings, single chars, etc.)
  // These are values that remain after above mappings — short codes ≤3 chars that weren't mapped
  // We'll set them to NULL
  const JUNK_PATTERNS = [
    // Exact values that are clearly unresolvable
    'NM (unidentified)', // Already set this — leave as is, it's informative
  ];

  // Clear remaining short abbreviations (1-3 chars not yet mapped)
  const reCheck = await getAll('select=mint&cc=eq.SS&mint=not.is.null');
  const reCounts = {};
  for (const r of reCheck) reCounts[r.mint] = (reCounts[r.mint] || 0) + 1;

  const SHORT_CODE_PATTERN = /^[A-Z]{1,4}$/;
  const QUOTED_PATTERN = /^["'].*["']$/;
  const SINGLE_CHAR = /^.$/;

  const toNull = [];
  for (const [m] of Object.entries(reCounts)) {
    if (
      (SHORT_CODE_PATTERN.test(m) && !['Merv','Ray','Amul'].includes(m)) ||
      QUOTED_PATTERN.test(m) ||
      SINGLE_CHAR.test(m)
    ) {
      toNull.push(m);
    }
  }

  if (toNull.length) {
    console.log(`\nClearing ${toNull.length} unresolvable mint codes:`, toNull.join(', '));
    for (const v of toNull) {
      await patch(
        `cc=eq.SS&mint=eq.${encodeURIComponent(v)}`,
        { mint: null },
        `CLEAR: ${v}`
      );
    }
  }

  console.log(`\nTask 1 complete. Total rows updated: ${total}`);
}

// ── TASK 2: Fix Islamic mint_ar ──────────────────────────────────────────────

async function task2_islamicMintAr() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TASK 2 — Fix Islamic mint Arabic names');
  console.log('═══════════════════════════════════════════════════════');

  const MINT_AR_MAP = [
    ['Baghdad',      'بغداد'],
    ['Damascus',     'دمشق'],
    ['Basra',        'البصرة'],
    ['al-Basra',     'البصرة'],
    ['Kufa',         'الكوفة'],
    ['al-Kufa',      'الكوفة'],
    ['Wasit',        'واسط'],
    ['Misr',         'مصر'],
    ['al-Qahira',    'القاهرة'],
    ['Cairo',        'القاهرة'],
    ['Aleppo',       'حلب'],
    ['Alexandria',   'الإسكندرية'],
    ['Nishapur',     'نيسابور'],
    ['Samarqand',    'سمرقند'],
    ['Bukhara',      'بخارى'],
    ['al-Raqqa',     'الرقة'],
    ['Mosul',        'الموصل'],
    ['Seville',      'إشبيلية'],
    ['Cordoba',      'قرطبة'],
    ['Medina',       'المدينة المنورة'],
    ['Mecca',        'مكة المكرمة'],
    ['Tabriz',       'تبريز'],
    ['Herat',        'هراة'],
    ['Ghazna',       'غزنة'],
    ['al-Andalus',   'الأندلس'],
    ['Ifriqiya',     'إفريقية'],
    ['Qayrawan',     'القيروان'],
    ['Fes',          'فاس'],
    // Additional common ones
    ['Dimashq',      'دمشق'],
    ['Madinat al-Salam', 'مدينة السلام'],
    ['Madinat al-Salam (Baghdad)', 'مدينة السلام'],
    ['al-Fustat',    'الفسطاط'],
    ['Fustat',       'الفسطاط'],
    ['Sijilmasa',    'سجلماسة'],
    ['al-Muhammadiya', 'المحمدية'],
    ['Rayy',         'الري'],
    ['Rayy (al-Muhammadiya)', 'الري'],
    ['Shiraz',       'شيراز'],
    ['Isfahan',      'أصفهان'],
    ['Isfara\'in',   'إسفراين'],
    ['Hamadan',      'همدان'],
    ['Merv',         'مرو'],
    ['Tiflis',       'تفليس'],
    ['Ardabil',      'أردبيل'],
    ['Mayyafariqin', 'ميافارقين'],
    ['Diyarbakr',    'ديار بكر'],
    ['Amul',         'آمل'],
  ];

  console.log('\nApplying mint_ar mappings...');
  let total = 0;
  for (const [mint, mint_ar] of MINT_AR_MAP) {
    const n = await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(mint)}&mint_ar=is.null`,
      { mint_ar },
      `${mint} → ${mint_ar}`
    );
    total += n;
  }
  console.log(`\nTask 2 complete. Total rows updated: ${total}`);
}

// ── TASK 3: Clear "?" mint and ruler values across ALL catalogues ─────────────

async function task3_clearJunk() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('TASK 3 — Clear junk mint/ruler values');
  console.log('═══════════════════════════════════════════════════════');

  const JUNK_MINTS = ['?', '??', '—', '-', '--', 'unknown', 'Unknown', 'n/a', 'N/A'];
  // ruler NOT NULL constraint — use '' instead of null
  const JUNK_RULERS = ['?', '??', '—', '-', '--', 'unknown', 'Unknown', 'n/a', 'N/A', 'Help ID', 'help ID'];

  console.log('\nClearing junk mints → NULL...');
  let total = 0;
  for (const v of JUNK_MINTS) {
    const n = await patch(
      `mint=eq.${encodeURIComponent(v)}`,
      { mint: null },
      `mint="${v}" → NULL`
    );
    total += n;
  }

  console.log('\nClearing junk rulers → "" (empty string, NOT NULL constraint)...');
  for (const v of JUNK_RULERS) {
    const n = await patch(
      `ruler=eq.${encodeURIComponent(v)}`,
      { ruler: '' },
      `ruler="${v}" → ""`
    );
    total += n;
  }

  // Also clear empty string rulers that are meaningless (just spaces)
  const n2 = await patch(
    `ruler=eq.%20`,
    { ruler: '' },
    `ruler=" " → ""`
  );
  total += n2;

  console.log(`\nTask 3 complete. Total rows updated: ${total}`);
}

async function main() {
  await task1_sasanianMints();
  await task2_islamicMintAr();
  await task3_clearJunk();
  console.log('\n✅ All data tasks complete.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
