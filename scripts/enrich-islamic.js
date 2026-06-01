'use strict';
/**
 * Task 2 — Enrich Islamic coins in coins.json.
 * For all coins where cc === 'IS', scan the `name` field and extract:
 *   ruler, mint, denomination
 * Writes enriched fields directly into coins.json.
 */

const fs   = require('fs');
const path = require('path');

const COINS_FILE = path.resolve(__dirname, '../src/data/coins.json');
const coins      = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));

// ── Denomination detection ────────────────────────────────────────────────────
const DENOM_PATTERNS = [
  { re: /\b(dirham|darhim|درهم)\b/i, val: 'Dirham' },
  { re: /\b(dinar|دينار)\b/i,         val: 'Dinar'  },
  { re: /\b(fals|fels|فلس)\b/i,       val: 'Fals'   },
  { re: /\b(fils|فلوس)\b/i,           val: 'Fils'   },
];

function detectDenom(name) {
  for (const { re, val } of DENOM_PATTERNS) {
    if (re.test(name)) return val;
  }
  return null;
}

// ── Mint extraction ───────────────────────────────────────────────────────────
// Common Islamic mint cities in English and Arabic variants
const MINT_LIST = [
  ['Baghdad',     'بغداد',     /\bBaghdad\b/i],
  ['Wasit',       'واسط',      /\bWasit\b/i],
  ['Basra',       'البصرة',    /\bBasra\b/i],
  ['Kufa',        'الكوفة',    /\bKufa\b/i],
  ['Misr',        'مصر',       /\b(Misr|Fustat)\b/i],
  ['Damascus',    'دمشق',      /\bDamascus\b/i],
  ['Aleppo',      'حلب',       /\b(Aleppo|Halab)\b/i],
  ['Mecca',       'مكة',       /\b(Mecca|Makka)\b/i],
  ['Medina',      'المدينة',   /\b(Medina|Madinah)\b/i],
  ['Ramla',       'الرملة',    /\b(Ramla|Ramlah)\b/i],
  ['Samarqand',   'سمرقند',    /\bSamarqand\b/i],
  ['Balkh',       'بلخ',       /\bBalkh\b/i],
  ['Merv',        'مرو',       /\bMerv\b/i],
  ['Nishapur',    'نيسابور',   /\bNishapur\b/i],
  ['Herat',       'هراة',      /\bHerat\b/i],
  ['Isfahan',     'أصفهان',    /\bIsfahan\b/i],
  ['Shiraz',      'شيراز',     /\bShiraz\b/i],
  ['Istakhr',     'اصطخر',     /\bIstakhr\b/i],
  ['Jayy',        'جي',        /\bJayy\b/i],
  ['Ardashir',    'اردشير',    /\bArdashir\b/i],
  ['Madinat al-Salam', 'مدينة السلام', /\bMadinat\s+al.?Salam\b/i],
  ['al-Muhammadiya', 'المحمدية', /\bal.Muhammadiya\b/i],
  ['Cordoba',     'قرطبة',     /\b(Cordoba|Qurtuba|Cordova)\b/i],
  ['Seville',     'إشبيلية',   /\b(Seville|Ishbiliya)\b/i],
  ['Toledo',      'طليطلة',    /\b(Toledo|Tulaytula)\b/i],
  ['Almeria',     'المرية',    /\bAlmeria\b/i],
  ['al-Andalus',  'الأندلس',   /\bal.Andalus\b/i],
  ['Fez',         'فاس',       /\bFez\b/i],
  ['Marrakesh',   'مراكش',     /\bMarrakesh\b/i],
  ['Sijilmasa',   'سجلماسة',   /\bSijilmasa\b/i],
  ['Tunis',       'تونس',      /\bTunis\b/i],
  ['Kairouan',    'القيروان',  /\bKairouan\b/i],
  ['Tripoli',     'طرابلس',    /\bTripoli\b/i],
  ['Hamdanid',    null,        null],
  ['Mosul',       'الموصل',    /\bMosul\b/i],
  ['Amid',        'آمد',       /\b(Amid|Amida)\b/i],
  ['Nasibin',     'نصيبين',    /\bNasibin\b/i],
  ['Mayyafariqin','ميافارقين', /\bMayyafariqin\b/i],
  ['Diyar Bakr',  'ديار بكر',  /\bDiyar\s*Bakr\b/i],
];

function detectMint(name) {
  for (const [en, , re] of MINT_LIST) {
    if (re && re.test(name)) return en;
  }
  // Try "from PLACE" or "at PLACE" or "mint: PLACE"
  const fromM = name.match(/\bfrom\s+([A-Z][a-z]+(?:\s+[A-Za-z]+)?)/);
  if (fromM) return fromM[1];
  const mintM = name.match(/[Mm]int[:\s]+([A-Z][a-z]+(?:\s+[A-Za-z]+)?)/);
  if (mintM) return mintM[1];
  return null;
}

// ── Ruler extraction ─────────────────────────────────────────────────────────
// Known rulers — used for name matching
const RULER_PATTERNS = [
  [/\b(Harun\s+al-Rashid|Harun\s+ar-Rashid)\b/i,   'Harun al-Rashid'],
  [/\b(al-Mansur|al-Mansor)\b/i,                    'al-Mansur'],
  [/\b(al-Mahdi)\b/i,                                'al-Mahdi'],
  [/\b(al-Hadi)\b/i,                                 'al-Hadi'],
  [/\b(al-Amin)\b/i,                                 'al-Amin'],
  [/\b(al-Ma'mun|al-Mamun)\b/i,                     "al-Ma'mun"],
  [/\b(al-Mu'tasim|al-Mutasim)\b/i,                 "al-Mu'tasim"],
  [/\b(al-Mutawakkil)\b/i,                           'al-Mutawakkil'],
  [/\b(al-Muqtadir)\b/i,                             'al-Muqtadir'],
  [/\b(al-Qadir)\b/i,                                'al-Qadir'],
  [/\b(al-Qa'im|al-Qaim)\b/i,                       "al-Qa'im"],
  [/\b(al-Mustazhir)\b/i,                            'al-Mustazhir'],
  [/\b(al-Mustarshid)\b/i,                           'al-Mustarshid'],
  [/\b(al-Mustadi)\b/i,                              'al-Mustadi'],
  [/\b(al-Nasir)\b/i,                                'al-Nasir'],
  [/\b(al-Zahir)\b/i,                                'al-Zahir'],
  [/\b(al-Mustansir)\b/i,                            'al-Mustansir'],
  [/\b(al-Musta'sim|al-Mutasim)\b/i,                "al-Musta'sim"],
  [/\bMarwan\s+II\b/i,                               'Marwan II'],
  [/\bMarwan\s+I\b/i,                                'Marwan I'],
  [/\b(Abd\s+al-Malik|Abd\s+ul-Malik)\b/i,          'Abd al-Malik'],
  [/\b(al-Walid\s+I|Walid\s+I|Walid\s+ibn)\b/i,    'al-Walid I'],
  [/\b(al-Walid\s+II|Walid\s+II)\b/i,               'al-Walid II'],
  [/\b(Hisham\s+ibn|Hisham\s+b\.|Hisham\b)/i,       'Hisham'],
  [/\b(Yazid\s+II|Yazid\s+b\.\s+Abd)/i,             'Yazid II'],
  [/\b(Yazid\s+III)\b/i,                             'Yazid III'],
  [/\b(Sulayman\s+ibn|Sulayman\b)/i,                 'Sulayman'],
  [/\b(Umar\s+ibn|Umar\s+II|Omar\s+II)\b/i,         'Umar II'],
  [/\b(Saladin|Salah\s+al-Din|Salah\s+ud-Din)\b/i,  'Saladin'],
  [/\b(al-Kamil)\b/i,                                'al-Kamil'],
  [/\b(al-Adil|al-'Adil)\b/i,                       "al-'Adil"],
  [/\b(al-Zahir\s+Baybars|Baybars)\b/i,             'Baybars'],
  [/\b(Qalawun)\b/i,                                 'Qalawun'],
  [/\b(al-Nasir\s+Muhammad|Nasir\s+Muhammad)\b/i,   'al-Nasir Muhammad'],
  [/\b(Barquq|Barquq)\b/i,                           'Barquq'],
  [/\b(Farouk|Faruq)\b/i,                            'Farouk'],
  [/\b(Ahmad\s+ibn\s+Tulun|Ibn\s+Tulun)\b/i,        'Ahmad ibn Tulun'],
  [/\b(Khumarawayh)\b/i,                             'Khumarawayh'],
  [/\b(al-Mu'izz|al-Muizz)\b/i,                     "al-Mu'izz"],
  [/\b(al-Aziz)\b/i,                                 'al-Aziz'],
  [/\b(al-Hakim)\b/i,                                'al-Hakim'],
  [/\b(Nur\s+al-Din|Nureddin)\b/i,                  'Nur al-Din'],
  [/\b(Imad\s+al-Din)\b/i,                           'Imad al-Din'],
  [/\b(Saif\s+al-Dawla)\b/i,                         'Saif al-Dawla'],
  [/\b(Abu\s+Muslim)\b/i,                             'Abu Muslim'],
  [/\b(Idris\s+I|Idris\s+II)\b/i,                   'Idris'],
  [/\b(Aghlabid)/i,                                   null],  // dynasty not ruler
  [/\b(Abu\s+Zakariya|Abu\s+Zakaria)\b/i,            'Abu Zakariya'],
  [/\b(Yahya\s+ibn\s+Umar|Yahya)\b/i,                'Yahya'],
  [/\b(Abu\s+Bakr\s+ibn\s+Umar)\b/i,                 'Abu Bakr ibn Umar'],
  [/\b(Yusuf\s+ibn\s+Tashfin|Yusuf\s+ibn\s+Tashufin)\b/i, 'Yusuf ibn Tashfin'],
  [/\b(Ali\s+ibn\s+Yusuf)\b/i,                        'Ali ibn Yusuf'],
  [/\b(Abd\s+al-Mu'min|Abd\s+al-Mumin)\b/i,          "Abd al-Mu'min"],
  [/\b(Abu\s+Yusuf\s+Ya'qub|Yaqub\s+al-Mansur)\b/i, "Abu Yusuf Ya'qub"],
  [/\b(Muhammad\s+al-Nasir)\b/i,                      'Muhammad al-Nasir'],
  [/\b(Zangi|Imad\s+al-Din\s+Zangi)\b/i,             'Imad al-Din Zangi'],
  [/\b(Artuk|Artug)\b/i,                              'Artuk'],
  [/\b(Balak)\b/i,                                    'Balak'],
  [/\b(Timurtash)\b/i,                                'Timurtash'],
  [/\b(Husam\s+al-Din)\b/i,                           'Husam al-Din'],
  // Generic "temp. X" extraction
];

function detectRuler(name) {
  for (const [re, val] of RULER_PATTERNS) {
    if (val && re.test(name)) return val;
  }
  // "temp. NAME" pattern
  const tempM = name.match(/\btemp\.?\s+([A-Z][a-z']+(?:\s+(?:al-|ibn\s+|I{1,3}|II|b\.)\s*[A-Za-z'-]+)*)/);
  if (tempM) return tempM[1].trim();
  return null;
}

// ── Main enrichment loop ──────────────────────────────────────────────────────

let enriched = { ruler: 0, mint: 0, denomination: 0 };
const islamicCoins = coins.filter(c => c.cc === 'IS');

for (const coin of islamicCoins) {
  const name = coin.name || '';
  let changed = false;

  // Denomination
  if (!coin.denomination) {
    const d = detectDenom(name);
    if (d) { coin.denomination = d; enriched.denomination++; changed = true; }
  }

  // Ruler — use existing if set, else try to detect
  if (!coin.ruler) {
    const r = detectRuler(name);
    if (r) { coin.ruler = r; enriched.ruler++; changed = true; }
  }

  // Mint — only if not already set from scraper
  if (!coin.mint) {
    const m = detectMint(name);
    if (m) { coin.mint = m; enriched.mint++; changed = true; }
  }
}

// Write back
fs.writeFileSync(COINS_FILE, JSON.stringify(coins, null, 2));

console.log('\n─── Task 2: Islamic coin enrichment ───────────────────────────────────');
console.log(`  Total IS coins   : ${islamicCoins.length.toLocaleString()}`);
console.log(`  ruler populated  : ${enriched.ruler.toLocaleString()}`);
console.log(`  mint populated   : ${enriched.mint.toLocaleString()}`);
console.log(`  denomination set : ${enriched.denomination.toLocaleString()}`);
console.log('  coins.json updated.');
