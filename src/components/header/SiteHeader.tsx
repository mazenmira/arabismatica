'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, ChevronDown, ChevronRight, Wrench, Settings, Moon, Sun, Search, User } from 'lucide-react';
import { FacebookIcon, TwitterIcon, LinkedinIcon, YoutubeIcon, InstagramIcon, RssIcon } from './SocialIcons';
import ToolsSidebar from '@/components/sidebar/ToolsSidebar';
import IdentifyModal from '@/components/modals/IdentifyModal';
import { useAuth } from '@/lib/authContext';
import { useDarkMode } from '@/lib/darkModeContext';

const WP = 'https://arabcollector.com';

type NavGrand = { label: string; href: string };
type NavChild = {
  label: string;
  href?: string;
  grandchildren?: NavGrand[];
  isHijriTool?: boolean;
  isToolsSidebar?: boolean;
  isDivider?: boolean;
  isComingSoon?: boolean;
  isInPrep?: boolean;
};
type NavTopItem = { label: string; isTools?: boolean; children: NavChild[] };

const TOP_NAV_ITEMS_AR: NavTopItem[] = [
  { label: 'المقتني العربي', children: [
    { label: 'زيارة المقتني العربي', href: `${WP}/` },
    { label: 'عن المقتني العربي',   href: `${WP}/about-us/` },
  ]},
  { label: 'الدول العربية الحديثة', children: [
    { label: 'العملات العربية الحديثة', href: '/ar/catalogue', grandchildren: [
      { label: 'حسب الدولة', href: '/ar/catalogue/countries' },
    ]},
    { label: 'الأوسمة والنياشين العربية', isComingSoon: true },
  ]},
  { label: 'العصور الإسلامية', children: [
    { label: 'العملات الإسلامية', href: '/ar/islamic', grandchildren: [
      { label: 'السلالات',        href: '/ar/islamic/dynasties' },
      { label: 'دور الضرب',       href: '/ar/islamic/mints' },
      { label: 'الجدول الزمني',   href: '/ar/islamic/timeline' },
      { label: 'فهرس العملات',    href: '/ar/islamic/coin-index' },
    ]},
    { label: 'الإمبراطورية المغولية', href: '/ar/mughal', grandchildren: [
      { label: 'الحكام',    href: '/ar/mughal/rulers' },
      { label: 'دور الضرب', href: '/ar/mughal/mints' },
    ]},
    { label: 'سلطنة دلهي', href: '/ar/delhi', grandchildren: [
      { label: 'الحكام',    href: '/ar/delhi/rulers' },
      { label: 'دور الضرب', href: '/ar/delhi/mints' },
    ]},
    { isDivider: true, label: '' },
    { label: 'سلطنة المماليك',         isComingSoon: true },
    { label: 'الإمبراطورية التيمورية', isComingSoon: true },
    { label: 'الإمبراطورية الغزنوية',  isComingSoon: true },
    { label: 'فارس الصفوية',           isComingSoon: true },
    { label: 'الإمبراطورية السلجوقية', isComingSoon: true },
    { label: 'صقلية النورمانية',       isComingSoon: true },
  ]},
  { label: 'الدولة العثمانية', children: [
    { label: 'الدولة العثمانية 1299–1922', isInPrep: true },
  ]},
  { label: 'العالم القديم', children: [
    { label: 'فارس ما قبل الإسلام', href: undefined },
    { label: 'الإمبراطورية الساسانية', href: '/ar/sasanian', grandchildren: [
      { label: 'الحكام',       href: '/ar/sasanian/rulers' },
      { label: 'دور الضرب',    href: '/ar/sasanian/mints' },
      { label: 'فهرس العملات', href: '/ar/sasanian/coin-index' },
    ]},
    { label: 'الإمبراطورية الفرثية',   isComingSoon: true },
    { label: 'الإمبراطورية الأخمينية', isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'الهلنستيون والشرق الأدنى', href: undefined },
    { label: 'الإمبراطورية السلوقية',  isComingSoon: true },
    { label: 'المملكة البطلمية',        isComingSoon: true },
    { label: 'المملكة النبطية',         isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'روما في العالم العربي', href: undefined },
    { label: 'المقاطعات الرومانية الشرقية', isComingSoon: true },
    { label: 'الإسكندرية الرومانية',        isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'البيزنطيون والصليبيون', href: undefined },
    { label: 'الإمبراطورية البيزنطية', isComingSoon: true },
    { label: 'الممالك الصليبية',       isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'الفينيقيون والجزيرة القديمة', href: undefined },
    { label: 'المدن الفينيقية',             isComingSoon: true },
    { label: 'الجزيرة العربية القديمة',     isComingSoon: true },
    { label: 'مملكة حمير',                  isComingSoon: true },
  ]},
  { label: 'الأدوات', isTools: true, children: [
    { label: 'دليل دور الضرب',       isComingSoon: true },
    { label: 'فهرس الحكام',          isComingSoon: true },
    { label: 'محول الهجري–الميلادي', isComingSoon: true },
    { label: 'دليل الخط العربي',     isComingSoon: true },
  ]},
];

const TOP_NAV_ITEMS_EN: NavTopItem[] = [
  { label: 'The Arab Collector', children: [
    { label: 'Visit The Arab Collector', href: `${WP}/` },
    { label: 'About',                    href: `${WP}/about-us/` },
  ]},
  { label: 'Modern Arab', children: [
    { label: 'Modern Arab Coins', href: '/en/catalogue', grandchildren: [
      { label: 'By Country', href: '/en/catalogue/countries' },
    ]},
    { label: 'Arab Medals & Orders', isComingSoon: true },
  ]},
  { label: 'Islamic', children: [
    { label: 'Islamic Dynastic Coins', href: '/en/islamic', grandchildren: [
      { label: 'Dynasties',  href: '/en/islamic/dynasties' },
      { label: 'Mints',      href: '/en/islamic/mints' },
      { label: 'Timeline',   href: '/en/islamic/timeline' },
      { label: 'Coin Index', href: '/en/islamic/coin-index' },
    ]},
    { label: 'Mughal Empire', href: '/en/mughal', grandchildren: [
      { label: 'Rulers', href: '/en/mughal/rulers' },
      { label: 'Mints',  href: '/en/mughal/mints' },
    ]},
    { label: 'Delhi Sultanate', href: '/en/delhi', grandchildren: [
      { label: 'Rulers', href: '/en/delhi/rulers' },
      { label: 'Mints',  href: '/en/delhi/mints' },
    ]},
    { isDivider: true, label: '' },
    { label: 'Mamluk Sultanate',   isComingSoon: true },
    { label: 'Timurid Empire',     isComingSoon: true },
    { label: 'Ghaznavid Empire',   isComingSoon: true },
    { label: 'Safavid Persia',     isComingSoon: true },
    { label: 'Seljuk Empire',      isComingSoon: true },
    { label: 'Norman Sicily',      isComingSoon: true },
  ]},
  { label: 'Ottoman', children: [
    { label: 'Ottoman Empire 1299–1922', isInPrep: true },
  ]},
  { label: 'Ancient World', children: [
    { label: 'Pre-Islamic Persia', href: undefined },
    { label: 'Sasanian Empire', href: '/en/sasanian', grandchildren: [
      { label: 'Rulers',     href: '/en/sasanian/rulers' },
      { label: 'Mints',      href: '/en/sasanian/mints' },
      { label: 'Coin Index', href: '/en/sasanian/coin-index' },
    ]},
    { label: 'Parthian Empire',    isComingSoon: true },
    { label: 'Achaemenid Persia',  isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Hellenistic & Ancient', href: undefined },
    { label: 'Seleucid Empire',    isComingSoon: true },
    { label: 'Ptolemaic Kingdom',  isComingSoon: true },
    { label: 'Nabataean Kingdom',  isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Rome in the Arab World', href: undefined },
    { label: 'Roman Provincial Eastern', isComingSoon: true },
    { label: 'Roman Egypt Alexandrian',  isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Byzantine & Crusader', href: undefined },
    { label: 'Byzantine Empire',   isComingSoon: true },
    { label: 'Crusader States',    isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Phoenician & Ancient Levant', href: undefined },
    { label: 'Phoenician Cities', isComingSoon: true },
    { label: 'Ancient Arabia',    isComingSoon: true },
    { label: 'Himyarite Kingdom', isComingSoon: true },
  ]},
  { label: 'Tools', isTools: true, children: [
    { label: 'Mint Gazetteer',      isComingSoon: true },
    { label: 'Ruler Index',         isComingSoon: true },
    { label: 'Hijri–CE Converter',  isComingSoon: true },
    { label: 'Arabic Script Guide', isComingSoon: true },
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

const TOP_NAV_ITEMS_DE: NavTopItem[] = [
  { label: 'The Arab Collector', children: [
    { label: 'The Arab Collector besuchen', href: `${WP}/` },
    { label: 'Über uns',                    href: `${WP}/about-us/` },
  ]},
  { label: 'Modernes Arabien', children: [
    { label: 'Moderne arabische Münzen', href: '/de/catalogue', grandchildren: [
      { label: 'Nach Land', href: '/de/catalogue/countries' },
    ]},
    { label: 'Arabische Orden & Medaillen', isComingSoon: true },
  ]},
  { label: 'Islamisch', children: [
    { label: 'Islamische Dynastiemünzen', href: '/de/islamic', grandchildren: [
      { label: 'Dynastien',   href: '/de/islamic/dynasties' },
      { label: 'Münzstätten', href: '/de/islamic/mints' },
      { label: 'Zeitleiste',  href: '/de/islamic/timeline' },
      { label: 'Münzindex',   href: '/de/islamic/coin-index' },
    ]},
    { label: 'Mogulreich', href: '/de/mughal', grandchildren: [
      { label: 'Herrscher',   href: '/de/mughal/rulers' },
      { label: 'Münzstätten', href: '/de/mughal/mints' },
    ]},
    { label: 'Delhi-Sultanat', href: '/de/delhi', grandchildren: [
      { label: 'Herrscher',   href: '/de/delhi/rulers' },
      { label: 'Münzstätten', href: '/de/delhi/mints' },
    ]},
    { isDivider: true, label: '' },
    { label: 'Mamluken-Sultanat',     isComingSoon: true },
    { label: 'Timuridenreich',        isComingSoon: true },
    { label: 'Ghaznavidenreich',      isComingSoon: true },
    { label: 'Safawidisches Persien', isComingSoon: true },
    { label: 'Seldschukenreich',      isComingSoon: true },
    { label: 'Normannisches Sizilien',isComingSoon: true },
  ]},
  { label: 'Osmanisch', children: [
    { label: 'Osmanisches Reich 1299–1922', isInPrep: true },
  ]},
  { label: 'Alte Welt', children: [
    { label: 'Vorislamisches Persien', href: undefined },
    { label: 'Sassanidisches Reich', href: '/de/sasanian', grandchildren: [
      { label: 'Herrscher',   href: '/de/sasanian/rulers' },
      { label: 'Münzstätten', href: '/de/sasanian/mints' },
      { label: 'Münzindex',   href: '/de/sasanian/coin-index' },
    ]},
    { label: 'Partherreich',              isComingSoon: true },
    { label: 'Achämenidisches Persien',   isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Hellenistisch & Antik', href: undefined },
    { label: 'Seleukidenreich',           isComingSoon: true },
    { label: 'Ptolemäisches Königreich',  isComingSoon: true },
    { label: 'Nabatäisches Königreich',   isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Rom in der arabischen Welt', href: undefined },
    { label: 'Römische Ostprovinzen',     isComingSoon: true },
    { label: 'Römisches Ägypten',         isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Byzantinisch & Kreuzfahrer', href: undefined },
    { label: 'Byzantinisches Reich',      isComingSoon: true },
    { label: 'Kreuzfahrerstaaten',        isComingSoon: true },
    { isDivider: true, label: '' },
    { label: 'Phönizier & antike Levante', href: undefined },
    { label: 'Phönizische Städte',         isComingSoon: true },
    { label: 'Antikes Arabien',            isComingSoon: true },
    { label: 'Himyaritisches Königreich',  isComingSoon: true },
  ]},
  { label: 'Tools', isTools: true, children: [
    { label: 'Münzstättenverzeichnis',     isComingSoon: true },
    { label: 'Herrscherindex',             isComingSoon: true },
    { label: 'Hijri-Gregorianisch',        isComingSoon: true },
    { label: 'Arabischer Schriftführer',   isComingSoon: true },
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
  const TOP_NAV_ITEMS: NavTopItem[] = locale === 'ar' ? TOP_NAV_ITEMS_AR : locale === 'de' ? TOP_NAV_ITEMS_DE : TOP_NAV_ITEMS_EN;

  const { user, isAdmin, setAuthOpen, setDashOpen, setAdminOpen } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const pathname = usePathname();

  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [activeMenu,    setActiveMenu]    = useState<string | null>(null);
  const [activeMobSub,  setActiveMobSub]  = useState<string | null>(null);
  const [toolsOpen,     setToolsOpen]     = useState(false);
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
        className={`bg-[#FAF6EE] sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}
        style={{ borderBottom: '1px solid rgba(184,134,11,0.25)' }}
      >
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center h-[48px] gap-4">

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
                    className={`flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium rounded transition-colors whitespace-nowrap
                      ${ item.isTools
                          ? 'bg-amber-800 hover:bg-amber-700 text-amber-50 rounded-full px-3'
                          : 'text-amber-800 hover:text-amber-950 hover:bg-amber-50' }
                      ${activeMenu === item.label ? item.isTools ? 'bg-amber-700' : 'bg-amber-100 text-amber-950' : ''}`}
                    onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}
                    onMouseEnter={() => setActiveMenu(item.label)}
                  >
                    {item.isTools && <Wrench size={12} className="shrink-0" />}
                    {item.label}
                    <ChevronDown size={12} className={`transition-transform ${activeMenu === item.label ? 'rotate-180' : ''}`} />
                  </button>

                  {activeMenu === item.label && item.children && (
                    <div
                      className="absolute top-full end-0 mt-1 bg-white border border-amber-200 rounded-lg shadow-lg min-w-[220px] py-1 z-50 animate-fade-in"
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                      {item.children.map((child) => {
                        if (child.isHijriTool) {
                          return (
                            <button key={child.label} onClick={() => { setToolDefault('hijriConverter'); setToolsOpen(true); setActiveMenu(null); }}
                              className="w-full text-start block px-4 py-2.5 text-[12px] transition-colors border-b border-amber-100 last:border-0 text-amber-800 hover:text-amber-950 hover:bg-amber-50 font-medium">
                              {child.label}
                            </button>
                          );
                        }
                        if (child.isToolsSidebar) {
                          return (
                            <button key={child.label} onClick={() => { setToolDefault(undefined); setToolsOpen(true); setActiveMenu(null); }}
                              className="w-full text-start block px-4 py-2.5 text-[12px] transition-colors border-b border-amber-100 last:border-0 text-amber-700 hover:text-amber-950 hover:bg-amber-50">
                              {child.label}
                            </button>
                          );
                        }
                        if (child.isDivider) {
                          return <hr key={`div-${child.label || Math.random()}`} className="my-1 border-amber-100" />;
                        }
                        if (child.isComingSoon) {
                          return (
                            <span key={child.label}
                              className="text-[12px] text-amber-300 cursor-not-allowed flex items-center justify-between px-4 py-2.5 select-none border-b border-amber-100 last:border-0">
                              {child.label}
                              <span className="text-[10px] bg-amber-100 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">Soon</span>
                            </span>
                          );
                        }
                        if (child.isInPrep) {
                          return (
                            <span key={child.label}
                              className="text-[12px] text-gray-400 cursor-default flex items-center justify-between px-4 py-2.5 select-none border-b border-amber-100 last:border-0">
                              {child.label}
                              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                                {isAr ? 'في الإعداد' : 'In preparation'}
                              </span>
                            </span>
                          );
                        }
                        if (!child.href) {
                          return (
                            <span key={child.label}
                              className="block px-4 py-2.5 text-[12px] border-b border-amber-100 last:border-0 text-amber-300 cursor-default select-none">
                              {child.label}
                            </span>
                          );
                        }
                        if (child.grandchildren?.length) {
                          const isExternal = child.href.startsWith('http');
                          return (
                            <div key={child.label} className="relative group/sub border-b border-amber-100 last:border-0">
                              <div className="flex items-center justify-between px-4 py-2.5 text-[12px] text-amber-700 hover:text-amber-950 hover:bg-amber-50 cursor-pointer">
                                <a href={child.href} {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                  className="flex-1">
                                  {child.label}
                                </a>
                                <ChevronRight size={11} className="text-amber-400 shrink-0" />
                              </div>
                              <div className={`hidden group-hover/sub:block absolute top-0 ${isAr ? 'end-full' : 'start-full'} min-w-[160px] bg-white border border-amber-200 rounded-lg shadow-lg py-1 z-[60]`}>
                                {child.grandchildren.map(gc => (
                                  <a key={gc.label} href={gc.href}
                                    className="block px-4 py-2 text-[12px] text-amber-700 hover:text-amber-950 hover:bg-amber-50 border-b border-amber-100 last:border-0">
                                    {gc.label}
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        const isExternal = child.href.startsWith('http');
                        return (
                          <a key={child.label} href={child.href}
                            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="block px-4 py-2.5 text-[12px] transition-colors border-b border-amber-100 last:border-0 text-amber-700 hover:text-amber-950 hover:bg-amber-50">
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
                className="hidden md:flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full border border-amber-400/60 text-amber-700 hover:text-amber-950 hover:border-amber-600 transition-colors"
                title={isAr ? 'تحديد العملة بالصورة' : 'Identify coin by image'}>
                <Search size={11} />
                {isAr ? 'تحديد بالصورة' : 'Identify'}
              </button>

              {/* Dark mode toggle */}
              <button onClick={toggleDarkMode}
                className="hidden md:flex items-center justify-center w-7 h-7 rounded-full border border-amber-300 text-amber-700 hover:border-amber-500 hover:text-amber-950 transition-colors"
                title={darkMode ? (isAr ? 'الوضع الفاتح' : 'Light mode') : (isAr ? 'الوضع الداكن' : 'Dark mode')}>
                {darkMode ? <Sun size={13} /> : <Moon size={13} />}
              </button>

              {/* Admin Panel — only shown to the admin user */}
              {isAdmin && (
                <button
                  onClick={() => setAdminOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full border border-amber-300 text-amber-700/80 hover:border-amber-500 hover:text-amber-950 transition-colors"
                  title={isAr ? 'لوحة الإدارة' : 'Admin Panel'}
                >
                  <Settings size={12} />
                  <span className="hidden lg:block">{isAr ? 'الإدارة' : 'Admin'}</span>
                </button>
              )}

              {/* Auth button */}
              {user ? (
                <button onClick={() => setDashOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200 transition-colors">
                  <User size={11} />
                  <span className="max-w-[80px] truncate">{user.email.split('@')[0]}</span>
                </button>
              ) : (
                <button onClick={() => setAuthOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full border border-amber-300 text-amber-700/80 hover:border-amber-500 hover:text-amber-950 transition-colors">
                  {isAr ? 'دخول / تسجيل' : 'Sign in'}
                </button>
              )}

              {/* Mobile toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden flex items-center justify-center w-8 h-8 rounded-full text-amber-800 hover:bg-amber-100 transition-colors">
                {mobileOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE MENU ─────────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="xl:hidden bg-[#FAF6EE] border-t border-amber-200 max-h-[80vh] overflow-y-auto animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
            {TOP_NAV_ITEMS.map((item) => (
              <div key={item.label}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3 text-[13px] text-amber-800 hover:text-amber-950 border-b border-amber-200/60"
                  onClick={() => { setActiveMenu(activeMenu === item.label ? null : item.label); setActiveMobSub(null); }}>
                  <span>{item.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${activeMenu === item.label ? 'rotate-180' : ''}`} />
                </button>
                {activeMenu === item.label && item.children && (
                  <div className="bg-amber-50">
                    {item.children.map((child) => {
                      if (child.isHijriTool) {
                        return (
                          <button key={child.label}
                            onClick={() => { setToolDefault('hijriConverter'); setToolsOpen(true); setMobileOpen(false); setActiveMenu(null); }}
                            className="w-full text-start block px-8 py-2.5 text-[12px] text-amber-800 font-medium hover:text-amber-950 border-b border-amber-100 last:border-0">
                            {child.label}
                          </button>
                        );
                      }
                      if (child.isToolsSidebar) {
                        return (
                          <button key={child.label}
                            onClick={() => { setToolDefault(undefined); setToolsOpen(true); setMobileOpen(false); setActiveMenu(null); }}
                            className="w-full text-start block px-8 py-2.5 text-[12px] text-amber-700 hover:text-amber-950 border-b border-amber-100 last:border-0">
                            {child.label}
                          </button>
                        );
                      }
                      if (child.isDivider) {
                        return <hr key={`mob-div-${child.label}`} className="my-1 border-amber-200" />;
                      }
                      if (child.isComingSoon) {
                        return (
                          <span key={child.label}
                            className="flex items-center justify-between px-8 py-2.5 text-[12px] text-amber-300 border-b border-amber-100 last:border-0 cursor-not-allowed select-none">
                            {child.label}
                            <span className="text-[10px] bg-amber-100 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">Soon</span>
                          </span>
                        );
                      }
                      if (child.isInPrep) {
                        return (
                          <span key={child.label}
                            className="flex items-center justify-between px-8 py-2.5 text-[12px] text-gray-400 border-b border-amber-100 last:border-0 cursor-default select-none">
                            {child.label}
                            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                              {isAr ? 'في الإعداد' : 'In preparation'}
                            </span>
                          </span>
                        );
                      }
                      if (!child.href) {
                        return (
                          <span key={child.label}
                            className="block px-8 py-2.5 text-[12px] text-amber-300 border-b border-amber-100 last:border-0 cursor-default">
                            {child.label}
                          </span>
                        );
                      }
                      if (child.grandchildren?.length) {
                        const subKey = `${item.label}:${child.label}`;
                        const subOpen = activeMobSub === subKey;
                        return (
                          <div key={child.label}>
                            <div className="flex items-center border-b border-amber-100 last:border-0">
                              <Link href={child.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex-1 px-8 py-2.5 text-[12px] text-amber-700 hover:text-amber-950">
                                {child.label}
                              </Link>
                              <button onClick={() => setActiveMobSub(subOpen ? null : subKey)}
                                className="px-3 py-2.5 text-amber-400 hover:text-amber-700">
                                <ChevronDown size={12} className={`transition-transform ${subOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                            {subOpen && (
                              <div className="bg-amber-100/60">
                                {child.grandchildren.map(gc => (
                                  <Link key={gc.label} href={gc.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-12 py-2 text-[12px] text-amber-600 hover:text-amber-950 border-b border-amber-100 last:border-0">
                                    {gc.label}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      const isExternal = child.href.startsWith('http');
                      return isExternal ? (
                        <a key={child.label} href={child.href}
                          target="_blank" rel="noopener noreferrer"
                          className="block px-8 py-2.5 text-[12px] text-amber-700 hover:text-amber-950 border-b border-amber-100 last:border-0">
                          {child.label}
                        </a>
                      ) : (
                        <Link key={child.label} href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-8 py-2.5 text-[12px] text-amber-700 hover:text-amber-950 border-b border-amber-100 last:border-0">
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="px-4 py-4 flex gap-3 border-t border-amber-200 flex-wrap">
              <button onClick={() => { setIdentifyOpen(true); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-amber-400 text-amber-700 text-center">
                {isAr ? 'تحديد بالصورة' : 'Identify'}
              </button>
              <button onClick={() => { toggleDarkMode(); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-amber-300 text-amber-700 text-center flex items-center justify-center gap-1">
                {darkMode ? <Sun size={12} /> : <Moon size={12} />} {darkMode ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}
              </button>
              <button onClick={() => { setAdminOpen(true); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-amber-300 text-amber-700 text-center flex items-center justify-center gap-1">
                <Settings size={12} /> {isAr ? 'الإدارة' : 'Admin'}
              </button>
              {user ? (
                <button onClick={() => { setDashOpen(true); setMobileOpen(false); }}
                  className="flex-1 py-2 text-[12px] rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-center">
                  {user.email.split('@')[0]}
                </button>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                  className="flex-1 py-2 text-[12px] rounded-full border border-amber-300 text-amber-700 text-center">
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
