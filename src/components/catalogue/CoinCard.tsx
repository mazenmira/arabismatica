'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Coin, MintageEntry } from '@/types/coin';
import {
  getDiscGradient,
  getMetalSymbol,
  METAL_BADGE_CLASSES,
  COUNTRY_FLAGS,
  formatMintage,
  isValidImageUrl,
  getCoinName,
  getCoinYear,
} from '@/lib/coins';

// Extend Coin locally to include mintageData without touching the shared type yet
type CoinWithVarieties = Coin & { mintageData?: MintageEntry[] };

interface CoinCardProps {
  coin: Coin;
  locale: string;
  view: 'grid' | 'list';
  onClick: () => void;
  inCollection?: boolean;
  onToggleCollection?: (e: React.MouseEvent) => void;
  inWishlist?: boolean;
  onToggleWishlist?: (e: React.MouseEvent) => void;
}

// ─── Year range helper ────────────────────────────────────────────────────────

function getCardYearRange(coin: CoinWithVarieties, locale: string): string {
  const isAr = locale === 'ar';
  const data: MintageEntry[] = coin.mintageData ?? [];

  const years = data
    .map((d: MintageEntry) => d.YearGregorian)
    .filter((y): y is number => y != null);

  if (years.length === 0) return getCoinYear(coin, locale);

  const min = Math.min(...years);
  const max = Math.max(...years);

  const hijriYears = Array.from(new Set(data.map((d: MintageEntry) => d.YearHijri).filter((h): h is string => h != null)));
  const hijriLabel = hijriYears.length === 1 ? ` / ${hijriYears[0]} هـ` : '';

  if (min === max) return isAr ? `${min} م${hijriLabel}` : `${min}${hijriLabel}`;
  return isAr ? `${min} – ${max} م${hijriLabel}` : `${min} – ${max}${hijriLabel}`;
}

// ─── Variety pill ─────────────────────────────────────────────────────────────

function VarietyPill({ coin, locale }: { coin: CoinWithVarieties; locale: string }) {
  const isAr = locale === 'ar';
  const data: MintageEntry[] = coin.mintageData ?? [];
  const hasVarieties = data.some(
    (d: MintageEntry) => d.Mintmark && d.Mintmark !== 'None'
  );
  if (!hasVarieties) return null;
  return (
    <span
      title={isAr ? 'يحتوي على علامات ضرب متعددة' : 'Multiple mintmark varieties'}
      className="inline-flex items-center gap-0.5 text-[9px] text-amber-900 bg-amber-400 border border-amber-500 rounded-full px-1.5 py-0.5 font-semibold"
    >
      ◈ {isAr ? 'متعدد' : 'Varieties'}
    </span>
  );
}

// ─── Coin image ───────────────────────────────────────────────────────────────

function CoinImage({
  src, alt, metal, side,
}: {
  src: string; alt: string; metal: string; side: 'obverse' | 'reverse';
}) {
  const [error, setError] = useState(false);
  const sideLabel = side === 'obverse' ? 'و' : 'ظ';

  if (!isValidImageUrl(src) || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <div
          className="w-[70px] h-[70px] rounded-full flex items-center justify-center relative overflow-hidden border-2 border-parch/30"
          style={{ background: getDiscGradient(metal) }}
        >
          {/* Coin silhouette SVG */}
          <svg viewBox="0 0 70 70" className="absolute inset-0 w-full h-full opacity-20" fill="currentColor">
            <circle cx="35" cy="35" r="33" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="35" cy="35" r="26" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <circle cx="35" cy="35" r="12" fill="currentColor" opacity="0.4" />
            <path d="M35 16 L37 28 L35 30 L33 28 Z" fill="currentColor" opacity="0.3" />
            <path d="M35 54 L37 42 L35 40 L33 42 Z" fill="currentColor" opacity="0.3" />
            <path d="M16 35 L28 33 L30 35 L28 37 Z" fill="currentColor" opacity="0.3" />
            <path d="M54 35 L42 33 L40 35 L42 37 Z" fill="currentColor" opacity="0.3" />
          </svg>
          <span className="text-[9px] text-ink/50 z-10 font-amiri">
            {side === 'obverse' ? 'و' : 'ظ'}
          </span>
        </div>
        <span className="text-[8px] text-ink/30">{sideLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src} alt={alt} loading="lazy"
        onError={() => setError(true)}
        className="w-[70px] h-[70px] rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
        style={{
          border: '2.5px solid #FFFFFF',
          outline: '1.5px solid #8B6D2E',
          boxShadow: '0 2px 8px rgba(80,50,10,.15)',
        }}
      />
      <span className="text-[9px] text-ink/40">{sideLabel}</span>
    </div>
  );
}

// ─── CoinCard ─────────────────────────────────────────────────────────────────

export default function CoinCard({ coin, locale, view, onClick, inCollection = false, onToggleCollection, inWishlist = false, onToggleWishlist }: CoinCardProps) {
  const c = coin as CoinWithVarieties;
  const isAr = locale === 'ar';
  const coinName = getCoinName(coin, locale);
  const yearRange = getCardYearRange(c, locale);

  const METAL_AR: Record<string, string> = {
    'Gold': 'ذهب', 'Silver': 'فضة', 'Copper': 'نحاس', 'Bronze': 'برونز',
    'Nickel': 'نيكل', 'Cupro-Nickel': 'نحاس-نيكل', 'Aluminium': 'ألمنيوم',
    'Aluminum': 'ألمنيوم', 'Bimetallic': 'ثنائي المعدن', 'Billon': 'بليون',
    'Brass': 'نحاس أصفر', 'Steel': 'فولاذ', 'Other': 'أخرى',
  };
  const metaLabel = isAr ? (METAL_AR[coin.metal] ?? coin.metal) : coin.metal;

  const mintageData: MintageEntry[] = c.mintageData ?? [];
  const totalMintage = mintageData.length > 0
    ? mintageData.reduce((s, d) => s + (d.MintageCount ?? 0), 0)
    : (coin.mint ? parseInt(coin.mint, 10) : null);

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <Link
        href={`/${locale}/catalogue/${coin.id}`}
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className="w-full flex items-center gap-3 bg-parch-cream rounded-xl border border-gold-700/15 hover:border-gold-500/50 hover:shadow-md transition-all group text-right px-3 py-2.5 cursor-pointer"
      >
        <div className="shrink-0">
          <CoinImage src={coin.o} alt={coinName} metal={coin.metal} side="obverse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[11px]">{COUNTRY_FLAGS[coin.cc] ?? ''}</span>
            <span className="text-[10px] text-ink/40">{isAr ? coin.co_ar : coin.co}</span>
          </div>
          <div className="text-[14px] font-amiri text-ink truncate">{coinName}</div>
          <div className="text-[10px] text-ink/40 truncate">{coin.dyn}</div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          <div className="text-[11px] text-gold-600 font-medium">{yearRange}</div>
          <VarietyPill coin={c} locale={locale} />
          {totalMintage != null && totalMintage > 0 && (
            <div className="text-[10px] text-gold-500/60">
              {formatMintage(String(totalMintage), locale)}
            </div>
          )}
          {onToggleCollection && (
            <button
              onClick={onToggleCollection}
              className={`text-[10px] mt-0.5 transition-all rounded-full px-1.5 py-0.5 border
                ${inCollection
                  ? 'bg-gold-500 border-gold-500 text-ink font-bold'
                  : 'border-gold-700/30 text-ink/30 hover:border-gold-500/60 hover:text-gold-500'}`}
            >
              {inCollection ? '✓' : '+'}
            </button>
          )}
        </div>
      </Link>
    );
  }

  // ── Grid view — Dark theme ────────────────────────────────────────────────
  const isZeno       = coin.nref?.startsWith('Z#');
  const denomination = (coin as Coin & { denomination?: string }).denomination;
  const ruler        = (coin as Coin & { ruler?: string; ruler_ar?: string }).ruler;
  const ruler_ar_val = (coin as Coin & { ruler?: string; ruler_ar?: string }).ruler_ar;
  const mint_en      = (coin as Coin & { mint?: string; mint_ar?: string }).mint;
  const mint_ar_val  = (coin as Coin & { mint?: string; mint_ar?: string }).mint_ar;

  const DARK_METAL_BADGE: Record<string, React.CSSProperties> = {
    'Gold':   { background: '#2A1E08', color: '#C9A84C' },
    'Silver': { background: '#1A1E24', color: '#8A9EAA' },
    'Bronze': { background: '#2A1A08', color: '#C9844C' },
    'Copper': { background: '#2A1A08', color: '#C9844C' },
    'Billon': { background: '#1A1A1E', color: '#7A7A8A' },
  };
  const metalStyle = DARK_METAL_BADGE[coin.metal] ?? { background: '#1E1A14', color: '#7A6E5C' };

  return (
    <Link
      href={`/${locale}/catalogue/${coin.id}`}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="group w-full rounded-sm border hover:border-[#C9A84C] hover:shadow-[0_0_0_1px_rgba(201,168,76,0.125)] transition-all cursor-pointer overflow-hidden flex flex-col text-right animate-fade-in"
      style={{ background: '#120F08', borderColor: '#1E1A12', borderRadius: '4px' }}
    >
      {/* Top row: flag + dynasty label + metal badge */}
      <div className="flex justify-between items-center px-2.5 pt-2.5">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[10px] shrink-0">{COUNTRY_FLAGS[coin.cc] ?? ''}</span>
          <span className="text-[9px] truncate" style={{ color: '#5A5040', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {coin.dyn || (isAr ? coin.co_ar : coin.co)}
          </span>
        </div>
        <span className="text-[10px] font-semibold shrink-0 ms-1"
          style={{ ...metalStyle, padding: '2px 8px', borderRadius: '2px', textTransform: 'uppercase' }}>
          {metaLabel}
        </span>
      </div>

      {/* Coin images — square aspect ratio */}
      {isZeno ? (
        <div className="flex items-center justify-center mx-2 my-1.5 rounded" style={{ background: '#0A0806', aspectRatio: '1/1', padding: '12px' }}>
          {isValidImageUrl(coin.o) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coin.o} alt={coinName}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: getDiscGradient(coin.metal) }}>
              {getMetalSymbol(coin.metal)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex overflow-hidden mx-2 my-1.5 rounded" style={{ background: '#0A0806', aspectRatio: '1/1', padding: '12px', gap: '8px' }}>
          <div className="flex-1 flex items-center justify-center">
            <CoinImage src={coin.o} alt={`${coinName} — ${isAr ? 'الوجه' : 'Obverse'}`} metal={coin.metal} side="obverse" />
          </div>
          <div style={{ width: '1px', background: '#1E1A12', margin: '8px 0' }} />
          <div className="flex-1 flex items-center justify-center">
            <CoinImage src={coin.r} alt={`${coinName} — ${isAr ? 'الظهر' : 'Reverse'}`} metal={coin.metal} side="reverse" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-2.5 pt-1.5 pb-1 flex-1 flex flex-col gap-1" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Name */}
        <div className="font-amiri leading-tight line-clamp-2" title={coinName}
          style={{ fontSize: '14px', color: '#E8DCC8', fontWeight: 500, lineHeight: 1.35, marginBottom: '2px' }}>
          {coinName}
        </div>

        {/* Ruler */}
        {ruler && (
          <div className="text-[9px] truncate" style={{ color: '#5A5040' }}>
            {isAr && ruler_ar_val ? ruler_ar_val : ruler}
          </div>
        )}

        {/* Year */}
        {yearRange && (
          <div className="font-amiri" style={{ color: '#C9A84C', fontSize: '13px', fontStyle: 'italic' }}>{yearRange}</div>
        )}

        {/* Mint */}
        {mint_en && (
          <div className="truncate" style={{ color: '#7A6E5C', fontSize: '12px' }}>
            {isAr && mint_ar_val ? mint_ar_val : mint_en}
          </div>
        )}

        {/* Denomination badge — skip Fals/Fils as it repeats title */}
        {denomination && denomination !== 'Fals' && denomination !== 'Fils' && (
          <span className="self-start"
            style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '2px',
              ...(denomination === 'Dinar'  ? { background: '#2A1E08', color: '#C9A84C' } :
                  denomination === 'Dirham' ? { background: '#1A1E24', color: '#8A9EAA' } :
                  { background: '#1E1A14', color: '#5A5040' }),
            }}>
            {isAr ? ({Dinar:'دينار',Dirham:'درهم',Other:'أخرى'} as Record<string,string>)[denomination] ?? denomination : denomination}
          </span>
        )}

        <VarietyPill coin={c} locale={locale} />
      </div>

      {/* Footer action strip */}
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ background: '#0E0C08', borderTop: '1px solid #1E1A12' }}>
        <span className="text-[11px] transition-colors group-hover:text-[#C9A84C]" style={{ color: '#5A5040' }}>
          {isAr ? 'عرض العملة ←' : 'View coin →'}
        </span>
        <div className="flex items-center gap-1">
          {onToggleCollection && (
            <button onClick={onToggleCollection}
              title={isAr ? (inCollection ? 'إزالة' : 'أضف للمجموعة') : (inCollection ? 'Remove' : 'Add')}
              className={`text-[10px] transition-all rounded-full w-5 h-5 flex items-center justify-center border
                ${inCollection ? 'bg-gold-500 border-gold-500 text-ink' : 'border-[#2E2820] text-[#5A5040] hover:border-[#C9A84C] hover:text-[#C9A84C]'}`}>
              {inCollection ? '✓' : '+'}
            </button>
          )}
          {onToggleWishlist && (
            <button onClick={onToggleWishlist}
              title={isAr ? (inWishlist ? 'إزالة من الأمنيات' : 'أضف للأمنيات') : (inWishlist ? 'Remove' : 'Wish')}
              className={`text-[10px] transition-all rounded-full w-5 h-5 flex items-center justify-center border
                ${inWishlist ? 'bg-red-500 border-red-500 text-white' : 'border-[#2E2820] text-[#5A5040] hover:border-red-500 hover:text-red-400'}`}>
              {inWishlist ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
