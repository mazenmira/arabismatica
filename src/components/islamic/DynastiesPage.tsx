'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getDynastyStats } from '@/lib/coinsApi';
import type { DynastyStat } from '@/lib/coinsApi';
import { DYNASTY_ORDER } from '@/lib/dynasties';

interface DynastiesPageProps { locale: string }

export default function DynastiesPage({ locale }: DynastiesPageProps) {
  const isAr = locale === 'ar';
  const [rows,    setRows]    = useState<DynastyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');

  useEffect(() => {
    getDynastyStats()
      .then(data => {
        // Sort by DYNASTY_ORDER; unlisted dynasties go to end by from_ah
        const ordered = [...data].sort((a, b) => {
          const ai = DYNASTY_ORDER.indexOf(a.dyn);
          const bi = DYNASTY_ORDER.indexOf(b.dyn);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          return parseInt(a.from_ah || '9999') - parseInt(b.from_ah || '9999');
        });
        setRows(ordered);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(r => r.dyn.toLowerCase().includes(q));
  }, [rows, query]);

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
          <span className="text-gold-500">{isAr ? 'السلالات' : 'Dynasties'}</span>
        </div>
        <h1 className="font-amiri text-3xl text-gold-300 mb-2">
          {isAr ? 'السلالات الإسلامية' : 'Islamic Dynasties'}
        </h1>
        <p className="text-[13px] text-ink/50">
          {isAr
            ? 'دليل شامل بالسلالات الإسلامية التي أصدرت عملات، مرتبة تاريخياً.'
            : 'A complete index of Islamic dynasties that issued coinage, arranged chronologically.'}
        </p>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={isAr ? 'ابحث عن سلالة…' : 'Search dynasties…'}
          dir={isAr ? 'rtl' : 'ltr'}
          className="w-full max-w-sm text-[12px] px-3 py-2 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/80 outline-none focus:border-gold-500 font-cairo"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gold-600 py-12">
          <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px]">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gold-700/20">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-ink text-gold-300">
                <th className="px-3 py-3 text-center w-10">#</th>
                <th className={`px-4 py-3 ${isAr ? 'text-right' : 'text-left'}`}>
                  {isAr ? 'السلالة' : 'Dynasty'}
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  {isAr ? 'الحقبة هـ' : 'Period AH'}
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  {isAr ? 'الحقبة م' : 'Period CE'}
                </th>
                <th className="px-3 py-3 text-center">{isAr ? 'العملات' : 'Coins'}</th>
                <th className="px-3 py-3 text-center">{isAr ? 'الحكام' : 'Rulers'}</th>
                <th className="px-3 py-3 text-center w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.dyn}
                  className="border-t border-gold-700/10 hover:bg-gold-500/5 transition-colors">
                  <td className="px-3 py-2.5 text-center text-ink/30 text-[11px]">{i + 1}</td>
                  <td className="px-4 py-2.5 font-amiri text-[14px] text-ink/90" dir="rtl">
                    {row.dyn}
                  </td>
                  <td className="px-3 py-2.5 text-center text-ink/60 whitespace-nowrap">
                    {row.from_ah && row.to_ah ? `${row.from_ah}–${row.to_ah}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center text-ink/60 whitespace-nowrap">
                    {row.from_ce && row.to_ce ? `${row.from_ce}–${row.to_ce}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center font-medium text-ink/80">
                    {row.coin_count.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className="px-3 py-2.5 text-center text-ink/60">
                    {row.ruler_count > 0 ? row.ruler_count : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Link
                      href={`/${locale}/islamic?dynasty=${encodeURIComponent(row.dyn)}`}
                      className="text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 hover:border-gold-500/60 rounded-full px-2.5 py-1 transition-colors whitespace-nowrap"
                    >
                      {isAr ? 'عرض ←' : 'View →'}
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink/40 text-[13px]">
                    {isAr ? 'لا نتائج' : 'No results'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <p className="mt-3 text-[11px] text-ink/30 text-center">
          {filtered.length.toLocaleString()} {isAr ? 'سلالة' : 'dynasties'}
          {query ? ` · ${isAr ? 'نتائج البحث' : 'matching search'}` : ''}
        </p>
      )}
    </div>
  );
}
