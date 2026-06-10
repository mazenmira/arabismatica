// v3.0
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/header/SiteHeader';
import CataloguePage from '@/components/catalogue/CataloguePage';
import { supabase } from '@/lib/supabase';

interface CatalogueCard {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  href: string;
  status: 'active' | 'coming_soon';
  icon: string;
  bg: string;
}

const CATALOGUE_CARDS: CatalogueCard[] = [
  {
    id: 'arab',
    titleAr: 'العملات العربية الحديثة',
    titleEn: 'Modern Arab Coins',
    subtitleAr: '5,505 عملة · 20 دولة · 1500–2026م',
    subtitleEn: '5,505 coins · 20 countries · 1500–2026 CE',
    href: '',
    status: 'active',
    icon: '🌍',
    bg: 'from-amber-900 to-amber-800',
  },
  {
    id: 'islamic',
    titleAr: 'العملات الإسلامية',
    titleEn: 'Islamic Coins',
    subtitleAr: '47,303 عملة · 18 سلالة · 41–922هـ',
    subtitleEn: '47,303 coins · 18 dynasties · 41–922 AH',
    href: '/islamic',
    status: 'active',
    icon: '☪️',
    bg: 'from-stone-900 to-stone-800',
  },
  {
    id: 'roman',
    titleAr: 'العملات الرومانية',
    titleEn: 'Roman-Era Coins',
    subtitleAr: 'قريباً',
    subtitleEn: 'Coming soon',
    href: '',
    status: 'coming_soon',
    icon: '🏛️',
    bg: 'from-zinc-800 to-zinc-700',
  },
  {
    id: 'ptolemaic',
    titleAr: 'العملات البطلمية',
    titleEn: 'Ptolemaic Coins',
    subtitleAr: 'قريباً',
    subtitleEn: 'Coming soon',
    href: '',
    status: 'coming_soon',
    icon: '𓂀',
    bg: 'from-zinc-800 to-zinc-700',
  },
];

export default function Home({ params: { locale } }: { params: { locale: string } }) {
  const isAr = locale === 'ar';
  const [user, setUser]           = useState<{ id: string; email: string } | null>(null);
  const [authOpen,  setAuthOpen]  = useState(false);
  const [dashOpen,  setDashOpen]  = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email ?? '' });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen" style={{ background: 'var(--parch)' }}>
      <SiteHeader
        locale={locale}
        user={user}
        onAuthOpen={() => setAuthOpen(true)}
        onDashOpen={() => setDashOpen(true)}
        onAdminOpen={() => setAdminOpen(true)}
      />

      {/* ── CATALOGUE ENTRY CARDS ─────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 pt-6 pb-2" dir={isAr ? 'rtl' : 'ltr'}>
        <h2 className="text-[13px] font-medium text-amber-700/60 mb-3">
          {isAr ? 'اختر الكتالوج' : 'Choose a catalogue'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
          {CATALOGUE_CARDS.map(card => {
            const isActive = card.status === 'active';
            const href     = isActive && card.href ? `/${locale}${card.href}` : undefined;
            const content = (
              <div className={`relative overflow-hidden rounded-xl border transition-all
                bg-gradient-to-br ${card.bg}
                ${isActive
                  ? 'border-gold-700/50 hover:border-gold-500 hover:shadow-[0_0_20px_rgba(180,140,50,0.2)] hover:-translate-y-0.5 cursor-pointer'
                  : 'border-white/10 opacity-50 cursor-not-allowed'}`}>
                {/* Coming soon badge */}
                {!isActive && (
                  <div className="absolute top-2 end-2 text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-white/60">
                    {isAr ? 'قريباً' : 'Soon'}
                  </div>
                )}
                <div className="p-4">
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="font-amiri text-[14px] text-amber-100 leading-snug mb-1">
                    {isAr ? card.titleAr : card.titleEn}
                  </div>
                  <div className="text-[10px] text-amber-400/70">
                    {isAr ? card.subtitleAr : card.subtitleEn}
                  </div>
                  {isActive && (
                    <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-gold-400 font-medium">
                      {isAr ? 'تصفح ←' : '→ Browse'}
                    </div>
                  )}
                </div>
              </div>
            );

            return href
              ? <Link key={card.id} href={href}>{content}</Link>
              : <div key={card.id}>{content}</div>;
          })}
        </div>
      </div>

      {/* ── MAIN CATALOGUE ────────────────────────────────────────────── */}
      <CataloguePage
        locale={locale}
        user={user}
        authOpen={authOpen}
        dashOpen={dashOpen}
        adminOpen={adminOpen}
        setAuthOpen={setAuthOpen}
        setDashOpen={setDashOpen}
        setAdminOpen={setAdminOpen}
      />
    </main>
  );
}
