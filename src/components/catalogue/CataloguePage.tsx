// v3.1
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Grid3X3, List, X, ArrowUp, FileDown, Search } from 'lucide-react';
import CoinCard from './CoinCard';
import CoinModal from './CoinModal';
import { useCollection } from '@/hooks/useCollection';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/lib/authContext';
import { useDarkMode } from '@/lib/darkModeContext';
import type { Coin, FilterState } from '@/types/coin';
import { COUNTRIES, COUNTRY_FLAGS } from '@/lib/coins';

// ── Supabase-powered data loading ─────────────────────────
import { getCoins, searchCoins } from '@/lib/coinsApi';
import type { CoinFilters } from '@/lib/coinsApi';








const METAL_OPTIONS = [
  'Gold','Silver','Copper','Bronze','Cupro-Nickel',
  'Bimetallic','Aluminium','Billon','Brass','Nickel','Steel',
];

interface EraOption {
  value: string;
  label_ar: string;
  label_en: string;
  label_de: string;
  yceFrom: number;
  yceTo: number;
  ccOnly?: string[];
}
const ERA_OPTIONS: EraOption[] = [
  { value: 'ottoman',         label_ar: '🌙 العهد العثماني',       label_en: '🌙 Ottoman Era',          label_de: '🌙 Osmanische Zeit',       yceFrom: 1299, yceTo: 1918 },
  { value: 'muhammad_ali',    label_ar: '👑 أسرة محمد علي',        label_en: '👑 Muhammad Ali Dynasty',  label_de: '👑 Muhammad-Ali-Dynastie', yceFrom: 1805, yceTo: 1882, ccOnly: ['EG'] },
  { value: 'hejaz_najd',      label_ar: '⚔️ الحجاز ونجد',          label_en: '⚔️ Hejaz & Najd',          label_de: '⚔️ Hedschas & Nadschd',    yceFrom: 1916, yceTo: 1931, ccOnly: ['SA'] },
  { value: 'french_colonial', label_ar: '🇫🇷 الحماية الفرنسية',    label_en: '🇫🇷 French Colonial',       label_de: '🇫🇷 Französisches Mandat',  yceFrom: 1830, yceTo: 1962, ccOnly: ['MA','TN','DZ','LB','SY'] },
  { value: 'arab_kingdoms',   label_ar: '👑 الممالك العربية',       label_en: '👑 Arab Kingdoms',          label_de: '👑 Arabische Königreiche',  yceFrom: 1920, yceTo: 1969, ccOnly: ['EG','IQ','LY','JO','SA','MA'] },
  { value: 'republic_era',    label_ar: '🏛️ عهد الجمهوريات',       label_en: '🏛️ Republic Era',           label_de: '🏛️ Republikanische Zeit',   yceFrom: 1952, yceTo: 2026 },
  { value: 'gulf_states',     label_ar: '🛢️ دول الخليج',           label_en: '🛢️ Gulf States',            label_de: '🛢️ Golfstaaten',            yceFrom: 1960, yceTo: 2026, ccOnly: ['AE','KW','QA','OM','QD'] },
  { value: 'imamate',         label_ar: '📜 الإمامة',              label_en: '📜 Imamate',                label_de: '📜 Imamat',                 yceFrom: 1800, yceTo: 1970, ccOnly: ['YE','OM'] },
];


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fuseSearch(coins: Coin[], query: string): Coin[] {
  if (!query.trim()) return coins;
  const q = query.toLowerCase();
  return coins.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.nar?.toLowerCase().includes(q) ||
    c.dyn?.toLowerCase().includes(q) ||
    c.km?.toLowerCase().includes(q) ||
    c.nref?.toLowerCase().includes(q) ||
    c.yce?.includes(q) ||
    c.yah?.includes(q) ||
    c.metal?.toLowerCase().includes(q) ||
    c.co?.toLowerCase().includes(q) ||
    c.co_ar?.includes(q)
  );
}

interface CataloguePageProps {
  locale: string;
}

export default function CataloguePage({ locale }: CataloguePageProps) {
  const t = useTranslations();
  const isAr = locale === 'ar';
  const { user, setAuthOpen } = useAuth();
  const { darkMode } = useDarkMode();

  const [filters, setFilters] = useState<FilterState>({
    country: 'all', era: '', metal: '', type: '', query: '',
    yearFrom: 661, yearTo: 2026,
  });
  const [page, setPage] = useState(1);

  // ── Supabase data state ──────────────────────────────────
  const [coins,       setCoins]       = useState<Coin[]>([]);
  const [totalCount,  setTotalCount]  = useState(5505);
  const [loading,     setLoading]     = useState(false);
  const PER_PAGE_SUP = 60;
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);
  // filtersOpen panel reserved for future use
  const searchRef = useRef<HTMLInputElement>(null);
  const [showBackTop, setShowBackTop]   = useState(false);

  // Local collection (localStorage fallback when not logged in)
  const [collection, setCollection] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const saved = localStorage.getItem('ac_collection');
      return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const { has: inCollection, toggle: toggleCollectionDB } = useCollection(user?.id ?? null);
  const { has: inWishlist,   toggle: toggleWishlistDB }   = useWishlist(user?.id ?? null);

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // ── Supabase fetch — runs when any filter or page changes ────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Build CoinFilters from current state
    const apiFilters: CoinFilters = {};
    if (filters.country !== 'all') {
      // Map co (English name) back to cc
      const found = COUNTRIES.find(c => c.co === filters.country || c.co_ar === filters.country);
      if (found) apiFilters.cc = found.cc;
    }
    if (filters.metal)  apiFilters.metal = filters.metal;
    if (filters.type === 'Circulation')   apiFilters.type = 'Circulation';
    if (filters.type === 'Commemorative') apiFilters.type = 'Commemorative';
    if (filters.query)  apiFilters.query = filters.query;
    if (yearFrom) apiFilters.yceFrom = parseInt(yearFrom);
    if (yearTo)   apiFilters.yceTo   = parseInt(yearTo);
    if (filters.era) {
      const era = ERA_OPTIONS.find(e => e.value === filters.era);
      if (era) {
        apiFilters.yceFrom = era.yceFrom;
        apiFilters.yceTo   = era.yceTo;
        if (era.ccOnly && !apiFilters.cc) apiFilters.ccIn = era.ccOnly;
      }
    }

    // Exclude Islamic (IS) and Sasanian (SS) from Arab catalogue — keeps count at ~5,505
    if (!apiFilters.cc && !apiFilters.ccIn) apiFilters.excludeCCs = ['IS', 'SS'];

    getCoins(apiFilters, page, PER_PAGE_SUP).then(({ data, count }) => {
      if (!cancelled) {
        setCoins(data as unknown as Coin[]);
        setTotalCount(count);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [filters, page, yearFrom, yearTo, sortBy]);

  const handleToggleCollection = async (id: string) => {
    if (user) { await toggleCollectionDB(id); return; }
    setCollection(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      try { localStorage.setItem('ac_collection', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  };

  const handleToggleWishlist = async (id: string) => {
    if (!user) { setAuthOpen(true); return; }
    await toggleWishlistDB(id);
  };

  // PDF export — builds a print-ready HTML page from filtered results
  const downloadPDF = () => {
    const isArLocal = locale === 'ar';
    const rows = coins.slice(0, 500).map(c => {
      const name  = isArLocal ? (c.nar || c.name) : c.name;
      const year  = c.yce ? c.yce + (isArLocal ? ' م' : ' CE') : '';
      const mint  = c.mint ? parseInt(c.mint).toLocaleString(isArLocal ? 'ar-EG' : 'en-US') : '—';
      const flag  = ({ EG:'🇪🇬',SA:'🇸🇦',AE:'🇦🇪',QA:'🇶🇦',IQ:'🇮🇶',JO:'🇯🇴',
                       LB:'🇱🇧',LY:'🇱🇾',MA:'🇲🇦',OM:'🇴🇲',PS:'🇵🇸',SD:'🇸🇩',
                       SY:'🇸🇾',DZ:'🇩🇿',TN:'🇹🇳',YE:'🇾🇪',KW:'🇰🇼',MR:'🇲🇷' } as Record<string,string>)[c.cc] ?? '';
      return `<tr>
        <td>${flag} ${isArLocal ? c.co_ar : c.co}</td>
        <td dir="rtl">${name}</td>
        <td>${c.dyn}</td>
        <td>${year}</td>
        <td>${c.metal}</td>
        <td>${mint}</td>
        <td>${c.km || '—'}</td>
      </tr>`;
    }).join('');

    const title   = isArLocal ? 'نتائج البحث — المقتني العربي' : 'Search Results — The Arab Collector';
    const headers = isArLocal
      ? ['الدولة','الاسم','الأسرة','السنة','المعدن','المضروب','KM#']
      : ['Country','Name','Dynasty','Year','Metal','Mintage','KM#'];
    const date = new Date().toLocaleDateString(isArLocal ? 'ar-EG' : 'en-AU');
    const total = totalCount;

    const html = `<!DOCTYPE html>
<html dir="${isArLocal ? 'rtl' : 'ltr'}" lang="${locale}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Amiri', serif; font-size: 11px; color: #1a0e05; background: #fff; padding: 24px; }
  h1 { font-size: 20px; color: #8B6D2E; margin-bottom: 4px; }
  .meta { font-size: 10px; color: #888; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a0e05; color: #F0E8D4; padding: 6px 8px; text-align: ${isArLocal ? 'right' : 'left'}; font-size: 10px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e8dfc8; font-size: 11px; }
  tr:nth-child(even) { background: #faf6ee; }
  .footer { margin-top: 16px; font-size: 9px; color: #aaa; text-align: center; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">${date} · ${total} ${isArLocal ? 'عملة' : 'coins'}${total > 500 ? (isArLocal ? ' (أول 500 نتيجة)' : ' (first 500 results)') : ''}</div>
<table>
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">arabismatica.arabcollector.com · The Arab Collector © ${new Date().getFullYear()}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      };
    }
  };

  // Close autocomplete on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node))
        setShowAutocomplete(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    if (!filters.query || filters.query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      searchCoins(filters.query, 8).then(results => {
        setSuggestions(results.map(c => c.name).filter(Boolean));
      }).catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [filters.query]);

  const updateFilter = useCallback((key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  // Filtering is now done server-side via Supabase — no client-side memo needed

  // With Supabase: coins ARE already paged, count comes from server
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE_SUP));
  const paged = coins;

  const hasActiveFilters = filters.country !== 'all' || filters.era || filters.metal || filters.type || filters.query || yearFrom !== '' || yearTo !== '' || sortBy !== 'default';

  const clearFilters = () => {
    setFilters({ country: 'all', era: '', metal: '', type: '', query: '', yearFrom: 661, yearTo: 2026 });
    setYearFrom(''); setYearTo(''); setSortBy('default');
    setPage(1);
  };

  // Country counts — static from known totals (fast, no extra queries)
  const COUNTRY_TOTALS: Record<string, number> = {
    'Islamic':47303,'Egypt':1186,'Morocco':1120,'Tunisia':858,'Yemen':270,
    'Oman':255,'Sudan':228,'Libya':202,'Iraq':195,'Algeria':178,
    'Saudi Arabia':126,'UAE':163,'Jordan':130,'Lebanon':114,'Kuwait':98,
    'Palestine':14,'Mauritania':20,'Qatar':136,'Qatar & Dubai':5,'Comoros':34,
  };
  const countryCounts = COUNTRY_TOTALS;
  const filteredTotal = totalCount;

  return (
    <div className={darkMode ? 'dark' : ''} style={darkMode ? {filter:'invert(1) hue-rotate(180deg)'} : {}}>
      {/* ── SEARCH ── */}
      <div className="border-b border-gold-700/15 bg-white/50 px-4 py-3">
        <div className="max-w-[1440px] mx-auto relative" ref={autocompleteRef}>
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-4 text-gold-500/50 select-none" />
          <input
            ref={searchRef}
            type="text"
            dir={isAr ? 'rtl' : 'ltr'}
            placeholder={isAr ? 'ابحث بالاسم، KM#، المعدن، السنة...' : 'Search by name, KM#, metal, year...'}
            value={filters.query}
            onChange={e => { updateFilter('query', e.target.value); setShowAutocomplete(true); }}
            onFocus={() => setShowAutocomplete(true)}
            className="w-full text-[14px] ps-11 pe-10 py-3 rounded-xl border border-gold-700/25 bg-parch-cream outline-none focus:border-gold-500 shadow-sm font-cairo"
            autoComplete="off"
          />
          {filters.query && (
            <button onClick={() => updateFilter('query', '')}
              className="absolute top-1/2 -translate-y-1/2 end-4 text-ink/30 hover:text-ink/60">
              <X size={14} />
            </button>
          )}
          {showAutocomplete && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-parch-cream rounded-xl border border-gold-700/30 shadow-2xl overflow-hidden z-50">
              {suggestions.map((s, i) => (
                <button key={i} onMouseDown={e => e.preventDefault()}
                  onClick={() => { updateFilter('query', s); setShowAutocomplete(false); searchRef.current?.blur(); }}
                  className="w-full text-start px-4 py-2.5 text-[13px] text-ink/80 hover:bg-gold-500/10 border-b border-gold-700/10 last:border-0 transition-colors font-cairo flex items-center gap-2"
                  dir={isAr ? 'rtl' : 'ltr'}>
                  <Search size={10} className="text-gold-500/50 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* ── CONTROLS BAR ── */}
      <div className="bg-parch sticky top-[167px] z-30 border-b border-gold-700/15 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
          {/* Country filter */}
          <select
            value={filters.country}
            onChange={e => { updateFilter('country', e.target.value); setPage(1); }}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer font-medium"
          >
            <option value="all">🌍 {isAr ? 'كل الدول' : 'All Countries'} ({filteredTotal.toLocaleString()})</option>
            {COUNTRIES.map(({ cc, co, co_ar }) => {
              const count = countryCounts[co] || 0;
              if (!count) return null;
              return (
                <option key={cc} value={co}>
                  {COUNTRY_FLAGS[cc]} {isAr ? co_ar : co} ({count})
                </option>
              );
            })}
          </select>

          {/* Era (national era options) */}
          <select
            value={filters.era}
            onChange={e => updateFilter('era', e.target.value)}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
            <option value="">{t('filters.allEras')}</option>
            {ERA_OPTIONS.map(e => (
              <option key={e.value} value={e.value}>{locale === 'ar' ? e.label_ar : locale === 'de' ? e.label_de : e.label_en}</option>
            ))}
          </select>

          {/* Metal */}
          <select
            value={filters.metal}
            onChange={e => updateFilter('metal', e.target.value)}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
            <option value="">{t('filters.allMetals')}</option>
            {METAL_OPTIONS.map(m => (
              <option key={m} value={m}>{isAr ? t(`metals.${m}`) : m}</option>
            ))}
          </select>

          {/* Type pills */}
          {(['Circulation', 'Commemorative', 'has-mint'] as const).map(tp => (
            <button
              key={tp}
              onClick={() => updateFilter('type', filters.type === tp ? '' : tp)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors
                ${filters.type === tp ? 'bg-gold-500 border-gold-500 text-ink font-semibold' : 'border-gold-700/25 text-ink/50 hover:border-gold-500/50 hover:text-ink/70'}`}>
              {tp === 'Circulation' ? t('filters.circulation')
               : tp === 'Commemorative' ? t('filters.commemorative')
               : '📊 ' + t('filters.withMintage')}
            </button>
          ))}

          {/* Year range */}
          <div className="flex items-center gap-1">
            <input type="number" placeholder={isAr ? 'من' : 'From'} value={yearFrom}
              onChange={e => { setYearFrom(e.target.value); setPage(1); }}
              className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500"
              min="661" max="2026" />
            <span className="text-ink/30 text-[11px]">—</span>
            <input type="number" placeholder={isAr ? 'إلى' : 'To'} value={yearTo}
              onChange={e => { setYearTo(e.target.value); setPage(1); }}
              className="w-[70px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500"
              min="661" max="2026" />
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
            <option value="default">{isAr ? 'ترتيب افتراضي' : 'Default'}</option>
            <option value="oldest">{isAr ? 'الأقدم أولاً' : 'Oldest first'}</option>
            <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest first'}</option>
            <option value="rarest">{isAr ? 'الأندر أولاً' : 'Rarest first'}</option>
            <option value="common">{isAr ? 'الأكثر شيوعاً' : 'Most common'}</option>
            <option value="az">{isAr ? 'أبجدي' : 'A to Z'}</option>
          </select>
          {/* Results count + PDF download */}
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-[11px] text-ink/40">
              {totalCount.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {t('search.results')}
            </span>
            {totalCount > 0 && (
              <button
                onClick={downloadPDF}
                title={isAr ? 'تنزيل النتائج كـ PDF' : 'Download results as PDF'}
                className="flex items-center gap-1 text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 hover:border-gold-500/60 rounded-full px-2.5 py-1 transition-colors"
              >
                <FileDown size={11} />
                <span className="hidden sm:block">{isAr ? 'تنزيل PDF' : 'PDF'}</span>
              </button>
            )}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="text-[11px] text-gold-600 hover:text-gold-500 flex items-center gap-1 border border-gold-700/30 rounded-full px-2.5 py-1 transition-colors">
              <X size={11} /> {isAr ? 'مسح' : 'Clear'}
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center border border-gold-700/25 rounded-lg overflow-hidden">
            <button onClick={() => setView('grid')}
              className={`px-2.5 py-1.5 text-[13px] transition-colors ${view === 'grid' ? 'bg-gold-500 text-ink' : 'text-ink/40 hover:text-ink/70'}`}>
              <Grid3X3 size={13} />
            </button>
            <button onClick={() => setView('list')}
              className={`px-2.5 py-1.5 text-[13px] transition-colors ${view === 'list' ? 'bg-gold-500 text-ink' : 'text-ink/40 hover:text-ink/70'}`}>
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gold-600">
              <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[13px] font-amiri">{isAr ? 'جارٍ التحميل...' : 'Loading...'}</span>
            </div>
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-parch-dark flex items-center justify-center mx-auto mb-4 text-2xl">🔍</div>
            <h3 className="font-amiri text-xl text-ink/60 mb-2">{t('search.noResults')}</h3>
            <p className="text-[13px] text-ink/40">{t('search.noResultsHint')}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filters.country}-${filters.era}-${filters.metal}-${filters.type}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={
                view === 'grid'
                  ? 'grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                  : 'flex flex-col gap-2'
              }>
              {paged.map((coin, i) => (
                <motion.div
                  key={coin.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.012, 0.3), duration: 0.2 }}>
                  <CoinCard
                    coin={coin}
                    locale={locale}
                    view={view}
                    onClick={() => setSelectedCoin(coin)}
                    inCollection={user ? inCollection(coin.id) : collection.has(coin.id)}
                    inWishlist={user ? inWishlist(coin.id) : false}
                    onToggleCollection={(e) => { e.stopPropagation(); handleToggleCollection(coin.id); }}
                    onToggleWishlist={(e) => { e.stopPropagation(); handleToggleWishlist(coin.id); }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[12px] text-ink/60 hover:border-gold-500 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              {isAr ? '‹ السابق' : '‹ Prev'}
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors min-w-[36px]
                    ${p === page ? 'bg-gold-500 text-ink font-semibold border border-gold-500' : 'border border-gold-700/25 text-ink/50 hover:border-gold-500/50'}`}>
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gold-700/30 text-[12px] text-ink/60 hover:border-gold-500 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              {isAr ? 'التالي ›' : 'Next ›'}
            </button>
            <span className="text-[11px] text-ink/30 mx-1">
              {isAr ? `${page} / ${totalPages}` : `${page} / ${totalPages}`}
            </span>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-ink border-t border-gold-700/40 py-6 text-center">
        <div className="font-amiri text-gold-300 text-base mb-1">المقتني العربي · The Arab Collector</div>
        <p className="text-gold-600/60 text-[11px] mb-2">{t('footer.tagline')}</p>
        <p className="text-[11px] text-gold-700/50">
          {t('footer.source')} ·{' '}
          <a href="https://arabcollector.com" target="_blank" rel="noopener" className="hover:text-gold-500 transition-colors">
            arabcollector.com
          </a>
        </p>
      </footer>

      {/* Coin detail modal */}
      <AnimatePresence>
        {selectedCoin && (
          <CoinModal coin={selectedCoin} locale={locale} onClose={() => setSelectedCoin(null)} />
        )}
      </AnimatePresence>

      {/* ── BACK TO TOP ── */}
      <AnimatePresence>
        {showBackTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full bg-gold-600 hover:bg-gold-500 text-ink shadow-lg flex items-center justify-center transition-colors"
            title={locale === 'ar' ? 'العودة للأعلى' : 'Back to top'}
            aria-label="Back to top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
