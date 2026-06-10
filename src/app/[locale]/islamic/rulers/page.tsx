import type { Metadata } from 'next';
import RulersPage from '@/components/islamic/RulersPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en';
  const isAr = locale === 'ar';
  return {
    title: isAr
      ? 'حكام العملات الإسلامية | أرابيسماتيكا'
      : 'Islamic Coin Rulers | Arabismatica',
    description: isAr
      ? 'قائمة بجميع الحكام الذين وردت أسماؤهم على العملات الإسلامية المسجّلة.'
      : 'All rulers whose names appear on recorded Islamic coins.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/islamic/rulers`,
      languages: {
        ar: `${BASE_URL}/ar/islamic/rulers`,
        en: `${BASE_URL}/en/islamic/rulers`,
        'x-default': `${BASE_URL}/ar/islamic/rulers`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <RulersPage locale={params.locale} />;
}
