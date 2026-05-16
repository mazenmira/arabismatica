// src/components/dashboard/Dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, LogOut, BookmarkCheck, Heart, FileDown, User, Loader2 } from 'lucide-react';
import { supabase, type CollectionEntry, type WishlistEntry } from '@/lib/supabase';
import { getCoinName, COUNTRY_FLAGS, formatMintage } from '@/lib/coins';
import type { Coin } from '@/types/coin';
import COINS_RAW from '@/data/coins.json';

const ALL_COINS = COINS_RAW as unknown as Coin[];

interface DashboardProps {
  locale: string;
  userId: string;
  userEmail: string;
  onClose: () => void;
  onSignOut: () => void;
}

export default function Dashboard({ locale, userId, userEmail, onClose, onSignOut }: DashboardProps) {
  const isAr = locale === 'ar';
  const [tab, setTab]               = useState<'collection' | 'wishlist' | 'profile'>('collection');
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [wishlist, setWishlist]     = useState<WishlistEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [username, setUsername]     = useState('');
  const [savingProfile, setSaving]  = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [col, wl, prof] = await Promise.all([
        supabase.from('collection').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('wishlist').select('*').eq('user_id', userId).order('priority'),
        supabase.from('profiles').select('*').eq('id', userId).single(),
      ]);
      setCollection(col.data ?? []);
      setWishlist(wl.data ?? []);
      if (prof.data?.username) setUsername(prof.data.username);
      setLoading(false);
    };
    load();
  }, [userId]);

  const getCoin = (coinId: string) => ALL_COINS.find(c => c.id === coinId);

  const removeCollection = async (coinId: string) => {
    await supabase.from('collection').delete().eq('user_id', userId).eq('coin_id', coinId);
    setCollection(prev => prev.filter(c => c.coin_id !== coinId));
  };

  const removeWishlist = async (coinId: string) => {
    await supabase.from('wishlist').delete().eq('user_id', userId).eq('coin_id', coinId);
    setWishlist(prev => prev.filter(w => w.coin_id !== coinId));
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ username }).eq('id', userId);
    setSaving(false);
  };

  const exportPDF = (items: { coin_id: string }[], title: string) => {
    const rows = items.map(item => {
      const coin = getCoin(item.coin_id);
      if (!coin) return '';
      const name = isAr ? (coin.nar || coin.name) : coin.name;
      const flag = COUNTRY_FLAGS[coin.cc] ?? '';
      const year = coin.yce ? coin.yce + (isAr ? ' م' : '') : '';
      const mint = coin.mint ? formatMintage(coin.mint, locale) : '—';
      return `<tr><td>${flag} ${isAr ? coin.co_ar : coin.co}</td><td dir="rtl">${name}</td><td>${year}</td><td>${coin.metal}</td><td>${mint}</td><td>${coin.km || '—'}</td></tr>`;
    }).join('');
    const hdrs = isAr ? ['الدولة','الاسم','السنة','المعدن','المضروب','KM#'] : ['Country','Name','Year','Metal','Mintage','KM#'];
    const html = `<!DOCTYPE html><html dir="${isAr?'rtl':'ltr'}" lang="${locale}"><head><meta charset="UTF-8"><title>${title}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Amiri',serif;font-size:11px;color:#1a0e05;padding:24px}
h1{font-size:18px;color:#8B6D2E;margin-bottom:12px}table{width:100%;border-collapse:collapse}
th{background:#1a0e05;color:#F0E8D4;padding:6px 8px;text-align:${isAr?'right':'left'};font-size:10px}
td{padding:5px 8px;border-bottom:1px solid #e8dfc8}tr:nth-child(even){background:#faf6ee}
.foot{margin-top:16px;font-size:9px;color:#aaa;text-align:center}</style></head>
<body><h1>${title}</h1>
<table><thead><tr>${hdrs.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
<div class="foot">arabismatica.arabcollector.com · ${new Date().toLocaleDateString(isAr?'ar-EG':'en-AU')}</div>
</body></html>`;
    const blob = new Blob([html], {type:'text/html;charset=utf-8'});
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url,'_blank');
    if (win) { win.onload = () => { win.print(); setTimeout(()=>URL.revokeObjectURL(url),3000); }; }
  };

  const inp = "w-full text-[13px] px-3 py-2.5 rounded-xl border border-gold-700/30 bg-parch-cream text-ink outline-none focus:border-gold-500 transition-colors";

  return (
    <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(22,16,10,.88)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="bg-parch-cream rounded-2xl shadow-2xl w-full max-w-[700px] max-h-[88vh] overflow-y-auto border border-gold-700/40"
        initial={{ scale: 0.94, y: 12 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-parch-cream flex items-center justify-between px-6 py-4 border-b border-gold-700/20 z-10">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gold-500" />
            <div>
              <h2 className="font-amiri text-lg text-ink leading-tight">{isAr ? 'لوحة المقتني' : 'Collector Dashboard'}</h2>
              <p className="text-[10px] text-ink/40">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSignOut} className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500 border border-red-300/30 rounded-full px-2.5 py-1 transition-colors">
              <LogOut size={11} />{isAr ? 'خروج' : 'Sign out'}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full border border-gold-700/30 text-ink/40 hover:text-ink flex items-center justify-center transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 border-b border-gold-700/15">
          {[
            { key: 'collection', icon: <BookmarkCheck size={14} />, label: isAr ? 'مجموعتي' : 'Collection', count: collection.length },
            { key: 'wishlist',   icon: <Heart size={14} />,         label: isAr ? 'أمنياتي'  : 'Wishlist',   count: wishlist.length },
            { key: 'profile',    icon: <User size={14} />,          label: isAr ? 'ملفي'     : 'Profile',    count: null },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`flex flex-col items-center gap-1 py-3 transition-colors border-b-2
                ${tab === t.key ? 'border-gold-500 text-gold-600' : 'border-transparent text-ink/40 hover:text-ink/70'}`}>
              {t.icon}
              <span className="text-[11px] font-medium">{t.label}</span>
              {t.count !== null && <span className="text-[10px] text-ink/30">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gold-500" /></div>
          ) : tab === 'collection' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-amiri text-lg text-ink">{isAr ? `مجموعتي (${collection.length} عملة)` : `My Collection (${collection.length} coins)`}</h3>
                {collection.length > 0 && (
                  <button onClick={() => exportPDF(collection, isAr ? 'مجموعتي' : 'My Collection')}
                    className="flex items-center gap-1.5 text-[11px] text-gold-600 border border-gold-700/30 rounded-full px-3 py-1.5 hover:border-gold-500 transition-colors">
                    <FileDown size={11} />{isAr ? 'تصدير PDF' : 'Export PDF'}
                  </button>
                )}
              </div>
              {collection.length === 0 ? (
                <div className="text-center py-12 text-ink/30">
                  <BookmarkCheck size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-amiri text-[14px]">{isAr ? 'مجموعتك فارغة — ابدأ بإضافة العملات' : 'Your collection is empty — start adding coins'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collection.map(entry => {
                    const coin = getCoin(entry.coin_id);
                    if (!coin) return null;
                    return (
                      <div key={entry.id} className="flex items-center gap-3 bg-parch-dark/30 rounded-xl px-3 py-2.5 border border-gold-700/15">
                        {coin.o && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coin.o} alt="" className="w-10 h-10 rounded-full object-cover border border-gold-700/30 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-amiri text-ink truncate">{getCoinName(coin, locale)}</div>
                          <div className="text-[10px] text-ink/40 flex items-center gap-2">
                            <span>{COUNTRY_FLAGS[coin.cc]} {isAr ? coin.co_ar : coin.co}</span>
                            {entry.grade && <span className="bg-gold-500/15 text-gold-600 px-1.5 py-0.5 rounded-full">{entry.grade}</span>}
                            {entry.paid_price && <span>{entry.paid_price} {entry.currency}</span>}
                          </div>
                          {entry.notes && <div className="text-[10px] text-ink/30 truncate mt-0.5">{entry.notes}</div>}
                        </div>
                        <button onClick={() => removeCollection(entry.coin_id)}
                          className="text-red-400/50 hover:text-red-400 transition-colors shrink-0">
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : tab === 'wishlist' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-amiri text-lg text-ink">{isAr ? `قائمة الأمنيات (${wishlist.length})` : `Wishlist (${wishlist.length})`}</h3>
                {wishlist.length > 0 && (
                  <button onClick={() => exportPDF(wishlist, isAr ? 'قائمة أمنياتي' : 'My Wishlist')}
                    className="flex items-center gap-1.5 text-[11px] text-gold-600 border border-gold-700/30 rounded-full px-3 py-1.5 hover:border-gold-500 transition-colors">
                    <FileDown size={11} />{isAr ? 'تصدير PDF' : 'Export PDF'}
                  </button>
                )}
              </div>
              {wishlist.length === 0 ? (
                <div className="text-center py-12 text-ink/30">
                  <Heart size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-amiri text-[14px]">{isAr ? 'قائمة أمنياتك فارغة' : 'Your wishlist is empty'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {wishlist.map(entry => {
                    const coin = getCoin(entry.coin_id);
                    if (!coin) return null;
                    const priorityLabel = entry.priority === 1 ? (isAr ? 'عالي' : 'High') : entry.priority === 3 ? (isAr ? 'منخفض' : 'Low') : (isAr ? 'متوسط' : 'Med');
                    const priorityColor = entry.priority === 1 ? 'text-red-500 bg-red-50' : entry.priority === 3 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';
                    return (
                      <div key={entry.id} className="flex items-center gap-3 bg-parch-dark/30 rounded-xl px-3 py-2.5 border border-gold-700/15">
                        {coin.o && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coin.o} alt="" className="w-10 h-10 rounded-full object-cover border border-gold-700/30 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-amiri text-ink truncate">{getCoinName(coin, locale)}</div>
                          <div className="text-[10px] text-ink/40 flex items-center gap-2">
                            <span>{COUNTRY_FLAGS[coin.cc]} {isAr ? coin.co_ar : coin.co}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${priorityColor}`}>{priorityLabel}</span>
                            {entry.max_price && <span>{isAr ? 'حتى' : 'Up to'} {entry.max_price} {entry.currency}</span>}
                          </div>
                        </div>
                        <button onClick={() => removeWishlist(entry.coin_id)}
                          className="text-red-400/50 hover:text-red-400 transition-colors shrink-0">
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-w-sm">
              <h3 className="font-amiri text-lg text-ink">{isAr ? 'ملفي الشخصي' : 'My Profile'}</h3>
              <div>
                <label className="text-[10px] text-ink/50 uppercase tracking-wider mb-1 block">{isAr ? 'اسم المستخدم' : 'Username'}</label>
                <input className={inp} value={username} onChange={e => setUsername(e.target.value)}
                  placeholder={isAr ? 'اسمك في المنصة' : 'Your display name'} dir="ltr" />
              </div>
              <div>
                <label className="text-[10px] text-ink/50 uppercase tracking-wider mb-1 block">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                <input className={inp + ' opacity-50 cursor-not-allowed'} value={userEmail} readOnly dir="ltr" />
              </div>
              <button onClick={saveProfile} disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-500 text-ink rounded-xl font-semibold text-[13px] transition-colors">
                {savingProfile && <Loader2 size={13} className="animate-spin" />}
                {isAr ? 'حفظ التغييرات' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
