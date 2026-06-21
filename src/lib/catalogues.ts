export type ChipStatus = 'active' | 'coming_soon';

export interface CatalogueChip {
  id: string;
  title_en: string;
  title_ar: string;
  status: ChipStatus;
  href?: string;      // route suffix, e.g. '/catalogue' — joined with locale prefix
  countKey?: string;  // key into live count map: 'arab' | 'IS' | 'MG' | 'DS' | 'SS'
  special?: 'islamic_dynasties';
}

export interface AcademicGroup {
  id: string;
  num: number;
  title_en: string;
  title_ar: string;
  period?: string;
  desc_en: string;
  desc_ar: string;
  ottoman?: boolean;    // special blue-border styling
  catalogues: CatalogueChip[];
}

export const ACADEMIC_GROUPS: AcademicGroup[] = [
  {
    id: 'modern_arab_states',
    num: 1,
    title_en: 'Modern Arab States',
    title_ar: 'الدول العربية الحديثة',
    period: '1916–present',
    desc_en: 'Post-Ottoman state coinage · 20 Arab nations including Palestine · modern mints',
    desc_ar: 'عملات الدول العربية بعد العهد العثماني · 20 دولة عربية شاملة فلسطين · دور الضرب الحديثة',
    catalogues: [
      { id: 'arab', title_en: 'Modern Arab Coins',    title_ar: 'العملات العربية الحديثة', status: 'active',     href: '/catalogue', countKey: 'arab' },
      { id: 'medals', title_en: 'Arab Medals & Orders', title_ar: 'الأوسمة والنياشين العربية', status: 'coming_soon' },
    ],
  },
  {
    id: 'ottoman_empire',
    num: 2,
    title_en: 'Ottoman Empire',
    title_ar: 'الإمبراطورية العثمانية',
    period: '1299–1922 CE',
    desc_en: 'Bridges Islamic dynasties and modern Arab states · entire Arab world simultaneously · next major catalogue · 50,000+ coins in preparation',
    desc_ar: 'تجسر بين الأسرات الإسلامية والدول العربية الحديثة · العالم العربي بأكمله في آنٍ واحد · الكتالوج الكبير القادم · 50,000+ عملة في الإعداد',
    ottoman: true,
    catalogues: [
      { id: 'ottoman', title_en: 'Ottoman Empire', title_ar: 'الدولة العثمانية', status: 'coming_soon' },
    ],
  },
  {
    id: 'islamic_dynasties',
    num: 3,
    title_en: 'Islamic Dynasties',
    title_ar: 'الأسرات الإسلامية',
    period: '622–1299 CE',
    desc_en: 'United by Arabic Quranic inscriptions · from Spain to Central Asia',
    desc_ar: 'متحدة بالنقوش القرآنية العربية · من الأندلس إلى آسيا الوسطى',
    catalogues: [
      { id: 'islamic',        title_en: 'Islamic Dynastic Coins', title_ar: 'العملات الإسلامية',      status: 'active',     href: '/islamic',  countKey: 'IS', special: 'islamic_dynasties' },
      { id: 'mughal',         title_en: 'Mughal Empire',          title_ar: 'الإمبراطورية المغولية', status: 'active',     href: '/mughal',   countKey: 'MG' },
      { id: 'delhi',          title_en: 'Delhi Sultanate',        title_ar: 'سلطنة دلهي',            status: 'active',     href: '/delhi',    countKey: 'DS' },
      { id: 'mamluk',         title_en: 'Mamluk Sultanate',       title_ar: 'سلطنة المماليك',         status: 'coming_soon' },
      { id: 'timurid',        title_en: 'Timurid Empire',         title_ar: 'الإمبراطورية التيمورية', status: 'coming_soon' },
      { id: 'ghaznavid',      title_en: 'Ghaznavid Empire',       title_ar: 'الإمبراطورية الغزنوية', status: 'coming_soon' },
      { id: 'safavid',        title_en: 'Safavid Persia',         title_ar: 'فارس الصفوية',          status: 'coming_soon' },
      { id: 'seljuk',         title_en: 'Seljuk Empire',          title_ar: 'الإمبراطورية السلجوقية', status: 'coming_soon' },
      { id: 'norman_sicily',  title_en: 'Norman Sicily',          title_ar: 'صقلية النورمانية',      status: 'coming_soon' },
    ],
  },
  {
    id: 'pre_islamic_persia',
    num: 4,
    title_en: 'Pre-Islamic Persia',
    title_ar: 'فارس ما قبل الإسلام',
    period: '550 BCE–651 CE',
    desc_en: 'Persian imperial dynasties · direct predecessors to Islamic coinage',
    desc_ar: 'السلالات الإمبراطورية الفارسية · الأسلاف المباشرون لعملة الإسلام',
    catalogues: [
      { id: 'sasanian',   title_en: 'Sasanian Empire',    title_ar: 'الإمبراطورية الساسانية', status: 'active',     href: '/sasanian', countKey: 'SS' },
      { id: 'parthian',   title_en: 'Parthian Empire',    title_ar: 'الإمبراطورية الفرثية',   status: 'coming_soon' },
      { id: 'achaemenid', title_en: 'Achaemenid Persia',  title_ar: 'الإمبراطورية الأخمينية', status: 'coming_soon' },
    ],
  },
  {
    id: 'hellenistic_ancient',
    num: 5,
    title_en: 'Hellenistic & Ancient Near East',
    title_ar: 'العصر الهلنستي والشرق الأدنى القديم',
    period: '336–31 BCE',
    desc_en: 'Greek successor kingdoms ruling Arab and Persian lands',
    desc_ar: 'الممالك اليونانية الخلف التي حكمت الأراضي العربية والفارسية',
    catalogues: [
      { id: 'seleucid',  title_en: 'Seleucid Empire',    title_ar: 'الإمبراطورية السلوقية', status: 'coming_soon' },
      { id: 'ptolemaic', title_en: 'Ptolemaic Kingdom',  title_ar: 'المملكة البطلمية',      status: 'coming_soon' },
      { id: 'nabataean', title_en: 'Nabataean Kingdom',  title_ar: 'المملكة النبطية',       status: 'coming_soon' },
      { id: 'pontus',    title_en: 'Kingdom of Pontus',  title_ar: 'مملكة بونتوس',          status: 'coming_soon' },
      { id: 'bactrian',  title_en: 'Bactrian Kingdom',   title_ar: 'المملكة الباكترية',     status: 'coming_soon' },
    ],
  },
  {
    id: 'rome_arab_world',
    num: 6,
    title_en: 'Rome in the Arab World',
    title_ar: 'روما في العالم العربي',
    period: '64 BCE–395 CE',
    desc_en: 'Eastern provincial mints only · Antioch · Alexandria · Tyre · Caesarea',
    desc_ar: 'دور الضرب الإقليمية الشرقية فقط · أنطاكية · الإسكندرية · صور · قيصرية',
    catalogues: [
      { id: 'roman_provincial', title_en: 'Roman Provincial Eastern',  title_ar: 'المقاطعات الرومانية الشرقية', status: 'coming_soon' },
      { id: 'roman_egypt',      title_en: 'Roman Egypt Alexandrian',   title_ar: 'الإسكندرية الرومانية',        status: 'coming_soon' },
      { id: 'late_roman',       title_en: 'Late Roman Levant',         title_ar: 'الشام الروماني المتأخر',      status: 'coming_soon' },
    ],
  },
  {
    id: 'byzantine_crusader',
    num: 7,
    title_en: 'Byzantine & Crusader',
    title_ar: 'البيزنطيون والصليبيون',
    period: '395–1291 CE',
    desc_en: 'Christian empires whose coinage circulated across the Islamic world',
    desc_ar: 'الإمبراطوريات المسيحية التي تداولت عملتها في العالم الإسلامي',
    catalogues: [
      { id: 'byzantine',   title_en: 'Byzantine Empire',       title_ar: 'الإمبراطورية البيزنطية', status: 'coming_soon' },
      { id: 'crusader',    title_en: 'Crusader States',        title_ar: 'الممالك الصليبية',       status: 'coming_soon' },
      { id: 'jerusalem',   title_en: 'Kingdom of Jerusalem',   title_ar: 'مملكة القدس',            status: 'coming_soon' },
      { id: 'tripoli',     title_en: 'County of Tripoli',      title_ar: 'إمارة طرابلس',           status: 'coming_soon' },
    ],
  },
  {
    id: 'phoenician_levant',
    num: 8,
    title_en: 'Phoenician & Ancient Levant',
    title_ar: 'الفينيقيون وبلاد الشام القديمة',
    period: '1200–64 BCE',
    desc_en: 'City-states of the Levantine coast · earliest coinage of the Arab world',
    desc_ar: 'المدن الفينيقية على ساحل الشام · أقدم عملة في العالم العربي',
    catalogues: [
      { id: 'phoenician', title_en: 'Phoenician Cities',  title_ar: 'المدن الفينيقية',     status: 'coming_soon' },
      { id: 'anc_arabia', title_en: 'Ancient Arabia',     title_ar: 'الجزيرة العربية القديمة', status: 'coming_soon' },
      { id: 'himyarite',  title_en: 'Himyarite Kingdom',  title_ar: 'مملكة حمير',          status: 'coming_soon' },
      { id: 'lihyanite',  title_en: 'Lihyanite Kingdom',  title_ar: 'مملكة ليحيان',        status: 'coming_soon' },
    ],
  },
  {
    id: 'reference_tools',
    num: 9,
    title_en: 'Reference & Tools',
    title_ar: 'المراجع والأدوات',
    desc_en: 'Academic resources for the Arab and Islamic numismatist',
    desc_ar: 'مصادر أكاديمية لعالم المسكوكات العربية والإسلامية',
    catalogues: [
      { id: 'mint_gaz',      title_en: 'Mint Gazetteer',           title_ar: 'دليل دور الضرب',          status: 'coming_soon' },
      { id: 'ruler_index',   title_en: 'Ruler Index',              title_ar: 'فهرس الحكام',             status: 'coming_soon' },
      { id: 'hijri_conv',    title_en: 'Hijri–CE Converter',       title_ar: 'محول الهجري — الميلادي',  status: 'coming_soon' },
      { id: 'wt_standards',  title_en: 'Weight & Metal Standards', title_ar: 'معايير الوزن والمعادن',   status: 'coming_soon' },
      { id: 'arabic_script', title_en: 'Arabic Script Guide',      title_ar: 'دليل الخط العربي',        status: 'coming_soon' },
    ],
  },
];

// Dynasty chips for the Islamic special-case rendering
export const ISLAMIC_DYNASTY_CHIPS = [
  { dynasty: 'Abbasid',   label_en: 'Abbasid Caliphate',  label_ar: 'الخلافة العباسية',  count: 8247 },
  { dynasty: 'Samanid',   label_en: 'Samanid Dynasty',    label_ar: 'الأسرة السامانية',  count: 7658 },
  { dynasty: 'Ilkhanid',  label_en: 'Ilkhanid Dynasty',   label_ar: 'أسرة الإيلخانية',   count: 7029 },
  { dynasty: 'Umayyad',   label_en: 'Umayyad Caliphate',  label_ar: 'الخلافة الأموية',   count: 5232 },
  { dynasty: 'Ayyubid',   label_en: 'Ayyubid Dynasty',    label_ar: 'الأسرة الأيوبية',   count: 3906 },
  { dynasty: 'Artuqid',   label_en: 'Artuqid Dynasty',    label_ar: 'الأسرة الأرتقية',   count: 1348 },
  { dynasty: 'Buyid',     label_en: 'Buyid Dynasty',      label_ar: 'الأسرة البويهية',   count: 831  },
  { dynasty: 'Zangid',    label_en: 'Zangid Dynasty',     label_ar: 'الأسرة الزنكية',    count: 688  },
  { dynasty: 'Fatimid',   label_en: 'Fatimid Caliphate',  label_ar: 'الخلافة الفاطمية',  count: 596  },
  { dynasty: 'Hamdanid',  label_en: 'Hamdanid Dynasty',   label_ar: 'الأسرة الحمدانية',  count: 226  },
] as const;
