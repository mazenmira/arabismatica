// src/app/sitemap.ts
// Lightweight index — sub-sitemaps handle the bulk of URLs
// This stays well under Vercel's 19MB limit
import type { MetadataRoute } from 'next';
import { COUNTRY_META } from '@/lib/countries';

const BASE    = 'https://arabismatica.arabcollector.com';
const LOCALES = ['ar', 'en'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  // Homepage + Islamic page (highest priority)
  const corePages: MetadataRoute.Sitemap = LOCALES.flatMap(locale => [
    { url: `${BASE}/${locale}`,         lastModified: new Date(), changeFrequency: 'daily'  as const, priority: 1.0  },
    { url: `${BASE}/${locale}/islamic`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.95 },
  ]);

  // Country pages (40 URLs — fast)
  const countryPages: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    COUNTRY_META.map(c => ({
      url: `${BASE}/${locale}/country/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))
  );

  // Sub-sitemap discovery URLs (tell Google where to find coin pages)
  const subSitemaps: MetadataRoute.Sitemap = [
    { url: `${BASE}/sitemap/countries`, lastModified: new Date(), changeFrequency: 'weekly'  as const, priority: 0.5 },
    { url: `${BASE}/sitemap/national`,  lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE}/sitemap/islamic/1`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE}/sitemap/islamic/2`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE}/sitemap/islamic/3`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE}/sitemap/islamic/4`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  return [...corePages, ...countryPages, ...subSitemaps];
}
