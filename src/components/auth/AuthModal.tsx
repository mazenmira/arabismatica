// src/components/auth/AuthModal.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  locale: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ locale, onClose, onSuccess }: AuthModalProps) {
  const isAr = locale === 'ar';
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const inp = "w-full text-[13px] px-3 py-2.5 rounded-xl border border-gold-700/30 bg-parch-cream text-ink outline-none focus:border-gold-500 transition-colors";

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onSuccess(); onClose();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { username } },
        });
        if (err) throw err;
        setSuccess(isAr ? 'تم التسجيل! تحقق من بريدك الإلكتروني لتأكيد الحساب.' : 'Registered! Check your email to confirm.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(isAr ? 'حدث خطأ: ' + msg : 'Error: ' + msg);
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ background: 'rgba(22,16,10,.88)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-parch-cream rounded-2xl shadow-2xl w-full max-w-sm border border-gold-700/40 p-6"
        initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-amiri text-xl text-ink">
            {mode === 'login'
              ? (isAr ? 'تسجيل الدخول' : 'Sign In')
              : (isAr ? 'إنشاء حساب' : 'Create Account')}
          </h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-[13px] text-emerald-700 text-center">
            {success}
          </div>
        ) : (
          <div className="space-y-3">
            {mode === 'register' && (
              <input className={inp} placeholder={isAr ? 'اسم المستخدم' : 'Username'}
                value={username} onChange={e => setUsername(e.target.value)} dir="ltr" />
            )}
            <input className={inp} type="email" placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
              value={email} onChange={e => setEmail(e.target.value)} dir="ltr" />
            <div className="relative">
              <input className={inp + ' pr-10'} type={showPw ? 'text' : 'password'}
                placeholder={isAr ? 'كلمة المرور' : 'Password'}
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} dir="ltr" />
              <button onClick={() => setShowPw(s => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {error && <p className="text-[11px] text-red-500">{error}</p>}

            <button onClick={handleSubmit} disabled={loading || !email || !password}
              className="w-full py-2.5 bg-gold-600 hover:bg-gold-500 disabled:bg-gold-800/30 disabled:text-ink/30 text-ink rounded-xl font-semibold text-[13px] transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === 'login' ? (isAr ? 'دخول' : 'Sign In') : (isAr ? 'إنشاء الحساب' : 'Create Account')}
            </button>

            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className="w-full text-[12px] text-gold-600 hover:text-gold-400 transition-colors py-1">
              {mode === 'login'
                ? (isAr ? 'ليس لديك حساب؟ سجّل الآن' : "Don't have an account? Register")
                : (isAr ? 'لديك حساب بالفعل؟ سجّل دخولك' : 'Already have an account? Sign in')}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
