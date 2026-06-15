import type { Metadata } from 'next';
import RulersPage from '@/components/sasanian/RulersPage';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'حكام الإمبراطورية الساسانية | أرابيزماتيكا'
      : isDe
      ? 'Sassanidische Herrscher | Arabismatica'
      : 'Sasanian Rulers | Arabismatica',
    description: isAr
      ? 'قائمة حكام الإمبراطورية الساسانية مع عملاتهم — 7,995 عملة من 224 إلى 651م'
      : isDe
      ? 'Liste der sassanidischen Herrscher mit ihren Münzen — 7.995 Münzen von 224 bis 651 n.Chr.'
      : 'List of Sasanian rulers with their coins — 7,995 coins from 224 to 651 CE',
    alternates: {
      canonical: `${BASE_URL}/${locale}/sasanian/rulers`,
      languages: {
        ar: `${BASE_URL}/ar/sasanian/rulers`,
        en: `${BASE_URL}/en/sasanian/rulers`,
        de: `${BASE_URL}/de/sasanian/rulers`,
        'x-default': `${BASE_URL}/ar/sasanian/rulers`,
      },
    },
  };
}

export default function Page({ params }: { params: { locale: string } }) {
  return <RulersPage locale={params.locale} />;
}
