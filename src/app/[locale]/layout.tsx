import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const BASE_URL = 'https://arabismatica.arabcollector.com';

// generateMetadata runs per-locale, so every page under [locale] gets:
//  • a self-referencing canonical URL
//  • hreflang alternates for both locales + x-default
// Pages that export their own generateMetadata (e.g. page.tsx) will MERGE
// these values — the page-level alternates take precedence.
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale  = params.locale as 'ar' | 'en';
  const pageUrl = `${BASE_URL}/${locale}`;

  return {
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
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
