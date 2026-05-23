// src/lib/countries.ts
// Central data file for all 19 country pages

export interface CountryMeta {
  cc: string;
  slug: string;           // URL-safe slug: /country/[slug]
  co: string;             // English name
  co_ar: string;          // Arabic name
  ngcUrl?: string;        // NGC coin explorer URL for this country
  history: {
    en: string;
    ar: string;
  };
  collectingTips: {
    en: string;
    ar: string;
  };
}

export const COUNTRY_META: CountryMeta[] = [
  {
    cc: 'EG', slug: 'egypt',
    co: 'Egypt', co_ar: 'مصر',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/egypt/',
    history: {
      en: 'Egyptian coinage spans over five centuries, from Ottoman provincial issues struck in Cairo from 1517 to the commemorative coins of the modern republic. The Muhammad Ali dynasty (1805–1952) transformed the monetary system, introducing the modern millieme and piastre. The Kingdom era produced iconic portrait coins of Kings Fuad I and Farouk I, while the republic has issued commemoratives marking milestones from the Aswan High Dam to the Grand Egyptian Museum.',
      ar: 'تمتد عملات مصر على مدى أكثر من خمسة قرون، من إصدارات الولايات العثمانية التي ضُربت في القاهرة منذ عام 1517 حتى العملات التذكارية للجمهورية الحديثة. حوّلت أسرة محمد علي (1805-1952) المنظومة النقدية وأدخلت المليم والقرش الحديثَين. أنتج عهد المملكة عملات بورتريه أيقونية للملك فؤاد الأول والملك فاروق الأول، فيما أصدرت الجمهورية عملات تذكارية تُخلّد محطات بارزة من السد العالي إلى المتحف المصري الكبير.',
    },
    collectingTips: {
      en: 'Focus areas: Muhammad Ali-era silver piastres (1830s–1840s) are historically rich and still affordable. Kingdom-era gold pounds (Fuad I and Farouk I) command premiums but are readily available. Republic commemoratives in silver (Suez Canal, Nile anniversaries) are undervalued relative to their historical significance.',
      ar: 'مجالات التركيز: قروش الفضة من عهد محمد علي (1830–1840) غنية تاريخياً وبأسعار معقولة. الجنيهات الذهبية من عهد المملكة (فؤاد الأول وفاروق الأول) تحقق أسعاراً مرتفعة لكنها متوفرة. العملات التذكارية الفضية للجمهورية (قناة السويس، ذكرى النيل) مُقيَّمة بأقل من قيمتها التاريخية.',
    },
  },
  {
    cc: 'MA', slug: 'morocco',
    co: 'Morocco', co_ar: 'المغرب',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/morocco/',
    history: {
      en: 'Moroccan coinage reflects the country\'s layered history under the Alaoui Sultanate, French and Spanish protectorates, and modern monarchy. The Alaoui sultans struck silver dirhams and gold benduqis from their royal mints at Fes, Marrakesh, and Meknes. The French protectorate (1912–1956) introduced francs alongside traditional issues. King Mohammed V and Hassan II presided over a numismatic revival, issuing coins that blend Arabesque design with modern minting standards.',
      ar: 'تعكس عملات المغرب تاريخه المتعدد الطبقات في ظل السلطنة العلوية والحمايتين الفرنسية والإسبانية والملكية الحديثة. ضرب السلاطين العلويون دراهم فضية وبنادق ذهبية في دور الضرب الملكية بفاس ومراكش ومكناس. أدخلت الحماية الفرنسية (1912–1956) الفرنك إلى جانب الإصدارات التقليدية. وأشرف الملك محمد الخامس والحسن الثاني على نهضة نمسماتية أنتجت عملات تمزج بين الفن الأرابيسكي ومعايير السك الحديثة.',
    },
    collectingTips: {
      en: 'Specialist area: Alaoui-era bronze falus are numerous and inexpensive — a great entry point. Silver dirhams from the late Sultanate (Moulay Abdelhafid, Moulay Youssef) are competitively priced. The French protectorate series (1921–1956) is complete-able on a moderate budget. Hassan II gold proof sets remain the pinnacle for serious collectors.',
      ar: 'تخصص دقيق: فلوس البرونز من العهد العلوي وفيرة وبأسعار منخفضة — نقطة بداية ممتازة. دراهم الفضة من أواخر السلطنة (مولاي عبد الحفيظ، مولاي يوسف) بأسعار تنافسية. يمكن إكمال سلسلة الحماية الفرنسية (1921–1956) بميزانية معتدلة. أطقم الذهب والبرهان للملك الحسن الثاني تبقى قمة اهتمام الجامعين الجادين.',
    },
  },
  {
    cc: 'TN', slug: 'tunisia',
    co: 'Tunisia', co_ar: 'تونس',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/tunisia/',
    history: {
      en: 'Tunisia\'s numismatic history runs from Ottoman Husainid beys through French protectorate francs to the modern republic\'s dinars. The Husainid dynasty (1705–1957) produced some of the most artistically refined coins in the Arab world — their silver piastres and gold sultani are prized by specialists. The Bourguiba era (1957–1987) issued coins celebrating national independence and development, while the post-revolution period introduced new commemoratives reflecting modern Tunisia.',
      ar: 'يمتد تاريخ العملات التونسية من البايات الحسينيين العثمانيين إلى فرنكات الحماية الفرنسية وصولاً إلى دنانير الجمهورية الحديثة. أنتجت الأسرة الحسينية (1705–1957) بعضاً من أرقى عملات العالم العربي فنياً — قروشها الفضية وسلطانياتها الذهبية يُقدّرها المتخصصون. أصدر عهد بورقيبة (1957–1987) عملات تحتفي بالاستقلال الوطني والتنمية، فيما أدخل عهد ما بعد الثورة عملات تذكارية جديدة تعكس تونس الحديثة.',
    },
    collectingTips: {
      en: 'Husainid-era coins are the jewel of Tunisian collecting — particularly silver 4-piastre and 8-piastre pieces. French protectorate issues (1891–1945) are affordable and historically fascinating. The Bourguiba dinar series (1960s–1980s) is highly collectible as a complete set. Look for proof and specimen strikes from the Central Bank of Tunisia in the 1970s–80s.',
      ar: 'عملات العهد الحسيني هي درة المجموعات التونسية — لا سيما قطع الأربعة وثمانية قروش الفضية. إصدارات الحماية الفرنسية (1891–1945) بأسعار معقولة وذات قيمة تاريخية رائعة. سلسلة دنانير بورقيبة (1960–1980) قابلة للاكتمال وذات قيمة مجموعاتية عالية. ابحث عن نسخ البرهان والنماذج الخاصة من البنك المركزي التونسي في السبعينيات والثمانينيات.',
    },
  },
  {
    cc: 'SA', slug: 'saudi-arabia',
    co: 'Saudi Arabia', co_ar: 'المملكة العربية السعودية',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/saudi-arabia/',
    history: {
      en: 'Saudi Arabian coinage traces its roots to the Hejaz, the historic heartland of Islam encompassing Mecca and Medina. Ottoman-era Hejaz coins gave way to the independent Hejaz riyals of the Hashemite period, before Ibn Saud unified the peninsula and established the Kingdom in 1932. Saudi coinage evolved through eight reigns — from the silver riyals of King Abdulaziz to the modern gold commemoratives of King Salman — always bearing Quranic inscriptions and the crossed swords emblem.',
      ar: 'يعود تاريخ العملات السعودية إلى الحجاز، قلب الإسلام التاريخي الذي يضم مكة المكرمة والمدينة المنورة. خلفت ريالات الحجاز الهاشمية المستقلة عملات الحجاز العثمانية، قبل أن يوحّد ابن سعود الجزيرة ويؤسس المملكة عام 1932. تطورت العملة السعودية عبر ثمانية عهود — من ريالات الفضة للملك عبد العزيز إلى التذكاريات الذهبية الحديثة للملك سلمان — وهي تحمل دائماً آيات قرآنية وشعار السيفين.',
    },
    collectingTips: {
      en: 'The pre-kingdom Hejaz series (1916–1925) is historically compelling — silver riyals and gold dinars of Sharif Hussein and his sons. Ibn Saud\'s early coinage (1928–1935) in silver is undervalued. The complete reign-by-reign set across all eight kings is an achievable long-term project. Gold proof sovereigns from King Faisal onward command strong premiums.',
      ar: 'سلسلة الحجاز ما قبل المملكة (1916–1925) ذات جاذبية تاريخية استثنائية — ريالات الفضة والدنانير الذهبية للشريف حسين وأبنائه. العملات الأولى لابن سعود (1928–1935) من الفضة مقيّمة بأقل من قيمتها. إكمال مجموعة عهد بعهد عبر الملوك الثمانية مشروع طويل الأمد قابل للتحقيق. الجنيهات الذهبية البرهانية من عهد الملك فيصل فصاعداً تحقق أسعاراً مرتفعة.',
    },
  },
  {
    cc: 'IQ', slug: 'iraq',
    co: 'Iraq', co_ar: 'العراق',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/iraq/',
    history: {
      en: 'Iraqi numismatics begins with Ottoman Mesopotamian issues and moves through the British mandate, the Hashemite Kingdom (1921–1958), and the republic. The Kingdom era produced portrait coins of Kings Faisal I, Ghazi, and Faisal II — among the most sought-after Arab royal portraits. The republican period issued coins commemorating landmarks from the Hammurabi statue to the Ishtar Gate, while Ba\'athist issues reflected the country\'s turbulent political history through 2004.',
      ar: 'تبدأ النمسماتيا العراقية بإصدارات بلاد الرافدين العثمانية وتمر عبر الانتداب البريطاني والمملكة الهاشمية (1921–1958) والجمهورية. أنتج عهد المملكة عملات بورتريه للملوك فيصل الأول وغازي وفيصل الثاني — من أكثر البورتريهات الملكية العربية طلباً. أصدرت الحقبة الجمهورية عملات تُخلّد معالم من تمثال حمورابي إلى بوابة عشتار، فيما عكست إصدارات البعث التاريخ السياسي المضطرب للبلاد حتى عام 2004.',
    },
    collectingTips: {
      en: 'Hashemite Kingdom portrait coins are the prestige pieces — Faisal I silver dinars are key rarities. Republican-era copper-nickel issues (1959–1970s) are affordable and historically rich. Ba\'athist commemoratives in silver (Babylon series, Gulf War-era) are controversial but collectible. British mandate fils (1931–1933) complete the pre-Kingdom picture.',
      ar: 'عملات البورتريه للمملكة الهاشمية هي القطع المرموقة — دنانير الفضة للملك فيصل الأول من أبرز الندرات. إصدارات النحاس-النيكل للعهد الجمهوري (1959–1970) بأسعار معقولة وغنية تاريخياً. التذكاريات الفضية للبعث (سلسلة بابل، عهد حرب الخليج) مثيرة للجدل لكنها قابلة للجمع. الفلوس من عهد الانتداب البريطاني (1931–1933) تكمل صورة ما قبل المملكة.',
    },
  },
  {
    cc: 'AE', slug: 'uae',
    co: 'UAE', co_ar: 'الإمارات العربية المتحدة',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/united-arab-emirates/',
    history: {
      en: 'The UAE began issuing its own coins in 1973, two years after federation. Prior to independence, the Trucial States used Gulf rupees and the brief Qatar & Dubai currency. UAE coinage under Sheikh Zayed (1973–2004) features the saker falcon, dhow, and oil derrick — symbols of national identity. The series under Sheikh Khalifa and Sheikh Mohammed bin Zayed has expanded with numerous commemoratives celebrating UAE heritage, space exploration, and Expo 2020.',
      ar: 'بدأت الإمارات إصدار عملاتها عام 1973، بعد عامين من الاتحاد. قبل الاستقلال، استخدمت الإمارات المتصالحة الروبية الخليجية وعملة قطر ودبي المؤقتة. تتضمن عملات الإمارات في عهد الشيخ زايد (1973–2004) صقر الحر والسفينة الشراعية وبرج النفط — رموز الهوية الوطنية. اتسعت السلسلة في عهد الشيخ خليفة والشيخ محمد بن زايد لتشمل تذكاريات عديدة تحتفي بالتراث الإماراتي وغزو الفضاء وإكسبو 2020.',
    },
    collectingTips: {
      en: 'The complete Zayed-era circulation set (1973–2004) is achievable and historically important. Gold commemoratives from the Abu Dhabi and Dubai central banks are investment-grade pieces. Pre-federation Qatar & Dubai coins (1966–1973) are scarce and popular as historical predecessors. Proof sets from the UAE Central Bank\'s early years (1976–1980s) are the specialist\'s target.',
      ar: 'يمكن إكمال سلسلة التداول الكاملة لعهد زايد (1973–2004) وهي مهمة تاريخياً. التذكاريات الذهبية من مصارف أبوظبي ودبي المركزية قطع ذات درجة استثمارية. عملات قطر ودبي ما قبل الاتحاد (1966–1973) نادرة وشائعة بوصفها سلفاً تاريخياً. أطقم البرهان من السنوات الأولى للمصرف المركزي الإماراتي (1976–1980) هدف المتخصص.',
    },
  },
  {
    cc: 'OM', slug: 'oman',
    co: 'Oman', co_ar: 'عُمان',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/oman/',
    history: {
      en: 'Omani coinage spans the Muscat & Oman Sultanate, the Imamate of Oman, and the modern Sultanate under Qaboos and Haitham. Early Muscat issues in the 19th century used Maria Theresa thalers alongside local baiza. The Sa\'id dynasty coins reflect Oman\'s maritime heritage as a trading empire stretching from Zanzibar to Baluchistan. Sultan Qaboos (1970–2020) issued a remarkable series of commemoratives celebrating Omani culture, wildlife, and archaeological sites.',
      ar: 'تمتد عملات عُمان عبر سلطنة مسقط وعُمان والإمامة العُمانية والسلطنة الحديثة في عهد قابوس وهيثم. استخدمت إصدارات مسقط المبكرة في القرن التاسع عشر ثالرات ماريا تيريزا إلى جانب البيسة المحلية. تعكس عملات الأسرة السعيدية الإرث البحري لعُمان بوصفها إمبراطورية تجارية امتدت من زنجبار إلى بلوشستان. أصدر السلطان قابوس (1970–2020) سلسلة استثنائية من التذكاريات تحتفي بالثقافة العُمانية والحياة البرية والمواقع الأثرية.',
    },
    collectingTips: {
      en: 'The Imamate baiza series (1950s) is the specialist rarity — small mintages and historical significance. Muscat & Oman coinage (1940s–1960s) bridges the old and new eras affordably. Qaboos-era proof sets in silver and gold are the prestige collectibles — the wildlife and heritage series are particularly sought. The 2020 "Haitham" first-year coins mark a new collecting chapter.',
      ar: 'سلسلة بيسة الإمامة (1950) هي الندرة المتخصصة — أعداد ضرب صغيرة وأهمية تاريخية. عملات مسقط وعُمان (1940–1960) تجسر بين العهدين القديم والحديث بأسعار معقولة. أطقم البرهان الفضية والذهبية لعهد قابوس هي التحف المجموعاتية المرموقة — سلاسل الحياة البرية والتراث مطلوبة بشكل خاص. عملات السنة الأولى لـ"هيثم" 2020 تمثل فصلاً جديداً في الجمع.',
    },
  },
  {
    cc: 'LY', slug: 'libya',
    co: 'Libya', co_ar: 'ليبيا',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/libya/',
    history: {
      en: 'Libya\'s coinage history moves from Ottoman provincial issues through Italian colonial piastres, the independent Kingdom of Libya under King Idris I (1952–1969), and the Gaddafi-era Libyan Arab Republic and Jamahiriya. The Kingdom era produced portrait coins of Idris I — the only Arab king never to appear on his own circulating coins. Republican issues feature the iconic equestrian — the El-Fateh Revolution\'s symbol — and the FAO commemorative series of the 1970s.',
      ar: 'ينتقل تاريخ العملات الليبية من الإصدارات العثمانية عبر القروش الاستعمارية الإيطالية والمملكة الليبية المستقلة في عهد الملك إدريس الأول (1952–1969) وجمهورية القذافي والجماهيرية. أنتج عهد المملكة عملات بورتريه لإدريس الأول — الملك العربي الوحيد الذي لم يظهر قط على عملاته المتداولة. تتضمن الإصدارات الجمهورية الفارس الأيقوني — رمز ثورة الفاتح — وسلسلة تذكاريات الفاو في السبعينيات.',
    },
    collectingTips: {
      en: 'Kingdom-era piastres (1952–1969) are the collecting cornerstone — affordable and historically significant. The 1952 independence series is a key set. Gaddafi-era proof commemoratives in silver (1970s–80s) are undervalued in the current market. Ottoman Libyan issues (Tripolitania, Cyrenaica) from the 16th–17th centuries are rare and require specialist knowledge.',
      ar: 'قروش عهد المملكة (1952–1969) هي ركيزة الجمع — بأسعار معقولة وذات أهمية تاريخية. سلسلة استقلال 1952 مجموعة رئيسية. تذكاريات عهد القذافي البرهانية من الفضة (1970–1980) مقيّمة بأقل من قيمتها في السوق الحالية. الإصدارات العثمانية الليبية (طرابلس، برقة) من القرنين السادس والسابع عشر نادرة وتستلزم معرفة متخصصة.',
    },
  },
  {
    cc: 'DZ', slug: 'algeria',
    co: 'Algeria', co_ar: 'الجزائر',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/algeria/',
    history: {
      en: 'Algerian coinage spans three distinct periods: Ottoman Regency issues (1515–1830) from the Algiers mint, French colonial francs and centimes (1830–1962), and the modern republic\'s dinar series (1964–present). Ottoman Algiers produced distinctive copper mangirs and silver budju — coins that circulated across the Mediterranean. The French colonial era issued some of the most beautifully designed coins in North Africa. Independent Algeria\'s coins celebrate Berber heritage, revolutionary heroes, and natural resources.',
      ar: 'تشمل عملات الجزائر ثلاث حقب متميزة: إصدارات الإيالة العثمانية (1515–1830) من دار الضرب بالجزائر، وفرنكات وسنتيمات الاستعمار الفرنسي (1830–1962)، وسلسلة دينار الجمهورية الحديثة (1964–حتى الآن). أنتجت الجزائر العثمانية مانجيراً نحاسياً وبدجواً فضياً مميزاً تداول في أرجاء المتوسط. أصدر العهد الاستعماري الفرنسي بعضاً من أجمل العملات تصميماً في شمال أفريقيا. تحتفي عملات الجزائر المستقلة بالتراث الأمازيغي وأبطال الثورة والموارد الطبيعية.',
    },
    collectingTips: {
      en: 'Ottoman Regency budju (silver) and mangir (copper) are specialist pieces with Mediterranean-wide historical significance. French colonial centimes (1919–1952) are inexpensive and form a beautiful complete set. The early republic dinar series (1964–1972) in nickel is historically pivotal and undervalued. Look for the rare Essai (trial strike) pieces from the French and early republic periods.',
      ar: 'البدجو الفضي والمانجير النحاسي للإيالة العثمانية قطع متخصصة ذات أهمية تاريخية متوسطية. السنتيمات الاستعمارية الفرنسية (1919–1952) رخيصة الثمن وتشكّل مجموعة كاملة جميلة. سلسلة الدينار من أوائل الجمهورية (1964–1972) بالنيكل محورية تاريخياً ومقيّمة بأقل من قيمتها. ابحث عن قطع الإيساي (الضرب التجريبي) النادرة من الفترتين الفرنسية وأوائل الجمهورية.',
    },
  },
  {
    cc: 'SY', slug: 'syria',
    co: 'Syria', co_ar: 'سوريا',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/syria/',
    history: {
      en: 'Syrian coinage passes through Ottoman provincial issues, the French Mandate (1920–1946) with its elegant piastre series, and the Syrian Republic and Arab Republic. French Mandate coins, minted in Paris and Poissy, are among the most artistically refined Arab coins of the 20th century. The United Arab Republic period (1958–1961) with Egypt produced joint-issue coins. Ba\'athist Syria issued commemoratives through 2018 marking regional and international events.',
      ar: 'تمر العملات السورية عبر إصدارات الولايات العثمانية والانتداب الفرنسي (1920–1946) بسلسلة قروشه الأنيقة والجمهورية السورية والجمهورية العربية. عملات الانتداب الفرنسي، التي سُكّت في باريس وبواسي، من أرقى العملات العربية تصميماً في القرن العشرين. أنتجت مرحلة الجمهورية العربية المتحدة (1958–1961) مع مصر عملات إصدار مشترك. أصدرت سوريا البعثية تذكاريات حتى عام 2018 تُخلّد أحداثاً إقليمية ودولية.',
    },
    collectingTips: {
      en: 'French Mandate piastres (1921–1936) in silver are the finest Syrian coins — the sphinx and palm tree designs are iconic. The rare Kingdom of Syria pieces (1920) command significant premiums. UAR-era joint coins with Egypt (1958–1961) are historically fascinating and affordable. Early republic qirsh coins (1947–1968) offer excellent historical coverage at modest prices.',
      ar: 'قروش الانتداب الفرنسي الفضية (1921–1936) هي أجود العملات السورية — تصاميم أبو الهول وشجرة النخيل أيقونية. قطع مملكة سوريا النادرة (1920) تحقق أسعاراً مرتفعة. العملات المشتركة لحقبة الجمهورية العربية المتحدة مع مصر (1958–1961) رائعة تاريخياً وبأسعار معقولة. قروش الجمهورية الأولى (1947–1968) تقدم تغطية تاريخية ممتازة بأسعار متواضعة.',
    },
  },
  {
    cc: 'JO', slug: 'jordan',
    co: 'Jordan', co_ar: 'الأردن',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/jordan/',
    history: {
      en: 'Jordan\'s coinage begins with the Emirate of Transjordan (1927–1946) under Emir Abdullah I and continues through the Hashemite Kingdom. Jordanian coins have always featured royal portraits — a continuous visual record of four monarchs: Abdullah I, Talal, Hussein, and Abdullah II. The Hussein era (1952–1999) produced the most extensive and historically rich series, including commemoratives for the 1967 war\'s aftermath and Jordanian cultural heritage. Modern issues reflect Jordan\'s role as a bridge between tradition and modernity.',
      ar: 'تبدأ عملات الأردن بإمارة شرق الأردن (1927–1946) في عهد الأمير عبدالله الأول وتستمر عبر المملكة الهاشمية. حملت العملات الأردنية دائماً صور الملوك — سجل بصري متواصل لأربعة ملوك: عبدالله الأول وطلال والحسين وعبدالله الثاني. أنتج عهد الملك حسين (1952–1999) أوسع السلاسل وأغناها تاريخياً، بما فيها تذكاريات لتداعيات حرب 1967 والتراث الثقافي الأردني. تعكس الإصدارات الحديثة دور الأردن جسراً بين التقليد والحداثة.',
    },
    collectingTips: {
      en: 'Emirate-era Palestinian mandate fils (1927–1946) are historically unique. First Hashemite Kingdom issues (1949–1952) with the portrait of Abdullah I are key pieces. The complete Hussein-era fils and dinar sets are achievable and rewarding. Gold proof dinars from the Hussein and Abdullah II eras are investment-grade commemoratives.',
      ar: 'فلوس الإمارة من عهد الانتداب الفلسطيني (1927–1946) فريدة تاريخياً. إصدارات المملكة الهاشمية الأولى (1949–1952) ببورتريه عبدالله الأول قطع رئيسية. يمكن إكمال مجموعات الفلوس والدنانير الكاملة لعهد الحسين بجهد مجزٍ. الدنانير الذهبية البرهانية من عهدي الحسين وعبدالله الثاني تذكاريات ذات درجة استثمارية.',
    },
  },
  {
    cc: 'LB', slug: 'lebanon',
    co: 'Lebanon', co_ar: 'لبنان',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/lebanon/',
    history: {
      en: 'Lebanese coinage is relatively compact — the country\'s numismatic history begins with the French Mandate piastres of 1924 and the post-independence livres from 1952. French Mandate issues from Paris and Poissy feature the cedar of Lebanon alongside classical French minting artistry. Independent Lebanon\'s coins have been issued by the Banque du Liban since 1964, with a series of commemoratives celebrating Lebanese heritage, the cedar, and Phoenician history. Civil war years saw coinage interrupted; the modern pound series resumed in the 1990s.',
      ar: 'عملات لبنان مجموعة نسبياً — يبدأ تاريخها النمسماتي بقروش الانتداب الفرنسي عام 1924 وليرات ما بعد الاستقلال منذ 1952. تتضمن إصدارات الانتداب الفرنسي من باريس وبواسي أرزة لبنان إلى جانب فن السك الفرنسي الكلاسيكي. تُصدر بنك لبنان عملات لبنان المستقلة منذ 1964، بسلسلة من التذكاريات تحتفي بالتراث اللبناني والأرزة والتاريخ الفينيقي. شهدت سنوات الحرب الأهلية انقطاعاً في إصدار العملات، وعادت سلسلة الليرة الحديثة في التسعينيات.',
    },
    collectingTips: {
      en: 'French Mandate piastres (1924–1945) are the foundation — silver 25 and 50 piastres are beautiful pieces. The transition series (1952–1963) before Banque du Liban coinage is historically pivotal. Banque du Liban commemoratives in silver (1968–1980s) are the collector\'s prestige pieces. The complete Mandate-through-modern set is achievable on a moderate budget.',
      ar: 'قروش الانتداب الفرنسي (1924–1945) هي الأساس — الـ25 والـ50 قرشاً الفضية قطع جميلة. سلسلة المرحلة الانتقالية (1952–1963) قبل عملات بنك لبنان محورية تاريخياً. تذكاريات بنك لبنان الفضية (1968–1980) هي القطع المرموقة للجامع. يمكن إكمال المجموعة الكاملة من الانتداب إلى الحداثة بميزانية معتدلة.',
    },
  },
  {
    cc: 'KW', slug: 'kuwait',
    co: 'Kuwait', co_ar: 'الكويت',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-colors/kuwait/',
    history: {
      en: 'Kuwait began issuing its own currency in 1961 with independence from Britain. Prior to this, Indian rupees and Gulf rupees circulated in the sheikhdom. Kuwaiti coins under five amirs — Abdullah Al-Salem, Sabah Al-Salem, Jaber Al-Ahmad, Sabah Al-Ahmad, and Nawaf Al-Ahmad — feature the distinctive dhow sailing ship. Kuwait was the first Gulf state to issue a gold dinar commemorative series, setting a precedent for the region\'s numismatic development.',
      ar: 'بدأت الكويت إصدار عملتها عام 1961 باستقلالها عن بريطانيا. قبل ذلك تداولت الروبية الهندية وروبية الخليج في الإمارة. تتضمن عملات الكويت تحت خمسة أمراء — عبدالله السالم وصباح السالم وجابر الأحمد وصباح الأحمد ونواف الأحمد — السفينة الشراعية المميزة. كانت الكويت أول دولة خليجية تُصدر سلسلة دنانير ذهبية تذكارية، مما وضع سابقة لتطور نمسماتيا المنطقة.',
    },
    collectingTips: {
      en: 'The complete five-reign circulation set (1961–present) in fils is the foundation Kuwaiti collection. First-year issues under Abdullah Al-Salem (1961) are the key dates. Gold dinar proof sets (1970s–80s) are prestige pieces — the archaeological and heritage series are particularly sought. Iraqi occupation-era pieces (1990–1991) are a controversial but historically significant subcategory.',
      ar: 'مجموعة التداول الكاملة لخمسة عهود (1961–حتى الآن) بالفلوس هي المجموعة الكويتية الأساسية. إصدارات السنة الأولى في عهد عبدالله السالم (1961) هي التواريخ الرئيسية. أطقم الدينار الذهبي البرهانية (1970–1980) قطع مرموقة — سلاسل الآثار والتراث مطلوبة بشكل خاص. قطع حقبة الاحتلال العراقي (1990–1991) فئة فرعية مثيرة للجدل لكنها مهمة تاريخياً.',
    },
  },
  {
    cc: 'QA', slug: 'qatar',
    co: 'Qatar', co_ar: 'قطر',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/qatar/',
    history: {
      en: 'Qatar\'s modern coinage began in 1966 with the Qatar & Dubai Currency Board issues, followed by independent Qatari riyals from 1973. Qatar & Dubai coins (1966–1973) are historically unique — the only currency issued jointly by two states that went on to develop separate identities. Independent Qatar has issued coins under four amirs, with a notably conservative approach — commemoratives are relatively rare compared to Gulf neighbors. The FIFA World Cup 2022 series marks a major chapter in modern Qatari numismatics.',
      ar: 'بدأت عملة قطر الحديثة عام 1966 بإصدارات مجلس عملة قطر ودبي، يليها الريال القطري المستقل منذ 1973. عملات قطر ودبي (1966–1973) فريدة تاريخياً — العملة الوحيدة التي أصدرتها دولتان أفرزتا لاحقاً هويتين مستقلتين. أصدرت قطر المستقلة عملات تحت أربعة أمراء، مع نهج محافظ ملحوظ — التذكاريات نادرة نسبياً مقارنة بجيران الخليج. يُمثّل إصدار كأس العالم FIFA 2022 فصلاً بارزاً في نمسماتيا قطر الحديثة.',
    },
    collectingTips: {
      en: 'Qatar & Dubai joint-issue coins (1966–1973) are the specialist\'s prize — historically unique and increasingly scarce. Complete independent riyal sets by reign are achievable. The rare proof and specimen pieces from the Qatar Monetary Agency (1970s) are key collector targets. The 2022 World Cup commemorative series in silver and gold represents modern Qatar\'s numismatic ambition.',
      ar: 'عملات الإصدار المشترك لقطر ودبي (1966–1973) جائزة المتخصص — فريدة تاريخياً ونادرة بشكل متزايد. مجموعات الريال المستقل الكاملة بعهد بعهد قابلة للإكمال. قطع البرهان والنماذج النادرة من مؤسسة النقد القطري (1970) أهداف رئيسية للجامعين. سلسلة تذكاريات كأس العالم 2022 الفضية والذهبية تمثل طموح قطر النمسماتي الحديث.',
    },
  },
  {
    cc: 'SD', slug: 'sudan',
    co: 'Sudan', co_ar: 'السودان',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/sudan/',
    history: {
      en: 'Sudanese coinage history encompasses the Mahdist State (1885–1898), Anglo-Egyptian Condominium issues, and the modern republic\'s pound and dinar series. The Mahdist period produced the most historically fascinating Sudanese coins — struck in Omdurman during the siege of Khartoum, they bear simple Arabic legends reflecting the Mahdi\'s Islamic state. Post-independence Sudan issued coins celebrating African unity and development. The Nimeiry era (1969–1985) produced an extensive commemorative series, some in gold.',
      ar: 'يشمل تاريخ العملات السودانية الدولة المهدية (1885–1898) وإصدارات الحكم الثنائي الإنجليزي المصري والجنيه والدينار للجمهورية الحديثة. أنتجت الحقبة المهدية أكثر العملات السودانية رواية تاريخية — ضُربت في أم درمان إبان حصار الخرطوم، وتحمل نقوشاً عربية بسيطة تعكس الدولة الإسلامية للمهدي. أصدر السودان ما بعد الاستقلال عملات تحتفي بالوحدة الأفريقية والتنمية. أنتج عهد نميري (1969–1985) سلسلة واسعة من التذكاريات، بعضها ذهبي.',
    },
    collectingTips: {
      en: 'Mahdist piastres (1885–1898) are the historical crown jewels — difficult to find in good condition but deeply significant. Condominium-era milliemes (1956 independence series) are affordable. Nimeiry commemoratives in silver and cupro-nickel (1970s–80s) represent the golden age of Sudanese commemoratives. The scarce Darfur and provincial issues from the late Ottoman period are specialist territories.',
      ar: 'قروش عهد المهدية (1885–1898) هي التاج التاريخي — يصعب العثور عليها بحالة جيدة لكنها بالغة الأهمية. الأنصاف من حقبة الحكم الثنائي (سلسلة استقلال 1956) بأسعار معقولة. تذكاريات نميري الفضية والنحاس-نيكل (1970–1980) تمثل العصر الذهبي للتذكاريات السودانية. إصدارات دارفور والأقاليم النادرة من أواخر العهد العثماني مناطق متخصصة.',
    },
  },
  {
    cc: 'YE', slug: 'yemen',
    co: 'Yemen', co_ar: 'اليمن',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/yemen/',
    history: {
      en: 'Yemeni numismatics spans the Zaydi Imamate (dating back centuries), the Mutawakkilite Kingdom of Yemen (1918–1962), the Yemen Arab Republic, the People\'s Democratic Republic of Yemen (South Yemen), and the unified Republic of Yemen. The Imamate series under Imams Yahya and Ahmad is the most prized — hand-struck silver riyals and buqsha bearing intricate calligraphy from the San\'a mint. The two Yemens\' parallel coinage (1962–1990) offers a fascinating comparative study in Arabian politics through numismatics.',
      ar: 'تشمل نمسماتيا اليمن الإمامة الزيدية (الممتدة لقرون)، والمملكة المتوكلية اليمنية (1918–1962)، والجمهورية العربية اليمنية، وجمهورية اليمن الديمقراطية الشعبية (اليمن الجنوبي)، والجمهورية اليمنية الموحدة. سلسلة الإمامة في عهد الأئمة يحيى وأحمد هي الأكثر قيمة — ريالات فضية ضُربت يدوياً وبقشة بخط عربي رائع من دار ضرب صنعاء. عملتا اليمنين المتوازيتان (1962–1990) تقدمان دراسة مقارنة رائعة في السياسة الجزيرية من خلال النمسماتيا.',
    },
    collectingTips: {
      en: 'Imamate silver riyals (1322–1382 AH) are the prestige Yemeni pieces — hand-struck with visible die marks and calligraphy. The transitional buqsha series from the 1950s bridges the Imamate and Republic. South Yemen (PDRY) coins (1964–1990) are undervalued and historically significant as the Arab world\'s only Marxist state coinage. Unified Republic commemoratives (post-1990) celebrate ancient Yemeni civilization sites.',
      ar: 'ريالات الإمامة الفضية (1322–1382 هـ) هي قطع اليمن المرموقة — مضروبة يدوياً بآثار القوالب وخط بديع. سلسلة البقشة الانتقالية من خمسينيات القرن الماضي تجسر بين الإمامة والجمهورية. عملات اليمن الجنوبي (جمهورية اليمن الديمقراطية الشعبية) (1964–1990) مقيّمة بأقل من قيمتها ومهمة تاريخياً بوصفها نمسماتيا الدولة الماركسية الوحيدة في العالم العربي. تذكاريات الجمهورية الموحدة (بعد 1990) تحتفي بمواقع الحضارة اليمنية القديمة.',
    },
  },
  {
    cc: 'MR', slug: 'mauritania',
    co: 'Mauritania', co_ar: 'موريتانيا',
    history: {
      en: 'Mauritania\'s national currency, the ouguiya, was introduced in 1973 replacing the CFA franc after independence. Mauritanian coins feature the star and crescent on most issues, with commemoratives reflecting the country\'s position as a bridge between Arab North Africa and sub-Saharan Africa. The series is compact but historically meaningful — from the first ouguiya issues under President Ould Daddah to modern bimetallic coins.',
      ar: 'أُدخلت الأوقية الوطنية الموريتانية عام 1973 لتحل محل فرنك المنطقة الأفريقية بعد الاستقلال. تتضمن العملات الموريتانية النجمة والهلال في معظم إصداراتها، فيما تعكس التذكاريات موقع البلاد جسراً بين شمال أفريقيا العربي وأفريقيا جنوب الصحراء. السلسلة مدمجة لكنها ذات قيمة تاريخية — من إصدارات الأوقية الأولى في عهد الرئيس ولد داداه إلى العملات ثنائية المعدن الحديثة.',
    },
    collectingTips: {
      en: 'The complete Mauritanian series is achievable — a small, focused collection covering the nation\'s entire monetary history. First-issue ouguiya (1973–1974) are the key dates. Proof and specimen pieces are extremely rare and not well-documented — discoveries still occur. An ideal collection for collectors who prefer depth over breadth.',
      ar: 'يمكن إكمال السلسلة الموريتانية بالكامل — مجموعة صغيرة ومركزة تغطي كامل تاريخ البلاد النقدي. أوقيات الإصدار الأول (1973–1974) هي التواريخ الرئيسية. قطع البرهان والنماذج نادرة للغاية وغير موثقة جيداً — لا تزال الاكتشافات تحدث. مثالية للجامعين الذين يفضلون العمق على الاتساع.',
    },
  },
  {
    cc: 'PS', slug: 'palestine',
    co: 'Palestine', co_ar: 'فلسطين',
    ngcUrl: 'https://www.ngccoin.com/coin-explorer/world-coins/palestine/',
    history: {
      en: 'Palestine\'s coinage under the British Mandate (1927–1947) is among the most historically poignant in the Arab world. The Palestine Currency Board issued mils and pounds bearing the word "Palestine" in English, Arabic, and Hebrew — a trilingual testament to the land\'s contested history. The coins, minted in London and Bombay, feature a simple olive branch and the Arabic word "فلسطين". These 20 years of coinage represent the last time Palestine had an internationally recognized currency.',
      ar: 'عملات فلسطين تحت الانتداب البريطاني (1927–1947) من أكثر العملات العربية عمقاً في التاريخ. أصدر مجلس عملة فلسطين الملس والجنيهات بكلمة "فلسطين" بالإنجليزية والعربية والعبرية — شهادة ثلاثية اللغة على التاريخ المتنازع عليه لهذه الأرض. العملات، التي سُكّت في لندن وبومباي، تحمل غصن زيتون بسيطاً وكلمة "فلسطين" بالعربية. تمثل هذه العشرون عاماً من إصدار العملة آخر مرة كان فيها لفلسطين عملة معترف بها دولياً.',
    },
    collectingTips: {
      en: 'Every Palestine Mandate coin is a historically significant piece. The complete set spans 1927–1946 across mils (1, 2, 5, 10, 20, 50, 100) and pound. Key dates: 1927 first issues and 1942–1944 wartime pieces. Condition is critical — many circulated heavily. The 100 mils (silver) in high grade is the prestige piece. Proof and specimen strikes are extreme rarities.',
      ar: 'كل عملة من انتداب فلسطين قطعة ذات أهمية تاريخية. المجموعة الكاملة تمتد من 1927 إلى 1946 عبر الملس (1، 2، 5، 10، 20، 50، 100) والجنيه. التواريخ الرئيسية: إصدارات 1927 الأولى وقطع الحرب 1942–1944. الحالة حاسمة — كثيرة منها تداولت بشكل مكثف. مئة الملس (الفضة) بدرجة عالية هي القطعة المرموقة. ضربات البرهان والنماذج ندرات قصوى.',
    },
  },
  {
    cc: 'QD', slug: 'qatar-dubai',
    co: 'Qatar & Dubai', co_ar: 'قطر ودبي',
    history: {
      en: 'The Qatar & Dubai Currency Board (1966–1973) issued one of the most historically unusual coinages in the Arab world — a shared currency between two states that both went on to join larger federations. Qatar became independent in 1971; Dubai joined the UAE. The joint currency covered dirhams from 1 dirham to 1 riyal. These seven years of coinage are the only numismatic record of these two sheikhdoms as monetary partners, making them prized by Gulf specialists.',
      ar: 'أصدر مجلس عملة قطر ودبي (1966–1973) واحدة من أغرب العملات في العالم العربي تاريخياً — عملة مشتركة بين دولتين انضمتا لاحقاً إلى اتحادات أكبر. استقلت قطر عام 1971، وانضم دبي إلى الإمارات. غطت العملة المشتركة دراهم من 1 درهم إلى 1 ريال. هذه السنوات السبع من إصدار العملة هي السجل النمسماتي الوحيد لهذين الشيخدومين بوصفهما شريكَين نقديَّين، مما يجعلها مُقدَّرة لدى متخصصي الخليج.',
    },
    collectingTips: {
      en: 'A genuinely completable series — only a handful of denominations across seven years. The full set (1 dirham through 1 riyal, 1966–1973) is the goal. Condition varies widely as many circulated in harsh Gulf conditions. These coins are historically unique — no other Arab currency was shared between two states that both survived as distinct political entities. An ideal specialist collection.',
      ar: 'سلسلة قابلة للإكمال فعلاً — بضعة فئات فقط على مدى سبع سنوات. المجموعة الكاملة (من 1 درهم إلى 1 ريال، 1966–1973) هي الهدف. تتفاوت الحالة بشكل كبير إذ تداول كثيرها في ظروف خليجية قاسية. هذه العملات فريدة تاريخياً — لا توجد عملة عربية أخرى شاركت فيها دولتان نجتا كيانين سياسيين مستقلَّين. مجموعة متخصصة مثالية.',
    },
  },
];

export const COUNTRY_META_BY_CC: Record<string, CountryMeta> =
  Object.fromEntries(COUNTRY_META.map(c => [c.cc, c]));

export const COUNTRY_META_BY_SLUG: Record<string, CountryMeta> =
  Object.fromEntries(COUNTRY_META.map(c => [c.slug, c]));
