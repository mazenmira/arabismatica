'use client';

import { usePathname } from 'next/navigation';
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
  const isAr     = locale === 'ar';
  const isDe     = locale === 'de';
  const pathname = usePathname();
  const base     = `/${locale}/islamic`;
  const isRoot   = pathname === base || pathname === `${base}/`;
  const heroSize = isRoot ? 'large' : 'compact';

  const heroTitle = isAr
    ? 'العملات الإسلامية'
    : isDe
    ? 'Islamische Münzen'
    : 'Islamic Coins';

  const heroSubtitle = isAr
    ? '47,303 عملة من 18 سلالة وخلافة — من الأموية إلى المماليك'
    : isDe
    ? '47.303 Münzen aus 18 Dynastien — von den Umayyaden bis zu den Mamluken'
    : '47,303 coins from 18 dynasties — from the Umayyads to the Mamluks';

  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    href: `${base}${item.href}`,
  }));

  return (
    <CatalogueShell
      catalogueId="islamic"
      locale={locale}
      heroSize={heroSize}
      heroTitle={heroTitle}
      heroSubtitle={isRoot ? heroSubtitle : undefined}
      heroCoinCount={isRoot ? 47303 : undefined}
      navItems={navItems}
    >
      {children}
    </CatalogueShell>
  );
}
