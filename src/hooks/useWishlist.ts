// src/hooks/useWishlist.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type WishlistEntry, type Currency, type Priority } from '@/lib/supabase';

export function useWishlist(userId: string | null) {
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setWishlist([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: true });
    setWishlist(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const has = (coinId: string) => wishlist.some(w => w.coin_id === coinId);

  const add = async (coinId: string, opts: {
    max_price?: number; currency?: Currency; priority?: Priority; notes?: string;
  } = {}) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('wishlist')
      .upsert({ user_id: userId, coin_id: coinId, priority: 2, ...opts }, { onConflict: 'user_id,coin_id' })
      .select().single();
    if (!error && data) {
      setWishlist(prev => [data, ...prev.filter(w => w.coin_id !== coinId)]);
    }
  };

  const remove = async (coinId: string) => {
    if (!userId) return;
    await supabase.from('wishlist').delete()
      .eq('user_id', userId).eq('coin_id', coinId);
    setWishlist(prev => prev.filter(w => w.coin_id !== coinId));
  };

  const toggle = async (coinId: string) => {
    has(coinId) ? await remove(coinId) : await add(coinId);
  };

  return { wishlist, loading, has, add, remove, toggle, reload: load };
}
