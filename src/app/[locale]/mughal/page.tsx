export const revalidate = 3600;

import type { Metadata } from 'next';
import MughalPage from '@/components/mughal/MughalPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr   = locale === 'ar';
  const isDe   = locale === 'de';
  return {
    title: isAr
      ? 'كتالوج العملات المغولية — الإمبراطورية المغولية 1526–1857م | أرابيزماتيكا'
      : isDe
      ? 'Mogulreichmünzen-Katalog — 1526–1857 n.Chr. | Arabismatica'
      : 'Mughal Empire Coin Catalogue — 1526–1857 CE | Arabismatica',
    description: isAr
      ? 'قاعدة بيانات العملات المغولية من الإمبراطورية المغولية الهندية 1526–1857م. تصفح مغولي ملوك، دور الضرب، والعملات الذهبية والفضية.'
      : isDe
      ? 'Mogulreich-Münzdatenbank mit Münzen aus dem indischen Mogulreich 1526–1857 n.Chr. Herrscher, Münzstätten und Gold- sowie Silbermünzen.'
      : 'Mughal Empire coin database with coins from 1526–1857 CE. Browse Mughal rulers, mints, gold mohurs and silver rupees.',
    openGraph: {
      type:   'website',
      url:    `${BASE_URL}/${locale}/mughal`,
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/mughal`,
      languages: {
        ar:          `${BASE_URL}/ar/mughal`,
        en:          `${BASE_URL}/en/mughal`,
        de:          `${BASE_URL}/de/mughal`,
        'x-default': `${BASE_URL}/ar/mughal`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <MughalPage locale={params.locale} />;
}
