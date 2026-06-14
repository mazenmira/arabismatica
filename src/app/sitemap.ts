// Updated sitemap.ts — add Islamic sub-pages
import type { MetadataRoute } from 'next';
import { COUNTRY_META } from '@/lib/countries';

const BASE    = 'https://arabismatica.arabcollector.com';
const LOCALES = ['ar', 'en', 'de'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = LOCALES.flatMap(locale => [
    { url: `${BASE}/${locale}`,                      lastModified: new Date(), changeFrequency: 'daily'  as const, priority: 1.0  },
    { url: `${BASE}/${locale}/catalogue`,            lastModified: new Date(), changeFrequency: 'daily'  as const, priority: 0.98 },
    { url: `${BASE}/${locale}/islamic`,              lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.95 },
    { url: `${BASE}/${locale}/islamic/dynasties`,    lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.90 },
    { url: `${BASE}/${locale}/islamic/mints`,        lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.90 },
    { url: `${BASE}/${locale}/islamic/rulers`,       lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.90 },
    { url: `${BASE}/${locale}/islamic/coin-index`,   lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${BASE}/${locale}/sasanian`,             lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.90 },
  ]);

  const countryPages: MetadataRoute.Sitemap = LOCALES.flatMap(locale =>
    COUNTRY_META.map(c => ({
      url: `${BASE}/${locale}/country/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))
  );

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
