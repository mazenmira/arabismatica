'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, ChevronDown, Wrench, Settings, Moon, Sun } from 'lucide-react';
import { FacebookIcon, TwitterIcon, LinkedinIcon, YoutubeIcon, InstagramIcon, RssIcon } from './SocialIcons';
import ToolsSidebar from '@/components/sidebar/ToolsSidebar';
import IdentifyModal from '@/components/modals/IdentifyModal';
import { useAuth } from '@/lib/authContext';
import { useDarkMode } from '@/lib/darkModeContext';

const WP = 'https://arabcollector.com';

const TOP_NAV_ITEMS_AR = [
  { label: 'المقتني العربي', children: [
    { label: 'زيارة المقتني العربي', href: `${WP}/` },
    { label: 'عن المقتني العربي',   href: `${WP}/about-us/` },
  ]},
  { label: 'العالم العربي', children: [
    { label: 'العملات العربية الحديثة', href: '/ar/catalogue' },
    { label: '  ↳ حسب الدولة',          href: '/ar/catalogue/countries' },
    { label: 'العملات الإسلامية',       href: '/ar/islamic' },
    { label: '  ↳ السلالات',            href: '/ar/islamic/dynasties' },
    { label: '  ↳ دور الضرب',           href: '/ar/islamic/mints' },
    { label: '  ↳ فهرس العملات',        href: '/ar/islamic/coin-index' },
  ]},
  { label: 'العالم القديم', children: [
    { label: 'العملات الساسانية',            href: '/ar/sasanian' },
    { label: '  ↳ الحكام',                  href: '/ar/sasanian/rulers' },
    { label: '  ↳ دور الضرب',               href: '/ar/sasanian/mints' },
    { label: 'العملات النبطية (قريباً)',      href: '' },
    { label: 'العملات البيزنطية (قريباً)',   href: '' },
    { label: 'العملات البطلمية (قريباً)',    href: '' },
    { label: 'العملات الأخمينية (قريباً)',   href: '' },
  ]},
  { label: 'الإسلام الهندي', children: [
    { label: 'العملات المغولية (قريباً)',    href: '' },
    { label: 'سلطنة دلهي (قريباً)',          href: '' },
  ]},
  { label: 'الأدوات', isTools: true, children: [
    { label: 'محول الهجري ↔ الميلادي', href: '#hijri-converter' },
    { label: 'باقي الأدوات الداخلية',  href: '#tools-sidebar' },
    { label: 'بوابة المعرفة',           href: `${WP}/knowledge-portal/` },
    { label: 'أدوات التقييم',           href: `${WP}/grading-tools/` },
    { label: 'مختبر المقتني الصغير',    href: `${WP}/young-collector-lab/` },
    { label: 'أكاديمية المقتني',        href: `${WP}/ac-academy/` },
    { label: 'المكتبة الإلكترونية',     href: 'https://library.arabcollector.com/' },
  ]},
];

const TOP_NAV_ITEMS_EN = [
  { label: 'The Arab Collector', children: [
    { label: 'Visit The Arab Collector', href: `${WP}/` },
    { label: 'About',                    href: `${WP}/about-us/` },
  ]},
  { label: 'Arab World', children: [
    { label: 'Modern Arab Coins',   href: '/en/catalogue' },
    { label: '  ↳ By Country',      href: '/en/catalogue/countries' },
    { label: 'Islamic Coins',       href: '/en/islamic' },
    { label: '  ↳ Dynasties',       href: '/en/islamic/dynasties' },
    { label: '  ↳ Mints',           href: '/en/islamic/mints' },
    { label: '  ↳ Coin Index',      href: '/en/islamic/coin-index' },
  ]},
  { label: 'Ancient World', children: [
    { label: 'Sasanian Coins',              href: '/en/sasanian' },
    { label: '  ↳ Rulers',                 href: '/en/sasanian/rulers' },
    { label: '  ↳ Mints',                  href: '/en/sasanian/mints' },
    { label: 'Nabataean Coins (soon)',      href: '' },
    { label: 'Byzantine Arab Coins (soon)', href: '' },
    { label: 'Ptolemaic Coins (soon)',      href: '' },
    { label: 'Achaemenid Coins (soon)',     href: '' },
  ]},
  { label: 'Islamic India', children: [
    { label: 'Mughal Coins (soon)',    href: '' },
    { label: 'Delhi Sultanate (soon)', href: '' },
  ]},
  { label: 'Tools', isTools: true, children: [
    { label: 'Hijri ↔ Gregorian Converter', href: '#hijri-converter' },
    { label: 'More Built-in Tools',          href: '#tools-sidebar' },
    { label: 'Knowledge Portal',             href: `${WP}/knowledge-portal/` },
    { label: 'Grading Tools',               href: `${WP}/grading-tools/` },
    { label: 'Young Collector Lab',         href: `${WP}/young-collector-lab/` },
    { label: 'Arab Collector Academy',      href: `${WP}/ac-academy/` },
    { label: 'Digital Library',             href: 'https://library.arabcollector.com/' },
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
    { label: 'The Arab Collector besuchen', href: `${WP}/` },
    { label: 'Über uns',                    href: `${WP}/about-us/` },
  ]},
  { label: 'Arabische Welt', children: [
    { label: 'Moderne arabische Münzen', href: '/de/catalogue' },
    { label: '  ↳ Nach Land',            href: '/de/catalogue/countries' },
    { label: 'Islamische Münzen',        href: '/de/islamic' },
    { label: '  ↳ Dynastien',            href: '/de/islamic/dynasties' },
    { label: '  ↳ Münzstätten',          href: '/de/islamic/mints' },
    { label: '  ↳ Münzindex',            href: '/de/islamic/coin-index' },
  ]},
  { label: 'Alte Welt', children: [
    { label: 'Sassanidische Münzen',             href: '/de/sasanian' },
    { label: '  ↳ Herrscher',                   href: '/de/sasanian/rulers' },
    { label: '  ↳ Münzstätten',                 href: '/de/sasanian/mints' },
    { label: 'Nabatäische Münzen (bald)',        href: '' },
    { label: 'Byzantinisch-arab. Münzen (bald)', href: '' },
    { label: 'Ptolemäische Münzen (bald)',       href: '' },
    { label: 'Achämenidische Münzen (bald)',     href: '' },
  ]},
  { label: 'Islam. Indien', children: [
    { label: 'Mogulmünzen (bald)',     href: '' },
    { label: 'Delhi-Sultanat (bald)',  href: '' },
  ]},
  { label: 'Tools', isTools: true, children: [
    { label: 'Hidschra ↔ Gregorian',    href: '#hijri-converter' },
    { label: 'Weitere Tools',           href: '#tools-sidebar' },
    { label: 'Wissensportal',           href: `${WP}/knowledge-portal/` },
    { label: 'Bewertungstools',         href: `${WP}/grading-tools/` },
    { label: 'Junger Sammler Lab',      href: `${WP}/young-collector-lab/` },
    { label: 'Arab Collector Akademie', href: `${WP}/ac-academy/` },
    { label: 'Digitale Bibliothek',     href: 'https://library.arabcollector.com/' },
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
}

export default function SiteHeader({ locale }: SiteHeaderProps) {
  const isAr = locale === 'ar';
  const TOP_NAV_ITEMS = locale === 'ar' ? TOP_NAV_ITEMS_AR : locale === 'de' ? TOP_NAV_ITEMS_DE : TOP_NAV_ITEMS_EN;

  const { user, setAuthOpen, setDashOpen, setAdminOpen } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const pathname = usePathname();

  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [activeMenu,   setActiveMenu]   = useState<string | null>(null);
  const [toolsOpen,    setToolsOpen]    = useState(false);
  const [toolDefault,  setToolDefault]  = useState<string | undefined>(undefined);
  const [identifyOpen, setIdentifyOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    return segments.join('/') || `/${newLocale}`;
  };

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
            <Link href={switchLocale('ar')} className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'ar' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>ع</Link>
            <span className="text-gold-700">|</span>
            <Link href={switchLocale('en')} className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'en' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>EN</Link>
            <span className="text-gold-700">|</span>
            <Link href={switchLocale('de')} className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${locale === 'de' ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>DE</Link>
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
                        if (!child.href) {
                          return (
                            <span key={child.label}
                              className="block px-4 py-2.5 text-[12px] border-b border-gold-900/30 last:border-0 text-white/30 cursor-default select-none">
                              {child.label}
                            </span>
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

              {/* Dark mode toggle */}
              <button onClick={toggleDarkMode}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-gold-700/40 text-gold-500 hover:border-gold-500 hover:text-gold-300 transition-colors"
                title={darkMode ? (isAr ? 'الوضع الفاتح' : 'Light mode') : (isAr ? 'الوضع الداكن' : 'Dark mode')}>
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {/* Admin Panel */}
              <button
                onClick={() => setAdminOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full border border-gold-700/40 text-gold-500/70 hover:border-gold-600 hover:text-gold-400 transition-colors"
                title={isAr ? 'لوحة الإدارة' : 'Admin Panel'}
              >
                <Settings size={12} />
                <span className="hidden lg:block">{isAr ? 'الإدارة' : 'Admin'}</span>
              </button>

              {/* Auth button */}
              {user ? (
                <button onClick={() => setDashOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 hover:bg-gold-500/25 transition-colors">
                  <span>👤</span>
                  <span className="max-w-[80px] truncate">{user.email.split('@')[0]}</span>
                </button>
              ) : (
                <button onClick={() => setAuthOpen(true)}
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
                      if (!child.href) {
                        return (
                          <span key={child.label}
                            className="block px-8 py-2.5 text-[12px] text-white/30 border-b border-gold-900/10 last:border-0 cursor-default">
                            {child.label}
                          </span>
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
              <button onClick={() => { toggleDarkMode(); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-gold-700/40 text-gold-500/70 text-center flex items-center justify-center gap-1">
                {darkMode ? <Sun size={12} /> : <Moon size={12} />} {darkMode ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}
              </button>
              <button onClick={() => { setAdminOpen(true); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-gold-700/40 text-gold-500/70 text-center flex items-center justify-center gap-1">
                <Settings size={12} /> {isAr ? 'الإدارة' : 'Admin'}
              </button>
              {user ? (
                <button onClick={() => { setDashOpen(true); setMobileOpen(false); }}
                  className="flex-1 py-2 text-[12px] rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 text-center">
                  👤 {user.email.split('@')[0]}
                </button>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
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
