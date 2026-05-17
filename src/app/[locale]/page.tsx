// src/app/[locale]/catalogue/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import COINS_RAW from '@/data/coins.json';
import type { Coin } from '@/types/coin';
import CoinDetailPage from './CoinDetailPage';

const ALL_COINS = COINS_RAW as unknown as Coin[];

interface Props {
  params: { locale: string; id: string };
}

// ── Static params: pre-build all 4,737 coin pages at deploy time ──────────────
export async function generateStaticParams() {
  const locales = ['ar', 'en'];
  return locales.flatMap(locale =>
    ALL_COINS.map(coin => ({ locale, id: coin.id }))
  );
}

// ── Dynamic metadata per coin ─────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const coin = ALL_COINS.find(c => c.id === params.id);
  if (!coin) return { title: 'Coin Not Found' };

  const isAr  = params.locale === 'ar';
  const name  = isAr ? (coin.nar || coin.name) : coin.name;
  const year  = coin.yce ? ` (${coin.yce})` : '';
  const siteName = isAr ? 'أرابيزماتيكا' : 'Arabismatica';
  const title = `${name}${year} | ${siteName}`;
  const description = isAr
    ? `${name}${year} — ${coin.dyn || ''} — ${coin.metal} — ${coin.km || ''} — المقتني العربي للعملات`
    : `${coin.name}${year} — ${coin.dyn || ''} — ${coin.metal} — ${coin.km || ''} — Arab Coin Catalogue`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: coin.o ? [{ url: coin.o, width: 180, height: 180, alt: name }] : [],
      type: 'website',
      siteName,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: coin.o ? [coin.o] : [],
    },
    alternates: {
      canonical: `https://arabismatica.arabcollector.com/${params.locale}/catalogue/${coin.id}`,
      languages: {
        ar: `https://arabismatica.arabcollector.com/ar/catalogue/${coin.id}`,
        en: `https://arabismatica.arabcollector.com/en/catalogue/${coin.id}`,
      },
    },
  };
}

// ── Page component ─────────────────────────────────────────────────────────────
export default function CoinPage({ params }: Props) {
  const coin = ALL_COINS.find(c => c.id === params.id);
  if (!coin) notFound();
  return <CoinDetailPage coin={coin} locale={params.locale} />;
}
