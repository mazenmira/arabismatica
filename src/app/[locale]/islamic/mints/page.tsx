import type { Metadata } from 'next';
import MintsPage from '@/components/islamic/MintsPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr   = locale === 'ar';
  const isDe   = locale === 'de';
  return {
    title: isAr
      ? 'دور الضرب الإسلامية — 142 دار ضرب | أرابيزماتيكا'
      : isDe
      ? 'Islamische Münzstätten — 142 Münzstädte | Arabismatica'
      : 'Islamic Coin Mints — 142 Mint Cities | Arabismatica',
    description: isAr
      ? 'جميع دور الضرب الإسلامية مرتبة حسب عدد العملات المسجّلة مع الأسماء العربية والإنجليزية.'
      : isDe
      ? 'Alle islamischen Münzstätten nach Anzahl der erfassten Münzen geordnet, mit arabischen und deutschen Namen.'
      : 'All Islamic mints ranked by number of recorded coins with Arabic and English names.',
    openGraph: { images: [{ url: `${BASE_URL}/og-image.jpg` }] },
    alternates: {
      canonical: `${BASE_URL}/${locale}/islamic/mints`,
      languages: {
        ar: `${BASE_URL}/ar/islamic/mints`,
        en: `${BASE_URL}/en/islamic/mints`,
        de: `${BASE_URL}/de/islamic/mints`,
        'x-default': `${BASE_URL}/ar/islamic/mints`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <MintsPage locale={params.locale} />;
}
