'use strict';
// Data-only session: Islamic mints + rulers consolidation
// PostgREST approach: exact PATCH for named variants, fetch+transform for regex ops
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
const RH   = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };

async function patch(filter, body, label) {
  const r = await fetch(`${BASE}/rest/v1/coins?${filter}`, {
    method: 'PATCH', headers: H, body: JSON.stringify(body),
  });
  const cnt = (r.headers.get('content-range') || '').split('/')[1] || '?';
  if (!r.ok) { const t = await r.text(); console.error(`  ✗ ${label}: ${t.slice(0, 200)}`); return 0; }
  const n = parseInt(cnt) || 0;
  if (n > 0) console.log(`  ✓ ${label}: ${n} rows`);
  return n;
}

async function getAll(select, filter) {
  let all = [], offset = 0;
  while (true) {
    const r = await fetch(
      `${BASE}/rest/v1/coins?select=${select}&${filter}&limit=1000&offset=${offset}`,
      { headers: RH }
    );
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) break;
    all = all.concat(d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return all;
}

// Patch all rows matching a specific exact mint value
async function patchMint(cc, oldVal, newMint, newMintAr, label) {
  return patch(
    `cc=eq.${cc}&mint=eq.${encodeURIComponent(oldVal)}`,
    { mint: newMint, mint_ar: newMintAr },
    label || `"${oldVal}" → "${newMint}"`
  );
}

// Patch all rows matching a list of exact mint values
async function patchMintList(cc, variants, newMint, newMintAr) {
  let total = 0;
  for (const v of variants) {
    total += await patchMint(cc, v, newMint, newMintAr);
  }
  return total;
}

// ─── TASK 1: Islamic Mints ────────────────────────────────────────────────────

async function task1_aleppo() {
  // Fetch all IS mints that look like Halab/Aleppo to get exact values
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  // Variants to consolidate → 'Aleppo'
  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase().trim();
    return ['halab', 'hala', 'aleppo', 'ḥalab', 'halap', 'haleb',
            'halab?', 'halab al-mahrusa', 'halab al-Mahrusa',
            'haleb', 'halap'].includes(lm)
      || /^halab[\s?!]/.test(lm)
      || lm === 'aleppo';
  });
  console.log(`\nAleppo/Halab variants (${variants.length}):`);
  let n = await patchMintList('IS', variants, 'Aleppo', 'حلب');
  console.log(`  → Aleppo total: ${n} rows`);
  return n;
}

async function task1_hamadan() {
  const variants = [
    'Hamadan', 'Hamadhan', 'Hamathan', 'Hamadān', 'Hmadān',
    'Hamadhan', 'AHM', 'Ahmadan', 'hamadan',
  ];
  console.log('\nHamadan variants:');
  const n = await patchMintList('IS', variants, 'Hamadan', 'همدان');
  console.log(`  → Hamadan total: ${n} rows`);
  return n;
}

async function task1_herat() {
  const variants = [
    'Herat', 'Harāt', 'Harat', 'Herāt', 'Herât', 'Harát',
    'Haråt', 'Harât', 'Herāt', 'HLA', 'hr',
    'Madinat Harat', 'Madinat Harat (Hirat)',
  ];
  console.log('\nHerat variants:');
  const n = await patchMintList('IS', variants, 'Herat', 'هراة');
  console.log(`  → Herat total: ${n} rows`);
  return n;
}

async function task1_harran() {
  const variants = [
    'Harran', 'Harrān', 'Harrán', 'Harrân', 'Haran', 'Harran',
    'Harran?', 'Harran al-mahrusa',
  ];
  console.log('\nHarran variants:');
  const n = await patchMintList('IS', variants, 'Harran', 'حران');
  console.log(`  → Harran total: ${n} rows`);
  return n;
}

async function task1_hims() {
  // Hims (Homs) — fetch all IS mints and find matching ones
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase().trim();
    return lm === 'hims' || lm === 'homs' || lm === 'ḥimṣ' || lm === 'himș'
      || /^hims[\s?!]/.test(lm) || /^homs[\s?!]/.test(lm);
  });
  console.log(`\nHims/Homs variants (${variants.length}):`);
  const n = await patchMintList('IS', variants, 'Hims', 'حمص');
  console.log(`  → Hims total: ${n} rows`);
  return n;
}

async function task1_hamah() {
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  // Only exact matches; bracket variants already stripped by previous script
  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase().trim();
    return lm === 'hamah' || lm === 'hama' || lm === 'ḥamāh' || lm === 'hamāh'
      || lm === 'hamah?' || /^hamah\s/.test(lm);
  });
  console.log(`\nHamah variants (${variants.length}):`);
  const n = await patchMintList('IS', variants, 'Hamah', 'حماة');
  console.log(`  → Hamah total: ${n} rows`);
  return n;
}

async function task1_hijaz() {
  const variants = ['Hijaz', 'Ḥijāz', 'Hejaz', 'al-Hijaz', 'Al-Hijaz'];
  console.log('\nHijaz variants:');
  const n = await patchMintList('IS', variants, 'Hijaz', 'الحجاز');
  console.log(`  → Hijaz total: ${n} rows`);
  return n;
}

async function task1_akka() {
  const variants = ["Akka", "Akka'", "'Akka", "Acre", "Akko", "Acco", "Akkā"];
  console.log('\nAkka (Acre) variants:');
  const n = await patchMintList('IS', variants, 'Akka', 'عكا');
  console.log(`  → Akka total: ${n} rows`);
  return n;
}

async function task1_andalus() {
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase().trim();
    return lm === 'al-andalus' || lm === 'andalus' || lm === 'alandalus'
      || lm === 'al andalus' || m === 'الأندلس';
  });
  console.log(`\nal-Andalus variants (${variants.length}):`);
  const n = await patchMintList('IS', variants, 'al-Andalus', 'الأندلس');
  console.log(`  → al-Andalus total: ${n} rows`);
  return n;
}

async function task1_fustat() {
  const variants = [
    'al-Fustat', 'Fustat', 'al Fustat', 'Fusṭāṭ', 'al-Fusṭāṭ',
    'al-Fustat (Old Cairo)', 'Fustat (al-Qahira)',
  ];
  console.log('\nal-Fustat variants:');
  const n = await patchMintList('IS', variants, 'al-Fustat', 'الفسطاط');
  console.log(`  → al-Fustat total: ${n} rows`);
  return n;
}

async function task1_qahira_cleanup() {
  // Catch any remaining al-Qahira variants still in DB after previous run
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase();
    return (lm.includes('qahira') || lm.includes('cairo') || lm.includes('kairo'))
      && !['al-Qahira'].includes(m);
  });
  if (variants.length === 0) { console.log('\nal-Qahira: already clean'); return 0; }
  console.log(`\nal-Qahira remaining variants (${variants.length}):`);
  const n = await patchMintList('IS', variants, 'al-Qahira', 'القاهرة');
  console.log(`  → al-Qahira total: ${n} rows`);
  return n;
}

async function task1_merv_cleanup() {
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase().trim();
    return (lm === 'marw' || lm === 'merv' || lm === 'mary' || lm === 'māryv' || lm === 'marv'
      || lm.startsWith('marw') || lm.startsWith('merv'))
      && m !== 'Merv';
  });
  if (variants.length === 0) { console.log('\nMerv: already clean'); return 0; }
  console.log(`\nMerv remaining variants (${variants.length}):`);
  const n = await patchMintList('IS', variants, 'Merv', 'مرو');
  console.log(`  → Merv total: ${n} rows`);
  return n;
}

async function task1_nishapur_cleanup() {
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase();
    return (lm.includes('abarshahr') || lm.includes('naysabur') || lm.includes('abaršahr')
      || lm.includes('abarqubadh') || lm.includes('nishapur') || lm.includes('nīshāpūr'))
      && m !== 'Nishapur';
  });
  if (variants.length === 0) { console.log('\nNishapur: already clean'); return 0; }
  console.log(`\nNishapur remaining variants (${variants.length}):`);
  const n = await patchMintList('IS', variants, 'Nishapur', 'نيسابور');
  console.log(`  → Nishapur total: ${n} rows`);
  return n;
}

async function task1_clearVague() {
  // Clear truly vague non-mint values
  const vagueExact = ['Iran', '(Iran)', 'Tanukh', 'tanukh', 'off flan', 'off-flan',
                      'no mint', 'No mint', 'No Mint', 'NM', 'nm', 'n.m.',
                      'Mint Missing', 'mint missing', 'mintless', 'without mint',
                      'not clear', 'uncertain', 'unclear', 'unknown', 'lost',
                      'missing', 'blundered', 'posthumous issue', 'n/m', 'N/M',
                      'MM', 'ND', 'nd', '?', '??'];
  console.log('\nClearing vague/junk mints:');
  let n = 0;
  for (const v of vagueExact) {
    n += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(v)}`,
      { mint: '' },
      `"${v}" → ''`
    );
  }

  // Clear AH-date mints
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const dateMints = [...new Set(rows.map(r => r.mint).filter(m => /^AH\s*\d/i.test(m.trim()) && m.length < 12))];
  for (const v of dateMints) {
    n += await patch(`cc=eq.IS&mint=eq.${encodeURIComponent(v)}`, { mint: '' }, `date-mint "${v}" → ''`);
  }
  console.log(`  → vague/junk clear total: ${n} rows`);
  return n;
}

async function task1_amasya() {
  const variants = ['(Amasya)', 'Amasya', 'Amaseia'];
  console.log('\nAmasya variants:');
  const n = await patchMintList('IS', variants, 'Amasya', 'أماسيا');
  console.log(`  → Amasya total: ${n} rows`);
  return n;
}

async function task1_stripRemainingBrackets() {
  // Fetch all IS mints that still contain brackets
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const bracketed = rows.filter(r => /[\[\]\(\){}]/.test(r.mint));

  const seen = new Map();
  for (const r of bracketed) {
    const cleaned = r.mint
      .replace(/^\[|\]$/g, '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*\[[^\]]*\]/g, '')
      .replace(/^\s*=\s*/g, '')
      .trim();
    if (cleaned && cleaned !== r.mint) seen.set(r.mint, cleaned);
  }

  if (seen.size === 0) { console.log('\nBracket removal: nothing left to clean'); return 0; }
  console.log(`\nStripping remaining brackets (${seen.size} patterns):`);
  let n = 0;
  for (const [original, cleaned] of seen) {
    n += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(original)}`,
      { mint: cleaned },
      `"${original}" → "${cleaned}"`
    );
  }
  console.log(`  → bracket removal total: ${n} rows`);
  return n;
}

async function task1_trimLeadingTrailing() {
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const needsTrim = rows.filter(r => /^["\s?.,]+|["\s?.,]+$/.test(r.mint));
  const seen = new Map();
  for (const r of needsTrim) {
    const cleaned = r.mint.replace(/^["\s?.,]+|["\s?.,]+$/g, '').trim();
    if (cleaned && cleaned !== r.mint && !seen.has(r.mint)) seen.set(r.mint, cleaned);
  }
  if (seen.size === 0) { console.log('\nTrim: nothing to trim'); return 0; }
  console.log(`\nTrimming leading/trailing punctuation (${seen.size} values):`);
  let n = 0;
  for (const [original, cleaned] of seen) {
    n += await patch(
      `cc=eq.IS&mint=eq.${encodeURIComponent(original)}`,
      { mint: cleaned },
      `"${original}" → "${cleaned}"`
    );
  }
  console.log(`  → trim total: ${n} rows`);
  return n;
}

async function task1_finalCount() {
  const rows = await getAll('mint', 'cc=eq.IS&mint=neq.');
  const distinct = new Set(rows.map(r => r.mint));
  const empty = await getAll('mint', 'cc=eq.IS&mint=eq.');
  console.log(`\n✅ Islamic mint final: ${distinct.size} distinct non-empty mints, ${empty.length} empty`);
}

// ─── TASK 2: Islamic Rulers ───────────────────────────────────────────────────

async function task2_abdAlMalik() {
  // Catch any that slipped through the first pass — broader ILIKE search
  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const counts = {};
  for (const r of rows) counts[r.ruler] = (counts[r.ruler] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase();
    return (lm.includes('abd al-malik') || lm.includes('abd al malik') || lm.includes('abdel malik'))
      && !lm.includes('marwan ii') && !lm.includes('marwan 2')
      && m !== 'Abd al-Malik ibn Marwan';
  });
  if (variants.length === 0) { console.log('\nAbd al-Malik: already unified'); return 0; }
  console.log(`\nAbd al-Malik remaining variants (${variants.length}):`);
  let n = 0;
  for (const v of variants) {
    n += await patch(
      `cc=eq.IS&ruler=eq.${encodeURIComponent(v)}`,
      { ruler: 'Abd al-Malik ibn Marwan', ruler_ar: 'عبد الملك بن مروان' },
      `"${v}" → Abd al-Malik ibn Marwan`
    );
  }
  console.log(`  → Abd al-Malik total: ${n} rows`);
  return n;
}

async function task2_clearJunk() {
  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const junkPatterns = [
    // quoted strings
    (m) => /^".*"$/.test(m),
    // wrapped in parens
    (m) => /^\(.*\)$/.test(m),
    // clearly not names
    (m) => /guerrero|cabeza|kirat|drachm|dirham from|AR dirham/i.test(m),
    // date strings
    (m) => /^AH\s*\d/i.test(m),
    (m) => /^\(\d/.test(m),
    (m) => /^\d{2,4}\s*AH/i.test(m),
    // metadata noise
    (m) => /^mint missing|^mint?|^unclear$|^unknown$/i.test(m.trim()),
    // just a number pattern
    (m) => /^\d{2,}$/.test(m.trim()) && m.length < 10,
  ];
  const junk = [...new Set(rows.map(r => r.ruler).filter(v => junkPatterns.some(p => p(v.trim()))))];
  if (junk.length === 0) { console.log('\nJunk rulers: already clean'); return 0; }
  console.log(`\nClearing ${junk.length} junk ruler values:`);
  let n = 0;
  for (const v of junk) {
    n += await patch(
      `cc=eq.IS&ruler=eq.${encodeURIComponent(v)}`,
      { ruler: '' },
      `"${v.slice(0, 50)}" → ''`
    );
  }
  console.log(`  → junk clear total: ${n} rows`);
  return n;
}

async function task2_trimPunctuation() {
  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const seen = new Map();
  for (const r of rows) {
    const cleaned = r.ruler.replace(/[,;.:'"]+$/, '').trim();
    if (cleaned && cleaned !== r.ruler && !seen.has(r.ruler)) seen.set(r.ruler, cleaned);
  }
  if (seen.size === 0) { console.log('\nRuler trim: nothing to trim'); return 0; }
  console.log(`\nTrimming trailing punctuation from ${seen.size} ruler values:`);
  let n = 0;
  for (const [original, cleaned] of seen) {
    n += await patch(
      `cc=eq.IS&ruler=eq.${encodeURIComponent(original)}`,
      { ruler: cleaned },
      `"${original.slice(0, 60)}" → "${cleaned.slice(0, 60)}"`
    );
  }
  console.log(`  → ruler trim total: ${n} rows`);
  return n;
}

async function task2_abagha() {
  // Abagha was a real Ilkhanid ruler (r. 1265-1282) — check and unify spelling
  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const counts = {};
  for (const r of rows) counts[r.ruler] = (counts[r.ruler] || 0) + 1;

  const variants = Object.keys(counts).filter(m => m.toLowerCase().includes('abagh'));
  console.log('\nAbagha variants:');
  if (variants.length === 0) { console.log('  (none found)'); return 0; }
  for (const [v] of Object.entries(counts).filter(([m]) => m.toLowerCase().includes('abagh'))) {
    console.log(`  "${v}": ${counts[v]} rows`);
  }
  // Canonical: 'Abagha' (Ilkhanid ruler)
  const toFix = variants.filter(m => m !== 'Abagha');
  let n = 0;
  for (const v of toFix) {
    n += await patch(
      `cc=eq.IS&ruler=eq.${encodeURIComponent(v)}`,
      { ruler: 'Abagha' },
      `"${v}" → Abagha`
    );
  }
  if (n > 0) console.log(`  → Abagha unified: ${n} rows`);
  return n;
}

async function task2_finalCount() {
  const rows = await getAll('ruler', 'cc=eq.IS&ruler=neq.');
  const distinct = new Set(rows.map(r => r.ruler));
  const empty = await getAll('ruler', 'cc=eq.IS&ruler=eq.');
  console.log(`\n✅ Islamic ruler final: ${distinct.size} distinct valid rulers, ${empty.length} empty`);
}

// ─── TASK 3: Sasanian Mints ───────────────────────────────────────────────────

async function task3_stripBrackets() {
  const rows = await getAll('mint', 'cc=eq.SS&mint=neq.');
  const bracketed = rows.filter(r => /[\[\]\(\){}'"``]/.test(r.mint));
  const seen = new Map();
  for (const r of bracketed) {
    let cleaned = r.mint
      .replace(/[\[\]\(\){}'"``]/g, '')
      .replace(/^\s*=\s*/g, '')
      .replace(/style\s+[A-Z],?\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned && cleaned !== r.mint) seen.set(r.mint, cleaned);
  }
  if (seen.size === 0) { console.log('\nSasanian bracket strip: nothing to clean'); return 0; }
  console.log(`\nSasanian bracket strip (${seen.size} patterns):`);
  let n = 0;
  for (const [original, cleaned] of seen) {
    n += await patch(
      `cc=eq.SS&mint=eq.${encodeURIComponent(original)}`,
      { mint: cleaned },
      `"${original}" → "${cleaned}"`
    );
  }
  console.log(`  → Sasanian bracket strip total: ${n} rows`);
  return n;
}

async function task3_clearDescriptive() {
  // Clear values that are clearly not city names
  const rows = await getAll('mint', 'cc=eq.SS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const junkPatterns = [
    (m) => /^mint\s+(missing|vi?i?i?|iv?|xvi?|xi?i?)/i.test(m.trim()),
    (m) => /unclear|or similar|court at|style [A-Z]/i.test(m),
    (m) => m.trim() === '?',
    (m) => /^[A-Z]{2,5}$/.test(m.trim()) && m.length <= 5, // abbrev codes
    (m) => m.length <= 2 && /^[A-Z]+$/.test(m.trim()),
    (m) => /^BBA|^BYSh|^MLWY|^AHM/.test(m.trim()),
    (m) => /mint missing|no mint|off flan|off-flan/i.test(m.trim()),
  ];

  const junk = Object.keys(counts).filter(m => junkPatterns.some(p => p(m)));
  if (junk.length === 0) { console.log('\nSasanian descriptive clear: nothing to clear'); return 0; }
  console.log(`\nClearing ${junk.length} Sasanian junk mints:`);
  let n = 0;
  for (const v of junk) {
    n += await patch(
      `cc=eq.SS&mint=eq.${encodeURIComponent(v)}`,
      { mint: '' },
      `"${v}" → ''`
    );
  }
  console.log(`  → Sasanian junk clear total: ${n} rows`);
  return n;
}

async function task3_merv() {
  const rows = await getAll('mint', 'cc=eq.SS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase().trim();
    return (lm.includes('marw') || lm === 'ml' || lm === 'pl' || lm.includes('merv'))
      && m !== 'Merv';
  });
  if (variants.length === 0) { console.log('\nSasanian Merv: already clean'); return 0; }
  console.log(`\nSasanian Merv variants (${variants.length}):`);
  const n = await patchMintList('SS', variants, 'Merv', 'مرو');
  console.log(`  → Sasanian Merv total: ${n} rows`);
  return n;
}

async function task3_ctesiphon() {
  const rows = await getAll('mint', 'cc=eq.SS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m => {
    const lm = m.toLowerCase();
    return (lm.includes('ctesiphon') || lm === 'bba' || lm === 'ld')
      && m !== 'Ctesiphon';
  });
  if (variants.length === 0) { console.log('\nSasanian Ctesiphon: already clean'); return 0; }
  console.log(`\nSasanian Ctesiphon variants (${variants.length}):`);
  const n = await patchMintList('SS', variants, 'Ctesiphon', 'المدائن');
  console.log(`  → Sasanian Ctesiphon total: ${n} rows`);
  return n;
}

async function task3_zarang() {
  const rows = await getAll('mint', 'cc=eq.SS&mint=neq.');
  const counts = {};
  for (const r of rows) counts[r.mint] = (counts[r.mint] || 0) + 1;

  const variants = Object.keys(counts).filter(m =>
    m.toLowerCase().includes('zarang') && m !== 'Zarang'
  );
  if (variants.length === 0) { console.log('\nSasanian Zarang: already clean'); return 0; }
  const n = await patchMintList('SS', variants, 'Zarang', 'زرنج');
  console.log(`\nSasanian Zarang: ${n} rows`);
  return n;
}

async function task3_clearRulerJunk() {
  const rows = await getAll('ruler', 'cc=eq.SS&ruler=neq.');
  const junk = [...new Set(rows.map(r => r.ruler).filter(m =>
    /mint missing|unclear/i.test(m.trim())
  ))];
  if (junk.length === 0) { console.log('\nSasanian ruler junk: already clean'); return 0; }
  let n = 0;
  for (const v of junk) {
    n += await patch(`cc=eq.SS&ruler=eq.${encodeURIComponent(v)}`, { ruler: '' }, `"${v}" → ''`);
  }
  console.log(`\nSasanian ruler junk clear: ${n} rows`);
  return n;
}

async function task3_finalState() {
  const rows = await getAll('mint,mint_ar', 'cc=eq.SS&mint=neq.');
  const counts = {};
  const arMap  = {};
  for (const r of rows) {
    counts[r.mint] = (counts[r.mint] || 0) + 1;
    if (r.mint_ar) arMap[r.mint] = r.mint_ar;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log('\n✅ Sasanian final mint state:');
  console.log('count | mint_ar              | mint');
  console.log('─'.repeat(55));
  for (const [m, c] of sorted) {
    console.log(`${String(c).padStart(5)} | ${(arMap[m] || '').padEnd(20)} | ${m}`);
  }
}

// ─── TASK 4: Verification ─────────────────────────────────────────────────────

async function task4_verification() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('TASK 4 — Final verification');
  console.log('══════════════════════════════════════════════════════════');

  // Check for date-as-mints remaining
  const allMints = await getAll('mint,cc', 'cc=in.(IS,SS)&mint=neq.');
  const dateMints = allMints.filter(r => /^AH\s*\d|\d{2,4}\s*AH/i.test(r.mint.trim()));
  console.log(`\nDate-as-mints remaining: ${dateMints.length}`);
  if (dateMints.length > 0) {
    const g = {};
    for (const r of dateMints) g[r.mint] = (g[r.mint] || 0) + 1;
    for (const [m, c] of Object.entries(g).slice(0, 10)) console.log(`  "${m}": ${c}`);
  }

  // Check date-as-rulers
  const allRulers = await getAll('ruler,cc', 'cc=in.(IS,SS)&ruler=neq.');
  const dateRulers = allRulers.filter(r =>
    /^AH\s*\d|\d{2,4}\s*AH|^\(\d/i.test(r.ruler.trim())
  );
  console.log(`\nDate-as-rulers remaining: ${dateRulers.length}`);
  if (dateRulers.length > 0) {
    const g = {};
    for (const r of dateRulers) g[r.ruler] = (g[r.ruler] || 0) + 1;
    for (const [m, c] of Object.entries(g).slice(0, 20)) console.log(`  "${m}": ${c}`);
  }

  // Check for junk brackets remaining in mints
  const bracketMints = allMints.filter(r => /[\[\]]/.test(r.mint));
  console.log(`\nMints with brackets remaining: ${bracketMints.length}`);
  if (bracketMints.length > 0) {
    const g = {};
    for (const r of bracketMints) g[`[${r.cc}] ${r.mint}`] = (g[`[${r.cc}] ${r.mint}`] || 0) + 1;
    for (const [m, c] of Object.entries(g).slice(0, 20)) console.log(`  "${m}": ${c}`);
  }

  // Summary table
  console.log('\n━━━━ Summary ━━━━');
  const isMints = new Set(allMints.filter(r => r.cc === 'IS').map(r => r.mint));
  const ssMints = new Set(allMints.filter(r => r.cc === 'SS').map(r => r.mint));
  const isRulers = new Set(allRulers.filter(r => r.cc === 'IS').map(r => r.ruler));
  const ssRulers = new Set(allRulers.filter(r => r.cc === 'SS').map(r => r.ruler));

  const isTotal = (await getAll('id', 'cc=eq.IS')).length;
  const ssTotal = (await getAll('id', 'cc=eq.SS')).length;

  const isEmptyMints  = (await getAll('mint',  'cc=eq.IS&mint=eq.')).length;
  const isEmptyRulers = (await getAll('ruler', 'cc=eq.IS&ruler=eq.')).length;
  const ssEmptyMints  = (await getAll('mint',  'cc=eq.SS&mint=eq.')).length;
  const ssEmptyRulers = (await getAll('ruler', 'cc=eq.SS&ruler=eq.')).length;

  console.log(`IS: ${isTotal} total | ${isMints.size} unique mints (${isEmptyMints} empty) | ${isRulers.size} unique rulers (${isEmptyRulers} empty)`);
  console.log(`SS: ${ssTotal} total | ${ssMints.size} unique mints (${ssEmptyMints} empty) | ${ssRulers.size} unique rulers (${ssEmptyRulers} empty)`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  TASK 1 — Islamic Mints Consolidation                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  await task1_aleppo();
  await task1_hamadan();
  await task1_herat();
  await task1_harran();
  await task1_hims();
  await task1_hamah();
  await task1_hijaz();
  await task1_akka();
  await task1_andalus();
  await task1_fustat();
  await task1_qahira_cleanup();
  await task1_merv_cleanup();
  await task1_nishapur_cleanup();
  await task1_amasya();
  await task1_clearVague();
  await task1_stripRemainingBrackets();
  await task1_trimLeadingTrailing();
  await task1_finalCount();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  TASK 2 — Islamic Rulers Deduplication                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  await task2_abdAlMalik();
  await task2_clearJunk();
  await task2_trimPunctuation();
  await task2_abagha();
  await task2_finalCount();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  TASK 3 — Sasanian Mints Final Cleanup                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  await task3_stripBrackets();
  await task3_clearDescriptive();
  await task3_merv();
  await task3_ctesiphon();
  await task3_zarang();
  await task3_clearRulerJunk();
  await task3_finalState();

  await task4_verification();

  console.log('\n\n✅ All tasks complete.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
