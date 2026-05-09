'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const MIN_YEAR = 1500;
const MAX_YEAR = 2026;

const ERA_MARKERS = [
  { year: 1500, label: 'عثماني مبكر', labelEn: 'Early Ottoman' },
  { year: 1600, label: '١٦٠٠',        labelEn: '1600' },
  { year: 1700, label: '١٧٠٠',        labelEn: '1700' },
  { year: 1800, label: '١٨٠٠',        labelEn: '1800' },
  { year: 1900, label: '١٩٠٠',        labelEn: '1900' },
  { year: 1950, label: 'استقلال',     labelEn: 'Independence' },
  { year: 2000, label: '٢٠٠٠',        labelEn: '2000' },
  { year: 2026, label: 'اليوم',       labelEn: 'Today' },
];

interface TimelineSliderProps {
  locale: string;
  onRangeChange?: (from: number, to: number) => void;
}

export default function TimelineSlider({ locale, onRangeChange }: TimelineSliderProps) {
  const t = useTranslations('timeline');
  const isAr = locale === 'ar';

  const [fromYear, setFromYear] = useState(MIN_YEAR);
  const [toYear,   setToYear]   = useState(MAX_YEAR);
  const [active,   setActive]   = useState<'from' | 'to' | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);

  const toPercent = (year: number) =>
    ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  const yearFromPercent = (pct: number) =>
    Math.round(MIN_YEAR + (pct / 100) * (MAX_YEAR - MIN_YEAR));

  // Convert pointer X to year, clamped to track bounds
  const pointerToYear = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return MIN_YEAR;
    const rect = track.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    return yearFromPercent(pct);
  }, []);

  const handleFromChange = useCallback((v: number) => {
    const clamped = Math.max(MIN_YEAR, Math.min(v, toYear - 10));
    setFromYear(clamped);
    onRangeChange?.(clamped, toYear);
  }, [toYear, onRangeChange]);

  const handleToChange = useCallback((v: number) => {
    const clamped = Math.max(fromYear + 10, Math.min(v, MAX_YEAR));
    setToYear(clamped);
    onRangeChange?.(fromYear, clamped);
  }, [fromYear, onRangeChange]);

  const reset = () => {
    setFromYear(MIN_YEAR);
    setToYear(MAX_YEAR);
    onRangeChange?.(MIN_YEAR, MAX_YEAR);
  };

  const isFiltered = fromYear > MIN_YEAR || toYear < MAX_YEAR;

  // ── Pointer events on track (click anywhere to move nearest handle) ─────
  const handleTrackPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const year = pointerToYear(e.clientX);
    // Move whichever handle is closer
    const distFrom = Math.abs(year - fromYear);
    const distTo   = Math.abs(year - toYear);
    if (distFrom <= distTo) {
      setActive('from');
      handleFromChange(year);
    } else {
      setActive('to');
      handleToChange(year);
    }
  }, [fromYear, toYear, pointerToYear, handleFromChange, handleToChange]);

  const handleTrackPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    const year = pointerToYear(e.clientX);
    if (active === 'from') handleFromChange(year);
    else handleToChange(year);
  }, [active, pointerToYear, handleFromChange, handleToChange]);

  const handleTrackPointerUp = useCallback(() => {
    setActive(null);
  }, []);

  return (
    <div className="bg-ink/95 border-b border-gold-700/40 px-4 py-3 sticky top-[64px] z-40">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4">

          {/* Label */}
          <div className="hidden sm:flex flex-col shrink-0">
            <span className="text-[10px] text-gold-500/70 font-medium">{t('label')}</span>
            <span className="text-[11px] text-gold-300 font-semibold font-amiri">
              {fromYear} — {toYear}
            </span>
          </div>

          {/* Slider track */}
          <div
            ref={trackRef}
            className="flex-1 relative h-10 flex items-center cursor-pointer select-none"
            onPointerDown={handleTrackPointer}
            onPointerMove={handleTrackPointerMove}
            onPointerUp={handleTrackPointerUp}
            onPointerLeave={handleTrackPointerUp}
          >
            {/* Track background */}
            <div className="absolute inset-x-0 h-1 bg-gold-800/40 rounded-full top-1/2 -translate-y-1/2" />

            {/* Active range fill */}
            <div
              className="absolute h-1 bg-gold-500 rounded-full top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left:  `${toPercent(fromYear)}%`,
                width: `${toPercent(toYear) - toPercent(fromYear)}%`,
              }}
            />

            {/* Era markers */}
            {ERA_MARKERS.map(marker => (
              <div
                key={marker.year}
                className="absolute flex flex-col items-center pointer-events-none"
                style={{ left: `${toPercent(marker.year)}%`, transform: 'translateX(-50%)' }}
              >
                <div className={`w-px h-2 mb-0.5 ${marker.year >= fromYear && marker.year <= toYear ? 'bg-gold-400' : 'bg-gold-800/50'}`} />
                <span className={`text-[9px] font-medium whitespace-nowrap hidden md:block
                  ${marker.year >= fromYear && marker.year <= toYear ? 'text-gold-400' : 'text-gold-700/50'}`}>
                  {isAr ? marker.label : marker.labelEn}
                </span>
              </div>
            ))}

            {/* FROM thumb */}
            <motion.div
              className={`absolute w-5 h-5 rounded-full bg-gold-500 border-2 border-parch shadow-lg cursor-grab z-20
                -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none`}
              style={{ left: `${toPercent(fromYear)}%` }}
              animate={{ scale: active === 'from' ? 1.35 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gold-600 text-parch text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                {fromYear}
              </div>
            </motion.div>

            {/* TO thumb */}
            <motion.div
              className={`absolute w-5 h-5 rounded-full bg-gold-500 border-2 border-parch shadow-lg cursor-grab z-20
                -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none`}
              style={{ left: `${toPercent(toYear)}%` }}
              animate={{ scale: active === 'to' ? 1.35 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gold-600 text-parch text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                {toYear}
              </div>
            </motion.div>
          </div>

          {/* Reset + year span */}
          <div className="flex items-center gap-2 shrink-0">
            {isFiltered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={reset}
                className="text-[11px] text-gold-500 hover:text-gold-300 border border-gold-700/50 rounded-full px-2.5 py-1 transition-colors"
              >
                {isAr ? 'إعادة' : 'Reset'}
              </motion.button>
            )}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px]
              ${isFiltered
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                : 'bg-transparent text-gold-600/50 border border-transparent'}`}>
              <span>{toYear - fromYear}</span>
              <span>{isAr ? 'سنة' : 'yr'}</span>
            </div>
          </div>
        </div>

        {!isFiltered && (
          <p className="text-[10px] text-gold-600/50 mt-1 text-center hidden sm:block">
            {t('drag')}
          </p>
        )}
      </div>
    </div>
  );
}
