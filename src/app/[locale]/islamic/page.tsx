import type { Metadata } from 'next';
import IslamicPage from '@/components/islamic/IslamicPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en';
  const isAr   = locale === 'ar';
  return {
    title: isAr
      ? 'كتالوج العملات الإسلامية — أموية عباسية فاطمية مملوكية | أرابيزماتيكا'
      : 'Islamic Coin Catalogue — Umayyad, Abbasid, Fatimid, Mamluk | Arabismatica',
    description: isAr
      ? 'أكبر قاعدة بيانات للعملات الإسلامية تضم 47,303 عملة من 18 سلالة وخلافة. تصفح الأمويين والعباسيين والفاطميين والمماليك والسامانيين وسواهم.'
      : 'The largest Islamic coin database with 47,303 coins from 18 dynasties. Browse Umayyad, Abbasid, Fatimid, Mamluk, Samanid and more.',
    keywords: isAr
      ? 'عملات إسلامية، دراهم أموية، دنانير عباسية، عملات فاطمية، عملات مملوكية، نمسماتيا إسلامية، العملات القديمة'
      : 'Islamic coins, Umayyad dirhams, Abbasid dinars, Fatimid coins, Mamluk coins, Islamic numismatics, ancient Arab coins',
    openGraph: {
      type:   'website',
      url:    `${BASE_URL}/${locale}/islamic`,
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/islamic`,
      languages: {
        ar:          `${BASE_URL}/ar/islamic`,
        en:          `${BASE_URL}/en/islamic`,
        'x-default': `${BASE_URL}/ar/islamic`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <IslamicPage locale={params.locale} />;
}
