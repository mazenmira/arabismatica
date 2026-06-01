export interface MintageEntry {
  YearGregorian: number | null;
  YearHijri: string | null;
  Mintmark: string | null;
  MintageCount: number | null;
  Note: string | null;
  Rarity: 'Common' | 'Uncommon' | 'Scarce' | 'Rare' | null;
}

export interface CoinPrices {
  G:   number | null;
  VG:  number | null;
  F:   number | null;
  VF:  number | null;
  XF:  number | null;
  AU:  number | null;
  UNC: number | null;
}

export interface Coin {
  id: string;
  cc: string;
  co: string;
  co_ar: string;
  dyn: string;
  name: string;
  nar: string;
  yce: string;
  yah: string;
  metal: string;
  wt: number | null;
  dia: number | null;
  km: string;
  nref: string;
  nid: string;
  type: string;
  mint: string;
  mint_ar?: string;
  ruler?: string;
  ruler_ar?: string;
  denomination?: 'Dirham' | 'Dinar' | 'Fals' | 'Fils' | 'Other';
  mintageData?: MintageEntry[];
  prices?: CoinPrices;
  o: string;
  r: string;
}

export type Metal =
  | 'Gold' | 'Silver' | 'Copper' | 'Bronze' | 'Cupro-Nickel'
  | 'Bimetallic' | 'Aluminium' | 'Billon' | 'Brass' | 'Nickel'
  | 'Steel' | 'Other';

export type Locale = 'ar' | 'en';

export interface FilterState {
  country: string;
  era: string;
  metal: string;
  type: string;
  query: string;
  yearFrom: number;
  yearTo: number;
}
