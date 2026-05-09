// ─── src/lib/coinTranslations.ts ─────────────────────────────────────────────
// Central translation + normalisation logic for coin names.
// Import translateCoinName() wherever you render coin names in Arabic.

// ── Roman numeral ordinals ────────────────────────────────────────────────────
const ROMAN_ORDINALS: Record<string, string> = {
  ' I ':    ' الأول ',
  ' II ':   ' الثاني ',
  ' III ':  ' الثالث ',
  ' IV ':   ' الرابع ',
  ' V ':    ' الخامس ',
  ' VI ':   ' السادس ',
  ' VII ':  ' السابع ',
  ' VIII ': ' الثامن ',
  ' IX ':   ' التاسع ',
  ' X ':    ' العاشر ',
};

// Also handle Roman numerals at END of string (e.g. "Fuad I")
const ROMAN_END: [RegExp, string][] = [
  [/ VIII$/i, ' الثامن'],
  [/ VII$/i,  ' السابع'],
  [/ VI$/i,   ' السادس'],
  [/ IV$/i,   ' الرابع'],
  [/ IX$/i,   ' التاسع'],
  [/ III$/i,  ' الثالث'],
  [/ II$/i,   ' الثاني'],
  [/ I$/i,    ' الأول'],
  [/ V$/i,    ' الخامس'],
  [/ X$/i,    ' العاشر'],
];

// ── Full phrase dictionary (longest match first) ──────────────────────────────
const PHRASE_MAP: [RegExp, string][] = [
  // Royal/Type terms
  [/Facing Right/gi,               'الزي الملكي'],
  [/Civic Attire/gi,               'الزي الملكي'],
  [/Facing Left/gi,                'زي التشريفة العسكرية'],
  [/Type 1\b/gi,                   'نوع أول'],
  [/Type 2\b/gi,                   'نوع ثاني'],
  [/Type 3\b/gi,                   'نوع ثالث'],
  [/Type I\b/gi,                   'نوع أول'],
  [/Type II\b/gi,                  'نوع ثاني'],
  [/Type III\b/gi,                 'نوع ثالث'],
  [/Gold Pattern/gi,               'نموذج ذهب'],
  [/Bronze Pattern/gi,             'نموذج برونز'],
  [/Trial Strike/gi,               'نسخة تجريبية'],
  [/Pattern/gi,                    'نموذج'],

  // Coin varieties
  [/Piastres/gi,                   'قرش'],
  [/Piastre/gi,                    'قرش'],
  [/With Hole/gi,                  'مثقوب'],
  [/With Flower/gi,                'بالوردة'],
  [/Royal Wedding/gi,              'الزواج الملكي'],
  [/Old Design/gi,                 'تصميم قديم'],
  [/French Occupation/gi,          'الاحتلال الفرنسي'],
  [/Zeri Mahbub/gi,                'زر محبوب'],
  [/Zari Mahbub/gi,                'زر محبوب'],
  [/Coyrek Rumi/gi,                'كويريك رومي'],
  [/Mangir/gi,                     'مانجير'],
  [/Mahbub/gi,                     'محبوب'],

  // Rulers (multi-word first)
  [/Abdul Hamid/gi,                'عبدالحميد'],
  [/Abdulhamid/gi,                 'عبدالحميد'],
  [/Abdulaziz/gi,                  'عبدالعزيز'],
  [/Abdul Aziz/gi,                 'عبدالعزيز'],
  [/Abdulmecid/gi,                 'عبدالمجيد'],
  [/Abdul Mecid/gi,                'عبدالمجيد'],
  [/Said Pasha/gi,                 'سعيد باشا'],
  [/Ali Bey/gi,                    'علي بك'],
  [/Hussein Kamel/gi,              'حسين كامل'],
  [/Fuad/gi,                       'فؤاد'],
  [/Farouk/gi,                     'فاروق'],
  [/Faruq/gi,                      'فاروق'],

  // Locations
  [/the magnificent Misr al-Mahrusa/gi, 'مصر المحروسة'],
  [/Misr al-Mahrusa/gi,            'مصر المحروسة'],
  [/Misr/gi,                       'مصر'],

  // Denominations
  [/Milliemes?\b/gi,               'مليم'],
  [/Pound/gi,                      'جنيه'],
  [/Qirsh/gi,                      'قرش'],
  [/Para\b/gi,                     'بارة'],
  [/Sultani/gi,                    'سلطاني'],
  [/Jadid/gi,                      'جديد'],
  [/Medini|Medin\b/gi,             'مديني'],
  [/Akche|Akce\b/gi,               'أقجة'],
  [/Manghir/gi,                    'مانجير'],
];

export function translateCoinName(englishName: string): string {
  let s = englishName;

  // 1. Apply phrase map
  for (const [re, ar] of PHRASE_MAP) {
    s = s.replace(re, ar);
  }

  // 2. Apply mid-string Roman ordinals
  for (const [roman, ar] of Object.entries(ROMAN_ORDINALS)) {
    s = s.split(roman).join(ar);
  }

  // 3. Apply end-of-string Roman ordinals
  for (const [re, ar] of ROMAN_END) {
    s = s.replace(re, ar);
  }

  return s.trim();
}

// ── Rarity translation ────────────────────────────────────────────────────────
export const RARITY_AR: Record<string, string> = {
  Common:   'شائع',
  Uncommon: 'غير شائع',
  Scarce:   'نادر نسبياً',
  Rare:     'نادر',
};

export function rarityLabel(rarity: string | null, locale: string): string | null {
  if (!rarity) return null;
  if (locale !== 'ar') return rarity;
  return RARITY_AR[rarity] ?? rarity;
}
