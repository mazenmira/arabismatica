'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';

export interface ShellNavItem {
  labelAr: string;
  labelEn: string;
  href: string;
}

interface CatalogueShellProps {
  catalogueId: string;
  locale: string;
  heroSize: 'large' | 'compact';
  heroTitle: string;
  heroSubtitle?: string;
  heroCoinCount?: number;
  heroIcon?: string;
  navItems: ShellNavItem[];
  children: React.ReactNode;
}

export default function CatalogueShell({
  catalogueId,
  locale,
  heroSize,
  heroTitle,
  heroSubtitle,
  heroCoinCount,
  heroIcon,
  navItems,
  children,
}: CatalogueShellProps) {
  const icon = heroIcon ?? (catalogueId === 'arab' ? '🌍' : '☪️');
  const isAr = locale === 'ar';
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const altLocale = isAr ? 'en' : 'ar';
  const altPath   = pathname.replace(`/${locale}/`, `/${altLocale}/`);
  const dePath    = pathname.replace(`/${locale}/`, '/de/');

  return (
    <div className="min-h-screen" style={{ background: 'var(--parch, #FAF6EE)' }} dir={isAr ? 'rtl' : 'ltr'}>
      <SiteHeader
        locale={locale}
        user={undefined as unknown as { id: string; email: string }}
        onAuthOpen={() => {}}
        onDashOpen={() => {}}
        onAdminOpen={() => {}}
      />

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-ink text-xs border-b border-gold-700/30 sticky top-[64px] z-40">
        <div className="max-w-[1440px] mx-auto px-4 h-10 flex items-center gap-3">
          {/* Back to main site */}
          <Link href={`/${locale}`}
            className="flex items-center gap-1.5 text-gold-400 hover:text-gold-200 text-[12px] transition-colors shrink-0">
            {isAr ? '← أرابيزماتيكا' : '← Arabismatica'}
          </Link>

          <span className="text-gold-700 hidden sm:block">/</span>
          <span className="text-gold-300 text-[12px] hidden sm:block font-amiri">{heroTitle}</span>

          <div className="flex-1" />

          {/* Language toggle */}
          <div className="flex items-center gap-0.5 border border-gold-700/40 rounded px-1.5 py-0.5">
            <Globe size={11} className="text-gold-400 me-1" />
            <Link href={pathname.replace(`/${locale}/`, '/ar/')}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'ar' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>ع</Link>
            <span className="text-gold-700 text-[10px]">|</span>
            <Link href={altLocale === 'en' ? altPath : pathname.replace(`/${locale}/`, '/en/')}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'en' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>EN</Link>
            <span className="text-gold-700 text-[10px]">|</span>
            <Link href={dePath}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'de' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>DE</Link>
          </div>

          {/* Mobile nav toggle */}
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded text-gold-400 hover:bg-white/10 transition-colors">
            {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Desktop section nav */}
        <div className="hidden md:block border-t border-gold-800/30">
          <div className="max-w-[1440px] mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== `/${locale}/islamic` && pathname.startsWith(item.href));
                const isExact  = pathname === item.href;
                const active   = item.href === `/${locale}/islamic` ? isExact : isActive;
                return (
                  <Link key={item.href} href={item.href}
                    className={`shrink-0 px-4 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap
                      ${active
                        ? 'border-gold-400 text-gold-300'
                        : 'border-transparent text-gold-600 hover:text-gold-300 hover:border-gold-700'}`}>
                    {isAr ? item.labelAr : item.labelEn}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="md:hidden bg-ink border-t border-gold-800/50 animate-fade-in">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`block px-5 py-3 text-[13px] border-b border-gold-900/20
                    ${isActive ? 'text-gold-300 bg-white/5' : 'text-gold-500 hover:text-gold-300'}`}>
                  {isAr ? item.labelAr : item.labelEn}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0a0602 0%, #1a0e05 60%, #2a1a08 100%)' }}>
        <div className={`max-w-[1440px] mx-auto px-4 flex flex-col justify-center
          ${heroSize === 'large' ? 'min-h-[160px] md:min-h-[220px] py-8' : 'min-h-[64px] py-4'}`}>

          {heroSize === 'large' ? (
            <div className="flex items-start gap-4">
              <span className="text-4xl md:text-5xl">{icon}</span>
              <div>
                <h1 className="font-amiri text-2xl md:text-3xl text-amber-100 mb-1">{heroTitle}</h1>
                {heroSubtitle && (
                  <p className="text-[13px] text-amber-300/70 max-w-xl">{heroSubtitle}</p>
                )}
                {heroCoinCount && (
                  <div className="mt-2">
                    <span className="text-2xl md:text-3xl font-bold text-gold-400">
                      {heroCoinCount.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                    <span className="text-[12px] text-amber-300/60 ms-2">
                      {isAr ? 'عملة' : 'coins'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xl">{icon}</span>
              <h1 className="font-amiri text-lg text-amber-200">{heroTitle}</h1>
              {catalogueId === 'arab' && (
                <div className="flex items-center gap-3 ms-auto text-[11px] text-amber-300/60">
                  <span>5,505 {isAr ? 'عملة' : 'coins'}</span>
                  <span className="text-gold-700">·</span>
                  <span>20 {isAr ? 'دولة' : 'countries'}</span>
                  <span className="text-gold-700">·</span>
                  <span>1500–2026</span>
                </div>
              )}
              {catalogueId === 'islamic' && (
                <div className="flex items-center gap-3 ms-auto text-[11px] text-amber-300/60">
                  <span>47,303 {isAr ? 'عملة' : 'coins'}</span>
                  <span className="text-gold-700">·</span>
                  <span>18 {isAr ? 'سلالة' : 'dynasties'}</span>
                  <span className="text-gold-700">·</span>
                  <span>41–922 {isAr ? 'هـ' : 'AH'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6">
        {children}
      </div>
    </div>
  );
}
