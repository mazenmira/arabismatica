// src/app/[locale]/mughal/[id]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 86400;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Coin } from '@/types/coin';
import CoinDetailPage from '@/app/[locale]/catalogue/[id]/CoinDetailPage';
import { getCoinById } from '@/lib/coinsApi';

interface Props {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getCoinById(params.id);
  if (!row || row.cc !== 'MG') return { title: 'Coin Not Found' };

  const isAr = params.locale === 'ar';
  const name = isAr ? (row.nar || row.name) : row.name;
  const year = row.yce ? ` (${row.yce})` : '';
  const siteName = isAr ? 'أرابيزماتيكا' : 'Arabismatica';
  const title = `${name}${year} | ${siteName}`;
  const description = isAr
    ? `${name}${year} — ${row.dyn || ''} — ${row.metal} — أرابيزماتيكا`
    : `${name}${year} — ${row.dyn || ''} — ${row.metal} — Arabismatica`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: row.o ? [{ url: row.o, width: 180, height: 180, alt: name }] : [],
      type: 'website',
      siteName,
    },
    alternates: {
      canonical: `https://arabismatica.arabcollector.com/${params.locale}/mughal/${row.id}`,
      languages: {
        ar: `https://arabismatica.arabcollector.com/ar/mughal/${row.id}`,
        en: `https://arabismatica.arabcollector.com/en/mughal/${row.id}`,
      },
    },
  };
}

export default async function MughalCoinPage({ params }: Props) {
  const row = await getCoinById(params.id);
  if (!row || row.cc !== 'MG') notFound();
  return <CoinDetailPage coin={row as unknown as Coin} locale={params.locale} />;
}
