import type { Metadata } from 'next';
import DelhiRulersPage from '@/components/delhi/RulersPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'سلاطين دلهي | أرابيزماتيكا'
      : isDe
      ? 'Sultane von Delhi | Arabismatica'
      : 'Sultans of Delhi | Arabismatica',
    description: isAr
      ? 'قائمة سلاطين دلهي مع عملاتهم — 1206 إلى 1526م'
      : isDe
      ? 'Liste der Sultane von Delhi mit ihren Münzen — 1206 bis 1526 n.Chr.'
      : 'List of Delhi Sultans with their coins — 1206 to 1526 CE',
    alternates: {
      canonical: `${BASE_URL}/${locale}/delhi/rulers`,
      languages: {
        ar: `${BASE_URL}/ar/delhi/rulers`,
        en: `${BASE_URL}/en/delhi/rulers`,
        de: `${BASE_URL}/de/delhi/rulers`,
        'x-default': `${BASE_URL}/ar/delhi/rulers`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <DelhiRulersPage locale={params.locale} />;
}
