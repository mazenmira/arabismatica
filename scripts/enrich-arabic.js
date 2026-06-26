'use strict';

/**
 * enrich-arabic.js
 *
 * Maps English ruler/mint names to Arabic equivalents for
 * Mughal (cc='MG') and Delhi Sultanate (cc='DS') coins,
 * then batch-updates ruler_ar and mint_ar in Supabase.
 *
 * Usage:
 *   node scripts/enrich-arabic.js --dry-run   # preview first 20, no writes
 *   node scripts/enrich-arabic.js --run        # live update
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const DRY_RUN   = process.argv.includes('--dry-run');
const LIVE_RUN  = process.argv.includes('--run');
const BATCH     = 100;
const LOG_EVERY = 500;

if (!DRY_RUN && !LIVE_RUN) {
  console.log('Usage:');
  console.log('  node scripts/enrich-arabic.js --dry-run');
  console.log('  node scripts/enrich-arabic.js --run');
  process.exit(0);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Ruler maps ────────────────────────────────────────────────────────────────

const MUGHAL_RULERS = {
  'Akbar':                                        'أكبر',
  'Humayun':                                      'همايون',
  'Babur':                                        'بابر',
  'Babar':                                        'بابر',
  'Zahir-ud-Din Babar':                           'بابر',
  'Babar Badakhshan':                             'بابر',
  'Zahír ad-Dín Muhammad Bahádur (Bábur)':        'بابر',
  'Aurangzeb Alamgir':                            'أورنكزيب عالمكير',
  'Jahandar Shah':                                'جهاندار شاه',
  'Jahander Shah':                                'جهاندار شاه',
  'Muhammad Shah':                                'محمد شاه',
  'Shah Jahan':                                   'شاه جهان',
  'Farrukhsiyar':                                 'فرخ سيار',
  'Jahangir':                                     'جهانكير',
  'Alamgir II':                                   'عالمكير الثاني',
  'Shah Alam II':                                 'شاه عالم الثاني',
  'Kam Bakhsh':                                   'كام بخش',
  'Azim-ush-Shan':                                'عظيم الشان',
  'Rafi-ud-Darjat':                               'رفيع الدرجات',
  'Azam Shah':                                    'أعظم شاه',
  'Shah Alam Bahadur':                            'شاه عالم بهادر',
  'Nur Jahan':                                    'نور جهان',
  'Ahmad Shah':                                   'أحمد شاه',
  'Murad Bakhsh':                                 'مراد بخش',
  'Aurangzeb':                                    'أورنكزيب عالمكير',
};

const DELHI_RULERS = {
  'Fakhr al-Din Muhammad b. Tughluq':       'فخر الدين محمد بن تغلق',
  'Farid al-din Sher Shah':                 'فريد الدين شير شاه',
  'Jalal al-Din Islam Shah':                'جلال الدين إسلام شاه',
  "'Ala al-Din Mas'ud":                     'علاء الدين مسعود',
  "Mubariz al-Din Muhammad 'Adil Shah":     'مبارز الدين محمد عادل شاه',
  'Jalal al-Din Firuz':                     'جلال الدين فيروز',
  'Jalalat al-Din Radiyya':                 'جلالة الدين رضية',
  'Taj al-Din Yildiz':                      'تاج الدين يلدز',
  'Ghiyath al-Din Balban':                  'غياث الدين بلبن',
  "Mu'izz al-Din Mubarak Shah":             'معز الدين مبارك شاه',
  'Bahlul Shah Lodi':                       'بهلول شاه لودي',
  'Ghiyath al-Din Mahmud b. Muhammad':      'غياث الدين محمود بن محمد',
  'Rukn al-Din Firuz':                      'ركن الدين فيروز',
  "'Ala al-Din Muhammad":                   'علاء الدين محمد',
  'Shams al-Din Iltutmish':                 'شمس الدين إلتتمش',
  'Firuz Shah Tughluq':                     'فيروز شاه تغلق',
  'Ghiyath al-Din Tughluq':                 'غياث الدين تغلق',
  'Sikandar Shah Lodi':                     'سكندر شاه لودي',
  'Qutb al-Din Mubarak':                    'قطب الدين مبارك',
  'Muhammad b. Sam':                        'محمد بن سام',
  'Nasir al-Din Mahmud':                    'ناصر الدين محمود',
  'Nasir al-Din Mahmud Shah b. Muhammad':   'ناصر الدين محمود شاه بن محمد',
  "Mu'izz al-Din Bahram":                   'معز الدين بهرام',
  "Mu'izz al-Din Kaiqubad":                 'معز الدين كيقباد',
  'Fath Khan':                              'فتح خان',
  "Coins struck in the names of the 'Abbasid Caliphs": null,
  'Ibrahim Shah Lodi':                      'إبراهيم شاه لودي',
  'Firuz Shah Zafar':                       'فيروز شاه ظفر',
  'Abu Bakr Shah':                          'أبو بكر شاه',
  "Muhammad b. Farid Shah":                 'محمد بن فريد شاه',
  "Muhammad b. Firuz":                      'محمد بن فيروز',
};

// ── Mint maps (substring matching — longer keys checked first) ─────────────────

// Sorted by key length descending so longer keys win over substrings.
// e.g. "Akbarabad" must match before "Agra".
const MUGHAL_MINTS_RAW = {
  'Shahjahanabad':    'شاهجهان آباد',
  'Akbarabad':        'أكبر آباد (أكرا)',
  'Agra':             'أكبر آباد (أكرا)',
  'Lahore':           'لاهور',
  'Dehli':            'دهلي',
  'Delhi':            'دهلي',
  'Badakhshan':       'بدخشان',
  'Bangala':          'بنغاله',
  'Narnol':           'نارنول',
  'Dogaon':           'دوكاون',
  'Fathpur':          'فتحپور',
  'Elichpur':         'الچپور',
  'Azimabad':         'عظيم آباد (پتنه)',
  'Patna':            'پتنه',
  'Surat':            'سورت',
  'Kabul':            'كابل',
  'Multan':           'ملتان',
  'Ujjain':           'أوجين',
  'Ahmadnagar':       'أحمدنكر',
  'Chunar':           'چنار',
  'Bakkhar':          'بكّر',
  'Khujista Bunyad':  'أورنك آباد',
  'Aurangabad':       'أورنك آباد',
  'Ahmadabad':        'أحمد آباد',
  'Tatta':            'تتّه',
  'Burhanpur':        'برهانپور',
  'Itawa':            'إتاوه',
  'Akbarnagar':       'أكبر نكر',
  'Ajmer':            'أجمير',
  'Kashmir':          'كشمير',
  'Allahabad':        'الله آباد',
  'Qandahar':         'قندهار',
  'Qandhar':          'قندهار',
  'Jaunpur':          'جونپور',
  'Daulatabad':       'دولت آباد',
  'Bijapur':          'بيجاپور',
  'Golkonda':         'كلكنده',
  'Bhakkar':          'بهكّر',
  'Sirhind':          'سرهند',
  'Bidar':            'بيدر',
  'Khambayat':        'خمبايت',
  'Asir':             'عاصر',
  'Ahmedabad':        'أحمد آباد',
  'Urdu Zafar Qarin': 'أردو ظفر قرين',
  'Katak':            'كتك',
  'Junagadh':         'جوناكده',
  'Mulher':           'مُلهير',
  'Bairata':          'بيراته',
  'Lakhnau':          'لكهنؤ',
  'Bareli':           'بريلي',
};

const DELHI_MINTS_RAW = {
  'Dar al-Islam':  'دار الإسلام',
  'Sharifabad':    'شريف آباد',
  'Shahgarh':      'شاهكره',
  'Gwalior':       'غواليار',
  'Gwaliar':       'غواليار',
  'Narnol':        'نارنول',
  'Dehli':         'دهلي',
  'Delhi':         'دهلي',
  'Kalpi':         'كالپي',
  'Chunar':        'چنار',
  'Lahore':        'لاهور',
  'Agra':          'أكرا',
  'Budaun':        'بدايون',
  'Hissar':        'حصار',
  'Alwar':         'ألور',
};

// Sort by key length descending so longer substrings match before shorter ones
function sortedPairs(raw) {
  return Object.entries(raw).sort((a, b) => b[0].length - a[0].length);
}

const MUGHAL_MINT_PAIRS = sortedPairs(MUGHAL_MINTS_RAW);
const DELHI_MINT_PAIRS  = sortedPairs(DELHI_MINTS_RAW);

// ── Normalise apostrophes (curly/smart → straight) ────────────────────────────

function normaliseStr(s) {
  if (!s) return s;
  return s.replace(/[‘’ʼ`]/g, "'").trim();
}

// Pre-normalise all ruler map keys at load time
function normaliseMap(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[normaliseStr(k)] = v;
  return out;
}

const MUGHAL_RULERS_N  = normaliseMap(MUGHAL_RULERS);
const DELHI_RULERS_N   = normaliseMap(DELHI_RULERS);

// ── Lookup functions ──────────────────────────────────────────────────────────

function lookupRuler(cc, ruler) {
  if (!ruler || !ruler.trim()) return '';
  const map = cc === 'MG' ? MUGHAL_RULERS_N : DELHI_RULERS_N;
  const result = map[normaliseStr(ruler)];
  // explicit null in map means intentionally blank (e.g. 'Abbasid Caliphs category header)
  if (result === null) return '';
  return result ?? '';
}

function lookupMint(cc, mint) {
  if (!mint || !mint.trim()) return '';
  const raw = normaliseStr(mint);
  // Skip obvious junk
  if (/^(NM|nm|ND|nd|\?+|off|null|undefined)$/i.test(raw)) return '';
  if (raw.startsWith('http') || raw.startsWith('cat#')) return '';
  const pairs = cc === 'MG' ? MUGHAL_MINT_PAIRS : DELHI_MINT_PAIRS;
  for (const [key, ar] of pairs) {
    if (raw.includes(key)) return ar;
  }
  return '';
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`enrich-arabic.js — ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE RUN'}`);
  console.log('');

  // Fetch all MG + DS coins with pagination (Supabase default limit is 1000)
  console.log('Fetching all MG + DS coins from Supabase...');
  const PAGE = 500;
  const coins = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('coins')
      .select('id, cc, ruler, mint')
      .in('cc', ['MG', 'DS'])
      .order('cc')
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) { console.error('Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    coins.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`  Fetched ${coins.length} coins total (MG + DS).`);
  console.log('');

  // Build update list
  const updates = [];
  const unmatchedRulers = new Map();
  const unmatchedMints  = new Map();
  let rulerSet = 0, mintSet = 0;

  for (const coin of coins) {
    const ruler_ar = lookupRuler(coin.cc, coin.ruler);
    const mint_ar  = lookupMint(coin.cc, coin.mint);

    if (ruler_ar) rulerSet++;
    else if (coin.ruler?.trim()) {
      const k = `[${coin.cc}] ${coin.ruler.trim()}`;
      unmatchedRulers.set(k, (unmatchedRulers.get(k) || 0) + 1);
    }

    if (mint_ar) mintSet++;
    else if (coin.mint?.trim() && !/^(NM|nm|ND|nd|\?+|off)$/i.test(coin.mint.trim())
             && !coin.mint.startsWith('http') && !coin.mint.startsWith('cat#')) {
      const k = `[${coin.cc}] ${coin.mint.trim()}`;
      unmatchedMints.set(k, (unmatchedMints.get(k) || 0) + 1);
    }

    updates.push({ id: coin.id, ruler_ar, mint_ar });
  }

  // ── Dry run: print first 20 ───────────────────────────────────────────────
  if (DRY_RUN) {
    console.log('══ DRY RUN — first 20 coins ══');
    console.log('');
    const sample = updates.slice(0, 20);
    for (let i = 0; i < sample.length; i++) {
      const u = sample[i];
      const c = coins[i];
      console.log(`  [${i + 1}] id=${u.id}  cc=${c.cc}`);
      console.log(`      ruler:    "${c.ruler ?? ''}"`);
      console.log(`      ruler_ar: "${u.ruler_ar}"`);
      console.log(`      mint:     "${c.mint ?? ''}"`);
      console.log(`      mint_ar:  "${u.mint_ar}"`);
      console.log('');
    }

    console.log('══ Summary (full dataset) ══');
    console.log(`  Total coins:      ${coins.length}`);
    console.log(`  ruler_ar set:     ${rulerSet}  (NULL: ${coins.length - rulerSet})`);
    console.log(`  mint_ar set:      ${mintSet}   (NULL: ${coins.length - mintSet})`);
    console.log('');

    const topUnmatchedRulers = [...unmatchedRulers.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 20);
    const topUnmatchedMints  = [...unmatchedMints.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 30);

    console.log('── Unmatched rulers (top 20) ──');
    for (const [k, c] of topUnmatchedRulers) console.log(`  ${c}\t${k}`);
    console.log('');
    console.log('── Unmatched mints (top 30) ──');
    for (const [k, c] of topUnmatchedMints) console.log(`  ${c}\t${k}`);
    console.log('');
    console.log('Run with --run to apply changes.');
    return;
  }

  // ── Live run ──────────────────────────────────────────────────────────────
  console.log(`Updating ${updates.length} coins in batches of ${BATCH}...`);
  let done = 0, failed = 0;

  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    for (const u of batch) {
      const { error: ue } = await sb
        .from('coins')
        .update({ ruler_ar: u.ruler_ar, mint_ar: u.mint_ar })
        .eq('id', u.id);
      if (ue) { console.warn(`  ✗ id=${u.id}: ${ue.message}`); failed++; }
      else done++;
    }
    if (done % LOG_EVERY === 0 || done === updates.length) {
      console.log(`  ✓ ${done} / ${updates.length} updated`);
    }
  }

  console.log('');
  console.log('══ Complete ══');
  console.log(`  Updated:     ${done}`);
  console.log(`  Failed:      ${failed}`);
  console.log(`  ruler_ar set: ${rulerSet}  (NULL: ${coins.length - rulerSet})`);
  console.log(`  mint_ar set:  ${mintSet}   (NULL: ${coins.length - mintSet})`);
  console.log('');

  const topUnmatchedRulers = [...unmatchedRulers.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 20);
  const topUnmatchedMints  = [...unmatchedMints.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 30);

  console.log('── Unmatched rulers ──');
  for (const [k, c] of topUnmatchedRulers) console.log(`  ${c}\t${k}`);
  console.log('');
  console.log('── Unmatched mints ──');
  for (const [k, c] of topUnmatchedMints) console.log(`  ${c}\t${k}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
