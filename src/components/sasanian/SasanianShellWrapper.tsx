'use client';

import CatalogueShell from '@/components/layout/CatalogueShell';
import type { ShellNavItem } from '@/components/layout/CatalogueShell';

const NAV_ITEMS: ShellNavItem[] = [
  { labelAr: 'الكتالوج',    labelEn: 'Catalogue',  href: '' },
  { labelAr: 'الحكام',      labelEn: 'Rulers',     href: '/rulers' },
  { labelAr: 'دور الضرب',   labelEn: 'Mints',      href: '/mints' },
  { labelAr: 'فهرس العملات', labelEn: 'Coin Index', href: '/coin-index' },
];

export default function SasanianShellWrapper({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  const base = `/${locale}/sasanian`;

  const heroTitle = isAr
    ? 'العملات الساسانية'
    : isDe
    ? 'Sassanidische Münzen'
    : 'Sasanian Coins';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    href: `${base}${item.href}`,
  }));

  return (
    <CatalogueShell
      catalogueId="sasanian"
      locale={locale}
      heroSize="compact"
      heroTitle={heroTitle}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
