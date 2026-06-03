'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';

const ALL_COINS = COINS_RAW as unknown as Coin[];
const ISLAMIC   = ALL_COINS.filter(c => c.cc === 'IS');

const METAL_AR: Record<string,string> = {
  Gold:'ذهب', Silver:'فضة', Copper:'نحاس', Bronze:'برونز',
  Billon:'بليون', Brass:'نحاس أصفر', 'Copper-nickel':'نحاس-نيكل',
  AV:'ذهب', AR:'فضة', AE:'برونز',
};

type IslamicCoin = Coin & { denomination?: string; ruler?: string; mint?: string };

interface Dynasty {
  key: string; label_en: string; label_ar: string;
  icon: string; period: string; desc_en: string; desc_ar: string;
  dynMatch: string[];
}

const DYNASTIES: Dynasty[] = [
  { key:'umayyad',       label_en:'Umayyad Caliphate',       label_ar:'الدولة الأموية',
    icon:'☪️',  period:'661–750 CE',
    desc_en:'The first major Islamic caliphate. Struck the earliest true Islamic silver dirhams and gold dinars.',
    desc_ar:'أولى الخلافات الإسلامية الكبرى. ضربت أوائل الدراهم الفضية والدنانير الذهبية الإسلامية الحقيقية.',
    dynMatch:['الدولة الأموية','Umayyad Caliphate','أموي'] },

  { key:'umayyad_andalus', label_en:'Umayyad of al-Andalus', label_ar:'الأمويون في الأندلس',
    icon:'🕌',  period:'756–1031 CE',
    desc_en:'The Andalusian Umayyad caliphate of Córdoba. Struck magnificent gold dinars and silver dirhams.',
    desc_ar:'خلافة قرطبة الأموية الأندلسية. ضربت دنانير ذهبية ودراهم فضية بالغة الجمال.',
    dynMatch:['الأمويون في الأندلس','Umayyad of al-Andalus'] },

  { key:'abbasid',       label_en:'Abbasid Caliphate',       label_ar:'الخلافة العباسية',
    icon:'🕌',  period:'750–1258 CE',
    desc_en:'The golden age of Islamic civilisation, centred in Baghdad. Five centuries of prolific coinage.',
    desc_ar:'العصر الذهبي للحضارة الإسلامية. خمسة قرون من عملات دراهم ودنانير بخط رائع.',
    dynMatch:['الخلافة العباسية','Abbasid Caliphate','عباسي'] },

  { key:'tulunid',       label_en:'Tulunid Dynasty',         label_ar:'الدولة الطولونية',
    icon:'🦅',  period:'868–905 CE',
    desc_en:'First autonomous dynasty in Islamic Egypt, founded by Ahmad ibn Tulun. Rare coins.',
    desc_ar:'أول دولة مستقلة في مصر الإسلامية. عملاتها نادرة ومطلوبة.',
    dynMatch:['الدولة الطولونية','Tulunid','طولوني'] },

  { key:'ikhshidid',     label_en:'Ikhshidid Dynasty',       label_ar:'الإخشيديون',
    icon:'⚜️',  period:'935–969 CE',
    desc_en:'Ruled Egypt and Syria between the Tulunids and Fatimids.',
    desc_ar:'حكمت مصر والشام بين الطولونيين والفاطميين.',
    dynMatch:['الإخشيديون','Ikhshidid','إخشيدي'] },

  { key:'fatimid',       label_en:'Fatimid Caliphate',       label_ar:'الدولة الفاطمية',
    icon:'⭐',  period:'909–1171 CE',
    desc_en:'Ismaili Shia caliphate ruling Egypt and North Africa. Renowned for refined gold dinars.',
    desc_ar:'الخلافة الإسماعيلية في مصر وشمال أفريقيا. دنانيرها الذهبية من أرقى العملات الإسلامية.',
    dynMatch:['الدولة الفاطمية','Fatimid Caliphate','فاطمي'] },

  { key:'hamdanid',      label_en:'Hamdanid Dynasty',        label_ar:'الحمدانيون',
    icon:'⚔️',  period:'905–1004 CE',
    desc_en:'Arab Shia dynasty ruling Mosul and Aleppo. Famous for poetry and warfare against Byzantium.',
    desc_ar:'سلالة عربية شيعية في الموصل وحلب. اشتُهرت بالشعر والجهاد ضد البيزنطيين.',
    dynMatch:['الحمدانيون','Hamdanid','حمداني'] },

  { key:'aghlabid',      label_en:'Aghlabid Dynasty',        label_ar:'الأغالبة',
    icon:'🌴',  period:'800–909 CE',
    desc_en:'Ruled Ifriqiya (Tunisia/Libya) as Abbasid vassals. Rare western Islamic silver.',
    desc_ar:'حكمت إفريقية باسم العباسيين. دراهمها الفضية من نوادر الإسلامية الغربية.',
    dynMatch:['الأغالبة','Aghlabid','أغلبي'] },

  { key:'idrisid',       label_en:'Idrisid Dynasty',         label_ar:'الأدارسة',
    icon:'📿',  period:'789–926 CE',
    desc_en:'First Islamic dynasty in Morocco. Extremely rare silver dirhams.',
    desc_ar:'أول دولة إسلامية في المغرب. دراهمها الفضية نادرة جداً.',
    dynMatch:['الأدارسة','Idrisid','إدريسي'] },

  { key:'ayyubid',       label_en:'Ayyubid Dynasty',         label_ar:'الدولة الأيوبية',
    icon:'⚔️',  period:'1171–1260 CE',
    desc_en:'Founded by Saladin. Copper and silver coins struck across Egypt and the Levant.',
    desc_ar:'أسسها صلاح الدين. عملات نحاسية وفضية في مصر والشام.',
    dynMatch:['الأيوبيون','Ayyubid Dynasty','أيوبي'] },

  { key:'zangid',        label_en:'Zangid Dynasty',          label_ar:'الزنكيون',
    icon:'⚔️',  period:'1127–1222 CE',
    desc_en:'Ruled Mosul and Aleppo. Nur al-Din united Syria against the Crusaders.',
    desc_ar:'حكمت الموصل وحلب. نور الدين زنكي وحّد الشام لمواجهة الصليبيين.',
    dynMatch:['الزنكيون','Zangid','زنكي'] },

  { key:'artuqid',       label_en:'Artuqid Dynasty',         label_ar:'الأرتقيون',
    icon:'🏰',  period:'1101–1409 CE',
    desc_en:'Turkmen dynasty of Diyar Bakr. Large copper coins featuring Byzantine imagery.',
    desc_ar:'سلالة تركمانية في ديار بكر. عملاتهم النحاسية الكبيرة بالصور البيزنطية فريدة.',
    dynMatch:['الأرتقيون','Artuqid','أرتقي'] },

  { key:'mamluk',        label_en:'Mamluk Sultanate',        label_ar:'سلطنة المماليك',
    icon:'🏇',  period:'1250–1517 CE',
    desc_en:'Egypt and Syria sultanate. Copper fulus among the most varied medieval Islamic coins.',
    desc_ar:'سلطنة مصر والشام. فلوسهم النحاسية من أكثر العملات الإسلامية الوسيطة تنوعاً.',
    dynMatch:['المماليك','Mamluk Sultanate','مملوك'] },

  { key:'hafsid',        label_en:'Hafsid Dynasty',          label_ar:'الحفصيون',
    icon:'🏛️',  period:'1228–1574 CE',
    desc_en:'Almohad successors in Tunisia. Gold and silver coins of Maghrebi civilisation.',
    desc_ar:'خلفاء الموحدين في تونس. عملاتهم الذهبية والفضية نموذج للحضارة المغاربية.',
    dynMatch:['الحفصيون','Hafsid','حفصي'] },

  { key:'merinid',       label_en:'Merinid Dynasty',         label_ar:'المرينيون',
    icon:'🦁',  period:'1196–1465 CE',
    desc_en:'Berber dynasty of Morocco. Gold dinars among the finest Maghrebi coins.',
    desc_ar:'سلالة بربرية حكمت المغرب. دنانيرهم الذهبية من أجمل المغاربية.',
    dynMatch:['المرينيون','Merinid','مريني'] },

  { key:'almoravid',     label_en:'Almoravid Dynasty',       label_ar:'المرابطون',
    icon:'☪️',  period:'1056–1147 CE',
    desc_en:'Unified Morocco and al-Andalus. Gold dinars are benchmarks of Kufic epigraphy.',
    desc_ar:'وحّدوا المغرب والأندلس. دنانيرهم الذهبية مرجع في النقائش الكوفية.',
    dynMatch:['المرابطون','Almoravid','مرابط'] },

  { key:'almohad',       label_en:'Almohad Dynasty',         label_ar:'الموحدون',
    icon:'🌙',  period:'1130–1269 CE',
    desc_en:'Greatest Islamic empire in the west. Distinctive square coins unique in numismatic history.',
    desc_ar:'أعظم إمبراطورية إسلامية في الغرب. عملاتهم المربعة ابتكار لا مثيل له.',
    dynMatch:['الموحدون','Almohad','موحدي'] },

  { key:'east_africa',   label_en:'East African Sultanates', label_ar:'سلطنات شرق أفريقيا',
    icon:'🌊',  period:'4th–14th C. AH',
    desc_en:'Coastal sultanates: Kilwa, Mombasa, Zanzibar. Copper coins of Swahili Islamic civilisation.',
    desc_ar:'سلطنات الساحل: كلوة وممباسة وزنجبار. عملات نحاسية تعكس حضارة سواحيلية إسلامية.',
    dynMatch:['سلطنات شرق أفريقيا','East Africa','Kilwa'] },

  { key:'ilkhanid',     label_en:'Ilkhanid Dynasty',          label_ar:'الإيلخانيون',
    icon:'🏹',  period:'1256–1357 CE',
    desc_en:'Islamised Mongols of Persia and Iraq. High-quality Arabic coins struck in Baghdad and Tabriz.',
    desc_ar:'المغول الإسلاميون حكام فارس والعراق. عملات عربية رفيعة في بغداد وتبريز.',
    dynMatch:['الإيلخانيون','Ilkhanid','إيلخاني'] },

  { key:'samanid',      label_en:'Samanid Dynasty',           label_ar:'السامانيون',
    icon:'🌺',  period:'875–1005 CE',
    desc_en:'First independent Iranian dynasty post-Islam. Their silver dirhams are the most commonly found medieval Islamic coins.',
    desc_ar:'أول سلالة إيرانية مستقلة. دراهمهم الفضية الأكثر انتشاراً في عالم النمسماتيا الإسلامية الوسيطة.',
    dynMatch:['السامانيون','Samanid','ساماني'] },

  { key:'buyid',        label_en:'Buyid Dynasty',             label_ar:'البويهيون',
    icon:'⚜️',  period:'934–1055 CE',
    desc_en:'Shia Iranian dynasty that controlled Iraq and Persia, holding the Abbasid caliph as a figurehead.',
    desc_ar:'سلالة شيعية إيرانية أمسكت بزمام العراق وفارس مع إبقاء الخليفة العباسي شكلياً.',
    dynMatch:['البويهيون','Buyid','بويهي'] },

  { key:'pre_reform',   label_en:'Early Islamic (Pre-Reform)', label_ar:'الإسلام المبكر',
    icon:'🌙',  period:'636–697 CE',
    desc_en:'The earliest Islamic coins before Abd al-Malik\'s monetary reform of 77 AH. Blend Byzantine and Sasanian designs with Arabic inscriptions.',
    desc_ar:'أقدم العملات الإسلامية قبل إصلاح عبد الملك. تجمع بين التصاميم البيزنطية والساسانية والنقوش العربية.',
    dynMatch:['الإسلام المبكر','Early Islamic','Pre-Reform','Arab-Byzantine','Arab-Sasanian'] },
];

function getDynastyCoins(dyn: Dynasty): IslamicCoin[] {
  return ISLAMIC.filter(c =>
    (c.dyn && dyn.dynMatch.some(m => c.dyn.includes(m))) ||
    (c.name && dyn.dynMatch.some(m => c.name.toLowerCase().includes(m.toLowerCase())))
  ) as IslamicCoin[];
}

function CoinCard({ coin, locale }: { coin: IslamicCoin; locale: string }) {
  const isAr  = locale === 'ar';
  const name  = isAr && coin.nar ? coin.nar : coin.name;
  const metal = isAr ? (METAL_AR[coin.metal] ?? coin.metal) : coin.metal;
  return (
    <Link href={`/${locale}/catalogue/${coin.id}`}
      className="group flex flex-col bg-white rounded-xl border border-amber-100 hover:border-amber-300 overflow-hidden transition-all hover:shadow-md">
      {coin.o ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coin.o} alt={name}
          className="w-full h-28 object-contain bg-amber-50 group-hover:scale-105 transition-transform p-1"
          style={{ borderBottom:'1px solid #F0E8D4' }} />
      ) : (
        <div className="w-full h-28 bg-amber-50 flex items-center justify-center text-3xl">🪙</div>
      )}
      <div className="p-2.5">
        <div className="text-[11px] font-amiri text-amber-900 leading-tight line-clamp-2 mb-1">{name}</div>
        {coin.ruler && <div className="text-[9px] text-amber-600 truncate mb-0.5">{coin.ruler}</div>}
        <div className="flex items-center gap-1 flex-wrap">
          {coin.yce && <span className="text-[9px] text-amber-600">{coin.yce}</span>}
          {coin.yah && <span className="text-[9px] text-amber-500">{coin.yah}هـ</span>}
          {coin.denomination && (
            <span className="text-[9px] text-amber-700 border border-amber-300 rounded px-1 font-medium">
              {isAr ? {Dirham:'درهم',Dinar:'دينار',Fals:'فلس',Fils:'فلس',Other:'أخرى'}[coin.denomination] ?? coin.denomination : coin.denomination}
            </span>
          )}
          {metal && <span className="text-[9px] text-amber-500 border border-amber-200 rounded px-1">{metal}</span>}
        </div>
      </div>
    </Link>
  );
}

const PER_PAGE = 48;

export default function IslamicPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';

  const [activeDynasty,  setActiveDynasty]  = useState<string | null>(null);
  const [query,          setQuery]          = useState('');
  const [metal,          setMetal]          = useState('');
  const [denomination,   setDenomination]   = useState('');
  const [ruler,          setRuler]          = useState('');
  const [mint,           setMint]           = useState('');
  const [page,           setPage]           = useState(1);

  const metals = useMemo(() =>
    Array.from(new Set(ISLAMIC.map(c => c.metal).filter(Boolean))).sort(), []);

  const rulers = useMemo(() => {
    const coins = ISLAMIC as IslamicCoin[];
    return Array.from(new Set(coins.map(c => c.ruler).filter(Boolean))).sort() as string[];
  }, []);

  const mints = useMemo(() => {
    const coins = ISLAMIC as IslamicCoin[];
    return Array.from(new Set(coins.map(c => c.mint).filter(Boolean))).sort() as string[];
  }, []);

  const filtered = useMemo(() => {
    let coins = ISLAMIC as IslamicCoin[];
    if (activeDynasty) {
      const dyn = DYNASTIES.find(d => d.key === activeDynasty);
      if (dyn) coins = getDynastyCoins(dyn);
    }
    if (metal)       coins = coins.filter(c => c.metal === metal);
    if (denomination) coins = coins.filter(c => c.denomination === denomination);
    if (ruler)       coins = coins.filter(c => c.ruler === ruler);
    if (mint)        coins = coins.filter(c => c.mint === mint);
    if (query.trim()) {
      const q = query.toLowerCase();
      coins = coins.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.nar?.includes(q) ||
        (c as IslamicCoin).ruler?.toLowerCase().includes(q) ||
        (c as IslamicCoin).mint?.toLowerCase().includes(q)
      );
    }
    return coins;
  }, [activeDynasty, metal, denomination, ruler, mint, query]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilter = !!(activeDynasty || metal || denomination || ruler || mint || query);

  const jsonLd = {
    '@context':'https://schema.org', '@type':'CollectionPage',
    name: isAr ? 'العملات الإسلامية — أرابيزماتيكا' : 'Islamic Coins — Arabismatica',
    description: isAr
      ? `قاعدة بيانات تضم ${ISLAMIC.length.toLocaleString('ar-EG')} عملة إسلامية من 18 سلالة`
      : `Database of ${ISLAMIC.length.toLocaleString()} Islamic coins from 18 dynasties`,
    numberOfItems: ISLAMIC.length,
    url: `https://arabismatica.arabcollector.com/${locale}/islamic`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen" style={{ background:'var(--parch, #FAF6EE)' }} dir={isAr ? 'rtl' : 'ltr'}>

        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg, #0a0602 0%, #1a0e05 60%, #2a1a08 100%)' }}>
          <div className="max-w-[960px] mx-auto px-4 py-10">
            <nav className="flex items-center gap-1.5 text-[12px] text-amber-700/60 mb-4">
              <Link href={`/${locale}`} className="hover:text-amber-400 transition-colors">
                {isAr ? 'أرابيزماتيكا' : 'Arabismatica'}
              </Link>
              <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
              <span className="text-amber-400">{isAr ? 'العملات الإسلامية' : 'Islamic Coins'}</span>
            </nav>
            <div className="flex items-start gap-4 mb-6">
              <span className="text-5xl">☪️</span>
              <div>
                <h1 className="font-amiri text-3xl text-amber-100 mb-1">
                  {isAr ? 'العملات الإسلامية' : 'Islamic Coins'}
                </h1>
                <p className="text-[13px] text-amber-300/70 leading-relaxed max-w-xl">
                  {isAr
                    ? `${ISLAMIC.length.toLocaleString('ar-EG')} عملة من ${DYNASTIES.length} سلالة وخلافة إسلامية — من الأموية إلى المماليك ومن قرطبة إلى القاهرة.`
                    : `${ISLAMIC.length.toLocaleString()} coins from ${DYNASTIES.length} Islamic dynasties and caliphates — from the Umayyads to the Mamluks, from Córdoba to Cairo.`}
                </p>
                {/* Denomination breakdown */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {(['Dinar','Dirham','Fals','Fils'] as const).map(d => {
                    const count = (ISLAMIC as IslamicCoin[]).filter(c => c.denomination === d).length;
                    if (!count) return null;
                    const arLabel = {Dinar:'دينار',Dirham:'درهم',Fals:'فلس',Fils:'فلس'}[d];
                    return (
                      <button key={d} onClick={() => { setDenomination(denomination === d ? '' : d); setPage(1); }}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all
                          ${denomination === d ? 'bg-amber-700 border-amber-600 text-amber-100' : 'border-amber-700/40 text-amber-400 hover:border-amber-500'}`}>
                        {isAr ? arLabel : d} <span className="opacity-60">({count.toLocaleString()})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynasty cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {DYNASTIES.map(dyn => {
                const count  = getDynastyCoins(dyn).length;
                const active = activeDynasty === dyn.key;
                return (
                  <button key={dyn.key}
                    onClick={() => { setActiveDynasty(active ? null : dyn.key); setPage(1); }}
                    className={`text-start p-2.5 rounded-xl border transition-all
                      ${count === 0 ? 'opacity-30 cursor-default border-amber-900/20' :
                        active ? 'border-amber-500 bg-amber-900/50' : 'border-amber-800/30 hover:border-amber-600/50 bg-white/5'}`}>
                    <div className="text-lg mb-0.5">{dyn.icon}</div>
                    <div className="text-[10px] font-semibold text-amber-200 leading-tight">
                      {isAr ? dyn.label_ar : dyn.label_en}
                    </div>
                    <div className="text-[8px] text-amber-600/60 mt-0.5">{dyn.period}</div>
                    <div className="text-[10px] font-bold text-amber-400 mt-0.5">
                      {count > 0 ? count.toLocaleString() + (isAr ? ' عملة' : '') : (isAr ? 'قريباً' : 'Soon')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active dynasty info */}
        {activeDynasty && (() => {
          const dyn = DYNASTIES.find(d => d.key === activeDynasty);
          if (!dyn) return null;
          return (
            <div className="bg-amber-950/20 border-b border-amber-200/20 px-4 py-3">
              <div className="max-w-[960px] mx-auto flex items-start gap-3">
                <span className="text-2xl shrink-0">{dyn.icon}</span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-amber-900 mb-0.5">
                    {isAr ? dyn.label_ar : dyn.label_en}
                    <span className="text-[10px] font-normal text-amber-600/60 ml-2">{dyn.period}</span>
                  </div>
                  <p className="text-[12px] text-amber-800/80 leading-relaxed">
                    {isAr ? dyn.desc_ar : dyn.desc_en}
                  </p>
                </div>
                <button onClick={() => { setActiveDynasty(null); setPage(1); }}
                  className="shrink-0 text-[10px] text-amber-600 hover:text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">✕</button>
              </div>
            </div>
          );
        })()}

        {/* Filters */}
        <div className="max-w-[960px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-3 text-amber-400" />
              <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}
                placeholder={isAr ? 'اسم، حاكم، دار ضرب...' : 'Name, ruler, mint...'}
                className="w-full text-[12px] ps-8 pe-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400" />
            </div>
            {/* Metal */}
            <select value={metal} onChange={e => { setMetal(e.target.value); setPage(1); }}
              className="text-[12px] px-2.5 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400">
              <option value="">{isAr ? 'كل المعادن' : 'All metals'}</option>
              {metals.map(m => <option key={m} value={m}>{isAr ? (METAL_AR[m]??m) : m}</option>)}
            </select>
            {/* Ruler */}
            {rulers.length > 0 && (
              <select value={ruler} onChange={e => { setRuler(e.target.value); setPage(1); }}
                className="text-[12px] px-2.5 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400 max-w-[160px]">
                <option value="">{isAr ? 'كل الحكام' : 'All rulers'} ({rulers.length})</option>
                {rulers.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
            {/* Mint */}
            {mints.length > 0 && (
              <select value={mint} onChange={e => { setMint(e.target.value); setPage(1); }}
                className="text-[12px] px-2.5 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400 max-w-[160px]">
                <option value="">{isAr ? 'كل دور الضرب' : 'All mints'} ({mints.length})</option>
                {mints.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {/* Result count */}
            <div className="text-[12px] text-amber-600/60 shrink-0">
              {filtered.length.toLocaleString()} {isAr ? 'عملة' : 'coins'}
            </div>
            {/* Clear */}
            {hasFilter && (
              <button onClick={() => { setActiveDynasty(null); setMetal(''); setDenomination(''); setRuler(''); setMint(''); setQuery(''); setPage(1); }}
                className="text-[11px] text-amber-600 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-amber-50">
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {paged.map(coin => <CoinCard key={coin.id} coin={coin} locale={locale} />)}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-amber-600/60 text-[13px]">
              {isAr ? 'لا توجد نتائج' : 'No coins found'}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => { setPage(p => Math.max(1,p-1)); window.scrollTo({top:400,behavior:'smooth'}); }}
                disabled={page===1}
                className="text-[12px] px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 disabled:opacity-30 hover:bg-amber-50">
                {isAr ? '→' : '←'}
              </button>
              <span className="text-[12px] text-amber-600/60">{page} / {totalPages}</span>
              <button onClick={() => { setPage(p => Math.min(totalPages,p+1)); window.scrollTo({top:400,behavior:'smooth'}); }}
                disabled={page===totalPages}
                className="text-[12px] px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 disabled:opacity-30 hover:bg-amber-50">
                {isAr ? '←' : '→'}
              </button>
            </div>
          )}

          {/* Back */}
          <div className="mt-8 pt-6 border-t border-amber-100">
            <Link href={`/${locale}`}
              className="inline-flex items-center gap-2 text-[13px] px-5 py-2.5 rounded-full bg-[#1a0e05] text-amber-300 hover:bg-[#2a1a08] transition-colors">
              <ArrowRight size={14} className={isAr ? '' : 'rotate-180'} />
              {isAr ? 'العودة إلى الكتالوج الكامل' : 'Back to full catalogue'}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
