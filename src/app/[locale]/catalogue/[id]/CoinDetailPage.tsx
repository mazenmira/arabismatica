// src/app/[locale]/catalogue/[id]/CoinDetailPage.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ExternalLink, ZoomIn, Copy, Check } from 'lucide-react';
import type { Coin, MintageEntry } from '@/types/coin';
import {
  getDiscGradient, COUNTRY_FLAGS, formatMintage,
  isValidImageUrl, getCoinName, getCoinYear,
} from '@/lib/coins';

interface Props { coin: Coin; locale: string; }

const RARITY_STYLES: Record<string, string> = {
  Common:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  Uncommon: 'bg-sky-100     text-sky-800     border-sky-200',
  Scarce:   'bg-amber-100   text-amber-800   border-amber-200',
  Rare:     'bg-red-100     text-red-800     border-red-200',
};

const RARITY_AR: Record<string,string> = {
  Common:'شائع', Uncommon:'غير شائع', Scarce:'نادر نسبياً', Rare:'نادر',
};

const METAL_AR: Record<string,string> = {
  Gold:'ذهب', Silver:'فضة', Copper:'نحاس', Bronze:'برونز',
  'Cupro-Nickel':'نحاس-نيكل', Nickel:'نيكل', Bimetallic:'ثنائي',
  Aluminium:'ألمنيوم', Billon:'بيون', Brass:'نحاس أصفر', Steel:'فولاذ',
};

function CoinImage({ src, alt, size = 160 }: { src: string; alt: string; size?: number }) {
  const [err, setErr] = useState(false);
  const [zoom, setZoom] = useState(false);

  if (!isValidImageUrl(src) || err) {
    return (
      <div className="rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-400 font-bold text-2xl"
        style={{ width: size, height: size }}>
        🪙
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setZoom(true)} className="group relative rounded-full overflow-hidden cursor-zoom-in"
        style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} onError={() => setErr(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          style={{ border: '3px solid #F0E8D4', outline: '2px solid #8B6D2E',
            boxShadow: '0 4px 20px rgba(80,50,10,.18)' }} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <ZoomIn size={24} className="text-white drop-shadow" />
        </div>
      </button>

      {/* Lightbox */}
      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-w-[480px] max-h-[480px] rounded-full object-cover"
            style={{ border: '4px solid #F0E8D4', outline: '3px solid #8B6D2E' }} />
        </div>
      )}
    </>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
      {copied ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export default function CoinDetailPage({ coin, locale }: Props) {
  const isAr      = locale === 'ar';
  const coinName  = getCoinName(coin, locale);
  const coinYear  = getCoinYear(coin, locale);
  const metalLabel = isAr ? (METAL_AR[coin.metal] ?? coin.metal) : coin.metal;
  const flag      = COUNTRY_FLAGS[coin.cc] ?? '';

  const mintageData: MintageEntry[] = Array.isArray((coin as unknown as Record<string,unknown>).mintageData)
    ? (coin as unknown as { mintageData: MintageEntry[] }).mintageData
    : [];

  // JSON-LD structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: coinName,
    description: `${coinName} — ${coin.dyn} — ${coin.metal}`,
    image: coin.o || '',
    identifier: coin.km || coin.nref || coin.id,
    brand: { '@type': 'Brand', name: isAr ? 'المقتني العربي' : 'The Arab Collector' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Country',  value: isAr ? coin.co_ar : coin.co },
      { '@type': 'PropertyValue', name: 'Dynasty',  value: coin.dyn },
      { '@type': 'PropertyValue', name: 'Metal',    value: coin.metal },
      { '@type': 'PropertyValue', name: 'Year',     value: coin.yce || '' },
      { '@type': 'PropertyValue', name: 'KM',       value: coin.km || '' },
      { '@type': 'PropertyValue', name: 'Numista',  value: coin.nref || '' },
    ].filter(p => p.value),
  };

  const years = mintageData.map(d => d.YearGregorian).filter((y): y is number => y != null);
  const yearRange = years.length >= 2
    ? `${Math.min(...years)} – ${Math.max(...years)}`
    : years.length === 1 ? String(years[0]) : coin.yce || '';

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen" style={{ background: 'var(--parch, #FAF6EE)' }} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-[900px] mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[12px] text-amber-700/60 mb-6 flex-wrap">
            <Link href={`/${locale}`} className="hover:text-amber-700 transition-colors">
              {isAr ? 'أرابيزماتيكا' : 'Arabismatica'}
            </Link>
            <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
            <Link href={`/${locale}`} className="hover:text-amber-700 transition-colors">
              {isAr ? coin.co_ar : coin.co}
            </Link>
            <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
            <span className="text-amber-900 font-medium truncate max-w-[240px]">{coinName}</span>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">

            {/* ── Header band ── */}
            <div className="bg-gradient-to-r from-[#1a0e05] to-[#2a1a08] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-amiri text-2xl text-amber-100 leading-tight">{coinName}</h1>
                <p className="text-[12px] text-amber-400/70 mt-0.5 italic">{coin.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{flag}</span>
                <div className="text-right">
                  <div className="text-[12px] text-amber-300">{isAr ? coin.co_ar : coin.co}</div>
                  <div className="text-[11px] text-amber-500/60">{coin.dyn}</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* ── Images ── */}
              <div className="flex items-center justify-center gap-10 mb-8">
                <div className="flex flex-col items-center gap-2">
                  <CoinImage src={coin.o} alt={`${coinName} — ${isAr ? 'الوجه' : 'Obverse'}`} size={160} />
                  <span className="text-[11px] text-amber-700/60 border border-amber-200 rounded-full px-3 py-0.5">
                    {isAr ? 'الوجه' : 'Obverse'}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <CoinImage src={coin.r} alt={`${coinName} — ${isAr ? 'الظهر' : 'Reverse'}`} size={160} />
                  <span className="text-[11px] text-amber-700/60 border border-amber-200 rounded-full px-3 py-0.5">
                    {isAr ? 'الظهر' : 'Reverse'}
                  </span>
                </div>
              </div>

              {/* ── Key facts ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: isAr ? 'المعدن' : 'Metal',       value: metalLabel },
                  { label: isAr ? 'التاريخ' : 'Date',        value: yearRange || coinYear },
                  { label: isAr ? 'النوع' : 'Type',          value: coin.type === 'Commemorative' ? (isAr ? 'تذكارية' : 'Commemorative') : (isAr ? 'تداول' : 'Circulation') },
                  { label: isAr ? 'الدولة' : 'Country',      value: `${flag} ${isAr ? coin.co_ar : coin.co}` },
                  coin.wt  ? { label: isAr ? 'الوزن' : 'Weight',   value: `${coin.wt} g` }  : null,
                  coin.dia ? { label: isAr ? 'القطر' : 'Diameter', value: `${coin.dia} mm` } : null,
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
                    <div className="text-[9px] text-amber-600/60 uppercase tracking-wider mb-1">{item!.label}</div>
                    <div className="text-[13px] font-medium text-amber-900">{item!.value}</div>
                  </div>
                ))}
              </div>

              {/* ── References ── */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-[11px] text-amber-700/50">{isAr ? 'المراجع:' : 'References:'}</span>
                {coin.km   && <CopyButton text={coin.km}   label={coin.km} />}
                {coin.nref && <CopyButton text={coin.nref} label={coin.nref} />}
                {coin.nid  && (
                  <a href={`https://en.numista.com/catalogue/pieces${coin.nid}.html`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
                    <ExternalLink size={10} /> Numista
                  </a>
                )}
              </div>

              {/* ── Mintage table ── */}
              {mintageData.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-[13px] font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    {isAr ? 'إصدارات النوع' : 'Type Issues'}
                    <span className="text-[10px] font-normal text-amber-600/50">({mintageData.length})</span>
                  </h2>

                  {mintageData.some(d => d.Mintmark && d.Mintmark !== 'None') && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-[12px] text-amber-800">
                      ⚠️ {isAr ? 'يحتوي على إصدارات بعلامات ضرب مختلفة — تحقق قبل التقييم' : 'Contains mintmark varieties — verify before pricing'}
                    </div>
                  )}

                  <div className="rounded-xl overflow-hidden border border-amber-100">
                    <table className="w-full text-[12px]" dir={isAr ? 'rtl' : 'ltr'}>
                      <thead>
                        <tr className="bg-amber-50 border-b border-amber-100">
                          <th className="px-3 py-2 text-[10px] text-amber-600/70 font-medium text-start uppercase tracking-wide">{isAr ? 'التاريخ' : 'Date'}</th>
                          <th className="px-3 py-2 text-[10px] text-amber-600/70 font-medium text-center uppercase tracking-wide">{isAr ? 'علامة' : 'Mint'}</th>
                          <th className="px-3 py-2 text-[10px] text-amber-600/70 font-medium text-end uppercase tracking-wide">{isAr ? 'المضروب' : 'Mintage'}</th>
                          <th className="px-3 py-2 text-[10px] text-amber-600/70 font-medium text-center uppercase tracking-wide">{isAr ? 'الندرة' : 'Rarity'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mintageData.map((entry, i) => (
                          <tr key={i} className="border-b border-amber-50 last:border-0 hover:bg-amber-50/50 transition-colors">
                            <td className="px-3 py-2.5">
                              {entry.YearHijri && <div className="font-amiri text-amber-900 text-[13px]">{entry.YearHijri} هـ</div>}
                              {entry.YearGregorian && <div className="text-[11px] text-amber-700/60">{entry.YearGregorian} م</div>}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {entry.Mintmark && entry.Mintmark !== 'None'
                                ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold">{entry.Mintmark}</span>
                                : <span className="text-amber-300">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-end font-mono text-amber-800">
                              {entry.MintageCount != null
                                ? formatMintage(String(entry.MintageCount), locale)
                                : <span className="text-amber-300 text-[11px]">{isAr ? 'غير معروف' : 'Unknown'}</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {entry.Rarity && (
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${RARITY_STYLES[entry.Rarity] ?? ''}`}>
                                  {isAr ? (RARITY_AR[entry.Rarity] ?? entry.Rarity) : entry.Rarity}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Legacy single mintage */}
              {mintageData.length === 0 && coin.mint && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="text-[9px] text-amber-600/60 uppercase tracking-wider">{isAr ? 'المضروب' : 'Mintage'}</div>
                    <div className="text-lg font-bold text-amber-900 font-amiri">{formatMintage(coin.mint, locale)}</div>
                  </div>
                </div>
              )}

              {/* ── View in catalogue CTA ── */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-amber-100">
                <Link href={`/${locale}`}
                  className="inline-flex items-center gap-2 text-[13px] px-5 py-2.5 rounded-full bg-[#1a0e05] text-amber-300 hover:bg-[#2a1a08] transition-colors font-medium">
                  <ArrowRight size={14} className={isAr ? '' : 'rotate-180'} />
                  {isAr ? 'العودة إلى الكتالوج' : 'Back to Catalogue'}
                </Link>
                <p className="text-[11px] text-amber-600/50">
                  {isAr ? 'أرابيزماتيكا — المقتني العربي' : 'Arabismatica — The Arab Collector'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
