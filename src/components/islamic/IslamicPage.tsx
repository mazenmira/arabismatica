'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { getIslamicCoins, getIslamicFilters } from '@/lib/coinsApi';
import type { CoinRow, IslamicCoinFilters } from '@/lib/coinsApi';

const DENOMINATIONS = [
  { key: '',             labelEn: 'All',          labelAr: 'الكل',           color: 'bg-amber-700' },
  { key: 'Dirham',       labelEn: 'Dirham',       labelAr: 'درهم',           color: 'bg-blue-700' },
  { key: 'Dinar',        labelEn: 'Dinar',        labelAr: 'دينار',          color: 'bg-yellow-700' },
  { key: 'Fals/Fils',    labelEn: 'Fals/Fils',    labelAr: 'فلس',            color: 'bg-green-800' },
  { key: 'Early Dirham', labelEn: 'Early Dirham', labelAr: 'درهم مبكر',      color: 'bg-purple-800' },
  { key: 'Fractional',   labelEn: 'Fractional',   labelAr: 'كسر',            color: 'bg-rose-800' },
  { key: 'Anonymous',    labelEn: 'Anonymous',    labelAr: 'مجهول',          color: 'bg-slate-700' },
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

function CoinCard({ coin, locale }: { coin: CoinRow; locale: string }) {
  const isAr = locale === 'ar';
  const name  = (isAr && coin.nar) ? coin.nar : coin.name;
  const metal = isAr ? (METALS_AR[coin.metal] ?? coin.metal) : coin.metal;
  return (
    <Link href={`/${locale}/catalogue/${coin.id}`}
      className="group flex flex-col bg-white rounded-xl border border-amber-100 hover:border-amber-300 overflow-hidden transition-all hover:shadow-md">
      {coin.o ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coin.o} alt={name}
          className="w-full h-28 object-contain bg-amber-50 group-hover:scale-105 transition-transform p-1"
          style={{ borderBottom: '1px solid #F0E8D4' }} />
      ) : (
        <div className="w-full h-28 bg-amber-50 flex items-center justify-center text-3xl">🪙</div>
      )}
      <div className="p-2.5">
        <div className="text-[11px] font-amiri text-amber-900 leading-tight line-clamp-2 mb-1">{name}</div>
        {coin.ruler && <div className="text-[9px] text-amber-600 truncate mb-0.5">{coin.ruler}</div>}
        <div className="flex items-center gap-1 flex-wrap">
          {coin.yce  && <span className="text-[9px] text-amber-600">{coin.yce}</span>}
          {coin.yah  && <span className="text-[9px] text-amber-500">{coin.yah}هـ</span>}
          {coin.denomination && (
            <span className="text-[9px] text-amber-700 border border-amber-300 rounded px-1 font-medium">
              {isAr
                ? { Dirham: 'درهم', Dinar: 'دينار', 'Fals/Fils': 'فلس', 'Early Dirham': 'درهم مبكر' }[coin.denomination] ?? coin.denomination
                : coin.denomination}
            </span>
          )}
          {metal && <span className="text-[9px] text-amber-500 border border-amber-200 rounded px-1">{metal}</span>}
        </div>
      </div>
    </Link>
  );
}

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
        <div className="py-4">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-4 text-amber-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder={isAr ? 'ابحث بالاسم، الحاكم، دار الضرب...' : 'Search by name, ruler, mint...'}
              className="w-full text-[14px] ps-11 pe-4 py-3 rounded-xl border border-amber-200 bg-white outline-none focus:border-amber-400 shadow-sm"
            />
          </div>
        </div>

        {/* ── DENOMINATION BAR ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-none">
          {DENOMINATIONS.map(d => (
            <button key={d.key}
              onClick={() => { setDenomination(denomination === d.key ? '' : d.key); setPage(1); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border
                ${denomination === d.key
                  ? `${d.color} text-white border-transparent`
                  : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400'}`}>
              <span>{isAr ? d.labelAr : d.labelEn}</span>
            </button>
          ))}
        </div>

        {/* ── FILTER ROW 1 ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pb-3 flex-wrap">
          {/* Dynasty */}
          <select value={dynasty} onChange={e => { setDynasty(e.target.value); setPage(1); }}
            className="text-[12px] px-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400 max-w-[200px]">
            <option value="">{isAr ? 'كل السلالات' : 'All dynasties'}</option>
            {filters.dynasties.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Metal */}
          <select value={metal} onChange={e => { setMetal(e.target.value); setPage(1); }}
            className="text-[12px] px-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400">
            <option value="">{isAr ? 'كل المعادن' : 'All metals'}</option>
            {filters.metals.map(m => (
              <option key={m} value={m}>{isAr ? (METALS_AR[m] ?? m) : m}</option>
            ))}
          </select>

          {/* Mint */}
          <select value={mint} onChange={e => { setMint(e.target.value); setPage(1); }}
            className="text-[12px] px-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400 max-w-[180px]">
            <option value="">{isAr ? 'كل دور الضرب' : 'All mints'}</option>
            {filters.mints.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Ruler */}
          <select value={ruler} onChange={e => { setRuler(e.target.value); setPage(1); }}
            className="text-[12px] px-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400 max-w-[180px]">
            <option value="">{isAr ? 'كل الحكام' : 'All rulers'}</option>
            {filters.rulers.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* More filters toggle */}
          <button
            onClick={() => setMoreFilters(!moreFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] rounded-lg border transition-colors
              ${moreFilters ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-amber-200 bg-white text-amber-600 hover:border-amber-400'}`}>
            <SlidersHorizontal size={13} />
            {isAr ? 'فلاتر إضافية' : 'More filters'}
            {moreFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {/* Active filter count */}
          {activeCount > 0 && (
            <button onClick={clearAll}
              className="flex items-center gap-1 text-[11px] text-amber-600 border border-amber-200 rounded-full px-2.5 py-1.5 hover:bg-amber-50">
              <X size={11} />
              {isAr ? `مسح (${activeCount})` : `Clear (${activeCount})`}
            </button>
          )}
        </div>

        {/* ── FILTER ROW 2 (expandable) ────────────────────────────────── */}
        {moreFilters && (
          <div className="border border-amber-100 rounded-xl bg-amber-50/50 p-4 mb-4 space-y-3">
            {/* Year AH range */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-amber-700 font-medium shrink-0">
                {isAr ? 'السنة الهجرية:' : 'Year AH:'}
              </span>
              <input value={yahFrom} onChange={e => { setYahFrom(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'من' : 'From'}
                className="w-20 text-[12px] px-2 py-1.5 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400" />
              <span className="text-amber-400">–</span>
              <input value={yahTo} onChange={e => { setYahTo(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'إلى' : 'To'}
                className="w-20 text-[12px] px-2 py-1.5 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400" />
            </div>
            {/* Coin type pills */}
            <div>
              <span className="text-[12px] text-amber-700 font-medium me-2">
                {isAr ? 'نوع العملة:' : 'Coin type:'}
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {COIN_TYPE_PILLS.map(p => (
                  <button key={p.key}
                    onClick={() => { setCoinTypeTag(coinTypeTag === p.key ? '' : p.key); setPage(1); }}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all
                      ${coinTypeTag === p.key
                        ? 'bg-amber-700 border-amber-600 text-white'
                        : 'border-amber-300 text-amber-700 hover:border-amber-500'}`}>
                    {isAr ? p.labelAr : p.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVE FILTER PILLS ──────────────────────────────────────── */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {denomination && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 border border-amber-200">
                {isAr ? DENOMINATIONS.find(d => d.key === denomination)?.labelAr : denomination}
                <button onClick={() => { setDenomination(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {dynasty && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 border border-amber-200">
                {dynasty}
                <button onClick={() => { setDynasty(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {metal && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 border border-amber-200">
                {isAr ? (METALS_AR[metal] ?? metal) : metal}
                <button onClick={() => { setMetal(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {mint && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 border border-amber-200">
                {mint}
                <button onClick={() => { setMint(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {ruler && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 border border-amber-200">
                {ruler}
                <button onClick={() => { setRuler(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {coinTypeTag && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 border border-amber-200">
                {coinTypeTag}
                <button onClick={() => { setCoinTypeTag(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
            {(yahFrom || yahTo) && (
              <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 border border-amber-200">
                {yahFrom || '?'}–{yahTo || '?'} هـ
                <button onClick={() => { setYahFrom(''); setYahTo(''); setPage(1); }}><X size={10} /></button>
              </span>
            )}
          </div>
        )}

        {/* ── RESULTS BAR ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-[12px] text-amber-600/70">
            {total.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : 'coins'}
          </span>
          <div className="flex items-center gap-2">
            <select value={sort} onChange={e => { setSort(e.target.value as typeof sort); setPage(1); }}
              className="text-[12px] px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-400">
              <option value="default">{isAr ? 'الافتراضي' : 'Default'}</option>
              <option value="oldest">{isAr ? 'الأقدم هجرياً' : 'Oldest AH'}</option>
              <option value="newest">{isAr ? 'الأحدث هجرياً' : 'Newest AH'}</option>
            </select>
          </div>
        </div>

        {/* ── COIN GRID ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {loading
            ? Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)
            : coins.map(coin => <CoinCard key={coin.id} coin={coin} locale={locale} />)}
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
