'use client';

import { usePathname } from 'next/navigation';
import CatalogueShell from '@/components/layout/CatalogueShell';
import type { ShellNavItem } from '@/components/layout/CatalogueShell';

const NAV_ITEMS: ShellNavItem[] = [
  { labelAr: 'الكتالوج',    labelEn: 'Catalogue',   href: '' },
  { labelAr: 'السلالات',    labelEn: 'Dynasties',   href: '/dynasties' },
  { labelAr: 'دور الضرب',   labelEn: 'Mints',       href: '/mints' },
  { labelAr: 'فهرس العملات', labelEn: 'Coin Index', href: '/coin-index' },
];

export default function IslamicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale    = params.locale;
  const isAr      = locale === 'ar';
  const pathname  = usePathname();
  const base      = `/${locale}/islamic`;
  const isRoot    = pathname === base || pathname === `${base}/`;
  const heroSize  = isRoot ? 'large' : 'compact';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    href: `${base}${item.href}`,
  }));

  return (
    <CatalogueShell
      catalogueId="islamic"
      locale={locale}
      heroSize={heroSize}
      heroTitle={isAr ? 'العملات الإسلامية' : 'Islamic Coins'}
      heroSubtitle={isAr
        ? '47,303 عملة من 18 سلالة وخلافة — من الأموية إلى المماليك'
        : '47,303 coins from 18 dynasties — from the Umayyads to the Mamluks'}
      heroCoinCount={isRoot ? 47303 : undefined}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
