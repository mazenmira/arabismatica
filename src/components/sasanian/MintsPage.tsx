'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSasanianFilters } from '@/lib/coinsApi';

interface Mint { en: string; ar: string | null }

export default function MintsPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const [mints, setMints] = useState<Mint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSasanianFilters().then(f => {
      setMints(f.mints.filter(m => m.en && m.en.trim() && m.ar));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-[1440px] mx-auto py-6 px-4">
      <h2 className="font-amiri text-xl text-amber-900 mb-1">
        {isAr ? 'دور ضرب العملات الساسانية' : 'Sasanian Mint Cities'}
      </h2>
      <p className="text-[12px] text-amber-700/60 mb-6">
        {isAr ? '224–651م · انقر على دار الضرب لعرض عملاتها' : '224–651 CE · Click a mint to browse its coins'}
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="h-10 bg-amber-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-amber-200/60 shadow-sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-amber-950/90 text-amber-200">
                <th className="px-4 py-3 text-start font-medium text-[11px] uppercase tracking-wider w-10">#</th>
                <th className="px-4 py-3 text-start font-medium text-[11px] uppercase tracking-wider">
                  {isAr ? 'المدينة' : 'City'}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[11px] uppercase tracking-wider font-amiri">
                  {isAr ? 'بالعربية' : 'Arabic'}
                </th>
                <th className="px-4 py-3 text-end font-medium text-[11px] uppercase tracking-wider">
                  {isAr ? 'العملات' : 'Coins'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {mints.map((mint, i) => (
                <tr key={mint.en} className="hover:bg-amber-50 transition-colors group">
                  <td className="px-4 py-2.5 text-amber-400/60 text-[11px]">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/${locale}/sasanian?mint=${encodeURIComponent(mint.en)}`}
                      className="text-amber-900 hover:text-amber-600 font-medium group-hover:underline"
                    >
                      {mint.en}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-amiri text-amber-800">
                    {mint.ar || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <Link
                      href={`/${locale}/sasanian?mint=${encodeURIComponent(mint.en)}`}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-400 rounded-full px-2.5 py-0.5 transition-colors"
                    >
                      {isAr ? 'عرض →' : 'View →'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-amber-100">
        <Link href={`/${locale}/sasanian`}
          className="text-[13px] text-amber-700 hover:text-amber-900 transition-colors">
          {isAr ? '← العودة إلى الكتالوج' : '← Back to Catalogue'}
        </Link>
      </div>
    </div>
  );
}
