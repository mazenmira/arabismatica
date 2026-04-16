# أرابيسماتيكا — Arabismatica

## Next.js 14 · Framer Motion · Tailwind CSS · Cairo Font · next-intl

\---

## STEP 1 — Where to Save This Folder

Unzip the project anywhere on your computer:

Windows:   C:\\Users\\YourName\\Projects\\arab-catalogue-next  
Mac/Linux: \~/Projects/arab-catalogue-next/

\---

## STEP 2 — Install \& Run

Open a terminal (Command Prompt / PowerShell / Terminal),
then run these commands one by one:

cd arab-catalogue-next
npm install
npm run dev

Then open your browser at:
http://localhost:3000        → auto-redirects to Arabic
http://localhost:3000/ar    → Arabic (RTL)
http://localhost:3000/en    → English (LTR)

\---

## STEP 3 — Inject Your 4,737 Coins (REQUIRED)

Your coin data lives in your current index.html file.
Run this one-time script to extract it:

node scripts/extract-coins.js /path/to/your/index.html

Example:
node scripts/extract-coins.js C:\\Downloads\\index.html

This creates: src/data/coins.json

Then open:  src/components/catalogue/CataloguePage.tsx
Find this line near the top:
const COINS: Coin\[] = \[];

Replace it with:
import COINS\_DATA from '@/data/coins.json';
const COINS = COINS\_DATA as unknown as Coin\[];

Then restart: npm run dev

\---

## STEP 4 — Deploy to arabismatica.arabcollector.com

npm install -g vercel
vercel login
vercel --prod

In Vercel dashboard:
Settings → Domains → Add: catalogue.arabcollector.com
DNS: CNAME | catalogue | cname.vercel-dns.com

\---

## FILE STRUCTURE

src/
├── app/
│   ├── layout.tsx                   Root layout (Cairo + Amiri fonts)
│   ├── globals.css                  CSS variables + scrollbar + range
│   ├── page.tsx                     Redirects / → /ar
│   └── \[locale]/
│       ├── layout.tsx               RTL/LTR + next-intl provider
│       └── page.tsx                 Main page (ISR revalidate=3600)
│
├── components/
│   ├── header/
│   │   ├── SiteHeader.tsx           Full Jannah theme header replica
│   │   └── SocialIcons.tsx          SVG social media icons
│   ├── sidebar/
│   │   └── ToolsSidebar.tsx         3-tab professional tools + Hijri converter
│   ├── timeline/
│   │   └── TimelineSlider.tsx       Framer Motion 1500–2026 dual slider
│   ├── catalogue/
│   │   ├── CataloguePage.tsx        Hero + search + filters + grid + pagination
│   │   ├── CoinCard.tsx             Tile: obverse + reverse + name + date + mintage
│   │   └── CoinModal.tsx            Expanded detail + lightbox + Numista link
│   └── modals/
│       └── IdentifyModal.tsx        AI image upload (TensorFlow.js placeholder)
│
├── i18n/
│   ├── request.ts                   next-intl server config
│   └── routing.ts                   Locale routing (ar | en)
│
├── lib/
│   ├── coins.ts                     Disc gradients, flags, formatting utils
│   └── hijri.ts                     Hijri ↔ Gregorian converter (Kuwaiti algorithm)
│
├── types/coin.ts                    TypeScript interfaces
├── middleware.ts                    next-intl locale middleware
└── data/coins.json                  YOUR COIN DATA (created by extract script)

public/
└── locales/
├── ar/common.json               Arabic UI translations
└── en/common.json               English UI translations

scripts/
└── extract-coins.js                 Extracts coins from index.html → coins.json

\---

## FEATURES

Header

* Exact replica of arabcollector.com Jannah theme
* Topbar: date, breaking news ticker, social icons, language switcher, back link
* Main nav: all 6 menu groups with dropdowns
* Prominent: بوابة المعرفة (gold pill) + أدوات التقييم (outlined pill)
* Dark mode toggle, shopping cart, mobile hamburger menu

Professional Tools Sidebar

* Tab 1 Encyclopedias: قاموس مصطلحات، موسوعة إسلامية، موسوعة أخطاء
* Tab 2 Analysis: محول الهجري (built-in), أجزاء العملة, فحص, تقييم, مواقع
* Tab 3 Value: حاسبة معادن, أسعار عربية, دليل بيع

Hijri ↔ Gregorian Converter (built into sidebar Tab 2)

* Converts both directions with month selector
* Uses Kuwaiti algorithm (accurate for coin dates)

Timeline Slider (framer-motion)

* Dual thumb range: 1500–2026
* Era markers with Arabic labels
* Live filters catalogue as you drag

Catalogue

* Hero with animated stats
* Country tab bar (19 countries)
* Search: name (AR+EN), KM#, N#, metal, year, dynasty
* Filters: era, metal, type, with-mintage
* Grid view (6 columns) + List view
* 60 coins per page, paginated
* Each card: obverse + reverse photos side by side
* Coin modal: centered images, "الوجه" / "الظهر" as pill buttons
* Click image → full Lightbox with keyboard navigation
* Mintage highlighted (📊)
* Tags, specs grid, Numista external link

i18n

* /ar  →  Arabic RTL, Amiri/Cairo fonts
* /en  →  English LTR
* JSON translation files: public/locales/ar/ and en/
* next-intl with App Router
* useTranslations() in all components

Performance

* ISR revalidate = 3600 (1 hour)
* Images: lazy loading with onerror fallback
* Fonts via Google Fonts CDN (link tag, no next/font blocking)
* Framer Motion: used only in interactive components

\---

## ADDING TensorFlow.js COIN IDENTIFICATION

npm install @tensorflow/tfjs @tensorflow-models/mobilenet

Then in src/components/modals/IdentifyModal.tsx
find the setTimeout placeholder and replace with:

import \* as tf from '@tensorflow/tfjs';
import \* as mobilenet from '@tensorflow-models/mobilenet';

const model = await mobilenet.load();
const img = document.querySelector('#coin-preview') as HTMLImageElement;
const predictions = await model.classify(img);
// Use predictions to look up coin in your database

