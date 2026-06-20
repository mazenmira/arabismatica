'use client';

import CatalogueShell from '@/components/layout/CatalogueShell';
import type { ShellNavItem } from '@/components/layout/CatalogueShell';

const NAV_ITEMS: ShellNavItem[] = [
  { labelAr: 'الكتالوج',  labelEn: 'Catalogue', href: '' },
  { labelAr: 'الحكام',    labelEn: 'Rulers',    href: '/rulers' },
  { labelAr: 'دور الضرب', labelEn: 'Mints',     href: '/mints' },
];

export default function MughalShellWrapper({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';
  const base = `/${locale}/mughal`;

  const heroTitle = isAr
    ? 'العملات المغولية'
    : isDe
    ? 'Mogulreichmünzen'
    : 'Mughal Empire Coins';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    href: `${base}${item.href}`,
  }));

  return (
    <CatalogueShell
      catalogueId="mughal"
      locale={locale}
      heroSize="compact"
      heroTitle={heroTitle}
      heroSubtitle={isAr ? 'الإمبراطورية المغولية · 1526–1857م' : isDe ? 'Mogulreich · 1526–1857 n.Chr.' : 'Mughal Empire · 1526–1857 CE'}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
