// v5.0 — academic catalogue landing page
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import { supabase } from '@/lib/supabase';

type CardEntry = {
  id: string;
  titleAr: string; titleEn: string; titleDe: string;
  subtitleAr: string; subtitleEn: string; subtitleDe: string;
  href: string;
  status: 'active' | 'coming_soon';
};

const ARAB_WORLD_CARDS: CardEntry[] = [
  {
    id: 'arab',
    titleAr: 'العملات العربية الحديثة', titleEn: 'Modern Arab Coins', titleDe: 'Moderne arabische Münzen',
    subtitleAr: '5,505 عملة · 20 دولة · 1500–2026م', subtitleEn: '5,505 coins · 20 countries · 1500–2026 CE', subtitleDe: '5.505 Münzen · 20 Länder · 1500–2026 n. Chr.',
    href: '/catalogue', status: 'active',
  },
  {
    id: 'islamic',
    titleAr: 'العملات الإسلامية', titleEn: 'Islamic Coins', titleDe: 'Islamische Münzen',
    subtitleAr: '47,303 عملة · 18 سلالة · 41–922هـ', subtitleEn: '47,303 coins · 18 dynasties · 41–922 AH', subtitleDe: '47.303 Münzen · 18 Dynastien · 41–922 AH',
    href: '/islamic', status: 'active',
  },
];

const ANCIENT_CARDS: CardEntry[] = [
  {
    id: 'sasanian',
    titleAr: 'العملات الساسانية', titleEn: 'Sasanian Coins', titleDe: 'Sassanidische Münzen',
    subtitleAr: '7,995 عملة · 224–651م · فارس والعراق', subtitleEn: '7,995 coins · 224–651 CE · Persia & Iraq', subtitleDe: '7.995 Münzen · 224–651 n.Chr.',
    href: '/sasanian', status: 'active',
  },
  {
    id: 'nabataean',
    titleAr: 'العملات النبطية', titleEn: 'Nabataean Coins', titleDe: 'Nabatäische Münzen',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'byzantine',
    titleAr: 'العملات البيزنطية العربية', titleEn: 'Byzantine Arab Coins', titleDe: 'Byzantinisch-arabische Münzen',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'ptolemaic',
    titleAr: 'العملات البطلمية', titleEn: 'Ptolemaic Coins', titleDe: 'Ptolemäische Münzen',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'crusader',
    titleAr: 'عملات الحروب الصليبية', titleEn: 'Crusader Coins', titleDe: 'Kreuzfahrermünzen',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'achaemenid',
    titleAr: 'العملات الأخمينية', titleEn: 'Achaemenid Coins', titleDe: 'Achämenidische Münzen',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
];

const INDIAN_ISLAMIC_CARDS: CardEntry[] = [
  {
    id: 'mughal',
    titleAr: 'العملات المغولية', titleEn: 'Mughal Coins', titleDe: 'Mogulmünzen',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
  {
    id: 'delhi',
    titleAr: 'سلطنة دلهي', titleEn: 'Delhi Sultanate', titleDe: 'Delhi-Sultanat',
    subtitleAr: 'قريباً', subtitleEn: 'Coming soon', subtitleDe: 'Demnächst',
    href: '', status: 'coming_soon',
  },
];

const STATS = [
  { numAr: '٦٠٬٨٠٣', numEn: '60,803', numDe: '60.803',         labelAr: 'عملة مفهرسة',    labelEn: 'coins indexed',          labelDe: 'Münzen indexiert' },
  { numAr: '٢٠+',     numEn: '20+',    numDe: '20+',            labelAr: 'دولة وإمارة',   labelEn: 'countries & states',     labelDe: 'Länder & Staaten' },
  { numAr: '١٨',      numEn: '18',     numDe: '18',             labelAr: 'سلالة وخلافة',  labelEn: 'dynasties & caliphates', labelDe: 'Dynastien & Kalifate' },
  { numAr: '٦٦١م–اليوم', numEn: '661 CE–today', numDe: '661 n.Chr.–h.', labelAr: 'النطاق الزمني', labelEn: 'time span', labelDe: 'Zeitraum' },
];

const CATALOGUE_GROUPS = [
  {
    idAr: 'العالم العربي', idEn: 'Arab World', idDe: 'Arabische Welt',
    cards: ARAB_WORLD_CARDS,
  },
  {
    idAr: 'الشرق الأوسط القديم', idEn: 'Ancient Middle East', idDe: 'Alter Naher Osten',
    cards: ANCIENT_CARDS,
  },
  {
    idAr: 'الإسلام الهندي', idEn: 'Islamic India', idDe: 'Islamisches Indien',
    cards: INDIAN_ISLAMIC_CARDS,
  },
];

function CatalogueCard({ card, locale, isAr, isDe }: {
  card: CardEntry; locale: string; isAr: boolean; isDe: boolean;
}) {
  const isActive = card.status === 'active';
  const title    = isAr ? card.titleAr    : isDe ? card.titleDe    : card.titleEn;
  const subtitle = isAr ? card.subtitleAr : isDe ? card.subtitleDe : card.subtitleEn;
  const browseLabel = isAr ? '← تصفح' : isDe ? 'Ansehen →' : 'Browse →';
  const comingSoon  = isAr ? 'قريباً'  : isDe ? 'Demnächst' : 'Coming Soon';

  const inner = (
    <div className={`relative rounded-lg border h-full transition-all duration-200 p-4 ${
      isActive
        ? 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
        : 'bg-amber-50/40 border-dashed border-amber-200/50 cursor-default'
    }`}>
      {!isActive && (
        <span className="absolute top-2 end-2 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-500 font-medium">
          {comingSoon}
        </span>
      )}
      <div className={`font-amiri text-[14px] leading-snug mb-1 ${isActive ? 'text-amber-900' : 'text-amber-400'}`}>
        {title}
      </div>
      <div className={`text-[10px] leading-relaxed ${isActive ? 'text-amber-700/60' : 'text-amber-300'}`}>
        {subtitle}
      </div>
      {isActive && (
        <div className="mt-3 text-[10px] text-amber-600 font-medium">{browseLabel}</div>
      )}
    </div>
  );

  if (isActive && card.href) {
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

  return (
    <main className="min-h-screen bg-[#FAF6EE]" dir={isAr ? 'rtl' : 'ltr'}>
      <SiteHeader locale={locale} />

      {/* ── MASTHEAD ────────────────────────────────────────────────────── */}
      <div className="border-b border-amber-200/60" style={{ background: '#FAF6EE' }}>
        <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-10">
          <div className="max-w-2xl">
            <p className="text-[10px] tracking-[0.2em] uppercase text-amber-600/70 font-medium mb-2">
              {t('الموسوعة الرقمية للعملات', 'Digital Encyclopaedia of Coins', 'Digitale Münzenzyklopädie')}
            </p>
            <h1 className="font-amiri text-3xl md:text-4xl text-amber-950 leading-tight mb-2">
              Arabismatica <span className="text-amber-400 font-normal">·</span> <span>أرابيزماتيكا</span>
            </h1>
            <p className="text-[13px] text-amber-800/70 max-w-lg">
              {t(
                'استكشف عملات العالم العربي والتاريخ الإسلامي والشرق الأوسط القديم',
                'Explore coins from across the Arab world, Islamic history, and the ancient Middle East',
                'Erkunde Münzen aus der arabischen Welt, der islamischen Geschichte und dem alten Nahen Osten'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ───────────────────────────────────────────────────── */}
      <div className="border-b border-amber-200/40 bg-amber-50/60">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-amber-200/40 rtl:divide-x-reverse">
            {STATS.map((s, i) => (
              <div key={i} className="px-4 py-5 text-center">
                <div className="font-amiri text-2xl md:text-3xl text-amber-800 font-bold">
                  {isAr ? s.numAr : isDe ? s.numDe : s.numEn}
                </div>
                <div className="text-[10px] text-amber-600/70 mt-0.5 uppercase tracking-wide">
                  {isAr ? s.labelAr : isDe ? s.labelDe : s.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATALOGUE INDEX ─────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 py-10">
        <h2 className="font-amiri text-[11px] tracking-[0.15em] uppercase text-amber-600/70 mb-6">
          {t('الكتالوجات', 'Catalogues', 'Kataloge')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CATALOGUE_GROUPS.map(g => (
            <div key={g.idEn}>
              <h3 className="font-amiri text-[13px] text-amber-900 font-semibold mb-3 pb-1.5 border-b border-amber-200/60">
                {isAr ? g.idAr : isDe ? g.idDe : g.idEn}
              </h3>
              <div className="flex flex-col gap-2">
                {g.cards.map(card => (
                  <CatalogueCard key={card.id} card={card} locale={locale} isAr={isAr} isDe={isDe} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LATEST / COIN OF THE DAY ─────────────────────────────────────── */}
      {coinOfDay && (
        <div className="border-t border-amber-200/40 bg-amber-50/40">
          <div className="max-w-[1440px] mx-auto px-4 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-amber-600/60 uppercase tracking-widest font-medium shrink-0 flex items-center gap-1">
                <CalendarDays size={10} />
                {isAr ? 'عملة اليوم' : isDe ? 'Münze des Tages' : 'Coin of the Day'}
              </span>
              {coinOfDay.o && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coinOfDay.o} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-200 shrink-0" />
              )}
              <span className="font-amiri text-amber-900 text-[14px]">
                {isAr ? (coinOfDay.nar || coinOfDay.name) : coinOfDay.name}
              </span>
              {coinOfDay.yce && (
                <span className="text-[11px] text-amber-600/50 hidden sm:block">
                  {coinOfDay.yce} · {isAr ? coinOfDay.co_ar : coinOfDay.co}
                </span>
              )}
              <Link href={`/${locale}/catalogue/${coinOfDay.id}`}
                className="ms-auto text-[11px] text-amber-700 hover:text-amber-900 border border-amber-300 rounded-full px-3 py-1 transition-colors shrink-0">
                {isAr ? 'عرض ←' : isDe ? 'Ansehen →' : 'View →'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-amber-200/40 bg-amber-900">
        <div className="max-w-[1440px] mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <div className="font-amiri text-lg text-amber-100 mb-1">Arabismatica · أرابيزماتيكا</div>
              <div className="text-[11px] text-amber-300/70">
                {t(
                  'مبادرة شبكة المقتني العربي',
                  'An initiative of The Arab Collector Network',
                  'Eine Initiative des Arabischen Sammler-Netzwerks'
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-amber-400/80">
              <Link href={`/${locale}/catalogue`} className="hover:text-amber-200 transition-colors">
                {t('العملات العربية', 'Arab Coins', 'Arabische Münzen')}
              </Link>
              <Link href={`/${locale}/islamic`} className="hover:text-amber-200 transition-colors">
                {t('العملات الإسلامية', 'Islamic Coins', 'Islamische Münzen')}
              </Link>
              <Link href={`/${locale}/sasanian`} className="hover:text-amber-200 transition-colors">
                {t('العملات الساسانية', 'Sasanian Coins', 'Sassanidische Münzen')}
              </Link>
              <a href="https://arabcollector.com" target="_blank" rel="noopener"
                className="hover:text-amber-200 transition-colors">
                arabcollector.com →
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
