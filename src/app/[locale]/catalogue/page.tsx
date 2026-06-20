export const revalidate = 3600;

import type { Metadata } from 'next';
import CataloguePage from '@/components/catalogue/CataloguePage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';

  const title = isAr
    ? 'كتالوج العملات العربية الحديثة | أرابيزماتيكا'
    : isDe
    ? 'Moderner arabischer Münzkatalog | Arabismatica'
    : 'Modern Arab Coin Catalogue | Arabismatica';

  const description = isAr
    ? '5,505 عملة عربية حديثة من 20 دولة عربية — مصر، المغرب، السعودية والمزيد. ابحث وصفّح بالحقبة والمعدن والدولة.'
    : isDe
    ? '5.505 moderne arabische Münzen aus 20 arabischen Ländern — Ägypten, Marokko, Saudi-Arabien und mehr.'
    : '5,505 modern Arab coins from 20 countries — Egypt, Morocco, Saudi Arabia and more. Browse by era, metal, and country.';

  return {
    title,
    description,
    openGraph: {
      images: [{ url: `${BASE_URL}/og-image.jpg` }],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/catalogue`,
      languages: {
        ar: `${BASE_URL}/ar/catalogue`,
        en: `${BASE_URL}/en/catalogue`,
        de: `${BASE_URL}/de/catalogue`,
        'x-default': `${BASE_URL}/ar/catalogue`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <CataloguePage locale={params.locale} />;
}
