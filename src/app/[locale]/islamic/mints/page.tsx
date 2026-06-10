import type { Metadata } from 'next';
import MintsPage from '@/components/islamic/MintsPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en';
  const isAr = locale === 'ar';
  return {
    title: isAr
      ? 'دور الضرب الإسلامية | أرابيسماتيكا'
      : 'Islamic Coin Mints | Arabismatica',
    description: isAr
      ? 'جميع دور الضرب الإسلامية المرتبة حسب عدد العملات المسجّلة.'
      : 'All Islamic mints ranked by number of recorded coins.',
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
