import type { Coin } from '@/types/coin';

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
  return locale === 'ar' ? (coin.nar || coin.name) : coin.name;
}

export function getCoinYear(coin: Coin, locale: string): string {
  const ce = coin.yce ? `${coin.yce}${locale === 'ar' ? ' م' : ' CE'}` : '';
  const ah = coin.yah ? `(${coin.yah}${locale === 'ar' ? ' هـ' : ' AH'})` : '';
  return [ce, ah].filter(Boolean).join(' ');
}
