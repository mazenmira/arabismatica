'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ZoomIn, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Coin, MintageEntry, CoinPrices } from '@/types/coin';
import { supabase } from '@/lib/supabase';
import {
  getDiscGradient, getMetalSymbol, COUNTRY_FLAGS,
  formatMintage, isValidImageUrl, getCoinName, getCoinYear,
} from '@/lib/coins';

type IslamicCoin = Coin & { denomination?: string; ruler?: string; mint?: string; mint_ar?: string };
type CoinWithVarieties = Coin & { mintageData?: MintageEntry[] };

const PRINT_CSS = `@media print {
  body > *:not(#coin-print-root) { display: none !important; }
  #coin-print-root { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; padding: 24px; }
  .no-print { display: none !important; }
}`;

const RARITY_STYLES: Record<string, string> = {
  Common:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Uncommon: 'bg-sky-50 text-sky-700 border-sky-200',
  Scarce:   'bg-amber-50 text-amber-700 border-amber-200',
  Rare:     'bg-red-50 text-red-700 border-red-200',
};

const METAL_AR: Record<string, string> = {
  Gold:'ذهب', Silver:'فضة', Copper:'نحاس', Bronze:'برونز',
  'Copper-nickel':'نحاس-نيكل', 'Cupro-Nickel':'نحاس-نيكل',
  Nickel:'نيكل', Bimetallic:'ثنائي', Aluminium:'ألمنيوم',
  Billon:'بليون', Brass:'نحاس أصفر', Steel:'فولاذ', AV:'ذهب', AR:'فضة', AE:'برونز',
};

const DENOM_AR: Record<string, string> = {
  Dirham:'درهم', Dinar:'دينار', Fals:'فلس', Fils:'فلس', Other:'أخرى',
};

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose, onSwitchSide, side }: {
  src: string; alt: string; onClose: () => void;
  onSwitchSide: (s: 'obverse' | 'reverse') => void; side: 'obverse' | 'reverse';
}) {
  return (
    <motion.div className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
      style={{ background: 'rgba(10,6,2,.95)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full border border-white/20 text-white flex items-center justify-center z-10 no-print">
        <X size={18} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()} />
      <div className="flex rounded-full overflow-hidden border border-white/20 mt-4">
        {(['obverse', 'reverse'] as const).map(s => (
          <button key={s} onClick={e => { e.stopPropagation(); onSwitchSide(s); }}
            className={`px-5 py-2 text-[12px] font-medium transition-colors ${side === s ? 'bg-gold-500 text-ink' : 'text-white/60 hover:text-white'}`}>
            {s === 'obverse' ? 'Obverse' : 'Reverse'}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── MintageTable ──────────────────────────────────────────────────────────────
function MintageTable({ data, locale }: { data: MintageEntry[]; locale: string }) {
  const isAr = locale === 'ar';
  const hasMintmark = data.some(d => d.Mintmark && d.Mintmark !== 'None');
  return (
    <div className="mb-4 rounded-xl border border-gold-700/20 overflow-hidden">
      <div className="bg-gold-500/10 px-4 py-2 flex items-center gap-2 border-b border-gold-700/15">
        <span className="text-base">📊</span>
        <span className="text-[11px] font-semibold text-ink/60 uppercase tracking-wider">
          {isAr ? 'تواريخ الإصدار والكميات' : 'Issue dates & mintage'} · {data.length} {isAr ? 'إصدار' : 'issues'}
        </span>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-gold-700/15 bg-parch-dark/20">
            <th className="text-start px-3 py-2 text-ink/40 font-medium">{isAr ? 'السنة' : 'Year'}</th>
            {hasMintmark && <th className="text-start px-3 py-2 text-ink/40 font-medium">{isAr ? 'علامة الضرب' : 'Mint'}</th>}
            <th className="text-start px-3 py-2 text-ink/40 font-medium">{isAr ? 'الكمية' : 'Mintage'}</th>
            <th className="text-start px-3 py-2 text-ink/40 font-medium">{isAr ? 'الندرة' : 'Rarity'}</th>
            <th className="text-start px-3 py-2 text-ink/40 font-medium">{isAr ? 'ملاحظة' : 'Note'}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-gold-700/10 last:border-0 hover:bg-gold-500/5 transition-colors">
              <td className="px-3 py-2 font-amiri">
                {d.YearHijri && <span className="text-amber-700">{d.YearHijri}هـ </span>}
                {d.YearGregorian && <span className="text-ink/60">{d.YearGregorian}</span>}
              </td>
              {hasMintmark && <td className="px-3 py-2 text-ink/60">{d.Mintmark && d.Mintmark !== 'None' ? d.Mintmark : '—'}</td>}
              <td className="px-3 py-2 font-amiri font-medium">
                {d.MintageCount != null ? d.MintageCount.toLocaleString(isAr ? 'ar-EG' : 'en') : <span className="text-ink/30">—</span>}
              </td>
              <td className="px-3 py-2">
                {d.Rarity && <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${RARITY_STYLES[d.Rarity] ?? ''}`}>{d.Rarity}</span>}
              </td>
              <td className="px-3 py-2 text-ink/40 font-amiri">{d.Note ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Price Guide ───────────────────────────────────────────────────────────────
interface PriceRow {
  grade: string; raw: number | null; pcgs: number | null;
  currency: string; source: string; date: string;
}

function PriceGuide({ coinId, locale, cataloguePrices }: {
  coinId: string; locale: string; cataloguePrices?: CoinPrices;
}) {
  const isAr = locale === 'ar';
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Raw' | 'PCGS/NGC'>('Raw');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    supabase.from('price_submissions').select('*').eq('coin_id', coinId).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setPrices(data as PriceRow[]); setLoading(false); });
  }, [coinId]);

  const latestSource = prices[0];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-ink/40 uppercase tracking-widest font-medium">
          {isAr ? 'دليل الأسعار — Sheldon' : 'Price Guide — Sheldon Scale'}
        </span>
        <div className="flex rounded-full border border-gold-700/20 overflow-hidden">
          {(['Raw', 'PCGS/NGC'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 text-[10px] transition-colors ${tab === t ? 'bg-gold-500 text-ink font-semibold' : 'text-ink/40 hover:text-ink/60'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center text-ink/30 text-[11px]">…</div>
      ) : cataloguePrices && Object.values(cataloguePrices).some(v => v !== null) ? (
        <div className="rounded-xl border border-gold-700/20 overflow-hidden mb-2">
          <div className="bg-gold-500/8 px-3 py-1.5 flex items-center justify-between border-b border-gold-700/10">
            <span className="text-[10px] text-gold-600 font-medium">{isAr ? 'أسعار مرجعية (USD)' : 'Reference prices (USD)'}</span>
            <span className="text-[9px] text-ink/30">{isAr ? 'مصدر: الكتالوج' : 'Source: catalogue'}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 bg-white">
            {(['G','VG','F','VF','XF','AU','UNC'] as const).filter(g => cataloguePrices[g] !== null).map((g, i, arr) => (
              <div key={g} className={`flex flex-col items-center py-2 px-1 ${i < arr.length-1 ? 'border-e border-gold-700/10' : ''}`}>
                <div className="text-[9px] text-ink/40 font-semibold mb-0.5">{g}</div>
                <div className="text-[12px] font-bold text-gold-700 font-amiri">${cataloguePrices[g]}</div>
              </div>
            ))}
          </div>
          {prices.length > 0 && (
            <div className="border-t border-gold-700/10 px-3 py-1.5">
              <span className="text-[9px] text-gold-600 font-semibold">{isAr ? 'كتالوج' : 'Catalogue'}: </span>
              {(['G','VG','F','VF','XF','AU','UNC'] as const).filter(g => cataloguePrices[g] !== null).map(g => (
                <span key={g} className="text-[9px] text-ink/60 mr-2"><span className="font-semibold text-gold-600">{g}</span> ${cataloguePrices[g]}</span>
              ))}
            </div>
          )}
        </div>
      ) : prices.length === 0 ? (
        <div className="bg-parch-dark/30 rounded-xl border border-gold-700/15 px-4 py-4 text-center">
          <p className="text-[12px] text-ink/40 font-amiri mb-2">
            {isAr ? 'لا توجد بيانات أسعار بعد' : 'No price data for this coin yet'}
          </p>
          {isLoggedIn ? (
            <button
              className="text-[11px] text-gold-600 border border-gold-700/30 rounded-full px-3 py-1 hover:border-gold-500 transition-colors">
              {isAr ? '+ سجّل سعر ملاحَظ' : '+ Submit observed price'}
            </button>
          ) : (
            <p className="text-[11px] text-ink/30">{isAr ? 'سجّل دخولك لاقتراح سعر' : 'Sign in to suggest a price'}</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gold-700/20 overflow-hidden">
          {latestSource && (
            <div className="bg-parch-dark/30 px-4 py-2 border-b border-gold-700/15 flex items-center justify-between text-[10px]">
              <span className="text-ink/40">{isAr ? 'آخر تحديث' : 'Last updated'}: {latestSource.date?.slice(0, 10)}</span>
              <span className="text-gold-600">{latestSource.source}</span>
            </div>
          )}
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-gold-700/15">
              <th className="px-2 py-2 text-start text-ink/40 font-medium">{isAr ? 'الدرجة' : 'Grade'}</th>
              <th className="px-2 py-2 text-start text-ink/40 font-medium">{tab === 'Raw' ? (isAr ? 'غير مُدرَّج' : 'Raw') : 'PCGS/NGC'}</th>
              <th className="px-2 py-2 text-start text-ink/40 font-medium">{isAr ? 'العملة' : 'Currency'}</th>
            </tr></thead>
            <tbody>
              {prices.map((p, i) => (
                <tr key={i} className="border-b border-gold-700/10 last:border-0">
                  <td className="px-2 py-2 font-semibold">{p.grade}</td>
                  <td className="px-2 py-2 font-amiri">{tab === 'Raw' ? (p.raw ?? '—') : (p.pcgs ?? '—')}</td>
                  <td className="px-2 py-2 text-ink/50">{p.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main CoinModal ────────────────────────────────────────────────────────────
export default function CoinModal({ coin, locale, onClose }: { coin: Coin; locale: string; onClose: () => void }) {
  const t     = useTranslations('coin');
  const isAr  = locale === 'ar';
  const c     = coin as CoinWithVarieties;
  const ic    = coin as IslamicCoin;
  const isZeno = coin.nref?.startsWith('Z#');

  const [lightbox,    setLightbox]    = useState<'obverse' | 'reverse' | null>(null);
  const [imageTab,    setImageTab]    = useState<'both' | 'obverse' | 'reverse'>('both');
  const [showMore,    setShowMore]    = useState(false);
  const [shareToast,  setShareToast]  = useState(false);

  const coinName     = getCoinName(coin, locale);
  const mintageData  = c.mintageData ?? [];
  const legacyMint   = mintageData.length === 0 ? (coin.mint ?? null) : null;
  const years        = mintageData.map(d => d.YearGregorian).filter((y): y is number => y != null);
  const yearLabel    = years.length >= 2
    ? `${Math.min(...years)}–${Math.max(...years)} CE`
    : years.length === 1 ? `${years[0]} CE` : getCoinYear(coin, locale);
  const metalLabel   = isAr ? (METAL_AR[coin.metal] ?? coin.metal) : coin.metal;
  const denomination = (coin as IslamicCoin).denomination;
  const ruler        = ic.ruler;
  const mintCity     = ic.mint_ar && isAr ? ic.mint_ar : (ic.mint || coin.mint);

  const singleImage  = isZeno || !coin.r || coin.o === coin.r;
  const hasObverse   = isValidImageUrl(coin.o);
  const hasReverse   = isValidImageUrl(coin.r) && !singleImage;

  const currentImage = imageTab === 'reverse' && hasReverse ? coin.r : coin.o;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lightbox) onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [lightbox, onClose]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/${locale}/catalogue/${coin.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  }, [coin.id, locale]);

  const externalHref = isZeno
    ? `https://www.zeno.ru/showphoto.php?photo=${coin.nid}`
    : `https://en.numista.com/catalogue/pieces${coin.nid}.html`;
  const externalLabel = isZeno
    ? (isAr ? 'عرض في Zeno' : 'View on Zeno')
    : t('viewOnNumista');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Backdrop */}
      <motion.div className="fixed inset-0 z-[150]"
        style={{ background: 'rgba(22,16,10,.82)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && currentImage && (
          <Lightbox src={currentImage} alt={coinName} onClose={() => setLightbox(null)}
            onSwitchSide={s => { setImageTab(s); setLightbox(s); }} side={lightbox} />
        )}
      </AnimatePresence>

      {/* Modal */}
      <motion.div className="fixed inset-0 z-[151] flex items-center justify-center p-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="bg-parch-cream rounded-2xl shadow-2xl w-full max-w-[740px] max-h-[94vh] overflow-y-auto"
          style={{ border: '1px solid rgba(139,109,46,.35)' }}
          initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 6 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="sticky top-0 bg-parch-cream flex items-center justify-between px-4 py-3 border-b border-gold-700/20 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-ink/30 font-mono truncate">{coin.id} · {coin.nref}</span>
              <Link href={`/${locale}/catalogue/${coin.id}`}
                className="shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-gold-700/30 text-gold-600 hover:bg-gold-500/10 transition-colors">
                <ExternalLink size={9} />{isAr ? 'صفحة كاملة' : 'Full page'}
              </Link>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Share */}
              <button onClick={handleShare}
                className="w-8 h-8 rounded-full border border-gold-700/30 text-gold-600 hover:text-gold-400 flex items-center justify-center transition-colors relative">
                <Share2 size={13} />
                {shareToast && (
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] bg-ink text-gold-300 px-2 py-0.5 rounded whitespace-nowrap">
                    {isAr ? 'تم النسخ' : 'Copied!'}
                  </span>
                )}
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full border border-gold-700/30 text-gold-600 hover:text-gold-400 flex items-center justify-center transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-5">

            {/* ── TWO-COLUMN LAYOUT ── */}
            <div className="flex flex-col md:flex-row gap-5 mb-5">

              {/* LEFT — Image panel */}
              <div className="md:w-[52%] shrink-0">
                {/* Image tabs */}
                {!singleImage && (
                  <div className="flex rounded-lg border border-gold-700/20 overflow-hidden mb-2 text-[11px]">
                    {(['both', 'obverse', 'reverse'] as const).map(tab => (
                      <button key={tab} onClick={() => setImageTab(tab)}
                        className={`flex-1 py-1.5 font-medium transition-colors ${imageTab === tab ? 'bg-gold-500 text-ink' : 'text-ink/50 hover:text-ink/70'}`}>
                        {tab === 'both' ? (isAr ? 'الوجهان' : 'Both') : tab === 'obverse' ? (isAr ? 'الوجه' : 'Obverse') : (isAr ? 'الظهر' : 'Reverse')}
                      </button>
                    ))}
                  </div>
                )}

                {/* Image display */}
                <div className="bg-white rounded-xl border border-gold-700/15 overflow-hidden relative group cursor-pointer"
                  onClick={() => hasObverse && setLightbox(imageTab === 'reverse' ? 'reverse' : 'obverse')}>
                  {imageTab === 'both' && !singleImage ? (
                    // Both sides side by side
                    <div className="flex">
                      {hasObverse && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coin.o} alt={`${coinName} obverse`}
                          className="w-1/2 h-48 object-contain p-2" />
                      )}
                      {hasReverse && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coin.r} alt={`${coinName} reverse`}
                          className="w-1/2 h-48 object-contain p-2 border-s border-gold-700/10" />
                      )}
                    </div>
                  ) : hasObverse ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageTab === 'reverse' && hasReverse ? coin.r : coin.o}
                      alt={coinName} className="w-full h-52 object-contain p-3" />
                  ) : (
                    <div className="w-full h-52 flex items-center justify-center text-5xl"
                      style={{ background: getDiscGradient(coin.metal) }}>
                      {getMetalSymbol(coin.metal)}
                    </div>
                  )}
                  {/* Zoom overlay */}
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <ZoomIn size={24} className="text-gold-400" />
                  </div>
                </div>
                {isZeno && (
                  <p className="text-[9px] text-ink/30 text-center mt-1 italic">
                    {isAr ? 'صورة مجمعة (وجه وظهر)' : 'Combined obverse & reverse photo'}
                  </p>
                )}
              </div>

              {/* RIGHT — Data grid */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h2 className="font-amiri text-[20px] text-ink leading-tight mb-0.5">{coinName}</h2>
                {coinName !== coin.name && <p className="text-[11px] text-ink/35 italic mb-2">{coin.name}</p>}

                {/* Country + dynasty line */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span className="text-lg">{COUNTRY_FLAGS[coin.cc] ?? '☪️'}</span>
                  <span className="text-[12px] text-ink/60">{isAr ? coin.co_ar : coin.co}</span>
                  <span className="text-ink/20">·</span>
                  <span className="text-[12px] text-gold-600 font-medium">{coin.dyn}</span>
                </div>

                {/* Structured data grid — islamicnumis style */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px]">
                  {/* Year AH + Mint */}
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">📅</span>
                    <div>
                      <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'السنة' : 'Year'}</div>
                      <div className="font-amiri text-ink font-medium">
                        {coin.yah ? <span className="text-amber-700">{coin.yah}{isAr ? 'هـ' : ' AH'} </span> : null}
                        {coin.yce ? <span className="text-ink/70">({coin.yce} {isAr ? 'م' : 'CE'})</span> : yearLabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">🏛️</span>
                    <div>
                      <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'دار الضرب' : 'Mint'}</div>
                      <div className="font-amiri text-ink">{mintCity || '—'}</div>
                    </div>
                  </div>

                  {/* Denomination badge + Ruler */}
                  {denomination && (
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">🏷️</span>
                      <div>
                        <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'الفئة' : 'Denomination'}</div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border
                          ${denomination === 'Dinar' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            denomination === 'Dirham' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                            'bg-parch-dark/40 text-ink/60 border-gold-700/20'}`}>
                          {isAr ? (DENOM_AR[denomination] ?? denomination) : denomination}
                        </span>
                      </div>
                    </div>
                  )}

                  {ruler && (
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">👤</span>
                      <div>
                        <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'الحاكم' : 'Ruler'}</div>
                        <div className="font-amiri text-ink">{ruler}</div>
                      </div>
                    </div>
                  )}

                  {/* Metal + Type */}
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">⚗️</span>
                    <div>
                      <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'المعدن' : 'Metal'}</div>
                      <div className="text-ink">{metalLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">🔷</span>
                    <div>
                      <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'النوع' : 'Type'}</div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-parch-dark/30 border-gold-700/20 text-ink/60">
                        {coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Commemorative') : (isAr ? 'تداول' : 'Circulation')}
                      </span>
                    </div>
                  </div>

                  {/* Weight + Diameter */}
                  {coin.wt != null && (
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">⚖️</span>
                      <div>
                        <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'الوزن' : 'Weight'}</div>
                        <div className="text-ink">{coin.wt} g</div>
                      </div>
                    </div>
                  )}

                  {coin.dia != null && (
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">📏</span>
                      <div>
                        <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">{isAr ? 'القطر' : 'Diameter'}</div>
                        <div className="text-ink">{coin.dia} mm</div>
                      </div>
                    </div>
                  )}

                  {/* KM + Ref */}
                  {coin.km && (
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">🔢</span>
                      <div>
                        <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">KM#</div>
                        <div className="text-ink font-mono">{coin.km}</div>
                      </div>
                    </div>
                  )}
                  {coin.nref && (
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0 mt-0.5">🔖</span>
                      <div>
                        <div className="text-[9px] text-ink/35 uppercase tracking-wider mb-0.5">
                          {coin.nref.startsWith('Z#') ? 'Z# Zeno' : 'N# Numista'}
                        </div>
                        <div className="text-ink font-mono">{coin.nref}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Show more toggle */}
                {(coin.wt || coin.dia || coin.km) && (
                  <button onClick={() => setShowMore(!showMore)}
                    className="mt-3 flex items-center gap-1 text-[10px] text-ink/40 hover:text-ink/60 transition-colors">
                    {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showMore ? (isAr ? 'عرض أقل' : 'Show less') : (isAr ? 'عرض المزيد' : 'Show more')}
                  </button>
                )}
              </div>
            </div>

            {/* ── Tags ── */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                isAr ? coin.co_ar : coin.co,
                coin.dyn,
                metalLabel,
                coin.yce ? `${coin.yce} ${isAr ? 'م' : 'CE'}` : null,
                coin.yah ? `${coin.yah} ${isAr ? 'هـ' : 'AH'}` : null,
                denomination ? (isAr ? DENOM_AR[denomination] ?? denomination : denomination) : null,
                coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Commemorative') : (isAr ? 'تداول' : 'Circulation'),
              ].filter(Boolean).map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-parch-dark/40 border border-gold-700/15 text-ink/50">
                  {tag}
                </span>
              ))}
            </div>

            {/* ── Mintage ── */}
            {mintageData.length > 0 ? (
              <MintageTable data={mintageData} locale={locale} />
            ) : legacyMint && legacyMint !== '' ? (
              <div className="flex items-center gap-3 bg-gold-500/10 border border-gold-500/30 rounded-xl px-4 py-3 mb-4">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="text-[9px] text-ink/40 uppercase tracking-wider">{t('mintage')}</div>
                  <div className="text-[18px] font-bold text-ink font-amiri">
                    {formatMintage(legacyMint, locale)} {t('pieces')}
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Description ── */}
            {coin.zeno_description && (
              <div className="border-t border-gold-700/15 pt-4 mb-4">
                <div className="text-[10px] text-ink/40 uppercase tracking-widest font-medium mb-3">
                  {isAr ? 'وصف العملة' : locale === 'de' ? 'Münzbeschreibung' : 'Coin Description'}
                </div>

                {coin.obverse_legend && (
                  <div className="mb-1.5">
                    <span className="text-[10px] font-semibold text-gold-600 me-1">
                      {isAr ? 'الوجه:' : 'Obverse:'}
                    </span>
                    <span className="text-[11px] text-ink/70 font-amiri">
                      {coin.obverse_legend}
                    </span>
                  </div>
                )}

                {coin.reverse_legend && (
                  <div className="mb-2">
                    <span className="text-[10px] font-semibold text-gold-600 me-1">
                      {isAr ? 'الظهر:' : 'Reverse:'}
                    </span>
                    <span className="text-[11px] text-ink/70 font-amiri">
                      {coin.reverse_legend}
                    </span>
                  </div>
                )}

                <p className="text-[12px] text-ink/60 leading-relaxed font-amiri italic mb-2">
                  {coin.zeno_description}
                </p>

                <div className="flex items-center gap-3 flex-wrap">
                  {coin.references && (
                    <span className="text-[10px] text-ink/40">
                      <span className="font-semibold text-gold-600/70">
                        {isAr ? 'مراجع: ' : 'Ref: '}
                      </span>
                      {coin.references}
                    </span>
                  )}
                  {coin.condition && (
                    <span className="text-[10px] text-ink/40">
                      <span className="font-semibold text-gold-600/70">
                        {isAr ? 'الحالة: ' : 'Grade: '}
                      </span>
                      {coin.condition}
                    </span>
                  )}
                  {coin.die_axis && (
                    <span className="text-[10px] text-ink/40">
                      <span className="font-semibold text-gold-600/70">
                        {isAr ? 'محور الضرب: ' : 'Die axis: '}
                      </span>
                      {coin.die_axis}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── Price Guide ── */}
            <div className="border-t border-gold-700/15 pt-4">
              <PriceGuide coinId={coin.id} locale={locale} cataloguePrices={coin.prices} />
            </div>

            {/* ── External links ── */}
            <div className="border-t border-gold-700/15 pt-4 flex items-center gap-2 flex-wrap">
              {coin.nid && (
                <a href={externalHref} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[12px] text-gold-600 border border-gold-700/30 rounded-full px-4 py-2 hover:border-gold-500 hover:text-gold-500 transition-colors">
                  <ExternalLink size={12} />{externalLabel}
                </a>
              )}
              <Link href={`/${locale}/catalogue/${coin.id}`}
                className="inline-flex items-center gap-2 text-[12px] text-gold-600 border border-gold-700/30 rounded-full px-4 py-2 hover:border-gold-500 hover:text-gold-500 transition-colors">
                <ExternalLink size={12} />🔗 {isAr ? 'صفحة العملة' : 'Coin page'}
              </Link>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
