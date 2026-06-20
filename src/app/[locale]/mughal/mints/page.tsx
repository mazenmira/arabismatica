import type { Metadata } from 'next';
import MughalMintsPage from '@/components/mughal/MintsPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'دور ضرب العملات المغولية | أرابيزماتيكا'
      : isDe
      ? 'Mogulreich-Münzstätten | Arabismatica'
      : 'Mughal Empire Mint Cities | Arabismatica',
    description: isAr
      ? 'دور ضرب العملات المغولية — تصفح مدن الضرب من 1526 إلى 1857م'
      : isDe
      ? 'Mogulreich-Münzstätten — Städte, in denen Münzen von 1526 bis 1857 n.Chr. geprägt wurden'
      : 'Mughal Empire mint cities — browse cities where coins were struck from 1526 to 1857 CE',
    alternates: {
      canonical: `${BASE_URL}/${locale}/mughal/mints`,
      languages: {
        ar: `${BASE_URL}/ar/mughal/mints`,
        en: `${BASE_URL}/en/mughal/mints`,
        de: `${BASE_URL}/de/mughal/mints`,
        'x-default': `${BASE_URL}/ar/mughal/mints`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <MughalMintsPage locale={params.locale} />;
}
