import type { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRY_META } from '@/lib/countries';

const BASE_URL = 'https://arabismatica.arabcollector.com';

export async function generateMetadata(
  { params }: { params: { locale: string } }
): Promise<Metadata> {
  const locale = params.locale as 'ar' | 'en' | 'de';
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  return {
    title: isAr
      ? 'العملات حسب الدولة — 20 دولة عربية | أرابيزماتيكا'
      : isDe
      ? 'Münzen nach Land — 20 arabische Länder | Arabismatica'
      : 'Coins by Country — 20 Arab Countries | Arabismatica',
    description: isAr
      ? 'تصفح مجموعة العملات العربية الحديثة مرتبة حسب الدولة — مصر والمغرب وتونس وسائر الدول العربية.'
      : isDe
      ? 'Durchsuche die moderne arabische Münzsammlung nach Land — Ägypten, Marokko, Tunesien und mehr.'
      : 'Browse the modern Arab coin collection by country — Egypt, Morocco, Tunisia and more.',
    alternates: {
      canonical: `${BASE_URL}/${locale}/catalogue/countries`,
      languages: {
        ar: `${BASE_URL}/ar/catalogue/countries`,
        en: `${BASE_URL}/en/catalogue/countries`,
        de: `${BASE_URL}/de/catalogue/countries`,
        'x-default': `${BASE_URL}/ar/catalogue/countries`,
      },
    },
  };
}

const COUNTRY_FLAGS: Record<string, string> = {
  EG:'🇪🇬', MA:'🇲🇦', TN:'🇹🇳', SA:'🇸🇦', IQ:'🇮🇶', AE:'🇦🇪', OM:'🇴🇲',
  LY:'🇱🇾', DZ:'🇩🇿', SY:'🇸🇾', JO:'🇯🇴', LB:'🇱🇧', KW:'🇰🇼', QA:'🇶🇦',
  SD:'🇸🇩', YE:'🇾🇪', MR:'🇲🇷', PS:'🇵🇸', QD:'🏳', KM:'🇰🇲',
};

const COIN_COUNTS: Record<string, number> = {
  EG: 1186, MA: 1120, TN: 858, YE: 270, OM: 255, SD: 228,
  LY: 202, IQ: 195, DZ: 178, AE: 163, QA: 136, JO: 130,
  SA: 126, LB: 114, KW: 98, KM: 34, MR: 20, PS: 14, QD: 5,
};

export default function CountriesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  const isAr   = locale === 'ar';
  const isDe   = locale === 'de';

  const sorted = [...COUNTRY_META]
    .filter(c => c.cc !== 'IS' && c.cc !== 'QD')
    .sort((a, b) => (COIN_COUNTS[b.cc] ?? 0) - (COIN_COUNTS[a.cc] ?? 0));

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="font-amiri text-2xl text-ink mb-1">
        {isAr ? 'العملات حسب الدولة' : isDe ? 'Münzen nach Land' : 'Coins by Country'}
      </h1>
      <p className="text-[13px] text-ink/50 mb-6">
        {isAr ? '20 دولة عربية · 5,505 عملة' : isDe ? '20 arabische Länder · 5.505 Münzen' : '20 Arab countries · 5,505 coins'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sorted.map(country => {
          const count = COIN_COUNTS[country.cc] ?? 0;
          const name  = isAr ? country.co_ar : country.co;
          const flag  = COUNTRY_FLAGS[country.cc] ?? '🏳';
          return (
            <Link
              key={country.cc}
              href={`/${locale}/country/${country.slug}`}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-gold-700/20 bg-parch-cream hover:border-gold-500 hover:shadow-md transition-all text-center"
            >
              <span className="text-3xl">{flag}</span>
              <span className="font-amiri text-[14px] text-ink leading-tight">{name}</span>
              <span className="text-[11px] text-gold-600 font-medium">
                {count.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {isAr ? 'عملة' : isDe ? 'Münzen' : 'coins'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
