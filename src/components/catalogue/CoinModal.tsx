'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, ZoomIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Coin, MintageEntry } from '@/types/coin';
import { supabase } from '@/lib/supabase';
import {
  getDiscGradient,
  getMetalSymbol,
  COUNTRY_FLAGS,
  formatMintage,
  isValidImageUrl,
  getCoinName,
  getCoinYear,
} from '@/lib/coins';

type CoinWithVarieties = Coin & { mintageData?: MintageEntry[] };

// ─── Print styles injected as <style> in modal ───────────────────────────────
const PRINT_CSS = `
@media print {
  body > *:not(#coin-print-root) { display: none !important; }
  #coin-print-root {
    display: block !important;
    position: fixed; inset: 0; background: white; z-index: 9999;
    padding: 24px; font-family: 'Amiri', serif; direction: rtl;
  }
  .no-print { display: none !important; }
  .print-card { display: block !important; }
}
`;



// ─── Rarity badge ─────────────────────────────────────────────────────────────

const RARITY_STYLES: Record<string, string> = {
  Common:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  Uncommon: 'bg-sky-900/40    text-sky-300    border-sky-700/40',
  Scarce:   'bg-amber-900/40  text-amber-300  border-amber-700/40',
  Rare:     'bg-red-900/40    text-red-300    border-red-700/40',
};

function RarityBadge({ rarity }: { rarity: string | null }) {
  if (!rarity) return null;
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${RARITY_STYLES[rarity] ?? 'bg-parch-dark text-ink/50 border-gold-700/20'}`}>
      {rarity}
    </span>
  );
}

function MintmarkPill({ mark }: { mark: string | null }) {
  if (!mark || mark === 'None') {
    return <span className="text-ink/30 text-[11px]">—</span>;
  }
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold-500/15 border border-gold-600/40 text-gold-400 text-[10px] font-bold tracking-wider">
      {mark}
    </span>
  );
}

// ─── Mintage table ────────────────────────────────────────────────────────────

function MintageTable({ data, locale }: { data: MintageEntry[]; locale: string }) {
  const isAr = locale === 'ar';

  const yearCounts: Record<number, number> = {};
  data.forEach(d => {
    if (d.YearGregorian) yearCounts[d.YearGregorian] = (yearCounts[d.YearGregorian] ?? 0) + 1;
  });

  if (!data.length) return null;

  return (
    <div className="mt-1 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] text-ink/40 uppercase tracking-widest font-medium">
          {isAr ? 'إصدارات النوع' : 'Type Issues'}
        </span>
        <div className="flex-1 h-px bg-gold-700/20" />
        <span className="text-[9px] text-ink/30">{data.length} {isAr ? 'إصدار' : 'issues'}</span>
      </div>

      {data.some(d => d.Mintmark && d.Mintmark !== 'None') && (
        <div className="flex items-start gap-2 bg-amber-400 border border-amber-500 rounded-lg px-3 py-2 mb-3 text-[11px] text-amber-950 font-medium">
          <span className="text-base leading-none mt-0.5">⚠️</span>
          <span>
            {isAr
              ? 'يحتوي هذا النوع على إصدارات بعلامات ضرب مختلفة — تحقق من حرف المطبعة قبل التقييم.'
              : 'This type includes mintmark varieties — verify the mint letter before pricing.'}
          </span>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-gold-700/25">
        <table className="w-full text-[12px]" dir={isAr ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="bg-parch-dark/80 border-b border-gold-700/20">
              <th className="px-3 py-2 text-[9px] text-ink/40 uppercase tracking-wider font-medium text-start">
                {isAr ? 'التاريخ (هـ / م)' : 'Year (H / G)'}
              </th>
              <th className="px-3 py-2 text-[9px] text-ink/40 uppercase tracking-wider font-medium text-center">
                {isAr ? 'علامة' : 'Mint'}
              </th>
              <th className="px-3 py-2 text-[9px] text-ink/40 uppercase tracking-wider font-medium text-end">
                {isAr ? 'المضروب' : 'Mintage'}
              </th>
              <th className="px-3 py-2 text-[9px] text-ink/40 uppercase tracking-wider font-medium text-center">
                {isAr ? 'الندرة' : 'Rarity'}
              </th>
              <th className="px-3 py-2 text-[9px] text-ink/40 uppercase tracking-wider font-medium text-start hidden sm:table-cell">
                {isAr ? 'ملاحظة' : 'Note'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((entry, idx) => {
              const isVarietyYear = entry.YearGregorian != null && (yearCounts[entry.YearGregorian] ?? 0) > 1;
              const isRare = entry.Rarity === 'Rare' || entry.Rarity === 'Scarce';

              return (
                <tr
                  key={idx}
                  className={[
                    'border-b border-gold-700/10 last:border-0 transition-colors',
                    isRare
                      ? 'bg-amber-950/20 hover:bg-amber-950/30'
                      : idx % 2 === 0
                        ? 'bg-parch-cream/30 hover:bg-parch-cream/60'
                        : 'hover:bg-parch-cream/40',
                  ].join(' ')}
                >
                  <td className="px-3 py-2.5 text-start">
                    <div className="flex flex-col gap-0.5">
                      {entry.YearHijri && (
                        <span className="font-amiri text-ink/80 text-[13px]">{entry.YearHijri} هـ</span>
                      )}
                      {entry.YearGregorian && (
                        <span className={`text-[11px] ${isVarietyYear ? 'text-gold-500 font-semibold' : 'text-ink/50'}`}>
                          {entry.YearGregorian} م
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <MintmarkPill mark={entry.Mintmark} />
                  </td>
                  <td className="px-3 py-2.5 text-end">
                    {entry.MintageCount != null ? (
                      <span className={`font-mono text-[12px] ${isRare ? 'text-amber-300 font-bold' : 'text-ink/80'}`}>
                        {formatMintage(String(entry.MintageCount), locale)}
                      </span>
                    ) : (
                      <span className="text-ink/25 text-[11px]">{isAr ? 'غير معروف' : 'Unknown'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <RarityBadge rarity={entry.Rarity} />
                  </td>
                  <td className="px-3 py-2.5 text-start hidden sm:table-cell">
                    {entry.Note && (
                      <span className="text-[10px] text-ink/40 leading-tight">{entry.Note}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.some(d => d.MintageCount != null) && (
        <div className="flex justify-end mt-1.5 gap-1 text-[10px] text-ink/30">
          <span>{isAr ? 'الإجمالي:' : 'Total:'}</span>
          <span className="text-ink/50 font-mono">
            {formatMintage(
              String(data.reduce((s, d) => s + (d.MintageCount ?? 0), 0)),
              locale,
            )}
          </span>
        </div>
      )}
    </div>
  );
}


// ─── Price Guide ──────────────────────────────────────────────────────────────

interface PriceRow {
  sheldon: number;
  grade_label: string;
  grade_ar: string;
  price_low: number | null;
  price_high: number | null;
  currency: string;
  certified: boolean;
  source: string;
  source_url: string | null;
  updated_at: string;
}

// Static monthly exchange rates — update once a month
const FX: Record<string, number> = {
  USD: 1, AED: 3.67, SAR: 3.75, EGP: 50.5,
  KWD: 0.31, OMR: 0.385, QAR: 3.64, GBP: 0.79,
  EUR: 0.92, AUD: 1.55,
};

const DISPLAY_CURRENCIES = ['USD', 'AED', 'SAR', 'EGP'];

function convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
  const inUSD = amount / (FX[fromCurrency] ?? 1);
  return Math.round(inUSD * (FX[toCurrency] ?? 1));
}

function PriceGuide({ coinId, locale }: { coinId: string; locale: string }) {
  const isAr = locale === 'ar';
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [certified, setCertified] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [submitPrice, setSubmitPrice] = useState(false);
  const [submission, setSubmission] = useState({ sheldon: 45, price: '', currency: 'USD', source_url: '' });
  const [submitted, setSubmitted] = useState(false);

  const SHELDON_GRADES_DISPLAY = [
    { sheldon: 4,  label: 'G-4',   ar: 'جيد ٤' },
    { sheldon: 8,  label: 'VG-8',  ar: 'جيد جداً ٨' },
    { sheldon: 12, label: 'F-12',  ar: 'ممتاز ١٢' },
    { sheldon: 20, label: 'VF-20', ar: 'ممتاز جداً ٢٠' },
    { sheldon: 30, label: 'VF-30', ar: 'ممتاز جداً ٣٠' },
    { sheldon: 40, label: 'EF-40', ar: 'بالغ الجودة ٤٠' },
    { sheldon: 45, label: 'EF-45', ar: 'بالغ الجودة ٤٥' },
    { sheldon: 50, label: 'AU-50', ar: 'شبه غير متداول ٥٠' },
    { sheldon: 58, label: 'AU-58', ar: 'شبه غير متداول ٥٨' },
    { sheldon: 62, label: 'MS-62', ar: 'حالة المطبعة ٦٢' },
    { sheldon: 65, label: 'MS-65', ar: 'حالة المطبعة ٦٥' },
    { sheldon: 70, label: 'MS-70', ar: 'حالة المطبعة ٧٠' },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('coin_grades').select('*')
        .eq('coin_id', coinId)
        .eq('certified', certified)
        .order('sheldon');
      setPrices(data ?? []);
      setLoading(false);
    };
    load();
  }, [coinId, certified]);

  const submitObservation = async () => {
    if (!submission.price) return;
    await supabase.from('price_submissions').insert({
      coin_id: coinId,
      sheldon: submission.sheldon,
      price: parseFloat(submission.price),
      currency: submission.currency,
      source_url: submission.source_url || null,
      certified: false,
    });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setSubmitPrice(false); }, 2000);
  };

  const latestSource = prices[0];

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-ink/40 uppercase tracking-widest font-medium">
            {isAr ? 'دليل الأسعار — Sheldon' : 'Price Guide — Sheldon Scale'}
          </span>
          <div className="flex-1 h-px bg-gold-700/20 w-8" />
        </div>
        {/* Certified toggle */}
        <div className="flex items-center gap-1 text-[10px]">
          <button onClick={() => setCertified(false)}
            className={`px-2 py-0.5 rounded-full transition-colors ${!certified ? 'bg-gold-500 text-ink font-semibold' : 'text-ink/40 hover:text-ink/60'}`}>
            {isAr ? 'خام' : 'Raw'}
          </button>
          <button onClick={() => setCertified(true)}
            className={`px-2 py-0.5 rounded-full transition-colors ${certified ? 'bg-gold-500 text-ink font-semibold' : 'text-ink/40 hover:text-ink/60'}`}>
            PCGS/NGC
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center text-ink/30 text-[12px]">
          {isAr ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : prices.length === 0 ? (
        <div className="bg-parch-dark/30 rounded-xl border border-gold-700/15 px-4 py-4 text-center">
          <p className="text-[12px] text-ink/40 font-amiri mb-2">
            {isAr ? 'لا توجد بيانات أسعار لهذه العملة بعد' : 'No price data for this coin yet'}
          </p>
          <button onClick={() => setSubmitPrice(true)}
            className="text-[11px] text-gold-600 border border-gold-700/30 rounded-full px-3 py-1 hover:border-gold-500 transition-colors">
            {isAr ? '+ سجّل سعر ملاحَظ' : '+ Submit observed price'}
          </button>
        </div>
      ) : (
        <>
          {/* Currency selector */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] text-ink/30">{isAr ? 'العملة:' : 'Currency:'}</span>
            {DISPLAY_CURRENCIES.map(c => (
              <button key={c} onClick={() => setDisplayCurrency(c)}
                className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${displayCurrency === c ? 'bg-gold-500 text-ink font-bold' : 'text-ink/40 hover:text-ink/70 border border-gold-700/20'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Price table */}
          <div className="rounded-xl overflow-hidden border border-gold-700/25">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-parch-dark/80 border-b border-gold-700/20">
                  <th className="px-2 py-2 text-[9px] text-ink/40 font-medium text-start">{isAr ? 'الدرجة' : 'Grade'}</th>
                  <th className="px-2 py-2 text-[9px] text-ink/40 font-medium text-end">{isAr ? `النطاق (${displayCurrency})` : `Range (${displayCurrency})`}</th>
                  <th className="px-2 py-2 text-[9px] text-ink/40 font-medium text-center hidden sm:table-cell">{isAr ? 'المصدر' : 'Source'}</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p, i) => {
                  const low  = p.price_low  ? convertPrice(p.price_low,  p.currency, displayCurrency) : null;
                  const high = p.price_high ? convertPrice(p.price_high, p.currency, displayCurrency) : null;
                  const grade = SHELDON_GRADES_DISPLAY.find(g => g.label === p.grade_label);
                  return (
                    <tr key={i} className={`border-b border-gold-700/10 last:border-0 ${i % 2 === 0 ? 'bg-parch-cream/30' : ''}`}>
                      <td className="px-2 py-2">
                        <span className="font-bold text-gold-600">{p.grade_label}</span>
                        {grade && <span className="text-[9px] text-ink/40 mr-1">— {isAr ? grade.ar : ''}</span>}
                      </td>
                      <td className="px-2 py-2 text-end font-mono text-ink/80">
                        {low != null ? (
                          <span>
                            {low.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                            {high != null && ` – ${high.toLocaleString(isAr ? 'ar-EG' : 'en-US')}`}
                          </span>
                        ) : (
                          <span className="text-ink/25">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center hidden sm:table-cell">
                        {p.source_url ? (
                          <a href={p.source_url} target="_blank" rel="noopener noreferrer"
                            className="text-[9px] text-gold-600 hover:underline">{p.source}</a>
                        ) : (
                          <span className="text-[9px] text-ink/30">{p.source}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-1.5">
            {latestSource && (
              <span className="text-[9px] text-ink/25">
                {isAr ? 'آخر تحديث:' : 'Updated:'} {new Date(latestSource.updated_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-AU')}
              </span>
            )}
            <button onClick={() => setSubmitPrice(s => !s)}
              className="text-[10px] text-gold-600 hover:text-gold-400 transition-colors">
              {isAr ? '+ اقتراح سعر' : '+ Suggest price'}
            </button>
          </div>
        </>
      )}

      {/* Submit price form */}
      {submitPrice && (
        <div className="mt-3 bg-parch-dark/30 rounded-xl border border-gold-700/20 p-3 space-y-2">
          <p className="text-[11px] text-ink/60 font-amiri">
            {isAr ? 'شارك سعراً ملاحظاً — سيُراجع قبل النشر' : 'Share an observed price — reviewed before publishing'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <select className="text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink outline-none"
              value={submission.sheldon}
              onChange={e => setSubmission(s => ({ ...s, sheldon: parseInt(e.target.value) }))}>
              {SHELDON_GRADES_DISPLAY.map(g => <option key={g.label} value={g.sheldon}>{g.label}</option>)}
            </select>
            <input className="text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink outline-none" dir="ltr"
              type="number" placeholder={isAr ? 'السعر' : 'Price'}
              value={submission.price} onChange={e => setSubmission(s => ({ ...s, price: e.target.value }))} />
            <select className="text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink outline-none"
              value={submission.currency}
              onChange={e => setSubmission(s => ({ ...s, currency: e.target.value }))}>
              {['USD','AED','SAR','EGP','AUD','GBP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-gold-700/30 bg-parch-cream text-ink outline-none" dir="ltr"
            placeholder={isAr ? 'رابط المصدر (اختياري)' : 'Source URL (optional)'}
            value={submission.source_url} onChange={e => setSubmission(s => ({ ...s, source_url: e.target.value }))} />
          <button onClick={submitObservation}
            className={`w-full py-2 rounded-xl text-[12px] font-semibold transition-colors ${submitted ? 'bg-emerald-600 text-white' : 'bg-gold-600 hover:bg-gold-500 text-ink'}`}>
            {submitted ? (isAr ? '✓ تم الإرسال للمراجعة' : '✓ Submitted for review') : (isAr ? 'إرسال' : 'Submit')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  coin: Coin;
  side: 'obverse' | 'reverse';
  locale: string;
  onClose: () => void;
  onSwitchSide: (s: 'obverse' | 'reverse') => void;
}

function Lightbox({ coin, side, locale, onClose, onSwitchSide }: LightboxProps) {
  const src = side === 'obverse' ? coin.o : coin.r;
  const t = useTranslations('coin');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        onSwitchSide(side === 'obverse' ? 'reverse' : 'obverse');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [side, onClose, onSwitchSide]);

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,5,0,.95)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="self-start w-9 h-9 rounded-full border border-gold-700/50 text-gold-400 hover:text-gold-200 flex items-center justify-center transition-colors">
          <X size={16} />
        </button>

        {isValidImageUrl(src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={side} loading="lazy"
            className="max-w-[320px] max-h-[320px] rounded-full object-cover"
            style={{
              border: '4px solid #F0E8D4', outline: '3px solid #8B6D2E',
              boxShadow: '0 0 60px rgba(201,168,76,.25), 0 8px 40px rgba(0,0,0,.8)',
            }} />
        ) : (
          <div className="w-64 h-64 rounded-full flex items-center justify-center text-5xl font-amiri font-bold text-ink"
            style={{ background: getDiscGradient(coin.metal) }}>
            {getMetalSymbol(coin.metal)}
          </div>
        )}

        <div className="text-center">
          <div className="font-amiri text-gold-300 text-xl mb-1">{getCoinName(coin, locale)}</div>
          <div className="text-gold-600/60 text-sm">
            {side === 'obverse' ? t('obverse') : t('reverse')} · {getCoinYear(coin, locale)}
          </div>
        </div>

        <div className="flex rounded-full overflow-hidden border border-gold-700/40">
          {(['obverse', 'reverse'] as const).map(s => (
            <button key={s} onClick={() => onSwitchSide(s)}
              className={`px-5 py-2 text-[12px] font-medium transition-colors
                ${side === s ? 'bg-gold-500 text-ink' : 'text-gold-400 hover:text-gold-200'}`}>
              {s === 'obverse' ? t('obverse') : t('reverse')}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── SpecCard ─────────────────────────────────────────────────────────────────

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-parch-dark/60 border border-gold-700/20 rounded-xl px-3 py-2.5">
      <div className="text-[9px] text-ink/40 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] font-medium text-ink">{value}</div>
    </div>
  );
}

// ─── CoinModal ────────────────────────────────────────────────────────────────

export default function CoinModal({
  coin, locale, onClose,
}: {
  coin: Coin; locale: string; onClose: () => void;
}) {
  const t = useTranslations('coin');
  const isAr = locale === 'ar';
  const c = coin as CoinWithVarieties;
  const [lightbox, setLightbox] = useState<'obverse' | 'reverse' | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lightbox) onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [lightbox, onClose]);

  const coinName = getCoinName(coin, locale);
  const mintageData: MintageEntry[] = c.mintageData ?? [];
  const legacyMint: string | null = mintageData.length === 0 ? (coin.mint ?? null) : null;

  const years = mintageData.map(d => d.YearGregorian).filter((y): y is number => y != null);
  const yearRangeLabel = years.length >= 2
    ? `${Math.min(...years)} – ${Math.max(...years)} م`
    : years.length === 1 ? `${years[0]} م`
    : getCoinYear(coin, locale);

  const metalLabel = isAr
    ? ({
        Gold: 'ذهب', Silver: 'فضة', Copper: 'نحاس', Bronze: 'برونز',
        'Copper-nickel': 'نحاس-نيكل', 'Cupro-Nickel': 'نحاس-نيكل',
        Nickel: 'نيكل', Bimetallic: 'ثنائي', Aluminium: 'ألمنيوم',
        'Aluminium bronze': 'برونز ألمنيوم', Billon: 'بيون',
        Brass: 'نحاس أصفر', Steel: 'فولاذ',
      }[coin.metal] ?? coin.metal)
    : coin.metal;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <motion.div
        className="fixed inset-0 z-[150]"
        style={{ background: 'rgba(22,16,10,.82)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-0 z-[151] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-parch-cream rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[92vh] overflow-y-auto"
          style={{ border: '1px solid rgba(139,109,46,.4)' }}
          initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header bar */}
          <div className="sticky top-0 bg-parch-cream flex items-center justify-between px-5 py-3.5 border-b border-gold-700/20 z-10">
            <span className="text-[10px] text-ink/30 font-mono">{coin.id} · {coin.km} · {coin.nref}</span>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full border border-gold-700/30 text-gold-600 hover:text-gold-400 hover:border-gold-500 flex items-center justify-center transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="px-5 py-5">
            {/* Coin images */}
            <div className="flex items-start justify-center gap-8 mb-6">
              {(['obverse', 'reverse'] as const).map(side => {
                const src = side === 'obverse' ? coin.o : coin.r;
                return (
                  <div key={side} className="flex flex-col items-center gap-2">
                    <button onClick={() => setLightbox(side)} className="group relative" title={t(side)}>
                      {isValidImageUrl(src) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={`${coinName} — ${t(side)}`}
                          className="w-[130px] h-[130px] rounded-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:rounded-none group-hover:w-[200px] group-hover:h-[200px] group-hover:z-30 group-hover:relative"
                          style={{ border: '3px solid #F0E8D4', outline: '2px solid #8B6D2E', boxShadow: '0 4px 20px rgba(80,50,10,.18)', transformOrigin: 'center' }} />
                      ) : (
                        <div className="w-[130px] h-[130px] rounded-full flex items-center justify-center font-amiri font-bold text-3xl text-ink"
                          style={{ background: getDiscGradient(coin.metal), border: '3px solid #F0E8D4', outline: '2px solid #8B6D2E' }}>
                          {getMetalSymbol(coin.metal)}
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <ZoomIn size={20} className="text-gold-300" />
                      </div>
                    </button>
                    <button onClick={() => setLightbox(side)}
                      className="text-[11px] text-gold-600 border border-gold-700/30 rounded-full px-3 py-1 hover:border-gold-500 hover:text-gold-500 transition-colors">
                      {t(side)}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Coin title */}
            <div className={`mb-5 ${isAr ? 'text-right' : 'text-left'}`}>
              <h2 className="font-amiri text-2xl text-ink leading-tight mb-1">{coinName}</h2>
              <p className="text-[12px] text-ink/40 italic mb-2">{coin.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px]">{COUNTRY_FLAGS[coin.cc] ?? ''}</span>
                <span className="text-[12px] text-ink/60">{isAr ? coin.co_ar : coin.co} · {coin.co}</span>
              </div>
              <div className="text-[12px] text-gold-600 font-medium mt-1">{coin.dyn} · {yearRangeLabel}</div>
            </div>

            {/* Mintage table or legacy */}
            {mintageData.length > 0 ? (
              <MintageTable data={mintageData} locale={locale} />
            ) : legacyMint != null && legacyMint !== '' ? (
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

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <SpecCard label={t('metal')} value={metalLabel} />
              <SpecCard label={t('type')}
                value={coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Commemorative') : (isAr ? 'تداول' : 'Circulation')} />
              {coin.wt != null && <SpecCard label={`${t('weight')} (غ)`} value={`${coin.wt} g`} />}
              {coin.dia != null && <SpecCard label={`${t('diameter')} (مم)`} value={`${coin.dia} mm`} />}
              {coin.km && <SpecCard label="KM#" value={coin.km} />}
              {coin.nref && <SpecCard label="N# Numista" value={coin.nref} />}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                coin.co_ar, coin.dyn, metalLabel,
                years.length >= 2 ? `${Math.min(...years)}–${Math.max(...years)}` : coin.yce ? `${coin.yce} م` : null,
                coin.yah ? `${coin.yah} هـ` : null,
                coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Commemorative') : (isAr ? 'تداول' : 'Circulation'),
              ].filter(Boolean).map((tag, i) => (
                <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-parch-dark border border-gold-700/20 text-ink/60">
                  {tag}
                </span>
              ))}
            </div>

            {/* Price Guide */}
            <PriceGuide coinId={coin.id} locale={locale} />

            {/* Numista link + coin page link */}
            <div className="flex items-center gap-2 flex-wrap">
              {coin.nid && (
                <a href={`https://en.numista.com/catalogue/pieces${coin.nid}.html`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[12px] text-gold-600 border border-gold-700/30 rounded-full px-4 py-2 hover:border-gold-500 hover:text-gold-500 transition-colors">
                  <ExternalLink size={12} />
                  {t('viewOnNumista')}
                </a>
              )}
              <a href={`/${locale}/catalogue/${coin.id}`}
                className="inline-flex items-center gap-2 text-[12px] text-gold-600 border border-gold-700/30 rounded-full px-4 py-2 hover:border-gold-500 hover:text-gold-500 transition-colors">
                <ExternalLink size={12} />
                {locale === 'ar' ? '🔗 صفحة العملة' : '🔗 Coin page'}
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {lightbox && (
        <Lightbox coin={coin} side={lightbox} locale={locale}
          onClose={() => setLightbox(null)} onSwitchSide={setLightbox} />
      )}
    </>
  );
}
