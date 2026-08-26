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

const HERO_STATS_STATIC = [
  { numAr: '٥',    numEn: '5',   numDe: '5',   labelAr: 'كتالوجات نشطة', labelEn: 'active catalogues', labelDe: 'Kataloge' },
  { numAr: '٢٠+', numEn: '20+', numDe: '20+', labelAr: 'دولة وإمارة',   labelEn: 'countries',         labelDe: 'Länder' },
];

type LiveCounts = Record<string, number>;

const GROUP_BG: Record<string, string> = {
  modern_arab_states:  'bg-[#FDF8F0]',
  ottoman_empire:      'bg-[#F5F0E8]',
  islamic_dynasties:   'bg-[#F0EEE8]',
  pre_islamic_persia:  'bg-[#F2EDE4]',
  hellenistic_ancient: 'bg-[#EEF0E8]',
  rome_arab_world:     'bg-[#F0ECEC]',
  byzantine_crusader:  'bg-[#EAF0F0]',
  phoenician_levant:   'bg-[#F5F0E4]',
  reference_tools:     'bg-[#F0F0EE]',
};

// ── Live Chip ──────────────────────────────────────────────────────────────────
function LiveChip({ chip, locale, isAr, counts }: {
  chip: CatalogueChip; locale: string; isAr: boolean; counts: LiveCounts;
}) {
  const label = isAr ? chip.title_ar : chip.title_en;
  const count = chip.countKey ? counts[chip.countKey] : undefined;

  if (chip.status === 'coming_soon') {
    return (
      <span className="inline-flex items-center bg-white/50 border border-gray-200 text-gray-400 text-sm italic rounded-full px-4 py-1.5 cursor-default select-none">
        {label}
      </span>
    );
  }

  return (
    <Link href={`/${locale}${chip.href}`}
      className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-800 text-sm rounded-full px-4 py-1.5 font-medium hover:bg-emerald-50 transition-colors">
      {label}
      {count != null && (
        <span className="text-[12px] text-emerald-500 font-normal tabular-nums">
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
  const dyLabel  = isAr ? 'تصفح حسب السلالة' : 'BROWSE BY DYNASTY';
  const dedLabel = isAr ? 'كتالوجات مخصصة'   : 'DEDICATED CATALOGUES';
  const allLink  = isAr ? 'تصفح الكتالوج الإسلامي الكامل ←' : 'Browse full Islamic catalogue →';

  return (
    <div>
      {/* Dynasty chips */}
      <p className="text-xs font-semibold tracking-widest text-gray-400 mb-3">{dyLabel}</p>
      <div className="flex flex-wrap gap-2">
        {ISLAMIC_DYNASTY_CHIPS.map(d => (
          <Link key={d.dyn}
            href={`/${locale}/islamic?dynasty=${encodeURIComponent(d.dyn)}`}
            className="inline-flex items-center gap-1 bg-white border border-amber-300 text-amber-800 text-sm rounded-full px-4 py-1.5 hover:bg-amber-50 transition-colors">
            {isAr ? d.label_ar : d.label_en}
            <span className="text-[12px] text-amber-500 tabular-nums">· {d.count.toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
          </Link>
        ))}
      </div>
      <Link href={`/${locale}/islamic`}
        className="text-sm text-amber-700 hover:underline mt-3 block">
        {allLink}
      </Link>
      {/* Dedicated catalogues */}
      <p className="text-xs font-semibold tracking-widest text-gray-400 mb-3 mt-6">{dedLabel}</p>
      <div className="flex flex-wrap gap-2">
        {dedicatedChips.map(chip => (
          <LiveChip key={chip.id} chip={chip} locale={locale} isAr={isAr} counts={counts} />
        ))}
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
  const isIslamicGroup = group.id === 'islamic_dynasties';
  const dedicatedChips = group.catalogues.filter(c => c.special !== 'islamic_dynasties');
  const islamicMain    = group.catalogues.find(c => c.special === 'islamic_dynasties');
  const bg = GROUP_BG[group.id] ?? 'bg-white';

  return (
    <div className="rounded-2xl p-8" style={{ background: '#120F08', border: '1px solid #1E1A12' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap mb-1">
        <h3 className="text-xl font-semibold" style={{ color: '#E8DCC8' }}>{title}</h3>
        {group.ottoman && (
          <span className="text-xs border rounded-full px-2 py-0.5" style={{ background: 'transparent', borderColor: '#2E2820', color: '#5A5040' }}>
            {isAr ? 'في الإعداد' : 'In preparation'}
          </span>
        )}
        {group.period && (
          <span className="text-xs rounded-full px-3 py-0.5" style={{ background: 'transparent', border: '1px solid #2E2820', color: '#5A5040' }}>
            {group.period}
          </span>
        )}
      </div>
      {/* Description */}
      <p className="text-sm mt-1 mb-5 leading-relaxed" style={{ color: '#5A5040' }}>{desc}</p>
      {/* Divider */}
      <div className="mb-5" style={{ borderTop: '1px solid #1E1A12' }} />
      {/* Chips */}
      {isIslamicGroup && islamicMain ? (
        <IslamicBlock locale={locale} isAr={isAr} counts={counts} dedicatedChips={dedicatedChips} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {group.catalogues.map(chip => (
            <LiveChip key={chip.id} chip={chip} locale={locale} isAr={isAr} counts={counts} />
          ))}
        </div>
      )}
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

  const [liveCounts,  setLiveCounts]  = useState<LiveCounts>({});
  const [totalCoins,  setTotalCoins]  = useState<number | null>(null);

  // Fetch coin of the day + live total
  useEffect(() => {
    (async () => {
      try {
        const { count } = await supabase.from('coins').select('*', { count: 'exact', head: true });
        const total = count ?? 0;
        setTotalCoins(total);
        const today  = new Date();
        const seed   = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const offset = total > 0 ? seed % total : 0;
        const { data } = await supabase.from('coins').select('id,name,nar,yce,o,cc,co,co_ar').range(offset, offset);
        if (data && data.length > 0) setCoinOfDay(data[0] as typeof coinOfDay);
      } catch (err) { console.error(err); }
    })();
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
    <main className="min-h-screen" style={{ background: '#0E0C0A' }} dir={isAr ? 'rtl' : 'ltr'}>
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
            {/* Live total coin count */}
            <div className="text-center">
              <div className="font-amiri text-2xl md:text-3xl text-gold-400 font-bold">
                {totalCoins != null
                  ? totalCoins.toLocaleString(isAr ? 'ar-EG' : isDe ? 'de-DE' : 'en-US')
                  : (isAr ? '...' : '...')}
              </div>
              <div className="text-[10px] text-amber-300/60 mt-0.5 uppercase tracking-wide">
                {isAr ? 'عملة مفهرسة' : isDe ? 'Münzen' : 'coins indexed'}
              </div>
            </div>
            {/* Static stats */}
            {HERO_STATS_STATIC.map((s, i) => (
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
      <div className="catalogue-section" style={{ background: '#0E0C0A' }}>
        <div className="max-w-[1440px] mx-auto px-4 py-10">
          <h2 className="text-2xl font-semibold mb-8" style={{ color: '#E8DCC8' }}>
            {t('الكتالوجات', 'Catalogues', 'Kataloge')}
          </h2>

          <div className="flex flex-col gap-5">
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
