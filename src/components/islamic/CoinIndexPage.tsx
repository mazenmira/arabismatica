'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getIslamicCoins, getIslamicFilters } from '@/lib/coinsApi';
import type { CoinRow, IslamicCoinFilters, IslamicFilters } from '@/lib/coinsApi';

const PER_PAGE = 40;

interface CoinIndexPageProps { locale: string }

type SortKey = 'default' | 'yah_asc' | 'yah_desc' | 'yce_asc' | 'yce_desc';

export default function CoinIndexPage({ locale }: CoinIndexPageProps) {
  const isAr = locale === 'ar';

  const [coins,    setCoins]    = useState<CoinRow[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [filters,  setFilters]  = useState<IslamicCoinFilters>({});
  const [sortBy,   setSortBy]   = useState<SortKey>('default');
  const [opts,     setOpts]     = useState<IslamicFilters>({ dynasties: [], mints: [], rulers: [], tags: [] });

  // Load filter dropdown options once
  useEffect(() => {
    getIslamicFilters().then(setOpts).catch(() => {});
  }, []);

  // Fetch coins whenever filters, page, or sort change
  const load = useCallback(() => {
    setLoading(true);
    // Apply sort as Supabase order — handled by mapping sortKey to yce/yah
    getIslamicCoins(filters, page, PER_PAGE)
      .then(({ data, count }) => {
        // Client-side sort for yah (stored as text)
        let sorted = data;
        if (sortBy === 'yah_asc')  sorted = [...data].sort((a, b) => parseInt(a.yah||'0') - parseInt(b.yah||'0'));
        if (sortBy === 'yah_desc') sorted = [...data].sort((a, b) => parseInt(b.yah||'0') - parseInt(a.yah||'0'));
        if (sortBy === 'yce_asc')  sorted = [...data].sort((a, b) => parseInt(a.yce||'0') - parseInt(b.yce||'0'));
        if (sortBy === 'yce_desc') sorted = [...data].sort((a, b) => parseInt(b.yce||'0') - parseInt(a.yce||'0'));
        setCoins(sorted);
        setTotal(count);
      })
      .finally(() => setLoading(false));
  }, [filters, page, sortBy]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key: keyof IslamicCoinFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const clearFilters = () => { setFilters({}); setPage(1); setSortBy('default'); };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '') || sortBy !== 'default';

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] text-gold-600/60 mb-3">
          <Link href={`/${locale}`} className="hover:text-gold-500 transition-colors">
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
          <span>/</span>
          <span>{isAr ? 'العملات الإسلامية' : 'Islamic Coins'}</span>
          <span>/</span>
          <span className="text-gold-500">{isAr ? 'فهرس العملات' : 'Coin Index'}</span>
        </div>
        <h1 className="font-amiri text-3xl text-gold-300 mb-2">
          {isAr ? 'فهرس العملات الإسلامية' : 'Islamic Coin Index'}
        </h1>
        <p className="text-[13px] text-ink/50">
          {isAr
            ? 'قائمة مكثفة بجميع العملات الإسلامية مع إمكانية التصفية والترتيب.'
            : 'Dense filterable index of all Islamic coins in the catalogue.'}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5 p-3 rounded-xl border border-gold-700/20 bg-parch-cream/30">
        {/* Dynasty */}
        <select value={filters.dyn || ''}
          onChange={e => updateFilter('dyn', e.target.value)}
          className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none cursor-pointer focus:border-gold-500
            ${filters.dyn ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
          dir={isAr ? 'rtl' : 'ltr'}>
          <option value="">{isAr ? '☪️ السلالة' : '☪️ Dynasty'}</option>
          {opts.dynasties.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Coin type tag */}
        <select value={filters.coin_type_tag || ''}
          onChange={e => updateFilter('coin_type_tag', e.target.value)}
          className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none cursor-pointer focus:border-gold-500
            ${filters.coin_type_tag ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}>
          <option value="">{isAr ? '🏷️ النوع' : '🏷️ Type'}</option>
          {opts.tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Mint */}
        <select value={filters.mint_ar || ''}
          onChange={e => updateFilter('mint_ar', e.target.value)}
          className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none cursor-pointer focus:border-gold-500
            ${filters.mint_ar ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
          dir={isAr ? 'rtl' : 'ltr'}>
          <option value="">{isAr ? '🏛️ دار الضرب' : '🏛️ Mint'}</option>
          {opts.mints.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Ruler */}
        <select value={filters.ruler_ar || ''}
          onChange={e => updateFilter('ruler_ar', e.target.value)}
          className={`text-[11px] px-2.5 py-1.5 rounded-lg border bg-parch-cream text-ink/70 outline-none cursor-pointer focus:border-gold-500
            ${filters.ruler_ar ? 'border-gold-500 font-semibold' : 'border-gold-700/30'}`}
          dir={isAr ? 'rtl' : 'ltr'}>
          <option value="">{isAr ? '👑 الحاكم' : '👑 Ruler'}</option>
          {opts.rulers.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Hijri range */}
        <div className="flex items-center gap-1">
          <input type="number" placeholder={isAr ? 'هـ من' : 'AH from'}
            value={filters.yah_from ?? ''}
            onChange={e => updateFilter('yah_from', e.target.value ? Number(e.target.value) : undefined)}
            className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
          <span className="text-ink/30 text-[11px]">—</span>
          <input type="number" placeholder={isAr ? 'هـ إلى' : 'AH to'}
            value={filters.yah_to ?? ''}
            onChange={e => updateFilter('yah_to', e.target.value ? Number(e.target.value) : undefined)}
            className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e => { setSortBy(e.target.value as SortKey); setPage(1); }}
          className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
          <option value="default">{isAr ? 'ترتيب افتراضي' : 'Default'}</option>
          <option value="yah_asc">{isAr ? 'الأقدم هجري' : 'Oldest AH'}</option>
          <option value="yah_desc">{isAr ? 'الأحدث هجري' : 'Newest AH'}</option>
          <option value="yce_asc">{isAr ? 'الأقدم ميلادي' : 'Oldest CE'}</option>
          <option value="yce_desc">{isAr ? 'الأحدث ميلادي' : 'Newest CE'}</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters}
            className="text-[11px] text-gold-600 hover:text-gold-500 border border-gold-700/30 rounded-full px-2.5 py-1 transition-colors">
            ✕ {isAr ? 'مسح' : 'Clear'}
          </button>
        )}

        <span className="text-[11px] text-ink/40 self-center mr-auto">
          {total.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : 'coins'}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gold-600 py-12 justify-center">
          <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px]">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gold-700/20">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-ink text-gold-300">
                  <th className="px-2 py-3 text-center w-8">#</th>
                  <th className="px-2 py-3 text-center w-14">{isAr ? 'صورة' : 'Img'}</th>
                  <th className={`px-3 py-3 ${isAr ? 'text-right' : 'text-left'}`}>
                    {isAr ? 'دار الضرب' : 'Mint'}
                  </th>
                  <th className="px-3 py-3 text-center">{isAr ? 'سنة هـ' : 'Year AH'}</th>
                  <th className="px-3 py-3 text-center">{isAr ? 'النوع' : 'Type'}</th>
                  <th className={`px-3 py-3 ${isAr ? 'text-right' : 'text-left'}`}>
                    {isAr ? 'السلالة · الحاكم' : 'Dynasty · Ruler'}
                  </th>
                  <th className="px-3 py-3 text-center">{isAr ? 'المرجع' : 'Ref'}</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((coin, i) => (
                  <tr key={coin.id}
                    className="border-t border-gold-700/10 hover:bg-gold-500/5 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/${locale}/catalogue/${coin.id}`}>
                    <td className="px-2 py-2 text-center text-ink/30">
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {coin.o ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coin.o} alt="" className="w-9 h-9 rounded-full object-cover border border-gold-700/30 mx-auto" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-parch-dark border border-gold-700/20 mx-auto flex items-center justify-center text-[10px] text-ink/20">☪</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-amiri text-[13px] text-ink/80" dir="rtl">
                      {coin.mint_ar || coin.mint || '—'}
                    </td>
                    <td className="px-3 py-2 text-center text-ink/70">
                      {coin.yah || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {coin.coin_type_tag ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-gold-500/10 text-gold-700 border border-gold-700/20 whitespace-nowrap">
                          {coin.coin_type_tag}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2" dir="rtl">
                      <div className="font-amiri text-[12px] text-ink/60">{coin.dyn}</div>
                      {coin.ruler_ar && (
                        <div className="font-amiri text-[11px] text-ink/40">{coin.ruler_ar}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Link
                        href={`/${locale}/catalogue/${coin.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-gold-600 hover:text-gold-400 transition-colors"
                      >
                        {coin.nref || coin.id.replace('zeno-', 'Z#')}
                      </Link>
                    </td>
                  </tr>
                ))}
                {coins.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink/40 text-[13px]">
                      {isAr ? 'لا نتائج' : 'No results'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
              <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[11px] text-ink/60 hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                {isAr ? '‹ السابق' : '‹ Prev'}
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] min-w-[32px] transition-colors
                      ${p === page ? 'bg-gold-500 text-ink font-semibold border border-gold-500' : 'border border-gold-700/25 text-ink/50 hover:border-gold-500/50'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[11px] text-ink/60 hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                {isAr ? 'التالي ›' : 'Next ›'}
              </button>
              <span className="text-[11px] text-ink/30">{page} / {totalPages}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
