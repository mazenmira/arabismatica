// src/components/country/CountryPage.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Grid3X3, List, Search } from 'lucide-react';
import type { Coin } from '@/types/coin';
import type { CountryMeta } from '@/lib/countries';
import {
  COUNTRY_FLAGS,
  isValidImageUrl,
  getCoinName,
  getCoinYear,
  DISC_GRADIENTS,
} from '@/lib/coins';

interface Props {
  meta: CountryMeta;
  coins: Coin[];
  locale: string;
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex flex-col gap-0.5">
      <div className="text-[10px] text-amber-600/60 uppercase tracking-wider">{label}</div>
      <div className="text-[20px] font-bold text-amber-900 font-amiri leading-tight">{value}</div>
    </div>
  );
}

// ── Mini coin card ─────────────────────────────────────────────────────────
function MiniCoinCard({ coin, locale }: { coin: Coin; locale: string }) {
  const [imgErr, setImgErr] = useState(false);
  const name = getCoinName(coin, locale);
  const year = getCoinYear(coin, locale);

  return (
    <Link
      href={`/${locale}/catalogue/${coin.id}`}
      className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-amber-100
                 hover:border-amber-300 hover:bg-amber-50 transition-all bg-white"
    >
      {isValidImageUrl(coin.o) && !imgErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coin.o}
          alt={name}
          onError={() => setImgErr(true)}
          className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform"
          style={{
            border: '2px solid #F0E8D4',
            outline: '1.5px solid #8B6D2E',
            boxShadow: '0 2px 8px rgba(80,50,10,.12)',
          }}
        />
      ) : (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
          style={{ background: DISC_GRADIENTS[coin.metal] ?? DISC_GRADIENTS.Other }}
        >
          🪙
        </div>
      )}
      <div className="w-full text-center">
        <div className="text-[11px] font-amiri text-amber-900 leading-tight line-clamp-2">{name}</div>
        {year && <div className="text-[9px] text-amber-500 mt-0.5">{year}</div>}
      </div>
    </Link>
  );
}

// ── List coin row ──────────────────────────────────────────────────────────
function CoinRow({ coin, locale }: { coin: Coin; locale: string }) {
  const [imgErr, setImgErr] = useState(false);
  const isAr = locale === 'ar';
  const name = getCoinName(coin, locale);

  return (
    <Link
      href={`/${locale}/catalogue/${coin.id}`}
      className="flex items-center gap-3 px-3 py-2 rounded-xl border border-amber-100
                 hover:border-amber-300 hover:bg-amber-50 transition-all bg-white group"
    >
      {isValidImageUrl(coin.o) && !imgErr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coin.o}
          alt={name}
          onError={() => setImgErr(true)}
          className="w-10 h-10 rounded-full object-cover shrink-0"
          style={{ border: '1.5px solid #F0E8D4', outline: '1px solid #8B6D2E' }}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-base shrink-0">🪙</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-amiri text-amber-900 truncate">{name}</div>
        <div className="text-[10px] text-amber-600/60 truncate">{coin.dyn}</div>
      </div>
      <div className="shrink-0 text-end">
        <div className="text-[11px] text-amber-700">{coin.yce ? `${coin.yce}${isAr ? ' م' : ''}` : ''}</div>
        <div className="text-[9px] text-amber-500">{coin.metal}</div>
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const PER_PAGE = 48;

export default function CountryPage({ meta, coins, locale }: Props) {
  const isAr = locale === 'ar';
  const flag = COUNTRY_FLAGS[meta.cc] ?? '';

  // Stats
  const years = coins.map(c => parseInt(c.yce)).filter(y => !isNaN(y));
  const yearMin = years.length ? Math.min(...years) : 0;
  const yearMax = years.length ? Math.max(...years) : 0;
  const commemorative = coins.filter(c => c.type === 'Commemorative').length;
  const dynasties = Array.from(new Set(coins.map(c => c.dyn).filter(Boolean)));
  const metals    = Array.from(new Set(coins.map(c => c.metal).filter(Boolean)));
  const goldCoins = coins.filter(c => c.metal === 'Gold').length;

  // Filters
  const [query, setQuery]   = useState('');
  const [dyn, setDyn]       = useState('');
  const [metal, setMetal]   = useState('');
  const [view, setView]     = useState<'grid' | 'list'>('grid');
  const [page, setPage]     = useState(1);

  const filtered = useMemo(() => {
    let result = coins;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.nar?.toLowerCase().includes(q) ||
        c.km?.toLowerCase().includes(q) ||
        c.yce?.includes(q) ||
        c.dyn?.toLowerCase().includes(q)
      );
    }
    if (dyn)   result = result.filter(c => c.dyn === dyn);
    if (metal) result = result.filter(c => c.metal === metal);
    return result;
  }, [coins, query, dyn, metal]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Featured coins (gold first, then first 6)
  const featured = useMemo(() => {
    const gold = coins.filter(c => c.metal === 'Gold' && isValidImageUrl(c.o));
    const rest = coins.filter(c => c.metal !== 'Gold' && isValidImageUrl(c.o));
    return [...gold, ...rest].slice(0, 6);
  }, [coins]);

  // JSON-LD for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isAr
      ? `عملات ${meta.co_ar} — أرابيزماتيكا`
      : `${meta.co} Coin Catalogue — Arabismatica`,
    description: isAr ? meta.history.ar : meta.history.en,
    url: `https://arabismatica.arabcollector.com/${locale}/country/${meta.slug}`,
    numberOfItems: coins.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        className="min-h-screen"
        style={{ background: 'var(--parch, #FAF6EE)' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="max-w-[960px] mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-amber-700/60 mb-6 flex-wrap">
            <Link href={`/${locale}`} className="hover:text-amber-700 transition-colors">
              {isAr ? 'أرابيزماتيكا' : 'Arabismatica'}
            </Link>
            <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
            <span className="text-amber-900 font-medium">{isAr ? meta.co_ar : meta.co}</span>
          </nav>

          {/* ── HERO ── */}
          <div
            className="rounded-2xl overflow-hidden mb-8"
            style={{ background: 'linear-gradient(135deg, #1a0e05 0%, #2a1a08 60%, #3a2810 100%)' }}
          >
            <div className="px-6 py-8 sm:py-10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{flag}</span>
                    <div>
                      <h1 className="font-amiri text-3xl text-amber-100 leading-tight">
                        {isAr ? meta.co_ar : meta.co}
                      </h1>
                      <p className="text-[12px] text-amber-400/60 italic mt-0.5">
                        {isAr ? meta.co : meta.co_ar}
                      </p>
                    </div>
                  </div>
                  <p className="text-[13px] text-amber-300/80 max-w-[480px] leading-relaxed mt-3">
                    {isAr ? meta.history.ar : meta.history.en}
                  </p>
                </div>

                {/* NGC link */}
                {meta.ngcUrl && (
                  <a
                    href={meta.ngcUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full
                               border border-amber-700/40 text-amber-400 hover:border-amber-500
                               hover:text-amber-200 transition-colors shrink-0"
                  >
                    <ExternalLink size={11} />
                    {isAr ? 'سجل NGC' : 'NGC Registry'}
                  </a>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <StatCard
                  label={isAr ? 'إجمالي العملات' : 'Total coins'}
                  value={coins.length.toLocaleString()}
                />
                <StatCard
                  label={isAr ? 'الفترة الزمنية' : 'Date range'}
                  value={yearMin && yearMax ? `${yearMin}–${yearMax}` : '—'}
                />
                <StatCard
                  label={isAr ? 'الأسرات الحاكمة' : 'Dynasties'}
                  value={dynasties.length}
                />
                <StatCard
                  label={isAr ? 'العملات التذكارية' : 'Commemoratives'}
                  value={commemorative}
                />
              </div>
            </div>
          </div>

          {/* ── FEATURED COINS ── */}
          {featured.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[15px] font-semibold text-amber-900 mb-3 flex items-center gap-2">
                {isAr ? 'عملات مميزة' : 'Featured coins'}
                <span className="text-[10px] font-normal text-amber-600/50">
                  {isAr ? 'الذهبية وأبرز الإصدارات' : 'gold & highlights'}
                </span>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {featured.map(coin => (
                  <MiniCoinCard key={coin.id} coin={coin} locale={locale} />
                ))}
              </div>
            </div>
          )}

          {/* ── DYNASTY BREAKDOWN ── */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold text-amber-900 mb-3">
              {isAr ? 'تصفح حسب العهد' : 'Browse by dynasty'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dynasties.map(d => {
                const count = coins.filter(c => c.dyn === d).length;
                const pct   = Math.round((count / coins.length) * 100);
                return (
                  <button
                    key={d}
                    onClick={() => { setDyn(dyn === d ? '' : d); setPage(1); }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border
                                text-right transition-all text-start
                                ${dyn === d
                                  ? 'bg-amber-900 border-amber-700 text-amber-100'
                                  : 'bg-white border-amber-100 hover:border-amber-300 text-amber-900'
                                }`}
                  >
                    <span className="text-[13px] font-amiri">{d}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-medium min-w-[28px] text-end ${dyn === d ? 'text-amber-300' : 'text-amber-600'}`}>
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── METALS ── */}
          <div className="mb-6 flex flex-wrap gap-2">
            {metals.map(m => {
              const count = coins.filter(c => c.metal === m).length;
              return (
                <button
                  key={m}
                  onClick={() => { setMetal(metal === m ? '' : m); setPage(1); }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all
                              ${metal === m
                                ? 'bg-amber-800 border-amber-700 text-amber-100'
                                : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400'
                              }`}
                >
                  {m} <span className="opacity-60">({count})</span>
                </button>
              );
            })}
            {goldCoins > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                🥇 {goldCoins} {isAr ? 'ذهبية' : 'gold'}
              </span>
            )}
          </div>

          {/* ── COLLECTING TIPS ── */}
          <div className="bg-white rounded-xl border border-amber-100 px-5 py-4 mb-8">
            <h2 className="text-[13px] font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <span>💡</span>
              {isAr ? 'نصائح الجمع' : 'Collecting tips'}
            </h2>
            <p className="text-[12px] text-amber-800/80 leading-relaxed">
              {isAr ? meta.collectingTips.ar : meta.collectingTips.en}
            </p>
          </div>

          {/* ── CATALOGUE ── */}
          <div>
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h2 className="text-[15px] font-semibold text-amber-900 flex-1">
                {isAr ? 'الكتالوج' : 'Catalogue'}
                {(dyn || metal || query) && (
                  <span className="text-[11px] font-normal text-amber-600 mr-2">
                    — {filtered.length} {isAr ? 'نتيجة' : 'results'}
                  </span>
                )}
                {!dyn && !metal && !query && (
                  <span className="text-[11px] font-normal text-amber-600/60 mr-2">
                    ({coins.length})
                  </span>
                )}
              </h2>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-2.5 text-amber-400" />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setPage(1); }}
                  placeholder={isAr ? 'ابحث...' : 'Search...'}
                  className="text-[12px] ps-7 pe-3 py-1.5 rounded-full border border-amber-200 bg-white
                             focus:outline-none focus:border-amber-400 w-[140px]"
                />
              </div>

              {/* Clear filters */}
              {(dyn || metal || query) && (
                <button
                  onClick={() => { setDyn(''); setMetal(''); setQuery(''); setPage(1); }}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-amber-200
                             text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  {isAr ? 'مسح' : 'Clear'}
                </button>
              )}

              {/* View toggle */}
              <div className="flex items-center gap-1 border border-amber-200 rounded-full p-0.5 bg-white">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded-full transition-colors ${view === 'grid' ? 'bg-amber-900 text-amber-100' : 'text-amber-500 hover:text-amber-700'}`}
                >
                  <Grid3X3 size={13} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded-full transition-colors ${view === 'list' ? 'bg-amber-900 text-amber-100' : 'text-amber-500 hover:text-amber-700'}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>

            {/* Grid or list */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-amber-600/60 text-[13px]">
                {isAr ? 'لا توجد نتائج' : 'No coins found'}
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {paged.map(coin => (
                  <MiniCoinCard key={coin.id} coin={coin} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {paged.map(coin => (
                  <CoinRow key={coin.id} coin={coin} locale={locale} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-amber-200 text-amber-700
                             disabled:opacity-30 hover:bg-amber-50 transition-colors"
                >
                  {isAr ? '→' : '←'}
                </button>
                <span className="text-[12px] text-amber-700/60">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === totalPages}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-amber-200 text-amber-700
                             disabled:opacity-30 hover:bg-amber-50 transition-colors"
                >
                  {isAr ? '←' : '→'}
                </button>
              </div>
            )}
          </div>

          {/* ── BACK LINK ── */}
          <div className="mt-10 pt-6 border-t border-amber-100 flex items-center justify-between flex-wrap gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-[13px] px-5 py-2.5 rounded-full
                         bg-[#1a0e05] text-amber-300 hover:bg-[#2a1a08] transition-colors font-medium"
            >
              <ArrowRight size={14} className={isAr ? '' : 'rotate-180'} />
              {isAr ? 'العودة إلى الكتالوج الكامل' : 'Back to full catalogue'}
            </Link>
            <p className="text-[11px] text-amber-600/50">
              {isAr ? 'أرابيزماتيكا — المقتني العربي' : 'Arabismatica — The Arab Collector'}
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
