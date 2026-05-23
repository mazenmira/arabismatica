'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { X, Upload, Camera, AlertCircle, ExternalLink, ChevronRight, RotateCcw, Search } from 'lucide-react';
import Link from 'next/link';
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';

const ALL_COINS = COINS_RAW as unknown as Coin[];

const METAL_AR: Record<string, string> = {
  'Gold': 'ذهب', 'Silver': 'فضة', 'Copper': 'نحاس', 'Bronze': 'برونز',
  'Nickel': 'نيكل', 'Cupro-Nickel': 'نحاس-نيكل', 'Copper-nickel': 'نحاس-نيكل',
  'Aluminium': 'ألمنيوم', 'Bimetallic': 'ثنائي المعدن', 'Billon': 'بليون',
  'Brass': 'نحاس أصفر', 'Steel': 'فولاذ', 'Zinc': 'زنك', 'Other': 'أخرى',
};

const COUNTRY_FLAGS: Record<string, string> = {
  EG:'🇪🇬',MA:'🇲🇦',TN:'🇹🇳',SA:'🇸🇦',IQ:'🇮🇶',AE:'🇦🇪',OM:'🇴🇲',
  LY:'🇱🇾',DZ:'🇩🇿',SY:'🇸🇾',JO:'🇯🇴',LB:'🇱🇧',KW:'🇰🇼',QA:'🇶🇦',
  SD:'🇸🇩',YE:'🇾🇪',MR:'🇲🇷',PS:'🇵🇸',QD:'🇶🇦',
};

interface Filters {
  cc: string; metal: string; yearFrom: string; yearTo: string;
  diameter: string; text: string;
}
interface ScoredCoin extends Coin { score: number; }

function scoreCoin(coin: Coin, f: Filters): number {
  let s = 0;
  if (f.cc    && coin.cc    === f.cc)    s += 40;
  if (f.metal && coin.metal === f.metal) s += 30;
  const y = parseInt(coin.yce || '0');
  if (f.yearFrom || f.yearTo) {
    const from = parseInt(f.yearFrom || '0');
    const to   = parseInt(f.yearTo   || '9999');
    if (y >= from && y <= to)                            s += 20;
    else if (Math.abs(y-from)<=10 || Math.abs(y-to)<=10) s += 8;
  }
  if (f.diameter) {
    const d = coin.dia ?? 0;
    const b = parseInt(f.diameter);
    if (Math.abs(d-b) <= 2) s += 15;
    else if (Math.abs(d-b) <= 5) s += 6;
  }
  if (f.text.trim()) {
    const q = f.text.toLowerCase();
    if (coin.name?.toLowerCase().includes(q)) s += 25;
    if (coin.nar?.includes(q))                s += 25;
    if (coin.km?.toLowerCase().includes(q))   s += 15;
    if (coin.dyn?.includes(q))                s += 10;
  }
  if (coin.o?.startsWith('http')) s += 5;
  return s;
}

function getMatches(f: Filters): ScoredCoin[] {
  if (!f.cc && !f.metal && !f.yearFrom && !f.yearTo && !f.diameter && !f.text.trim()) return [];
  return ALL_COINS
    .map(c => ({ ...c, score: scoreCoin(c, f) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

const COUNTRIES = Array.from(
  new Map(ALL_COINS.map(c => [c.cc, { cc: c.cc, co: c.co, co_ar: c.co_ar }])).values()
).sort((a, b) => a.co.localeCompare(b.co));

const METALS = Array.from(new Set(ALL_COINS.map(c => c.metal).filter(Boolean))).sort();

const DIA_BUCKETS = [
  { label:'< 15 mm',  label_ar:'أقل من 15 مم', value:'12' },
  { label:'15–18 mm', label_ar:'15–18 مم',      value:'16' },
  { label:'19–22 mm', label_ar:'19–22 مم',      value:'20' },
  { label:'23–26 mm', label_ar:'23–26 مم',      value:'24' },
  { label:'27–30 mm', label_ar:'27–30 مم',      value:'28' },
  { label:'31–35 mm', label_ar:'31–35 مم',      value:'33' },
  { label:'> 35 mm',  label_ar:'أكبر من 35 مم', value:'40' },
];

function CoinResult({ coin, locale, uploadedPreview }: { coin: ScoredCoin; locale: string; uploadedPreview: string | null }) {
  const isAr  = locale === 'ar';
  const name  = isAr && coin.nar ? coin.nar : coin.name;
  const flag  = COUNTRY_FLAGS[coin.cc] ?? '';
  const metal = isAr ? (METAL_AR[coin.metal] ?? coin.metal) : coin.metal;
  const pct   = Math.min(100, Math.round((coin.score / 110) * 100));
  const col   = pct >= 60 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="bg-white rounded-xl border border-gold-700/15 overflow-hidden hover:border-gold-400 transition-all">
      <div className="h-1 bg-gray-100"><div className="h-full" style={{ width:`${pct}%`, background:col }} /></div>
      <div className="p-3 flex items-center gap-3">
        <div className="flex gap-1 shrink-0">
          {uploadedPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={uploadedPreview} alt="uploaded" className="w-10 h-10 rounded-full object-cover opacity-70" style={{ border:'1.5px dashed #8B6D2E' }} />
          )}
          {coin.o ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coin.o} alt={name} className="w-10 h-10 rounded-full object-cover" style={{ border:'1.5px solid #F0E8D4', outline:'1px solid #8B6D2E' }} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-base">🪙</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-amber-900 font-amiri leading-tight truncate">{name}</div>
          <div className="text-[10px] text-amber-600/70 truncate mt-0.5">
            {flag} {isAr ? coin.co_ar : coin.co}{coin.yce ? ` · ${coin.yce}` : ''}{coin.metal ? ` · ${metal}` : ''}
          </div>
          {coin.dyn && <div className="text-[9px] text-amber-500 truncate">{coin.dyn}</div>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] font-bold" style={{ color:col }}>{pct}%</span>
          <Link href={`/${locale}/catalogue/${coin.id}`}
            className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border border-gold-500/40 text-gold-600 hover:bg-gold-50">
            <ExternalLink size={8} />{isAr ? 'تفاصيل' : 'View'}
          </Link>
        </div>
      </div>
    </div>
  );
}

const EMPTY: Filters = { cc:'', metal:'', yearFrom:'', yearTo:'', diameter:'', text:'' };

export default function IdentifyModal({ open, onClose, locale }: { open:boolean; onClose:()=>void; locale:string }) {
  const isAr   = locale === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [filters,  setFilters]  = useState<Filters>(EMPTY);
  const [step,     setStep]     = useState<'upload'|'filter'|'results'>('upload');

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = ''; reset(); }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const reset = () => { setPreview(null); setFilters(EMPTY); setStep('upload'); };
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
    setStep('filter');
  }, []);
  const set = (k: keyof Filters, v: string) => setFilters(prev => ({ ...prev, [k]: v }));
  const matches = useMemo(() => getMatches(filters), [filters]);
  const hasFilter = !!(filters.cc || filters.metal || filters.yearFrom || filters.yearTo || filters.diameter || filters.text.trim());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3"
      style={{ background:'rgba(22,16,10,0.88)', backdropFilter:'blur(6px)' }}>
      <div className="bg-[#FAF6EE] rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[92vh] flex flex-col"
        style={{ border:'1px solid rgba(139,109,46,0.4)' }} dir={isAr ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold-700/20 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <h2 className="font-semibold text-[15px] text-amber-900 font-amiri">
                {isAr ? 'تحديد العملة' : 'Identify Coin'}
              </h2>
              <p className="text-[11px] text-amber-600">
                {isAr ? 'ارفع صورة ثم حدّد خصائص العملة — مجاني 100%' : 'Upload image + describe the coin — 100% free'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-gold-700/40 text-amber-600 hover:text-amber-400 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Upload step ── */}
          {step === 'upload' && (
            <div className="p-5 space-y-3">
              <div
                className={`border-2 border-dashed rounded-xl cursor-pointer min-h-[200px] flex flex-col items-center justify-center gap-3 transition-all
                  ${dragging ? 'border-amber-500 bg-amber-500/10' : 'border-amber-700/30 hover:border-amber-500/60 hover:bg-amber-500/5'}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f=e.dataTransfer.files[0]; if(f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Upload size={26} className="text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-amber-900">{isAr ? 'اسحب صورة العملة هنا' : 'Drag your coin image here'}</p>
                  <p className="text-[12px] text-amber-600/60 mt-1">{isAr ? 'أو انقر للاختيار من الجهاز' : 'or click to pick from device'}</p>
                </div>
                <div className="flex items-center gap-2 text-amber-600/50"><Camera size={14} /><span className="text-[11px]">JPG · PNG · WEBP</span></div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  {isAr ? 'الأداة مجانية — تبحث في 4,737 عملة. كلما أضفت خصائص أكثر كانت النتائج أدق.' : 'Free tool — searches 4,737 coins locally. More details = better results.'}
                </p>
              </div>
              <button onClick={() => setStep('filter')}
                className="w-full py-2 text-[12px] rounded-xl border border-amber-700/30 text-amber-600 hover:bg-amber-50 transition-colors">
                {isAr ? 'بحث بدون صورة ←' : '→ Search without image'}
              </button>
            </div>
          )}

          {/* ── Filter step ── */}
          {step === 'filter' && (
            <div className="p-5 space-y-4">
              {preview && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="coin" className="w-14 h-14 rounded-full object-cover shrink-0" style={{ border:'2px solid #F0E8D4', outline:'1.5px solid #8B6D2E' }} />
                  <p className="flex-1 text-[12px] text-amber-700">{isAr ? 'تم تحميل الصورة ✓ — أضف تفاصيل للبحث' : 'Image uploaded ✓ — add details to search'}</p>
                  <button onClick={() => { setPreview(null); setStep('upload'); }}><RotateCcw size={12} className="text-amber-400" /></button>
                </div>
              )}

              {/* Country */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1.5 uppercase tracking-wider">{isAr ? 'الدولة' : 'Country'}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {COUNTRIES.map(c => (
                    <button key={c.cc} onClick={() => set('cc', filters.cc===c.cc ? '' : c.cc)}
                      className={`text-[11px] px-2 py-1.5 rounded-lg border transition-all text-start
                        ${filters.cc===c.cc ? 'bg-amber-800 border-amber-700 text-amber-100' : 'bg-white border-amber-100 text-amber-800 hover:border-amber-300'}`}>
                      {COUNTRY_FLAGS[c.cc]} {isAr ? c.co_ar : c.co}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metal */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1.5 uppercase tracking-wider">{isAr ? 'المعدن (لون العملة)' : 'Metal (coin colour)'}</label>
                <div className="flex flex-wrap gap-1.5">
                  {METALS.map(m => (
                    <button key={m} onClick={() => set('metal', filters.metal===m ? '' : m)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all
                        ${filters.metal===m ? 'bg-amber-800 border-amber-700 text-amber-100' : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400'}`}>
                      {isAr ? (METAL_AR[m] ?? m) : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1.5 uppercase tracking-wider">{isAr ? 'السنة الميلادية (تقريبي)' : 'Year CE (approximate)'}</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder={isAr?'من':'From'} value={filters.yearFrom}
                    onChange={e=>set('yearFrom',e.target.value)} min="1300" max="2026"
                    className="w-[90px] text-[12px] px-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-500" />
                  <span className="text-amber-400">—</span>
                  <input type="number" placeholder={isAr?'إلى':'To'} value={filters.yearTo}
                    onChange={e=>set('yearTo',e.target.value)} min="1300" max="2026"
                    className="w-[90px] text-[12px] px-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-500" />
                </div>
              </div>

              {/* Diameter */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1.5 uppercase tracking-wider">{isAr ? 'حجم العملة (قطر تقريبي)' : 'Coin size (diameter)'}</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIA_BUCKETS.map(d => (
                    <button key={d.value} onClick={() => set('diameter', filters.diameter===d.value ? '' : d.value)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all
                        ${filters.diameter===d.value ? 'bg-amber-800 border-amber-700 text-amber-100' : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400'}`}>
                      {isAr ? d.label_ar : d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-800 mb-1.5 uppercase tracking-wider">{isAr ? 'نص مرئي على العملة' : 'Visible text on coin'}</label>
                <div className="relative">
                  <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-3 text-amber-400" />
                  <input value={filters.text} onChange={e=>set('text',e.target.value)}
                    placeholder={isAr ? 'مثال: قرش، ريال، KM#62...' : 'e.g. piastre, riyal, KM#62...'}
                    className="w-full text-[12px] ps-8 pe-3 py-2 rounded-lg border border-amber-200 bg-white outline-none focus:border-amber-500" />
                </div>
              </div>

              <button onClick={() => setStep('results')} disabled={!hasFilter}
                className="w-full py-3 rounded-xl font-semibold text-[14px] bg-amber-800 hover:bg-amber-700 text-amber-100 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                <Search size={15} />
                {isAr ? 'بحث في قاعدة البيانات' : 'Search the database'}
                {hasFilter && matches.length > 0 && (
                  <span className="bg-amber-600 text-[10px] px-1.5 py-0.5 rounded-full">{matches.length}</span>
                )}
              </button>
            </div>
          )}

          {/* ── Results step ── */}
          {step === 'results' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-semibold text-amber-900">
                  {matches.length > 0 ? (isAr ? `${matches.length} نتيجة` : `${matches.length} matches`) : (isAr ? 'لا توجد نتائج' : 'No matches')}
                </div>
                <button onClick={() => setStep('filter')} className="text-[11px] flex items-center gap-1 text-amber-600 hover:text-amber-800">
                  <ChevronRight size={12} className={isAr ? '' : 'rotate-180'} />
                  {isAr ? 'تعديل الفلاتر' : 'Adjust filters'}
                </button>
              </div>

              {preview && (
                <div className="flex items-center gap-2 text-[11px] text-amber-600/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="uploaded" className="w-6 h-6 rounded-full object-cover opacity-60" />
                  {isAr ? 'صورتك (يسار) ← صورة قاعدة البيانات (يمين)' : 'Your image (left) ← database image (right)'}
                </div>
              )}

              {matches.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-[13px] text-amber-700 font-amiri">{isAr ? 'لم يتم العثور على تطابق' : 'No matching coins found'}</p>
                  <p className="text-[11px] text-amber-600/60 mt-1">{isAr ? 'جرّب توسيع نطاق السنوات أو تغيير الفلاتر' : 'Try widening the year range or changing filters'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {matches.map(coin => <CoinResult key={coin.id} coin={coin} locale={locale} uploadedPreview={preview} />)}
                </div>
              )}

              <button onClick={reset}
                className="w-full py-2.5 rounded-xl border border-amber-700/30 text-amber-600 text-[12px] hover:bg-amber-50 flex items-center justify-center gap-2 transition-colors mt-2">
                <RotateCcw size={12} />{isAr ? 'بحث جديد' : 'New search'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
