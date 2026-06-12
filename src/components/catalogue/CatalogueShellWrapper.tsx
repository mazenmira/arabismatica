'use client';

import CatalogueShell from '@/components/layout/CatalogueShell';
import type { ShellNavItem } from '@/components/layout/CatalogueShell';

const NAV_ITEMS: ShellNavItem[] = [
  { labelAr: 'الكتالوج',      labelEn: 'Catalogue',     href: '' },
  { labelAr: 'حسب الدولة',   labelEn: 'By Country',    href: '/countries' },
];

export default function CatalogueShellWrapper({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const isAr     = locale === 'ar';
  const isDe     = locale === 'de';
  const base     = `/${locale}/catalogue`;
  const heroSize = 'compact';

  const heroTitle = isAr
    ? 'العملات العربية الحديثة'
    : isDe
    ? 'Moderne arabische Münzen'
    : 'Modern Arab Coins';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    href: `${base}${item.href}`,
  }));

  return (
    <CatalogueShell
      catalogueId="arab"
      locale={locale}
      heroSize={heroSize}
      heroTitle={heroTitle}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
