// v1.0
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Lock, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import type { Coin } from '@/types/coin';

// ── Simple password gate — change this to env var in production ───────────────
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'arabcollector2025';

const EMPTY_COIN: Partial<Coin> = {
  id: '', cc: 'EG', co: 'Egypt', co_ar: 'مصر', dyn: '',
  name: '', nar: '', yce: '', yah: '', metal: 'Copper',
  wt: null, dia: null, km: '', nref: '', nid: '',
  type: 'Circulation', mint: '', o: '', r: '',
};

const METALS = ['Gold','Silver','Copper','Bronze','Cupro-Nickel','Nickel',
                'Bimetallic','Aluminium','Billon','Brass','Steel'];

const COUNTRIES = [
  {cc:'EG',co:'Egypt',co_ar:'مصر'},{cc:'MA',co:'Morocco',co_ar:'المغرب'},
  {cc:'SA',co:'Saudi Arabia',co_ar:'المملكة العربية السعودية'},{cc:'AE',co:'UAE',co_ar:'الإمارات'},
  {cc:'IQ',co:'Iraq',co_ar:'العراق'},{cc:'OM',co:'Oman',co_ar:'عُمان'},
  {cc:'SD',co:'Sudan',co_ar:'السودان'},{cc:'LY',co:'Libya',co_ar:'ليبيا'},
  {cc:'SY',co:'Syria',co_ar:'سوريا'},{cc:'DZ',co:'Algeria',co_ar:'الجزائر'},
  {cc:'JO',co:'Jordan',co_ar:'الأردن'},{cc:'LB',co:'Lebanon',co_ar:'لبنان'},
  {cc:'TN',co:'Tunisia',co_ar:'تونس'},{cc:'YE',co:'Yemen',co_ar:'اليمن'},
  {cc:'QA',co:'Qatar',co_ar:'قطر'},{cc:'KW',co:'Kuwait',co_ar:'الكويت'},
  {cc:'PS',co:'Palestine',co_ar:'فلسطين'},{cc:'MR',co:'Mauritania',co_ar:'موريتانيا'},
];

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-ink/50 uppercase tracking-wider font-medium">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full text-[12px] px-3 py-2 rounded-lg border border-gold-700/30 bg-parch-cream text-ink outline-none focus:border-gold-500 transition-colors";
const sel = inp + " cursor-pointer";

// ── Main AdminPanel ───────────────────────────────────────────────────────────
interface AdminPanelProps {
  onClose: () => void;
  locale: string;
  onCoinAdded?: (coin: Coin) => void;
}

export default function AdminPanel({ onClose, locale, onCoinAdded }: AdminPanelProps) {
  const isAr = locale === 'ar';
  const [authed, setAuthed]       = useState(false);
  const [pw, setPw]               = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [pwError, setPwError]     = useState(false);
  const [form, setForm]           = useState<Partial<Coin>>(EMPTY_COIN);
  const [saved, setSaved]         = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [pendingCoins, setPendingCoins] = useState<Partial<Coin>[]>([]);

  // Load pending coins from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ac_pending_coins');
      if (stored) setPendingCoins(JSON.parse(stored));
    } catch {}
  }, []);

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); }
  };

  const set = (key: keyof Coin, val: string | number | null) =>
    setForm(f => ({ ...f, [key]: val }));

  const setCountry = (cc: string) => {
    const c = COUNTRIES.find(x => x.cc === cc);
    if (c) setForm(f => ({ ...f, cc: c.cc, co: c.co, co_ar: c.co_ar }));
  };

  const generateId = () => {
    const base = form.cc?.toLowerCase() || 'xx';
    const ts   = Date.now().toString(36);
    return `${base}-${ts}`;
  };

  const saveCoin = () => {
    const coin = { ...form, id: form.id || generateId() } as Coin;
    const next = [...pendingCoins, coin];
    setPendingCoins(next);
    try { localStorage.setItem('ac_pending_coins', JSON.stringify(next)); } catch {}
    onCoinAdded?.(coin);
    setSaved(true);
    setTimeout(() => { setSaved(false); setForm(EMPTY_COIN); }, 2000);
  };

  const removePending = (idx: number) => {
    const next = pendingCoins.filter((_, i) => i !== idx);
    setPendingCoins(next);
    try { localStorage.setItem('ac_pending_coins', JSON.stringify(next)); } catch {}
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(pendingCoins, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `new_coins_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Password screen ─────────────────────────────────────────────────────
  if (!authed) return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(22,16,10,.9)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-parch-cream rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-gold-700/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-gold-500" />
            <h2 className="font-amiri text-xl text-ink">{isAr ? 'لوحة الإدارة' : 'Admin Panel'}</h2>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink transition-colors"><X size={16} /></button>
        </div>
        <div className="relative mb-3">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder={isAr ? 'كلمة المرور' : 'Password'}
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === 'Enter' && login()}
            className={`${inp} pr-10 ${pwError ? 'border-red-400' : ''}`}
            dir="ltr"
          />
          <button onClick={() => setShowPw(s => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {pwError && <p className="text-[11px] text-red-500 mb-3">{isAr ? 'كلمة المرور غير صحيحة' : 'Incorrect password'}</p>}
        <button onClick={login}
          className="w-full py-2.5 bg-gold-600 hover:bg-gold-500 text-ink rounded-xl font-semibold text-[13px] transition-colors">
          {isAr ? 'دخول' : 'Login'}
        </button>
        <p className="text-[10px] text-ink/30 text-center mt-4">
          {isAr ? 'للمسؤولين فقط' : 'Authorized administrators only'}
        </p>
      </div>
    </div>
  );

  // ── Admin form ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(22,16,10,.85)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-parch-cream rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[90vh] overflow-y-auto border border-gold-700/40">

        {/* Header */}
        <div className="sticky top-0 bg-parch-cream flex items-center justify-between px-6 py-4 border-b border-gold-700/20 z-10">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-gold-500" />
            <h2 className="font-amiri text-xl text-ink">{isAr ? 'إضافة عملة جديدة' : 'Add New Coin'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {pendingCoins.length > 0 && (
              <button onClick={exportJSON}
                className="text-[11px] px-3 py-1.5 border border-gold-500/50 text-gold-600 hover:bg-gold-900/30 rounded-full transition-colors">
                {isAr ? `تصدير JSON (${pendingCoins.length})` : `Export JSON (${pendingCoins.length})`}
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full border border-gold-700/30 text-ink/40 hover:text-ink flex items-center justify-center transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Section: Identity */}
          <div>
            <h3 className="text-[11px] text-gold-600 uppercase tracking-widest mb-3 font-medium">
              {isAr ? 'هوية العملة' : 'Coin Identity'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={isAr ? 'الدولة' : 'Country'}>
                <select className={sel} value={form.cc} onChange={e => setCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c.cc} value={c.cc}>{isAr ? c.co_ar : c.co}</option>)}
                </select>
              </Field>
              <Field label={isAr ? 'الأسرة الحاكمة' : 'Dynasty'}>
                <input className={inp} value={form.dyn || ''} onChange={e => set('dyn', e.target.value)}
                  placeholder={isAr ? 'مثال: السلطنة المصرية' : 'e.g. Egyptian Sultanate'} />
              </Field>
              <Field label={isAr ? 'الاسم الإنجليزي' : 'English Name'}>
                <input className={inp} value={form.name || ''} onChange={e => set('name', e.target.value)}
                  placeholder="2 Milliemes - Fuad I" dir="ltr" />
              </Field>
              <Field label={isAr ? 'الاسم العربي' : 'Arabic Name'}>
                <input className={inp} value={form.nar || ''} onChange={e => set('nar', e.target.value)}
                  placeholder="٢ مليم - فؤاد الأول" dir="rtl" />
              </Field>
            </div>
          </div>

          {/* Section: Dates */}
          <div>
            <h3 className="text-[11px] text-gold-600 uppercase tracking-widest mb-3 font-medium">
              {isAr ? 'التاريخ' : 'Dates'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label={isAr ? 'سنة ميلادية' : 'Gregorian Year'}>
                <input className={inp} type="number" value={form.yce || ''} onChange={e => set('yce', e.target.value)}
                  placeholder="1924" min="1000" max="2026" dir="ltr" />
              </Field>
              <Field label={isAr ? 'سنة هجرية' : 'Hijri Year'}>
                <input className={inp} value={form.yah || ''} onChange={e => set('yah', e.target.value)}
                  placeholder="1342" dir="ltr" />
              </Field>
              <Field label={isAr ? 'النوع' : 'Type'}>
                <select className={sel} value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="Circulation">{isAr ? 'تداول' : 'Circulation'}</option>
                  <option value="Commemorative">{isAr ? 'تذكارية' : 'Commemorative'}</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Section: Physical specs */}
          <div>
            <h3 className="text-[11px] text-gold-600 uppercase tracking-widest mb-3 font-medium">
              {isAr ? 'المواصفات الفيزيائية' : 'Physical Specs'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label={isAr ? 'المعدن' : 'Metal'}>
                <select className={sel} value={form.metal} onChange={e => set('metal', e.target.value)}>
                  {METALS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label={isAr ? 'الوزن (غ)' : 'Weight (g)'}>
                <input className={inp} type="number" step="0.01" value={form.wt ?? ''} onChange={e => set('wt', parseFloat(e.target.value) || null)}
                  placeholder="3.9" dir="ltr" />
              </Field>
              <Field label={isAr ? 'القطر (مم)' : 'Diameter (mm)'}>
                <input className={inp} type="number" step="0.1" value={form.dia ?? ''} onChange={e => set('dia', parseFloat(e.target.value) || null)}
                  placeholder="20.0" dir="ltr" />
              </Field>
            </div>
          </div>

          {/* Section: References */}
          <div>
            <h3 className="text-[11px] text-gold-600 uppercase tracking-widest mb-3 font-medium">
              {isAr ? 'المراجع' : 'References'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="KM#">
                <input className={inp} value={form.km || ''} onChange={e => set('km', e.target.value)}
                  placeholder="KM#330" dir="ltr" />
              </Field>
              <Field label="Numista N#">
                <input className={inp} value={form.nref || ''} onChange={e => set('nref', e.target.value)}
                  placeholder="N#21801" dir="ltr" />
              </Field>
              <Field label={isAr ? 'عدد المضروب' : 'Mintage'}>
                <input className={inp} value={form.mint || ''} onChange={e => set('mint', e.target.value)}
                  placeholder="3000000" dir="ltr" />
              </Field>
            </div>
          </div>

          {/* Section: Images */}
          <div>
            <h3 className="text-[11px] text-gold-600 uppercase tracking-widest mb-3 font-medium">
              {isAr ? 'الصور (روابط Numista)' : 'Images (Numista URLs)'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={isAr ? 'الوجه' : 'Obverse'}>
                <input className={inp} value={form.o || ''} onChange={e => set('o', e.target.value)}
                  placeholder="https://en.numista.com/..." dir="ltr" />
              </Field>
              <Field label={isAr ? 'الظهر' : 'Reverse'}>
                <input className={inp} value={form.r || ''} onChange={e => set('r', e.target.value)}
                  placeholder="https://en.numista.com/..." dir="ltr" />
              </Field>
            </div>
            {/* Image preview */}
            {(form.o || form.r) && (
              <div className="flex gap-4 mt-3">
                {form.o && form.o.startsWith('http') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.o} alt="obverse preview" className="w-16 h-16 rounded-full object-cover border-2 border-gold-500/50" />
                )}
                {form.r && form.r.startsWith('http') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.r} alt="reverse preview" className="w-16 h-16 rounded-full object-cover border-2 border-gold-500/50" />
                )}
              </div>
            )}
          </div>

          {/* JSON preview */}
          <div>
            <button
              onClick={() => setJsonExpanded(e => !e)}
              className="flex items-center gap-1.5 text-[11px] text-gold-600 hover:text-gold-400 transition-colors"
            >
              {jsonExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {isAr ? 'معاينة JSON' : 'Preview JSON'}
            </button>
            {jsonExpanded && (
              <pre className="mt-2 text-[10px] bg-ink/90 text-gold-300 p-3 rounded-xl overflow-x-auto max-h-40 font-mono" dir="ltr">
                {JSON.stringify(form, null, 2)}
              </pre>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={saveCoin}
            disabled={!form.name || !form.cc}
            className={`w-full py-3 rounded-xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2
              ${saved
                ? 'bg-emerald-600 text-white'
                : (!form.name || !form.cc)
                  ? 'bg-gold-800/30 text-ink/30 cursor-not-allowed'
                  : 'bg-gold-600 hover:bg-gold-500 text-ink cursor-pointer'}`}
          >
            <Save size={15} />
            {saved
              ? (isAr ? '✓ تم الحفظ — جاهز لإضافة التالية' : '✓ Saved — ready for next')
              : (isAr ? 'حفظ العملة' : 'Save Coin')}
          </button>

          <p className="text-[10px] text-ink/30 text-center">
            {isAr
              ? 'العملات المحفوظة مؤقتة. استخدم "تصدير JSON" لتحميل الملف وإضافته إلى coins.json'
              : 'Saved coins are temporary. Use "Export JSON" to download and merge into coins.json'}
          </p>
        </div>

        {/* Pending coins list */}
        {pendingCoins.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-[11px] text-gold-600 uppercase tracking-widest mb-3 font-medium border-t border-gold-700/20 pt-4">
              {isAr ? `قيد الانتظار (${pendingCoins.length})` : `Pending (${pendingCoins.length})`}
            </h3>
            <div className="space-y-2">
              {pendingCoins.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-parch-dark/40 rounded-xl px-3 py-2 border border-gold-700/15">
                  <div>
                    <div className="text-[12px] text-ink font-amiri">{c.name}</div>
                    <div className="text-[10px] text-ink/40">{c.cc} · {c.yce} · {c.metal}</div>
                  </div>
                  <button onClick={() => removePending(i)}
                    className="text-red-400/60 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
