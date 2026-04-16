/**
 * Hijri ↔ Gregorian date converter for numismatic use.
 * Uses the Kuwaiti algorithm (most accurate for coin dates post-1582).
 */

export function hijriToGregorian(year: number, month = 1, day = 1): { year: number; month: number; day: number } {
  // Julian Day Number from Hijri
  const jdn =
    Math.floor((11 * year + 3) / 30) +
    354 * year +
    30 * month -
    Math.floor((month - 1) / 2) +
    day +
    1948440 -
    385;

  // Convert JDN to Gregorian
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const ll = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (ll + 1)) / 1461001);
  const lll = ll - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * lll) / 2447);
  const day_g = lll - Math.floor((2447 * j) / 80);
  const llll = Math.floor(j / 11);
  const month_g = j + 2 - 12 * llll;
  const year_g = 100 * (n - 49) + i + llll;

  return { year: year_g, month: month_g, day: day_g };
}

export function gregorianToHijri(year: number, month: number, day: number): { year: number; month: number; day: number } {
  // JDN from Gregorian
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // JDN to Hijri
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const ll = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719) +
    Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
  const lll =
    ll -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month_h = Math.floor((24 * lll) / 709);
  const day_h = lll - Math.floor((709 * month_h) / 24);
  const year_h = 30 * n + j - 30;

  return { year: year_h, month: month_h, day: day_h };
}

export function approximateGregorianYear(hijriYear: number): number {
  return Math.round(hijriYear - hijriYear / 33.7 + 622);
}

export function approximateHijriYear(gregorianYear: number): number {
  return Math.round((gregorianYear - 622) * 1.0307);
}

export const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

export const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi I', 'Rabi II',
  'Jumada I', 'Jumada II', 'Rajab', 'Shaaban',
  'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah',
];
