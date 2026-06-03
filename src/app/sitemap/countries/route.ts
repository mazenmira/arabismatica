// src/app/sitemap/countries/route.ts
import { COUNTRY_META } from '@/lib/countries';

const BASE    = 'https://arabismatica.arabcollector.com';
const LOCALES = ['ar', 'en'];

export async function GET() {
  const urls = LOCALES.flatMap(locale =>
    COUNTRY_META.map(c => `
    <url>
      <loc>${BASE}/${locale}/country/${c.slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.85</priority>
    </url>`)
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400' },
  });
}
