import type { Metadata } from 'next';
import MintsPage from '@/components/islamic/MintsPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en';
  const isAr   = locale === 'ar';
  return {
    title: isAr
      ? 'دور الضرب الإسلامية — 142 دار ضرب | أرابيزماتيكا'
      : 'Islamic Coin Mints — 142 Mint Cities | Arabismatica',
    description: isAr
      ? 'جميع دور الضرب الإسلامية مرتبة حسب عدد العملات المسجّلة مع الأسماء العربية والإنجليزية.'
      : 'All Islamic mints ranked by number of recorded coins with Arabic and English names.',
    openGraph: { images: [{ url: `${BASE_URL}/og-image.jpg` }] },
    alternates: {
      canonical: `${BASE_URL}/${locale}/islamic/mints`,
      languages: {
        ar: `${BASE_URL}/ar/islamic/mints`,
        en: `${BASE_URL}/en/islamic/mints`,
        'x-default': `${BASE_URL}/ar/islamic/mints`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <MintsPage locale={params.locale} />;
}
