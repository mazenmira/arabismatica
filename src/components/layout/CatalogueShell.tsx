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
  heroSize?: 'large' | 'compact';
  heroTitle: string;
  heroSubtitle?: string;
  heroCoinCount?: number;
  navItems: ShellNavItem[];
  children: React.ReactNode;
}

export default function CatalogueShell({
  catalogueId,
  locale,
  heroTitle,
  heroSubtitle,
  heroCoinCount,
  navItems,
  children,
}: CatalogueShellProps) {
  const isAr = locale === 'ar';
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" dir={isAr ? 'rtl' : 'ltr'}>
      <SiteHeader locale={locale} />

      {/* ── BREADCRUMB BAR ──────────────────────────────────────────────── */}
      <div className="bg-ink border-b border-gold-700/30 sticky top-[48px] z-40">
        <div className="max-w-[1440px] mx-auto px-4 h-9 flex items-center gap-2">
          <Link href={`/${locale}`}
            className="text-gold-500 hover:text-gold-300 text-[11px] transition-colors shrink-0">
            {isAr ? 'أرابيزماتيكا' : 'Arabismatica'}
          </Link>
          <span className="text-gold-700 text-[11px]">/</span>
          <span className="text-gold-300 text-[11px] font-amiri">{heroTitle}</span>

          <div className="flex-1" />

          {/* Language toggle */}
          <div className="flex items-center gap-0.5 border border-gold-700/40 rounded px-1.5 py-0.5">
            <Globe size={11} className="text-gold-400 me-1" />
            <Link href={pathname.replace(`/${locale}/`, '/ar/')}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'ar' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>ع</Link>
            <span className="text-gold-700 text-[10px]">|</span>
            <Link href={pathname.replace(`/${locale}/`, '/en/')}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'en' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>EN</Link>
            <span className="text-gold-700 text-[10px]">|</span>
            <Link href={pathname.replace(`/${locale}/`, '/de/')}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'de' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>DE</Link>
          </div>

          <button onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded text-gold-400 hover:bg-white/10 transition-colors">
            {mobileNavOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </div>

      {/* ── ACADEMIC HEADER ─────────────────────────────────────────────── */}
      <div className="border-b border-gold-700/30 bg-ink">
        <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
          <div className="flex items-start gap-3 flex-wrap justify-between">
            <div>
              <h1 className="font-amiri text-2xl md:text-3xl text-gold-100 leading-tight mb-1">
                {heroTitle}
              </h1>
              {heroSubtitle && (
                <p className="text-[12px] text-gold-400/80 max-w-xl">{heroSubtitle}</p>
              )}
              {heroCoinCount && (
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-amiri text-2xl font-bold text-gold-300">
                    {heroCoinCount.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </span>
                  <span className="text-[11px] text-gold-500/70">
                    {isAr ? 'عملة' : 'coins'}
                  </span>
                </div>
              )}
              {catalogueId === 'arab' && !heroCoinCount && (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-gold-500/60 flex-wrap">
                  <span>5,505 {isAr ? 'عملة' : 'coins'}</span>
                  <span className="text-gold-700">·</span>
                  <span>20 {isAr ? 'دولة' : 'countries'}</span>
                  <span className="text-gold-700">·</span>
                  <span>1500–2026</span>
                </div>
              )}
              {catalogueId === 'islamic' && !heroCoinCount && (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-gold-500/60 flex-wrap">
                  <span>47,303 {isAr ? 'عملة' : 'coins'}</span>
                  <span className="text-gold-700">·</span>
                  <span>18 {isAr ? 'سلالة' : 'dynasties'}</span>
                  <span className="text-gold-700">·</span>
                  <span>41–922 {isAr ? 'هـ' : 'AH'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="hidden md:flex items-center gap-0 overflow-x-auto scrollbar-none border-t border-gold-700/30">
            {navItems.map(item => {
              const isExact  = pathname === item.href;
              const isActive = item.href === `/${locale}/islamic` || item.href === `/${locale}/catalogue`
                ? isExact
                : (pathname === item.href || pathname.startsWith(item.href + '/'));
              return (
                <Link key={item.href} href={item.href}
                  className={`shrink-0 px-4 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
                    ${isActive
                      ? 'border-gold-400 text-gold-200'
                      : 'border-transparent text-gold-500/60 hover:text-gold-200 hover:border-gold-500/50'}`}>
                  {isAr ? item.labelAr : item.labelEn}
                </Link>
              );
            })}
          </div>

          {mobileNavOpen && (
            <div className="md:hidden bg-ink border-t border-gold-700/20 animate-fade-in">
              {navItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`block px-4 py-3 text-[13px] border-b border-gold-700/20
                      ${isActive ? 'text-gold-200 bg-gold-500/10 font-medium' : 'text-gold-400 hover:text-gold-100'}`}>
                    {isAr ? item.labelAr : item.labelEn}
                  </Link>
                );
              })}
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
