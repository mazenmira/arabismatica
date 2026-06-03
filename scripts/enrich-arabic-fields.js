'use strict';
/**
 * enrich-arabic-fields.js
 * Tasks:
 *   1. Add mint_ar to IS coins where mint is English
 *   2. Add ruler_ar where ruler is known
 *   3. Update latest_additions.json
 *   4. Print stats
 */

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const COINS_FILE  = path.join(ROOT, 'src/data/coins.json');
const LATEST_FILE = path.join(ROOT, 'src/data/latest_additions.json');

// ── Mint EN → AR map ──────────────────────────────────────────────────────────
// Keys are lowercase for case-insensitive lookup
const MINT_AR = {
  // Iraq / Mesopotamia
  'baghdad':             'بغداد',
  'madinat al-salam':    'مدينة السلام',
  'madinat al salam':    'مدينة السلام',
  'al-muhammadiya':      'المحمدية',
  'basra':               'البصرة',
  'basra (al-basra)':    'البصرة',
  'kufa':                'الكوفة',
  'wasit':               'واسط',
  'vasit':               'واسط',
  'anbar':               'الأنبار',
  'mosul':               'الموصل',
  'irbil':               'أربيل',
  'kirkuk':              'كركوك',
  // Egypt / Levant
  'misr':                'مصر',
  'fustat':              'الفسطاط',
  'al-fustat':           'الفسطاط',
  'alexandria':          'الإسكندرية',
  'damascus':            'دمشق',
  'dimashq':             'دمشق',
  'aleppo':              'حلب',
  'halab':               'حلب',
  'ramla':               'الرملة',
  'ramlah':              'الرملة',
  'hims':                'حمص',
  'homs':                'حمص',
  'tiberias':            'طبرية',
  'jerusalem':           'القدس',
  'iliya':               'إيلياء',
  'caesarea':            'قيسارية',
  'lydda':               'اللد',
  'lod':                 'اللد',
  'filistin':            'فلسطين',
  'palestine':           'فلسطين',
  'sebastopolis':        'سباستوبوليس',
  'jordan':              'الأردن',
  'al-urdunn':           'الأردن',
  'qinnasrin':           'قنسرين',
  'raqqa':               'الرقة',
  'harran':              'حران',
  'amid':                'آمد',
  'diyar bakr':          'ديار بكر',
  'mayyafariqin':        'ميافارقين',
  'malatya':             'ملطية',
  'tarsus':              'طرسوس',
  'antioch':             'أنطاكية',
  'nasibin':             'نصيبين',
  // Arabia / Hijaz
  'mecca':               'مكة المكرمة',
  'makka':               'مكة المكرمة',
  'medina':              'المدينة المنورة',
  'madinah':             'المدينة المنورة',
  'sanaa':               'صنعاء',
  "san'a":               'صنعاء',
  'aden':                'عدن',
  // Persia / Iran
  'isfahan':             'أصفهان',
  'ispahan':             'أصفهان',
  'shiraz':              'شيراز',
  'istakhr':             'استخر',
  'arrajan':             'أرجان',
  'tabriz':              'تبريز',
  'ardabil':             'أردبيل',
  'rayy':                'الري',
  'ray':                 'الري',
  'hamadan':             'همذان',
  'qazvin':              'قزوين',
  'qazwin':              'قزوين',
  'kirman':              'كرمان',
  'sultaniya':           'سلطانية',
  'maragha':             'مراغة',
  'ardashir khurra':     'اردشير خره',
  'kashan':              'كاشان',
  'yazd':                'يزد',
  'zanjan':              'زنجان',
  'nihawand':            'نهاوند',
  'nahavand':            'نهاوند',
  // Central Asia / Khorasan
  'nishapur':            'نيسابور',
  'naysabur':            'نيسابور',
  'samarqand':           'سمرقند',
  'merv':                'مرو',
  'balkh':               'بلخ',
  'herat':               'هراة',
  'ghazna':              'غزنة',
  'ghazni':              'غزنة',
  'bust':                'بُست',
  'zaranj':              'زرنج',
  'sijistan':            'سجستان',
  'zabulistan':          'زابلستان',
  'bamiyan':             'باميان',
  'ustrushana':          'أوستروشنه',
  'transoxiana':         'ما وراء النهر',
  'jayy':                'جي',
  'al-jayy':             'جي',
  // North Africa / Maghreb
  'ifriqiya':            'إفريقية',
  'ifriqqiya':           'إفريقية',
  'qayrawan':            'القيروان',
  'kairouan':            'القيروان',
  'tunis':               'تونس',
  'tripoli':             'طرابلس',
  'sijilmasa':           'سجلماسة',
  'sijilmassa':          'سجلماسة',
  'fes':                 'فاس',
  'fez':                 'فاس',
  'fas':                 'فاس',
  'marrakesh':           'مراكش',
  'marrakech':           'مراكش',
  'ceuta':               'سبتة',
  'sabta':               'سبتة',
  'tlemcen':             'تلمسان',
  'tilimsan':            'تلمسان',
  // al-Andalus
  'cordoba':             'قرطبة',
  'qurtuba':             'قرطبة',
  'seville':             'إشبيلية',
  'ishbiliya':           'إشبيلية',
  'toledo':              'طليطلة',
  'tulaytula':           'طليطلة',
  'al-andalus':          'الأندلس',
  'madinat al-zahra':    'مدينة الزهراء',
  'almeria':             'المرية',
  'granada':             'غرناطة',
  'malaga':              'مالقة',
  'zaragoza':            'سرقسطة',
  'badajoz':             'بطليوس',
  'valencia':            'بلنسية',
};

// ── Ruler EN → AR map ─────────────────────────────────────────────────────────
const RULER_AR = {
  // Umayyad
  "mu'awiya i":                    'معاوية بن أبي سفيان',
  "mu'awiya ii":                   'معاوية الثاني',
  'muawiya i':                     'معاوية بن أبي سفيان',
  'muawiya ii':                    'معاوية الثاني',
  'muawiya':                       'معاوية بن أبي سفيان',
  'yazid i':                       'يزيد بن معاوية',
  'marwan i':                      'مروان بن الحكم',
  'abd al-malik ibn marwan':       'عبد الملك بن مروان',
  'abd al-malik':                  'عبد الملك بن مروان',
  'al-walid i':                    'الوليد بن عبد الملك',
  'al-walid ii':                   'الوليد الثاني',
  'sulayman ibn abd al-malik':     'سليمان بن عبد الملك',
  'sulayman':                      'سليمان بن عبد الملك',
  'umar ii':                       'عمر بن عبد العزيز',
  'yazid ii':                      'يزيد الثاني',
  'hisham ibn abd al-malik':       'هشام بن عبد الملك',
  'hisham':                        'هشام بن عبد الملك',
  'marwan ii':                     'مروان الثاني',
  'abd al-malik bin marwan':       'عبد الملك بن مروان',
  // Abbasid
  'al-saffah':                     'السفاح',
  'al-mansur':                     'المنصور',
  'al-mahdi':                      'المهدي',
  'al-hadi':                       'الهادي',
  'harun al-rashid':               'هارون الرشيد',
  "al-ma'mun":                     'المأمون',
  'al-mamun':                      'المأمون',
  "al-mu'tasim":                   'المعتصم',
  'al-mutasim':                    'المعتصم',
  'al-wathiq':                     'الواثق',
  'al-mutawakkil':                 'المتوكل',
  'al-muntasir':                   'المنتصر',
  "al-musta'in":                   'المستعين',
  "al-mu'tazz":                    'المعتز',
  'al-muhtadi':                    'المهتدي',
  "al-mu'tamid":                   'المعتمد',
  "al-mu'tadid":                   'المعتضد',
  'al-muktafi':                    'المكتفي',
  'al-muqtadir':                   'المقتدر',
  'al-qahir':                      'القاهر',
  'al-radi':                       'الراضي',
  'al-muttaqi':                    'المتقي',
  'al-mustakfi':                   'المستكفي',
  "al-muti'":                      'المطيع',
  "al-ta'i'":                      'الطائع',
  'al-qadir':                      'القادر',
  "al-qa'im":                      'القائم',
  'al-muqtadi':                    'المقتدي',
  'al-mustazhir':                  'المستظهر',
  'al-mustarshid':                 'المسترشد',
  'al-rashid':                     'الراشد',
  'al-muqtafi':                    'المقتفي',
  'al-mustanjid':                  'المستنجد',
  'al-mustadi':                    'المستضيء',
  'al-nasir':                      'الناصر',
  'al-zahir':                      'الظاهر',
  'al-mustansir':                  'المستنصر',
  "al-musta'sim":                  'المعتصم بالله',
  'al-amin':                       'الأمين',
  // Fatimid
  "al-mu'izz":                     'المعز لدين الله',
  'al-aziz':                       'العزيز بالله',
  'al-hakim':                      'الحاكم بأمر الله',
  // Ayyubid
  'saladin (salah al-din)':        'صلاح الدين الأيوبي',
  'saladin':                       'صلاح الدين الأيوبي',
  "al-'adil":                      'العادل',
  'al-kamil':                      'الكامل',
  'al-ashraf':                     'الأشرف',
  'al-salih ayyub':                'الصالح أيوب',
  // Mamluk
  'baybars':                       'بيبرس',
  'qalawun':                       'قلاوون',
  'al-ashraf khalil':              'الأشرف خليل',
  'al-nasir muhammad':             'الناصر محمد',
  'barquq':                        'برقوق',
  'faraj':                         'فرج بن برقوق',
  'shaykh':                        'الشيخ المؤيد',
  'barsbay':                       'برسباي',
  'jaqmaq':                        'جقمق',
  'inal':                          'إينال',
  'qaytbay':                       'قايتباي',
  'qansuh al-ghawri':              'قانصوه الغوري',
  'tumanbay':                      'طومان باي',
  // Tulunid
  'ahmad ibn tulun':               'أحمد بن طولون',
  'khumarawayh':                   'خمارويه',
  'harun ibn khumarawayh':         'هارون بن خمارويه',
  // Ikhshidid
  'kafur':                         'كافور الإخشيدي',
  'muhammad ibn tughj al-ikhshid': 'محمد بن طُغج الإخشيد',
  // Almoravid
  'yusuf ibn tashfin':             'يوسف بن تاشفين',
  'ali ibn yusuf':                 'علي بن يوسف',
  'tashfin ibn ali':               'تاشفين بن علي',
  'ishaq ibn ali':                 'إسحاق بن علي',
  // Almohad
  "abd al-mu'min":                 'عبد المؤمن بن علي',
  'yusuf i':                       'يوسف الأول',
  "ya'qub al-mansur":              'يعقوب المنصور',
  'muhammad al-nasir':             'محمد الناصر',
  // Zangid
  'imad al-din zangi':             'عماد الدين زنكي',
  'nur al-din mahmud':             'نور الدين محمود',
  // Artuqid
  'ilghazi':                       'إيلغازي',
  'timurtash':                     'تيمورتاش',
  'husam al-din timurtash':        'حسام الدين تيمورتاش',
  'qara arslan':                   'قره أرسلان',
  // Ilkhanid
  'hulagu':                        'هولاكو',
  'abagha':                        'أباقا',
  'arghun':                        'أرغون',
  'ghazan':                        'غازان',
  'oljaitu':                       'أولجايتو',
  "abu sa'id":                     'أبو سعيد',
  // Buyid
  'adud al-dawla':                 'عضد الدولة',
  // Samanid
  'ismail i':                      'إسماعيل الأول',
  'nasr ii':                       'نصر الثاني',
  'nuh i':                         'نوح الأول',
  'nuh ii':                        'نوح الثاني',
};

// ── Load ──────────────────────────────────────────────────────────────────────
console.log('Loading coins.json...');
const coins = JSON.parse(fs.readFileSync(COINS_FILE, 'utf8'));
console.log(`Loaded ${coins.length.toLocaleString()} coins.\n`);

// ── Task 1: mint_ar ───────────────────────────────────────────────────────────
let mintArAdded = 0, mintArAlreadySet = 0;

for (const coin of coins) {
  if (coin.cc !== 'IS') continue;
  if (!coin.mint || !coin.mint.trim()) continue;

  // Already has Arabic in mint_ar?
  if (coin.mint_ar && coin.mint_ar.trim()) { mintArAlreadySet++; continue; }

  // Also skip if mint field itself is Arabic script
  const hasArabic = /[؀-ۿ]/.test(coin.mint);
  if (hasArabic) { mintArAlreadySet++; continue; }

  const key = coin.mint.trim().toLowerCase();
  const ar  = MINT_AR[key];
  if (ar) {
    coin.mint_ar = ar;
    mintArAdded++;
  } else {
    // Try partial match for compound names like "Wasit (Iraq)"
    const matchedKey = Object.keys(MINT_AR).find(k => key.startsWith(k) || key.includes(k));
    if (matchedKey) { coin.mint_ar = MINT_AR[matchedKey]; mintArAdded++; }
  }
}

// ── Task 2: ruler_ar ──────────────────────────────────────────────────────────
let rulerArAdded = 0, rulerArAlreadySet = 0;

for (const coin of coins) {
  if (!coin.ruler || !coin.ruler.trim()) continue;
  if (coin.ruler_ar && coin.ruler_ar.trim()) { rulerArAlreadySet++; continue; }

  // Skip if ruler already contains Arabic
  if (/[؀-ۿ]/.test(coin.ruler)) { rulerArAlreadySet++; continue; }

  const key = coin.ruler.trim().toLowerCase();
  const ar  = RULER_AR[key];
  if (ar) {
    coin.ruler_ar = ar;
    rulerArAdded++;
  } else {
    // Fuzzy: try longest matching prefix
    const matchedKey = Object.keys(RULER_AR)
      .filter(k => key.includes(k) || k.includes(key))
      .sort((a, b) => b.length - a.length)[0];
    if (matchedKey) { coin.ruler_ar = RULER_AR[matchedKey]; rulerArAdded++; }
  }
}

// ── Task 3: latest_additions.json ────────────────────────────────────────────
const latestIds = coins.slice(-20).reverse().map(c => c.id);
fs.writeFileSync(LATEST_FILE, JSON.stringify({
  ids:         latestIds,
  generatedAt: new Date().toISOString(),
}, null, 2));

// ── Write coins.json ──────────────────────────────────────────────────────────
console.log('Writing coins.json...');
fs.writeFileSync(COINS_FILE, JSON.stringify(coins, null, 2));
console.log('Done.\n');

// ── Stats ─────────────────────────────────────────────────────────────────────
const isCoins     = coins.filter(c => c.cc === 'IS');
const withMintAr  = isCoins.filter(c => c.mint_ar  && c.mint_ar.trim()).length;
const withRulerAr = coins.filter(c => c.ruler_ar && c.ruler_ar.trim()).length;
const withMint    = coins.filter(c => c.mint    && c.mint.trim()).length;
const withRuler   = coins.filter(c => c.ruler   && c.ruler.trim()).length;

console.log('─── Results ────────────────────────────────────────────────────────────');
console.log(`  Total coins          : ${coins.length.toLocaleString()}`);
console.log(`  IS coins             : ${isCoins.length.toLocaleString()}`);
console.log('');
console.log(`  mint_ar newly added  : ${mintArAdded.toLocaleString()}`);
console.log(`  mint_ar already set  : ${mintArAlreadySet.toLocaleString()}`);
console.log(`  mint_ar total (IS)   : ${withMintAr.toLocaleString()} / ${isCoins.length.toLocaleString()} (${Math.round(withMintAr/isCoins.length*100)}%)`);
console.log('');
console.log(`  ruler_ar newly added : ${rulerArAdded.toLocaleString()}`);
console.log(`  ruler_ar already set : ${rulerArAlreadySet.toLocaleString()}`);
console.log(`  ruler_ar total       : ${withRulerAr.toLocaleString()} / ${withRuler.toLocaleString()} rulers (${Math.round(withRulerAr/Math.max(withRuler,1)*100)}%)`);
console.log('');
console.log(`  mint  total          : ${withMint.toLocaleString()}`);
console.log(`  ruler total          : ${withRuler.toLocaleString()}`);
console.log('');
console.log(`  latest_additions.json updated: last ID = ${latestIds[0]}`);
