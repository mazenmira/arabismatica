import type { Metadata } from 'next';
import MughalRulersPage from '@/components/mughal/RulersPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'حكام الإمبراطورية المغولية | أرابيزماتيكا'
      : isDe
      ? 'Mogulreichherrscher | Arabismatica'
      : 'Mughal Empire Rulers | Arabismatica',
    description: isAr
      ? 'قائمة حكام الإمبراطورية المغولية مع عملاتهم — 1526 إلى 1857م'
      : isDe
      ? 'Liste der Mogulreichherrscher mit ihren Münzen — 1526 bis 1857 n.Chr.'
      : 'List of Mughal Empire rulers with their coins — 1526 to 1857 CE',
    alternates: {
      canonical: `${BASE_URL}/${locale}/mughal/rulers`,
      languages: {
        ar: `${BASE_URL}/ar/mughal/rulers`,
        en: `${BASE_URL}/en/mughal/rulers`,
        de: `${BASE_URL}/de/mughal/rulers`,
        'x-default': `${BASE_URL}/ar/mughal/rulers`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <MughalRulersPage locale={params.locale} />;
}
