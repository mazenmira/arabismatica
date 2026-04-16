'use client';

import { useState } from 'react';
import type { Coin } from '@/types/coin';
import { getDiscGradient, getMetalSymbol, METAL_BADGE_CLASSES, COUNTRY_FLAGS, formatMintage, isValidImageUrl, getCoinName } from '@/lib/coins';

interface CoinCardProps {
  coin: Coin;
  locale: string;
  view: 'grid' | 'list';
  onClick: () => void;
}

function CoinImage({ src, alt, metal, side }: { src: string; alt: string; metal: string; side: 'obverse' | 'reverse' }) {
  const [error, setError] = useState(false);
  const sideLabel = side === 'obverse' ? 'و' : 'ظ';

  if (!isValidImageUrl(src) || error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-0.5">
        <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center font-amiri font-bold text-xl text-ink border-2 border-parch/50"
          style={{ background: getDiscGradient(metal) }}>
          {getMetalSymbol(metal)}
        </div>
        <span className="text-[9px] text-ink/40">{sideLabel}</span>
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

export default function CoinCard({ coin, locale, view, onClick }: CoinCardProps) {
  const isAr = locale === 'ar';
  const metalBadgeClass = METAL_BADGE_CLASSES[coin.metal] ?? METAL_BADGE_CLASSES.Other;
  const coinName = getCoinName(coin, locale);
  const metaLabel = isAr
    ? (coin.metal === 'Gold' ? 'ذهب' : coin.metal === 'Silver' ? 'فضة' : coin.metal === 'Copper' || coin.metal === 'Bronze' ? 'نحاس' : coin.metal)
    : coin.metal;

  if (view === 'list') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 bg-parch-cream rounded-xl border border-gold-700/15 hover:border-gold-500/50 hover:shadow-md transition-all group text-right px-3 py-2.5 cursor-pointer">
        {/* Obverse only in list view */}
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
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-gold-600 font-medium">
            {coin.yce ? `${coin.yce}${isAr ? ' م' : ''}` : ''}
            {coin.yah ? ` · ${coin.yah}${isAr ? ' هـ' : ''}` : ''}
          </div>
          {coin.mint && (
            <div className="text-[10px] text-gold-500/60 mt-0.5">
              📊 {formatMintage(coin.mint, locale)}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group w-full bg-parch-cream rounded-xl border border-gold-700/15 hover:border-gold-500 hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col text-right animate-fade-in"
      style={{ boxShadow: '0 1px 8px rgba(80,50,10,.06)' }}>

      {/* Images row */}
      <div className="relative flex bg-parch-dark/60 h-[96px] overflow-hidden">
        {/* Metal badge */}
        <span className={`absolute top-2 right-2 z-10 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${metalBadgeClass}`}>
          {metaLabel}
        </span>

        {/* Obverse */}
        <div className="flex-1 flex items-center justify-center">
          <CoinImage src={coin.o} alt={`${coinName} — ${isAr ? 'الوجه' : 'Obverse'}`} metal={coin.metal} side="obverse" />
        </div>

        {/* Divider */}
        <div className="w-px bg-gold-700/20 my-3" />

        {/* Reverse */}
        <div className="flex-1 flex items-center justify-center">
          <CoinImage src={coin.r} alt={`${coinName} — ${isAr ? 'الظهر' : 'Reverse'}`} metal={coin.metal} side="reverse" />
        </div>
      </div>

      {/* Card body */}
      <div className="px-2.5 pt-2 pb-1 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">{COUNTRY_FLAGS[coin.cc] ?? ''}</span>
          <span className="text-[9px] text-ink/35 truncate">{isAr ? coin.co_ar : coin.co}</span>
        </div>
        <div className="text-[14px] font-amiri text-ink leading-tight truncate" title={coinName}>
          {coinName}
        </div>
        <div className="text-[9px] text-ink/40 truncate">{coin.dyn}</div>
        <div className="text-[10px] text-gold-600 font-medium mt-0.5">
          {coin.yce ? `${coin.yce}${isAr ? ' م' : ''}` : ''}
          {coin.yah ? ` · ${coin.yah}${isAr ? ' هـ' : ''}` : ''}
        </div>
        {coin.km && (
          <div className="text-[8px] text-ink/25 font-mono">
            {coin.km}{coin.nref ? ` · ${coin.nref}` : ''}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-gold-700/10">
        {coin.mint ? (
          <span className="text-[9px] text-ink/50 flex items-center gap-0.5">
            📊 <span className="font-medium text-ink/70">{formatMintage(coin.mint, locale)}</span>
          </span>
        ) : (
          <span />
        )}
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${coin.type === 'Commemorative' ? 'border-amber-300/50 text-amber-600' : 'border-gold-700/20 text-ink/30'}`}>
          {coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Comm.') : (isAr ? 'تداول' : 'Circ.')}
        </span>
      </div>
    </button>
  );
}
