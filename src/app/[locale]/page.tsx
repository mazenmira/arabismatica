// v4.2 — landing page
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/header/SiteHeader';
import { supabase } from '@/lib/supabase';

const HERO_IMG = 'https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-Hero.jpg';

const CATALOGUE_CARDS = [
  {
    id: 'arab',
    titleAr: 'العملات العربية الحديثة',
    titleEn: 'Modern Arab Coins',
    titleDe: 'Moderne arabische Münzen',
    subtitleAr: '5,505 عملة · 20 دولة · 1500–2026م',
    subtitleEn: '5,505 coins · 20 countries · 1500–2026 CE',
    subtitleDe: '5.505 Münzen · 20 Länder · 1500–2026 n. Chr.',
    href: '/catalogue',
    status: 'active' as const,
    icon: '🌍',
    bg: 'from-amber-900/90 to-amber-800/90',
  },
  {
    id: 'islamic',
    titleAr: 'العملات الإسلامية',
    titleEn: 'Islamic Coins',
    titleDe: 'Islamische Münzen',
    subtitleAr: '47,303 عملة · 18 سلالة · 41–922هـ',
    subtitleEn: '47,303 coins · 18 dynasties · 41–922 AH',
    subtitleDe: '47.303 Münzen · 18 Dynastien · 41–922 AH',
    href: '/islamic',
    status: 'active' as const,
    icon: '☪️',
    bg: 'from-stone-900/90 to-stone-800/90',
  },
  {
    id: 'roman',
    titleAr: 'العملات الرومانية',
    titleEn: 'Roman-Era Coins',
    titleDe: 'Römische Münzen',
    subtitleAr: 'قريباً',
    subtitleEn: 'Coming soon',
    subtitleDe: 'Demnächst',
    href: '',
    status: 'coming_soon' as const,
    icon: '🏛️',
    bg: 'from-zinc-800/90 to-zinc-700/90',
  },
  {
    id: 'ptolemaic',
    titleAr: 'العملات البطلمية',
    titleEn: 'Ptolemaic Coins',
    titleDe: 'Ptolemäische Münzen',
    subtitleAr: 'قريباً',
    subtitleEn: 'Coming soon',
    subtitleDe: 'Demnächst',
    href: '',
    status: 'coming_soon' as const,
    icon: '𓂀',
    bg: 'from-zinc-800/90 to-zinc-700/90',
  },
];

const STATS = [
  { numAr: '٥٢٬٨٠٨',      numEn: '52,808',       numDe: '52.808',       labelAr: 'عملة مفهرسة',     labelEn: 'coins indexed',          labelDe: 'Münzen indexiert' },
  { numAr: '٢٠+',          numEn: '20+',          numDe: '20+',          labelAr: 'دولة وإمارة',    labelEn: 'countries & states',     labelDe: 'Länder & Staaten' },
  { numAr: '١٨',           numEn: '18',           numDe: '18',           labelAr: 'سلالة وخلافة',   labelEn: 'dynasties & caliphates', labelDe: 'Dynastien & Kalifate' },
  { numAr: '٦٦١م–اليوم',  numEn: '661 CE–today', numDe: '661 n.Chr.–h.', labelAr: 'النطاق الزمني', labelEn: 'time span',               labelDe: 'Zeitraum' },
];

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  const [coinOfDay, setCoinOfDay] = useState<{
    id: string; name: string; nar?: string; yce?: string;
    o?: string; cc?: string; co?: string; co_ar?: string;
  } | null>(null);

  useEffect(() => {
    const today = new Date();
    const seed   = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const offset = seed % 52808;
    supabase.from('coins').select('id,name,nar,yce,o,cc,co,co_ar').range(offset, offset)
      .then(({ data }) => { if (data && data.length > 0) setCoinOfDay(data[0] as typeof coinOfDay); });
    // ignore errors — Coin of the Day is non-critical
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = (ar: string, en: string, de: string) => isAr ? ar : isDe ? de : en;

  return (
    <main className="min-h-screen" style={{ background: 'var(--parch)' }} dir={isAr ? 'rtl' : 'ltr'}>
      <SiteHeader locale={locale} />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: '420px' }}>
        <Image
          src={HERO_IMG}
          alt="Arabismatica hero"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,6,2,0.55) 0%, rgba(10,6,2,0.75) 60%, rgba(10,6,2,0.95) 100%)' }} />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20">
          <p className="text-gold-400 text-[11px] tracking-[0.2em] uppercase mb-3 font-medium">
            {t('كتالوج العملات العربية والإسلامية', 'Arab & Islamic Coin Catalogue', 'Arabischer & Islamischer Münzkatalog')}
          </p>
          <h1 className="font-amiri text-4xl md:text-5xl text-white leading-tight mb-2">
            Arabismatica <span className="text-amber-300/50">|</span> أرابيزماتيكا
          </h1>
          <p className="text-amber-300/80 text-[14px] md:text-[16px] max-w-lg mb-8">
            {t(
              'الموسوعة الرقمية الأشمل للعملات في العالم العربي والشرق الأوسطي',
              'The most comprehensive digital encyclopaedia of coins in the Arab and Middle Eastern world',
              'Die umfassendste digitale Enzyklopädie der Münzen der arabischen und nahöstlichen Welt'
            )}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={`/${locale}/catalogue`}
              className="px-6 py-2.5 rounded-full text-[13px] font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #B8860B, #8B6D2E)', color: '#FAF6EE' }}>
              {t('تصفح الكتالوج العربي', 'Browse Arab Catalogue', 'Arabischen Katalog durchsuchen')}
            </Link>
            <Link href={`/${locale}/islamic`}
              className="px-6 py-2.5 rounded-full text-[13px] font-medium border border-gold-500/60 text-gold-300 hover:bg-white/5 transition-all">
              {t('العملات الإسلامية', 'Islamic Coins', 'Islamische Münzen')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0a0602, #1a0e05)' }}>
        <div className="max-w-[1440px] mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="text-2xl md:text-3xl font-bold text-gold-400 font-amiri">
                  {isAr ? s.numAr : s.numEn}
                </div>
                <div className="text-[11px] text-amber-300/60 mt-0.5">
                  {isAr ? s.labelAr : isDe ? s.labelDe : s.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── COIN OF THE DAY ─────────────────────────────────────────────── */}
      {coinOfDay && (
        <div style={{ background: 'linear-gradient(135deg, #0a0602, #1a0e05)' }} className="border-t border-gold-700/20">
          <div className="max-w-[1440px] mx-auto px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-gold-500/70 uppercase tracking-widest font-medium shrink-0">
                📅 {isAr ? 'عملة اليوم' : isDe ? 'Münze des Tages' : 'Coin of the Day'}
              </span>
              {coinOfDay.o && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coinOfDay.o} alt="" className="w-8 h-8 rounded-full object-cover border border-gold-700/40 shrink-0" />
              )}
              <span className="font-amiri text-gold-300 text-[14px]">
                {isAr ? (coinOfDay.nar || coinOfDay.name) : coinOfDay.name}
              </span>
              {coinOfDay.yce && (
                <span className="text-[11px] text-gold-600/50 hidden sm:block">
                  {coinOfDay.yce} · {isAr ? coinOfDay.co_ar : coinOfDay.co}
                </span>
              )}
              <Link href={`/${locale}/catalogue/${coinOfDay.id}`}
                className="ms-auto text-[11px] text-gold-600 hover:text-gold-400 border border-gold-700/30 rounded-full px-3 py-1 transition-colors shrink-0">
                {isAr ? 'عرض ←' : isDe ? 'Ansehen →' : 'View →'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── CATALOGUE CARDS ─────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 py-10">
        <h2 className="font-amiri text-xl md:text-2xl text-amber-900 mb-1">
          {t('اختر الكتالوج', 'Choose a Catalogue', 'Katalog wählen')}
        </h2>
        <p className="text-[12px] text-amber-700/70 mb-5">
          {t('أربعة كتالوجات متخصصة — عربي حديث، إسلامي، روماني، بطلمي', 'Four specialised catalogues — modern Arab, Islamic, Roman, Ptolemaic', 'Vier spezialisierte Kataloge — modernes Arabisch, Islamisch, Römisch, Ptolemäisch')}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATALOGUE_CARDS.map(card => {
            const isActive = card.status === 'active';
            const href = isActive ? `/${locale}${card.href}` : undefined;
            const title    = isAr ? card.titleAr    : isDe ? card.titleDe    : card.titleEn;
            const subtitle = isAr ? card.subtitleAr : isDe ? card.subtitleDe : card.subtitleEn;
            const inner = (
              <div className={`relative overflow-hidden rounded-xl border h-full transition-all
                bg-gradient-to-br ${card.bg}
                ${isActive
                  ? 'border-gold-700/50 hover:border-gold-400 hover:shadow-[0_0_24px_rgba(180,140,50,0.25)] hover:-translate-y-0.5 cursor-pointer'
                  : 'border-white/10 opacity-50 cursor-not-allowed'}`}>
                {!isActive && (
                  <div className="absolute top-2 end-2 text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-white/60">
                    {isAr ? 'قريباً' : isDe ? 'Demnächst' : 'Soon'}
                  </div>
                )}
                <div className="p-5">
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <div className="font-amiri text-[15px] text-amber-100 leading-snug mb-1.5">{title}</div>
                  <div className="text-[10px] text-amber-400/70 mb-3">{subtitle}</div>
                  {isActive && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-gold-400 font-medium border border-gold-700/40 rounded-full px-2.5 py-0.5">
                      {isAr ? '← تصفح' : isDe ? 'Ansehen →' : 'Browse →'}
                    </div>
                  )}
                </div>
              </div>
            );
            return href
              ? <Link key={card.id} href={href} className="block h-full">{inner}</Link>
              : <div key={card.id}>{inner}</div>;
          })}
        </div>
      </div>

      {/* ── ABOUT STRIP ─────────────────────────────────────────────────── */}
      <div className="border-t border-amber-200/40 bg-amber-50/50">
        <div className="max-w-[1440px] mx-auto px-4 py-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
            <h2 className="font-amiri text-xl text-amber-900 mb-3">
              {t('عن أرابيزماتيكا', 'About Arabismatica', 'Über Arabismatica')}
            </h2>
            <p className="text-[13px] text-amber-800/80 leading-relaxed max-w-xl">
              {t(
                'أرابيزماتيكا هي الموسوعة العربية الرقمية الشاملة للعملات المعدنية، تضم أكثر من 52,808 عملة عربية وإسلامية مفهرسة بالتفصيل مع صور وبيانات شاملة.',
                'Arabismatica is the comprehensive Arabic digital encyclopaedia of coins, featuring over 52,808 Arab and Islamic coins indexed with detailed images and data.',
                'Arabismatica ist die umfassende arabische digitale Münzenzyklopädie mit über 52.808 arabischen und islamischen Münzen, detailliert indexiert mit Bildern und Daten.'
              )}
            </p>
            <a href="https://arabcollector.com" target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 mt-4 text-[12px] text-amber-700 hover:text-amber-900 transition-colors">
              arabcollector.com →
            </a>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-2 text-[12px] text-amber-700">
            <Link href={`/${locale}/catalogue`} className="hover:text-amber-900 transition-colors">
              {t('← كتالوج العملات العربية', '→ Arab Coin Catalogue', '→ Arabischer Münzkatalog')}
            </Link>
            <Link href={`/${locale}/islamic`} className="hover:text-amber-900 transition-colors">
              {t('← كتالوج العملات الإسلامية', '→ Islamic Coin Catalogue', '→ Islamischer Münzkatalog')}
            </Link>
            <Link href={`/${locale}/islamic/dynasties`} className="hover:text-amber-900 transition-colors">
              {t('← السلالات الإسلامية', '→ Islamic Dynasties', '→ Islamische Dynastien')}
            </Link>
          </div>
        </div>
      </div>

    </main>
  );
}
