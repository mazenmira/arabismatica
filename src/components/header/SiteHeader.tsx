'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Globe, ChevronDown, Wrench, Settings } from 'lucide-react';
import { FacebookIcon, TwitterIcon, LinkedinIcon, YoutubeIcon, InstagramIcon, RssIcon } from './SocialIcons';
import ToolsSidebar from '@/components/sidebar/ToolsSidebar';
import IdentifyModal from '@/components/modals/IdentifyModal';

const WP = 'https://arabcollector.com';

const TOP_NAV_ITEMS_AR = [
  { label: 'المقتني العربي', children: [
    { label: 'عن المقتني العربي', href: `${WP}/about-us/` },
  ]},
  { label: '🌍 الكتالوج العربي', children: [
    { label: '🌍 كتالوج العملات العربية', href: '/ar/catalogue' },
  ]},
  { label: 'الدول', children: [
    { label: '🇪🇬 مصر',                       href: '/ar/country/egypt' },
    { label: '🇲🇦 المغرب',                    href: '/ar/country/morocco' },
    { label: '🇹🇳 تونس',                      href: '/ar/country/tunisia' },
    { label: '🇸🇦 المملكة العربية السعودية', href: '/ar/country/saudi-arabia' },
    { label: '🇾🇪 اليمن',                     href: '/ar/country/yemen' },
    { label: '🇴🇲 عُمان',                     href: '/ar/country/oman' },
    { label: '🇮🇶 العراق',                    href: '/ar/country/iraq' },
    { label: '🇩🇿 الجزائر',                   href: '/ar/country/algeria' },
    { label: '🇸🇾 سوريا',                     href: '/ar/country/syria' },
    { label: '🇱🇾 ليبيا',                     href: '/ar/country/libya' },
    { label: '🇦🇪 الإمارات',                  href: '/ar/country/uae' },
    { label: '🇯🇴 الأردن',                    href: '/ar/country/jordan' },
    { label: '🇱🇧 لبنان',                     href: '/ar/country/lebanon' },
    { label: '🇰🇼 الكويت',                    href: '/ar/country/kuwait' },
    { label: '🇶🇦 قطر',                       href: '/ar/country/qatar' },
    { label: '🇸🇩 السودان',                   href: '/ar/country/sudan' },
    { label: '🇲🇷 موريتانيا',                href: '/ar/country/mauritania' },
    { label: '🇵🇸 فلسطين',                   href: '/ar/country/palestine' },
    { label: '🇰🇲 جزر القمر',                 href: '/ar/country/comoros' },
    { label: '🇶🇦 قطر ودبي',                  href: '/ar/country/qatar-dubai' },
  ]},
  { label: '☪️ إسلامي', children: [
    { label: '☪️ العملات الإسلامية',           href: '/ar/islamic' },
    { label: '  ↳ السلالات',                   href: '/ar/islamic/dynasties' },
    { label: '  ↳ دور الضرب',                  href: '/ar/islamic/mints' },
    { label: '  ↳ فهرس العملات',               href: '/ar/islamic/coin-index' },
  ]},
  { label: 'الأدوات', isTools: true, children: [
    { label: '📅 محول الهجري ↔ الميلادي', href: '#hijri-converter' },
    { label: '🛠️ باقي الأدوات الداخلية', href: '#tools-sidebar' },
    { label: '📚 بوابة المعرفة',  href: `${WP}/knowledge-portal/` },
    { label: '🎓 أدوات التقييم', href: `${WP}/grading-tools/` },
    { label: '🔬 مختبر المقتني الصغير', href: `${WP}/young-collector-lab/` },
    { label: '🎓 أكاديمية المقتني', href: `${WP}/ac-academy/` },
    { label: '📖 المكتبة الإلكترونية', href: 'https://library.arabcollector.com/' },
  ]},
];

const TOP_NAV_ITEMS_EN = [
  { label: 'The Arab Collector', children: [
    { label: 'About The Arab Collector', href: `${WP}/about-us/` },
  ]},
  { label: '🌍 Arab Catalogue', children: [
    { label: '🌍 Arab Coin Catalogue', href: '/en/catalogue' },
  ]},
  { label: 'Countries', children: [
    { label: '🇪🇬 Egypt',        href: '/en/country/egypt' },
    { label: '🇲🇦 Morocco',      href: '/en/country/morocco' },
    { label: '🇹🇳 Tunisia',      href: '/en/country/tunisia' },
    { label: '🇸🇦 Saudi Arabia', href: '/en/country/saudi-arabia' },
    { label: '🇾🇪 Yemen',        href: '/en/country/yemen' },
    { label: '🇴🇲 Oman',         href: '/en/country/oman' },
    { label: '🇮🇶 Iraq',         href: '/en/country/iraq' },
    { label: '🇩🇿 Algeria',      href: '/en/country/algeria' },
    { label: '🇸🇾 Syria',        href: '/en/country/syria' },
    { label: '🇱🇾 Libya',        href: '/en/country/libya' },
    { label: '🇦🇪 UAE',          href: '/en/country/uae' },
    { label: '🇯🇴 Jordan',       href: '/en/country/jordan' },
    { label: '🇱🇧 Lebanon',      href: '/en/country/lebanon' },
    { label: '🇰🇼 Kuwait',       href: '/en/country/kuwait' },
    { label: '🇶🇦 Qatar',        href: '/en/country/qatar' },
    { label: '🇸🇩 Sudan',        href: '/en/country/sudan' },
    { label: '🇲🇷 Mauritania',   href: '/en/country/mauritania' },
    { label: '🇵🇸 Palestine',    href: '/en/country/palestine' },
    { label: '🇰🇲 Comoros',      href: '/en/country/comoros' },
    { label: '🇶🇦 Qatar & Dubai', href: '/en/country/qatar-dubai' },
  ]},
  { label: '☪️ Islamic', children: [
    { label: '☪️ Islamic Coins',   href: '/en/islamic' },
    { label: '  ↳ Dynasties',      href: '/en/islamic/dynasties' },
    { label: '  ↳ Mints',          href: '/en/islamic/mints' },
    { label: '  ↳ Rulers',         href: '/en/islamic/rulers' },
    { label: '  ↳ Coin Index',     href: '/en/islamic/coin-index' },
  ]},
  { label: 'Tools', isTools: true, children: [
    { label: '📅 Hijri ↔ Gregorian Converter', href: '#hijri-converter' },
    { label: '🛠️ More Built-in Tools', href: '#tools-sidebar' },
    { label: '📚 Knowledge Portal',       href: `${WP}/knowledge-portal/` },
    { label: '🎓 Grading Tools',          href: `${WP}/grading-tools/` },
    { label: '🔬 Young Collector Lab',    href: `${WP}/young-collector-lab/` },
    { label: '🎓 Arab Collector Academy', href: `${WP}/ac-academy/` },
    { label: '📖 Digital Library',        href: 'https://library.arabcollector.com/' },
  ]},
];

const SOCIALS = [
  { icon: FacebookIcon,  href: `${WP}/facebook`,                                     label: 'Facebook' },
  { icon: TwitterIcon,   href: 'https://x.com/ArabCollector',                        label: 'X' },
  { icon: LinkedinIcon,  href: 'https://au.linkedin.com/company/the-arab-collector', label: 'LinkedIn' },
  { icon: YoutubeIcon,   href: 'https://www.youtube.com/@thearabcollector5252',       label: 'YouTube' },
  { icon: InstagramIcon, href: 'https://www.instagram.com/thearabcollector/',        label: 'Instagram' },
  { icon: RssIcon,       href: `${WP}/feed/`,                                        label: 'RSS' },
];

const TOP_NAV_ITEMS_DE = [
  { label: 'The Arab Collector', children: [
    { label: 'Über The Arab Collector', href: `${WP}/about-us/` },
  ]},
  { label: '🌍 Arabischer Katalog', children: [
    { label: '🌍 Arabischer Münzkatalog', href: '/de/catalogue' },
  ]},
  { label: 'Länder', children: [
    { label: '🇪🇬 Ägypten',        href: '/de/country/egypt' },
    { label: '🇲🇦 Marokko',        href: '/de/country/morocco' },
    { label: '🇹🇳 Tunesien',       href: '/de/country/tunisia' },
    { label: '🇸🇦 Saudi-Arabien',  href: '/de/country/saudi-arabia' },
    { label: '🇾🇪 Jemen',          href: '/de/country/yemen' },
    { label: '🇴🇲 Oman',           href: '/de/country/oman' },
    { label: '🇮🇶 Irak',           href: '/de/country/iraq' },
    { label: '🇩🇿 Algerien',       href: '/de/country/algeria' },
    { label: '🇸🇾 Syrien',         href: '/de/country/syria' },
    { label: '🇱🇾 Libyen',         href: '/de/country/libya' },
    { label: '🇦🇪 VAE',            href: '/de/country/uae' },
    { label: '🇯🇴 Jordanien',      href: '/de/country/jordan' },
    { label: '🇱🇧 Libanon',        href: '/de/country/lebanon' },
    { label: '🇰🇼 Kuwait',         href: '/de/country/kuwait' },
    { label: '🇶🇦 Katar',          href: '/de/country/qatar' },
    { label: '🇸🇩 Sudan',          href: '/de/country/sudan' },
    { label: '🇲🇷 Mauretanien',    href: '/de/country/mauritania' },
    { label: '🇵🇸 Palästina',      href: '/de/country/palestine' },
    { label: '🇰🇲 Komoren',        href: '/de/country/comoros' },
    { label: '🇶🇦 Katar & Dubai',  href: '/de/country/qatar-dubai' },
  ]},
  { label: '☪️ Islamisch', children: [
    { label: '☪️ Islamische Münzen',  href: '/de/islamic' },
    { label: '  ↳ Dynastien',         href: '/de/islamic/dynasties' },
    { label: '  ↳ Münzstätten',       href: '/de/islamic/mints' },
    { label: '  ↳ Herrscher',         href: '/de/islamic/rulers' },
    { label: '  ↳ Münzindex',         href: '/de/islamic/coin-index' },
  ]},
  { label: 'Tools', isTools: true, children: [
    { label: '📅 Hidschra ↔ Gregorian', href: '#hijri-converter' },
    { label: '🛠️ Weitere Tools',        href: '#tools-sidebar' },
    { label: '📚 Wissensportal',        href: `${WP}/knowledge-portal/` },
    { label: '🎓 Bewertungstools',      href: `${WP}/grading-tools/` },
    { label: '🔬 Junger Sammler Lab',   href: `${WP}/young-collector-lab/` },
    { label: '🎓 Arab Collector Akademie', href: `${WP}/ac-academy/` },
    { label: '📖 Digitale Bibliothek',  href: 'https://library.arabcollector.com/' },
  ]},
];

function getDate(locale: string): string {
  const loc = locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-AU';
  return new Date().toLocaleDateString(loc, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

interface SiteHeaderProps {
  locale: string;
  onAuthOpen?: () => void;
  onDashOpen?: () => void;
  onAdminOpen?: () => void;
  user?: { id: string; email: string } | null;
}

export default function SiteHeader({ locale, onAuthOpen, onDashOpen, onAdminOpen, user }: SiteHeaderProps) {
  const isAr = locale === 'ar';
  const TOP_NAV_ITEMS = locale === 'ar' ? TOP_NAV_ITEMS_AR : locale === 'de' ? TOP_NAV_ITEMS_DE : TOP_NAV_ITEMS_EN;

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [activeMenu,   setActiveMenu]   = useState<string | null>(null);
  const [toolsOpen,    setToolsOpen]    = useState(false);
  const [toolDefault,  setToolDefault]  = useState<string | undefined>(undefined);
  const [identifyOpen, setIdentifyOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setActiveMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className="bg-ink text-xs border-b border-gold-700/30">
        <div className="max-w-[1440px] mx-auto px-4 h-9 flex items-center gap-3">

          {/* Language switcher */}
          <div className="flex items-center gap-1 border border-gold-700/40 rounded px-2 py-0.5">
            <Globe size={12} className="text-gold-400 shrink-0" />
            <Link href="/ar" className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'ar' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>ع</Link>
            <span className="text-gold-700">|</span>
            <Link href="/en" className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'en' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>EN</Link>
            <span className="text-gold-700">|</span>
            <Link href="/de" className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'de' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>DE</Link>
          </div>

          {/* Date */}
          <span className="text-gold-500/70 text-[11px] hidden sm:block">{getDate(locale)}</span>

          <div className="flex-1" />

          {/* Social icons */}
          <div className="hidden lg:flex items-center gap-2">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                className="text-gold-600 hover:text-gold-300 transition-colors">
                <Icon size={12} />
              </a>
            ))}
          </div>

          {/* Back to Arab Collector */}
          <a href="https://arabcollector.com"
            className="hidden md:flex items-center gap-1 text-gold-500 hover:text-gold-300 text-[11px] transition-colors shrink-0"
            target="_blank" rel="noopener">
            {isAr ? '← العودة إلى المقتني العربي' : '← Return to The Arab Collector'}
          </a>
        </div>
      </div>

      {/* ── MAIN NAV ────────────────────────────────────────────────────── */}
      <header
        className={`bg-ink sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : ''}`}
        style={{ borderBottom: '2px solid #8B6D2E' }}
      >
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center h-[64px] gap-4">

            {/* Logo */}
            <Link href={`/${locale}`} className="shrink-0">
              <Image
                src="https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png"
                alt="Arabismatica"
                width={200} height={70}
                className="h-[46px] w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav ref={menuRef} className="hidden xl:flex items-center flex-1 gap-0.5 mx-2" dir={isAr ? 'rtl' : 'ltr'}>
              {TOP_NAV_ITEMS.map((item) => (
                <div key={item.label} className="relative group">
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium rounded transition-colors whitespace-nowrap
                      ${ (item as { isTools?: boolean }).isTools
                          ? 'bg-gold-700/80 hover:bg-gold-600 text-gold-100 rounded-full px-3'
                          : 'text-gold-400 hover:text-white hover:bg-white/5' }
                      ${activeMenu === item.label ? (item as { isTools?: boolean }).isTools ? 'bg-gold-600' : 'bg-white/10 text-white' : ''}`}
                    onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}
                    onMouseEnter={() => setActiveMenu(item.label)}
                  >
                    {(item as { isTools?: boolean }).isTools && <Wrench size={12} className="shrink-0" />}
                    {item.label}
                    <ChevronDown size={12} className={`transition-transform ${activeMenu === item.label ? 'rotate-180' : ''}`} />
                  </button>

                  {activeMenu === item.label && item.children && (
                    <div
                      className="absolute top-full right-0 mt-1 bg-ink border border-gold-800/50 rounded-lg shadow-2xl min-w-[220px] py-1 z-50 animate-fade-in"
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                      {item.children.map((child) => {
                        if (child.href === '#hijri-converter') {
                          return (
                            <button key={child.label} onClick={() => { setToolDefault('hijriConverter'); setToolsOpen(true); setActiveMenu(null); }}
                              className="w-full text-start block px-4 py-2.5 text-[12px] transition-colors border-b border-gold-900/30 last:border-0 text-gold-300 hover:text-white hover:bg-white/5 font-medium">
                              {child.label}
                            </button>
                          );
                        }
                        if (child.href === '#tools-sidebar') {
                          return (
                            <button key={child.label} onClick={() => { setToolDefault(undefined); setToolsOpen(true); setActiveMenu(null); }}
                              className="w-full text-start block px-4 py-2.5 text-[12px] transition-colors border-b border-gold-900/30 last:border-0 text-white/70 hover:text-white hover:bg-white/5">
                              {child.label}
                            </button>
                          );
                        }
                        const isExternal = child.href.startsWith('http');
                        return (
                          <a key={child.label} href={child.href}
                            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="block px-4 py-2.5 text-[12px] transition-colors border-b border-gold-900/30 last:border-0 text-white/70 hover:text-white hover:bg-white/5">
                            {child.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 mr-auto xl:mr-0">

              {/* AI Identify */}
              <button onClick={() => setIdentifyOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full border border-gold-500/70 text-gold-400 hover:text-white hover:border-gold-400 transition-colors"
                title={isAr ? 'تحديد العملة بالصورة' : 'Identify coin by image'}>
                <span>🔍</span>
                {isAr ? 'تحديد بالصورة' : 'Identify'}
              </button>

              {/* Admin Panel — towards end */}
              <button
                onClick={onAdminOpen}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full border border-gold-700/40 text-gold-500/70 hover:border-gold-600 hover:text-gold-400 transition-colors"
                title={isAr ? 'لوحة الإدارة' : 'Admin Panel'}
              >
                <Settings size={12} />
                <span className="hidden lg:block">{isAr ? 'الإدارة' : 'Admin'}</span>
              </button>

              {/* Auth button — at the end */}
              {user ? (
                <button onClick={onDashOpen}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 hover:bg-gold-500/25 transition-colors">
                  <span>👤</span>
                  <span className="max-w-[80px] truncate">{user.email.split('@')[0]}</span>
                </button>
              ) : (
                <button onClick={onAuthOpen}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full border border-gold-700/40 text-gold-500/70 hover:border-gold-600 hover:text-gold-400 transition-colors">
                  {isAr ? 'دخول / تسجيل' : 'Sign in'}
                </button>
              )}

              {/* Mobile toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden flex items-center justify-center w-9 h-9 rounded-full text-white hover:bg-white/10 transition-colors">
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE MENU ─────────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="xl:hidden bg-ink border-t border-gold-800/50 max-h-[80vh] overflow-y-auto animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>


            {TOP_NAV_ITEMS.map((item) => (
              <div key={item.label}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3 text-[13px] text-gold-400 hover:text-white border-b border-gold-900/20"
                  onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}>
                  <span>{item.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${activeMenu === item.label ? 'rotate-180' : ''}`} />
                </button>
                {activeMenu === item.label && item.children && (
                  <div className="bg-ink/80">
                    {item.children.map((child) => {
                      if (child.href === '#hijri-converter') {
                        return (
                          <button key={child.label}
                            onClick={() => { setToolDefault('hijriConverter'); setToolsOpen(true); setMobileOpen(false); setActiveMenu(null); }}
                            className="w-full text-start block px-8 py-2.5 text-[12px] text-gold-300 font-medium hover:text-white border-b border-gold-900/10 last:border-0">
                            {child.label}
                          </button>
                        );
                      }
                      if (child.href === '#tools-sidebar') {
                        return (
                          <button key={child.label}
                            onClick={() => { setToolDefault(undefined); setToolsOpen(true); setMobileOpen(false); setActiveMenu(null); }}
                            className="w-full text-start block px-8 py-2.5 text-[12px] text-gold-400 hover:text-white border-b border-gold-900/10 last:border-0">
                            {child.label}
                          </button>
                        );
                      }
                      const isExternal = child.href.startsWith('http');
                      return isExternal ? (
                        <a key={child.label} href={child.href}
                          target="_blank" rel="noopener noreferrer"
                          className="block px-8 py-2.5 text-[12px] text-gold-400 hover:text-white border-b border-gold-900/10 last:border-0">
                          {child.label}
                        </a>
                      ) : (
                        <Link key={child.label} href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-8 py-2.5 text-[12px] text-gold-400 hover:text-white border-b border-gold-900/10 last:border-0">
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="px-4 py-4 flex gap-3 border-t border-gold-800/30 flex-wrap">
              <button onClick={() => { setIdentifyOpen(true); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-gold-500/70 text-gold-400 text-center">
                {isAr ? 'تحديد بالصورة' : 'Identify'}
              </button>
              <button onClick={() => { onAdminOpen?.(); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-gold-700/40 text-gold-500/70 text-center flex items-center justify-center gap-1">
                <Settings size={12} /> {isAr ? 'الإدارة' : 'Admin'}
              </button>
              {user ? (
                <button onClick={() => { onDashOpen?.(); setMobileOpen(false); }}
                  className="flex-1 py-2 text-[12px] rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 text-center">
                  👤 {user.email.split('@')[0]}
                </button>
              ) : (
                <button onClick={() => { onAuthOpen?.(); setMobileOpen(false); }}
                  className="flex-1 py-2 text-[12px] rounded-full border border-gold-700/40 text-gold-500/70 text-center">
                  {isAr ? 'دخول / تسجيل' : 'Sign in'}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <ToolsSidebar open={toolsOpen} onClose={() => { setToolsOpen(false); setToolDefault(undefined); }} locale={locale} defaultTool={toolDefault} />
      <IdentifyModal open={identifyOpen} onClose={() => setIdentifyOpen(false)} locale={locale} />
    </>
  );
}
