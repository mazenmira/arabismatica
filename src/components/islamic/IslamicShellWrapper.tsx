'use client';

import CatalogueShell from '@/components/layout/CatalogueShell';
import type { ShellNavItem } from '@/components/layout/CatalogueShell';

const NAV_ITEMS: ShellNavItem[] = [
  { labelAr: 'الكتالوج',      labelEn: 'Catalogue',   href: '' },
  { labelAr: 'السلالات',      labelEn: 'Dynasties',   href: '/dynasties' },
  { labelAr: 'دور الضرب',     labelEn: 'Mints',       href: '/mints' },
  { labelAr: 'الحكام',        labelEn: 'Rulers',      href: '/rulers' },
  { labelAr: 'فهرس العملات',  labelEn: 'Coin Index',  href: '/coin-index' },
];

export default function IslamicShellWrapper({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  const base = `/${locale}/islamic`;

  const heroTitle = isAr
    ? 'العملات الإسلامية'
    : isDe
    ? 'Islamische Münzen'
    : 'Islamic Coins';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    href: `${base}${item.href}`,
  }));

  return (
    <CatalogueShell
      catalogueId="islamic"
      locale={locale}
      heroSize="compact"
      heroTitle={heroTitle}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
