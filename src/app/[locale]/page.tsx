// v9.0 — light/dark mode catalogue section with Tailwind dark: variants
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import { supabase } from '@/lib/supabase';

const HERO_IMG = 'https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-Hero.jpg';

type CardStatus = 'active' | 'scraping' | 'coming_soon';

type CardEntry = {
  id: string;
  titleAr: string; titleEn: string; titleDe: string;
  subtitleAr: string; subtitleEn: string; subtitleDe: string;
  href: string;
  status: CardStatus;
  noteAr?: string; noteEn?: string;
};

const ARAB_ISLAMIC_CARDS: CardEntry[] = [
  {
    id: 'arab',
    titleAr: 'العملات العربية الحديثة', titleEn: 'Modern Arab Coins', titleDe: 'Moderne arabische Münzen',
    subtitleAr: '5,505 عملة · 20 دولة · 1500–2026م', subtitleEn: '5,505 coins · 20 countries · 1500–2026 CE', subtitleDe: '5.505 Münzen · 20 Länder · 1500–2026 n. Chr.',
    href: '/catalogue', status: 'active',
  },
  {
    id: 'islamic',
    titleAr: 'العملات الإسلامية', titleEn: 'Islamic Dynastic Coins', titleDe: 'Islamische Dynastiemünzen',
    subtitleAr: '47,303 عملة · 18 سلالة · 41–922هـ', subtitleEn: '47,303 coins · 18 dynasties · 41–922 AH', subtitleDe: '47.303 Münzen · 18 Dynastien · 41–922 AH',
    href: '/islamic', status: 'active',
  },
  {
    id: 'mughal',
    titleAr: 'الإمبراطورية المغولية', titleEn: 'Mughal Empire', titleDe: 'Mogulreich',
    subtitleAr: '1526–1857م · الهند الإسلامية', subtitleEn: '1526–1857 CE · Islamic India', subtitleDe: '1526–1857 n.Chr. · Islamisches Indien',
    noteAr: 'نقوش عربية إسلامية', noteEn: 'Arabic Islamic inscriptions',
    href: '/mughal', status: 'scraping',
  },
  {
    id: 'delhi',
    titleAr: 'سلطنة دلهي', titleEn: 'Delhi Sultanate', titleDe: 'Delhi-Sultanat',
    subtitleAr: '1206–1526م · الهند الإسلامية', subtitleEn: '1206–1526 CE · Islamic India', subtitleDe: '1206–1526 n.Chr. · Islamisches Indien',
    href: '/delhi', status: 'scraping',
  },
  {
    id: 'ottoman',
    titleAr: 'الدولة العثمانية', titleEn: 'Ottoman Empire', titleDe: 'Osmanisches Reich',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
];

const ANCIENT_CARDS: CardEntry[] = [
  {
    id: 'sasanian',
    titleAr: 'الإمبراطورية الساسانية', titleEn: 'Sasanian Empire', titleDe: 'Sassanidisches Reich',
    subtitleAr: '7,995 عملة · 224–651م · فارس والعراق', subtitleEn: '7,995 coins · 224–651 CE · Persia & Iraq', subtitleDe: '7.995 Münzen · 224–651 n.Chr.',
    href: '/sasanian', status: 'active',
  },
  {
    id: 'nabataean',
    titleAr: 'المملكة النبطية', titleEn: 'Nabataean Kingdom', titleDe: 'Nabatäerreich',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'byzantine',
    titleAr: 'الإمبراطورية البيزنطية', titleEn: 'Byzantine Empire', titleDe: 'Byzantinisches Reich',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'roman',
    titleAr: 'الإمبراطورية الرومانية', titleEn: 'Roman Empire', titleDe: 'Römisches Reich',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'ptolemaic',
    titleAr: 'المملكة البطلمية', titleEn: 'Ptolemaic Kingdom', titleDe: 'Ptolemäisches Reich',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'crusader',
    titleAr: 'الممالك الصليبية', titleEn: 'Crusader States', titleDe: 'Kreuzfahrerstaaten',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'achaemenid',
    titleAr: 'الإمبراطورية الأخمينية', titleEn: 'Achaemenid Persia', titleDe: 'Achämenidisches Persien',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'parthian',
    titleAr: 'الإمبراطورية الفرثية', titleEn: 'Parthian Empire', titleDe: 'Partherreich',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'seleucid',
    titleAr: 'الإمبراطورية السلوقية', titleEn: 'Seleucid Empire', titleDe: 'Seleukidenreich',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'phoenician',
    titleAr: 'المدن الفينيقية', titleEn: 'Phoenician Cities', titleDe: 'Phönizische Städte',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
];

const HERO_STATS = [
  { numAr: '٦٠٬٨٠٣', numEn: '60,803', numDe: '60.803',  labelAr: 'عملة مفهرسة',    labelEn: 'coins indexed',     labelDe: 'Münzen' },
  { numAr: '٣',        numEn: '3',      numDe: '3',       labelAr: 'كتالوجات نشطة', labelEn: 'active catalogues',  labelDe: 'Kataloge' },
  { numAr: '٢٠+',     numEn: '20+',   numDe: '20+',     labelAr: 'دولة وإمارة',   labelEn: 'countries',          labelDe: 'Länder' },
];

function CatalogueCard({ card, locale, isAr, isDe }: {
  card: CardEntry; locale: string; isAr: boolean; isDe: boolean;
}) {
  const isActive   = card.status === 'active';
  const isScraping = card.status === 'scraping';
  const title    = isAr ? card.titleAr    : isDe ? card.titleDe    : card.titleEn;
  const subtitle = isAr ? card.subtitleAr : isDe ? card.subtitleDe : card.subtitleEn;
  const note     = isAr ? card.noteAr     : card.noteEn;

  const browseLabel  = isAr ? '← تصفح' : isDe ? 'Ansehen →' : 'Browse →';
  const comingSoon   = isAr ? 'قريباً'  : isDe ? 'Demnächst' : 'Coming soon';
  const scrapingLabel = isAr ? 'في الإعداد · قريباً' : isDe ? 'In Vorbereitung · bald' : 'In preparation · launching soon';

  const inner = isActive || isScraping ? (
    <div className="relative rounded-xl border border-gray-200 dark:border-amber-700/35 h-full p-5 bg-gray-50 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.12] hover:border-amber-400 dark:hover:border-amber-500/60 hover:shadow-md transition-all duration-200 cursor-pointer">

      {isScraping && (
        <span className="absolute top-2 end-2 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700/40">
          {isAr ? 'في الإعداد' : 'Preparing'}
        </span>
      )}

      <div className={`font-amiri text-[15px] leading-snug mb-1 ${
        isActive ? 'text-gray-900 dark:text-amber-100' : 'text-gray-600 dark:text-amber-200/70'
      }`}>
        {title}
      </div>
      <div className={`text-[12px] mb-3 ${
        isActive ? 'text-gray-500 dark:text-amber-300/60' : 'text-gray-400 dark:text-amber-300/40'
      }`}>
        {subtitle}
      </div>
      {note && (
        <div className="text-[10px] italic text-amber-600/70 dark:text-amber-500/60 mb-2">{note}</div>
      )}
      {isActive && (
        <div className="text-[13px] text-amber-700 dark:text-amber-400 hover:text-amber-600 font-medium">{browseLabel}</div>
      )}
      {isScraping && (
        <div className="text-[12px] text-gray-400 dark:text-amber-500/60 italic">{scrapingLabel}</div>
      )}
    </div>
  ) : (
    <div className="relative rounded-xl border border-dashed border-gray-200 dark:border-amber-900/20 h-full p-5 bg-gray-50 dark:bg-white/[0.04] opacity-60 cursor-not-allowed transition-all duration-200">
      <span className="absolute top-2 end-2 text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-transparent text-gray-400 dark:text-amber-700/50 border border-gray-200 dark:border-amber-900/30 font-medium">
        {comingSoon}
      </span>
      <div className="font-amiri text-[15px] leading-snug mb-1 text-gray-400 dark:text-amber-300/35">{title}</div>
      <div className="text-[12px] text-gray-300 dark:text-amber-300/20">{subtitle}</div>
    </div>
  );

  if ((isActive || isScraping) && card.href) {
    return <Link href={`/${locale}${card.href}`} className="block h-full">{inner}</Link>;
  }
  return <div>{inner}</div>;
}

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';

  const [coinOfDay, setCoinOfDay] = useState<{
    id: string; name: string; nar?: string; yce?: string;
    o?: string; cc?: string; co?: string; co_ar?: string;
  } | null>(null);

  useEffect(() => {
    const today = new Date();
    const seed   = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const offset = seed % 60803;
    supabase.from('coins').select('id,name,nar,yce,o,cc,co,co_ar').range(offset, offset)
      .then(({ data }) => { if (data && data.length > 0) setCoinOfDay(data[0] as typeof coinOfDay); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = (ar: string, en: string, de: string) => isAr ? ar : isDe ? de : en;

  const GROUPS = [
    {
      idAr: 'المنطقة العربية والإسلامية', idEn: 'Arab & Islamic World', idDe: 'Arabische & Islamische Welt',
      noteAr: 'تشمل العملات الإسلامية كل الحضارات التي حملت النقوش العربية',
      noteEn: 'Islamic coins crossed all geographic boundaries — united by Arabic inscriptions',
      noteDE: 'Islamische Münzen überschritten alle geografischen Grenzen — vereint durch arabische Inschriften',
      cards: ARAB_ISLAMIC_CARDS,
    },
    {
      idAr: 'الشرق الأدنى القديم', idEn: 'Ancient Near East', idDe: 'Alter Naher Osten',
      noteAr: '', noteEn: '', noteDE: '',
      cards: ANCIENT_CARDS,
    },
  ];

  return (
    <main className="min-h-screen bg-white" dir={isAr ? 'rtl' : 'ltr'}>
      <SiteHeader locale={locale} />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: '360px' }}>
        <Image
          src={HERO_IMG}
          alt="Arabismatica — coin photography"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,6,2,0.5) 0%, rgba(10,6,2,0.72) 55%, rgba(10,6,2,0.95) 100%)' }} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16">
          <p className="text-gold-400 text-[10px] tracking-[0.25em] uppercase mb-3 font-medium">
            {t('الموسوعة الرقمية للعملات', 'DIGITAL ENCYCLOPAEDIA OF COINS', 'DIGITALE MÜNZENZYKLOPÄDIE')}
          </p>
          <h1 className="font-amiri text-4xl md:text-5xl text-white leading-tight mb-1">
            Arabismatica
          </h1>
          <p className="font-amiri text-2xl md:text-3xl text-amber-300/80 mb-4">
            أرابيزماتيكا
          </p>
          <p className="text-amber-300/70 text-[13px] md:text-[15px] max-w-lg mb-8">
            {t(
              'استكشف عملات العالم العربي والتاريخ الإسلامي والشرق الأدنى القديم',
              'Explore coins from across the Arab world, Islamic history, and the ancient Near East',
              'Erkunde Münzen aus der arabischen Welt, der islamischen Geschichte und dem alten Nahen Osten'
            )}
          </p>

          {/* Hero stats */}
          <div className="flex items-center gap-8 md:gap-12 flex-wrap justify-center">
            {HERO_STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-amiri text-2xl md:text-3xl text-gold-400 font-bold">
                  {isAr ? s.numAr : isDe ? s.numDe : s.numEn}
                </div>
                <div className="text-[10px] text-amber-300/60 mt-0.5 uppercase tracking-wide">
                  {isAr ? s.labelAr : isDe ? s.labelDe : s.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COIN OF THE DAY ─────────────────────────────────────────────── */}
      {coinOfDay && (
        <div style={{ background: '#1a0e05', borderTop: '1px solid rgba(139,109,46,0.2)', borderBottom: '1px solid rgba(139,109,46,0.15)' }}>
          <div className="max-w-[1440px] mx-auto px-4 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-amber-200/60 uppercase tracking-widest font-medium shrink-0 flex items-center gap-1">
                <CalendarDays size={10} />
                {isAr ? 'عملة اليوم' : isDe ? 'Münze des Tages' : 'Coin of the Day'}
              </span>
              {coinOfDay.o && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coinOfDay.o} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-700/40 shrink-0" />
              )}
              <span className="font-amiri text-amber-200 text-[14px]">
                {isAr ? (coinOfDay.nar || coinOfDay.name) : coinOfDay.name}
              </span>
              {coinOfDay.yce && (
                <span className="text-[11px] text-amber-200/50 hidden sm:block">
                  {coinOfDay.yce} · {isAr ? coinOfDay.co_ar : coinOfDay.co}
                </span>
              )}
              <Link href={`/${locale}/catalogue/${coinOfDay.id}`}
                className="ms-auto text-[11px] text-amber-300 hover:text-amber-100 border border-amber-700/50 hover:border-amber-500 rounded-full px-3 py-1 transition-colors shrink-0">
                {isAr ? 'عرض ←' : isDe ? 'Ansehen →' : 'View →'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── CATALOGUE INDEX ─────────────────────────────────────────────── */}
      <div className="catalogue-section bg-white dark:bg-[#2d1f0e] transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto px-4 py-10">
          <h2 className="text-[11px] text-gray-400 dark:text-amber-300/50 uppercase tracking-widest font-medium mb-7 pb-2 border-b border-gray-200 dark:border-amber-900/30">
            {t('الكتالوجات', 'Catalogues', 'Kataloge')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {GROUPS.map(g => (
              <div key={g.idEn}>
                <div className="mb-4">
                  <h3 className="font-amiri text-[17px] font-semibold text-gray-900 dark:text-amber-100 mb-1">
                    {isAr ? g.idAr : isDe ? g.idDe : g.idEn}
                  </h3>
                  {(isAr ? g.noteAr : isDe ? g.noteDE : g.noteEn) && (
                    <p className="text-[12px] text-gray-500 dark:text-amber-300/50 italic mb-3">
                      {isAr ? g.noteAr : isDe ? g.noteDE : g.noteEn}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {g.cards.map(card => (
                    <CatalogueCard key={card.id} card={card} locale={locale} isAr={isAr} isDe={isDe} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </main>
  );
}
