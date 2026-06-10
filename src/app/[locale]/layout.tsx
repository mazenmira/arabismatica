import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale  = params.locale as 'ar' | 'en';
  const isAr    = locale === 'ar';
  const pageUrl = `${BASE_URL}/${locale}`;

  return {
    title: isAr
      ? 'أرابيزماتيكا — كتالوج العملات العربية والإسلامية'
      : 'Arabismatica — Arab & Islamic Coin Catalogue',
    description: isAr
      ? 'أشمل كتالوج إلكتروني للعملات العربية والإسلامية. تصفح 52,808 عملة من الدولة الأموية والعباسية والفاطمية والمماليك و20 دولة عربية. تعرف على عملتك مجاناً.'
      : 'The most comprehensive online catalogue of Arab and Islamic coins. Browse 52,808 coins from Umayyad, Abbasid, Fatimid, Mamluk dynasties and 20 Arab countries. Free coin identification and price guide.',
    keywords: isAr
      ? 'عملات عربية، عملات إسلامية، نمسماتيا عربية، دراهم أموية، دنانير عباسية، عملات فاطمية، عملات مملوكية، عملات مصرية، عملات سعودية، كتالوج عملات، تقييم عملات'
      : 'Arab coins, Islamic coins, Arabic numismatics, Umayyad coins, Abbasid coins, Fatimid gold dinar, Mamluk coins, Egyptian coins, Saudi coins, coin catalogue, coin identification, Arab coin values, Islamic numismatics',
    openGraph: {
      type: 'website',
      url: pageUrl,
      siteName: 'Arabismatica',
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`${BASE_URL}/og-image.jpg`],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        'ar':        `${BASE_URL}/ar`,
        'en':        `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/ar`,
      },
    },
  };
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Arabismatica',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/en?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as 'ar' | 'en')) {
    notFound();
  }
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="alternate" hrefLang="ar"        href={`${BASE_URL}/ar`} />
        <link rel="alternate" hrefLang="en"        href={`${BASE_URL}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/ar`} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
