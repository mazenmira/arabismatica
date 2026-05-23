// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';
import { COUNTRY_META } from '@/lib/countries';

const ALL_COINS = COINS_RAW as unknown as Coin[];
const BASE      = 'https://arabismatica.arabcollector.com';
const LOCALES   = ['ar', 'en'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  // Root pages
  const staticRoutes: MetadataRoute.Sitemap = LOCALES.map(locale => ({
    url:             `${BASE}/${locale}`,
    lastModified:    new Date(),
    changeFrequency: 'daily' as const,
    priority:        1.0,
  }));

  // Country landing pages — 19 × 2 = 38 URLs
  const countryRoutes: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    COUNTRY_META.map(c => ({
      url:             `${BASE}/${locale}/country/${c.slug}`,
      lastModified:    new Date(),
      changeFrequency: 'weekly' as const,
      priority:        0.85,
    }))
  );

  // Individual coin detail pages — 4,737 × 2 = 9,474 URLs
  const coinRoutes: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    (ALL_COINS as Coin[]).map(coin => ({
      url:             `${BASE}/${locale}/catalogue/${coin.id}`,
      lastModified:    new Date(),
      changeFrequency: 'monthly' as const,
      priority:        0.7,
    }))
  );

  return [...staticRoutes, ...countryRoutes, ...coinRoutes];
}
