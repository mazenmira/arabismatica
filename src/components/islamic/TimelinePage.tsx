'use client';

import { useState } from 'react';
import Link from 'next/link';

const AH_START = 41;
const AH_END   = 923;
const AH_SPAN  = AH_END - AH_START;

type Dynasty = {
  id: string;
  labelAr: string;
  labelEn: string;
  labelDe: string;
  start: number;
  end: number;
  color: string;
  coinCount?: number;
  ccFilter?: string;
};

const DYNASTIES: Dynasty[] = [
  { id: 'umayyad',    labelAr: 'الأمويون',      labelEn: 'Umayyad',       labelDe: 'Umayyaden',    start: 41,  end: 132,  color: '#b45309', coinCount: 8420 },
  { id: 'abbasid',    labelAr: 'العباسيون',      labelEn: 'Abbasid',       labelDe: 'Abbasiden',    start: 132, end: 656,  color: '#7c3aed', coinCount: 14302 },
  { id: 'fatimid',    labelAr: 'الفاطميون',      labelEn: 'Fatimid',       labelDe: 'Fatimiden',    start: 296, end: 567,  color: '#0d9488', coinCount: 4819 },
  { id: 'ayyubid',    labelAr: 'الأيوبيون',      labelEn: 'Ayyubid',       labelDe: 'Ayyubiden',    start: 567, end: 648,  color: '#d97706', coinCount: 2105 },
  { id: 'mamluk',     labelAr: 'المماليك',       labelEn: 'Mamluk',        labelDe: 'Mamluken',     start: 648, end: 923,  color: '#dc2626', coinCount: 6891 },
  { id: 'hamdanid',   labelAr: 'الحمدانيون',     labelEn: 'Hamdanid',      labelDe: 'Hamdaniden',   start: 293, end: 394,  color: '#6366f1', coinCount: 312 },
  { id: 'buyid',      labelAr: 'البويهيون',       labelEn: 'Buyid',         labelDe: 'Buyiden',      start: 320, end: 454,  color: '#059669', coinCount: 1203 },
  { id: 'samanid',    labelAr: 'السامانيون',      labelEn: 'Samanid',       labelDe: 'Samaniden',    start: 261, end: 395,  color: '#78716c', coinCount: 2180 },
  { id: 'ghaznavid',  labelAr: 'الغزنويون',      labelEn: 'Ghaznavid',     labelDe: 'Ghaznaviden',  start: 351, end: 582,  color: '#0891b2', coinCount: 987 },
  { id: 'seljuk',     labelAr: 'السلاجقة',       labelEn: 'Seljuk',        labelDe: 'Seldschuken',  start: 429, end: 700,  color: '#be185d', coinCount: 3241 },
  { id: 'zengid',     labelAr: 'الزنكيون',       labelEn: 'Zengid',        labelDe: 'Zengiden',     start: 521, end: 648,  color: '#92400e', coinCount: 729 },
  { id: 'artukid',    labelAr: 'الأرتقيون',      labelEn: 'Artuqid',       labelDe: 'Artuqiden',    start: 484, end: 811,  color: '#84cc16', coinCount: 622 },
];

// Row assignment to avoid heavy overlaps — each dynasty gets a lane (0–3)
const LANES: Record<string, number> = {
  umayyad: 0, abbasid: 0,
  fatimid: 1, ayyubid: 1, mamluk: 1,
  samanid: 2, buyid: 2, hamdanid: 2,
  ghaznavid: 3, seljuk: 3, zengid: 3, artukid: 3,
};
const LANE_COUNT = 4;
const BAR_HEIGHT = 28;
const BAR_GAP    = 6;
const TRACK_HEIGHT = LANE_COUNT * (BAR_HEIGHT + BAR_GAP);

function pct(ah: number) {
  return ((ah - AH_START) / AH_SPAN) * 100;
}

const CENTURY_MARKS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export default function TimelinePage({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';

  const [hovered, setHovered] = useState<string | null>(null);

  const label = (d: Dynasty) => isAr ? d.labelAr : isDe ? d.labelDe : d.labelEn;

  return (
    <div className="px-4 py-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="font-amiri text-2xl text-amber-800 mb-1">
          {isAr ? 'الجدول الزمني للسلالات الإسلامية' : isDe ? 'Zeitleiste islamischer Dynastien' : 'Islamic Dynasty Timeline'}
        </h2>
        <p className="text-[12px] text-gray-500">
          {isAr
            ? `${AH_START}–${AH_END} هـ · اضغط على شريط لتصفح عملاته`
            : isDe
            ? `${AH_START}–${AH_END} AH · Klicken Sie auf einen Balken, um Münzen zu durchsuchen`
            : `${AH_START}–${AH_END} AH · Click a bar to browse its coins`}
        </p>
      </div>

      {/* Timeline track */}
      <div className="relative w-full overflow-x-auto">
        <div className="relative" style={{ minWidth: '600px', height: `${TRACK_HEIGHT + 40}px` }}>

          {/* Century gridlines */}
          {CENTURY_MARKS.map(c => (
            <div key={c} style={{ position: 'absolute', left: `${pct(c)}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.07)' }}>
              <span style={{ position: 'absolute', top: `${TRACK_HEIGHT + 6}px`, transform: 'translateX(-50%)', fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                {c} AH
              </span>
            </div>
          ))}

          {/* Dynasty bars */}
          {DYNASTIES.map(d => {
            const lane  = LANES[d.id] ?? 0;
            const left  = pct(d.start);
            const width = pct(d.end) - left;
            const top   = lane * (BAR_HEIGHT + BAR_GAP);
            const isHov = hovered === d.id;

            return (
              <Link
                key={d.id}
                href={`/${locale}/islamic?dynasty=${d.id}`}
                title={`${label(d)} · ${d.start}–${d.end} AH${d.coinCount ? ` · ${d.coinCount.toLocaleString()} coins` : ''}`}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${width}%`,
                  top: `${top}px`,
                  height: `${BAR_HEIGHT}px`,
                  background: d.color,
                  opacity: isHov ? 1 : 0.75,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  paddingInline: '6px',
                  overflow: 'hidden',
                  transition: 'opacity 0.15s, transform 0.1s',
                  transform: isHov ? 'scaleY(1.08)' : 'scaleY(1)',
                  cursor: 'pointer',
                  zIndex: isHov ? 10 : 1,
                }}
                onMouseEnter={() => setHovered(d.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span style={{ fontSize: '10px', color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  {label(d)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {DYNASTIES.map(d => (
          <Link
            key={d.id}
            href={`/${locale}/islamic?dynasty=${d.id}`}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:border-amber-400 hover:shadow-sm transition-all"
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-gray-800 truncate">{label(d)}</div>
              <div className="text-[10px] text-gray-400">{d.start}–{d.end} AH{d.coinCount ? ` · ${d.coinCount.toLocaleString()}` : ''}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
