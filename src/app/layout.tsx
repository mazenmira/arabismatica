import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'أرابيزماتيكا | Arabismatica',
  description: 'موسوعة وكتالوج العملات العربية ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Cairo', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
