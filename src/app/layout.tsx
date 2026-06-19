import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arabismatica · أرابيزماتيكا — Digital Encyclopaedia of Arab & Islamic Coins',
  description:
    'Arabismatica is the most comprehensive online catalogue of Arab coins, covering 19 Arab countries from 1500 to the present day. Search 4,700+ coins by name, KM number, metal, dynasty, and year. Free price guide, grading tools, and collector resources.',
  keywords: [
    'Arab coins', 'Islamic coins', 'coin catalogue', 'numismatics', 'Arab collector',
    'عملات عربية', 'كتالوج العملات', 'عملات إسلامية', 'أرابيزماتيكا', 'المقتني العربي',
    'Egyptian coins', 'Saudi coins', 'UAE coins', 'Moroccan coins', 'coin grading',
    'KM coins', 'coin price guide', 'rare Arab coins', 'Ottoman coins', 'Gulf coins',
  ],
  authors: [{ name: 'The Arab Collector', url: 'https://arabcollector.com' }],
  creator: 'The Arab Collector',
  publisher: 'Arabismatica',
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    alternateLocale: 'en_US',
    url: 'https://arabismatica.arabcollector.com',
    siteName: 'Arabismatica | أرابيزماتيكا',
    title: 'Arabismatica · أرابيزماتيكا — Digital Encyclopaedia of Arab & Islamic Coins',
    description:
      'The most comprehensive catalogue of Arab and Islamic coins. 4,700+ coins from 19 Arab countries, with price guides, grading tools, and collector resources.',
    images: [
      {
        url: 'https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png',
        width: 800,
        height: 400,
        alt: 'Arabismatica — The Arab Coin Catalogue',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arabismatica — Digital Encyclopaedia of Arab & Islamic Coins',
    description: 'Explore 60,803+ Arab, Islamic and Sasanian coins. Free identification, price guide, and collector resources.',
    images: ['https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png'],
    creator: '@ArabCollector',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  verification: {
    google: 'FJoYVJeXodhSwEHl68oXJwO2Yqge0DlfiD2NEKbpQYE',
  },
  // Root layout does NOT set a canonical — each [locale]/page.tsx sets its own
  // self-referencing canonical via generateMetadata to avoid GSC duplicate warnings.
  alternates: {
    languages: {
      'ar':        'https://arabismatica.arabcollector.com/ar',
      'en':        'https://arabismatica.arabcollector.com/en',
      'x-default': 'https://arabismatica.arabcollector.com/ar',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* Favicon */}
        <link
          rel="icon"
          type="image/png"
          href="https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png"
        />
        <link
          rel="apple-touch-icon"
          href="https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png"
        />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Arabismatica',
              alternateName: 'أرابيزماتيكا',
              url: 'https://arabismatica.arabcollector.com',
              description: 'The most comprehensive catalogue of Arab and Islamic coins covering 19 Arab countries from 1500 to the present day.',
              publisher: {
                '@type': 'Organization',
                name: 'The Arab Collector',
                url: 'https://arabcollector.com',
                logo: 'https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://arabismatica.arabcollector.com/en?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body style={{ fontFamily: "'Cairo', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
