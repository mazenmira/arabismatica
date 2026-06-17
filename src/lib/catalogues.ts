export type CatalogueStatus = 'active' | 'coming_soon';
export type CatalogueGroup = 'arab_world' | 'ancient' | 'indian_islamic';

export const CATALOGUE_GROUPS: Record<CatalogueGroup, {
  labelAr: string; labelEn: string; labelDe: string;
  descAr:  string; descEn:  string; descDe:  string;
}> = {
  arab_world: {
    labelAr: 'العالم العربي',
    labelEn: 'Arab World',
    labelDe: 'Arabische Welt',
    descAr:  'عملات العالم العربي من العصر الحديث والتاريخ الإسلامي',
    descEn:  'Coins of the Arab world spanning the modern era and Islamic history',
    descDe:  'Münzen der arabischen Welt aus der Neuzeit und islamischen Geschichte',
  },
  ancient: {
    labelAr: 'الشرق الأوسط القديم',
    labelEn: 'Ancient Middle East',
    labelDe: 'Alter Naher Osten',
    descAr:  'عملات الحضارات القديمة في منطقة الشرق الأوسط وشمال أفريقيا',
    descEn:  'Coins of ancient civilisations across the Middle East and North Africa',
    descDe:  'Münzen antiker Zivilisationen im Nahen Osten und Nordafrika',
  },
  indian_islamic: {
    labelAr: 'الإسلام الهندي',
    labelEn: 'Islamic India',
    labelDe: 'Islamisches Indien',
    descAr:  'عملات الممالك والسلطنات الإسلامية في شبه القارة الهندية',
    descEn:  'Coins of the Islamic kingdoms and sultanates of the Indian subcontinent',
    descDe:  'Münzen der islamischen Königreiche und Sultanate des indischen Subkontinents',
  },
};

export const CATALOGUES = [
  {
    id: 'arab',
    slug: 'catalogue',
    group: 'arab_world' as CatalogueGroup,
    title: { ar: 'العملات العربية الحديثة', en: 'Modern Arab Coins', de: 'Moderne arabische Münzen' },
    subtitle: {
      ar: '5,505 عملة · 20 دولة · 1500–2026م',
      en: '5,505 coins · 20 countries · 1500–2026 CE',
      de: '5.505 Münzen · 20 Länder · 1500–2026 n. Chr.',
    },
    description: {
      ar: 'كتالوج شامل للعملات العربية الحديثة من 20 دولة عربية يمتد من العهد العثماني حتى اليوم',
      en: 'Comprehensive catalogue of modern Arab coins from 20 countries spanning the Ottoman era to present day',
      de: 'Umfassender Katalog moderner arabischer Münzen aus 20 Ländern vom Osmanischen Reich bis heute',
    },
    coinCount: 5505,
    ccFilter: { exclude: ['IS'] },
    navPath: '/',
    status: 'active' as CatalogueStatus,
    seoKeywords: {
      en: ['Arab coins', 'Arabic coins', 'Arab numismatics', 'Egyptian coins', 'Saudi coins'],
      ar: ['عملات عربية', 'نقود عربية', 'كتالوج عملات', 'عملات مصرية', 'عملات سعودية'],
    },
  },
  {
    id: 'islamic',
    slug: 'islamic',
    group: 'arab_world' as CatalogueGroup,
    title: { ar: 'العملات الإسلامية', en: 'Islamic Coins', de: 'Islamische Münzen' },
    subtitle: {
      ar: '47,303 عملة · 18 سلالة · 41–922هـ',
      en: '47,303 coins · 18 dynasties · 41–922 AH',
      de: '47.303 Münzen · 18 Dynastien · 41–922 AH',
    },
    description: {
      ar: 'أكبر قاعدة بيانات للعملات الإسلامية على الإنترنت تشمل الأمويين والعباسيين والفاطميين والمماليك',
      en: 'The largest online Islamic coin database covering Umayyad, Abbasid, Fatimid, Ayyubid and Mamluk dynasties',
      de: 'Die größte Online-Datenbank islamischer Münzen: Umayyaden, Abbasiden, Fatimiden, Ayyubiden und Mamluken',
    },
    coinCount: 47303,
    ccFilter: { include: ['IS'] },
    navPath: '/islamic',
    status: 'active' as CatalogueStatus,
    seoKeywords: {
      en: ['Islamic coins', 'Umayyad coins', 'Abbasid coins', 'Fatimid coins', 'Mamluk coins'],
      ar: ['عملات إسلامية', 'دراهم أموية', 'دنانير عباسية', 'عملات فاطمية', 'عملات مملوكية'],
    },
  },
  {
    id: 'sasanian',
    slug: 'sasanian',
    group: 'ancient' as CatalogueGroup,
    title: { ar: 'العملات الساسانية', en: 'Sasanian Coins', de: 'Sassanidische Münzen' },
    subtitle: {
      ar: '7,995 عملة · 224–651م · فارس والعراق',
      en: '7,995 coins · 224–651 CE · Persia & Iraq',
      de: '7.995 Münzen · 224–651 n.Chr. · Persien & Irak',
    },
    description: {
      ar: 'العملات الساسانية — إمبراطورية فارس العظيمة التي حكمت من 224 إلى 651م وخلّفت إرثاً نمسماتياً استثنائياً',
      en: 'Sasanian coins — the Persian dynasty that ruled 224–651 CE, leaving an exceptional numismatic legacy across Persia and Iraq',
      de: 'Sassanidische Münzen — die persische Dynastie, die 224–651 n.Chr. regierte',
    },
    coinCount: 7995,
    ccFilter: { include: ['SS'] },
    navPath: '/sasanian',
    status: 'active' as CatalogueStatus,
    seoKeywords: {
      en: ['Sasanian coins', 'Persian coins', 'Sassanid coins', 'ancient Persian numismatics'],
      ar: ['عملات ساسانية', 'عملات فارسية', 'نمسماتيا ساسانية'],
    },
  },
  {
    id: 'nabataean',
    slug: 'nabataean',
    group: 'ancient' as CatalogueGroup,
    title: { ar: 'العملات النبطية', en: 'Nabataean Coins', de: 'Nabatäische Münzen' },
    subtitle: { ar: 'قريباً', en: 'Coming soon', de: 'Demnächst' },
    description: {
      ar: 'عملات مملكة الأنباط — الحضارة العربية القديمة في البتراء والجزيرة العربية',
      en: 'Coins of the Nabataean Kingdom — the ancient Arab civilisation centred at Petra',
      de: 'Münzen des Nabatäerreichs — die antike arabische Zivilisation mit Zentrum in Petra',
    },
    status: 'coming_soon' as CatalogueStatus,
  },
  {
    id: 'byzantine',
    slug: 'byzantine',
    group: 'ancient' as CatalogueGroup,
    title: { ar: 'العملات البيزنطية العربية', en: 'Byzantine Arab Coins', de: 'Byzantinisch-arabische Münzen' },
    subtitle: { ar: 'قريباً', en: 'Coming soon', de: 'Demnächst' },
    description: {
      ar: 'العملات البيزنطية المضروبة في الأراضي العربية قبيل الفتح الإسلامي',
      en: 'Byzantine coins struck in Arab lands before the Islamic conquest',
      de: 'Byzantinische Münzen, die in arabischen Gebieten vor der islamischen Eroberung geprägt wurden',
    },
    status: 'coming_soon' as CatalogueStatus,
  },
  {
    id: 'ptolemaic',
    slug: 'ptolemaic',
    group: 'ancient' as CatalogueGroup,
    title: { ar: 'العملات البطلمية', en: 'Ptolemaic Coins', de: 'Ptolemäische Münzen' },
    subtitle: { ar: 'قريباً', en: 'Coming soon', de: 'Demnächst' },
    description: {
      ar: 'عملات المملكة البطلمية في مصر — من الإسكندر الأكبر حتى كليوباترا السابعة',
      en: 'Coins of the Ptolemaic Kingdom of Egypt — from Alexander the Great to Cleopatra VII',
      de: 'Münzen des ptolemäischen Königreichs Ägypten — von Alexander dem Großen bis Kleopatra VII',
    },
    status: 'coming_soon' as CatalogueStatus,
  },
  {
    id: 'crusader',
    slug: 'crusader',
    group: 'ancient' as CatalogueGroup,
    title: { ar: 'عملات الحروب الصليبية', en: 'Crusader Coins', de: 'Kreuzfahrermünzen' },
    subtitle: { ar: 'قريباً', en: 'Coming soon', de: 'Demnächst' },
    description: {
      ar: 'عملات الممالك الصليبية في بلاد الشام وفلسطين والأراضي المقدسة',
      en: 'Coins of the Crusader states in the Levant, Palestine and the Holy Land',
      de: 'Münzen der Kreuzfahrerstaaten in der Levante, Palästina und dem Heiligen Land',
    },
    status: 'coming_soon' as CatalogueStatus,
  },
  {
    id: 'achaemenid',
    slug: 'achaemenid',
    group: 'ancient' as CatalogueGroup,
    title: { ar: 'العملات الأخمينية', en: 'Achaemenid Coins', de: 'Achämenidische Münzen' },
    subtitle: { ar: 'قريباً', en: 'Coming soon', de: 'Demnächst' },
    description: {
      ar: 'عملات الإمبراطورية الأخمينية الفارسية — من قورش الكبير حتى دارا الثالث',
      en: 'Coins of the Achaemenid Persian Empire — from Cyrus the Great to Darius III',
      de: 'Münzen des achämenidischen Perserreichs — von Kyros dem Großen bis Dareios III',
    },
    status: 'coming_soon' as CatalogueStatus,
  },
  {
    id: 'mughal',
    slug: 'mughal',
    group: 'indian_islamic' as CatalogueGroup,
    title: { ar: 'العملات المغولية', en: 'Mughal Coins', de: 'Mogulmünzen' },
    subtitle: { ar: 'قريباً', en: 'Coming soon', de: 'Demnächst' },
    description: {
      ar: 'عملات الإمبراطورية المغولية في الهند — من بابر إلى أورنكزيب',
      en: 'Coins of the Mughal Empire in India — from Babur to Aurangzeb',
      de: 'Münzen des Mogulreichs in Indien — von Babur bis Aurangzeb',
    },
    status: 'coming_soon' as CatalogueStatus,
  },
  {
    id: 'delhi',
    slug: 'delhi',
    group: 'indian_islamic' as CatalogueGroup,
    title: { ar: 'سلطنة دلهي', en: 'Delhi Sultanate', de: 'Delhi-Sultanat' },
    subtitle: { ar: 'قريباً', en: 'Coming soon', de: 'Demnächst' },
    description: {
      ar: 'عملات سلطنة دلهي — الدول الإسلامية الأولى في شبه القارة الهندية 1206–1526م',
      en: 'Coins of the Delhi Sultanate — the early Islamic states of the Indian subcontinent 1206–1526 CE',
      de: 'Münzen des Delhi-Sultanats — die frühen islamischen Staaten des indischen Subkontinents 1206–1526 n.Chr.',
    },
    status: 'coming_soon' as CatalogueStatus,
  },
] as const;
