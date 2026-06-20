# Adding a New Catalogue

This document describes the minimal steps to add a new coin catalogue (e.g. Byzantine, Nabataean).

---

## 1. Register in `src/lib/catalogues.ts`

Add an entry to the `CATALOGUES` array:

```ts
{
  id: 'byzantine',
  slug: 'byzantine',
  group: 'ancient' as CatalogueGroup,        // 'arab_islamic_world' | 'ancient'
  title: { ar: '...', en: 'Byzantine Empire', de: '...' },
  subtitle: { ar: '...', en: '...', de: '...' },
  description: { ar: '...', en: '...', de: '...' },
  coinCount: 12345,                           // omit if scraping / unknown
  ccFilter: { include: ['BZ'] },             // Supabase cc column filter
  navPath: '/byzantine',
  status: 'active' as CatalogueStatus,       // 'active' | 'scraping' | 'coming_soon'
  seoKeywords: { en: [...], ar: [...] },     // optional
},
```

---

## 2. Create the route files

```
src/app/[locale]/byzantine/
  layout.tsx        ← wraps ByzantineShellWrapper
  page.tsx          ← renders ByzantinePage (force-dynamic)
  rulers/page.tsx   ← (optional) rulers sub-page
  mints/page.tsx    ← (optional) mints sub-page
```

### `layout.tsx`

```tsx
import ByzantineShellWrapper from '@/components/byzantine/ByzantineShellWrapper';
export default function Layout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  return <ByzantineShellWrapper locale={params.locale}>{children}</ByzantineShellWrapper>;
}
```

### `page.tsx`

```tsx
export const dynamic = 'force-dynamic';
import ByzantinePage from '@/components/byzantine/ByzantinePage';
export default function Page({ params }: { params: { locale: string } }) {
  return <ByzantinePage locale={params.locale} />;
}
```

---

## 3. Create the shell wrapper

**`src/components/byzantine/ByzantineShellWrapper.tsx`**

```tsx
'use client';
import CatalogueShell from '@/components/layout/CatalogueShell';
import type { ShellNavItem } from '@/components/layout/CatalogueShell';

const NAV: ShellNavItem[] = [
  { labelAr: 'الكل',       labelEn: 'All Coins',  href: '/[locale]/byzantine' },
  { labelAr: 'الحكام',     labelEn: 'Rulers',     href: '/[locale]/byzantine/rulers' },
  { labelAr: 'دور الضرب',  labelEn: 'Mints',      href: '/[locale]/byzantine/mints' },
];

export default function ByzantineShellWrapper({ locale, children }: { locale: string; children: React.ReactNode }) {
  const nav = NAV.map(n => ({ ...n, href: n.href.replace('[locale]', locale) }));
  return (
    <CatalogueShell
      catalogueId="byzantine"
      locale={locale}
      heroTitle={locale === 'ar' ? 'العملات البيزنطية' : 'Byzantine Empire'}
      heroSubtitle={locale === 'ar' ? '...' : '...'}
      heroCoinCount={12345}
      navItems={nav}
    >
      {children}
    </CatalogueShell>
  );
}
```

---

## 4. Create the page component

**`src/components/byzantine/ByzantinePage.tsx`**

Follow the pattern from `src/components/mughal/MughalPage.tsx`:

- `'use client'`
- Import `CoinCard` from `@/components/catalogue/CoinCard` — **never create a custom card**
- Use `useState(true)` for `loading` — prevents "no coins" flash on first render
- Query Supabase with `.eq('cc', 'BZ')` (or your cc code)
- Use `ComboFilter` for ruler/mint combos
- Filter bar: `flex items-center gap-2 flex-wrap`, coin count span uses `ms-auto`
- Grid: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3`

---

## 5. Add to `src/app/sitemap.ts`

```ts
{ url: `${BASE}/${loc}/byzantine`,        lastModified: now, priority: 0.9 },
{ url: `${BASE}/${loc}/byzantine/rulers`, lastModified: now, priority: 0.85 },
{ url: `${BASE}/${loc}/byzantine/mints`,  lastModified: now, priority: 0.85 },
```

---

## 6. Add to the landing page (`src/app/[locale]/page.tsx`)

In the relevant card array (`ARAB_ISLAMIC_CARDS` or `ANCIENT_CARDS`):

```ts
{
  id: 'byzantine', titleAr: '...', titleEn: 'Byzantine Empire', titleDe: '...',
  href: '/byzantine', status: 'coming_soon' as CatalogueStatus,
  group: 'ancient' as CatalogueGroup,
},
```

---

## 7. Add to the SiteHeader nav (`src/components/header/SiteHeader.tsx`)

Add a child entry under the relevant parent in `TOP_NAV_ITEMS_AR`, `TOP_NAV_ITEMS_EN`, `TOP_NAV_ITEMS_DE`.

---

## Checklist

- [ ] `catalogues.ts` entry added
- [ ] Route files created (`layout.tsx`, `page.tsx`)
- [ ] Shell wrapper created (extends `CatalogueShell`)
- [ ] Page component uses `CoinCard` (no custom card)
- [ ] `loading` initialised `useState(true)`
- [ ] Filter bar coin count uses `ms-auto`
- [ ] Sitemap entries added
- [ ] Landing page card added
- [ ] SiteHeader nav updated
- [ ] `npx tsc --noEmit` passes with 0 errors
