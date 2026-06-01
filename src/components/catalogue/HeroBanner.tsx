// src/components/catalogue/HeroBanner.tsx
interface HeroBannerProps {
  locale: string;
  totalCoins?: number;
  totalCountries?: number;
}

export default function HeroBanner({ locale, totalCoins = 4737, totalCountries = 19 }: HeroBannerProps) {
  const isAr = locale === 'ar';

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: '320px', borderBottom: '2px solid #8B6D2E' }}
      aria-label={isAr ? 'كتالوج العملات العربية' : 'Arab Coin Catalogue'}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-Hero.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ filter: 'brightness(0.45) saturate(0.8)' }}
      />

      {/* Dark gradient overlay — stronger at edges, lighter in centre */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,7,2,0.75) 0%, rgba(10,7,2,0.45) 40%, rgba(10,7,2,0.65) 100%)',
        }}
      />

      {/* Gold vignette sides */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, rgba(10,7,2,0.6) 0%, transparent 30%, transparent 70%, rgba(10,7,2,0.6) 100%)',
        }}
      />

      {/* Gold line top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/70 to-transparent" />

      {/* Content */}
      <div className="relative max-w-[1440px] mx-auto px-4 py-12 md:py-16" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl">

          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-[1px] w-8 bg-gold-500/60" />
            <span className="text-gold-400 text-[11px] uppercase tracking-[0.2em] font-medium">
              {isAr ? 'المرجع الشامل للعملات العربية والإسلامية' : 'The Comprehensive Arab & Islamic Coin Reference'}
            </span>
            <div className="h-[1px] w-8 bg-gold-500/60" />
          </div>

          {/* Main heading */}
          <h1 className="font-amiri text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            {isAr ? (
              <>أرابيزماتيكا<br /><span className="text-gold-300">كتالوج العملات العربية والإسلامية</span></>
            ) : (
              <>Arabismatica<br /><span className="text-gold-300">The Arab & Islamic Coin Catalogue</span></>
            )}
          </h1>

          {/* Description */}
          <p className="text-white/75 text-[14px] md:text-[15px] leading-relaxed mb-8 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {isAr
              ? `الكتالوج الأكثر شمولاً للعملات العربية والإسلامية عبر الإنترنت. يضم ${totalCoins.toLocaleString('ar-EG')} عملة من ${totalCountries} دولة و٥ خلافات إسلامية، تمتد من عام ٦٦١م حتى اليوم. ابحث حسب الاسم، رقم KM، المعدن، الأسرة الحاكمة، أو السنة.`
              : `The most comprehensive online catalogue of Arab and Islamic coins. Browse ${totalCoins.toLocaleString()} coins spanning ${totalCountries} countries and 5 Islamic caliphates from 661 CE to the present day. Search by name, KM number, metal, dynasty, or year.`}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { value: totalCoins.toLocaleString(isAr ? 'ar-EG' : 'en'), label: isAr ? 'عملة مفهرسة' : 'Coins indexed' },
              { value: totalCountries.toString(), label: isAr ? 'دولة ومنطقة' : 'Countries & regions' },
              { value: isAr ? '٦٦١–٢٠٢٦' : '661–2026', label: isAr ? 'حقبة زمنية' : 'Year range' },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex items-center gap-3">
                {i > 0 && <div className="h-6 w-[1px] bg-gold-700/50" />}
                <div>
                  <div className="text-2xl font-bold text-gold-300 font-amiri leading-none">{value}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden SEO text */}
      <p className="sr-only">
        {isAr
          ? 'أرابيزماتيكا — المرجع الشامل للعملات العربية والإسلامية النادرة والتاريخية. يغطي عملات مصر والمملكة العربية السعودية والإمارات والمغرب والعراق والكويت وعُمان وقطر والبحرين والأردن ولبنان وسوريا وليبيا وتونس والجزائر والسودان واليمن وفلسطين وموريتانيا.'
          : 'Arabismatica — the definitive reference for Arab and Islamic coins covering Egypt, Saudi Arabia, UAE, Morocco, Iraq, Kuwait, Oman, Qatar, Bahrain, Jordan, Lebanon, Syria, Libya, Tunisia, Algeria, Sudan, Yemen, Palestine, and Mauritania. Ottoman coins, modern Arab coinage, coin grading, and price guides.'}
      </p>

      {/* Gold line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
    </section>
  );
}
