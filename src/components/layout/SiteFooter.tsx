import Link from 'next/link';
import Image from 'next/image';

interface SiteFooterProps {
  locale: string;
}

export default function SiteFooter({ locale }: SiteFooterProps) {
  const isAr = locale === 'ar';
  const isDe = locale === 'de';

  const t = (ar: string, en: string, de: string) =>
    isAr ? ar : isDe ? de : en;

  return (
    <footer style={{ backgroundColor: '#0a0602', borderTop: '1px solid rgba(184,134,11,0.2)' }}>
      <div className="max-w-[1440px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8" dir={isAr ? 'rtl' : 'ltr'}>

          {/* Column 1 — Brand */}
          <div>
            <Image
              src="https://pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev/wp-content/uploads/2026/05/Arabismatica-logo-Small.png"
              alt="Arabismatica"
              width={160}
              height={56}
              className="h-12 w-auto object-contain mb-3"
            />
            <p className="text-[11px] text-amber-400/60 leading-relaxed">
              {t(
                'الموسوعة الرقمية للعملات العربية والإسلامية. مبادرة شبكة المقتني العربي.',
                'The digital encyclopaedia of Arab and Islamic coins. An initiative of The Arab Collector Network.',
                'Die digitale Enzyklopädie arabischer und islamischer Münzen. Eine Initiative des Arabischen Sammler-Netzwerks.'
              )}
            </p>
          </div>

          {/* Column 2 — Catalogues */}
          <div>
            <h3 className="text-[11px] text-amber-400/50 uppercase tracking-widest mb-4 font-medium">
              {t('الكتالوجات', 'Catalogues', 'Kataloge')}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href={`/${locale}/catalogue`}
                  className="text-[12px] text-amber-300/70 hover:text-amber-200 transition-colors">
                  {t('العملات العربية الحديثة', 'Modern Arab Coins', 'Moderne arabische Münzen')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/islamic`}
                  className="text-[12px] text-amber-300/70 hover:text-amber-200 transition-colors">
                  {t('العملات الإسلامية', 'Islamic Coins', 'Islamische Münzen')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/sasanian`}
                  className="text-[12px] text-amber-300/70 hover:text-amber-200 transition-colors">
                  {t('العملات الساسانية', 'Sasanian Coins', 'Sassanidische Münzen')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Links */}
          <div>
            <h3 className="text-[11px] text-amber-400/50 uppercase tracking-widest mb-4 font-medium">
              {t('روابط', 'Links', 'Links')}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a href="https://arabcollector.com" target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-amber-300/70 hover:text-amber-200 transition-colors">
                  arabcollector.com →
                </a>
              </li>
              <li>
                <a href="https://library.arabcollector.com" target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-amber-300/70 hover:text-amber-200 transition-colors">
                  {t('المكتبة الإلكترونية', 'Digital Library', 'Digitale Bibliothek')} →
                </a>
              </li>
              <li>
                <a href="https://arabcollector.com/knowledge-portal/" target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-amber-300/70 hover:text-amber-200 transition-colors">
                  {t('بوابة المعرفة', 'Knowledge Portal', 'Wissensportal')} →
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-amber-900/60 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-amber-400/40"
          dir={isAr ? 'rtl' : 'ltr'}>
          <span>© {new Date().getFullYear()} Arabismatica · أرابيزماتيكا</span>
          <span>
            {t('جميع الحقوق محفوظة لشبكة المقتني العربي', 'All rights reserved — The Arab Collector Network', 'Alle Rechte vorbehalten — The Arab Collector Network')}
          </span>
        </div>
      </div>
    </footer>
  );
}
