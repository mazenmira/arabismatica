export const CATALOGUES = [
  {
    id: 'arab',
    slug: 'catalogue',
    title: { ar: 'العملات العربية الحديثة', en: 'Modern Arab Coins' },
    subtitle: { ar: '5,505 عملة · 20 دولة · 1500–2026م',
                en: '5,505 coins · 20 countries · 1500–2026 CE' },
    description: {
      ar: 'كتالوج شامل للعملات العربية الحديثة من 20 دولة عربية يمتد من العهد العثماني حتى اليوم',
      en: 'Comprehensive catalogue of modern Arab coins from 20 countries spanning the Ottoman era to present day'
    },
    coinCount: 5505,
    ccFilter: { exclude: ['IS'] },
    navPath: '/',
    status: 'active',
    seoKeywords: {
      en: ['Arab coins', 'Arabic coins', 'Arab numismatics', 'Egyptian coins', 'Saudi coins', 'Islamic coins catalogue'],
      ar: ['عملات عربية', 'نقود عربية', 'كتالوج عملات', 'عملات مصرية', 'عملات سعودية']
    }
  },
  {
    id: 'islamic',
    slug: 'islamic',
    title: { ar: 'العملات الإسلامية', en: 'Islamic Coins' },
    subtitle: { ar: '47,303 عملة · 18 سلالة · 41–922هـ',
                en: '47,303 coins · 18 dynasties · 41–922 AH' },
    description: {
      ar: 'أكبر قاعدة بيانات للعملات الإسلامية على الإنترنت تشمل الأمويين والعباسيين والفاطميين والمماليك',
      en: 'The largest online Islamic coin database covering Umayyad, Abbasid, Fatimid, Ayyubid and Mamluk dynasties'
    },
    coinCount: 47303,
    ccFilter: { include: ['IS'] },
    navPath: '/islamic',
    status: 'active',
    seoKeywords: {
      en: ['Islamic coins', 'Umayyad coins', 'Abbasid coins', 'Fatimid coins', 'Mamluk coins', 'Islamic numismatics', 'Arabic coins history'],
      ar: ['عملات إسلامية', 'دراهم أموية', 'دنانير عباسية', 'عملات فاطمية', 'عملات مملوكية', 'نمسماتيا إسلامية']
    }
  },
  {
    id: 'sasanian',
    slug: 'sasanian',
    title: { ar: 'العملات الساسانية', en: 'Sasanian Coins', de: 'Sassanidische Münzen' },
    subtitle: {
      ar: '7,995 عملة · 224–651م · فارس والعراق',
      en: '7,995 coins · 224–651 CE · Persia & Iraq',
      de: '7.995 Münzen · 224–651 n.Chr. · Persien & Irak',
    },
    description: {
      ar: 'العملات الساسانية — إمبراطورية فارس العظيمة التي حكمت من 224 إلى 651م وخلّفت إرثاً نمسماتياً استثنائياً',
      en: 'Sasanian coins — the Persian dynasty that ruled 224–651 CE, leaving an exceptional numismatic legacy across Persia and Iraq',
      de: 'Sassanidische Münzen — die persische Dynastie, die 224–651 n.Chr. regierte und ein außergewöhnliches numismatisches Erbe hinterließ',
    },
    coinCount: 7995,
    ccFilter: { include: ['SS'] },
    navPath: '/sasanian',
    status: 'active',
    seoKeywords: {
      en: ['Sasanian coins', 'Persian coins', 'Sassanid coins', 'ancient Persian numismatics', 'Sasanian Empire coins', 'pre-Islamic coins'],
      ar: ['عملات ساسانية', 'عملات فارسية', 'نمسماتيا ساسانية', 'عملات فارس القديمة', 'الإمبراطورية الساسانية'],
    },
  },
  {
    id: 'roman',
    slug: 'roman',
    title: { ar: 'العملات الرومانية', en: 'Roman-Era Coins' },
    status: 'coming_soon',
  },
  {
    id: 'ptolemaic',
    slug: 'ptolemaic',
    title: { ar: 'العملات البطلمية', en: 'Ptolemaic Coins' },
    status: 'coming_soon',
  },
] as const;
