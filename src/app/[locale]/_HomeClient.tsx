'use client';

import SiteHeader from '@/components/header/SiteHeader';
import CataloguePage from '@/components/catalogue/CataloguePage';

export default function HomeClient({ locale }: { locale: string }) {
  return (
    <main className="min-h-screen" style={{ background: 'var(--parch)' }}>
      <SiteHeader locale={locale} />
      <CataloguePage locale={locale} />
    </main>
  );
}
