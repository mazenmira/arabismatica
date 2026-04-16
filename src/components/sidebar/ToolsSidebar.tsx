'use client';

import { useState, useEffect } from 'react';
import { X, BookOpen, Search, TrendingUp, ExternalLink, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { hijriToGregorian, gregorianToHijri, HIJRI_MONTHS_AR } from '@/lib/hijri';

const WP = 'https://arabcollector.com';

interface Tool {
  key: string;
  icon: string;
  href?: string;
  component?: string;
  isNew?: boolean;
}

const TOOLS: Record<string, Tool[]> = {
  encyclopedias: [
    { key: 'glossary',    icon: '📖', href: `${WP}/knowledge-portal/` },
    { key: 'islamicEnc',  icon: '🌙', href: `${WP}/numismatics/islamic-coins/` },
    { key: 'errorsEnc',   icon: '🔬', href: `${WP}/knowledge-portal/` },
  ],
  analysis: [
    { key: 'hijriConverter', icon: '📅', component: 'hijri', isNew: true },
    { key: 'coinParts',      icon: '🪙', href: `${WP}/knowledge-portal/` },
    { key: 'coinInspection', icon: '🔍', href: `${WP}/knowledge-portal/` },
    { key: 'gradingGuide',   icon: '⭐', href: `${WP}/grading-tools/` },
    { key: 'gradingSites',   icon: '🏛️', href: `${WP}/grading-tools/` },
  ],
  value: [
    { key: 'metalCalc',   icon: '⚖️', href: `${WP}/knowledge-portal/` },
    { key: 'arabPrices',  icon: '💰', href: `${WP}/knowledge-portal/` },
    { key: 'sellGuide',   icon: '🏷️', href: `${WP}/10-نصائح-لبيع-العملات-المعدنية-القديمة/` },
  ],
};

type TabId = 'encyclopedias' | 'analysis' | 'value';

function HijriConverter({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const [mode, setMode] = useState<'hijriToGreg' | 'gregToHijri'>('hijriToGreg');
  const [hijriYear, setHijriYear] = useState(1300);
  const [hijriMonth, setHijriMonth] = useState(1);
  const [gregYear, setGregYear] = useState(1882);
  const [gregMonth, setGregMonth] = useState(1);

  const gregResult = hijriToGregorian(hijriYear, hijriMonth);
  const hijriResult = gregorianToHijri(gregYear, gregMonth, 15);

  return (
    <div className="bg-parch-dark/60 rounded-xl p-4 border border-gold-700/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📅</span>
        <h3 className="font-semibold text-[13px] text-ink">
          {isAr ? 'محول التاريخ الهجري للعملات' : 'Hijri Date Converter'}
        </h3>
      </div>
      <p className="text-[11px] text-gold-700 mb-3 leading-relaxed">
        {isAr
          ? 'حوّل التاريخ الهجري المكتوب على العملات إلى التاريخ الميلادي بدقة'
          : 'Convert Islamic calendar dates found on coins to Gregorian'}
      </p>

      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gold-700/40 mb-3 text-[11px]">
        <button
          className={`flex-1 py-1.5 transition-colors font-medium ${mode === 'hijriToGreg' ? 'bg-gold-500 text-ink' : 'bg-parch text-ink/60 hover:bg-parch-dark'}`}
          onClick={() => setMode('hijriToGreg')}>
          {isAr ? 'هجري ← ميلادي' : 'Hijri → Gregorian'}
        </button>
        <button
          className={`flex-1 py-1.5 transition-colors font-medium ${mode === 'gregToHijri' ? 'bg-gold-500 text-ink' : 'bg-parch text-ink/60 hover:bg-parch-dark'}`}
          onClick={() => setMode('gregToHijri')}>
          {isAr ? 'ميلادي ← هجري' : 'Gregorian → Hijri'}
        </button>
      </div>

      {mode === 'hijriToGreg' ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-ink/50 mb-1">{isAr ? 'السنة الهجرية' : 'Hijri Year'}</label>
              <input
                type="number" min={1} max={1500}
                value={hijriYear}
                onChange={e => setHijriYear(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-[12px] border border-gold-700/40 rounded-lg bg-parch focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-ink/50 mb-1">{isAr ? 'الشهر' : 'Month'}</label>
              <select
                value={hijriMonth}
                onChange={e => setHijriMonth(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-[12px] border border-gold-700/40 rounded-lg bg-parch focus:outline-none">
                {HIJRI_MONTHS_AR.map((m, i) => (
                  <option key={i} value={i + 1}>{isAr ? m : m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-gold-500/15 border border-gold-500/40 rounded-lg px-3 py-2 text-center">
            <div className="text-[10px] text-ink/50 mb-0.5">{isAr ? 'التاريخ الميلادي' : 'Gregorian Date'}</div>
            <div className="text-[15px] font-bold text-ink font-amiri">
              {gregResult.day} / {gregResult.month} / {gregResult.year}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-ink/50 mb-1">{isAr ? 'السنة الميلادية' : 'Gregorian Year'}</label>
              <input
                type="number" min={600} max={2026}
                value={gregYear}
                onChange={e => setGregYear(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-[12px] border border-gold-700/40 rounded-lg bg-parch focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-ink/50 mb-1">{isAr ? 'الشهر' : 'Month'}</label>
              <select
                value={gregMonth}
                onChange={e => setGregMonth(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-[12px] border border-gold-700/40 rounded-lg bg-parch focus:outline-none">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-gold-500/15 border border-gold-500/40 rounded-lg px-3 py-2 text-center">
            <div className="text-[10px] text-ink/50 mb-0.5">{isAr ? 'التاريخ الهجري' : 'Hijri Date'}</div>
            <div className="text-[15px] font-bold text-ink font-amiri">
              {hijriResult.day} {HIJRI_MONTHS_AR[hijriResult.month - 1]} {hijriResult.year} هـ
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ToolsSidebar({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: string }) {
  const t = useTranslations('tools');
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<TabId>('encyclopedias');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'encyclopedias', label: t('tab_encyclopedias'), icon: <BookOpen size={14} /> },
    { id: 'analysis',      label: t('tab_analysis'),      icon: <Search size={14} /> },
    { id: 'value',         label: t('tab_value'),          icon: <TrendingUp size={14} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-ink/70 z-[90] backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 z-[100] h-full w-full max-w-[420px] bg-parch shadow-2xl flex flex-col
          transition-transform duration-300 ease-out
          ${isAr ? 'right-0' : 'left-0'}
          ${open ? 'translate-x-0' : (isAr ? 'translate-x-full' : '-translate-x-full')}`}
        style={{ borderLeft: isAr ? 'none' : '2px solid #8B6D2E', borderRight: isAr ? '2px solid #8B6D2E' : 'none' }}
      >
        {/* Header */}
        <div className="bg-ink px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '2px solid #8B6D2E' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gold-radial flex items-center justify-center text-ink font-bold text-sm font-amiri">
              ع
            </div>
            <div>
              <div className="text-gold-300 font-semibold text-[14px]">{t('title')}</div>
              <div className="text-gold-600 text-[10px]">The Arab Collector</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full border border-gold-700/50 text-gold-400 hover:text-gold-200 hover:border-gold-500 flex items-center justify-center transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-ink/5 border-b border-gold-700/20 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors border-b-2
                ${activeTab === tab.id
                  ? 'border-gold-500 text-gold-600 bg-gold-500/10'
                  : 'border-transparent text-ink/50 hover:text-ink/80 hover:bg-ink/5'}`}>
              {tab.icon}
              <span className="leading-tight text-center">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tools list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {TOOLS[activeTab].map((tool) => (
            <div key={tool.key}>
              {tool.component === 'hijri' ? (
                <div>
                  <button
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gold-500/10 border border-gold-500/30 hover:border-gold-500/60 transition-all"
                    onClick={() => setExpandedTool(expandedTool === tool.key ? null : tool.key)}>
                    <span className="text-xl">{tool.icon}</span>
                    <div className="flex-1 text-right">
                      <div className="text-[13px] font-medium text-ink flex items-center gap-1">
                        {t(tool.key as keyof ReturnType<typeof useTranslations<'tools'>>)}
                        {tool.isNew && (
                          <span className="bg-gold-500 text-ink text-[9px] px-1.5 py-0.5 rounded font-bold">جديد</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className={`text-gold-500 transition-transform ${expandedTool === tool.key ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedTool === tool.key && (
                    <div className="mt-2 animate-fade-up">
                      <HijriConverter locale={locale} />
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={tool.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-parch-dark/50 border border-gold-700/20 hover:border-gold-500/50 hover:bg-gold-500/8 transition-all group">
                  <span className="text-xl">{tool.icon}</span>
                  <div className="flex-1 text-right">
                    <div className="text-[13px] font-medium text-ink group-hover:text-gold-700">
                      {t(tool.key as keyof ReturnType<typeof useTranslations<'tools'>>)}
                    </div>
                  </div>
                  <ExternalLink size={12} className="text-gold-600/50 group-hover:text-gold-500 shrink-0" />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-4 border-t border-gold-700/20 bg-ink/5 shrink-0">
          <a href={`${WP}/knowledge-portal/`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-gold-500 hover:bg-gold-400 text-ink font-semibold text-[13px] transition-colors">
            <BookOpen size={14} />
            فتح بوابة المعرفة الكاملة
          </a>
          <a href={`${WP}/grading-tools/`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-full border border-gold-700 text-gold-600 hover:text-gold-500 text-[12px] mt-2 transition-colors">
            أدوات التقييم والفحص
          </a>
        </div>
      </aside>
    </>
  );
}
