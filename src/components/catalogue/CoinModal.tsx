'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, ZoomIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Coin } from '@/types/coin';
import { getDiscGradient, getMetalSymbol, COUNTRY_FLAGS, formatMintage, isValidImageUrl, getCoinName, getCoinYear } from '@/lib/coins';

interface LightboxProps {
  coin: Coin;
  side: 'obverse' | 'reverse';
  locale: string;
  onClose: () => void;
  onSwitchSide: (s: 'obverse' | 'reverse') => void;
}

function Lightbox({ coin, side, locale, onClose, onSwitchSide }: LightboxProps) {
  const isAr = locale === 'ar'; // eslint-disable-line @typescript-eslint/no-unused-vars
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
      onClick={onClose}>
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="self-start w-9 h-9 rounded-full border border-gold-700/50 text-gold-400 hover:text-gold-200 flex items-center justify-center transition-colors">
          <X size={16} />
        </button>

        {isValidImageUrl(src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={side} loading="lazy"
            className="max-w-[320px] max-h-[320px] rounded-full object-cover"
            style={{
              border: '4px solid #F0E8D4',
              outline: '3px solid #8B6D2E',
              boxShadow: '0 0 60px rgba(201,168,76,.25), 0 8px 40px rgba(0,0,0,.8)',
            }} />
        ) : (
          <div className="w-64 h-64 rounded-full flex items-center justify-center text-5xl font-amiri font-bold text-ink"
            style={{ background: getDiscGradient(coin.metal) }}>
            {getMetalSymbol(coin.metal)}
          </div>
        )}

        <div className="text-center">
          <div className="font-amiri text-gold-300 text-xl mb-1">
            {getCoinName(coin, locale)}
          </div>
          <div className="text-gold-600/60 text-sm">
            {side === 'obverse' ? t('obverse') : t('reverse')} · {getCoinYear(coin, locale)}
          </div>
        </div>

        {/* Side switcher */}
        <div className="flex rounded-full overflow-hidden border border-gold-700/40">
          {(['obverse', 'reverse'] as const).map(s => (
            <button key={s}
              onClick={() => onSwitchSide(s)}
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

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-parch-dark/60 border border-gold-700/20 rounded-xl px-3 py-2.5">
      <div className="text-[9px] text-ink/40 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] font-medium text-ink">{value}</div>
    </div>
  );
}

export default function CoinModal({ coin, locale, onClose }: { coin: Coin; locale: string; onClose: () => void }) {
  const t = useTranslations('coin');
  const isAr = locale === 'ar'; // eslint-disable-line @typescript-eslint/no-unused-vars
  const [lightbox, setLightbox] = useState<'obverse' | 'reverse' | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lightbox) onClose(); };
    window.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
  }, [lightbox, onClose]);

  const coinName = getCoinName(coin, locale);
  const coinYear = getCoinYear(coin, locale);

  const metalLabel = isAr
    ? ({ Gold:'ذهب', Silver:'فضة', Copper:'نحاس', Bronze:'برونز', 'Cupro-Nickel':'نحاس-نيكل',
         Nickel:'نيكل', Bimetallic:'ثنائي', Aluminium:'ألمنيوم', Billon:'بيون',
         Brass:'نحاس أصفر', Steel:'فولاذ' }[coin.metal] ?? coin.metal)
    : coin.metal;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[150]"
        style={{ background: 'rgba(22,16,10,.82)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-0 z-[151] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="bg-parch-cream rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[92vh] overflow-y-auto"
          style={{ border: '1px solid rgba(139,109,46,.4)' }}
          initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="sticky top-0 bg-parch-cream flex items-center justify-between px-5 py-3.5 border-b border-gold-700/20 z-10">
            <span className="text-[10px] text-ink/30 font-mono">{coin.id} · {coin.km} · {coin.nref}</span>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full border border-gold-700/30 text-gold-600 hover:text-gold-400 hover:border-gold-500 flex items-center justify-center transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="px-5 py-5">
            {/* ── COIN IMAGES — centred, stacked ── */}
            <div className="flex items-start justify-center gap-8 mb-6">
              {/* Obverse */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setLightbox('obverse')}
                  className="group relative"
                  title={t('obverse')}>
                  {isValidImageUrl(coin.o) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coin.o} alt={`${coinName} — ${t('obverse')}`}
                      className="w-[130px] h-[130px] rounded-full object-cover transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl"
                      style={{
                        border: '3px solid #F0E8D4',
                        outline: '2px solid #8B6D2E',
                        boxShadow: '0 4px 20px rgba(80,50,10,.18)',
                      }} />
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
                {/* Obverse label - clean button style below image */}
                <button
                  onClick={() => setLightbox('obverse')}
                  className="text-[11px] text-gold-600 border border-gold-700/30 rounded-full px-3 py-1 hover:border-gold-500 hover:text-gold-500 transition-colors">
                  {t('obverse')}
                </button>
              </div>

              {/* Reverse */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setLightbox('reverse')}
                  className="group relative"
                  title={t('reverse')}>
                  {isValidImageUrl(coin.r) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coin.r} alt={`${coinName} — ${t('reverse')}`}
                      className="w-[130px] h-[130px] rounded-full object-cover transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl"
                      style={{
                        border: '3px solid #F0E8D4',
                        outline: '2px solid #8B6D2E',
                        boxShadow: '0 4px 20px rgba(80,50,10,.18)',
                      }} />
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
                {/* Reverse label - matching button style */}
                <button
                  onClick={() => setLightbox('reverse')}
                  className="text-[11px] text-gold-600 border border-gold-700/30 rounded-full px-3 py-1 hover:border-gold-500 hover:text-gold-500 transition-colors">
                  {t('reverse')}
                </button>
              </div>
            </div>

            {/* ── COIN TITLE ── */}
            <div className={`mb-5 ${isAr ? 'text-right' : 'text-left'}`}>
              <h2 className="font-amiri text-2xl text-ink leading-tight mb-1">{coinName}</h2>
              <p className="text-[12px] text-ink/40 italic mb-2">{coin.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px]">{COUNTRY_FLAGS[coin.cc] ?? ''}</span>
                <span className="text-[12px] text-ink/60">{isAr ? coin.co_ar : coin.co} · {coin.co}</span>
              </div>
              <div className="text-[12px] text-gold-600 font-medium mt-1">{coin.dyn} · {coinYear}</div>
            </div>

            {/* ── MINTAGE HIGHLIGHT ── */}
            {coin.mint && (
              <div className="flex items-center gap-3 bg-gold-500/10 border border-gold-500/30 rounded-xl px-4 py-3 mb-4">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="text-[9px] text-ink/40 uppercase tracking-wider">{t('mintage')}</div>
                  <div className="text-[18px] font-bold text-ink font-amiri">
                    {formatMintage(coin.mint, locale)} {t('pieces')}
                  </div>
                </div>
              </div>
            )}

            {/* ── SPECS GRID ── */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <SpecCard label={t('metal')} value={metalLabel} />
              <SpecCard label={t('type')} value={coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Commemorative') : (isAr ? 'تداول' : 'Circulation')} />
              {coin.wt != null && <SpecCard label={`${t('weight')} (غ)`} value={`${coin.wt} g`} />}
              {coin.dia != null && <SpecCard label={`${t('diameter')} (مم)`} value={`${coin.dia} mm`} />}
              {coin.km && <SpecCard label="KM#" value={coin.km} />}
              {coin.nref && <SpecCard label="N# Numista" value={coin.nref} />}
            </div>

            {/* ── TAGS ── */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[coin.co_ar, coin.dyn, metalLabel,
                coin.yce ? `${coin.yce} م` : null,
                coin.yah ? `${coin.yah} هـ` : null,
                coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Commemorative') : (isAr ? 'تداول' : 'Circulation'),
                coin.mint ? `📊 ${formatMintage(coin.mint, locale)}` : null,
              ].filter(Boolean).map((tag, i) => (
                <span key={i}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-parch-dark border border-gold-700/20 text-ink/60">
                  {tag}
                </span>
              ))}
            </div>

            {/* ── NUMISTA LINK ── */}
            {coin.nid && (
              <a
                href={`https://en.numista.com/catalogue/pieces${coin.nid}.html`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[12px] text-gold-600 border border-gold-700/30 rounded-full px-4 py-2 hover:border-gold-500 hover:text-gold-500 transition-colors">
                <ExternalLink size={12} />
                {t('viewOnNumista')}
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          coin={coin} side={lightbox} locale={locale}
          onClose={() => setLightbox(null)}
          onSwitchSide={setLightbox}
        />
      )}
    </>
  );
}
