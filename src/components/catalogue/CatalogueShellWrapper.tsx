'use client';

import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const base     = `/${locale}/catalogue`;
  const isRoot   = pathname === base || pathname === `${base}/`;
  const heroSize = isRoot ? 'large' : 'compact';

  const heroTitle = isAr
    ? 'العملات العربية الحديثة'
    : isDe
    ? 'Moderne arabische Münzen'
    : 'Modern Arab Coins';

  const heroSubtitle = isAr
    ? '5,505 عملة من 20 دولة عربية — من العثمانيين حتى اليوم'
    : isDe
    ? '5.505 Münzen aus 20 arabischen Ländern — von den Osmanen bis heute'
    : '5,505 coins from 20 Arab countries — from the Ottomans to today';

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
      heroSubtitle={isRoot ? heroSubtitle : undefined}
      heroCoinCount={isRoot ? 5505 : undefined}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
