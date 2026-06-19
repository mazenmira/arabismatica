'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getRulerStats, getDynastyStats } from '@/lib/coinsApi';
import type { RulerStat } from '@/lib/coinsApi';

const PER_PAGE = 40;

interface RulersPageProps { locale: string }

export default function RulersPage({ locale }: RulersPageProps) {
  const isAr = locale === 'ar';
  const [rows,      setRows]      = useState<RulerStat[]>([]);
  const [dynasties, setDynasties] = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState('');
  const [dynFilter, setDynFilter] = useState('');
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    Promise.all([getRulerStats(), getDynastyStats()]).then(([rulers, dyns]) => {
      setRows(rulers.filter(r =>
        r.ruler_ar && r.ruler_ar.trim() &&
        r.total > 5 &&
        !['type','imitation'].some(t => r.ruler.toLowerCase().includes(t))
      ));
      setDynasties(dyns.map(d => d.dyn).filter(Boolean));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = rows;
    if (dynFilter) r = r.filter(row => row.dyn === dynFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(row =>
        row.ruler.toLowerCase().includes(q) || row.ruler_ar.includes(query)
      );
    }
    return r;
  }, [rows, query, dynFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const reset = () => { setPage(1); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[11px] text-gold-600/60 mb-3">
          <Link href={`/${locale}`} className="hover:text-gold-500 transition-colors">
            {isAr ? 'الرئيسية' : 'Home'}
          </Link>
          <span>/</span>
          <span>{isAr ? 'العملات الإسلامية' : 'Islamic Coins'}</span>
          <span>/</span>
          <span className="text-gold-500">{isAr ? 'الحكام' : 'Rulers'}</span>
        </div>
        <h1 className="font-amiri text-3xl text-gold-300 mb-2">
          {isAr ? 'حكام العملات الإسلامية' : 'Islamic Coin Rulers'}
        </h1>
        <p className="text-[13px] text-ink/50">
          {isAr
            ? 'قائمة بجميع الحكام الذين وردت أسماؤهم على العملات الإسلامية.'
            : 'All rulers whose names appear on recorded Islamic coins.'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); reset(); }}
          placeholder={isAr ? 'ابحث عن حاكم…' : 'Search rulers…'}
          dir={isAr ? 'rtl' : 'ltr'}
          className="text-[12px] px-3 py-2 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/80 outline-none focus:border-gold-500 font-cairo w-full max-w-xs"
        />
        <select
          value={dynFilter}
          onChange={e => { setDynFilter(e.target.value); reset(); }}
          className="text-[12px] px-3 py-2 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <option value="">{isAr ? 'كل السلالات' : 'All dynasties'}</option>
          {dynasties.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
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
                    {isAr ? 'الحاكم (إنجليزي)' : 'Ruler (EN)'}
                  </th>
                  <th className={`px-4 py-3 ${isAr ? 'text-right' : 'text-left'}`}>
                    {isAr ? 'الحاكم (عربي)' : 'Ruler (AR)'}
                  </th>
                  <th className={`px-4 py-3 ${isAr ? 'text-right' : 'text-left'}`}>
                    {isAr ? 'السلالة' : 'Dynasty'}
                  </th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">
                    {isAr ? 'الحقبة هـ' : 'Period AH'}
                  </th>
                  <th className="px-3 py-3 text-center">{isAr ? 'العملات' : 'Coins'}</th>
                  <th className="px-3 py-3 text-center w-16"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr key={`${row.ruler}-${row.dyn}`}
                    className="border-t border-gold-700/10 hover:bg-gold-500/5 transition-colors">
                    <td className="px-3 py-2.5 text-center text-ink/30 text-[11px]">
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td className="px-4 py-2.5 text-ink/80">{row.ruler || '—'}</td>
                    <td className="px-4 py-2.5 font-amiri text-[14px] text-ink/90" dir="rtl">
                      {row.ruler_ar || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-amiri text-[13px] text-ink/60" dir="rtl">
                      {row.dyn || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-ink/60 whitespace-nowrap">
                      {row.from_ah && row.to_ah
                        ? row.from_ah === row.to_ah ? row.from_ah : `${row.from_ah}–${row.to_ah}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium text-ink/80">
                      {row.total.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Link
                        href={`/${locale}/islamic?ruler=${encodeURIComponent(row.ruler)}`}
                        className="text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 hover:border-gold-500/60 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap"
                      >
                        {isAr ? 'عرض ←' : 'View →'}
                      </Link>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink/40 text-[13px]">
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
                className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[11px] text-ink/60 hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
                className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[11px] text-ink/60 hover:border-gold-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                {isAr ? 'التالي ›' : 'Next ›'}
              </button>
            </div>
          )}

          <p className="mt-3 text-[11px] text-ink/30 text-center">
            {filtered.length.toLocaleString()} {isAr ? 'حاكم' : 'rulers'}
          </p>
        </>
      )}
    </div>
  );
}
