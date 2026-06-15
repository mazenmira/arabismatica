import type { Metadata } from 'next';
import MintsPage from '@/components/sasanian/MintsPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'دور ضرب العملات الساسانية | أرابيزماتيكا'
      : isDe
      ? 'Sassanidische Münzstätten | Arabismatica'
      : 'Sasanian Mint Cities | Arabismatica',
    description: isAr
      ? 'دور ضرب العملات الساسانية — تصفح المدن التي سُكت فيها العملات من 224 إلى 651م'
      : isDe
      ? 'Sassanidische Münzstätten — durchsuche Städte, in denen Münzen von 224 bis 651 n.Chr. geprägt wurden'
      : 'Sasanian mint cities — browse cities where coins were struck from 224 to 651 CE',
    alternates: {
      canonical: `${BASE_URL}/${locale}/sasanian/mints`,
      languages: {
        ar: `${BASE_URL}/ar/sasanian/mints`,
        en: `${BASE_URL}/en/sasanian/mints`,
        de: `${BASE_URL}/de/sasanian/mints`,
        'x-default': `${BASE_URL}/ar/sasanian/mints`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <MintsPage locale={params.locale} />;
}
