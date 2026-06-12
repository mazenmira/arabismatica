'use client';

import CataloguePage from './CataloguePage';

export default function CataloguePageWrapper({ locale }: { locale: string }) {
  return <CataloguePage locale={locale} />;
}
