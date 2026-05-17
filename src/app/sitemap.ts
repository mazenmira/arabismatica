// src/app/sitemap.ts
import type { MetadataRoute } from 'next';
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';

const BASE  = 'https://arabismatica.arabcollector.com';
const COINS = COINS_RAW as unknown as Coin[];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['ar', 'en'];

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = locales.map(locale => ({
    url:              `${BASE}/${locale}`,
    lastModified:     new Date(),
    changeFrequency:  'weekly',
    priority:         1.0,
  }));

  // Coin detail pages — one per coin per locale
  const coinRoutes: MetadataRoute.Sitemap = COINS.flatMap(coin =>
    locales.map(locale => ({
      url:             `${BASE}/${locale}/catalogue/${coin.id}`,
      lastModified:    new Date(),
      changeFrequency: 'monthly' as const,
      priority:        0.7,
    }))
  );

  return [...staticRoutes, ...coinRoutes];
}
