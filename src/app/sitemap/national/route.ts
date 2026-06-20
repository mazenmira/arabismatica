// src/app/sitemap/national/route.ts
export const dynamic = 'force-dynamic';

import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';

const ALL_COINS = COINS_RAW as unknown as Coin[];
const BASE      = 'https://arabismatica.arabcollector.com';
const LOCALES   = ['ar', 'en'];

export async function GET() {
  const nationalCoins = ALL_COINS.filter(c => c.cc !== 'IS');

  const urls = LOCALES.flatMap(locale =>
    nationalCoins.map(coin => `
    <url>
      <loc>${BASE}/${locale}/catalogue/${coin.id}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.75</priority>
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
