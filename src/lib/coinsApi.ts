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
  coin_type_tag:   string | null;
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
  /** Exclude a single country code — e.g. 'IS' to show only non-Islamic coins */
  excludeCC?: string;
  /** Exclude multiple country codes — e.g. ['IS','SS'] for Arab-only catalogue */
  excludeCCs?: string[];
  /** Dynasty name (Arabic) — exact or partial */
  dyn?:      string;
  /** Metal — exact match (case-insensitive handled by ilike) */
  metal?:    string;
  /** Coin type */
  type?:     string;
  /** Denomination */
  denomination?: string;
  /** Coin type tag — exact match (Arab-Byzantine, Dinar, Fals/Fils, etc.) */
  coin_type_tag?: string;
  /** Mint name in Arabic — exact match */
  mint_ar?: string;
  /** Ruler name in Arabic — exact match */
  ruler_ar?: string;
  /** Mint name in English — exact match */
  mint?: string;
  /** Ruler name in English — exact match */
  ruler?: string;
  /** Hijri year — partial match (LIKE %yah%) */
  yah?: string;
  /** CE year range */
  yceFrom?:  number;
  yceTo?:    number;
  /** Filter to a set of country codes — for era filters that span multiple countries */
  ccIn?:     string[];
  /** Free-text search across name, nar, km, nref, ruler, mint */
  query?:    string;
}

// ── Internal: apply filters to a Supabase query builder ───────────────────────

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qb: any,
  filters: CoinFilters,
) {
  const { cc, excludeCC, excludeCCs, ccIn, dyn, metal, type, denomination, mint_ar, ruler_ar, yah, yceFrom, yceTo, query } = filters;
  const mint   = (filters as CoinFilters).mint;
  const ruler  = (filters as CoinFilters).ruler;

  if (cc) {
    if (Array.isArray(cc)) {
      qb = qb.in('cc', cc);
    } else {
      qb = qb.eq('cc', cc);
    }
  }
  if (ccIn) qb = qb.in('cc', ccIn);
  if (excludeCC)  qb = qb.neq('cc', excludeCC);
  if (excludeCCs) for (const code of excludeCCs) qb = qb.neq('cc', code);

  if (dyn)          qb = qb.ilike('dyn',         `%${dyn}%`);
  if (metal)        qb = qb.ilike('metal',        `%${metal}%`);
  if (type)         qb = qb.eq('type',             type);
  if (denomination)  qb = qb.eq('denomination',     denomination);
  if (filters.coin_type_tag) qb = qb.eq('coin_type_tag', filters.coin_type_tag);
  if (mint_ar)       qb = qb.eq('mint_ar',          mint_ar);
  if (ruler_ar)     qb = qb.eq('ruler_ar',          ruler_ar);
  if (mint)         qb = qb.eq('mint',              mint);
  if (ruler)        qb = qb.eq('ruler',             ruler);
  if (yah)          qb = qb.ilike('yah',           `%${yah}%`);

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
    qb = qb.textSearch('search_vector', query.trim(), { type: 'websearch' });
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
  const { data, error } = await db
    .from('coins')
    .select('id, name, nar, cc, dyn, metal, yce, nref, o, mint, ruler, denomination')
    .textSearch('search_vector', query.trim(), { type: 'websearch' })
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
  column: 'cc' | 'dyn' | 'metal' | 'type' | 'denomination' | 'mint_ar' | 'ruler_ar' | 'coin_type_tag',
): Promise<string[]> {
  // Fetch a small sample and deduplicate in JS.
  // All filterable columns (cc=21, type=3, denomination=4, metal=~20, dyn=~30)
  // have low cardinality — 100 rows captures all distinct values.
  const { data, error } = await db
    .from('coins')
    .select(column)
    .not(column, 'is', null)
    .not(column, 'eq', '')
    .order(column)
    .limit(100);

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

// ── Islamic-specific types & functions ────────────────────────────────────────

export interface DynastyStat {
  dyn:          string;
  coin_count:   number;
  ruler_count:  number;
  from_ah:      string;
  to_ah:        string;
  from_ce:      string;
  to_ce:        string;
}

export interface MintStat {
  mint:    string;
  mint_ar: string;
  total:   number;
}

export interface RulerStat {
  ruler:    string;
  ruler_ar: string;
  dyn:      string;
  from_ah:  string;
  to_ah:    string;
  total:    number;
}

export interface IslamicFilters {
  dynasties: string[];
  mints:     { en: string; ar: string | null }[];
  rulers:    { en: string; ar: string | null }[];
  tags:      string[];
}

/** Extra filters available for Islamic coin pages */
export interface IslamicCoinFilters extends CoinFilters {
  coin_type_tag?: string;
  yah_from?: number;
  yah_to?:   number;
}

// Internal: paginate through all IS rows for a compact column set
async function fetchAllIsRows<T extends Record<string, unknown>>(
  select: string,
): Promise<T[]> {
  const PAGE = 1000;
  const result: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from('coins')
      .select(select)
      .eq('cc', 'IS')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetchAllIsRows: ${error.message}`);
    if (!data || data.length === 0) break;
    result.push(...(data as unknown as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return result;
}

/**
 * Dynasty-level statistics for all IS coins.
 * Returns one row per dynasty, sorted chronologically by earliest AH year.
 */
export async function getDynastyStats(): Promise<DynastyStat[]> {
  type Row = { dyn: string; ruler: string; yah: string; yce: string };
  const rows = await fetchAllIsRows<Row>('dyn, ruler, yah, yce');

  const map = new Map<string, {
    count: number; rulers: Set<string>; yahs: number[]; yces: number[];
  }>();

  for (const row of rows) {
    const dyn = row.dyn || '';
    if (!map.has(dyn)) map.set(dyn, { count: 0, rulers: new Set(), yahs: [], yces: [] });
    const e = map.get(dyn)!;
    e.count++;
    if (row.ruler) e.rulers.add(row.ruler);
    const yah = parseInt(row.yah || '');
    const yce = parseInt(row.yce || '');
    if (!isNaN(yah) && yah > 0) e.yahs.push(yah);
    if (!isNaN(yce) && yce > 0) e.yces.push(yce);
  }

  return Array.from(map.entries())
    .map(([dyn, { count, rulers, yahs, yces }]) => ({
      dyn,
      coin_count:  count,
      ruler_count: rulers.size,
      from_ah: yahs.length ? String(Math.min(...yahs)) : '',
      to_ah:   yahs.length ? String(Math.max(...yahs)) : '',
      from_ce: yces.length ? String(Math.min(...yces)) : '',
      to_ce:   yces.length ? String(Math.max(...yces)) : '',
    }))
    .sort((a, b) => (parseInt(a.from_ah || '9999') - parseInt(b.from_ah || '9999')));
}

/**
 * Mint statistics for all IS coins, sorted by coin count descending.
 */
export async function getMintStats(): Promise<MintStat[]> {
  type Row = { mint: string; mint_ar: string };
  const rows = await fetchAllIsRows<Row>('mint, mint_ar');

  const map = new Map<string, { mint_ar: string; total: number }>();
  for (const row of rows) {
    if (!row.mint) continue;
    if (!map.has(row.mint)) map.set(row.mint, { mint_ar: row.mint_ar || '', total: 0 });
    map.get(row.mint)!.total++;
  }

  return Array.from(map.entries())
    .map(([mint, { mint_ar, total }]) => ({ mint, mint_ar, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Ruler statistics for all IS coins, sorted chronologically by earliest AH year.
 */
export async function getRulerStats(): Promise<RulerStat[]> {
  type Row = { ruler: string; ruler_ar: string; dyn: string; yah: string };
  const rows = await fetchAllIsRows<Row>('ruler, ruler_ar, dyn, yah');

  const map = new Map<string, { ruler_ar: string; dyn: string; yahs: number[]; total: number }>();
  for (const row of rows) {
    if (!row.ruler) continue;
    if (!map.has(row.ruler)) map.set(row.ruler, { ruler_ar: row.ruler_ar || '', dyn: row.dyn || '', yahs: [], total: 0 });
    const e = map.get(row.ruler)!;
    e.total++;
    const yah = parseInt(row.yah || '');
    if (!isNaN(yah) && yah > 0) e.yahs.push(yah);
  }

  return Array.from(map.entries())
    .map(([ruler, { ruler_ar, dyn, yahs, total }]) => ({
      ruler,
      ruler_ar,
      dyn,
      from_ah: yahs.length ? String(Math.min(...yahs)) : '',
      to_ah:   yahs.length ? String(Math.max(...yahs)) : '',
      total,
    }))
    .sort((a, b) => (parseInt(a.from_ah || '9999') - parseInt(b.from_ah || '9999')));
}

/**
 * Paginated IS coin listing with extended Islamic filters.
 * Always scoped to cc = 'IS'. Supports all CoinFilters plus
 * coin_type_tag (exact) and yah_from / yah_to (Hijri year range).
 */
export async function getIslamicCoins(
  filters:  IslamicCoinFilters = {},
  page:     number             = 1,
  pageSize: number             = 40,
): Promise<{ data: CoinRow[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  // Always force cc = IS; merge caller cc is overridden
  let qb = db
    .from('coins')
    .select('*', { count: 'exact' })
    .eq('cc', 'IS')
    .order('id')
    .range(from, to);

  // Apply standard filters (excluding cc — already set above)
  const { cc: _cc, ...rest } = filters;
  void _cc;
  qb = applyFilters(qb, rest);

  // Islamic-specific range filters on yah (stored as text)
  if (filters.yah_from != null) {
    qb = qb.filter('yah', 'gte', String(filters.yah_from));
    qb = qb.not('yah', 'eq', '');
  }
  if (filters.yah_to != null) {
    qb = qb.filter('yah', 'lte', String(filters.yah_to));
    qb = qb.not('yah', 'eq', '');
  }

  const { data, count, error } = await qb;
  if (error) throw new Error(`getIslamicCoins: ${error.message}`);
  return { data: (data ?? []) as CoinRow[], count: count ?? 0 };
}

/**
 * Returns all distinct filter values for the Islamic coins section.
 * Used to populate dynasty, mint, ruler, and tag dropdowns.
 */
export async function getIslamicFilters(): Promise<IslamicFilters> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function distinctIS(col: string): Promise<string[]> {
    const { data } = await db.from('coins').select(col).eq('cc', 'IS').limit(10000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vals: string[] = (data ?? []).map((r: any) => r[col]).filter(Boolean) as string[];
    return Array.from(new Set(vals)).sort();
  }

  const [dynasties, tags, mintData, rulerData] = await Promise.all([
    distinctIS('dyn'),
    distinctIS('coin_type_tag'),
    db.from('coins').select('mint,mint_ar').eq('cc', 'IS').neq('mint', '').limit(10000),
    db.from('coins').select('ruler,ruler_ar').eq('cc', 'IS').neq('ruler', '').limit(10000),
  ]);

  // Build bilingual mint pairs (keyed by English name for uniqueness)
  const mintMap = new Map<string, string | null>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mintData.data ?? []).forEach((r: any) => {
    if (r.mint && !mintMap.has(r.mint)) mintMap.set(r.mint, r.mint_ar || null);
  });
  const mints = Array.from(mintMap.entries())
    .map(([en, ar]) => ({ en, ar }))
    .sort((a, b) => a.en.localeCompare(b.en))
    .slice(0, 120);

  // Build bilingual ruler pairs
  const rulerMap = new Map<string, string | null>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rulerData.data ?? []).forEach((r: any) => {
    if (r.ruler && !rulerMap.has(r.ruler)) rulerMap.set(r.ruler, r.ruler_ar || null);
  });
  const rulers = Array.from(rulerMap.entries())
    .map(([en, ar]) => ({ en, ar }))
    .sort((a, b) => a.en.localeCompare(b.en))
    .slice(0, 200);

  return { dynasties, mints, rulers, tags };
}

// ── Sasanian-specific types & functions ───────────────────────────────────────

export interface SasanianCoinFilters extends CoinFilters {
  yce_from?: number;
  yce_to?:   number;
}

export interface SasanianFilters {
  rulers: { en: string; ar: string | null; count: number }[];
  mints:  { en: string; ar: string | null; count: number }[];
  metals: string[];
}

export async function getSasanianCoins(
  filters:  SasanianCoinFilters = {},
  page:     number              = 1,
  pageSize: number              = 48,
): Promise<{ data: CoinRow[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let qb = db
    .from('coins')
    .select('*', { count: 'exact' })
    .eq('cc', 'SS')
    .order('id')
    .range(from, to);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { cc: _cc, yce_from: _yf, yce_to: _yt, ...rest } = filters;
  void _cc; void _yf; void _yt;
  qb = applyFilters(qb, rest);

  if (filters.yce_from != null) {
    qb = qb.filter('yce', 'gte', String(filters.yce_from));
    qb = qb.not('yce', 'eq', '');
  }
  if (filters.yce_to != null) {
    qb = qb.filter('yce', 'lte', String(filters.yce_to));
    qb = qb.not('yce', 'eq', '');
  }

  const { data, count, error } = await qb;
  if (error) throw new Error(`getSasanianCoins: ${error.message}`);
  return { data: (data ?? []) as CoinRow[], count: count ?? 0 };
}

export async function getSasanianFilters(): Promise<SasanianFilters> {
  const [mintData, rulerData, metalData] = await Promise.all([
    db.from('coins').select('mint,mint_ar').eq('cc', 'SS').neq('mint', '').limit(10000),
    db.from('coins').select('ruler,ruler_ar').eq('cc', 'SS').neq('ruler', '').limit(10000),
    db.from('coins').select('metal').eq('cc', 'SS').limit(10000),
  ]);

  const mintMap = new Map<string, { ar: string | null; count: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mintData.data ?? []).forEach((r: any) => {
    if (r.mint) {
      const entry = mintMap.get(r.mint) ?? { ar: r.mint_ar || null, count: 0 };
      entry.count++;
      mintMap.set(r.mint, entry);
    }
  });
  const mints = Array.from(mintMap.entries())
    .map(([en, { ar, count }]) => ({ en, ar, count }))
    .sort((a, b) => b.count - a.count);

  const rulerMap = new Map<string, { ar: string | null; count: number }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rulerData.data ?? []).forEach((r: any) => {
    if (r.ruler) {
      const entry = rulerMap.get(r.ruler) ?? { ar: r.ruler_ar || null, count: 0 };
      entry.count++;
      rulerMap.set(r.ruler, entry);
    }
  });
  const rulers = Array.from(rulerMap.entries())
    .map(([en, { ar, count }]) => ({ en, ar, count }))
    .sort((a, b) => b.count - a.count);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metalSet = new Set<string>((metalData.data ?? []).map((r: any) => r.metal).filter(Boolean));
  const metals = Array.from(metalSet).sort();

  return { mints, rulers, metals };
}
