// v3.1
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Camera, Grid3X3, List, X, CalendarDays, ArrowUp, FileDown, Moon, Sun } from 'lucide-react';
import CoinCard from './CoinCard';
import CoinModal from './CoinModal';
import AdminPanel from './AdminPanel';
import HeroBanner from './HeroBanner';
import AuthModal from '@/components/auth/AuthModal';
import Dashboard from '@/components/dashboard/Dashboard';
import { supabase } from '@/lib/supabase';
import { useCollection } from '@/hooks/useCollection';
import { useWishlist } from '@/hooks/useWishlist';
import type { Coin, FilterState } from '@/types/coin';
import { COUNTRIES, COUNTRY_FLAGS } from '@/lib/coins';

// ── Supabase-powered data loading ─────────────────────────
import { getCoins, searchCoins, getDistinctValues } from '@/lib/coinsApi';
import type { CoinFilters } from '@/lib/coinsApi';
import { dynastyIndex } from '@/lib/dynasties';

// ── Dynasty filter system ────────────────────────────────────────────────
// Two modes:
//   'national' — year-range pills per country (current behaviour)
//   'dynastic' — cross-country historical dynasty groups (new)

// ── NATIONAL ERA pills (year-range based) ────────────────────────────────
const DYNASTY_YEAR_RANGES: Record<string, { cc: string | '*'; from: number; to: number }[]> = {
  ottoman:    [{ cc: '*',  from: 1299, to: 1918 }],
  hejaz_najd: [{ cc: 'SA', from: 1916, to: 1931 }],
  muhali:     [{ cc: 'EG', from: 1805, to: 1882 }],
  sultanate:  [{ cc: 'EG', from: 1883, to: 1921 }],
  kingdom:    [{ cc: 'EG', from: 1922, to: 1952 }, { cc: 'IQ', from: 1921, to: 1958 }, { cc: 'LY', from: 1952, to: 1969 }, { cc: 'JO', from: 1920, to: 1999 }, { cc: 'SA', from: 1932, to: 2099 }],
  republic:   [{ cc: 'EG', from: 1953, to: 2099 }, { cc: 'IQ', from: 1958, to: 2099 }, { cc: 'SY', from: 1946, to: 2099 }, { cc: 'LB', from: 1943, to: 2099 }, { cc: 'YE', from: 1962, to: 2099 }, { cc: 'DZ', from: 1962, to: 2099 }, { cc: 'SD', from: 1956, to: 2099 }, { cc: 'MR', from: 1960, to: 2099 }, { cc: 'TN', from: 1957, to: 2099 }, { cc: 'LY', from: 1969, to: 2099 }],
  gulf:       [{ cc: 'AE', from: 1960, to: 2099 }, { cc: 'QA', from: 1960, to: 2099 }, { cc: 'KW', from: 1960, to: 2099 }, { cc: 'OM', from: 1960, to: 2099 }, { cc: 'QD', from: 1960, to: 2099 }],
  french:     [{ cc: 'MA', from: 1912, to: 1956 }, { cc: 'TN', from: 1881, to: 1956 }, { cc: 'DZ', from: 1830, to: 1962 }, { cc: 'LB', from: 1920, to: 1943 }, { cc: 'SY', from: 1920, to: 1946 }],
  imamate:    [{ cc: 'YE', from: 1800, to: 1962 }, { cc: 'OM', from: 1800, to: 1970 }],
  maghreb:    [{ cc: 'MA', from: 1600, to: 2099 }, { cc: 'DZ', from: 1500, to: 2099 }, { cc: 'TN', from: 1700, to: 2099 }],
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function coinMatchesDynastyPill(coin: { cc: string; yce?: string }, pillKey: string): boolean {
  const ranges = DYNASTY_YEAR_RANGES[pillKey];
  if (!ranges) return false;
  const year = parseInt(coin.yce || '0');
  return ranges.some(r =>
    (r.cc === '*' || r.cc === coin.cc) && year >= r.from && year <= r.to
  );
}

const DYNASTY_PILLS: { key: string; label_ar: string; label_en: string; icon: string }[] = [
  { key: 'ottoman',    label_ar: 'العثمانيون',        label_en: 'Ottoman',          icon: '🌙' },
  { key: 'hejaz_najd', label_ar: 'الحجاز ونجد',       label_en: 'Hejaz & Najd',     icon: '⚔️' },
  { key: 'muhali',     label_ar: 'أسرة محمد علي',     label_en: 'Muhammad Ali',     icon: '👑' },
  { key: 'sultanate',  label_ar: 'السلطنة المصرية',   label_en: 'Sultanate',        icon: '🏛️' },
  { key: 'kingdom',    label_ar: 'ملكي',              label_en: 'Kingdom',          icon: '👑' },
  { key: 'republic',   label_ar: 'الجمهورية',         label_en: 'Republic',         icon: '🏛️' },
  { key: 'gulf',       label_ar: 'دول الخليج',        label_en: 'Gulf States',      icon: '🛢️' },
  { key: 'french',     label_ar: 'الحماية الفرنسية',  label_en: 'French Colonial',  icon: '🇫🇷' },
  { key: 'imamate',    label_ar: 'الإمامة',           label_en: 'Imamate',          icon: '📜' },
  { key: 'maghreb',    label_ar: 'المغرب العربي',     label_en: 'Maghreb',          icon: '🌅' },
];

// ── DYNASTIC GROUPS (cross-country, matched on dyn field) ─────────────────
interface DynastyGroup {
  key:       string;
  label_ar:  string;
  label_en:  string;
  icon:      string;
  period:    string;       // e.g. "750–1258 CE"
  desc_ar:   string;
  desc_en:   string;
  // dyn field substrings OR year+cc ranges — whichever is more accurate
  dynMatch?: string[];     // substrings to match in coin.dyn
  yearRanges?: { cc: string | '*'; from: number; to: number }[];
}

const DYNASTIC_GROUPS: DynastyGroup[] = [
  {
    key: 'umayyad', label_ar: 'الدولة الأموية', label_en: 'Umayyad Caliphate',
    icon: '☪️', period: '661–750 CE',
    desc_ar: 'أول خلافة إسلامية كبرى. ضربت عملاتها الفضية الدراهم والذهبية الدنانير في دمشق وسائر الأمصار.',
    desc_en: 'The first major Islamic caliphate. Struck silver dirhams and gold dinars from Damascus and across the empire.',
    dynMatch: ['أموي', 'Umayyad', 'الدولة الأموية', 'Umayyad Caliphate'],
    yearRanges: [{ cc: '*', from: 661, to: 750 }],
  },
  {
    key: 'abbasid', label_ar: 'الخلافة العباسية', label_en: 'Abbasid Caliphate',
    icon: '🕌', period: '750–1258 CE',
    desc_ar: 'الخلافة الإسلامية الكبرى الثانية. مركزها بغداد. أنتجت أوفر العملات الإسلامية وأجملها خطاً.',
    desc_en: 'The second great Islamic caliphate, centred in Baghdad. Produced the most prolific and calligraphically refined Islamic coinage.',
    dynMatch: ['عباسي', 'عباسية', 'Abbasid', 'الخلافة العباسية', 'Abbasid Caliphate'],
    yearRanges: [{ cc: '*', from: 750, to: 1258 }],
  },
  {
    key: 'fatimid', label_ar: 'الدولة الفاطمية', label_en: 'Fatimid Caliphate',
    icon: '⭐', period: '909–1171 CE',
    desc_ar: 'خلافة شيعية إسماعيلية حكمت مصر وشمال أفريقيا والشام. اشتُهرت بالدنانير الذهبية الرفيعة.',
    desc_en: 'Ismaili Shia caliphate ruling Egypt, North Africa and the Levant. Renowned for their refined gold dinars.',
    dynMatch: ['فاطمي', 'فاطمية', 'Fatimid', 'الدولة الفاطمية', 'Fatimid Caliphate'],
    yearRanges: [{ cc: '*', from: 909, to: 1171 }],
  },
  {
    key: 'ayyubid', label_ar: 'الدولة الأيوبية', label_en: 'Ayyubid Dynasty',
    icon: '⚔️', period: '1171–1260 CE',
    desc_ar: 'أسسها صلاح الدين الأيوبي في مصر والشام. عملاتها النحاسية والفضية تتميز بأسماء السلاطين وألقابهم.',
    desc_en: 'Founded by Saladin in Egypt and Syria. Copper and silver coins feature sultan names and titles.',
    dynMatch: ['أيوبي', 'أيوبية', 'Ayyubid', 'الدولة الأيوبية', 'Ayyubid Dynasty'],
    yearRanges: [{ cc: '*', from: 1171, to: 1260 }],
  },
  {
    key: 'mamluk', label_ar: 'دولة المماليك', label_en: 'Mamluk Sultanate',
    icon: '🏇', period: '1250–1517 CE',
    desc_ar: 'سلطنة المماليك في مصر والشام. عملاتها النحاسية الفلوس من أكثر العملات الإسلامية الوسيطة تنوعاً.',
    desc_en: 'The Mamluk sultanate of Egypt and Syria. Their copper fulus are among the most varied medieval Islamic coins.',
    dynMatch: ['مملوك', 'مملوكي', 'Mamluk', 'دولة المماليك', 'Mamluk Sultanate'],
    yearRanges: [{ cc: '*', from: 1250, to: 1517 }],
  },
  {
    key: 'ottoman_full', label_ar: 'الدولة العثمانية', label_en: 'Ottoman Empire',
    icon: '🌙', period: '1299–1924 CE',
    desc_ar: 'حكمت الدولة العثمانية العالم العربي من القرن السادس عشر حتى مطلع القرن العشرين. عملاتها تتنوع بين القروش والمنقور والذهب.',
    desc_en: 'The Ottoman Empire ruled the Arab world from the 16th century. Coins range from silver qirsh to gold altin.',
    dynMatch: ['الدولة العثمانية', 'العثمانية', 'Ottoman'],
    yearRanges: [{ cc: '*', from: 1299, to: 1924 }],
  },
  {
    key: 'hejaz_najd_dyn', label_ar: 'الحجاز ونجد', label_en: 'Hejaz & Najd',
    icon: '🕋', period: '1916–1932 CE',
    desc_ar: 'إمارة الحجاز ونجد قبيل تأسيس المملكة العربية السعودية. ريالاتها الفضية نادرة ومطلوبة.',
    desc_en: 'Pre-kingdom Hejaz and Najd coinage. Silver riyals are rare and highly sought.',
    dynMatch: ['الحجاز قبل المملكة', 'الحجاز ونجد', 'Hejaz'],
    yearRanges: [{ cc: 'SA', from: 1916, to: 1932 }],
  },
  {
    key: 'french_col', label_ar: 'الحماية الفرنسية', label_en: 'French Colonial',
    icon: '🇫🇷', period: '1830–1962 CE',
    desc_ar: 'عملات الاستعمار الفرنسي في المغرب وتونس والجزائر ولبنان وسوريا. تتميز بتصاميم باريسية على نقوش عربية.',
    desc_en: 'French colonial coins from Morocco, Tunisia, Algeria, Lebanon and Syria. Paris designs with Arabic inscriptions.',
    dynMatch: ['الحماية الفرنسية', 'الانتداب الفرنسي', 'الجزائر الفرنسية', 'French'],
  },
  {
    key: 'kingdoms_ar', label_ar: 'الممالك العربية', label_en: 'Arab Kingdoms',
    icon: '👑', period: '1920–present',
    desc_ar: 'عملات الممالك العربية المستقلة: مصر والعراق والأردن وليبيا والمملكة العربية السعودية والمغرب.',
    desc_en: 'Coins of independent Arab kingdoms: Egypt, Iraq, Jordan, Libya, Saudi Arabia, Morocco.',
    dynMatch: ['المملكة', 'الإمارة', 'Kingdom', 'Emirate'],
    yearRanges: [
      { cc: 'EG', from: 1922, to: 1952 },
      { cc: 'IQ', from: 1921, to: 1958 },
      { cc: 'LY', from: 1952, to: 1969 },
      { cc: 'JO', from: 1920, to: 2099 },
      { cc: 'SA', from: 1932, to: 2099 },
      { cc: 'MA', from: 1957, to: 2099 },
    ],
  },
  {
    key: 'republics_ar', label_ar: 'الجمهوريات العربية', label_en: 'Arab Republics',
    icon: '🏛️', period: '1952–present',
    desc_ar: 'عملات الجمهوريات العربية الحديثة: مصر وسوريا والعراق واليمن وليبيا والجزائر وتونس والسودان.',
    desc_en: 'Modern Arab republic coinage from Egypt, Syria, Iraq, Yemen, Libya, Algeria, Tunisia and Sudan.',
    dynMatch: ['الجمهورية', 'Republic'],
  },
  {
    key: 'gulf_states', label_ar: 'دول الخليج', label_en: 'Gulf States',
    icon: '🛢️', period: '1960–present',
    desc_ar: 'عملات دول الخليج العربي: الإمارات والكويت وقطر وعُمان والبحرين وقطر ودبي.',
    desc_en: 'Gulf state coinage: UAE, Kuwait, Qatar, Oman, Bahrain and the historic Qatar & Dubai.',
    dynMatch: ['الإمارات', 'إمارة الكويت', 'دولة قطر', 'عهد السلطان قابوس'],
    yearRanges: [
      { cc: 'AE', from: 1960, to: 2099 },
      { cc: 'KW', from: 1960, to: 2099 },
      { cc: 'QA', from: 1960, to: 2099 },
      { cc: 'OM', from: 1960, to: 2099 },
      { cc: 'QD', from: 1960, to: 2099 },
    ],
  },
  {
    key: 'imamates', label_ar: 'الإمامات', label_en: 'Imamates',
    icon: '📜', period: '1800–1970 CE',
    desc_ar: 'عملات الإمامات الإسلامية: إمامة اليمن الزيدية وإمامة عُمان. من أندر عملات الجزيرة العربية.',
    desc_en: 'Zaydi Yemeni and Omani imamate coinage. Among the rarest Arabian Peninsula issues.',
    dynMatch: ['الإمامة', 'إمامة', 'إمام', 'Imamate'],
    yearRanges: [
      { cc: 'YE', from: 1800, to: 1962 },
      { cc: 'OM', from: 1800, to: 1970 },
    ],
  },
  // ── 13 additional Arab dynasties ─────────────────────────────────────────
  {
    key: 'umayyad_andalus', label_ar: 'الأمويون في الأندلس', label_en: 'Umayyad of al-Andalus',
    icon: '🕌', period: '138–422 AH (756–1031 CE)',
    desc_ar: 'إمارة قرطبة ثم الخلافة الأندلسية. ضربت دنانير وصرفيات بالغة الجمال من قرطبة وسواها.',
    desc_en: 'The Andalusian Umayyad emirate and caliphate of Córdoba. Struck magnificent gold dinars and silver dirhams.',
    dynMatch: ['الأمويون في الأندلس', 'Umayyad of al-Andalus', 'Umayyad of Andalus', 'أموي الأندلس'],
  },
  {
    key: 'tulunid', label_ar: 'الدولة الطولونية', label_en: 'Tulunid Dynasty',
    icon: '🦅', period: '254–292 AH (868–905 CE)',
    desc_ar: 'أول دولة مستقلة في مصر بعد الفتح الإسلامي. أسسها أحمد بن طولون. دراهمها ودنانيرها نادرة.',
    desc_en: 'The first autonomous dynasty in Islamic Egypt, founded by Ahmad ibn Tulun. Their coins are rare survivors.',
    dynMatch: ['الدولة الطولونية', 'Tulunid', 'طولوني', 'ابن طولون'],
  },
  {
    key: 'ikhshidid', label_ar: 'الإخشيديون', label_en: 'Ikhshidid Dynasty',
    icon: '⚜️', period: '323–358 AH (935–969 CE)',
    desc_ar: 'حكمت مصر والشام بين الطولونيين والفاطميين. عملاتها الفضية تحمل ألقاب الإخشيد.',
    desc_en: 'Ruled Egypt and Syria between the Tulunids and Fatimids. Silver coins bear the Ikhshid title.',
    dynMatch: ['الإخشيديون', 'Ikhshidid', 'إخشيدي', 'الإخشيد'],
  },
  {
    key: 'hamdanid', label_ar: 'الحمدانيون', label_en: 'Hamdanid Dynasty',
    icon: '⚔️', period: '293–394 AH (905–1004 CE)',
    desc_ar: 'سلالة عربية شيعية حكمت الموصل وحلب. اشتُهرت بالشعر والجهاد ضد البيزنطيين.',
    desc_en: 'Arab Shia dynasty ruling Mosul and Aleppo. Famous for poetry and warfare against Byzantium.',
    dynMatch: ['الحمدانيون', 'Hamdanid', 'حمداني', 'سيف الدولة'],
  },
  {
    key: 'aghlabid', label_ar: 'الأغالبة', label_en: 'Aghlabid Dynasty',
    icon: '🌴', period: '184–296 AH (800–909 CE)',
    desc_ar: 'حكمت إفريقية (تونس وليبيا) باسم العباسيين. دراهمها الفضية من نوادر العملات الإسلامية في الغرب.',
    desc_en: 'Ruled Ifriqiya (Tunisia/Libya) as Abbasid vassals. Their silver dirhams are rare western Islamic issues.',
    dynMatch: ['الأغالبة', 'Aghlabid', 'أغلبي'],
  },
  {
    key: 'idrisid', label_ar: 'الأدارسة', label_en: 'Idrisid Dynasty',
    icon: '📿', period: '172–313 AH (789–926 CE)',
    desc_ar: 'أول دولة إسلامية في المغرب الأقصى. أسسها إدريس الأول الهارب من العباسيين. دراهمها الفضية نادرة جداً.',
    desc_en: 'The first Islamic dynasty in Morocco, founded by Idris I, a refugee from the Abbasids. Extremely rare silver dirhams.',
    dynMatch: ['الأدارسة', 'Idrisid', 'إدريسي', 'إدريس'],
  },
  {
    key: 'hafsid', label_ar: 'الحفصيون', label_en: 'Hafsid Dynasty',
    icon: '🏛️', period: '625–982 AH (1228–1574 CE)',
    desc_ar: 'خلفاء الموحدين في تونس وطرابلس. عملاتهم الذهبية والفضية نموذج للحضارة المغاربية.',
    desc_en: 'Almohad successors in Tunisia and Tripolitania. Their gold and silver coins exemplify Maghrebi civilisation.',
    dynMatch: ['الحفصيون', 'Hafsid', 'حفصي'],
  },
  {
    key: 'merinid', label_ar: 'المرينيون', label_en: 'Merinid Dynasty',
    icon: '🦁', period: '592–869 AH (1196–1465 CE)',
    desc_ar: 'سلالة بربرية حكمت المغرب والأندلس. مدرسة فاس نموذجها في الحضارة. عملاتهم الذهبية من أجمل المغاربية.',
    desc_en: 'Berber dynasty ruling Morocco and al-Andalus. Their gold dinars are among the finest Maghrebi coins.',
    dynMatch: ['المرينيون', 'Merinid', 'مريني'],
  },
  {
    key: 'almoravid', label_ar: 'المرابطون', label_en: 'Almoravid Dynasty',
    icon: '☪️', period: '448–541 AH (1056–1147 CE)',
    desc_ar: 'حركة إصلاحية بربرية وحّدت المغرب والأندلس. دنانيرهم الذهبية لا تزال مرجعاً في النقائش الكوفية.',
    desc_en: 'Berber reform movement that unified Morocco and al-Andalus. Their gold dinars remain benchmarks of Kufic epigraphy.',
    dynMatch: ['المرابطون', 'Almoravid', 'مرابط', 'المرابطين'],
  },
  {
    key: 'almohad', label_ar: 'الموحدون', label_en: 'Almohad Dynasty',
    icon: '🌙', period: '524–668 AH (1130–1269 CE)',
    desc_ar: 'أعظم إمبراطورية إسلامية في الغرب. عملاتهم المربعة الشكل ابتكار لا مثيل له في التاريخ النقدي.',
    desc_en: 'The greatest Islamic empire in the west. Their distinctive square coins are unique in numismatic history.',
    dynMatch: ['الموحدون', 'Almohad', 'موحدي', 'الموحدين'],
  },
  {
    key: 'zangid', label_ar: 'الزنكيون', label_en: 'Zangid Dynasty',
    icon: '⚔️', period: '521–619 AH (1127–1222 CE)',
    desc_ar: 'حكمت الموصل وحلب وأجزاء من الشام. نور الدين زنكي وحّد الشام لمواجهة الصليبيين. فلوسهم النحاسية نادرة.',
    desc_en: 'Ruled Mosul, Aleppo and parts of Syria. Nur al-Din united Syria against the Crusaders. Rare copper fulus.',
    dynMatch: ['الزنكيون', 'Zangid', 'زنكي', 'نور الدين'],
  },
  {
    key: 'artuqid', label_ar: 'الأرتقيون', label_en: 'Artuqid Dynasty',
    icon: '🏰', period: '484–811 AH (1101–1409 CE)',
    desc_ar: 'سلالة تركمانية حكمت ديار بكر والجزيرة الفراتية. عملاتهم النحاسية الكبيرة بالصور البيزنطية فريدة.',
    desc_en: 'Turkmen dynasty of Diyar Bakr. Their large copper coins featuring Byzantine imagery are uniquely striking.',
    dynMatch: ['الأرتقيون', 'Artuqid', 'أرتقي', 'أرتق'],
  },
  {
    key: 'east_africa', label_ar: 'سلطنات شرق أفريقيا', label_en: 'East African Sultanates',
    icon: '🌊', period: '4th–14th C. AH',
    desc_ar: 'سلطنات الساحل الأفريقي الشرقي: كلوة وممباسة وزنجبار وغيرها. عملاتها النحاسية تعكس حضارة سواحيلية إسلامية.',
    desc_en: 'East African coastal sultanates: Kilwa, Mombasa, Zanzibar and more. Copper coins reflecting Swahili Islamic civilisation.',
    dynMatch: ['سلطنات شرق أفريقيا', 'East Africa', 'Kilwa', 'Swahili'],
  },
  // ── Latest scraped dynasties ───────────────────────────────────────────
  {
    key: 'ilkhanid', label_ar: 'الإيلخانيون', label_en: 'Ilkhanid Dynasty',
    icon: '🏹', period: '654–758 AH (1256–1357 CE)',
    desc_ar: 'المغول الإسلاميون حكام فارس والعراق. اعتنقوا الإسلام وضربوا عملات عربية رفيعة في بغداد وتبريز.',
    desc_en: 'The Islamised Mongols of Persia and Iraq. Struck Arabic coins of high quality in Baghdad and Tabriz.',
    dynMatch: ['الإيلخانيون', 'Ilkhanid', 'إيلخاني', 'هولاكو'],
  },
  {
    key: 'samanid', label_ar: 'السامانيون', label_en: 'Samanid Dynasty',
    icon: '🌺', period: '261–395 AH (875–1005 CE)',
    desc_ar: 'أول سلالة إيرانية مستقلة بعد الفتح الإسلامي. دراهمهم الفضية هي الأكثر شيوعاً في العصور الوسطى.',
    desc_en: 'The first independent Iranian dynasty post-Islam. Their silver dirhams are the most commonly found medieval Islamic coins.',
    dynMatch: ['السامانيون', 'Samanid', 'ساماني'],
  },
  {
    key: 'buyid', label_ar: 'البويهيون', label_en: 'Buyid Dynasty',
    icon: '⚜️', period: '322–447 AH (934–1055 CE)',
    desc_ar: 'سلالة شيعية إيرانية حكمت العراق وفارس. أذلّوا الخليفة العباسي وأمسكوا بزمام السلطة الفعلية.',
    desc_en: 'Shia Iranian dynasty controlling Iraq and Persia. They held the Abbasid caliph as a figurehead while wielding real power.',
    dynMatch: ['البويهيون', 'Buyid', 'بويهي', 'بويه'],
  },
  {
    key: 'pre_reform', label_ar: 'الإسلام المبكر', label_en: 'Early Islamic (Pre-Reform)',
    icon: '🌙', period: '15–77 AH (636–697 CE)',
    desc_ar: 'أقدم العملات الإسلامية قبل إصلاح عبد الملك عام 77هـ. تجمع بين التصاميم البيزنطية والساسانية والنقوش العربية.',
    desc_en: 'The earliest Islamic coins before the reform of Abd al-Malik in 77 AH. Blend Byzantine and Sasanian designs with Arabic inscriptions.',
    dynMatch: ['الإسلام المبكر', 'Early Islamic', 'Pre-Reform', 'Arab-Byzantine', 'Arab-Sasanian'],
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function coinMatchesDynasticGroup(coin: Coin, groupKey: string): boolean {
  const group = DYNASTIC_GROUPS.find(g => g.key === groupKey);
  if (!group) return false;

  // 1. dyn field match — works for both IS coins (Zeno) and national coins
  if (group.dynMatch && coin.dyn) {
    if (group.dynMatch.some(m => coin.dyn.includes(m))) return true;
  }

  // 2. For IS (Islamic/Zeno) coins, also match on coin name if dyn is missing
  if (coin.cc === 'IS' && group.dynMatch && coin.name) {
    if (group.dynMatch.some(m => coin.name.toLowerCase().includes(m.toLowerCase()))) return true;
  }

  // 3. Year+cc ranges — for national coins where dyn field may be inconsistent
  //    Skip for IS coins — they're already handled by dyn matching above
  if (group.yearRanges && coin.cc !== 'IS') {
    const year = parseInt(coin.yce || '0');
    if (year > 0 && group.yearRanges.some(r =>
      (r.cc === '*' || r.cc === coin.cc) && year >= r.from && year <= r.to
    )) return true;
  }
  return false;
}





const METAL_OPTIONS = [
  'Gold','Silver','Copper','Bronze','Cupro-Nickel',
  'Bimetallic','Aluminium','Billon','Brass','Nickel','Steel',
];

const ERA_OPTIONS = [
  { value: '661-750',   label_ar: '٦٦١–٧٥٠ (الأموي)',   label_en: '661–750 (Umayyad)' },
  { value: '750-1258',  label_ar: '٧٥٠–١٢٥٨ (العباسي)', label_en: '750–1258 (Abbasid)' },
  { value: '1258-1517', label_ar: '١٢٥٨–١٥١٧ (وسيط)',   label_en: '1258–1517 (Medieval)' },
  { value: '1299-1918', label_ar: '١٢٩٩–١٩١٨ (عثماني)', label_en: '1299–1918 (Ottoman)' },
  { value: '1500-1800', label_ar: '١٥٠٠–١٨٠٠',          label_en: '1500–1800' },
  { value: '1800-1914', label_ar: '١٨٠٠–١٩١٤',          label_en: '1800–1914' },
  { value: '1914-1952', label_ar: '١٩١٤–١٩٥٢',          label_en: '1914–1952' },
  { value: '1952-2000', label_ar: '١٩٥٢–٢٠٠٠',          label_en: '1952–2000' },
  { value: '2001-2026', label_ar: '٢٠٠١–٢٠٢٦',          label_en: '2001–2026' },
];


function getCoinOfDay(coins: Coin[]): Coin {
  const today = new Date();
  const seed  = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return coins[seed % coins.length];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fuseSearch(coins: Coin[], query: string): Coin[] {
  if (!query.trim()) return coins;
  const q = query.toLowerCase();
  return coins.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.nar?.toLowerCase().includes(q) ||
    c.dyn?.toLowerCase().includes(q) ||
    c.km?.toLowerCase().includes(q) ||
    c.nref?.toLowerCase().includes(q) ||
    c.yce?.includes(q) ||
    c.yah?.includes(q) ||
    c.metal?.toLowerCase().includes(q) ||
    c.co?.toLowerCase().includes(q) ||
    c.co_ar?.includes(q)
  );
}

interface CataloguePageProps {
  locale: string;
  user?: { id: string; email: string } | null;
  authOpen?: boolean;
  dashOpen?: boolean;
  adminOpen?: boolean;
  setAuthOpen?: (v: boolean) => void;
  setDashOpen?: (v: boolean) => void;
  setAdminOpen?: (v: boolean) => void;
}

export default function CataloguePage({
  locale, user: userProp, authOpen: authOpenProp = false,
  dashOpen: dashOpenProp = false, adminOpen: adminOpenProp = false,
  setAuthOpen: setAuthOpenProp, setDashOpen: setDashOpenProp, setAdminOpen: setAdminOpenProp,
}: CataloguePageProps) {
  const t = useTranslations();
  const isAr = locale === 'ar';

  const [filters, setFilters] = useState<FilterState>({
    country: 'all', era: '', metal: '', type: '', query: '',
    yearFrom: 661, yearTo: 2026,
  });
  const [page, setPage] = useState(1);

  // ── Supabase data state ──────────────────────────────────
  const [coins,       setCoins]       = useState<Coin[]>([]);
  const [totalCount,  setTotalCount]  = useState(52808);
  const [loading,     setLoading]     = useState(false);
  const PER_PAGE_SUP = 60;
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [dynasty, setDynasty]         = useState('');
  const [dynastyMode,   setDynastyMode]   = useState<'national' | 'dynastic'>('national');
  const [dynasticGroup, setDynasticGroup] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  // ── Islamic detail filters (active when dynastyMode === 'dynastic') ──────
  const [filterMintAr,      setFilterMintAr]      = useState('');
  const [filterRulerAr,     setFilterRulerAr]     = useState('');
  const [filterHijriYear,   setFilterHijriYear]   = useState('');
  const [filterDenomination, setFilterDenomination] = useState('');

  // Distinct value lists for the three dropdown filters
  const [mintOptions,  setMintOptions]  = useState<string[]>([]);
  const [rulerOptions, setRulerOptions] = useState<string[]>([]);
  const [denomOptions, setDenomOptions] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);
  // filtersOpen panel reserved for future use
  const searchRef = useRef<HTMLInputElement>(null);
  const [showBackTop, setShowBackTop]   = useState(false);

  // Local collection (localStorage fallback when not logged in)
  const [collection, setCollection] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const saved = localStorage.getItem('ac_collection');
      return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [darkMode, setDarkMode]         = useState(false);
  const [adminOpenLocal, setAdminOpenLocal] = useState(false);
  const adminOpen    = adminOpenProp    || adminOpenLocal;
  const setAdminOpen = setAdminOpenProp ?? setAdminOpenLocal;
  // Auth state — use props from page.tsx if provided, else manage locally
  const [authOpenLocal, setAuthOpenLocal] = useState(false);
  const [dashOpenLocal, setDashOpenLocal] = useState(false);
  const [userLocal, setUserLocal]         = useState<{ id: string; email: string } | null>(null);

  const authOpen   = authOpenProp || authOpenLocal;
  const dashOpen   = dashOpenProp || dashOpenLocal;
  const user       = userProp !== undefined ? userProp : userLocal;
  const setAuthOpen = setAuthOpenProp ?? setAuthOpenLocal;
  const setDashOpen = setDashOpenProp ?? setDashOpenLocal;
  const { has: inCollection, toggle: toggleCollectionDB } = useCollection(user?.id ?? null);
  const { has: inWishlist,   toggle: toggleWishlistDB }   = useWishlist(user?.id ?? null);

  // Auth session listener (only when not controlled by parent)
  useEffect(() => {
    if (userProp !== undefined) return; // controlled by page.tsx
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserLocal({ id: session.user.id, email: session.user.email ?? '' });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserLocal(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load distinct values for Islamic detail filters when dynastic mode is active
  useEffect(() => {
    if (dynastyMode !== 'dynastic') return;
    getDistinctValues('mint_ar').then(setMintOptions).catch(() => {});
    getDistinctValues('ruler_ar').then(setRulerOptions).catch(() => {});
    getDistinctValues('denomination').then(setDenomOptions).catch(() => {});
  }, [dynastyMode]);

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // ── Supabase fetch — runs when any filter or page changes ────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Build CoinFilters from current state
    const apiFilters: CoinFilters = {};
    if (filters.country !== 'all') {
      // Map co (English name) back to cc
      const found = COUNTRIES.find(c => c.co === filters.country || c.co_ar === filters.country);
      if (found) apiFilters.cc = found.cc;
    }
    if (filters.metal)  apiFilters.metal = filters.metal;
    if (filters.type === 'Circulation')   apiFilters.type = 'Circulation';
    if (filters.type === 'Commemorative') apiFilters.type = 'Commemorative';
    if (filters.query)  apiFilters.query = filters.query;
    if (yearFrom) apiFilters.yceFrom = parseInt(yearFrom);
    if (yearTo)   apiFilters.yceTo   = parseInt(yearTo);
    if (filters.era) {
      const [a, b] = filters.era.split('-').map(Number);
      apiFilters.yceFrom = a;
      apiFilters.yceTo   = b;
    }
    // Dynasty filters — translate to dyn field values
    if (dynastyMode === 'dynastic' && dynasticGroup) {
      const group = DYNASTIC_GROUPS.find(g => g.key === dynasticGroup);
      if (group?.dynMatch?.[0]) apiFilters.dyn = group.dynMatch[0];
    }

    // Islamic detail filters (only active in dynastic mode)
    if (dynastyMode === 'dynastic') {
      if (filterMintAr)       apiFilters.mint_ar      = filterMintAr;
      if (filterRulerAr)      apiFilters.ruler_ar     = filterRulerAr;
      if (filterHijriYear)    apiFilters.yah          = filterHijriYear;
      if (filterDenomination) apiFilters.denomination = filterDenomination;
    }

    // Exclude Islamic coins from main Arab catalogue
    if (!apiFilters.cc) apiFilters.excludeCC = 'IS';

    getCoins(apiFilters, page, PER_PAGE_SUP).then(({ data, count }) => {
      if (!cancelled) {
        setCoins(data as unknown as Coin[]);
        setTotalCount(count);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [filters, page, dynasty, dynastyMode, dynasticGroup, yearFrom, yearTo, sortBy,
      filterMintAr, filterRulerAr, filterHijriYear, filterDenomination]);

  const handleToggleCollection = async (id: string) => {
    if (user) { await toggleCollectionDB(id); return; }
    setCollection(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      try { localStorage.setItem('ac_collection', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  const handleToggleWishlist = async (id: string) => {
    if (!user) { setAuthOpen(true); return; }
    await toggleWishlistDB(id);
  };

  // PDF export — builds a print-ready HTML page from filtered results
  const downloadPDF = () => {
    const isArLocal = locale === 'ar';
    const rows = coins.slice(0, 500).map(c => {
      const name  = isArLocal ? (c.nar || c.name) : c.name;
      const year  = c.yce ? c.yce + (isArLocal ? ' م' : ' CE') : '';
      const mint  = c.mint ? parseInt(c.mint).toLocaleString(isArLocal ? 'ar-EG' : 'en-US') : '—';
      const flag  = ({ EG:'🇪🇬',SA:'🇸🇦',AE:'🇦🇪',QA:'🇶🇦',IQ:'🇮🇶',JO:'🇯🇴',
                       LB:'🇱🇧',LY:'🇱🇾',MA:'🇲🇦',OM:'🇴🇲',PS:'🇵🇸',SD:'🇸🇩',
                       SY:'🇸🇾',DZ:'🇩🇿',TN:'🇹🇳',YE:'🇾🇪',KW:'🇰🇼',MR:'🇲🇷' } as Record<string,string>)[c.cc] ?? '';
      return `<tr>
        <td>${flag} ${isArLocal ? c.co_ar : c.co}</td>
        <td dir="rtl">${name}</td>
        <td>${c.dyn}</td>
        <td>${year}</td>
        <td>${c.metal}</td>
        <td>${mint}</td>
        <td>${c.km || '—'}</td>
      </tr>`;
    }).join('');

    const title   = isArLocal ? 'نتائج البحث — المقتني العربي' : 'Search Results — The Arab Collector';
    const headers = isArLocal
      ? ['الدولة','الاسم','الأسرة','السنة','المعدن','المضروب','KM#']
      : ['Country','Name','Dynasty','Year','Metal','Mintage','KM#'];
    const date = new Date().toLocaleDateString(isArLocal ? 'ar-EG' : 'en-AU');
    const total = totalCount;

    const html = `<!DOCTYPE html>
<html dir="${isArLocal ? 'rtl' : 'ltr'}" lang="${locale}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Amiri', serif; font-size: 11px; color: #1a0e05; background: #fff; padding: 24px; }
  h1 { font-size: 20px; color: #8B6D2E; margin-bottom: 4px; }
  .meta { font-size: 10px; color: #888; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a0e05; color: #F0E8D4; padding: 6px 8px; text-align: ${isArLocal ? 'right' : 'left'}; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e8dfc8; font-size: 11px; }
  tr:nth-child(even) { background: #faf6ee; }
  .footer { margin-top: 16px; font-size: 9px; color: #aaa; text-align: center; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">${date} · ${total} ${isArLocal ? 'عملة' : 'coins'}${total > 500 ? (isArLocal ? ' (أول 500 نتيجة)' : ' (first 500 results)') : ''}</div>
<table>
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">arabismatica.arabcollector.com · The Arab Collector © ${new Date().getFullYear()}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      };
    }
  };

  // Close autocomplete on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node))
        setShowAutocomplete(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    if (!filters.query || filters.query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      searchCoins(filters.query, 8).then(results => {
        setSuggestions(results.map(c => c.name).filter(Boolean));
      }).catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [filters.query]);

  const updateFilter = useCallback((key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  // Filtering is now done server-side via Supabase — no client-side memo needed

  // With Supabase: coins ARE already paged, count comes from server
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE_SUP));
  // When sorting by dynasty: re-order the current page client-side using DYNASTY_ORDER.
  // (Supabase doesn't support custom sort arrays; client sort across one page is sufficient.)
  const paged = sortBy === 'dynasty'
    ? [...coins].sort((a, b) => dynastyIndex(a.dyn ?? '') - dynastyIndex(b.dyn ?? ''))
    : coins;

  const hasActiveFilters = filters.country !== 'all' || filters.era || filters.metal || filters.type || filters.query || yearFrom !== '' || yearTo !== '' || sortBy !== 'default'
    || !!filterMintAr || !!filterRulerAr || !!filterHijriYear || !!filterDenomination;

  const clearFilters = () => {
    setFilters({ country: 'all', era: '', metal: '', type: '', query: '', yearFrom: 661, yearTo: 2026 });
    setDynasty(''); setDynastyMode('national'); setDynasticGroup('');
    setYearFrom(''); setYearTo(''); setSortBy('default');
    setFilterMintAr(''); setFilterRulerAr(''); setFilterHijriYear(''); setFilterDenomination('');
    setPage(1);
  };

  // Country counts — static from known totals (fast, no extra queries)
  const COUNTRY_TOTALS: Record<string, number> = {
    'Islamic':47303,'Egypt':1186,'Morocco':1120,'Tunisia':858,'Yemen':270,
    'Oman':255,'Sudan':228,'Libya':202,'Iraq':195,'Algeria':178,
    'Saudi Arabia':126,'UAE':163,'Jordan':130,'Lebanon':114,'Kuwait':98,
    'Palestine':14,'Mauritania':20,'Qatar':136,'Qatar & Dubai':5,'Comoros':34,
  };
  const countryCounts = COUNTRY_TOTALS;
  const filteredTotal = totalCount;

  return (
    <div className={darkMode ? 'dark' : ''} style={darkMode ? {filter:'invert(1) hue-rotate(180deg)'} : {}}>
      {/* ── HERO ── */}
      <HeroBanner locale={locale} totalCoins={totalCount} totalCountries={COUNTRIES.length} />

      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(155deg, #16100A 0%, #241605 55%, #301B06 100%)' }}>
        <div className="relative max-w-[1440px] mx-auto px-4 py-6 text-center">
          <motion.div
            className="flex flex-wrap justify-center gap-6 mb-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          </motion.div>

          {/* Search bar */}
          <motion.div
            className="max-w-2xl mx-auto relative"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center bg-parch-cream rounded-2xl border-2 border-gold-700/40 focus-within:border-gold-500 transition-colors shadow-2xl overflow-hidden">
              <span className="shrink-0 mx-4 text-gold-500/60 text-base">🔍</span>
              <input
                ref={searchRef}
                type="text"
                dir={isAr ? 'rtl' : 'ltr'}
                placeholder={t('search.placeholder')}
                value={filters.query}
                onChange={e => { updateFilter('query', e.target.value); setShowAutocomplete(true); }}
                onFocus={() => setShowAutocomplete(true)}
                className="flex-1 py-3.5 text-[14px] bg-transparent text-ink placeholder:text-ink/30 outline-none font-cairo"
                autoComplete="off"
              />
              {filters.query && (
                <button onClick={() => updateFilter('query', '')} className="mx-2 text-ink/30 hover:text-ink/60">
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => { /* open identify modal */ }}
                className="flex items-center gap-1.5 mx-3 px-3 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink text-[12px] font-semibold transition-colors shrink-0"
                title={t('search.identify')}>
                <Camera size={14} />
                <span className="hidden sm:block">{isAr ? 'تحديد' : 'Identify'}</span>
              </button>
            </div>
          {/* Autocomplete dropdown */}
          {showAutocomplete && suggestions.length > 0 && (
            <div
              ref={autocompleteRef}
              className="max-w-2xl mx-auto mt-1 bg-parch-cream rounded-xl border border-gold-700/30 shadow-2xl overflow-hidden z-50 relative"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    updateFilter('query', s);
                    setShowAutocomplete(false);
                    searchRef.current?.blur();
                  }}
                  className="w-full text-right px-4 py-2.5 text-[13px] text-ink/80 hover:bg-gold-500/10 border-b border-gold-700/10 last:border-0 transition-colors font-cairo flex items-center gap-2"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <span className="text-gold-500/50 text-[10px]">🔍</span>
                  {s}
                </button>
              ))}
            </div>
          )}
          </motion.div>
        </div>

        {/* Decorative bottom line */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #8B6D2E, transparent)' }} />
      </section>

      {/* COIN OF THE DAY */}
      {(() => {
        const cotd = coins.length > 0 ? getCoinOfDay(coins) : null;
        if (!cotd) return null;
        return (
          <div className="bg-gradient-to-r from-ink via-[#1e1206] to-ink border-b border-gold-700/30">
            <div className="max-w-[1440px] mx-auto px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 shrink-0">
                  <CalendarDays size={14} className="text-gold-500" />
                  <span className="text-[10px] text-gold-500/70 uppercase tracking-widest font-medium">
                    {isAr ? 'عملة اليوم' : 'Coin of the Day'}
                  </span>
                </div>
                {cotd.o && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cotd.o} alt="" className="w-8 h-8 rounded-full object-cover border border-gold-700/40" />
                )}
                <Link href={`/${locale}/catalogue/${cotd.id}`} onClick={(e) => { e.preventDefault(); setSelectedCoin(cotd); }} className="font-amiri text-gold-300 hover:text-gold-100 text-[14px] transition-colors">
                  {isAr ? (cotd.nar || cotd.name) : cotd.name}
                </Link>
                <span className="text-[11px] text-gold-600/50 hidden sm:block">
                  {cotd.yce ? cotd.yce + ' م' : ''} · {isAr ? cotd.co_ar : cotd.co}
                </span>
                <Link href={`/${locale}/catalogue/${cotd.id}`} onClick={(e) => { e.preventDefault(); setSelectedCoin(cotd); }} className="mr-auto text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 rounded-full px-3 py-1 transition-colors shrink-0">
                  {isAr ? 'عرض التفاصيل ←' : 'View details →'}
                </Link>
              </div>
            </div>
          </div>
        );
      })()}



      {/* ── CONTROLS BAR ── */}
      <div className="bg-parch sticky top-[103px] z-30 border-b border-gold-700/15 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
          {/* Country filter */}
          <select
            value={filters.country}
            onChange={e => { updateFilter('country', e.target.value); setPage(1); }}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer font-medium"
          >
            <option value="all">🌍 {isAr ? 'كل الدول' : 'All Countries'} ({filteredTotal.toLocaleString()})</option>
            {COUNTRIES.map(({ cc, co, co_ar }) => {
              const count = countryCounts[co] || 0;
              if (!count) return null;
              return (
                <option key={cc} value={co}>
                  {COUNTRY_FLAGS[cc]} {isAr ? co_ar : co} ({count})
                </option>
              );
            })}
          </select>

          {/* National era — compact dropdown */}
          <select
            value={dynastyMode === 'national' ? dynasty : ''}
            onChange={e => { setDynastyMode('national'); setDynasticGroup(''); setDynasty(e.target.value); setPage(1); }}
            className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer
              ${dynastyMode === 'national' && dynasty ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
          >
            <option value="">{isAr ? '🗺️ الحقبة الوطنية' : '🗺️ National Era'}</option>
            {DYNASTY_PILLS.map(pill => (
              <option key={pill.key} value={pill.key}>
                {pill.icon} {isAr ? pill.label_ar : pill.label_en}
              </option>
            ))}
          </select>

          {/* Historical dynasty — compact dropdown */}
          <select
            value={dynastyMode === 'dynastic' ? dynasticGroup : ''}
            onChange={e => { setDynastyMode('dynastic'); setDynasty(''); setDynasticGroup(e.target.value); setPage(1); }}
            className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer
              ${dynastyMode === 'dynastic' && dynasticGroup ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
          >
            <option value="">{isAr ? '☪️ الأسرة التاريخية' : '☪️ Dynasty'}</option>
            {[...DYNASTIC_GROUPS]
              .sort((a, b) => {
                // Sort by position of dynMatch[0] in DYNASTY_ORDER; ungrouped entries go last
                const ai = dynastyIndex(a.dynMatch?.[0] ?? '');
                const bi = dynastyIndex(b.dynMatch?.[0] ?? '');
                return ai - bi;
              })
              .map(group => (
                <option key={group.key} value={group.key}>
                  {group.icon} {isAr ? group.label_ar : group.label_en}
                </option>
              ))}
          </select>

          {/* ── Islamic detail filters — visible only in dynastic mode ── */}
          {dynastyMode === 'dynastic' && (
            <>
              {/* Denomination */}
              <select
                value={filterDenomination}
                onChange={e => { setFilterDenomination(e.target.value); setPage(1); }}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer
                  ${filterDenomination ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
              >
                <option value="">{isAr ? '⚖️ الفئة' : '⚖️ Denomination'}</option>
                {denomOptions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Mint */}
              <select
                value={filterMintAr}
                onChange={e => { setFilterMintAr(e.target.value); setPage(1); }}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer
                  ${filterMintAr ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
              >
                <option value="">{isAr ? '🏛️ دار الضرب' : '🏛️ Mint'}</option>
                {mintOptions.map(m => (
                  <option key={m} value={m} dir="rtl">{m}</option>
                ))}
              </select>

              {/* Ruler */}
              <select
                value={filterRulerAr}
                onChange={e => { setFilterRulerAr(e.target.value); setPage(1); }}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer
                  ${filterRulerAr ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
              >
                <option value="">{isAr ? '👑 الحاكم' : '👑 Ruler'}</option>
                {rulerOptions.map(r => (
                  <option key={r} value={r} dir="rtl">{r}</option>
                ))}
              </select>

              {/* Hijri year — text input, partial match */}
              <input
                type="text"
                dir="rtl"
                placeholder={isAr ? 'سنة هجرية' : 'Hijri year'}
                value={filterHijriYear}
                onChange={e => { setFilterHijriYear(e.target.value); setPage(1); }}
                className={`w-[90px] text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none focus:border-gold-500 font-cairo
                  ${filterHijriYear ? 'border-gold-500' : 'border-gold-700/30'}`}
              />
            </>
          )}

          {/* Era */}
          <select
            value={filters.era}
            onChange={e => updateFilter('era', e.target.value)}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
            <option value="">{t('filters.allEras')}</option>
            {ERA_OPTIONS.map(e => (
              <option key={e.value} value={e.value}>{isAr ? e.label_ar : e.label_en}</option>
            ))}
          </select>

          {/* Metal */}
          <select
            value={filters.metal}
            onChange={e => updateFilter('metal', e.target.value)}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
            <option value="">{t('filters.allMetals')}</option>
            {METAL_OPTIONS.map(m => (
              <option key={m} value={m}>{isAr ? t(`metals.${m}`) : m}</option>
            ))}
          </select>

          {/* Type pills */}
          {(['Circulation', 'Commemorative', 'has-mint'] as const).map(tp => (
            <button
              key={tp}
              onClick={() => updateFilter('type', filters.type === tp ? '' : tp)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors
                ${filters.type === tp ? 'bg-gold-500 border-gold-500 text-ink font-semibold' : 'border-gold-700/25 text-ink/50 hover:border-gold-500/50 hover:text-ink/70'}`}>
              {tp === 'Circulation' ? t('filters.circulation')
               : tp === 'Commemorative' ? t('filters.commemorative')
               : '📊 ' + t('filters.withMintage')}
            </button>
          ))}

          {/* Year range */}
          <div className="flex items-center gap-1">
            <input type="number" placeholder={isAr ? 'من' : 'From'} value={yearFrom}
              onChange={e => { setYearFrom(e.target.value); setPage(1); }}
              className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500"
              min="661" max="2026" />
            <span className="text-ink/30 text-[11px]">—</span>
            <input type="number" placeholder={isAr ? 'إلى' : 'To'} value={yearTo}
              onChange={e => { setYearTo(e.target.value); setPage(1); }}
              className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500"
              min="661" max="2026" />
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
            <option value="default">{isAr ? 'ترتيب افتراضي' : 'Default'}</option>
            <option value="oldest">{isAr ? 'الأقدم أولاً' : 'Oldest first'}</option>
            <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest first'}</option>
            <option value="rarest">{isAr ? 'الأندر أولاً' : 'Rarest first'}</option>
            <option value="common">{isAr ? 'الأكثر شيوعاً' : 'Most common'}</option>
            <option value="az">{isAr ? 'أبجدي' : 'A to Z'}</option>
            <option value="dynasty">{isAr ? 'حسب الأسرة (تاريخي)' : 'By dynasty (historical)'}</option>
          </select>
          {/* Results count + PDF download */}
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-[11px] text-ink/40">
              {totalCount.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {t('search.results')}
            </span>
            {totalCount > 0 && (
              <button
                onClick={downloadPDF}
                title={isAr ? 'تنزيل النتائج كـ PDF' : 'Download results as PDF'}
                className="flex items-center gap-1 text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 hover:border-gold-500/60 rounded-full px-2.5 py-1 transition-colors"
              >
                <FileDown size={11} />
                <span className="hidden sm:block">{isAr ? 'تنزيل PDF' : 'PDF'}</span>
              </button>
            )}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="text-[11px] text-gold-600 hover:text-gold-500 flex items-center gap-1 border border-gold-700/30 rounded-full px-2.5 py-1 transition-colors">
              <X size={11} /> {isAr ? 'مسح' : 'Clear'}
            </button>
          )}

          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode(d => !d)}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-gold-700/30 text-gold-600 hover:text-gold-400 transition-colors"
            title={darkMode ? (isAr ? 'الوضع الفاتح' : 'Light mode') : (isAr ? 'الوضع الداكن' : 'Dark mode')}>
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          {/* Admin panel button */}
          <button onClick={async () => {
            // Sign out of collector session to avoid Supabase session conflict with admin
            if (user) {
              await supabase.auth.signOut();
              setUserLocal(null);
            }
            setAdminOpen(true);
          }}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-gold-700/30 text-gold-600 hover:text-gold-400 transition-colors"
            title={isAr ? 'لوحة الإدارة' : 'Admin Panel'}>
            <span className="text-[11px]">⚙</span>
          </button>
          {/* View toggle */}
          <div className="flex items-center border border-gold-700/25 rounded-lg overflow-hidden">
            <button onClick={() => setView('grid')}
              className={`px-2.5 py-1.5 text-[13px] transition-colors ${view === 'grid' ? 'bg-gold-500 text-ink' : 'text-ink/40 hover:text-ink/70'}`}>
              <Grid3X3 size={13} />
            </button>
            <button onClick={() => setView('list')}
              className={`px-2.5 py-1.5 text-[13px] transition-colors ${view === 'list' ? 'bg-gold-500 text-ink' : 'text-ink/40 hover:text-ink/70'}`}>
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gold-600">
              <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px] font-amiri">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</span>
            </div>
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-parch-dark flex items-center justify-center mx-auto mb-4 text-2xl">🔍</div>
            <h3 className="font-amiri text-xl text-ink/60 mb-2">{t('search.noResults')}</h3>
            <p className="text-[13px] text-ink/40">{t('search.noResultsHint')}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filters.country}-${filters.era}-${filters.metal}-${filters.type}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={
                view === 'grid'
                  ? 'grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                  : 'flex flex-col gap-2'
              }>
              {paged.map((coin, i) => (
                <motion.div
                  key={coin.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.012, 0.3), duration: 0.2 }}>
                  <CoinCard
                    coin={coin}
                    locale={locale}
                    view={view}
                    onClick={() => setSelectedCoin(coin)}
                    inCollection={user ? inCollection(coin.id) : collection.has(coin.id)}
                    inWishlist={user ? inWishlist(coin.id) : false}
                    onToggleCollection={(e) => { e.stopPropagation(); handleToggleCollection(coin.id); }}
                    onToggleWishlist={(e) => { e.stopPropagation(); handleToggleWishlist(coin.id); }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[12px] text-ink/60 hover:border-gold-500 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              {isAr ? '‹ السابق' : '‹ Prev'}
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors min-w-[36px]
                    ${p === page ? 'bg-gold-500 text-ink font-semibold border border-gold-500' : 'border border-gold-700/25 text-ink/50 hover:border-gold-500/50'}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[12px] text-ink/60 hover:border-gold-500 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              {isAr ? 'التالي ›' : 'Next ›'}
            </button>
            <span className="text-[11px] text-ink/30 mx-1">
              {isAr ? `${page} / ${totalPages}` : `${page} / ${totalPages}`}
            </span>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-ink border-t border-gold-700/40 py-6 text-center">
        <div className="font-amiri text-gold-300 text-base mb-1">المقتني العربي · The Arab Collector</div>
        <p className="text-gold-600/60 text-[11px] mb-2">{t('footer.tagline')}</p>
        <p className="text-[11px] text-gold-700/50">
          {t('footer.source')} ·{' '}
          <a href="https://arabcollector.com" target="_blank" rel="noopener" className="hover:text-gold-500 transition-colors">
            arabcollector.com
          </a>
        </p>
      </footer>

      {/* Coin detail modal */}
      <AnimatePresence>
        {selectedCoin && (
          <CoinModal coin={selectedCoin} locale={locale} onClose={() => setSelectedCoin(null)} />
        )}
      </AnimatePresence>

      {authOpen && (
        <AuthModal locale={locale} onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />
      )}
      {dashOpen && user && (
        <Dashboard locale={locale} userId={user.id} userEmail={user.email}
          onClose={() => setDashOpen(false)}
          onSignOut={async () => { await supabase.auth.signOut(); setDashOpen(false); }} />
      )}
      {adminOpen && (
        <AdminPanel
          onClose={async () => {
            // Sign out admin session on close so it doesn't bleed into collector session
            await supabase.auth.signOut();
            setAdminOpen(false);
          }}
          locale={locale}
          onCoinAdded={() => {}}
        />
      )}

      {/* ── BACK TO TOP ── */}
      <AnimatePresence>
        {showBackTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full bg-gold-600 hover:bg-gold-500 text-ink shadow-lg flex items-center justify-center transition-colors"
            title={locale === 'ar' ? 'العودة للأعلى' : 'Back to top'}
            aria-label="Back to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
