'use client';

import CatalogueShell from '@/components/layout/CatalogueShell';
import type { ShellNavItem } from '@/components/layout/CatalogueShell';

const NAV_ITEMS: ShellNavItem[] = [
  { labelAr: 'الكتالوج',  labelEn: 'Catalogue', href: '' },
  { labelAr: 'الحكام',    labelEn: 'Rulers',    href: '/rulers' },
  { labelAr: 'دور الضرب', labelEn: 'Mints',     href: '/mints' },
];

export default function DelhiShellWrapper({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  const base = `/${locale}/delhi`;

  const heroTitle = isAr
    ? 'عملات سلطنة دلهي'
    : isDe
    ? 'Delhi-Sultanat-Münzen'
    : 'Delhi Sultanate Coins';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    href: `${base}${item.href}`,
  }));

  return (
    <CatalogueShell
      catalogueId="delhi"
      locale={locale}
      heroSize="compact"
      heroTitle={heroTitle}
      heroSubtitle={isAr ? 'سلطنة دلهي · 1206–1526م' : isDe ? 'Delhi-Sultanat · 1206–1526 n.Chr.' : 'Delhi Sultanate · 1206–1526 CE'}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
