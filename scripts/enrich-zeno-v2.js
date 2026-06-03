'use strict';
/**
 * enrich-zeno-v2.js
 *
 * For all Zeno coins (nref starts with 'Z#'):
 *   1. Re-extract yah  (AH date) where not already set
 *   2. Re-extract mint  where empty
 *   3. Re-extract ruler where empty
 *   4. Scan name for auction/sale references → coin.auction object
 *
 * Writes enriched data back to coins.json in-place.
 * Prints a detailed stats report.
 */

const fs   = require('fs');
const path = require('path');

const COINS_FILE = path.resolve(__dirname, '../src/data/coins.json');
const coins      = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));
const zenoCoin   = c => c.nref && c.nref.startsWith('Z#');

// ── 1. AH date extraction ──────────────────────────────────────────────────────
// Covers: "AH 131", "131 AH", "131/748", "AH131", "(AH 180-193)",
//         "180AH", "year 131", "(131)", "105AH", "85 AH"
function extractAH(text) {
  if (!text) return '';
  // Prefer explicit AH prefix
  let m = text.match(/\bAH\s*(\d{2,4})\b/i);
  if (m) return m[1];
  // "NNN AH" suffix
  m = text.match(/\b(\d{2,4})\s*AH\b/i);
  if (m) return m[1];
  // "NNN/NNNN" — hijri/gregorian split — take first part if it looks AH-range (60–1500)
  m = text.match(/\b(\d{2,3})\/(\d{3,4})\b/);
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2]);
    if (a >= 60 && a <= 1500 && b >= 600 && b <= 2100) return String(a);
  }
  // "year NNN" – sometimes used
  m = text.match(/\byear\s+(\d{2,4})\b/i);
  if (m) return m[1];
  return '';
}

// ── 2. Mint extraction ────────────────────────────────────────────────────────
// Extended city list with regex patterns
const MINT_TABLE = [
  // Canonical name  , Arabic,       regex
  ['Baghdad',        'بغداد',       /\bBaghdad\b/i],
  ['Madinat al-Salam','مدينة السلام',/\bMadinat\s+al.?Salam\b/i],
  ['Wasit',          'واسط',        /\bWasit\b/i],
  ['Basra',          'البصرة',      /\bBasra?\b/i],
  ['Kufa',           'الكوفة',      /\bKufa\b/i],
  ['Misr',           'مصر',         /\b(Misr|Fustat)\b/i],
  ['Damascus',       'دمشق',        /\b(Damascus|Dimashq)\b/i],
  ['Aleppo',         'حلب',         /\b(Aleppo|Halab)\b/i],
  ['Mecca',          'مكة',         /\b(Mecca|Makka)\b/i],
  ['Medina',         'المدينة',     /\b(Medina|Madinah)\b/i],
  ['Ramla',          'الرملة',      /\b(Ramla|Ramlah)\b/i],
  ['Jerusalem',      'القدس',       /\b(Jerusalem|Iliya)\b/i],
  ['Samarqand',      'سمرقند',      /\bSamarqand\b/i],
  ['Balkh',          'بلخ',         /\bBalkh\b/i],
  ['Merv',           'مرو',         /\bMerv\b/i],
  ['Nishapur',       'نيسابور',     /\bNishapur\b/i],
  ['Herat',          'هراة',        /\bHerat\b/i],
  ['Isfahan',        'أصفهان',      /\b(Isfahan|Ispahan)\b/i],
  ['Shiraz',         'شيراز',       /\bShiraz\b/i],
  ['Istakhr',        'اصطخر',       /\bIstakhr\b/i],
  ['Jayy',           'جي',          /\bJayy\b/i],
  ['Ardashir Khurra','اردشير خره',  /\bArdashir\s*Khurra\b/i],
  ['al-Muhammadiya', 'المحمدية',    /\bal.Muhammadiy[ah]\b/i],
  ['al-Abbasiya',    'العباسية',    /\bal.Abbasiy[ah]\b/i],
  ['Cordoba',        'قرطبة',       /\b(Cordoba|Qurtuba|Cordova)\b/i],
  ['Seville',        'إشبيلية',     /\b(Seville|Ishbiliya)\b/i],
  ['Toledo',         'طليطلة',      /\b(Toledo|Tulaytula)\b/i],
  ['al-Andalus',     'الأندلس',     /\bal.?Andalus\b/i],
  ['Fez',            'فاس',         /\b(Fez|Fas)\b/i],
  ['Marrakesh',      'مراكش',       /\bMarrakesh?\b/i],
  ['Sijilmasa',      'سجلماسة',     /\bSijilmasa\b/i],
  ['Tunis',          'تونس',        /\bTunis\b/i],
  ['Kairouan',       'القيروان',    /\b(Kairouan|Qayrawan)\b/i],
  ['Tripoli',        'طرابلس',      /\bTripoli\b/i],
  ['Mosul',          'الموصل',      /\bMosul\b/i],
  ['Amid',           'آمد',         /\b(Amid|Amida|Diyarbakir)\b/i],
  ['Mayyafariqin',   'ميافارقين',   /\bMayyafariqin\b/i],
  ['Nasibin',        'نصيبين',      /\bNasibin\b/i],
  ['Raqqa',          'الرقة',       /\bRaqqa\b/i],
  ['Antioch',        'أنطاكية',     /\bAntioch\b/i],
  ['Tiberias',       'طبرية',       /\bTiberias\b/i],
  ['Tabaristan',     'طبرستان',     /\b(Tabaristan|Tabarist)\b/i],
  ['Ardabil',        'أردبيل',      /\bArdabil\b/i],
  ['Hamadan',        'همدان',       /\bHamadan\b/i],
  ['Rayy',           'الري',        /\b(Rayy|Ray)\b/i],
  ['Zanjan',         'زنجان',       /\bZanjan\b/i],
  ['Tabriz',         'تبريز',       /\bTabriz\b/i],
  ['Maragha',        'مراغة',       /\bMaragha\b/i],
  ['Sultania',       'سلطانية',     /\bSultaniy[ah]\b/i],
  ['Ulja',           'أولجا',       /\bUlja\b/i],
  ['Irbil',          'أربيل',       /\b(Irbil|Erbil|Arbela)\b/i],
  ['Qazvin',         'قزوين',       /\bQazvin\b/i],
  ['Kashan',         'كاشان',       /\bKashan\b/i],
  ['Yazd',           'يزد',         /\bYazd\b/i],
  ['Kilwa',          'كلوة',        /\bKilwa\b/i],
  ['Mogadishu',      'مقديشو',      /\bMogadish(u|o)\b/i],
  ['Zanzibar',       'زنجبار',      /\bZanzibar\b/i],
  ['Aden',           'عدن',         /\bAden\b/i],
  ['Sanaa',          'صنعاء',       /\bSanaa?\b/i],
];

function detectMint(name) {
  for (const [en,, re] of MINT_TABLE) {
    if (re && re.test(name)) return en;
  }
  // "from CITY" / "at CITY" / "mint CITY"
  let m = name.match(/\bfrom\s+([A-Z][a-z]{2,}(?:\s+[A-Za-z]{2,})?)/);
  if (m && !/^(the|al|ibn|bin|bint)\b/i.test(m[1])) return m[1];
  m = name.match(/[Mm]int[:\s]+([A-Z][a-z]{2,}(?:\s+[A-Za-z]{2,})?)/);
  if (m) return m[1];
  return null;
}

// ── 3. Ruler extraction ────────────────────────────────────────────────────────
// Known-ruler lookup first for precision, then heuristic fallback
const KNOWN_RULERS = [
  // Umayyad
  [/\b(Mu'awiya|Muawiya)\s*(I|II)?\b/i,               m => `Mu'awiya ${m[2]||'I'}`.trim()],
  [/\bAbd\s+al-Malik\s+(ibn\s+Marwan)?\b/i,            () => 'Abd al-Malik ibn Marwan'],
  [/\b(al-)?Walid\s+I\b/i,                             () => 'al-Walid I'],
  [/\b(al-)?Walid\s+II\b/i,                            () => 'al-Walid II'],
  [/\bSulayman\s+(ibn\s+Abd\s+al-Malik)?\b/i,          () => 'Sulayman ibn Abd al-Malik'],
  [/\bUmar\s+(II|ibn\s+Abd\s+al-Aziz)\b/i,             () => 'Umar II'],
  [/\bYazid\s+II\b/i,                                  () => 'Yazid II'],
  [/\bYazid\s+III\b/i,                                 () => 'Yazid III'],
  [/\bHisham\s+(ibn\s+Abd\s+al-Malik)?\b/i,            () => 'Hisham ibn Abd al-Malik'],
  [/\bMarwan\s+I\b/i,                                  () => 'Marwan I'],
  [/\bMarwan\s+II\b/i,                                 () => 'Marwan II'],
  // Abbasid
  [/\bal-Saffah\b/i,                                   () => 'al-Saffah'],
  [/\bal-Mansur\b/i,                                   () => 'al-Mansur'],
  [/\bal-Mahdi\b/i,                                    () => 'al-Mahdi'],
  [/\bal-Hadi\b/i,                                     () => 'al-Hadi'],
  [/\bHarun\s+al-Rashid\b/i,                           () => 'Harun al-Rashid'],
  [/\bal-Amin\b/i,                                     () => 'al-Amin'],
  [/\bal-Ma['']?mun\b/i,                               () => "al-Ma'mun"],
  [/\bal-Mu['']?tasim\b/i,                             () => "al-Mu'tasim"],
  [/\bal-Wathiq\b/i,                                   () => 'al-Wathiq'],
  [/\bal-Mutawakkil\b/i,                               () => 'al-Mutawakkil'],
  [/\bal-Muntasir\b/i,                                 () => 'al-Muntasir'],
  [/\bal-Musta['']?in\b/i,                             () => "al-Musta'in"],
  [/\bal-Mu['']?tazz\b/i,                              () => "al-Mu'tazz"],
  [/\bal-Muhtadi\b/i,                                  () => 'al-Muhtadi'],
  [/\bal-Mu['']?tamid\b/i,                             () => "al-Mu'tamid"],
  [/\bal-Mu['']?tadid\b/i,                             () => "al-Mu'tadid"],
  [/\bal-Muktafi\b/i,                                  () => 'al-Muktafi'],
  [/\bal-Muqtadir\b/i,                                 () => 'al-Muqtadir'],
  [/\bal-Qahir\b/i,                                    () => 'al-Qahir'],
  [/\bal-Radi\b/i,                                     () => 'al-Radi'],
  [/\bal-Muttaqi\b/i,                                  () => 'al-Muttaqi'],
  [/\bal-Mustakfi\b/i,                                 () => 'al-Mustakfi'],
  [/\bal-Muti['']?\b/i,                                () => "al-Muti'"],
  [/\bal-Ta['']?i['']?\b/i,                            () => "al-Ta'i'"],
  [/\bal-Qadir\b/i,                                    () => 'al-Qadir'],
  [/\bal-Qa['']?im\b/i,                                () => "al-Qa'im"],
  [/\bal-Muqtadi\b/i,                                  () => 'al-Muqtadi'],
  [/\bal-Mustazhir\b/i,                                () => 'al-Mustazhir'],
  [/\bal-Mustarshid\b/i,                               () => 'al-Mustarshid'],
  [/\bal-Rashid\b(?!\s+Harun)/i,                       () => 'al-Rashid'],
  [/\bal-Muqtafi\b/i,                                  () => 'al-Muqtafi'],
  [/\bal-Mustanjid\b/i,                                () => 'al-Mustanjid'],
  [/\bal-Mustadi\b/i,                                  () => 'al-Mustadi'],
  [/\bal-Nasir\b/i,                                    () => 'al-Nasir'],
  [/\bal-Zahir\s+(?!Baybars)/i,                        () => 'al-Zahir'],
  [/\bal-Mustansir\b/i,                                () => 'al-Mustansir'],
  [/\bal-Musta['']?sim\b/i,                            () => "al-Musta'sim"],
  // Fatimid
  [/\bal-Mu['']?izz\b/i,                               () => "al-Mu'izz"],
  [/\bal-Aziz\b/i,                                     () => 'al-Aziz'],
  [/\bal-Hakim\b/i,                                    () => 'al-Hakim'],
  [/\bal-Zahir\s+li-Izaz\b/i,                          () => 'al-Zahir li-Izaz'],
  [/\bal-Mustansir\b/i,                                () => 'al-Mustansir'],
  // Ayyubid
  [/\b(Saladin|Salah\s+al-Din|Salah\s+ud-Din)\b/i,     () => 'Saladin (Salah al-Din)'],
  [/\bal-['']?Adil\b/i,                                () => "al-'Adil"],
  [/\bal-Kamil\b/i,                                    () => 'al-Kamil'],
  [/\bal-Ashraf\b/i,                                   () => 'al-Ashraf'],
  [/\bal-Salih\s+Ayyub\b/i,                            () => 'al-Salih Ayyub'],
  // Mamluk
  [/\bBaybars?\b/i,                                    () => 'Baybars'],
  [/\bQalawun\b/i,                                     () => 'Qalawun'],
  [/\bal-Ashraf\s+Khalil\b/i,                          () => 'al-Ashraf Khalil'],
  [/\bal-Nasir\s+Muhammad\b/i,                         () => 'al-Nasir Muhammad'],
  [/\bBerquq|Barquq\b/i,                               () => 'Barquq'],
  [/\bFaraj\b/i,                                       () => 'Faraj'],
  [/\bShaykh\b/i,                                      () => 'Shaykh'],
  [/\bBarsb[ae]y\b/i,                                  () => 'Barsbay'],
  [/\bJaqmaq\b/i,                                      () => 'Jaqmaq'],
  [/\bInal\b/i,                                        () => 'Inal'],
  [/\bKhushqadam\b/i,                                  () => 'Khushqadam'],
  [/\bQaytbay\b/i,                                     () => 'Qaytbay'],
  [/\bQansuh\s+al-Ghawri\b/i,                          () => 'Qansuh al-Ghawri'],
  [/\bTuman\s*bay\b/i,                                 () => 'Tumanbay'],
  // Tulunid
  [/\bAhmad\s+ibn\s+Tulun\b/i,                         () => 'Ahmad ibn Tulun'],
  [/\bKhumarawayh\b/i,                                 () => 'Khumarawayh'],
  [/\bHarun\s+ibn\s+Khumarawayh\b/i,                   () => 'Harun ibn Khumarawayh'],
  // Ikhshidid
  [/\bIkhshid\b/i,                                     () => 'Muhammad ibn Tughj al-Ikhshid'],
  [/\bKafur\b/i,                                       () => 'Kafur'],
  // Almoravid
  [/\bYusuf\s+(ibn\s+)?Tashfin\b/i,                    () => 'Yusuf ibn Tashfin'],
  [/\bAli\s+(ibn\s+)?Yusuf\b/i,                        () => 'Ali ibn Yusuf'],
  [/\bTashfin\s+(ibn\s+)?Ali\b/i,                      () => 'Tashfin ibn Ali'],
  [/\bIshaq\s+ibn\s+Ali\b/i,                           () => 'Ishaq ibn Ali'],
  // Almohad
  [/\bAbd\s+al-Mu['']?min\b/i,                         () => "Abd al-Mu'min"],
  [/\bYusuf\s+(I|ibn\s+Abd\s+al-Mu['']?min)\b/i,       () => 'Yusuf I'],
  [/\bYa['']?qub\s+al-Mansur\b/i,                      () => "Ya'qub al-Mansur"],
  [/\bMuhammad\s+al-Nasir\b/i,                         () => 'Muhammad al-Nasir'],
  // Zangid
  [/\bImad\s+al-Din\s+Zangi\b/i,                       () => 'Imad al-Din Zangi'],
  [/\bNur\s+al-Din\s+(Mahmud)?\b/i,                    () => 'Nur al-Din Mahmud'],
  [/\bSaif\s+al-Din\s+Ghazi\b/i,                       () => 'Saif al-Din Ghazi'],
  // Artuqid
  [/\bArtuk\b/i,                                       () => 'Artuk'],
  [/\bIlghazi\b/i,                                     () => 'Ilghazi'],
  [/\bTimurtash\b/i,                                   () => 'Timurtash'],
  [/\bHusam\s+al-Din\s+Timurtash\b/i,                  () => 'Husam al-Din Timurtash'],
  [/\bQara\s+Arslan\b/i,                               () => 'Qara Arslan'],
  [/\bNur\s+al-Din\s+Artuq\b/i,                        () => 'Nur al-Din Artuq'],
  // Pre-Reform / Arab-Sasanian
  [/\b(Ziyad\s+ibn\s+Abihi|Ziyad)\b/i,                () => 'Ziyad ibn Abihi'],
  [/\bUbaydallah\s+ibn\s+Ziyad\b/i,                    () => 'Ubaydallah ibn Ziyad'],
  [/\bAl-Hajjaj\b/i,                                   () => 'al-Hajjaj ibn Yusuf'],
  // Ilkhanid
  [/\bHulagu\b/i,                                      () => 'Hulagu'],
  [/\bAbagha\b/i,                                      () => 'Abagha'],
  [/\bArghun\b/i,                                      () => 'Arghun'],
  [/\bGhazan\b/i,                                      () => 'Ghazan'],
  [/\bOljaitu\b/i,                                     () => 'Oljaitu'],
  [/\bAbu\s+Sa['']?id\b/i,                             () => "Abu Sa'id"],
];

function detectRuler(name) {
  for (const [re, fn] of KNOWN_RULERS) {
    const m = name.match(re);
    if (m) return fn(m);
  }
  // Heuristic: "temp. NAME" or "NNN AH, NAME" patterns
  let hm = name.match(/\btemp\.?\s+([A-Z][a-z']+(?:\s+(?:al-|ibn\s+|I{1,3}V?|b\.\s*)[A-Za-z'-]+)*)/);
  if (hm) return hm[1].replace(/\.\s*\([\d\-\s]+AH\)$/i, '').trim();
  return null;
}

// ── 4. Auction detection ──────────────────────────────────────────────────────
// Auction houses known to sell Islamic coins
const AUCTION_HOUSES = [
  'Roma Numismatics',
  'CNG',          // Classical Numismatic Group
  'NAC',          // Numismatica Ars Classica
  'Gorny & Mosch',
  'Solidus',
  'Stephen Album',
  'Morton & Eden',
  'Spink',
  'Sotheby\'s',
  'Christies',
  "Christie's",
  'Baldwin\'s',
  "Baldwin's",
  'Numismatica Genevensis',
  'Helios',
  'Leu',
  'Fritz Rudolf Künker',
  'Künker',
  'Frank Sternberg',
  'Peus',
  'Nomos',
  'Agora',
  'Auction Coin',
  'Rauch',
  'Hirsch',
];

// Build a pattern matching any known house name
const HOUSE_RE = new RegExp(
  '(' + AUCTION_HOUSES.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
  'i'
);

// Price patterns: "850 GBP", "USD 1,200", "$1200", "£850"
const PRICE_RE = /(?:(?:USD|GBP|EUR|CHF|SEK|DKK|AUD|CAD)\s*[\d,]+(?:\.\d+)?|[\$£€]\s*[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?\s*(?:USD|GBP|EUR|CHF))/i;

// Grade patterns
const GRADE_RE = /\b(mint\s+state|MS[-\s]?\d{0,2}|VF\+?|EF\+?|xf\+?|AU\+?|UNC(?:IRCULATED)?|GVF|NEF|F\+?|VG\+?|fair|poor|good|nearly\s+(?:VF|EF|XF|UNC)|about\s+(?:VF|EF|XF)|extremely\s+fine|very\s+fine|good\s+very\s+fine|almost\s+VF|choice\s+(?:VF|EF))\b/i;

// Sale reference patterns: "E-Sale 53", "Auction 441", "Sale 103", "Lot 1044"
const SALE_RE = /\b(?:E-Sale|Electronic\s+Auction|Auction|Sale|Lot)\s*(?:No\.?\s*)?(\d+)\b/gi;
const LOT_RE  = /\b[Ll]ot\s*(?:No\.?\s*)?(\d+)\b/i;

// Date patterns in auction context
const DATE_RE = /\b(\d{1,2})[.\-/](\d{1,2})[.\-/](20\d{2})\b|\b(20\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})\b/;

function parsePrice(str) {
  if (!str) return { price: null, currency: null };
  const clean = str.replace(/,/g, '');
  const m = clean.match(/(USD|GBP|EUR|CHF|SEK|DKK|AUD|CAD)?\s*([\d]+(?:\.\d+)?)|([\d]+(?:\.\d+)?)\s*(USD|GBP|EUR|CHF)|[\$]([\d.]+)|([\d.]+)\s*[£€]|[£]([\d.]+)/i);
  if (!m) return { price: null, currency: null };
  const price = parseFloat(m[2] || m[3] || m[5] || m[6] || m[7] || '0') || null;
  const currMap = { '$': 'USD', '£': 'GBP', '€': 'EUR' };
  const currency = (m[1] || m[4] || (str.includes('$') ? 'USD' : str.includes('£') ? 'GBP' : str.includes('€') ? 'EUR' : null)) || null;
  return { price, currency };
}

function detectAuction(name) {
  if (!name) return null;
  const houseM = name.match(HOUSE_RE);
  if (!houseM) return null;      // must have a known house to be worth parsing

  const house = houseM[1];

  // Sale & lot
  const saleMatches = [...name.matchAll(SALE_RE)];
  const lotM = name.match(LOT_RE);
  const sale = saleMatches.find(m => !/lot/i.test(m[0]))
    ? saleMatches.find(m => !/lot/i.test(m[0]))[0].trim()
    : null;
  const lot  = lotM ? lotM[1] : null;

  // Date
  let date = null;
  const dM = name.match(DATE_RE);
  if (dM) {
    if (dM[3]) date = `${dM[3]}-${dM[2].padStart(2,'0')}-${dM[1].padStart(2,'0')}`;
    else if (dM[4]) date = `${dM[4]}-${dM[5].padStart(2,'0')}-${dM[6].padStart(2,'0')}`;
  }

  // Price
  const priceM = name.match(PRICE_RE);
  const { price, currency } = parsePrice(priceM ? priceM[0] : null);

  // Grade
  const gradeM = name.match(GRADE_RE);
  const grade  = gradeM ? gradeM[0].trim() : null;

  // Only return if we have meaningful data beyond just the house name
  if (!lot && !sale && !price && !grade) return null;

  return {
    house,
    ...(sale     && { sale }),
    ...(lot      && { lot }),
    ...(date     && { date }),
    ...(price    && { price }),
    ...(currency && { currency }),
    ...(grade    && { grade }),
  };
}

// ── Main enrichment loop ──────────────────────────────────────────────────────
const stats = {
  total:        0,
  yah_filled:   0,
  mint_filled:  0,
  ruler_filled: 0,
  auction_found: 0,
};

for (const coin of coins) {
  if (!zenoCoin(coin)) continue;
  stats.total++;
  const name = coin.name || '';

  // 1. AH date
  if (!coin.yah || coin.yah === '') {
    const yah = extractAH(name);
    if (yah) { coin.yah = yah; coin.yce = String(Math.round(parseInt(yah)*0.97+622)); stats.yah_filled++; }
  }

  // 2. Mint
  if (!coin.mint || coin.mint === '') {
    const mint = detectMint(name);
    if (mint) { coin.mint = mint; stats.mint_filled++; }
  }

  // 3. Ruler
  if (!coin.ruler || coin.ruler === '') {
    const ruler = detectRuler(name);
    if (ruler) { coin.ruler = ruler; stats.ruler_filled++; }
  }

  // 4. Auction
  if (!coin.auction) {
    const auction = detectAuction(name);
    if (auction) { coin.auction = auction; stats.auction_found++; }
  }
}

// ── Write & report ────────────────────────────────────────────────────────────
fs.writeFileSync(COINS_FILE, JSON.stringify(coins, null, 2));

console.log('\n─── Zeno Enrichment v2 Results ────────────────────────────────────────');
console.log(`  Zeno coins processed : ${stats.total.toLocaleString()}`);
console.log(`  yah  newly filled    : ${stats.yah_filled.toLocaleString()}`);
console.log(`  mint newly filled    : ${stats.mint_filled.toLocaleString()}`);
console.log(`  ruler newly filled   : ${stats.ruler_filled.toLocaleString()}`);
console.log(`  auction objects found: ${stats.auction_found.toLocaleString()}`);

if (stats.auction_found > 0) {
  console.log('\n  Sample auction records:');
  let shown = 0;
  for (const c of coins) {
    if (c.auction && shown < 5) {
      console.log(`  [${c.nref}] ${c.name.slice(0,60)}`);
      console.log(`    auction: ${JSON.stringify(c.auction)}`);
      shown++;
    }
  }
}

// Auction field coverage note
if (stats.auction_found === 0) {
  console.log('\n  ℹ NOTE: No auction records found in Zeno coin names.');
  console.log('    Zeno.ru is a photo archive — it does not embed auction prices.');
  console.log('    Sold price data (like islamicnumis.com shows) would need to be');
  console.log('    sourced separately from: acsearch.info, coinarchives.com, or');
  console.log('    direct auction house result CSVs (Roma, CNG, Stephen Album).');
}

console.log('\n  coins.json updated.');
