// src/app/[locale]/country/[slug]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 86400;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';
import { COUNTRY_META_BY_SLUG } from '@/lib/countries';
import CountryPage from '@/components/country/CountryPage';

const ALL_COINS = COINS_RAW as unknown as Coin[];

interface Props {
  params: { locale: string; slug: string };
}

// ── SEO metadata per country ───────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const meta = COUNTRY_META_BY_SLUG[params.slug];
  if (!meta) return { title: 'Country Not Found' };

  const isAr = params.locale === 'ar';
  const coins = ALL_COINS.filter(c => c.cc === meta.cc);
  const years = coins.map(c => parseInt(c.yce)).filter(y => !isNaN(y));
  const yearMin = years.length ? Math.min(...years) : 0;
  const yearMax = years.length ? Math.max(...years) : 0;

  const countryName = isAr ? meta.co_ar : meta.co;
  const siteName    = isAr ? 'أرابيزماتيكا' : 'Arabismatica';

  const title = isAr
    ? `عملات ${countryName} — ${coins.length} عملة (${yearMin}–${yearMax}) | ${siteName}`
    : `${countryName} Coin Catalogue — ${coins.length} Coins (${yearMin}–${yearMax}) | ${siteName}`;

  const description = isAr
    ? `كتالوج شامل لـ ${coins.length} عملة من ${countryName} يمتد من ${yearMin} إلى ${yearMax}م. مع أسعار ومعلومات عن الندرة والأسرات الحاكمة.`
    : `Complete catalogue of ${coins.length} ${countryName} coins spanning ${yearMin}–${yearMax}. Includes prices, rarity grades, dynasty breakdowns, and mintage data.`;

  const canonical = `https://arabismatica.arabcollector.com/${params.locale}/country/${meta.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName,
      url: canonical,
    },
    twitter: { card: 'summary', title, description },
    alternates: {
      canonical,
      languages: {
        ar: `https://arabismatica.arabcollector.com/ar/country/${meta.slug}`,
        en: `https://arabismatica.arabcollector.com/en/country/${meta.slug}`,
      },
    },
  };
}

// ── Page component ─────────────────────────────────────────────────────────
export default function CountryRoute({ params }: Props) {
  const meta = COUNTRY_META_BY_SLUG[params.slug];
  if (!meta) notFound();

  const coins = ALL_COINS.filter(c => c.cc === meta.cc);
  return <CountryPage meta={meta} coins={coins} locale={params.locale} />;
}
