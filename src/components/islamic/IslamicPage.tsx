'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, ChevronDown, ChevronUp, SlidersHorizontal, FileDown } from 'lucide-react';
import { getIslamicCoins } from '@/lib/coinsApi';
import type { CoinRow, IslamicCoinFilters } from '@/lib/coinsApi';
// IslamicCoinFilters used below in doFetch
import { supabase } from '@/lib/supabase';
import ComboFilter from '@/components/ui/ComboFilter';
import type { ComboOption } from '@/components/ui/ComboFilter';
import CoinCard from '@/components/catalogue/CoinCard';
import CoinModal from '@/components/catalogue/CoinModal';
import { useDarkMode } from '@/lib/darkModeContext';
import type { Coin } from '@/types/coin';

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

const DYNASTIES = [
  { value: 'الخلافة العباسية',     labelAr: 'الخلافة العباسية',     labelEn: 'Abbasid Caliphate' },
  { value: 'السامانيون',            labelAr: 'السامانيون',            labelEn: 'Samanids' },
  { value: 'المماليك',              labelAr: 'المماليك',              labelEn: 'Mamluks' },
  { value: 'الإيلخانيون',           labelAr: 'الإيلخانيون',           labelEn: 'Ilkhanids' },
  { value: 'الدولة الأموية',        labelAr: 'الدولة الأموية',        labelEn: 'Umayyad Caliphate' },
  { value: 'الأيوبيون',             labelAr: 'الأيوبيون',             labelEn: 'Ayyubids' },
  { value: 'الإسلام المبكر',        labelAr: 'الإسلام المبكر',        labelEn: 'Early Islam' },
  { value: 'الأرتقيون',             labelAr: 'الأرتقيون',             labelEn: 'Artuqids' },
  { value: 'البويهيون',             labelAr: 'البويهيون',             labelEn: 'Buyids' },
  { value: 'الزنكيون',              labelAr: 'الزنكيون',              labelEn: 'Zengids' },
  { value: 'الخلافة الفاطمية',      labelAr: 'الخلافة الفاطمية',      labelEn: 'Fatimid Caliphate' },
  { value: 'الأمويون في الأندلس',   labelAr: 'الأمويون في الأندلس',   labelEn: 'Umayyads of al-Andalus' },
  { value: 'الموحدون',              labelAr: 'الموحدون',              labelEn: 'Almohads' },
  { value: 'المرابطون',             labelAr: 'المرابطون',             labelEn: 'Almoravids' },
  { value: 'الحمدانيون',            labelAr: 'الحمدانيون',            labelEn: 'Hamdanids' },
  { value: 'سلطنات شرق أفريقيا',    labelAr: 'سلطنات شرق أفريقيا',    labelEn: 'East African Sultanates' },
];

const TOP_MINTS = [
  { en: 'Damascus',  ar: 'دمشق' },
  { en: 'Aleppo',    ar: 'حلب' },
  { en: 'Baghdad',   ar: 'بغداد' },
  { en: 'al-Basra',  ar: 'البصرة' },
  { en: 'Nishapur',  ar: 'نيسابور' },
  { en: 'Samarqand', ar: 'سمرقند' },
];

const TOP_RULERS = [
  { en: 'Harun al-Rashid',       ar: 'هارون الرشيد' },
  { en: 'Abd al-Malik ibn Marwan', ar: 'عبد الملك بن مروان' },
  { en: 'al-Mansur',             ar: 'المنصور' },
  { en: 'Baybars',               ar: 'بيبرس' },
  { en: "Qala'un",               ar: 'قلاوون' },
  { en: 'Salah al-Din',          ar: 'صلاح الدين' },
];

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

export default function IslamicPage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const { darkMode } = useDarkMode();

  // ── Filter state ────────────────────────────────────────────────────────
  const [query,       setQuery]       = useState('');
  const [denomination,setDenomination]= useState('');
  const [dynasty,     setDynasty]     = useState('');
  const [metal,       setMetal]       = useState('');
  const [mint,        setMint]        = useState('');
  const [ruler,       setRuler]       = useState('');
  const [coinTypeTag, setCoinTypeTag] = useState('');
  const [yahFrom,     setYahFrom]     = useState('');
  const [yahTo,       setYahTo]       = useState('');
  const [sort,        setSort]        = useState<'default' | 'oldest' | 'newest'>('default');
  const [moreFilters, setMoreFilters] = useState(false);
  const [page,        setPage]        = useState(1);

  // ── Data state ──────────────────────────────────────────────────────────
  const [coins,        setCoins]        = useState<CoinRow[]>([]);
  const [total,        setTotal]        = useState(47303);
  const [loading,      setLoading]      = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const metals = ['Gold', 'Silver', 'Bronze', 'Billon', 'Lead', 'Copper'];
  const queryRef = useRef<NodeJS.Timeout>();

  // ── ComboFilter loaders (memoised so the effect inside ComboFilter is stable) ──
  const loadMints = useCallback(async (q: string): Promise<ComboOption[]> => {
    const { data } = await supabase
      .from('coins')
      .select('mint, mint_ar')
      .eq('cc', 'IS')
      .neq('mint', '')
      .ilike('mint', q ? `%${q}%` : '%')
      .limit(50);
    const seen = new Set<string>();
    return (data ?? [])
      .filter(r => { if (!r.mint || seen.has(r.mint)) return false; seen.add(r.mint); return true; })
      .map(r => ({ value: r.mint, label: isAr && r.mint_ar ? r.mint_ar : r.mint }));
  }, [isAr]);

  const loadRulers = useCallback(async (q: string): Promise<ComboOption[]> => {
    const { data } = await supabase
      .from('coins')
      .select('ruler, ruler_ar')
      .eq('cc', 'IS')
      .neq('ruler', '')
      .ilike('ruler', q ? `%${q}%` : '%')
      .limit(50);
    const seen = new Set<string>();
    return (data ?? [])
      .filter(r => { if (!r.ruler || seen.has(r.ruler)) return false; seen.add(r.ruler); return true; })
      .map(r => ({ value: r.ruler, label: isAr && r.ruler_ar ? r.ruler_ar : r.ruler }));
  }, [isAr]);

  // ── Fetch coins ─────────────────────────────────────────────────────────
  const doFetch = useCallback(() => {
    setLoading(true);
    const f: IslamicCoinFilters = {};
    if (query.trim())  f.query          = query.trim();
    if (denomination)  f.denomination   = denomination;
    if (dynasty)       f.dyn            = dynasty;
    if (metal)         f.metal          = metal;
    if (mint)          f.mint           = mint;
    if (ruler)         f.ruler          = ruler;
    if (coinTypeTag)   f.coin_type_tag  = coinTypeTag;
    if (yahFrom)       f.yah_from       = parseInt(yahFrom);
    if (yahTo)         f.yah_to         = parseInt(yahTo);

    getIslamicCoins(f, page, PER_PAGE).then(({ data, count }) => {
      let sorted = data;
      if (sort === 'newest') sorted = [...data].sort((a, b) => parseInt(b.yah || '0') - parseInt(a.yah || '0'));
      else if (sort === 'oldest') sorted = [...data].sort((a, b) => parseInt(a.yah || '9999') - parseInt(b.yah || '9999'));
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
    setMint(''); setRuler(''); setCoinTypeTag(''); setYahFrom(''); setYahTo('');
    setSort('default'); setPage(1);
  };

  // PDF download
  const downloadPDF = () => {
    const rows = coins.slice(0, 500).map(c => {
      const name  = isAr ? (c.nar || c.name) : c.name;
      const yah   = c.yah ? c.yah + (isAr ? ' هـ' : ' AH') : '—';
      const mintLabel = isAr ? (c.mint_ar || c.mint || '—') : (c.mint || '—');
      return `<tr>
        <td dir="rtl">${name}</td><td>${c.dyn || '—'}</td><td>${yah}</td>
        <td>${isAr ? (METALS_AR[c.metal] ?? c.metal) : c.metal || '—'}</td>
        <td>${mintLabel}</td>
        <td>${isAr ? (c.ruler_ar || c.ruler || '—') : (c.ruler || '—')}</td>
      </tr>`;
    }).join('');
    const title   = isAr ? 'نتائج البحث — العملات الإسلامية' : 'Search Results — Islamic Coins';
    const headers = isAr
      ? ['الاسم','السلالة','السنة هـ','المعدن','دار الضرب','الحاكم']
      : ['Name','Dynasty','Year AH','Metal','Mint','Ruler'];
    const date = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-AU');
    const html = `<!DOCTYPE html>
<html dir="${isAr ? 'rtl' : 'ltr'}" lang="${locale}">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:serif; font-size:11px; color:#1a0e05; background:#fff; padding:24px; }
  h1 { font-size:20px; color:#8B6D2E; margin-bottom:4px; }
  .meta { font-size:10px; color:#888; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; }
  th { background:#1a0e05; color:#F0E8D4; padding:6px 8px; text-align:${isAr?'right':'left'}; font-size:10px; }
  td { padding:5px 8px; border-bottom:1px solid #e8dfc8; }
  tr:nth-child(even) { background:#faf6ee; }
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">${date} · ${total.toLocaleString()} ${isAr?'عملة':'coins'}${total>500?(isAr?' (أول 500 نتيجة)':' (first 500 results)'):''}</div>
<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) { win.onload = () => { win.print(); setTimeout(() => URL.revokeObjectURL(url), 3000); }; }
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
              placeholder={isAr ? 'ابحث بالاسم، دار الضرب، الحاكم، المرجع...' : 'Search by name, mint, ruler, reference...'}
              className="w-full text-[14px] ps-11 pe-4 py-3 rounded-xl border border-gold-700/25 bg-parch-cream outline-none focus:border-gold-500 shadow-sm font-cairo"
            />
          </div>
        </div>

        {/* ── FILTER ROW ────────────────────────────────────────────────── */}
        <div className="bg-parch sticky top-[167px] z-30 border-b border-gold-700/15 shadow-sm">
          <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">

            {/* Dynasty */}
            <select value={dynasty} onChange={e => { setDynasty(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer max-w-[180px]">
              <option value="">{isAr ? 'كل السلالات' : 'All Dynasties'}</option>
              {DYNASTIES.map(d => <option key={d.value} value={d.value}>{isAr ? d.labelAr : d.labelEn}</option>)}
            </select>

            {/* Metal */}
            <select value={metal} onChange={e => { setMetal(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer">
              <option value="">{isAr ? 'كل المعادن' : 'All Metals'}</option>
              {metals.map(m => <option key={m} value={m}>{isAr ? (METALS_AR[m] ?? m) : m}</option>)}
            </select>

            {/* Denomination */}
            <select value={denomination} onChange={e => { setDenomination(e.target.value); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500 cursor-pointer max-w-[160px]">
              {DENOM_OPTIONS.map(d => <option key={d.key} value={d.key}>{isAr ? d.labelAr : d.labelEn}</option>)}
            </select>

            {/* Mint — ComboFilter */}
            <ComboFilter
              placeholder={isAr ? 'كل دور الضرب' : 'All Mints'}
              value={mint}
              onChange={v => { setMint(v); setPage(1); }}
              loadOptions={loadMints}
            />

            {/* Ruler — ComboFilter */}
            <ComboFilter
              placeholder={isAr ? 'كل الحكام' : 'All Rulers'}
              value={ruler}
              onChange={v => { setRuler(v); setPage(1); }}
              loadOptions={loadRulers}
            />

            {/* Year AH range */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-ink/50 shrink-0">{isAr ? 'هـ:' : 'AH:'}</span>
              <input value={yahFrom} onChange={e => { setYahFrom(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'من' : 'From'}
                className="w-[60px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
              <span className="text-ink/30 text-[11px]">—</span>
              <input value={yahTo} onChange={e => { setYahTo(e.target.value); setPage(1); }}
                type="number" placeholder={isAr ? 'إلى' : 'To'}
                className="w-[60px] text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink/70 outline-none focus:border-gold-500" />
            </div>

            {/* More filters toggle */}
            <button
              onClick={() => setMoreFilters(!moreFilters)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg border transition-colors
                ${moreFilters ? 'border-gold-500 bg-parch-dark text-ink' : 'border-gold-700/30 bg-parch-cream text-ink/70 hover:border-gold-500'}`}>
              <SlidersHorizontal size={12} />
              {isAr ? 'النوع' : 'Type'}
              {moreFilters ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {/* Count + PDF */}
            <div className="flex items-center gap-2 ms-auto">
              <span className="text-[11px] text-ink/40">
                {total.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : 'coins'}
              </span>
              {total > 0 && (
                <button onClick={downloadPDF}
                  title={isAr ? 'تنزيل النتائج كـ PDF' : 'Download results as PDF'}
                  className="flex items-center gap-1 text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 hover:border-gold-500/60 rounded-full px-2.5 py-1 transition-colors">
                  <FileDown size={11} />
                  <span className="hidden sm:block">PDF</span>
                </button>
              )}
            </div>

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

        {/* ── EXPANDED: coin types + top mint/ruler pills ───────────────── */}
        {moreFilters && (
          <div className="border-b border-gold-700/10 bg-parch-cream/60 px-4 py-3 flex flex-col gap-3">

            {/* Coin type pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">{isAr ? 'النوع:' : 'Type:'}</span>
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

            {/* Top mint pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">{isAr ? 'دور الضرب:' : 'Top mints:'}</span>
              {TOP_MINTS.map(m => (
                <button key={m.en}
                  onClick={() => { setMint(mint === m.en ? '' : m.en); setPage(1); }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all font-cairo
                    ${mint === m.en
                      ? 'bg-gold-500 border-gold-500 text-ink font-semibold'
                      : 'border-gold-700/25 text-ink/50 hover:border-gold-500/50 hover:text-ink/70'}`}>
                  {isAr ? m.ar : m.en}
                </button>
              ))}
            </div>

            {/* Top ruler pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-ink/60 font-medium shrink-0">{isAr ? 'الحكام:' : 'Top rulers:'}</span>
              {TOP_RULERS.map(r => (
                <button key={r.en}
                  onClick={() => { setRuler(ruler === r.en ? '' : r.en); setPage(1); }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all font-cairo
                    ${ruler === r.en
                      ? 'bg-gold-500 border-gold-500 text-ink font-semibold'
                      : 'border-gold-700/25 text-ink/50 hover:border-gold-500/50 hover:text-ink/70'}`}>
                  {isAr ? r.ar : r.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIVE FILTER TAGS ────────────────────────────────────────── */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2 px-4">
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

        {/* ── COIN GRID ─────────────────────────────────────────────────── */}
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
