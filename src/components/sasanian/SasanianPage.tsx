'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { getSasanianCoins, getSasanianFilters } from '@/lib/coinsApi';
import type { CoinRow, SasanianCoinFilters } from '@/lib/coinsApi';
import { supabase } from '@/lib/supabase';
import CoinCard from '@/components/catalogue/CoinCard';
import CoinModal from '@/components/catalogue/CoinModal';
import { useDarkMode } from '@/lib/darkModeContext';
import type { Coin } from '@/types/coin';

const METALS_AR: Record<string, string> = {
  Gold: 'ذهب', Silver: 'فضة', Bronze: 'برونز', Billon: 'بليون',
  Lead: 'رصاص', Copper: 'نحاس', 'Fourrée': 'مطلي',
};

const PER_PAGE = 48;

// ── Searchable autocomplete ────────────────────────────────────────────────
interface AutoOption { en: string; ar: string | null }

function SearchableSelect({
  value, onSelect, cc, field, placeholderEn, placeholderAr, isAr,
}: {
  value: string;
  onSelect: (v: string) => void;
  cc: string;
  field: 'mint' | 'ruler';
  placeholderEn: string;
  placeholderAr: string;
  isAr: boolean;
}) {
  const [inputVal, setInputVal] = useState('');
  const [options,  setOptions]  = useState<AutoOption[]>([]);
  const [open,     setOpen]     = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef     = useRef<NodeJS.Timeout>();

  useEffect(() => { if (!value) setInputVal(''); }, [value]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (inputVal.length < 2) { setOptions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      const enField = field;
      const arField = field === 'mint' ? 'mint_ar' : 'ruler_ar';
      const { data } = await supabase
        .from('coins')
        .select(`${enField}, ${arField}`)
        .eq('cc', cc)
        .ilike(enField, `%${inputVal}%`)
        .neq(enField, '')
        .limit(100);
      const seen = new Set<string>();
      const opts: AutoOption[] = [];
      for (const row of (data ?? [])) {
        const enVal = (row as Record<string, string>)[enField];
        const arVal = (row as Record<string, string>)[arField] ?? null;
        if (enVal && !seen.has(enVal)) { seen.add(enVal); opts.push({ en: enVal, ar: arVal }); }
      }
      setOptions(opts.slice(0, 20));
      setOpen(opts.length > 0);
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [inputVal, cc, field]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt: AutoOption) => {
    onSelect(opt.en);
    setInputVal(isAr ? (opt.ar || opt.en) : opt.en);
    setOpen(false);
  };

  const handleClear = () => { onSelect(''); setInputVal(''); setOptions([]); setOpen(false); };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-0.5 rounded-lg border border-gold-700/30 bg-parch-cream overflow-hidden focus-within:border-gold-500">
        <input
          value={value
            ? (isAr ? (options.find(o => o.en === value)?.ar || value) : value)
            : inputVal}
          readOnly={!!value}
          onChange={e => { if (!value) setInputVal(e.target.value); }}
          onFocus={() => { if (!value && inputVal.length >= 2) setOpen(true); }}
          placeholder={isAr ? placeholderAr : placeholderEn}
          className="text-[11px] px-2.5 py-1.5 bg-transparent text-ink/70 outline-none w-[140px] font-cairo placeholder:text-ink/40 cursor-text"
        />
        {value ? (
          <button onClick={handleClear} className="pe-2 text-ink/40 hover:text-ink/70 shrink-0"><X size={11} /></button>
        ) : (
          <ChevronDown size={11} className="pe-2 text-ink/30 shrink-0 pointer-events-none" />
        )}
      </div>
      {open && options.length > 0 && (
        <div className="absolute top-full start-0 mt-1 w-56 bg-parch-cream border border-gold-700/25 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.en}
              onMouseDown={e => { e.preventDefault(); handleSelect(opt); }}
              className="w-full text-start px-3 py-1.5 text-[11px] hover:bg-gold-500/10 text-ink/70 flex justify-between gap-2"
            >
              <span className="truncate">{isAr ? (opt.ar || opt.en) : opt.en}</span>
              {opt.ar && !isAr && <span className="text-ink/30 shrink-0 font-cairo">{opt.ar}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

export default function SasanianPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const { darkMode } = useDarkMode();

  const [query,       setQuery]       = useState('');
  const [ruler,       setRuler]       = useState('');
  const [mint,        setMint]        = useState('');
  const [metal,       setMetal]       = useState('');
  const [yceFrom,     setYceFrom]     = useState('');
  const [yceTo,       setYceTo]       = useState('');
  const [moreFilters, setMoreFilters] = useState(false);
  const [page,        setPage]        = useState(1);

  const [coins,        setCoins]        = useState<CoinRow[]>([]);
  const [total,        setTotal]        = useState(7995);
  const [loading,      setLoading]      = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [filters,      setFilters]      = useState<{
    rulers: { en: string; ar: string | null }[];
    mints:  { en: string; ar: string | null }[];
    metals: string[];
  }>({ rulers: [], mints: [], metals: [] });

  const queryRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    getSasanianFilters().then(setFilters).catch(() => {});
  }, []);

  const doFetch = useCallback(() => {
    setLoading(true);
    const f: SasanianCoinFilters = {};
    if (query.trim()) f.query    = query.trim();
    if (ruler)        f.ruler    = ruler;
    if (mint)         f.mint     = mint;
    if (metal)        f.metal    = metal;
    if (yceFrom)      f.yce_from = parseInt(yceFrom);
    if (yceTo)        f.yce_to   = parseInt(yceTo);

    getSasanianCoins(f, page, PER_PAGE).then(({ data, count }) => {
      setCoins(data);
      setTotal(count);
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ruler, mint, metal, yceFrom, yceTo, page]);

  useEffect(() => {
    clearTimeout(queryRef.current);
    queryRef.current = setTimeout(doFetch, 300);
    return () => clearTimeout(queryRef.current);
  }, [doFetch]);

  const clearAll = () => {
    setQuery(''); setRuler(''); setMint(''); setMetal('');
    setYceFrom(''); setYceTo(''); setPage(1);
  };

  const activeCount = [ruler, mint, metal, yceFrom, yceTo].filter(Boolean).length;
  const totalPages  = Math.ceil(total / PER_PAGE);

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: isAr ? 'العملات الساسانية — أرابيزماتيكا' : 'Sasanian Coins — Arabismatica',
    numberOfItems: 7995,
    url: `https://arabismatica.arabcollector.com/${locale}/sasanian`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="max-w-[1440px] mx-auto"
        style={darkMode ? { filter: 'invert(1) hue-rotate(180deg)' } : {}}
      >

        {/* ── SEARCH ─────────────────────────────────────────────────────── */}
        <div className="border-b border-gold-700/15 bg-white/50 py-3">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-4 text-gold-500/50" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={isAr ? 'ابحث بالاسم، الحاكم، دار الضرب...' : 'Search by name, ruler, mint...'}
              className="w-full text-[14px] ps-11 pe-4 py-3 rounded-xl border border-gold-700/25 bg-parch-cream outline-none focus:border-gold-500 shadow-sm font-cairo"
            />
          </div>
        </div>

        {/* ── FILTER ROW ─────────────────────────────────────────────────── */}
        <div className="bg-parch sticky top-[167px] z-30 border-b border-gold-700/15 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">

            {/* Ruler — searchable autocomplete */}
            <SearchableSelect
              value={ruler}
              onSelect={val => { setRuler(val); setPage(1); }}
              cc="SS"
              field="ruler"
              placeholderEn="Search rulers…"
              placeholderAr="ابحث في الحكام…"
              isAr={isAr}
            />

            {/* Mint — searchable autocomplete */}
            <SearchableSelect
              value={mint}
              onSelect={val => { setMint(val); setPage(1); }}
              cc="SS"
              field="mint"
              placeholderEn="Search mints…"
              placeholderAr="ابحث في دور الضرب…"
              isAr={isAr}
            />

            {/* Metal */}
            <select value={metal} onChange={e => { setMetal(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
              <option value="">{isAr ? 'كل المعادن' : 'All Metals'}</option>
              {filters.metals.map(m => (
                <option key={m} value={m}>{isAr ? (METALS_AR[m] ?? m) : m}</option>
              ))}
            </select>

            {/* Year CE toggle */}
            <button
              onClick={() => setMoreFilters(!moreFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg border transition-colors
                ${moreFilters ? 'border-gold-500 bg-parch-dark text-ink' : 'border-gold-700/30 bg-parch-cream text-ink/70 hover:border-gold-500'}`}>
              <SlidersHorizontal size={12} />
              {isAr ? 'التاريخ' : 'Date'}
              {moreFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {/* Results count */}
            <div className="flex items-center gap-2 ms-auto">
              <span className="text-[11px] text-ink/40">
                {total.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : 'coins'}
              </span>
            </div>

            {/* Clear */}
            {activeCount > 0 && (
              <button onClick={clearAll}
                className="flex items-center gap-1 text-[11px] text-gold-600 hover:text-gold-500 border border-gold-700/30 rounded-full px-2.5 py-1 transition-colors">
                <X size={11} />
                {isAr ? `مسح (${activeCount})` : `Clear (${activeCount})`}
              </button>
            )}
          </div>
        </div>

        {/* ── YEAR RANGE ─────────────────────────────────────────────────── */}
        {moreFilters && (
          <div className="border-b border-gold-700/10 bg-parch-cream/60 px-4 py-3 flex items-center gap-3 flex-wrap">
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
        )}

        {/* ── ACTIVE FILTER PILLS ────────────────────────────────────────── */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2 px-4">
            {ruler && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {ruler}
                <button onClick={() => { setRuler(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {mint && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {mint}
                <button onClick={() => { setMint(''); setPage(1); }}><X size={10} /></button>
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

        {/* ── COIN GRID ──────────────────────────────────────────────────── */}
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

        {/* ── PAGINATION ─────────────────────────────────────────────────── */}
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

        {/* ── BACK ───────────────────────────────────────────────────────── */}
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
