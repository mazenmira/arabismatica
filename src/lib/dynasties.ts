/**
 * dynasties.ts
 *
 * Canonical chronological order of Islamic dynasties.
 * Shared between CataloguePage (dropdown order + sort) and any other component.
 */

/** Arabic dyn field values in historical order */
export const DYNASTY_ORDER: readonly string[] = [
  'الإسلام المبكر',       // 661–696 CE  Pre-Reform
  'الدولة الأموية',        // 661–750 CE  Umayyad
  'الأمويون في الأندلس',   // 756–1031 CE Umayyad Andalus
  'الخلافة العباسية',      // 750–1258 CE Abbasid
  'الخلافة الفاطمية',      // 909–1171 CE Fatimid
  'الحمدانيون',           // 890–1004 CE Hamdanid
  'البويهيون',             // 934–1062 CE Buyid
  'الزنكيون',              // 1127–1250 CE Zangid
  'الأيوبيون',             // 1171–1341 CE Ayyubid
  'المرابطون',             // 1040–1147 CE Almoravid
  'الموحدون',              // 1121–1269 CE Almohad
  'المماليك',              // 1250–1517 CE Mamluk
  'السامانيون',            // 819–1005 CE  Samanid
  'الأرتقيون',             // 1101–1409 CE Artuqid
  'الإيلخانيون',           // 1256–1335 CE Ilkhanid
  'سلطنات شرق أفريقيا',    // varies       East Africa
] as const;

/** Returns sort index (lower = earlier). dyn not in list → 9999 (goes to end). */
export function dynastyIndex(dyn: string): number {
  const i = (DYNASTY_ORDER as readonly string[]).indexOf(dyn);
  return i === -1 ? 9999 : i;
}
