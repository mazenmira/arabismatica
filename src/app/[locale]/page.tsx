import { unstable_setRequestLocale } from 'next-intl/server';
import SiteHeader from '@/components/header/SiteHeader';
import CataloguePage from '@/components/catalogue/CataloguePage';

// ISR — revalidate every hour
export const revalidate = 3600;

export default function Home({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return (
    <main className="min-h-screen" style={{ background: 'var(--parch)' }}>
      <SiteHeader locale={locale} />
      <CataloguePage locale={locale} />
    </main>
  );
}
