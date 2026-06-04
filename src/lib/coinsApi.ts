/**
 * coinsApi.ts
 *
 * Supabase-backed API layer for the coins catalogue.
 * Replaces the local coins.json import with server-side paginated queries.
 *
 * All functions are async and safe to call from both Server and Client Components.
 * Use the anon key for reads (RLS allows public select).
 */

import { createClient } from '@supabase/supabase-js';

// ── Client (anon key — public read only) ──────────────────────────────────────
// Works in both SSR and client-side contexts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoinRow {
  id:              string;
  cc:              string;
  co:              string;
  co_ar:           string;
  dyn:             string;
  name:            string;
  nar:             string;
  km:              string;
  yce:             string;
  yah:             string;
  metal:           string;
  wt:              number | null;
  dia:             number | null;
  nref:            string;
  nid:             string;
  type:            string;
  denomination:    string | null;
  mint:            string;
  mint_ar:         string;
  ruler:           string;
  ruler_ar:        string;
  obverse_legend:  string;
  reverse_legend:  string;
  o:               string;
  r:               string;
  prices:          PriceMap | null;
  mintage_data:    MintageEntry[] | null;
  auction:         AuctionRecord | null;
}

export interface PriceMap {
  G:   number | null;
  VG:  number | null;
  F:   number | null;
  VF:  number | null;
  XF:  number | null;
  AU:  number | null;
  UNC: number | null;
}

export interface MintageEntry {
  YearGregorian: number | null;
  YearHijri:     string | null;
  Mintmark:      string | null;
  MintageCount:  number | null;
  Note:          string | null;
  Rarity:        'Common' | 'Uncommon' | 'Scarce' | 'Rare' | null;
}

export interface AuctionRecord {
  house:    string;
  sale?:    string;
  lot?:     string;
  date?:    string;
  price?:   number;
  currency?: string;
  grade?:   string;
}

// ── Filter shape ──────────────────────────────────────────────────────────────

export interface CoinFilters {
  /** Country code(s) — 'IS', 'EG', ['SA','EG'], etc. */
  cc?:       string | string[];
  /** Dynasty name (Arabic) — exact or partial */
  dyn?:      string;
  /** Metal — exact match (case-insensitive handled by ilike) */
  metal?:    string;
  /** Coin type */
  type?:     string;
  /** Denomination */
  denomination?: string;
  /** CE year range */
  yceFrom?:  number;
  yceTo?:    number;
  /** Free-text search across name, nar, km, nref, ruler, mint */
  query?:    string;
}

// ── Internal: apply filters to a Supabase query builder ───────────────────────

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qb: any,
  filters: CoinFilters,
) {
  const { cc, dyn, metal, type, denomination, yceFrom, yceTo, query } = filters;

  if (cc) {
    if (Array.isArray(cc)) {
      qb = qb.in('cc', cc);
    } else {
      qb = qb.eq('cc', cc);
    }
  }

  if (dyn)          qb = qb.ilike('dyn',   `%${dyn}%`);
  if (metal)        qb = qb.ilike('metal', `%${metal}%`);
  if (type)         qb = qb.eq('type',     type);
  if (denomination) qb = qb.eq('denomination', denomination);

  // Year range — yce is stored as text; cast to int, ignore empty strings
  if (yceFrom != null) {
    qb = qb.filter('yce', 'gte', String(yceFrom));
    qb = qb.not('yce', 'eq', '');
  }
  if (yceTo != null) {
    qb = qb.filter('yce', 'lte', String(yceTo));
    qb = qb.not('yce', 'eq', '');
  }

  // Full-text search using the stored tsvector column
  if (query && query.trim()) {
    const tsq = query.trim().split(/\s+/).map(w => `${w}:*`).join(' & ');
    qb = qb.textSearch('search_vector', tsq, { type: 'websearch' });
  }

  return qb;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Paginated coin listing with filters.
 * Returns { data: CoinRow[], count: number }
 */
export async function getCoins(
  filters:  CoinFilters = {},
  page:     number      = 1,
  pageSize: number      = 60,
): Promise<{ data: CoinRow[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let qb = db
    .from('coins')
    .select('*', { count: 'exact' })
    .order('id')
    .range(from, to);

  qb = applyFilters(qb, filters);

  const { data, count, error } = await qb;
  if (error) throw new Error(`getCoins: ${error.message}`);

  return { data: (data ?? []) as CoinRow[], count: count ?? 0 };
}

/**
 * Fetch a single coin by its id (e.g. "zeno-381260").
 */
export async function getCoinById(id: string): Promise<CoinRow | null> {
  const { data, error } = await db
    .from('coins')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`getCoinById: ${error.message}`);
  return data as CoinRow | null;
}

/**
 * Total count of coins matching filters (for pagination UI).
 */
export async function getCoinCount(filters: CoinFilters = {}): Promise<number> {
  let qb = db
    .from('coins')
    .select('id', { count: 'exact', head: true });

  qb = applyFilters(qb, filters);

  const { count, error } = await qb;
  if (error) throw new Error(`getCoinCount: ${error.message}`);
  return count ?? 0;
}

/**
 * Fast typeahead / search — returns up to `limit` coins matching the query.
 * Uses the stored tsvector for speed, falls back to ilike on name.
 */
export async function searchCoins(
  query: string,
  limit: number = 20,
): Promise<CoinRow[]> {
  if (!query.trim()) return [];

  // Try tsvector full-text first
  const tsq = query.trim().split(/\s+/).map(w => `${w}:*`).join(' & ');

  const { data, error } = await db
    .from('coins')
    .select('id, name, nar, cc, dyn, metal, yce, nref, o, mint, ruler, denomination')
    .textSearch('search_vector', tsq, { type: 'websearch' })
    .limit(limit);

  if (!error && data && data.length > 0) return data as CoinRow[];

  // Fallback: ilike on name
  const { data: fallback, error: fe } = await db
    .from('coins')
    .select('id, name, nar, cc, dyn, metal, yce, nref, o, mint, ruler, denomination')
    .or(`name.ilike.%${query}%,nar.ilike.%${query}%,nref.ilike.%${query}%,km.ilike.%${query}%`)
    .limit(limit);

  if (fe) throw new Error(`searchCoins: ${fe.message}`);
  return (fallback ?? []) as CoinRow[];
}

/**
 * Get distinct values for a column — useful for filter dropdowns.
 * e.g. getDistinctValues('cc') returns all country codes present in the table.
 */
export async function getDistinctValues(
  column: 'cc' | 'dyn' | 'metal' | 'type' | 'denomination',
): Promise<string[]> {
  // Supabase doesn't expose DISTINCT natively via the JS client;
  // use an RPC function or a workaround with a limit + group.
  // Best done via a Supabase DB function, but we can approximate:
  const { data, error } = await db
    .from('coins')
    .select(column)
    .not(column, 'is', null)
    .not(column, 'eq', '')
    .order(column)
    .limit(2000);  // large enough to capture all distinct values for small-cardinality cols

  if (error) throw new Error(`getDistinctValues(${column}): ${error.message}`);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const vals = Array.from(new Set(rows.map(r => String(r[column] ?? '')).filter(Boolean)));
  return vals.sort();
}

/**
 * Get coins by dynasty (for dynasty detail pages).
 */
export async function getCoinsByDynasty(
  dyn:      string,
  page:     number = 1,
  pageSize: number = 60,
): Promise<{ data: CoinRow[]; count: number }> {
  return getCoins({ dyn }, page, pageSize);
}

/**
 * Get coins by country code.
 */
export async function getCoinsByCountry(
  cc:       string,
  page:     number = 1,
  pageSize: number = 60,
): Promise<{ data: CoinRow[]; count: number }> {
  return getCoins({ cc }, page, pageSize);
}
