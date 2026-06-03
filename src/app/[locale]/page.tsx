// v3.0 — server component; client logic lives in _HomeClient.tsx
import type { Metadata } from 'next';
import HomeClient from './_HomeClient';

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL   = 'https://arabismatica.arabcollector.com';
const OG_IMAGE   = 'https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png';
const COIN_COUNT = '27,900+'; // updated periodically; avoids importing the 18 MB JSON at build time

const TITLES = {
  en: 'Arabismatica — The Arab & Islamic Coin Catalogue',
  ar: 'أرابيزماتيكا — كتالوج العملات العربية والإسلامية',
} as const;

const DESCRIPTIONS = {
  en: `Browse ${COIN_COUNT} Arab and Islamic coins from the Umayyad Caliphate to modern Arab states. Free catalogue with photos, weights, dates, and dynasty filters. The most complete Islamic numismatics resource online.`,
  ar:  `تصفّح أكثر من ${COIN_COUNT} عملة عربية وإسلامية — من الدولة الأموية حتى دول الخليج الحديثة. كتالوج مجاني بالصور والأوزان والتواريخ وفلاتر الأسرات الحاكمة.`,
} as const;

// ── generateMetadata ──────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale  = (params.locale === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const pageUrl = `${BASE_URL}/${locale}`;
  const altUrl  = `${BASE_URL}/${locale === 'ar' ? 'en' : 'ar'}`;

  const title       = TITLES[locale];
  const description = DESCRIPTIONS[locale];

  return {
    title,
    description,

    // ── Canonical + hreflang alternates ────────────────────────────────────
    alternates: {
      canonical: pageUrl,
      languages: {
        'ar':    `${BASE_URL}/ar`,
        'en':    `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/ar`,   // Arabic as default — primary audience
      },
    },

    // ── OpenGraph ──────────────────────────────────────────────────────────
    openGraph: {
      type:            'website',
      url:             pageUrl,
      siteName:        'Arabismatica | أرابيزماتيكا',
      locale:          locale === 'ar' ? 'ar_AR' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US'  : 'ar_AR',
      title,
      description,
      images: [
        {
          url:    OG_IMAGE,
          width:  800,
          height: 400,
          alt:    'Arabismatica — The Arab & Islamic Coin Catalogue',
        },
      ],
    },

    // ── Twitter / X card ───────────────────────────────────────────────────
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [OG_IMAGE],
      creator:     '@ArabCollector',
    },

    // ── Robots ─────────────────────────────────────────────────────────────
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:               true,
        follow:              true,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return <HomeClient locale={locale} />;
}
