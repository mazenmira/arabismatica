// src/hooks/useCollection.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, type CollectionEntry, type Grade, type Currency } from '@/lib/supabase';

export function useCollection(userId: string | null) {
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Load collection from Supabase
  const load = useCallback(async () => {
    if (!userId) { setCollection([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('collection')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setCollection(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const has = (coinId: string) => collection.some(c => c.coin_id === coinId);

  const add = async (coinId: string, opts: {
    grade?: Grade; paid_price?: number; currency?: Currency;
    acquired_date?: string; notes?: string;
  } = {}) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('collection')
      .upsert({ user_id: userId, coin_id: coinId, ...opts }, { onConflict: 'user_id,coin_id' })
      .select().single();
    if (!error && data) {
      setCollection(prev => [data, ...prev.filter(c => c.coin_id !== coinId)]);
    }
  };

  const remove = async (coinId: string) => {
    if (!userId) return;
    await supabase.from('collection').delete()
      .eq('user_id', userId).eq('coin_id', coinId);
    setCollection(prev => prev.filter(c => c.coin_id !== coinId));
  };

  const toggle = async (coinId: string) => {
    if (has(coinId)) { await remove(coinId); } else { await add(coinId); }
  };

  const getEntry = (coinId: string) => collection.find(c => c.coin_id === coinId) ?? null;

  return { collection, loading, has, add, remove, toggle, getEntry, reload: load };
}
