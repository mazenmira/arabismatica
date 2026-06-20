import type { Metadata } from 'next';
import TimelinePage from '@/components/islamic/TimelinePage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr   = locale === 'ar';
  const isDe   = locale === 'de';
  return {
    title: isAr
      ? 'الجدول الزمني للسلالات الإسلامية | أرابيزماتيكا'
      : isDe
      ? 'Zeitleiste islamischer Dynastien | Arabismatica'
      : 'Islamic Dynasty Timeline | Arabismatica',
    description: isAr
      ? 'الجدول الزمني التفاعلي للسلالات الإسلامية من 41 إلى 923 هـ — اكتشف عملات كل سلالة وحضارتها.'
      : isDe
      ? 'Interaktive Zeitleiste islamischer Dynastien von 41 bis 923 AH — erkunden Sie die Münzen jeder Epoche.'
      : 'Interactive timeline of Islamic dynasties from 41 to 923 AH — explore coins from every era.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/islamic/timeline`,
      languages: {
        ar: `${BASE_URL}/ar/islamic/timeline`,
        en: `${BASE_URL}/en/islamic/timeline`,
        de: `${BASE_URL}/de/islamic/timeline`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <TimelinePage locale={params.locale} />;
}
