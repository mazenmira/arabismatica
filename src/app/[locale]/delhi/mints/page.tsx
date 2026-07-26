export const revalidate = 3600;

import type { Metadata } from 'next';
import DelhiMintsPage from '@/components/delhi/MintsPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'دور ضرب سلطنة دلهي | أرابيزماتيكا'
      : isDe
      ? 'Delhi-Sultanat-Münzstätten | Arabismatica'
      : 'Delhi Sultanate Mint Cities | Arabismatica',
    description: isAr
      ? 'دور ضرب سلطنة دلهي — تصفح مدن الضرب من 1206 إلى 1526م'
      : isDe
      ? 'Delhi-Sultanat-Münzstätten — Städte, in denen Münzen von 1206 bis 1526 n.Chr. geprägt wurden'
      : 'Delhi Sultanate mint cities — browse cities where coins were struck from 1206 to 1526 CE',
    alternates: {
      canonical: `${BASE_URL}/${locale}/delhi/mints`,
      languages: {
        ar: `${BASE_URL}/ar/delhi/mints`,
        en: `${BASE_URL}/en/delhi/mints`,
        de: `${BASE_URL}/de/delhi/mints`,
        'x-default': `${BASE_URL}/ar/delhi/mints`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <DelhiMintsPage locale={params.locale} />;
}
