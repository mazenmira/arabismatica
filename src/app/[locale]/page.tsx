// v10.0 — 9-group academic catalogue structure
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import { supabase } from '@/lib/supabase';
import { ACADEMIC_GROUPS, ISLAMIC_DYNASTY_CHIPS } from '@/lib/catalogues';
import type { AcademicGroup, CatalogueChip } from '@/lib/catalogues';

const HERO_IMG = 'https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-Hero.jpg';

const HERO_STATS = [
  { numAr: '٧١٬٨٣٦', numEn: '71,836', numDe: '71.836',  labelAr: 'عملة مفهرسة',    labelEn: 'coins indexed',     labelDe: 'Münzen' },
  { numAr: '٥',        numEn: '5',      numDe: '5',       labelAr: 'كتالوجات نشطة', labelEn: 'active catalogues',  labelDe: 'Kataloge' },
  { numAr: '٢٠+',     numEn: '20+',   numDe: '20+',     labelAr: 'دولة وإمارة',   labelEn: 'countries',          labelDe: 'Länder' },
];

type LiveCounts = Record<string, number>;

// ── Live Chip ──────────────────────────────────────────────────────────────────
function LiveChip({ chip, locale, isAr, counts }: {
  chip: CatalogueChip; locale: string; isAr: boolean; counts: LiveCounts;
}) {
  const label = isAr ? chip.title_ar : chip.title_en;
  const count = chip.countKey ? counts[chip.countKey] : undefined;

  if (chip.status === 'coming_soon') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-dashed border-gray-200 text-gray-400 text-[11px] italic cursor-default select-none">
        {label}
      </span>
    );
  }

  // active
  return (
    <Link href={`/${locale}${chip.href}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-medium hover:bg-emerald-100 hover:border-emerald-400 transition-colors">
      {label}
      {count != null && (
        <span className="text-[10px] text-emerald-600 font-normal tabular-nums">
          · {count.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
        </span>
      )}
    </Link>
  );
}

// ── Islamic special rendering ──────────────────────────────────────────────────
function IslamicBlock({ locale, isAr, counts, dedicatedChips }: {
  locale: string; isAr: boolean; counts: LiveCounts; dedicatedChips: CatalogueChip[];
}) {
  const dyLabel  = isAr ? 'تصفح حسب السلالة' : 'Browse by dynasty';
  const dedLabel = isAr ? 'كتالوجات مخصصة'   : 'Dedicated catalogues';

  return (
    <div className="space-y-3">
      {/* Dynasty row */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">{dyLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {ISLAMIC_DYNASTY_CHIPS.map(d => (
            <Link key={d.dynasty}
              href={`/${locale}/islamic?dynasty=${encodeURIComponent(d.dynasty)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-[11px] hover:bg-amber-100 hover:border-amber-400 transition-colors">
              {isAr ? d.label_ar : d.label_en}
              <span className="text-[10px] text-amber-600 tabular-nums">· {d.count.toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
            </Link>
          ))}
          <Link href={`/${locale}/islamic`}
            className="inline-flex items-center px-2.5 py-1 rounded-full border border-amber-400 bg-amber-100 text-amber-800 text-[11px] font-semibold hover:bg-amber-200 transition-colors">
            {isAr ? 'عرض الكل ←' : 'View all →'}
          </Link>
        </div>
      </div>
      {/* Dedicated catalogues row */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">{dedLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {dedicatedChips.map(chip => (
            <LiveChip key={chip.id} chip={chip} locale={locale} isAr={isAr} counts={counts} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Group Card ─────────────────────────────────────────────────────────────────
function GroupCard({ group, locale, isAr, counts }: {
  group: AcademicGroup; locale: string; isAr: boolean; counts: LiveCounts;
}) {
  const title = isAr ? group.title_ar : group.title_en;
  const desc  = isAr ? group.desc_ar  : group.desc_en;

  const borderClass = group.ottoman
    ? 'border border-blue-200 bg-blue-50/30'
    : 'border border-gray-200 bg-white';

  const isIslamicGroup = group.id === 'islamic_dynasties';

  // For the islamic group, split chips: the one with special='islamic_dynasties' vs the rest (dedicated)
  const islamicMain      = group.catalogues.find(c => c.special === 'islamic_dynasties');
  const dedicatedChips   = group.catalogues.filter(c => c.special !== 'islamic_dynasties');

  return (
    <div className={`rounded-xl ${borderClass} p-5 md:p-6`}>
      {group.ottoman && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 border border-blue-300 rounded-full px-2.5 py-0.5">
            {isAr ? 'الكتالوج القادم' : 'Next Major Catalogue'}
          </span>
          <span className="text-[11px] text-blue-400">
            {isAr ? '50,000+ عملة في الإعداد' : '50,000+ coins in preparation'}
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Left: group meta */}
        <div className="md:w-56 shrink-0 mb-4 md:mb-0">
          <span className="text-[11px] font-mono text-gray-300 select-none">
            {String(group.num).padStart(2, '0')}
          </span>
          <h3 className={`font-amiri text-[18px] leading-snug font-semibold mt-0.5 mb-1 ${
            group.ottoman ? 'text-blue-800' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          {group.period && (
            <p className="text-[11px] text-gray-400 mb-2">{group.period}</p>
          )}
          <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
        </div>

        {/* Right: chips */}
        <div className="flex-1">
          {isIslamicGroup && islamicMain ? (
            <IslamicBlock
              locale={locale} isAr={isAr} counts={counts}
              dedicatedChips={dedicatedChips}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {group.catalogues.map(chip => (
                <LiveChip key={chip.id} chip={chip} locale={locale} isAr={isAr} counts={counts} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';

  const [coinOfDay, setCoinOfDay] = useState<{
    id: string; name: string; nar?: string; yce?: string;
    o?: string; cc?: string; co?: string; co_ar?: string;
  } | null>(null);

  const [liveCounts, setLiveCounts] = useState<LiveCounts>({});

  // Fetch coin of the day
  useEffect(() => {
    const today = new Date();
    const seed   = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const offset = seed % 71836;
    supabase.from('coins').select('id,name,nar,yce,o,cc,co,co_ar').range(offset, offset)
      .then(({ data }) => { if (data && data.length > 0) setCoinOfDay(data[0] as typeof coinOfDay); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch live counts for all active catalogues
  useEffect(() => {
    const fetchCounts = async () => {
      const [arab, IS, MG, DS, SS] = await Promise.all([
        supabase.from('coins').select('id', { count: 'exact', head: true }).not('cc', 'in', '(IS,SS,MG,DS)'),
        supabase.from('coins').select('id', { count: 'exact', head: true }).eq('cc', 'IS'),
        supabase.from('coins').select('id', { count: 'exact', head: true }).eq('cc', 'MG'),
        supabase.from('coins').select('id', { count: 'exact', head: true }).eq('cc', 'DS'),
        supabase.from('coins').select('id', { count: 'exact', head: true }).eq('cc', 'SS'),
      ]);
      setLiveCounts({
        arab: arab.count ?? 0,
        IS:   IS.count   ?? 0,
        MG:   MG.count   ?? 0,
        DS:   DS.count   ?? 0,
        SS:   SS.count   ?? 0,
      });
    };
    fetchCounts().catch(console.error);
  }, []);

  const t = (ar: string, en: string, de: string) => isAr ? ar : isDe ? de : en;

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
      <div className="catalogue-section bg-white">
        <div className="max-w-[1440px] mx-auto px-4 py-10">
          <h2 className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-7 pb-2 border-b border-gray-200">
            {t('الكتالوجات الأكاديمية', 'Academic Catalogues', 'Akademische Kataloge')}
          </h2>

          <div className="space-y-4">
            {ACADEMIC_GROUPS.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                locale={locale}
                isAr={isAr}
                counts={liveCounts}
              />
            ))}
          </div>
        </div>
      </div>

    </main>
  );
}
