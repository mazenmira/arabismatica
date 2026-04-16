'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Camera, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IdentifyResult {
  name: string;
  country: string;
  period: string;
  confidence: number;
}

export default function IdentifyModal({ open, onClose, locale }: { open: boolean; onClose: () => void; locale: string }) {
  const t = useTranslations('identify');
  const isAr = locale === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = ''; setPreview(null); setResult(null); }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setResult(null);
    setProcessing(true);

    // TensorFlow.js placeholder — replace with actual model inference
    setTimeout(() => {
      setProcessing(false);
      setResult({
        name: 'جارٍ تطوير هذه الميزة — سيتم استخدام TensorFlow.js لتحليل الصورة',
        country: 'غير محدد',
        period: 'غير محدد',
        confidence: 0,
      });
    }, 2200);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(22,16,10,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-parch rounded-2xl shadow-2xl w-full max-w-md animate-fade-up"
        style={{ border: '1px solid rgba(139,109,46,0.4)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold-700/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <div>
              <h2 className="font-semibold text-[15px] text-ink font-amiri">{t('title')}</h2>
              <p className="text-[11px] text-gold-600">{t('subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full border border-gold-700/40 text-gold-600 hover:text-gold-400 flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Upload area */}
        <div className="p-5">
          <div
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer
              ${dragging ? 'border-gold-500 bg-gold-500/10' : 'border-gold-700/40 hover:border-gold-500/60 hover:bg-gold-500/5'}`}
            style={{ minHeight: 200 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}>

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {preview ? (
              <div className="flex flex-col items-center py-4">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="coin preview" className="w-40 h-40 rounded-full object-cover border-4 border-parch-dark"
                    style={{ outline: '2px solid #8B6D2E', boxShadow: '0 4px 20px rgba(80,50,10,.3)' }} />
                  {processing && (
                    <div className="absolute inset-0 rounded-full bg-ink/40 flex items-center justify-center">
                      <Loader2 size={32} className="text-gold-300 animate-spin" />
                    </div>
                  )}
                </div>
                {processing && (
                  <p className="mt-3 text-[12px] text-gold-600 animate-pulse">{t('processing')}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
                  <Upload size={22} className="text-gold-500" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-ink/70">{t('upload')}</p>
                  <p className="text-[11px] text-ink/40">{t('drop')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Camera size={14} className="text-gold-500" />
                  <span className="text-[11px] text-gold-600">JPG · PNG · WEBP</span>
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          {result && !processing && (
            <div className="mt-4 bg-parch-dark/60 rounded-xl p-4 border border-gold-700/30 animate-fade-up">
              <h3 className="font-semibold text-[13px] text-ink mb-2 font-amiri">
                {isAr ? 'نتيجة التحليل' : 'Analysis Result'}
              </h3>
              <p className="text-[12px] text-gold-700 leading-relaxed">{result.name}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">{t('disclaimer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
