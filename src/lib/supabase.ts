// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Grade = 'Poor' | 'Fair' | 'Good' | 'VG' | 'Fine' | 'VF' | 'XF' | 'AU' | 'UNC' | 'Proof';
export type Currency = 'USD' | 'AUD' | 'EGP' | 'SAR' | 'AED' | 'KWD' | 'OMR' | 'GBP' | 'EUR';
export type Priority = 1 | 2 | 3;

export interface CollectionEntry {
  id:            string;
  user_id:       string;
  coin_id:       string;
  grade:         Grade | null;
  paid_price:    number | null;
  currency:      Currency;
  acquired_date: string | null;
  notes:         string | null;
  created_at:    string;
}

export interface WishlistEntry {
  id:         string;
  user_id:    string;
  coin_id:    string;
  max_price:  number | null;
  currency:   Currency;
  priority:   Priority;
  notes:      string | null;
  created_at: string;
}

export interface Profile {
  id:         string;
  username:   string | null;
  country:    string | null;
  bio:        string | null;
  avatar_url: string | null;
  created_at: string;
}
