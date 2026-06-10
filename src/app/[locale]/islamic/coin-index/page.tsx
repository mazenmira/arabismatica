import type { Metadata } from 'next';
import CoinIndexPage from '@/components/islamic/CoinIndexPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en';
  const isAr = locale === 'ar';
  return {
    title: isAr
      ? 'فهرس العملات الإسلامية | أرابيسماتيكا'
      : 'Islamic Coin Index | Arabismatica',
    description: isAr
      ? 'فهرس مكثف قابل للتصفية بجميع العملات الإسلامية في قاعدة البيانات.'
      : 'Dense filterable index of all Islamic coins in the Arabismatica database.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/islamic/coin-index`,
      languages: {
        ar: `${BASE_URL}/ar/islamic/coin-index`,
        en: `${BASE_URL}/en/islamic/coin-index`,
        'x-default': `${BASE_URL}/ar/islamic/coin-index`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <CoinIndexPage locale={params.locale} />;
}
