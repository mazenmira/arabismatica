// analyse-islamic-mints.js — READ ONLY, no updates
// Steps 1, 2c, 4 analysis via PostgREST fetch

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BASE || !KEY) { console.error('Missing env vars'); process.exit(1); }

async function getAll(select, filter) {
  const rows = [];
  let offset = 0;
  while (true) {
    const url = `${BASE}/rest/v1/coins?select=${select}${filter ? '&' + filter : ''}&offset=${offset}&limit=1000`;
    const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Prefer': 'count=exact' } });
    const d = await r.json();
    if (!Array.isArray(d)) { console.error('Error:', JSON.stringify(d)); break; }
    rows.push(...d);
    if (d.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

// Normalize: strip diacritics, punctuation, collapse whitespace → lowercase
function norm(s) {
  return (s || '')
    .replace(/[āăáàâäãåāĀ]/g, 'a')
    .replace(/[īíìîïĪ]/g, 'i')
    .replace(/[ūúùûüŪ]/g, 'u')
    .replace(/[ēéèêëĒ]/g, 'e')
    .replace(/[ōóòôöõŌ]/g, 'o')
    .replace(/[ṭṬ]/g, 't')
    .replace(/[ḍḌ]/g, 'd')
    .replace(/[ḥḤ]/g, 'h')
    .replace(/[ṣṢ]/g, 's')
    .replace(/[ẓẒ]/g, 'z')
    .replace(/[ġĠ]/g, 'g')
    .replace(/[ḫḪ]/g, 'kh')
    .replace(/[ʿʾ''`]/g, '')
    .replace(/[šŠ]/g, 'sh')
    .replace(/[\.\-,;:!\?\(\)\[\]\/\\'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sep(title) {
  console.log('\n' + '═'.repeat(60));
  console.log(title);
  console.log('═'.repeat(60));
}

async function main() {
  console.log('Fetching all IS coins (mint + ruler)…');
  const rows = await getAll('mint,ruler,mint_ar,ruler_ar', 'cc=eq.IS');
  console.log(`Total IS rows: ${rows.length}`);

  // ── STEP 1: Singleton mints ──────────────────────────────
  sep('STEP 1 — Singleton mints analysis');

  const mintCount = {};
  for (const r of rows) {
    const m = (r.mint || '').trim();
    if (!m) continue;
    mintCount[m] = (mintCount[m] || 0) + 1;
  }

  const singletons = Object.entries(mintCount).filter(([, c]) => c === 1).map(([m]) => m);
  console.log(`\nTotal distinct non-empty mints: ${Object.keys(mintCount).length}`);
  console.log(`Singleton mints (appear exactly once): ${singletons.length}`);

  // Show first 100 singletons sorted
  const sorted100 = [...singletons].sort().slice(0, 100);
  console.log('\nFirst 100 singletons (alphabetical):');
  sorted100.forEach(m => console.log(`  "${m}"`));

  // Breakdown: singletons > 25 chars
  const longSingletons = singletons.filter(m => m.length > 25);
  console.log(`\nSingletons with length > 25 chars: ${longSingletons.length}`);
  // Total rows that would be cleared
  const longSingletonRows = longSingletons.length; // each appears exactly once
  console.log(`Rows that would be cleared (Step 2a): ${longSingletonRows}`);
  console.log('\nSample long singletons:');
  longSingletons.slice(0, 30).forEach(m => console.log(`  [${m.length}] "${m}"`));

  // ── STEP 2b: Mints with numbers ──────────────────────────
  sep('STEP 2b — Mints containing numbers (2+ digits)');
  const numericMints = Object.entries(mintCount).filter(([m]) => /\d{2,}/.test(m));
  console.log(`Distinct mints with 2+ digit sequences: ${numericMints.length}`);
  console.log(`Total rows affected: ${numericMints.reduce((s,[,c])=>s+c, 0)}`);
  console.log('\nAll numeric mints (count | mint):');
  numericMints.sort((a,b)=>b[1]-a[1]).forEach(([m,c]) => console.log(`  ${c.toString().padStart(4)} | "${m}"`));

  // ── STEP 2c: Transliteration duplicates ─────────────────
  sep('STEP 2c — Transliteration variant groups (mint)');

  const normGroups = {};
  for (const [m, c] of Object.entries(mintCount)) {
    const n = norm(m);
    if (!normGroups[n]) normGroups[n] = [];
    normGroups[n].push({ mint: m, count: c });
  }

  const multiVariant = Object.entries(normGroups)
    .filter(([, arr]) => arr.length > 1)
    .map(([n, arr]) => ({
      normalized: n,
      variants: arr.length,
      total: arr.reduce((s, x) => s + x.count, 0),
      forms: arr.sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.total - a.total);

  console.log(`\nGroups with multiple variants: ${multiVariant.length}`);
  console.log('\nTop 50 by total coins:');
  multiVariant.slice(0, 50).forEach(g => {
    console.log(`\n  normalized: "${g.normalized}" | variants: ${g.variants} | total coins: ${g.total}`);
    g.forms.forEach(f => console.log(`    ${f.count.toString().padStart(5)} | "${f.mint}"`));
  });

  // ── STEP 4: Ruler transliteration duplicates ─────────────
  sep('STEP 4 — Transliteration variant groups (ruler)');

  const rulerCount = {};
  for (const r of rows) {
    const ru = (r.ruler || '').trim();
    if (!ru) continue;
    rulerCount[ru] = (rulerCount[ru] || 0) + 1;
  }
  console.log(`Total distinct non-empty rulers: ${Object.keys(rulerCount).length}`);

  const rulerNormGroups = {};
  for (const [ru, c] of Object.entries(rulerCount)) {
    const n = norm(ru);
    if (!rulerNormGroups[n]) rulerNormGroups[n] = [];
    rulerNormGroups[n].push({ ruler: ru, count: c });
  }

  const rulerMulti = Object.entries(rulerNormGroups)
    .filter(([, arr]) => arr.length > 1)
    .map(([n, arr]) => ({
      normalized: n,
      variants: arr.length,
      total: arr.reduce((s, x) => s + x.count, 0),
      forms: arr.sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.total - a.total);

  console.log(`\nRuler groups with multiple variants: ${rulerMulti.length}`);
  console.log('\nTop 30 by total coins:');
  rulerMulti.slice(0, 30).forEach(g => {
    console.log(`\n  normalized: "${g.normalized}" | variants: ${g.variants} | total coins: ${g.total}`);
    g.forms.slice(0, 8).forEach(f => console.log(`    ${f.count.toString().padStart(5)} | "${f.ruler}"`));
    if (g.forms.length > 8) console.log(`    ... and ${g.forms.length - 8} more`);
  });

  // ── Summary ───────────────────────────────────────────────
  sep('Summary');
  const nonEmpty = Object.keys(mintCount).length;
  const totalSingle = singletons.length;
  const pct = ((totalSingle / nonEmpty) * 100).toFixed(1);
  console.log(`Distinct mints: ${nonEmpty}`);
  console.log(`Singletons: ${totalSingle} (${pct}% of distinct values)`);
  console.log(`Long singletons (>25 chars): ${longSingletons.length} rows would be cleared`);
  console.log(`Numeric mints: ${numericMints.length} distinct, ${numericMints.reduce((s,[,c])=>s+c,0)} rows`);
  console.log(`Variant groups (mint): ${multiVariant.length}`);
  console.log(`Variant groups (ruler): ${rulerMulti.length}`);
  console.log('\n✅ Analysis complete — no data was modified.');
}

main().catch(e => { console.error(e); process.exit(1); });
