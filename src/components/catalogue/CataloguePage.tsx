'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Camera, Grid3X3, List, X } from 'lucide-react';
import CoinCard from './CoinCard';
import CoinModal from './CoinModal';
import type { Coin, FilterState } from '@/types/coin';
import { COUNTRIES, COUNTRY_FLAGS } from '@/lib/coins';

// ── Stub: replace with real data import ──────────────────
// In production: import COINS from '@/data/coins.json'
import COINS_DATA from '@/data/coins.json';
const COINS = COINS_DATA as unknown as Coin[];

const PER_PAGE = 60;

const DYNASTY_PILLS = [
  { key: 'ottoman',   label_ar: 'العثمانيون',           label_en: 'Ottoman',         match: ['الدولة العثمانية', 'Ottoman'] },
  { key: 'muhali',    label_ar: 'أسرة محمد علي',        label_en: 'Muhammad Ali',    match: ['محمد علي', 'Muhammad Ali', 'أسرة'] },
  { key: 'sultanate', label_ar: 'السلطنة المصرية',      label_en: 'Sultanate',       match: ['السلطنة'] },
  { key: 'kingdom',   label_ar: 'المملكة المصرية',      label_en: 'Kingdom',         match: ['المملكة'] },
  { key: 'republic',  label_ar: 'الجمهورية',            label_en: 'Republic',        match: ['الجمهورية', 'Republic'] },
  { key: 'saudi',     label_ar: 'المملكة العربية',      label_en: 'Saudi',           match: ['سعودية', 'Saudi', 'Hejaz', 'الحجاز'] },
  { key: 'gulf',      label_ar: 'دول الخليج',           label_en: 'Gulf States',     match: ['الإمارات', 'قطر', 'الكويت', 'عُمان', 'UAE', 'Qatar', 'Kuwait', 'Oman'] },
  { key: 'maghreb',   label_ar: 'المغرب العربي',        label_en: 'Maghreb',         match: ['المغرب', 'الجزائر', 'تونس', 'ليبيا', 'Morocco', 'Algeria', 'Tunisia', 'Libya'] },
];



const METAL_OPTIONS = [
  'Gold','Silver','Copper','Bronze','Cupro-Nickel',
  'Bimetallic','Aluminium','Billon','Brass','Nickel','Steel',
];

const ERA_OPTIONS = [
  { value: '1500-1800', label_ar: '١٥٠٠–١٨٠٠', label_en: '1500–1800' },
  { value: '1800-1863', label_ar: '١٨٠٠–١٨٦٣', label_en: '1800–1863' },
  { value: '1863-1914', label_ar: '١٨٦٣–١٩١٤', label_en: '1863–1914' },
  { value: '1914-1952', label_ar: '١٩١٤–١٩٥٢', label_en: '1914–1952' },
  { value: '1952-1970', label_ar: '١٩٥٢–١٩٧٠', label_en: '1952–1970' },
  { value: '1971-2000', label_ar: '١٩٧١–٢٠٠٠', label_en: '1971–2000' },
  { value: '2001-2026', label_ar: '٢٠٠١–٢٠٢٦', label_en: '2001–2026' },
];

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

export default function CataloguePage({ locale }: { locale: string }) {
  const t = useTranslations();
  const isAr = locale === 'ar';

  const [filters, setFilters] = useState<FilterState>({
    country: 'all', era: '', metal: '', type: '', query: '',
    yearFrom: 1500, yearTo: 2026,
  });
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [dynasty, setDynasty]         = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  // filtersOpen panel reserved for future use
  const searchRef = useRef<HTMLInputElement>(null);

  // Close autocomplete on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node))
        setShowAutocomplete(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const suggestions = useMemo(() => {
    if (!filters.query || filters.query.length < 2) return [];
    const q = filters.query.toLowerCase();
    const seen = new Set<string>();
    return COINS.reduce<string[]>((acc, c) => {
      const name = c.name;
      const nar  = c.nar || '';
      for (const candidate of [name, nar]) {
        if (candidate.toLowerCase().includes(q) && !seen.has(candidate)) {
          seen.add(candidate);
          acc.push(candidate);
        }
      }
      return acc;
    }, []).slice(0, 8);
  }, [filters.query]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let result = fuseSearch(COINS, filters.query);
    if (filters.country !== 'all') result = result.filter(c => c.co === filters.country);
    if (filters.era) {
      const [a, b] = filters.era.split('-').map(Number);
      result = result.filter(c => { const y = parseInt(c.yce || '0'); return y >= a && y <= b; });
    }
    if (filters.metal) result = result.filter(c => c.metal?.toLowerCase().includes(filters.metal.toLowerCase()));
    if (filters.type === 'Circulation') result = result.filter(c => c.type === 'Circulation');
    if (filters.type === 'Commemorative') result = result.filter(c => c.type === 'Commemorative');
    if (filters.type === 'has-mint') result = result.filter(c => Boolean(c.mint));
    if (dynasty) {
      const pill = DYNASTY_PILLS.find(p => p.key === dynasty);
      if (pill) result = result.filter(c =>
        pill.match.some(m => c.dyn?.includes(m) || c.co?.includes(m) || c.co_ar?.includes(m))
      );
    }
    return result;
  }, [filters, dynasty]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const hasActiveFilters = filters.country !== 'all' || filters.era || filters.metal || filters.type || filters.query;

  const clearFilters = () => {
    setFilters({ country: 'all', era: '', metal: '', type: '', query: '', yearFrom: 1500, yearTo: 2026 }); setDynasty('');
    setPage(1);
  };

  // Country counts
  const countryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    COINS.forEach(c => { map[c.co] = (map[c.co] || 0) + 1; });
    return map;
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(155deg, #16100A 0%, #241605 55%, #301B06 100%)' }}>
        {/* Decorative coin shadows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full opacity-5"
              style={{
                width: 120 + i * 40, height: 120 + i * 40,
                background: 'radial-gradient(circle at 36% 36%, #E8C97A, #C9A84C)',
                top: `${20 + i * 12}%`, left: `${5 + i * 15}%`,
                filter: 'blur(30px)',
              }} />
          ))}
        </div>

        <div className="relative max-w-[1440px] mx-auto px-4 py-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-amiri text-gold-300 mb-2" style={{ fontSize: 'clamp(26px, 5vw, 52px)' }}>
              {t('hero.title')}
            </h1>
            <p className="text-gold-600/70 text-sm mb-6">{t('hero.subtitle')}</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 mb-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {[
              { n: '4,737', label: isAr ? t('hero.total') : t('hero.total') },
              { n: '19', label: isAr ? t('hero.countries') : t('hero.countries') },
              { n: t('hero.years'), label: '' },
            ].map(({ n, label }) => (
              <div key={n} className="flex flex-col items-center">
                <span className="font-amiri text-gold-300 text-2xl font-bold">{n}</span>
                {label && <span className="text-gold-600/60 text-[11px]">{label}</span>}
              </div>
            ))}
          </motion.div>

          {/* Search bar */}
          <motion.div
            className="max-w-2xl mx-auto relative"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center bg-parch-cream rounded-2xl border-2 border-gold-700/40 focus-within:border-gold-500 transition-colors shadow-2xl overflow-hidden">
              <span className="shrink-0 mx-4 text-gold-500/60 text-base">🔍</span>
              <input
                ref={searchRef}
                type="text"
                dir={isAr ? 'rtl' : 'ltr'}
                placeholder={t('search.placeholder')}
                value={filters.query}
                onChange={e => { updateFilter('query', e.target.value); setShowAutocomplete(true); }}
                onFocus={() => setShowAutocomplete(true)}
                className="flex-1 py-3.5 text-[14px] bg-transparent text-ink placeholder:text-ink/30 outline-none font-cairo"
                autoComplete="off"
              />
              {filters.query && (
                <button onClick={() => updateFilter('query', '')} className="mx-2 text-ink/30 hover:text-ink/60">
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => { /* open identify modal */ }}
                className="flex items-center gap-1.5 mx-3 px-3 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink text-[12px] font-semibold transition-colors shrink-0"
                title={t('search.identify')}>
                <Camera size={14} />
                <span className="hidden sm:block">{isAr ? 'تحديد' : 'Identify'}</span>
              </button>
            </div>
          {/* Autocomplete dropdown */}
          {showAutocomplete && suggestions.length > 0 && (
            <div
              ref={autocompleteRef}
              className="max-w-2xl mx-auto mt-1 bg-parch-cream rounded-xl border border-gold-700/30 shadow-2xl overflow-hidden z-50 relative"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    updateFilter('query', s);
                    setShowAutocomplete(false);
                    searchRef.current?.blur();
                  }}
                  className="w-full text-right px-4 py-2.5 text-[13px] text-ink/80 hover:bg-gold-500/10 border-b border-gold-700/10 last:border-0 transition-colors font-cairo flex items-center gap-2"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <span className="text-gold-500/50 text-[10px]">🔍</span>
                  {s}
                </button>
              ))}
            </div>
          )}
          </motion.div>
        </div>

        {/* Decorative bottom line */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #8B6D2E, transparent)' }} />
      </section>

      {/* ── COUNTRY TABS ── */}
      <div className="bg-parch-dark/60 border-b border-gold-700/20 overflow-x-auto">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center gap-1 py-2 min-w-max">
            <button
              onClick={() => updateFilter('country', 'all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-colors font-medium shrink-0
                ${filters.country === 'all' ? 'bg-gold-500 text-ink' : 'text-ink/60 hover:text-ink hover:bg-gold-500/15 border border-gold-700/20'}`}>
              🌍 {isAr ? 'الكل' : 'All'} ({COINS.length})
            </button>
            {COUNTRIES.map(({ cc, co, co_ar }) => {
              const count = countryCounts[co] || 0;
              if (!count) return null;
              return (
                <button
                  key={cc}
                  onClick={() => updateFilter('country', co)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] transition-colors shrink-0
                    ${filters.country === co ? 'bg-gold-500 text-ink font-semibold' : 'text-ink/50 hover:text-ink/80 hover:bg-gold-500/10 border border-gold-700/15'}`}>
                  {COUNTRY_FLAGS[cc]} {isAr ? co_ar : co}
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DYNASTY PILLS ── */}
      <div className="bg-parch-dark/40 border-b border-gold-700/15 overflow-x-auto">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center gap-1.5 py-2 min-w-max">
            <span className="text-[9px] text-ink/30 uppercase tracking-wider shrink-0 ml-1">
              {isAr ? 'الحقبة:' : 'Era:'}
            </span>
            {DYNASTY_PILLS.map(pill => (
              <button
                key={pill.key}
                onClick={() => { setDynasty(dynasty === pill.key ? '' : pill.key); setPage(1); }}
                className={`text-[11px] px-3 py-1 rounded-full border transition-colors shrink-0 font-medium
                  ${dynasty === pill.key
                    ? 'bg-gold-600 border-gold-600 text-ink'
                    : 'border-gold-700/25 text-ink/50 hover:border-gold-500/50 hover:text-ink/75 hover:bg-gold-500/8'}`}
              >
                {isAr ? pill.label_ar : pill.label_en}
              </button>
            ))}
            {dynasty && (
              <button
                onClick={() => { setDynasty(''); setPage(1); }}
                className="text-[10px] text-gold-600 hover:text-gold-400 px-2 py-1 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTROLS BAR ── */}
      <div className="bg-parch sticky top-[103px] z-30 border-b border-gold-700/15 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          {/* Era */}
          <select
            value={filters.era}
            onChange={e => updateFilter('era', e.target.value)}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
            <option value="">{t('filters.allEras')}</option>
            {ERA_OPTIONS.map(e => (
              <option key={e.value} value={e.value}>{isAr ? e.label_ar : e.label_en}</option>
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

          {/* Results count */}
          <span className="text-[11px] text-ink/40 mr-auto">
            {filtered.length.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {t('search.results')}
          </span>

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
        {paged.length === 0 ? (
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
    </>
  );
}
