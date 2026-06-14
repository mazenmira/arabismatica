import type { Metadata } from 'next';
import SasanianPage from '@/components/sasanian/SasanianPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr   = locale === 'ar';
  const isDe   = locale === 'de';
  return {
    title: isAr
      ? 'كتالوج العملات الساسانية — فارس القديمة 224–651م | أرابيزماتيكا'
      : isDe
      ? 'Sassanidischer Münzkatalog — Antikes Persien 224–651 n.Chr. | Arabismatica'
      : 'Sasanian Coin Catalogue — Ancient Persia 224–651 CE | Arabismatica',
    description: isAr
      ? 'قاعدة بيانات العملات الساسانية تضم 7,995 عملة من الإمبراطورية الساسانية الفارسية 224–651م. تصفح الأكاسرة والملوك الساسانيين.'
      : isDe
      ? 'Die sassanidische Münzdatenbank mit 7.995 Münzen aus dem persischen Sassanidenreich 224–651 n.Chr. Durchsuche sassanidische Könige und Münzstätten.'
      : 'Sasanian coin database with 7,995 coins from the Persian Sasanian Empire 224–651 CE. Browse Sasanian kings, mints, and silver drachms.',
    keywords: isAr
      ? 'عملات ساسانية، عملات فارسية، نمسماتيا ساسانية، درهم ساساني، الإمبراطورية الساسانية، عملات ما قبل الإسلام'
      : isDe
      ? 'sassanidische Münzen, persische Münzen, sassanidische Numismatik, sassanidische Drachmen, Sassanidenreich'
      : 'Sasanian coins, Persian coins, Sassanid coins, Sasanian drachms, Sasanian Empire numismatics, pre-Islamic coins',
    openGraph: {
      type:   'website',
      url:    `${BASE_URL}/${locale}/sasanian`,
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/sasanian`,
      languages: {
        ar:          `${BASE_URL}/ar/sasanian`,
        en:          `${BASE_URL}/en/sasanian`,
        de:          `${BASE_URL}/de/sasanian`,
        'x-default': `${BASE_URL}/ar/sasanian`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <SasanianPage locale={params.locale} />;
}
