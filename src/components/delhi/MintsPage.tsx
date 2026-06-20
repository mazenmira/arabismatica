'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getDelhiFilters } from '@/lib/coinsApi';

interface Mint { en: string; ar: string | null; count: number }

const PER_PAGE = 40;

export default function DelhiMintsPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const [mints,   setMints]   = useState<Mint[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    getDelhiFilters().then(f => {
      setMints(f.mints.filter(m => m.en && m.en.trim() && m.count > 0));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return mints;
    const q = query.toLowerCase();
    return mints.filter(m =>
      m.en.toLowerCase().includes(q) || (m.ar && m.ar.includes(query))
    );
  }, [mints, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[11px] text-gold-600/60 mb-3">
          <Link href={`/${locale}`} className="hover:text-gold-500 transition-colors">
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
          <span>/</span>
          <span>{isAr ? 'سلطنة دلهي' : 'Delhi Sultanate'}</span>
          <span>/</span>
          <span className="text-gold-500">{isAr ? 'دور الضرب' : 'Mints'}</span>
        </div>
        <h1 className="font-amiri text-3xl text-gold-300 mb-2">
          {isAr ? 'دور ضرب سلطنة دلهي' : 'Delhi Sultanate Mint Cities'}
        </h1>
        <p className="text-[13px] text-ink/50">
          {isAr ? '1206–1526م · انقر على دار الضرب لعرض عملاتها' : '1206–1526 CE · Click a mint to browse its coins'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          placeholder={isAr ? 'ابحث عن دار ضرب…' : 'Search mints…'}
          dir={isAr ? 'rtl' : 'ltr'}
          className="text-[12px] px-3 py-2 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/80 outline-none focus:border-gold-500 font-cairo w-full max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gold-600 py-12">
          <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px]">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gold-700/20">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-ink text-gold-300">
                  <th className="px-3 py-3 text-center w-10">#</th>
                  <th className={`px-4 py-3 ${isAr ? 'text-right' : 'text-left'}`}>
                    {isAr ? 'دار الضرب (إنجليزي)' : 'Mint (EN)'}
                  </th>
                  <th className={`px-4 py-3 ${isAr ? 'text-right' : 'text-left'}`}>
                    {isAr ? 'دار الضرب (عربي)' : 'Mint (AR)'}
                  </th>
                  <th className="px-3 py-3 text-center">{isAr ? 'العملات' : 'Coins'}</th>
                  <th className="px-3 py-3 text-center w-16"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((mint, i) => (
                  <tr key={mint.en}
                    className="border-t border-gold-700/10 hover:bg-gold-500/5 transition-colors">
                    <td className="px-3 py-2.5 text-center text-ink/30 text-[11px]">
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td className="px-4 py-2.5 text-ink/80">{mint.en}</td>
                    <td className="px-4 py-2.5 font-amiri text-[14px] text-ink/90" dir="rtl">
                      {mint.ar || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium text-ink/80">
                      {mint.count.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Link
                        href={`/${locale}/delhi?mint=${encodeURIComponent(mint.en)}`}
                        className="text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 hover:border-gold-500/60 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap"
                      >
                        {isAr ? 'عرض ←' : 'View →'}
                      </Link>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-ink/40 text-[13px]">
                      {isAr ? 'لا نتائج' : 'No results'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[11px] text-ink/60 hover:border-gold-500 disabled:opacity-30 transition-colors">
                {isAr ? '‹ السابق' : '‹ Prev'}
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] min-w-[32px] transition-colors
                      ${p === page ? 'bg-gold-500 text-ink font-semibold border border-gold-500' : 'border border-gold-700/25 text-ink/50 hover:border-gold-500/50'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[11px] text-ink/60 hover:border-gold-500 disabled:opacity-30 transition-colors">
                {isAr ? 'التالي ›' : 'Next ›'}
              </button>
            </div>
          )}

          <p className="mt-3 text-[11px] text-ink/30 text-center">
            {filtered.length.toLocaleString()} {isAr ? 'دار ضرب' : 'mints'}
          </p>
        </>
      )}
    </div>
  );
}
