'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Menu, X, ShoppingBag, Moon, Sun, Globe, ChevronDown, Wrench, BookOpen } from "lucide-react";
import { FacebookIcon, TwitterIcon, LinkedinIcon, YoutubeIcon, InstagramIcon, RssIcon } from "./SocialIcons";
import ToolsSidebar from '@/components/sidebar/ToolsSidebar';
import IdentifyModal from '@/components/modals/IdentifyModal';

const WP = 'https://arabismatica.arabcollector.com';

const BREAKING_NEWS = [
  { text: 'بيتهوفن على الطوابع البريدية: الاستمرارية والتحديث البصري (1971 — 2016)', href: `${WP}/beethoven-postage-stamps-global-peak-1970/` },
  { text: 'ضرب بالقاهرة: توثيق تاريخ المحروسة عبر المسكوكات', href: `${WP}/ضرب-بالقاهرة-توثيق-تاريخ-المحروسة-عبر/` },
  { text: 'علم المسكوكات للمبتدئين: ابدأ بجمع العملات بثقة', href: `${WP}/ما-هو-علم-المسكوكات/` },
];

const TOP_NAV_ITEMS = [
  { label: 'المقتني العربي', children: [
    { label: 'عن المقتني العربي', href: `${WP}/about-us/` },
    { label: 'فريق العمل', href: `${WP}/team-member/` },
    { label: 'شركاؤنا', href: `${WP}/our-partners/` },
    { label: 'لجنة الخبراء', href: `${WP}/advisory-board/` },
    { label: 'دليل الأعمال', href: `${WP}/business-directory/` },
    { label: 'النشرة الإخبارية', href: `${WP}/newsletter/` },
    { label: 'تواصل معنا', href: `${WP}/contact-us/` },
  ]},
  { label: 'الإصدارات', children: [
    { label: 'مجلة المقتني العربي', href: `${WP}/the-arab-collector-magazine/` },
    { label: 'دليل العملات المعدنية المصرية', href: `${WP}/egyptian-coins-guide/` },
    { label: 'الموسوعة المصرية للبنكنوت', href: `${WP}/encyclopedia-of-egyptian-banknotes/` },
    { label: 'تقرير البريفيكس', href: `${WP}/the-prefix-report/` },
    { label: 'الإصدارات الخاصة', href: `${WP}/product-category/special-publications/` },
  ]},
  { label: 'مقالات وأخبار', children: [
    { label: 'العملات المعدنية', href: `${WP}/numismatics/` },
    { label: 'طوابع البريد', href: `${WP}/philately/` },
    { label: 'الورق النقدي', href: `${WP}/paper-money/` },
    { label: 'المزادات', href: `${WP}/auctions/` },
    { label: 'الفعاليات والمعارض', href: `${WP}/events-exhibitions/` },
  ]},
  { label: 'مركز الأدوات والمعرفة', highlight: true, children: [
    { label: 'أدوات التقييم', href: `${WP}/grading-tools/`, highlight: true },
    { label: 'بوابة المعرفة', href: `${WP}/knowledge-portal/`, highlight: true },
    { label: 'مختبر المقتني الصغير', href: `${WP}/young-collector-lab/` },
    { label: 'أكاديمية المقتني العربي', href: `${WP}/ac-academy/` },
    { label: 'المكتبة الإلكترونية', href: 'https://library.arabcollector.com/' },
    { label: 'مكتبة المرئيات', href: `${WP}/video/` },
  ]},
  { label: 'المتجر', children: [
    { label: 'متجر كتب المقتنيات', href: `${WP}/collectibles-books/` },
  ]},
  { label: 'المحررون والمؤلفون', children: [
    { label: 'إرشادات النشر في المجلة', href: `${WP}/submission-guidelines/` },
    { label: 'النشر على الموقع', href: `${WP}/submit-post/` },
    { label: 'لوحة تحكم المؤلف', href: `${WP}/author-dashboard/` },
  ]},
];

const SOCIALS = [
  { icon: FacebookIcon, href: `${WP}/facebook`, label: 'فيسبوك' },
  { icon: TwitterIcon, href: 'https://x.com/ArabCollector', label: 'X' },
  { icon: LinkedinIcon, href: 'https://au.linkedin.com/company/the-arab-collector', label: 'لينكدإن' },
  { icon: YoutubeIcon, href: 'https://www.youtube.com/@thearabcollector5252', label: 'يوتيوب' },
  { icon: InstagramIcon, href: 'https://www.instagram.com/thearabcollector/', label: 'انستقرام' },
  { icon: RssIcon, href: `${WP}/feed/`, label: 'RSS' },
];

function getArabicDate(): string {
  const d = new Date();
  return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations();
  const isAr = locale === 'ar';

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [identifyOpen, setIdentifyOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tickerIdx, setTickerIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % BREAKING_NEWS.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* ── TOP BAR ── */}
      <div className="bg-ink text-xs border-b border-gold-700/30">
        <div className="max-w-[1440px] mx-auto px-4 h-9 flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex items-center gap-1 border border-gold-700/40 rounded px-2 py-0.5">
            <Globe size={12} className="text-gold-400" />
            <Link href="/ar" className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${isAr ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>
              ع
            </Link>
            <span className="text-gold-700">|</span>
            <Link href="/en" className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${!isAr ? 'bg-gold-500 text-ink font-semibold' : 'text-gold-300 hover:text-gold-100'}`}>
              EN
            </Link>
          </div>

          {/* Date */}
          <span className="text-gold-500/70 text-[11px] hidden sm:block">
            {getArabicDate()}
          </span>

          {/* Breaking news ticker */}
          <div className="flex-1 overflow-hidden flex items-center gap-2 min-w-0">
            <span className="bg-gold-500 text-ink text-[10px] font-bold px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
              <span className="animate-pulse">⚡</span>
              أخبار عاجلة
            </span>
            <a
              href={BREAKING_NEWS[tickerIdx].href}
              className="text-gold-300 hover:text-gold-100 text-[11px] truncate transition-all duration-500"
              target="_blank" rel="noopener noreferrer"
            >
              {BREAKING_NEWS[tickerIdx].text}
            </a>
          </div>

          {/* Social icons */}
          <div className="hidden lg:flex items-center gap-2">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                className="text-gold-600 hover:text-gold-300 transition-colors">
                <Icon size={12} />
              </a>
            ))}
          </div>

          {/* Back to site */}
          <a href={WP} className="hidden md:flex items-center gap-1 text-gold-500 hover:text-gold-300 text-[11px] transition-colors shrink-0" target="_blank" rel="noopener">
            ← {t('nav.backToSite')}
          </a>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <header className={`bg-ink sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : ''}`}
        style={{ borderBottom: '2px solid #8B6D2E' }}>
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center h-[64px] gap-4">

            {/* Logo */}
            <Link href={`/${locale}`} className="shrink-0">
              <Image
                src="https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2025/04/New-Logo-Arab-Collector-white.png"
                alt="The Arab Collector"
                width={200} height={70}
                className="h-[46px] w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav ref={menuRef} className="hidden xl:flex items-center flex-1 gap-0.5 mx-2">
              {TOP_NAV_ITEMS.map((item) => (
                <div key={item.label} className="relative group">
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium rounded transition-colors whitespace-nowrap
                      ${item.highlight ? 'text-gold-300 hover:text-gold-100' : 'text-white/80 hover:text-white hover:bg-white/5'}
                      ${activeMenu === item.label ? 'bg-white/10' : ''}`}
                    onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}
                    onMouseEnter={() => setActiveMenu(item.label)}
                  >
                    {item.label}
                    <ChevronDown size={12} className={`transition-transform ${activeMenu === item.label ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {activeMenu === item.label && item.children && (
                    <div
                      className="absolute top-full right-0 mt-1 bg-ink border border-gold-800/50 rounded-lg shadow-2xl min-w-[200px] py-1 z-50 animate-fade-in"
                      onMouseLeave={() => setActiveMenu(null)}
                    >
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          target="_blank" rel="noopener noreferrer"
                          className={`block px-4 py-2.5 text-[12px] transition-colors border-b border-gold-900/30 last:border-0
                            ${(child as { highlight?: boolean }).highlight
                              ? 'text-gold-300 hover:text-gold-100 hover:bg-gold-900/30 font-medium'
                              : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                        >
                          {(child as { highlight?: boolean }).highlight && <span className="mr-1 text-gold-500">★</span>}
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Prominent links */}
              <a href={`${WP}/knowledge-portal/`} target="_blank" rel="noopener"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-ink bg-gold-500 hover:bg-gold-400 transition-colors ml-1 shrink-0">
                <BookOpen size={12} />
                بوابة المعرفة
              </a>
              <a href={`${WP}/grading-tools/`} target="_blank" rel="noopener"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-gold-500 text-gold-300 hover:bg-gold-900/40 transition-colors shrink-0">
                أدوات التقييم
              </a>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 mr-auto xl:mr-0">
              {/* Dark mode toggle */}
              <button onClick={() => setDark(!dark)}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full text-gold-500 hover:text-gold-300 hover:bg-white/10 transition-colors"
                title={dark ? 'الوضع الفاتح' : 'الوضع المظلم'}>
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Shop */}
              <a href={`${WP}/cart/`} target="_blank" rel="noopener"
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full text-gold-500 hover:text-gold-300 hover:bg-white/10 transition-colors">
                <ShoppingBag size={15} />
              </a>

              {/* AI Identify button */}
              <button
                onClick={() => setIdentifyOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-full border border-gold-700 text-gold-300 hover:bg-gold-900/40 transition-colors"
                title="تحديد العملة بالصورة">
                <span>🔍</span>
                تحديد بالصورة
              </button>

              {/* Professional Tools */}
              <button
                onClick={() => setToolsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gold-700 hover:bg-gold-600 text-gold-100 transition-colors"
                title={t('tools.open')}>
                <Wrench size={13} />
                <span className="hidden sm:block">الأدوات</span>
              </button>

              {/* Mobile menu */}
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden flex items-center justify-center w-9 h-9 rounded-full text-white hover:bg-white/10 transition-colors">
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        {mobileOpen && (
          <div className="xl:hidden bg-ink border-t border-gold-800/50 max-h-[80vh] overflow-y-auto animate-fade-in">
            {/* Priority links first */}
            <div className="px-4 py-3 border-b border-gold-800/30 flex gap-2 flex-wrap">
              <a href={`${WP}/knowledge-portal/`} target="_blank" rel="noopener"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold text-ink bg-gold-500">
                <BookOpen size={12} /> بوابة المعرفة
              </a>
              <a href={`${WP}/grading-tools/`} target="_blank" rel="noopener"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] border border-gold-500 text-gold-300">
                أدوات التقييم
              </a>
            </div>

            {/* Nav items */}
            {TOP_NAV_ITEMS.map((item) => (
              <div key={item.label}>
                <button
                  className="w-full flex items-center justify-between px-5 py-3 text-[13px] text-white/80 border-b border-gold-900/20"
                  onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}>
                  <span>{item.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${activeMenu === item.label ? 'rotate-180' : ''}`} />
                </button>
                {activeMenu === item.label && item.children && (
                  <div className="bg-ink/80">
                    {item.children.map((child) => (
                      <a key={child.label} href={child.href} target="_blank" rel="noopener noreferrer"
                        className="block px-8 py-2.5 text-[12px] text-white/60 hover:text-white border-b border-gold-900/10 last:border-0">
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="px-4 py-4 flex gap-3 border-t border-gold-800/30">
              <button onClick={() => { setIdentifyOpen(true); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full border border-gold-700 text-gold-300 text-center">
                تحديد بالصورة
              </button>
              <button onClick={() => { setToolsOpen(true); setMobileOpen(false); }}
                className="flex-1 py-2 text-[12px] rounded-full bg-gold-700 text-gold-100 font-semibold text-center">
                الأدوات المهنية
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Sidebars & Modals */}
      <ToolsSidebar open={toolsOpen} onClose={() => setToolsOpen(false)} locale={locale} />
      <IdentifyModal open={identifyOpen} onClose={() => setIdentifyOpen(false)} locale={locale} />
    </>
  );
}
