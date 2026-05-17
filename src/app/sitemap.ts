// src/app/sitemap.ts
// Place this file at: src/app/sitemap.ts (root app folder, NOT inside [locale])
import type { MetadataRoute } from 'next';

const BASE = 'https://arabismatica.arabcollector.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // Static routes — coin pages are discovered via links from these
  return [
    {
      url:             `${BASE}/ar`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
    },
    {
      url:             `${BASE}/en`,
      lastModified:    new Date(),
      changeFrequency: 'daily',
      priority:        1.0,
    },
    {
      url:             `${BASE}/ar/catalogue`,
      lastModified:    new Date(),
      changeFrequency: 'weekly',
      priority:        0.9,
    },
    {
      url:             `${BASE}/en/catalogue`,
      lastModified:    new Date(),
      changeFrequency: 'weekly',
      priority:        0.9,
    },
  ];
}
