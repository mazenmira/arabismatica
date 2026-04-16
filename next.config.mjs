import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'en.numista.com' },
      { protocol: 'https', hostname: 'pub-8c6367eeb78947fb9a67f9647334fc7f.r2.dev' },
      { protocol: 'https', hostname: 'arabcollector.com' },
    ],
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
