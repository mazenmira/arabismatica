export const revalidate = 3600;

import type { Metadata } from 'next';
import DelhiPage from '@/components/delhi/DelhiPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr   = locale === 'ar';
  const isDe   = locale === 'de';
  return {
    title: isAr
      ? 'كتالوج عملات سلطنة دلهي — 1206–1526م | أرابيزماتيكا'
      : isDe
      ? 'Delhi-Sultanat-Münzkatalog — 1206–1526 n.Chr. | Arabismatica'
      : 'Delhi Sultanate Coin Catalogue — 1206–1526 CE | Arabismatica',
    description: isAr
      ? 'قاعدة بيانات عملات سلطنة دلهي 1206–1526م. تصفح سلاطين دلهي، دور الضرب، والعملات الذهبية والفضية من الهند الإسلامية.'
      : isDe
      ? 'Delhi-Sultanat-Münzdatenbank mit Münzen 1206–1526 n.Chr. Sultane, Münzstätten und Gold- sowie Silbermünzen aus dem islamischen Indien.'
      : 'Delhi Sultanate coin database with coins from 1206–1526 CE. Browse sultans, mints, gold tankas and silver coins from Islamic India.',
    openGraph: {
      type:   'website',
      url:    `${BASE_URL}/${locale}/delhi`,
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/delhi`,
      languages: {
        ar:          `${BASE_URL}/ar/delhi`,
        en:          `${BASE_URL}/en/delhi`,
        de:          `${BASE_URL}/de/delhi`,
        'x-default': `${BASE_URL}/ar/delhi`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <DelhiPage locale={params.locale} />;
}
