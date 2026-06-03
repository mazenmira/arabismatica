'use client';

import { useState } from 'react';
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
          border: '2.5px solid #FAF6EE',
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
  const metalBadgeClass = METAL_BADGE_CLASSES[coin.metal] ?? METAL_BADGE_CLASSES.Other;
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
              📊 {formatMintage(String(totalMintage), locale)}
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

  // ── Grid view — Premium redesign ──────────────────────────────────────────
  const isZeno       = coin.nref?.startsWith('Z#');
  const denomination = (coin as Coin & { denomination?: string }).denomination;
  const ruler        = (coin as Coin & { ruler?: string }).ruler;

  return (
    <Link
      href={`/${locale}/catalogue/${coin.id}`}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="group w-full rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(145deg, #FFFDF8 0%, #FAF5E8 100%)',
        border: '1px solid rgba(139,109,46,0.15)',
        boxShadow: '0 2px 12px rgba(80,50,10,0.07)',
      }}
    >
      {/* Image area — dark background */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a0e05 0%, #2d1a08 100%)', minHeight: 110 }}>

        {/* Metal badge — top start */}
        <div className="absolute top-2 start-2 z-10">
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${metalBadgeClass}`}>
            {metaLabel}
          </span>
        </div>

        {/* Denomination badge — top end (Islamic coins) */}
        {denomination && (
          <div className="absolute top-2 end-2 z-10">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border
              ${denomination === 'Dinar'  ? 'bg-amber-900/60 border-amber-600/40 text-amber-200' :
                denomination === 'Dirham' ? 'bg-sky-900/60 border-sky-600/40 text-sky-200' :
                'bg-white/10 border-white/20 text-white/60'}`}>
              {isAr ? ({Dinar:'دينار',Dirham:'درهم',Fals:'فلس',Fils:'فلس',Other:'أخرى'} as Record<string,string>)[denomination] ?? denomination : denomination}
            </span>
          </div>
        )}

        {/* Coin images */}
        {isZeno ? (
          <div className="flex items-center justify-center h-[110px]">
            {isValidImageUrl(coin.o) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coin.o} alt={coinName}
                className="max-h-[100px] w-auto max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                style={{ filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.5))' }} />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: getDiscGradient(coin.metal) }}>
                {getMetalSymbol(coin.metal)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 px-3 py-2 h-[110px]">
            <div className="group-hover:scale-108 transition-transform duration-300">
              <CoinImage src={coin.o} alt={`${coinName} — ${isAr ? 'الوجه' : 'Obverse'}`} metal={coin.metal} side="obverse" />
            </div>
            {isValidImageUrl(coin.r) && (
              <div className="group-hover:scale-108 transition-transform duration-300">
                <CoinImage src={coin.r} alt={`${coinName} — ${isAr ? 'الظهر' : 'Reverse'}`} metal={coin.metal} side="reverse" />
              </div>
            )}
          </div>
        )}

        {/* Variety pill bottom center */}
        <div className="absolute bottom-1.5 start-1/2 -translate-x-1/2">
          <VarietyPill coin={c} locale={locale} />
        </div>
      </div>

      {/* Content area */}
      <div className="px-3 pt-2.5 pb-2 flex-1 flex flex-col gap-0.5">
        {/* Country + year row */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[11px] shrink-0">{COUNTRY_FLAGS[coin.cc] ?? '☪️'}</span>
            <span className="text-[9px] text-ink/40 truncate">{isAr ? coin.co_ar : coin.co}</span>
          </div>
          {yearRange && (
            <span className="text-[10px] text-gold-600 font-medium font-amiri shrink-0">{yearRange}</span>
          )}
        </div>

        {/* Name */}
        <div className="text-[13px] font-amiri text-ink leading-tight line-clamp-2 mt-0.5" title={coinName}>
          {coinName}
        </div>

        {/* Dynasty */}
        {coin.dyn && (
          <div className="text-[9px] text-ink/35 truncate">{coin.dyn}</div>
        )}

        {/* Ruler for Islamic coins */}
        {ruler && (
          <div className="text-[9px] text-gold-600/60 truncate flex items-center gap-0.5">
            <span className="opacity-70">👤</span> {ruler}
          </div>
        )}

        {/* Reference */}
        {coin.nref && (
          <div className="text-[8px] text-ink/20 font-mono mt-0.5">{coin.nref}</div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-gold-700/8"
        style={{ background: 'rgba(139,109,46,0.04)' }}>
        <div className="flex items-center gap-1.5">
          {totalMintage != null && totalMintage > 0 && (
            <span className="text-[8px] text-ink/35 flex items-center gap-0.5">
              <span>📊</span> {formatMintage(String(totalMintage), locale)}
            </span>
          )}
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
            coin.type === 'Commemorative'
              ? 'border-amber-300/40 text-amber-600/70'
              : 'border-gold-700/12 text-ink/20'}`}>
            {coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Comm.') : (isAr ? 'تداول' : 'Circ.')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleCollection && (
            <button onClick={onToggleCollection}
              title={isAr ? (inCollection ? 'إزالة' : 'أضف للمجموعة') : (inCollection ? 'Remove' : 'Add')}
              className={`text-[10px] transition-all rounded-full w-5 h-5 flex items-center justify-center border
                ${inCollection ? 'bg-gold-500 border-gold-500 text-ink' : 'border-gold-700/25 text-ink/25 hover:border-gold-500/60 hover:text-gold-500'}`}>
              {inCollection ? '✓' : '+'}
            </button>
          )}
          {onToggleWishlist && (
            <button onClick={onToggleWishlist}
              title={isAr ? (inWishlist ? 'إزالة من الأمنيات' : 'أضف للأمنيات') : (inWishlist ? 'Remove' : 'Wish')}
              className={`text-[10px] transition-all rounded-full w-5 h-5 flex items-center justify-center border
                ${inWishlist ? 'bg-red-400 border-red-400 text-white' : 'border-gold-700/25 text-ink/25 hover:border-red-300 hover:text-red-400'}`}>
              {inWishlist ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
