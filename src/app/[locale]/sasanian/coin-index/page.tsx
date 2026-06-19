import type { Metadata } from 'next';
import SasanianCoinIndexPage from '@/components/sasanian/CoinIndexPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'فهرس العملات الساسانية | أرابيزماتيكا'
      : isDe
      ? 'Sassanidischer Münzindex | Arabismatica'
      : 'Sasanian Coin Index | Arabismatica',
    description: isAr
      ? 'فهرس شامل بجميع العملات الساسانية مع إمكانية التصفية حسب الحاكم ودار الضرب والمعدن'
      : isDe
      ? 'Umfassender Index aller sassanidischen Münzen mit Filtermöglichkeiten'
      : 'Comprehensive index of all Sasanian coins with filtering by ruler, mint, and metal',
    alternates: {
      canonical: `${BASE_URL}/${locale}/sasanian/coin-index`,
      languages: {
        ar: `${BASE_URL}/ar/sasanian/coin-index`,
        en: `${BASE_URL}/en/sasanian/coin-index`,
        de: `${BASE_URL}/de/sasanian/coin-index`,
        'x-default': `${BASE_URL}/ar/sasanian/coin-index`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <SasanianCoinIndexPage locale={params.locale} />;
}
