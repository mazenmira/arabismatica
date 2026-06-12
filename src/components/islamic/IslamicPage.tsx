'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { getIslamicCoins, getIslamicFilters } from '@/lib/coinsApi';
import type { CoinRow, IslamicCoinFilters } from '@/lib/coinsApi';
import CoinCard from '@/components/catalogue/CoinCard';

const DENOM_OPTIONS = [
  { key: '',             labelEn: 'All Denominations', labelAr: 'كل الأوراق' },
  { key: 'Dirham',       labelEn: 'Dirham',            labelAr: 'درهم' },
  { key: 'Dinar',        labelEn: 'Dinar',             labelAr: 'دينار' },
  { key: 'Fals/Fils',    labelEn: 'Fals/Fils',         labelAr: 'فلس' },
  { key: 'Early Dirham', labelEn: 'Early Dirham',      labelAr: 'درهم مبكر' },
  { key: 'Fractional',   labelEn: 'Fractional',        labelAr: 'كسر' },
  { key: 'Anonymous',    labelEn: 'Anonymous',         labelAr: 'مجهول' },
];

const COIN_TYPE_PILLS = [
  { key: 'Arab-Byzantine',   labelEn: 'Arab-Byzantine',   labelAr: 'عربي-بيزنطي' },
  { key: 'Arab-Sasanian',    labelEn: 'Arab-Sasanian',    labelAr: 'عربي-ساساني' },
  { key: 'Standing Caliph',  labelEn: 'Standing Caliph',  labelAr: 'الخليفة القائم' },
];

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

import type { Coin } from '@/types/coin';

export default function IslamicPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';

  // ── Filter state ─────────────────────────────────────────────────────────
  const [query,          setQuery]          = useState('');
  const [denomination,   setDenomination]   = useState('');
  const [dynasty,        setDynasty]        = useState('');
  const [metal,          setMetal]          = useState('');
  const [coinTypeTag,    setCoinTypeTag]     = useState('');
  const [yahFrom,        setYahFrom]        = useState('');
  const [yahTo,          setYahTo]          = useState('');
  const [sort,           setSort]           = useState<'default' | 'oldest' | 'newest'>('default');
  const [moreFilters,    setMoreFilters]    = useState(false);
  const [page,           setPage]           = useState(1);

  // ── Data state ───────────────────────────────────────────────────────────
  const [coins,     setCoins]     = useState<CoinRow[]>([]);
  const [total,     setTotal]     = useState(47303);
  const [loading,   setLoading]   = useState(false);
  const [mint,           setMint]          = useState('');
  const [ruler,          setRuler]         = useState('');
  const [filters,   setFilters]   = useState<{ dynasties: string[]; metals: string[]; mints: string[]; rulers: string[] }>({
    dynasties: [], metals: [], mints: [], rulers: [],
  });

  const queryRef   = useRef<NodeJS.Timeout>();

  // Load filter options once
  useEffect(() => {
    getIslamicFilters().then(f => {
      setFilters({
        dynasties: f.dynasties,
        metals: ['Gold', 'Silver', 'Bronze', 'Billon', 'Lead'],
        mints: f.mints.filter(Boolean).slice(0, 120),
        rulers: f.rulers.filter(Boolean).slice(0, 200),
      });
    }).catch(() => {});
  }, []);

  // Fetch coins when any filter or page changes (debounced query)
  const doFetch = useCallback(() => {
    setLoading(true);
    const f: IslamicCoinFilters = {};
    if (query.trim()) f.query = query.trim();
    if (denomination) f.denomination = denomination;
    if (dynasty)      f.dyn          = dynasty;
    if (metal)        f.metal        = metal;
    if (mint)         f.mint_ar      = mint;
    if (ruler)        f.ruler_ar     = ruler;
    if (coinTypeTag)  f.coin_type_tag = coinTypeTag;
    if (yahFrom)      f.yah_from    = parseInt(yahFrom);
    if (yahTo)        f.yah_to      = parseInt(yahTo);

    let orderBy = 'id';
    if (sort === 'oldest') orderBy = 'yah';
    if (sort === 'newest') orderBy = 'yah';

    getIslamicCoins(f, page, PER_PAGE).then(({ data, count }) => {
      let sorted = data;
      if (sort === 'newest') sorted = [...data].sort((a, b) => parseInt(b.yah || '0') - parseInt(a.yah || '0'));
      else if (sort === 'oldest') sorted = [...data].sort((a, b) => parseInt(a.yah || '9999') - parseInt(b.yah || '9999'));
      void orderBy;
      setCoins(sorted);
      setTotal(count);
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, denomination, dynasty, metal, mint, ruler, coinTypeTag, yahFrom, yahTo, sort, page]);

  useEffect(() => {
    clearTimeout(queryRef.current);
    queryRef.current = setTimeout(doFetch, 300);
    return () => clearTimeout(queryRef.current);
  }, [doFetch]);

  const clearAll = () => {
    setQuery(''); setDenomination(''); setDynasty(''); setMetal('');
    setMint(''); setRuler('');
    setCoinTypeTag(''); setYahFrom(''); setYahTo(''); setSort('default'); setPage(1);
  };

  const activeCount = [denomination, dynasty, metal, mint, ruler, coinTypeTag, yahFrom, yahTo].filter(Boolean).length;
  const totalPages  = Math.ceil(total / PER_PAGE);

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: isAr ? 'العملات الإسلامية — أرابيزماتيكا' : 'Islamic Coins — Arabismatica',
    numberOfItems: 47303,
    url: `https://arabismatica.arabcollector.com/${locale}/islamic`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-[1440px] mx-auto">

        {/* ── SEARCH ───────────────────────────────────────────────────── */}
        <div className="border-b border-gold-700/15 bg-white/50 py-3">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-4 text-gold-500/50" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={isAr ? 'ابحث بالاسم، دار الضرب، الحاكم، المرجع...' : 'Search by name, mint, ruler, reference...'}
              className="w-full text-[14px] ps-11 pe-4 py-3 rounded-xl border border-gold-700/25 bg-parch-cream outline-none focus:border-gold-500 shadow-sm font-cairo"
            />
          </div>
        </div>

        {/* ── FILTER ROW 1 ─────────────────────────────────────────────── */}
        <div className="bg-parch sticky top-[167px] z-30 border-b border-gold-700/15 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">

            {/* Dynasty */}
            <select value={dynasty} onChange={e => { setDynasty(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer max-w-[180px]">
              <option value="">{isAr ? 'كل السلالات' : 'All Dynasties'}</option>
              {filters.dynasties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Metal */}
            <select value={metal} onChange={e => { setMetal(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
              <option value="">{isAr ? 'كل المعادن' : 'All Metals'}</option>
              {filters.metals.map(m => (
                <option key={m} value={m}>{isAr ? (METALS_AR[m] ?? m) : m}</option>
              ))}
            </select>

            {/* Denomination */}
            <select value={denomination} onChange={e => { setDenomination(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer max-w-[160px]">
              {DENOM_OPTIONS.map(d => (
                <option key={d.key} value={d.key}>{isAr ? d.labelAr : d.labelEn}</option>
              ))}
            </select>

            {/* Mint */}
            <select value={mint} onChange={e => { setMint(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer max-w-[160px]">
              <option value="">{isAr ? 'كل دور الضرب' : 'All Mints'}</option>
              {filters.mints.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            {/* Ruler */}
            <select value={ruler} onChange={e => { setRuler(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer max-w-[160px]">
              <option value="">{isAr ? 'كل الحكام' : 'All Rulers'}</option>
              {filters.rulers.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* More filters toggle */}
            <button
              onClick={() => setMoreFilters(!moreFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg border transition-colors
                ${moreFilters ? 'border-gold-500 bg-parch-dark text-ink' : 'border-gold-700/30 bg-parch-cream text-ink/70 hover:border-gold-500'}`}>
              <SlidersHorizontal size={12} />
              {isAr ? 'فلاتر إضافية' : 'More filters'}
              {moreFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {/* Results count */}
            <span className="text-[11px] text-ink/40 ms-auto">
              {total.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : 'coins'}
            </span>

            {/* Sort */}
            <select value={sort} onChange={e => { setSort(e.target.value as typeof sort); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
              <option value="default">{isAr ? 'الافتراضي' : 'Default'}</option>
              <option value="oldest">{isAr ? 'الأقدم هجرياً' : 'Oldest AH'}</option>
              <option value="newest">{isAr ? 'الأحدث هجرياً' : 'Newest AH'}</option>
            </select>

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

        {/* ── FILTER ROW 2 (expandable) ────────────────────────────────── */}
        {moreFilters && (
          <div className="border-b border-gold-700/10 bg-parch-cream/60 px-4 py-3 flex flex-wrap items-center gap-4">
            {/* Year AH range */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">
                {isAr ? 'هجري:' : 'Year AH:'}
              </span>
              <input value={yahFrom} onChange={e => { setYahFrom(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'من' : 'From'}
                className="w-20 text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
              <span className="text-ink/30 text-[11px]">—</span>
              <input value={yahTo} onChange={e => { setYahTo(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'إلى' : 'To'}
                className="w-20 text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
            </div>
            {/* Coin type pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">
                {isAr ? 'النوع:' : 'Type:'}
              </span>
              {COIN_TYPE_PILLS.map(p => (
                <button key={p.key}
                  onClick={() => { setCoinTypeTag(coinTypeTag === p.key ? '' : p.key); setPage(1); }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all
                    ${coinTypeTag === p.key
                      ? 'bg-gold-500 border-gold-500 text-ink font-semibold'
                      : 'border-gold-700/25 text-ink/50 hover:border-gold-500/50 hover:text-ink/70'}`}>
                  {isAr ? p.labelAr : p.labelEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIVE FILTER PILLS ──────────────────────────────────────── */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2">
            {denomination && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {isAr ? DENOM_OPTIONS.find(d => d.key === denomination)?.labelAr : denomination}
                <button onClick={() => { setDenomination(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {dynasty && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {dynasty}
                <button onClick={() => { setDynasty(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {metal && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {isAr ? (METALS_AR[metal] ?? metal) : metal}
                <button onClick={() => { setMetal(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {mint && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {mint}
                <button onClick={() => { setMint(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {ruler && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {ruler}
                <button onClick={() => { setRuler(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {coinTypeTag && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {coinTypeTag}
                <button onClick={() => { setCoinTypeTag(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {(yahFrom || yahTo) && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {yahFrom || '?'}–{yahTo || '?'} هـ
                <button onClick={() => { setYahFrom(''); setYahTo(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
          </div>
        )}

        {/* ── COIN GRID ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {loading
            ? Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)
            : coins.map(coin => (
                <CoinCard
                  key={coin.id}
                  coin={coin as unknown as Coin}
                  locale={locale}
                  view="grid"
                  onClick={() => {}}
                />
              ))}
        </div>

        {!loading && coins.length === 0 && (
          <div className="text-center py-12 text-amber-600/60 text-[13px]">
            {isAr ? 'لا توجد نتائج تطابق البحث' : 'No coins match your search'}
          </div>
        )}

        {/* ── PAGINATION ───────────────────────────────────────────────── */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-6 pb-8 flex-wrap">
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 200, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="text-[12px] px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 disabled:opacity-30 hover:bg-amber-50">
              {isAr ? '→' : '←'}
            </button>

            {/* Page numbers */}
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

        {/* ── BACK TO MAIN ─────────────────────────────────────────────── */}
        <div className="py-6 border-t border-amber-100">
          <Link href={`/${locale}`}
            className="inline-flex items-center gap-2 text-[13px] text-amber-700 hover:text-amber-900 transition-colors">
            {isAr ? '← العودة إلى الكتالوج الرئيسي' : '← Back to main catalogue'}
          </Link>
        </div>
      </div>
    </>
  );
}
