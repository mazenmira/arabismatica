// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';

const ALL_COINS = COINS_RAW as unknown as Coin[];
const BASE      = 'https://arabismatica.arabcollector.com';
const LOCALES   = ['ar', 'en'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  // Static root pages (the home = catalogue page)
  const staticRoutes: MetadataRoute.Sitemap = LOCALES.map(locale => ({
    url:             `${BASE}/${locale}`,
    lastModified:    new Date(),
    changeFrequency: 'daily' as const,
    priority:        1.0,
  }));

  // All individual coin detail pages — pre-rendered at build time
  const coinRoutes: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    ALL_COINS.map(coin => ({
      url:             `${BASE}/${locale}/catalogue/${coin.id}`,
      lastModified:    new Date(),
      changeFrequency: 'monthly' as const,
      priority:        0.7,
    }))
  );

  return [...staticRoutes, ...coinRoutes];
}
