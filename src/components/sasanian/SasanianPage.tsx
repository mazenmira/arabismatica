'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp, LayoutGrid, List, FileDown } from 'lucide-react';
import { getSasanianCoins, getSasanianFilters } from '@/lib/coinsApi';
import type { CoinRow, SasanianCoinFilters, SasanianFilters } from '@/lib/coinsApi';
import ComboFilter from '@/components/ui/ComboFilter';
import type { ComboOption } from '@/components/ui/ComboFilter';
import CoinCard from '@/components/catalogue/CoinCard';
import CoinModal from '@/components/catalogue/CoinModal';
import { useDarkMode } from '@/lib/darkModeContext';
import type { Coin } from '@/types/coin';

const METALS_AR: Record<string, string> = {
  Gold: 'ذهب', Silver: 'فضة', Bronze: 'برونز', Billon: 'بليون',
  Lead: 'رصاص', Copper: 'نحاس', 'Fourrée': 'مطلي',
};

const TOP_MINTS = [
  { en: 'Gundeshapur', ar: 'جنديشاپور' },
  { en: 'Ray',         ar: 'الري' },
  { en: 'Bishapur',    ar: 'بيشابور' },
  { en: 'Merv',        ar: 'مرو' },
  { en: 'Ctesiphon',   ar: 'المدائن' },
  { en: 'Nishapur',    ar: 'نيسابور' },
];

const TOP_RULERS = [
  { en: 'Khosrow II', ar: 'خسرو الثاني' },
  { en: 'Khosrow I',  ar: 'خسرو الأول' },
  { en: 'Kavad I',    ar: 'قباد الأول' },
  { en: 'Bahram V',   ar: 'بهرام الخامس' },
  { en: 'Hormizd IV', ar: 'هرمز الرابع' },
];

const DENOMINATIONS = ['Drachm', 'Obol', 'Half-Drachm', 'Double-Drachm'];

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

export default function SasanianPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const { darkMode } = useDarkMode();

  const [query,        setQuery]        = useState('');
  const [ruler,        setRuler]        = useState('');
  const [mint,         setMint]         = useState('');
  const [metal,        setMetal]        = useState('');
  const [denomination, setDenomination] = useState('');
  const [yceFrom,      setYceFrom]      = useState('');
  const [yceTo,        setYceTo]        = useState('');
  const [moreFilters,  setMoreFilters]  = useState(false);
  const [page,         setPage]         = useState(1);
  const [view,         setView]         = useState<'grid' | 'list'>('grid');

  const [coins,        setCoins]        = useState<CoinRow[]>([]);
  const [total,        setTotal]        = useState(7995);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [metals,       setMetals]       = useState<string[]>([]);
  const queryRef   = useRef<NodeJS.Timeout>();
  const ssFilters  = useRef<SasanianFilters | null>(null);

  useEffect(() => {
    getSasanianFilters()
      .then(f => {
        ssFilters.current = f;
        setMetals(f.metals?.length ? f.metals : ['Gold','Silver','Bronze','Billon','Lead','Copper']);
      })
      .catch(() => setMetals(['Gold','Silver','Bronze','Billon','Lead','Copper']));
  }, []);

  // ── ComboFilter loaders — sorted by coin count descending ──────────────────
  const loadMints = useCallback(async (q: string): Promise<ComboOption[]> => {
    const all = ssFilters.current?.mints ?? [];
    const lower = q.toLowerCase();
    return all
      .filter(r => !q || r.en.toLowerCase().includes(lower) || (r.ar ?? '').includes(q))
      .slice(0, 50)
      .map(r => ({ value: r.en, label: isAr && r.ar ? r.ar : r.en }));
  }, [isAr]);

  const loadRulers = useCallback(async (q: string): Promise<ComboOption[]> => {
    const all = ssFilters.current?.rulers ?? [];
    const lower = q.toLowerCase();
    return all
      .filter(r => !q || r.en.toLowerCase().includes(lower) || (r.ar ?? '').includes(q))
      .slice(0, 50)
      .map(r => ({ value: r.en, label: isAr && r.ar ? r.ar : r.en }));
  }, [isAr]);

  // ── Fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    const f: SasanianCoinFilters = {};
    if (query.trim()) f.query       = query.trim();
    if (ruler)        f.ruler       = ruler;
    if (mint)         f.mint        = mint;
    if (metal)        f.metal       = metal;
    if (denomination) f.denomination = denomination;
    if (yceFrom)      f.yce_from   = parseInt(yceFrom);
    if (yceTo)        f.yce_to     = parseInt(yceTo);

    const timer = setTimeout(() => {
      getSasanianCoins(f, page, PER_PAGE).then(({ data, count }) => {
        setCoins(data);
        setTotal(count);
        setLoading(false);
      }).catch(err => {
        console.error('[Sasanian fetch]', err);
        setFetchError(true);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ruler, mint, metal, denomination, yceFrom, yceTo, page]);

  const clearAll = () => {
    setQuery(''); setRuler(''); setMint(''); setMetal('');
    setDenomination(''); setYceFrom(''); setYceTo(''); setPage(1);
    setFetchError(false);
  };

  const activeCount = [ruler, mint, metal, denomination, yceFrom, yceTo].filter(Boolean).length;

  const downloadPDF = () => {
    const METALS_AR_LOCAL: Record<string, string> = { Gold: 'ذهب', Silver: 'فضة', Bronze: 'برونز', Billon: 'بليون', Lead: 'رصاص', Copper: 'نحاس' };
    const rows = coins.slice(0, 500).map(c => {
      const name = isAr ? ((c as unknown as Record<string,string>).nar || c.name) : c.name;
      const year = c.yce ? c.yce + ' CE' : '—';
      return `<tr><td dir="${isAr ? 'rtl' : 'ltr'}">${name}</td><td>${year}</td><td>${isAr ? (METALS_AR_LOCAL[c.metal] ?? c.metal) : c.metal || '—'}</td><td>${c.mint || '—'}</td><td>${c.ruler || '—'}</td></tr>`;
    }).join('');
    const title   = isAr ? 'نتائج البحث — العملات الساسانية' : 'Search Results — Sasanian Coins';
    const headers = isAr ? ['الاسم','السنة','المعدن','دار الضرب','الحاكم'] : ['Name','Year CE','Metal','Mint','Ruler'];
    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-AU');
    const html = `<!DOCTYPE html><html dir="${isAr?'rtl':'ltr'}"><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:serif;font-size:11px;color:#1a0e05;padding:24px}h1{font-size:20px;color:#8B6D2E;margin-bottom:4px}.meta{font-size:10px;color:#888;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#1a0e05;color:#F0E8D4;padding:6px 8px;text-align:${isAr?'right':'left'};font-size:10px}td{padding:5px 8px;border-bottom:1px solid #e8dfc8}tr:nth-child(even){background:#faf6ee}</style>
</head><body><h1>${title}</h1><div class="meta">${date} · ${total.toLocaleString()} ${isAr?'عملة':'coins'}</div>
<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) { win.onload = () => { win.print(); setTimeout(() => URL.revokeObjectURL(url), 3000); }; }
  };
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

        {/* ── SEARCH ────────────────────────────────────────────────────── */}
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

        {/* ── FILTER ROW ────────────────────────────────────────────────── */}
        <div className="bg-parch sticky top-[167px] z-30 border-b border-gold-700/15 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">

            {/* Ruler — ComboFilter */}
            <ComboFilter
              placeholder={isAr ? 'كل الحكام' : 'All Rulers'}
              value={ruler}
              onChange={v => { setRuler(v); setPage(1); }}
              loadOptions={loadRulers}
            />

            {/* Mint — ComboFilter */}
            <ComboFilter
              placeholder={isAr ? 'كل دور الضرب' : 'All Mints'}
              value={mint}
              onChange={v => { setMint(v); setPage(1); }}
              loadOptions={loadMints}
            />

            {/* Metal */}
            <select value={metal} onChange={e => { setMetal(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
              <option value="">{isAr ? 'كل المعادن' : 'All Metals'}</option>
              {metals.map(m => <option key={m} value={m}>{isAr ? (METALS_AR[m] ?? m) : m}</option>)}
            </select>

            {/* Denomination */}
            <select value={denomination} onChange={e => { setDenomination(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
              <option value="">{isAr ? 'كل الأنواع' : 'All Types'}</option>
              {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Date toggle */}
            <button
              onClick={() => setMoreFilters(!moreFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg border transition-colors
                ${moreFilters ? 'border-gold-500 bg-parch-dark text-ink' : 'border-gold-700/30 bg-parch-cream text-ink/70 hover:border-gold-500'}`}>
              <SlidersHorizontal size={12} />
              {isAr ? 'التاريخ' : 'Date'}
              {moreFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            <div className="flex items-center gap-2 ms-auto">
              <span className="text-[11px] text-ink/40">
                {total.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : 'coins'}
              </span>
              {/* View toggle */}
              <div className="flex border border-gold-700/30 rounded-lg overflow-hidden">
                <button onClick={() => setView('grid')}
                  className={`px-2 py-1.5 transition-colors ${view === 'grid' ? 'bg-gold-500/20 text-ink' : 'bg-parch-cream text-ink/40 hover:text-ink/70'}`}>
                  <LayoutGrid size={13} />
                </button>
                <button onClick={() => setView('list')}
                  className={`px-2 py-1.5 transition-colors ${view === 'list' ? 'bg-gold-500/20 text-ink' : 'bg-parch-cream text-ink/40 hover:text-ink/70'}`}>
                  <List size={13} />
                </button>
              </div>
              {/* PDF */}
              <button onClick={downloadPDF}
                className="flex items-center gap-1 text-[11px] text-ink/50 hover:text-ink border border-gold-700/25 rounded-lg px-2 py-1.5 transition-colors"
                title={isAr ? 'تصدير PDF' : 'Export PDF'}>
                <FileDown size={13} />
              </button>
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

        {/* ── EXPANDED: year range + top mint pills ─────────────────────── */}
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">
                {isAr ? 'الحكام:' : 'Top rulers:'}
              </span>
              {TOP_RULERS.map(r => (
                <button key={r.en}
                  onClick={() => { setRuler(ruler === r.en ? '' : r.en); setPage(1); }}
                  className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 transition-all font-cairo
                    ${ruler === r.en
                      ? 'bg-gold-500 border-gold-500 text-ink font-semibold'
                      : 'border-gold-700/25 text-ink/50 hover:border-gold-500/60 hover:text-ink/70'}`}>
                  {isAr ? r.ar : r.en}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">
                {isAr ? 'دور الضرب:' : 'Top mints:'}
              </span>
              {TOP_MINTS.map(m => (
                <button key={m.en}
                  onClick={() => { setMint(mint === m.en ? '' : m.en); setPage(1); }}
                  className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 transition-all font-cairo
                    ${mint === m.en
                      ? 'bg-gold-500 border-gold-500 text-ink font-semibold'
                      : 'border-gold-700/25 text-ink/50 hover:border-gold-500/60 hover:text-ink/70'}`}>
                  {isAr ? m.ar : m.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIVE FILTER TAGS ────────────────────────────────────────── */}
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
            {denomination && (
              <span className="flex items-center gap-1 text-[11px] bg-gold-500/15 text-ink/70 rounded-full px-2.5 py-1 border border-gold-700/25">
                {denomination}
                <button onClick={() => { setDenomination(''); setPage(1); }}><X size={10} /></button>
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

        {/* ── COIN GRID / LIST ──────────────────────────────────────────── */}
        {loading ? (
          <div className={view === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4 pt-4'
            : 'flex flex-col gap-2 px-4 pt-4'}>
            {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : fetchError ? (
          <div className="text-center py-12 text-red-500/70 text-[13px]">
            {isAr ? 'خطأ في تحميل البيانات — تحقق من الاتصال' : 'Failed to load coins — check your connection'}
          </div>
        ) : coins.length === 0 ? (
          <div className="text-center py-12 text-amber-600/60 text-[13px]">
            {isAr ? 'لا توجد نتائج تطابق البحث' : 'No coins match your search'}
          </div>
        ) : (
          <div className={view === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 px-4 pt-4'
            : 'flex flex-col gap-2 px-4 pt-4'}>
            {coins.map(coin => (
              <CoinCard
                key={coin.id}
                coin={coin as unknown as Coin}
                locale={locale}
                view={view}
                onClick={() => setSelectedCoin(coin as unknown as Coin)}
              />
            ))}
          </div>
        )}

        {/* ── PAGINATION ────────────────────────────────────────────────── */}
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

        {/* ── BACK ──────────────────────────────────────────────────────── */}
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
