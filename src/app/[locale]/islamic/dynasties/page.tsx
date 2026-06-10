import type { Metadata } from 'next';
import DynastiesPage from '@/components/islamic/DynastiesPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en';
  const isAr   = locale === 'ar';
  return {
    title: isAr
      ? 'السلالات الإسلامية — دليل شامل | أرابيزماتيكا'
      : 'Islamic Coin Dynasties — Complete Index | Arabismatica',
    description: isAr
      ? 'دليل شامل بجميع السلالات والخلافات الإسلامية مرتبة زمنياً مع عدد العملات والحكام لكل سلالة.'
      : 'Complete chronological index of all Islamic dynasties and caliphates with coin counts and ruler lists.',
    openGraph: { images: [{ url: `${BASE_URL}/og-image.jpg` }] },
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
