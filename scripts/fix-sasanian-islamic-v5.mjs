/**
 * fix-sasanian-islamic-v5.mjs — Tasks 1-3 data cleanup
 * Run: node --env-file=.env.local scripts/fix-sasanian-islamic-v5.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars. Use --env-file=.env.local'); process.exit(1);
}
const db = createClient(SUPABASE_URL, SERVICE_KEY);

// helpers — body must come first in supabase-js v2
const updSS = body => db.from('coins').update(body).eq('cc', 'SS');
const updIS = body => db.from('coins').update(body).eq('cc', 'IS');
const selSS = cols => db.from('coins').select(cols).eq('cc', 'SS');
const selIS = cols => db.from('coins').select(cols).eq('cc', 'IS');

async function run(q, label) {
  const { data, error } = await q.select('id');
  if (error) { console.error(`  ✗ ${label}: ${error.message}`); return 0; }
  const n = data?.length ?? 0;
  if (n > 0) console.log(`  ✓ ${label}: ${n} rows`);
  return n;
}

// ── TASK 1: Sasanian mint consolidation ───────────────────────────────────

async function task1_sasanianMints() {
  console.log('\n=== TASK 1: Sasanian mint consolidation ===');

  await run(updSS({ mint: 'Hamadan', mint_ar: 'همدان' })
    .or('mint.ilike.*hamadan*,mint.ilike.*hamadān*,mint.ilike.*ahmadan*,mint.ilike.*mint b*,mint.eq.. Hamadan mint,mint.eq.Hamadan? mint,mint.eq.Mind B Hamadan,mint.eq.Mint B Hamadan,mint.eq.Mint B Hamadan.'),
    'Hamadan');

  await run(updSS({ mint: 'Ardeshir-Khwarrah', mint_ar: 'اردشير خوره' })
    .or('mint.ilike.*ardashir-khw*,mint.ilike.*ardaxšīr*,mint.ilike.*ardeshir-kh*,mint.ilike.*ohrmazd-ardax*,mint.ilike.ART*,mint.ilike.AW*'),
    'Ardeshir-Khwarrah');

  await run(updSS({ mint: 'Bishapur', mint_ar: 'بيشابور' })
    .or('mint.ilike.*bishapur*,mint.ilike.BBA*,mint.ilike.BYŠ*,mint.ilike.BYSh*,mint.eq.BST corrupt?'),
    'Bishapur');

  await run(updSS({ mint: 'Ctesiphon', mint_ar: 'المدائن' })
    .or('mint.ilike.*ctesiphon*,mint.ilike.*ktesiphon*,mint.ilike.*veh-ardashir*,mint.ilike.*seleucia*,mint.ilike.WH*,mint.ilike.KWN BBA*,mint.eq.Mint C Ktesiphon'),
    'Ctesiphon');

  await run(updSS({ mint: 'Ray', mint_ar: 'الري' })
    .or('mint.ilike.*rayy*,mint.eq.LD Rayy,mint.eq.LDY Ray Rayy,mint.eq.NM LD for Rayy'),
    'Ray');

  await run(updSS({ mint: 'Merv', mint_ar: 'مرو' })
    .or('mint.ilike.*merv*,mint.ilike.*merw*,mint.ilike.MRWN*'),
    'Merv');

  await run(updSS({ mint: 'Nishapur', mint_ar: 'نيسابور' })
    .or('mint.ilike.*nishapur*,mint.ilike.*abarshahr*,mint.ilike.*abaršahr*,mint.ilike.*abrašahr*,mint.ilike.APL*'),
    'Nishapur');

  await run(updSS({ mint: 'Sakastan', mint_ar: 'سجستان' })
    .or('mint.ilike.*sakastan*,mint.ilike.*sakastān*,mint.eq.SK Sakastan,mint.eq.SK Sakastān,mint.eq.S Sakastan,mint.eq.S Mint V Sakastan'),
    'Sakastan');

  await run(updSS({ mint: 'Stakhr', mint_ar: 'استخر' })
    .or('mint.ilike.*stakhr*,mint.ilike.*istakhr*,mint.ilike.ST*'),
    'Stakhr');

  await run(updSS({ mint: 'Gorgan', mint_ar: 'جرجان' })
    .or('mint.ilike.*gorgan*,mint.eq.GO or GW Gorgan,mint.eq.GW or GO Gorgan,mint.ilike.GO*,mint.ilike.GW*'),
    'Gorgan');

  await run(updSS({ mint: 'Jayy', mint_ar: 'جي' })
    .or('mint.ilike.*jayy*,mint.eq.GD Jayy,mint.ilike.GY*,mint.ilike.GD*'),
    'Jayy');

  await run(updSS({ mint: 'Amul', mint_ar: 'آمل' })
    .or('mint.ilike.*amul*,mint.eq.AM probably Amul,mint.ilike.AM*'),
    'Amul');

  await run(updSS({ mint: 'Shiraz', mint_ar: 'شيراز' })
    .or('mint.ilike.*shiraz*,mint.eq.ShY Shiraz,mint.ilike.ShY*'),
    'Shiraz');

  await run(updSS({ mint: 'Narmashir', mint_ar: 'نرماشير' })
    .or('mint.ilike.*narmashir*,mint.ilike.NAL*'),
    'Narmashir');

  await run(updSS({ mint: 'Nihavand', mint_ar: 'نهاوند' })
    .or('mint.ilike.*nihavand*,mint.ilike.*nihawand*,mint.eq.NY Nihawand,mint.ilike.NY*'),
    'Nihavand');

  await run(updSS({ mint: 'Ram-Hormizd', mint_ar: 'رام هرمز' })
    .or('mint.ilike.*ram-hormizd*,mint.ilike.LAM*'),
    'Ram-Hormizd');

  await run(updSS({ mint: 'Hulwan', mint_ar: 'حلوان' })
    .or('mint.ilike.*hulwan*,mint.ilike.AYLAN*,mint.ilike.*eran-asan*'),
    'Hulwan');

  await run(updSS({ mint: 'Rew-Ardashir', mint_ar: 'ريو اردشير' })
    .or('mint.ilike.*rew-ardashir*,mint.ilike.*rev-ardashir*,mint.ilike.LYW*,mint.eq.host: LYW Rew-Ardashir'),
    'Rew-Ardashir');

  await run(updSS({ mint: 'Veh-Kavad', mint_ar: 'وه قباد' })
    .or('mint.ilike.*veh-kavad*,mint.ilike.*veh kavad*,mint.ilike.WYH*,mint.ilike.WYHC*'),
    'Veh-Kavad');

  await run(updSS({ mint: 'Weh-az-Andiyok-Husraw', mint_ar: 'وه از انديوك خسرو' })
    .or('mint.ilike.*andiyok*,mint.ilike.*weh-az*'),
    'Weh-az-Andiyok-Husraw');

  await run(updSS({ mint: 'Gundeshapur', mint_ar: 'جنديشاپور' })
    .or('mint.ilike.*gundeshapur*,mint.ilike.*jundishapur*'),
    'Gundeshapur');

  await run(updSS({ mint: 'Isfahan', mint_ar: 'أصفهان' })
    .or('mint.ilike.*isfahan*,mint.ilike.*isfahān*'),
    'Isfahan');

  // Clear uncertain/abbreviations — separate calls per term
  console.log('  Clearing uncertain/abbreviation mints...');
  let cleared = 0;
  for (const term of ['%uncertain%','%unidentified%','%not legible%','%no legible%','%corrupt%','%unsigned%','%probably%','%possibly%','%uuncertain%']) {
    const { data } = await updSS({ mint: '' }).ilike('mint', term).neq('mint', '').select('id');
    cleared += data?.length ?? 0;
  }
  // Clear NM prefix
  const { data: nm } = await updSS({ mint: '' }).ilike('mint', 'NM%').neq('mint', '').select('id');
  cleared += nm?.length ?? 0;
  // Clear "in Bactria" type
  const { data: bac } = await updSS({ mint: '' }).ilike('mint', 'in Bactria').select('id');
  cleared += bac?.length ?? 0;
  // Clear pure abbreviations via regex
  const { data: abbr } = await updSS({ mint: '' }).filter('mint', '~', '^[A-Z]{2,4}[\\s?/]*$').select('id');
  cleared += abbr?.length ?? 0;
  console.log(`  ✓ Cleared uncertain/abbreviation: ${cleared} rows`);

  // Final state
  console.log('\n  === Final Sasanian mint state (by coin count) ===');
  const { data: all } = await selSS('mint,mint_ar').neq('mint', '').not('mint', 'is', null);
  const counts = new Map();
  for (const r of (all ?? [])) {
    const key = `${r.mint}|||${r.mint_ar ?? ''}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [key, n] of sorted) {
    const [mint, mint_ar] = key.split('|||');
    console.log(`    ${n.toString().padStart(5)}  ${mint.padEnd(30)} ${mint_ar}`);
  }
  console.log(`\n  ✓ Total distinct mints: ${sorted.length}`);
}

// ── TASK 2: Sasanian ruler cleanup ────────────────────────────────────────

async function task2_sasanianRulers() {
  console.log('\n=== TASK 2: Sasanian ruler cleanup ===');

  const { data, error } = await updSS({ ruler: '', ruler_ar: '' })
    .or('ruler.ilike.*mint missing*,ruler.ilike.*unclear*,ruler.ilike.*uncertain*,ruler.ilike.*not legible*')
    .select('id');
  if (error) console.error('  ✗ Clear bad rulers:', error.message);
  else console.log(`  ✓ Cleared ${data?.length ?? 0} bad ruler rows`);

  const { data: d2 } = await updSS({ ruler: '', ruler_ar: '' })
    .filter('ruler', '~', '^[A-Z]{2,4}$').select('id');
  console.log(`  ✓ Cleared ${d2?.length ?? 0} abbreviation rulers`);

  const { data: rem } = await selSS('ruler').neq('ruler', '').not('ruler', 'is', null);
  const distinct = new Set((rem ?? []).map(r => r.ruler));
  console.log(`  Distinct Sasanian rulers remaining: ${distinct.size}`);
}

// ── TASK 3: Islamic mint consolidation ────────────────────────────────────

async function task3_islamicMints() {
  console.log('\n=== TASK 3: Islamic mint consolidation ===');

  // Clear abbreviation mints (pure uppercase 2-6 chars with optional ? or space)
  const { data: d1 } = await updIS({ mint: '' })
    .filter('mint', '~', '^[A-Z]{2,6}[?\\s]*$').select('id');
  console.log(`  ✓ Cleared abbreviation mints: ${d1?.length ?? 0} rows`);

  // Clear uncertain/unknown/too-long
  let cleared = 0;
  for (const term of ['%uncertain%','%unknown%','%not legible%','%unidentified%','%probably%']) {
    const { data } = await updIS({ mint: '' }).ilike('mint', term).neq('mint', '').select('id');
    cleared += data?.length ?? 0;
  }
  // Fetch and clear mints with length > 40
  const { data: longRows } = await selIS('mint').neq('mint', '');
  const longMints = [...new Set((longRows ?? []).filter(r => r.mint.length > 40).map(r => r.mint))];
  for (const m of longMints) {
    const { data } = await updIS({ mint: '' }).eq('mint', m).select('id');
    cleared += data?.length ?? 0;
  }
  console.log(`  ✓ Cleared uncertain/long mints: ${cleared} rows`);

  // Fix bracket entries: fetch→JS transform→patch by exact value
  const { data: bracketRows } = await selIS('mint')
    .filter('mint', '~', '[\\[\\]()?]').neq('mint', '');
  const uniqueBrMints = [...new Set((bracketRows ?? []).map(r => r.mint))];
  let bracketFixed = 0;
  for (const old of uniqueBrMints) {
    const cleaned = old.replace(/[\[\]()?]/g, '').trim();
    if (cleaned.length > 2 && cleaned !== old) {
      const { data } = await updIS({ mint: cleaned }).eq('mint', old).select('id');
      bracketFixed += data?.length ?? 0;
    } else if (cleaned.length <= 2) {
      const { data } = await updIS({ mint: '' }).eq('mint', old).select('id');
      bracketFixed += data?.length ?? 0;
    }
  }
  console.log(`  ✓ Fixed/cleared bracket mints: ${bracketFixed} rows`);

  const { data: rem } = await selIS('mint').neq('mint', '').not('mint', 'is', null);
  const distinct = new Set((rem ?? []).map(r => r.mint));
  console.log(`  Distinct Islamic mints remaining: ${distinct.size}`);
}

// ── main ──────────────────────────────────────────────────────────────────

(async () => {
  try {
    await task1_sasanianMints();
    await task2_sasanianRulers();
    await task3_islamicMints();
    console.log('\n✓ All data tasks complete.');
  } catch (e) {
    console.error('Fatal:', e); process.exit(1);
  }
})();
