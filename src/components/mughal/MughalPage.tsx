'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { getMughalCoins, getMughalFilters } from '@/lib/coinsApi';
import type { CoinRow, MughalCoinFilters, MughalFilters } from '@/lib/coinsApi';
import ComboFilter from '@/components/ui/ComboFilter';
import type { ComboOption } from '@/components/ui/ComboFilter';
import CoinCard from '@/components/catalogue/CoinCard';
import CoinModal from '@/components/catalogue/CoinModal';
import { useDarkMode } from '@/lib/darkModeContext';
import type { Coin } from '@/types/coin';

const METALS_AR: Record<string, string> = {
  Gold: 'ذهب', Silver: 'فضة', Bronze: 'برونز', Billon: 'بليون',
  Lead: 'رصاص', Copper: 'نحاس',
};

const PER_PAGE = 48;

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-amber-100 overflow-hidden animate-pulse">
      <div className="w-full h-28 bg-amber-100" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3 bg-amber-100 rounded w-3/4" />
        <div className="h-2.5 bg-amber-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function MughalPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const { darkMode } = useDarkMode();

  const [query,       setQuery]       = useState('');
  const [ruler,       setRuler]       = useState('');
  const [mint,        setMint]        = useState('');
  const [metal,       setMetal]       = useState('');
  const [yceFrom,     setYceFrom]     = useState('');
  const [yceTo,       setYceTo]       = useState('');
  const [wtFrom,      setWtFrom]      = useState('');
  const [wtTo,        setWtTo]        = useState('');
  const [diaFrom,     setDiaFrom]     = useState('');
  const [diaTo,       setDiaTo]       = useState('');
  const [withImages,  setWithImages]  = useState(false);
  const [bothImages,  setBothImages]  = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);
  const [page,        setPage]        = useState(1);

  const [coins,        setCoins]        = useState<CoinRow[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [metals,       setMetals]       = useState<string[]>([]);
  const mgFilters   = useRef<MughalFilters | null>(null);

  useEffect(() => {
    getMughalFilters()
      .then(f => {
        mgFilters.current = f;
        setMetals(f.metals?.length ? f.metals : ['Gold', 'Silver', 'Bronze', 'Billon', 'Copper']);
      })
      .catch(() => setMetals(['Gold', 'Silver', 'Bronze', 'Billon', 'Copper']));
  }, []);

  const loadMints = useCallback(async (q: string): Promise<ComboOption[]> => {
    const all = mgFilters.current?.mints ?? [];
    const lower = q.toLowerCase();
    return all
      .filter(r => !q || r.en.toLowerCase().includes(lower) || (r.ar ?? '').includes(q))
      .slice(0, 50)
      .map(r => ({ value: r.en, label: isAr && r.ar ? r.ar : r.en }));
  }, [isAr]);

  const loadRulers = useCallback(async (q: string): Promise<ComboOption[]> => {
    const all = mgFilters.current?.rulers ?? [];
    const lower = q.toLowerCase();
    return all
      .filter(r => !q || r.en.toLowerCase().includes(lower) || (r.ar ?? '').includes(q))
      .slice(0, 50)
      .map(r => ({ value: r.en, label: isAr && r.ar ? r.ar : r.en }));
  }, [isAr]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const f: MughalCoinFilters = {};
    if (query.trim()) f.query    = query.trim();
    if (ruler)        f.ruler    = ruler;
    if (mint)         f.mint     = mint;
    if (metal)        f.metal    = metal;
    if (yceFrom)      f.yce_from = parseInt(yceFrom);
    if (yceTo)        f.yce_to   = parseInt(yceTo);
    if (wtFrom)       f.wtFrom   = parseFloat(wtFrom);
    if (wtTo)         f.wtTo     = parseFloat(wtTo);
    if (diaFrom)      f.diaFrom  = parseFloat(diaFrom);
    if (diaTo)        f.diaTo    = parseFloat(diaTo);
    if (withImages)   f.withImages = true;
    if (bothImages)   f.bothImages = true;

    getMughalCoins(f, page, PER_PAGE)
      .then(({ data, count }) => {
        if (cancelled) return;
        setCoins(data); setTotal(count); setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, ruler, mint, metal, yceFrom, yceTo, wtFrom, wtTo, diaFrom, diaTo, withImages, bothImages, page]);

  const clearAll = () => {
    setQuery(''); setRuler(''); setMint(''); setMetal('');
    setYceFrom(''); setYceTo('');
    setWtFrom(''); setWtTo(''); setDiaFrom(''); setDiaTo('');
    setWithImages(false); setBothImages(false); setPage(1);
  };

  const activeCount = [ruler, mint, metal, yceFrom, yceTo, wtFrom, wtTo, diaFrom, diaTo].filter(Boolean).length
    + (withImages ? 1 : 0) + (bothImages ? 1 : 0);
  const totalPages  = Math.ceil(total / PER_PAGE);

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: isAr ? 'العملات المغولية — أرابيزماتيكا' : 'Mughal Empire Coins — Arabismatica',
    url: `https://arabismatica.arabcollector.com/${locale}/mughal`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="max-w-[1440px] mx-auto"
        style={darkMode ? { filter: 'invert(1) hue-rotate(180deg)' } : {}}
      >

        {/* ── SEARCH ──────────────────────────────────────────────────────── */}
        <div className="py-3" style={{ background: '#0A0806', borderBottom: '1px solid #1E1A12' }}>
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-4" style={{ color: '#5A5040' }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={isAr ? 'ابحث عن عملة...' : 'Search coins...'}
              className="w-full text-[14px] ps-11 pe-4 py-3 outline-none shadow-sm font-cairo focus:border-[#C9A84C] transition-colors"
              style={{ background: '#120F08', border: '1px solid #1E1A12', color: '#E8DCC8', borderRadius: '3px' }}
            />
          </div>
        </div>

        {/* ── FILTER ROW ──────────────────────────────────────────────────── */}
        <div className="sticky top-[167px] z-30 shadow-sm" style={{ background: '#0A0806', borderBottom: '1px solid #1E1A12' }}>
          <div className="max-w-[1440px] mx-auto flex items-center gap-2.5 flex-wrap" style={{ padding: '12px 20px' }}>

            <ComboFilter
              placeholder={isAr ? 'الحاكم' : 'Ruler'}
              value={ruler}
              onChange={v => { setRuler(v); setPage(1); }}
              loadOptions={loadRulers}
            />

            <ComboFilter
              placeholder={isAr ? 'دار الضرب' : 'Mint'}
              value={mint}
              onChange={v => { setMint(v); setPage(1); }}
              loadOptions={loadMints}
            />

            <select value={metal} onChange={e => { setMetal(e.target.value); setPage(1); }}
              className="outline-none focus:border-[#C9A84C] cursor-pointer transition-colors"
              style={{ background: '#120F08', border: `1px solid ${metal ? '#3A2E10' : '#1E1A12'}`, borderRadius: '3px', padding: '8px 32px 8px 12px', color: metal ? '#C9A84C' : '#9A8E7A', fontSize: '13px', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235A5040' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
              <option value="">{isAr ? 'المعدن' : 'Metal'}</option>
              {metals.map(m => <option key={m} value={m}>{isAr ? (METALS_AR[m] ?? m) : m}</option>)}
            </select>

            {/* Image pills */}
            <button
              onClick={() => { setBothImages(false); setWithImages(!withImages); setPage(1); }}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all
                ${withImages ? 'bg-amber-50 border-amber-400 text-amber-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-amber-300'}`}>
              {isAr ? 'مع صورة' : 'With image'}
            </button>
            <button
              onClick={() => { setWithImages(false); setBothImages(!bothImages); setPage(1); }}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all
                ${bothImages ? 'bg-amber-50 border-amber-400 text-amber-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-amber-300'}`}>
              {isAr ? 'وجه وظهر' : 'Both sides'}
            </button>

            <button
              onClick={() => setMoreFilters(!moreFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg border transition-colors
                ${moreFilters ? 'border-gold-500 bg-parch-dark text-ink' : 'border-gold-700/30 bg-parch-cream text-ink/70 hover:border-gold-500'}`}>
              <SlidersHorizontal size={12} />
              {isAr ? 'المزيد' : 'More'}
              {moreFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            <div className="flex items-center gap-2 ms-auto">
              <span className="text-[11px] text-ink/40">
                {total.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : 'coins'}
              </span>
            </div>

            {activeCount > 0 && (
              <button onClick={clearAll}
                className="flex items-center gap-1 text-[11px] text-gold-600 hover:text-gold-500 border border-gold-700/30 rounded-full px-2.5 py-1 transition-colors">
                <X size={11} />
                {isAr ? `مسح (${activeCount})` : `Clear (${activeCount})`}
              </button>
            )}
          </div>
        </div>

        {/* ── DATE EXPAND ─────────────────────────────────────────────────── */}
        {moreFilters && (
          <div className="border-b border-gold-700/10 bg-parch-cream/60 px-4 py-3 flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">
                {isAr ? 'السنة الميلادية:' : 'Year CE:'}
              </span>
              <input value={yceFrom} onChange={e => { setYceFrom(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'من' : 'From'}
                className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
              <span className="text-ink/30 text-[11px]">—</span>
              <input value={yceTo} onChange={e => { setYceTo(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'إلى' : 'To'}
                className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">{isAr ? 'الوزن (غ):' : 'Weight (g):'}</span>
              <input value={wtFrom} onChange={e => { setWtFrom(e.target.value); setPage(1); }} type="number" placeholder="Min" step="0.1" min="0"
                className="w-16 text-[12px] border border-gray-200 rounded-md px-2 py-1.5 focus:border-amber-400 outline-none" />
              <span className="text-gray-300">—</span>
              <input value={wtTo} onChange={e => { setWtTo(e.target.value); setPage(1); }} type="number" placeholder="Max" step="0.1" min="0"
                className="w-16 text-[12px] border border-gray-200 rounded-md px-2 py-1.5 focus:border-amber-400 outline-none" />
              <span className="text-[11px] text-ink/60 font-medium ms-3 shrink-0">{isAr ? 'القطر (مم):' : 'Diameter (mm):'}</span>
              <input value={diaFrom} onChange={e => { setDiaFrom(e.target.value); setPage(1); }} type="number" placeholder="Min" step="0.5" min="0"
                className="w-16 text-[12px] border border-gray-200 rounded-md px-2 py-1.5 focus:border-amber-400 outline-none" />
              <span className="text-gray-300">—</span>
              <input value={diaTo} onChange={e => { setDiaTo(e.target.value); setPage(1); }} type="number" placeholder="Max" step="0.5" min="0"
                className="w-16 text-[12px] border border-gray-200 rounded-md px-2 py-1.5 focus:border-amber-400 outline-none" />
            </div>
          </div>
        )}

        {/* ── ACTIVE TAGS ─────────────────────────────────────────────────── */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2 px-4">
            {ruler && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {ruler}<button onClick={() => { setRuler(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {mint && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {mint}<button onClick={() => { setMint(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {metal && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {isAr ? (METALS_AR[metal] ?? metal) : metal}
                <button onClick={() => { setMetal(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {(yceFrom || yceTo) && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {yceFrom || '?'}–{yceTo || '?'} CE
                <button onClick={() => { setYceFrom(''); setYceTo(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
          </div>
        )}

        {/* ── COIN GRID ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4 pt-4">
          {loading
            ? Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)
            : coins.map(coin => (
                <CoinCard
                  key={coin.id}
                  coin={coin as unknown as Coin}
                  locale={locale}
                  view="grid"
                  onClick={() => setSelectedCoin(coin as unknown as Coin)}
                />
              ))}
        </div>

        {!loading && coins.length === 0 && (
          <div className="text-center py-12 text-amber-600/60 text-[13px]">
            {isAr ? 'لا توجد نتائج تطابق البحث' : 'No coins match your search'}
          </div>
        )}

        {/* ── PAGINATION ──────────────────────────────────────────────────── */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-6 pb-8 flex-wrap">
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="text-[12px] px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 disabled:opacity-30 hover:bg-amber-50">
              {isAr ? '→' : '←'}
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
                  className={`text-[12px] w-8 h-8 rounded-full border transition-colors
                    ${p === page ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="text-[12px] px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 disabled:opacity-30 hover:bg-amber-50">
              {isAr ? '←' : '→'}
            </button>
          </div>
        )}

        <div className="py-6 border-t border-amber-100 px-4">
          <Link href={`/${locale}`}
            className="inline-flex items-center gap-2 text-[13px] text-amber-700 hover:text-amber-900 transition-colors">
            {isAr ? '← العودة إلى الكتالوج الرئيسي' : '← Back to main catalogue'}
          </Link>
        </div>
      </div>

      {selectedCoin && (
        <CoinModal coin={selectedCoin} locale={locale} onClose={() => setSelectedCoin(null)} />
      )}
    </>
  );
}
