import type { Metadata } from 'next';
import DynastiesPage from '@/components/islamic/DynastiesPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en';
  const isAr = locale === 'ar';
  return {
    title: isAr
      ? 'السلالات الإسلامية | أرابيسماتيكا'
      : 'Islamic Coin Dynasties | Arabismatica',
    description: isAr
      ? 'دليل شامل بالسلالات الإسلامية التي أصدرت عملات، مرتبة تاريخياً.'
      : 'A complete chronological index of Islamic dynasties that issued coinage.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/islamic/dynasties`,
      languages: {
        ar: `${BASE_URL}/ar/islamic/dynasties`,
        en: `${BASE_URL}/en/islamic/dynasties`,
        'x-default': `${BASE_URL}/ar/islamic/dynasties`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <DynastiesPage locale={params.locale} />;
}
