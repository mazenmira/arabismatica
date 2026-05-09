import type { Coin } from '@/types/coin';
// ─── Inline translation dictionary ───────────────────────────────────────────

// Phrases ordered longest → shortest to avoid partial clobber
const PHRASE_MAP: [RegExp, string][] = [

  // ── Commemorative subjects ──────────────────────────────────────────────────
  [/Grand Egyptian Museum/gi,           'المتحف المصري الكبير'],
  [/\bGEM\b/g,                          'م.م.ك'],
  [/Khofo Solar Boat/gi,               'مركب خوفو الشمسية'],
  [/Ramesses II Hanging Obelisk/gi,    'مسلة رمسيس الثاني المعلقة'],
  [/Ramesses II Statue/gi,             'تمثال رمسيس الثاني'],
  [/Hatshepsut Statue/gi,              'تمثال حتشبسوت'],
  [/Tut Gold Mask/gi,                  'قناع توت الذهبي'],
  [/Tut\b/gi,                          'توت عنخ آمون'],
  [/Hatshepsut/gi,                     'حتشبسوت'],
  [/Ramesses/gi,                       'رمسيس'],
  [/Karnak/gi,                         'الكرنك'],
  [/Luxor/gi,                          'الأقصر'],
  [/Aswan High Dam/gi,                 'السد العالي بأسوان'],
  [/Aswan/gi,                          'أسوان'],
  [/Cairo University/gi,               'جامعة القاهرة'],
  [/Cairo Stadium/gi,                  'استاد القاهرة'],
  [/Cairo/gi,                          'القاهرة'],
  [/Alexandria University/gi,          'جامعة الإسكندرية'],
  [/Alexandria/gi,                     'الإسكندرية'],
  [/School of Agriculture/gi,          'مدرسة الزراعة'],
  [/Egyptian Radio Broadcasting/gi,    'الإذاعة المصرية'],
  [/State Lawsuits/gi,                 'قضايا الدولة'],
  [/Saving for Development/gi,         'الادخار للتنمية'],
  [/Agriculture\b/gi,                  'الزراعة'],
  [/Broadcasting\b/gi,                 'البث الإذاعي'],
  [/Development\b/gi,                  'التنمية'],
  [/University\b/gi,                   'الجامعة'],
  [/Stadium\b/gi,                      'الاستاد'],
  [/Museum\b/gi,                       'المتحف'],
  [/Obelisk\b/gi,                      'المسلة'],
  [/Statue\b/gi,                       'التمثال'],
  [/Mask\b/gi,                         'القناع'],
  [/Boat\b/gi,                         'القارب'],
  [/Dam\b/gi,                          'السد'],
  [/Radio\b/gi,                        'الراديو'],
  [/Solar\b/gi,                        'الشمسية'],

  // ── People (commemorative) ──────────────────────────────────────────────────
  [/Abbas Al-Aqqad/gi,                 'عباس العقاد'],
  [/Taha Hussein/gi,                   'طه حسين'],
  [/Georgi Zidan/gi,                   'جرجي زيدان'],
  [/Abbas\b/gi,                        'عباس'],
  [/Aqqad\b/gi,                        'العقاد'],
  [/Taha\b/gi,                         'طه'],
  [/Zidan\b/gi,                        'زيدان'],
  [/Georgi\b/gi,                       'جرجي'],

  // ── Royal/Type descriptors ──────────────────────────────────────────────────
  [/Facing Right/gi,                   'الزي الملكي'],
  [/Civic Attire/gi,                   'الزي الملكي'],
  [/Facing Left/gi,                    'زي التشريفة العسكرية'],
  [/Reverse Trial/gi,                  'نموذج معكوس'],
  [/Trial Strike/gi,                   'نسخة تجريبية'],
  [/Gold Pattern/gi,                   'نموذج ذهب'],
  [/Bronze Pattern/gi,                 'نموذج برونز'],
  [/Pattern\b/gi,                      'نموذج'],
  [/Type 1\b/gi,                       'نوع أول'],
  [/Type 2\b/gi,                       'نوع ثاني'],
  [/Type 3\b/gi,                       'نوع ثالث'],
  [/Type I\b/gi,                       'نوع أول'],
  [/Type II\b/gi,                      'نوع ثاني'],
  [/Type III\b/gi,                     'نوع ثالث'],
  [/With Hole/gi,                      'مثقوب'],
  [/With Flower/gi,                    'بالوردة'],
  [/Royal Wedding/gi,                  'الزواج الملكي'],
  [/Old Design/gi,                     'تصميم قديم'],
  [/French Occupation/gi,              'الاحتلال الفرنسي'],
  [/Mule\b/gi,                         'قطعة خطأ'],
  [/\bND\b/gi,                         'غير مؤرخ'],
  [/\bnd\b/g,                          'غير مؤرخ'],

  // ── Coin types / denominations ──────────────────────────────────────────────
  [/Gold Pounds?/gi,                   'جنيه ذهب'],
  [/Gold Pound/gi,                     'جنيه ذهب'],
  [/Pounds?\b/gi,                      'جنيه'],
  [/Piastres?\b/gi,                    'قرش'],
  [/Milliemes?\b/gi,                   'مليم'],
  [/Zeri Mahbub/gi,                    'زر محبوب'],
  [/Zari Mahbub/gi,                    'زر محبوب'],
  [/Coyrek Rumi/gi,                    'كويريك رومي'],
  [/Manghir\b/gi,                      'مانجير'],
  [/Mangir\b/gi,                       'مانجير'],
  [/Mahbub\b/gi,                       'محبوب'],
  [/Qirsh\b/gi,                        'قرش'],
  [/Para\b/gi,                         'بارة'],
  [/Sultani\b/gi,                      'سلطاني'],
  [/Jadid\b/gi,                        'جديد'],
  [/Medini\b|Medin\b/gi,               'مديني'],
  [/Akche\b|Akce\b/gi,                 'أقجة'],
  [/Asper\b/gi,                        'أسبر'],

  // ── Rulers ──────────────────────────────────────────────────────────────────
  [/Hussein Kamel/gi,                  'حسين كامل'],
  [/Abdul Hamid/gi,                    'عبدالحميد'],
  [/Abdulhamid/gi,                     'عبدالحميد'],
  [/Abdulaziz/gi,                      'عبدالعزيز'],
  [/Abdul Aziz/gi,                     'عبدالعزيز'],
  [/Abdulmecid/gi,                     'عبدالمجيد'],
  [/Abdul Mecid/gi,                    'عبدالمجيد'],
  [/Said Pasha/gi,                     'سعيد باشا'],
  [/Salim ibn Sulayman/gi,             'سليم بن سليمان'],
  [/Ali Bey/gi,                        'علي بك'],
  [/Fuad\b/gi,                         'فؤاد'],
  [/Farouk\b/gi,                       'فاروق'],
  [/Faruq\b/gi,                        'فاروق'],
  [/Osman\b/gi,                        'عثمان'],
  [/Ahmed\b/gi,                        'أحمد'],
  [/Salim\b/gi,                        'سليم'],
  [/Sulayman\b/gi,                     'سليمان'],
  [/\bibn\b/gi,                        'بن'],
  [/Hussein\b/gi,                      'حسين'],
  [/Ali\b/gi,                          'علي'],

  // ── Locations ───────────────────────────────────────────────────────────────
  [/the magnificent Misr al-Mahrusa/gi, 'مصر المحروسة'],
  [/Misr al-Mahrusa/gi,                'مصر المحروسة'],
  [/Misr\b/gi,                         'مصر'],
  [/Egyptian\b/gi,                     'المصري'],

  // ── Misc ────────────────────────────────────────────────────────────────────
  [/\bYears?\b/gi,                     'سنة'],
  [/\bof\b/gi,                         'من'],
  [/\bfor\b/gi,                        'لـ'],
];

const ROMAN_END: [RegExp, string][] = [
  [/ VIII(?=$|\s*[)\]])/gi, ' الثامن'],
  [/ VII(?=$|\s*[)\]])/gi,  ' السابع'],
  [/ VI(?=$|\s*[)\]])/gi,   ' السادس'],
  [/ IV(?=$|\s*[)\]])/gi,   ' الرابع'],
  [/ IX(?=$|\s*[)\]])/gi,   ' التاسع'],
  [/ III(?=$|\s*[)\]])/gi,  ' الثالث'],
  [/ II(?=$|\s*[)\]])/gi,   ' الثاني'],
  [/ I(?=$|\s*[)\]])/gi,    ' الأول'],
  [/ V(?=$|\s*[)\]])/gi,    ' الخامس'],
  [/ X(?=$|\s*[)\]])/gi,    ' العاشر'],
];

function translateCoinName(name: string): string {
  let s = name;
  for (const [re, ar] of PHRASE_MAP) s = s.replace(re, ar);
  for (const [re, ar] of ROMAN_END)  s = s.replace(re, ar);
  return s.trim();
}

export const RARITY_AR: Record<string, string> = {
  Common: 'شائع', Uncommon: 'غير شائع', Scarce: 'نادر نسبياً', Rare: 'نادر',
};


export const DISC_GRADIENTS: Record<string, string> = {
  Gold:          'radial-gradient(circle at 36% 36%, #F7E08A, #C9A84C, #8B6D2E)',
  Silver:        'radial-gradient(circle at 36% 36%, #F2F2F2, #C8C8C8, #888)',
  Copper:        'radial-gradient(circle at 36% 36%, #ECA882, #C1714A, #7A3A1A)',
  Bronze:        'radial-gradient(circle at 36% 36%, #D4A96A, #A0714A, #603A18)',
  'Cupro-Nickel':'radial-gradient(circle at 36% 36%, #D8DDE6, #9AA4B2, #5A6472)',
  Nickel:        'radial-gradient(circle at 36% 36%, #D8DDE6, #9AA4B2, #5A6472)',
  Bimetallic:    'conic-gradient(from 0deg, #F7E08A, #C9A84C, #C8C8C8, #888, #F7E08A)',
  Aluminium:     'radial-gradient(circle at 36% 36%, #E8ECF2, #B0BAC8, #708090)',
  Brass:         'radial-gradient(circle at 36% 36%, #F0D870, #C8A838, #785A10)',
  Billon:        'radial-gradient(circle at 36% 36%, #D8C898, #A89868, #687040)',
  Steel:         'radial-gradient(circle at 36% 36%, #D0D4DA, #9AA0AA, #606878)',
  Other:         'radial-gradient(circle at 36% 36%, #F0E8D4, #D8C8A0, #A89060)',
};

export const METAL_BADGE_CLASSES: Record<string, string> = {
  Gold:          'bg-yellow-300 text-yellow-900',
  Silver:        'bg-gray-200 text-gray-800',
  Copper:        'bg-orange-300 text-orange-900',
  Bronze:        'bg-amber-400 text-amber-900',
  'Cupro-Nickel':'bg-slate-300 text-slate-800',
  Nickel:        'bg-slate-300 text-slate-800',
  Bimetallic:    'bg-gradient-to-r from-yellow-300 to-gray-300 text-gray-800',
  Aluminium:     'bg-slate-200 text-slate-700',
  Brass:         'bg-yellow-400 text-yellow-900',
  Billon:        'bg-stone-300 text-stone-800',
  Steel:         'bg-gray-300 text-gray-700',
  Other:         'bg-stone-200 text-stone-700',
};

export const COUNTRY_FLAGS: Record<string, string> = {
  EG: '🇪🇬', SA: '🇸🇦', AE: '🇦🇪', QA: '🇶🇦', QD: '🇶🇦',
  IQ: '🇮🇶', JO: '🇯🇴', LB: '🇱🇧', LY: '🇱🇾', MA: '🇲🇦',
  OM: '🇴🇲', PS: '🇵🇸', SD: '🇸🇩', SY: '🇸🇾', DZ: '🇩🇿',
  TN: '🇹🇳', YE: '🇾🇪', KW: '🇰🇼', MR: '🇲🇷',
};

export const COUNTRIES: { cc: string; co: string; co_ar: string }[] = [
  { cc: 'EG', co: 'Egypt',        co_ar: 'مصر' },
  { cc: 'MA', co: 'Morocco',      co_ar: 'المغرب' },
  { cc: 'SA', co: 'Saudi Arabia', co_ar: 'المملكة العربية السعودية' },
  { cc: 'AE', co: 'UAE',          co_ar: 'الإمارات' },
  { cc: 'IQ', co: 'Iraq',         co_ar: 'العراق' },
  { cc: 'OM', co: 'Oman',         co_ar: 'عُمان' },
  { cc: 'SD', co: 'Sudan',        co_ar: 'السودان' },
  { cc: 'LY', co: 'Libya',        co_ar: 'ليبيا' },
  { cc: 'SY', co: 'Syria',        co_ar: 'سوريا' },
  { cc: 'DZ', co: 'Algeria',      co_ar: 'الجزائر' },
  { cc: 'JO', co: 'Jordan',       co_ar: 'الأردن' },
  { cc: 'LB', co: 'Lebanon',      co_ar: 'لبنان' },
  { cc: 'TN', co: 'Tunisia',      co_ar: 'تونس' },
  { cc: 'YE', co: 'Yemen',        co_ar: 'اليمن' },
  { cc: 'QA', co: 'Qatar',        co_ar: 'قطر' },
  { cc: 'KW', co: 'Kuwait',       co_ar: 'الكويت' },
  { cc: 'PS', co: 'Palestine',    co_ar: 'فلسطين' },
  { cc: 'MR', co: 'Mauritania',   co_ar: 'موريتانيا' },
  { cc: 'QD', co: 'Qatar & Dubai',co_ar: 'قطر ودبي' },
];

export function getDiscGradient(metal: string): string {
  return DISC_GRADIENTS[metal] ?? DISC_GRADIENTS.Other;
}

export function getMetalSymbol(metal: string): string {
  const map: Record<string, string> = {
    Gold: 'ذ', Silver: 'ف', Bronze: 'ن', Copper: 'ن',
  };
  return map[metal] ?? 'ع';
}

export function formatMintage(mint: string, locale: string = 'ar'): string {
  if (!mint) return '';
  const n = parseInt(mint, 10);
  if (isNaN(n)) return mint;
  return n.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
}

export function isValidImageUrl(url: string): boolean {
  return Boolean(url && url.startsWith('http') && !url.includes('no-obve') && !url.includes('no-reve'));
}

export function getCoinName(coin: Coin, locale: string): string {
  if (locale !== 'ar') return coin.name;
  // Always run translator — nar may be partial (e.g. "Akce · محمد")
  const base = (coin.nar && coin.nar.trim()) ? coin.nar : coin.name;
  return translateCoinName(base);
}

export function getCoinYear(coin: Coin, locale: string): string {
  const ce = coin.yce ? `${coin.yce}${locale === 'ar' ? ' م' : ' CE'}` : '';
  const ah = coin.yah ? `(${coin.yah}${locale === 'ar' ? ' هـ' : ' AH'})` : '';
  return [ce, ah].filter(Boolean).join(' ');
}
