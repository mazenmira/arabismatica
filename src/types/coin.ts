export interface Coin {
  id: string;
  cc: string;           // country code e.g. "EG"
  co: string;           // country English
  co_ar: string;        // country Arabic
  dyn: string;          // dynasty Arabic
  name: string;         // coin name English
  nar: string;          // coin name Arabic
  yce: string;          // year CE
  yah: string;          // year AH
  metal: string;        // e.g. "Silver"
  wt: number | null;    // weight grams
  dia: number | null;   // diameter mm
  km: string;           // KM reference
  nref: string;         // N# Numista reference
  nid: string;          // Numista numeric ID
  type: string;         // "Circulation" | "Commemorative" | "Pattern"
  mint: string;         // mintage number as string
  o: string;            // obverse image URL
  r: string;            // reverse image URL
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
