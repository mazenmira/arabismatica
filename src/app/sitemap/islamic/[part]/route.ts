// src/app/sitemap/islamic/[part]/route.ts
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';

const ALL_COINS    = COINS_RAW as unknown as Coin[];
const BASE         = 'https://arabismatica.arabcollector.com';
const LOCALES      = ['ar', 'en'];
const CHUNK_SIZE   = 15000; // ~15k coins per part keeps XML under 5MB

export async function generateStaticParams() {
  const islamicCoins = ALL_COINS.filter(c => c.cc === 'IS');
  const parts = Math.ceil(islamicCoins.length / CHUNK_SIZE);
  return Array.from({ length: parts }, (_, i) => ({ part: String(i + 1) }));
}

export async function GET(
  _req: Request,
  { params }: { params: { part: string } }
) {
  const islamicCoins = ALL_COINS.filter(c => c.cc === 'IS');
  const partNum  = parseInt(params.part) - 1;
  const chunk    = islamicCoins.slice(partNum * CHUNK_SIZE, (partNum + 1) * CHUNK_SIZE);

  if (chunk.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  const urls = LOCALES.flatMap(locale =>
    chunk.map(coin => `
    <url>
      <loc>${BASE}/${locale}/catalogue/${coin.id}</loc>
      <changefreq>monthly</changefreq>
      <priority>0.65</priority>
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
