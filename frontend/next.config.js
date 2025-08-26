/** @type {import('next').NextConfig} */
const nextConfig = {
  // i18n configuration (Pages Router)
  i18n: {
    locales: process.env.SUPPORTED_LOCALES?.split(',') || ['te', 'en'],
    defaultLocale: process.env.DEFAULT_LOCALE || 'te',
    localeDetection: true, // Enable locale detection to handle language prefix
  },
  trailingSlash: false,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // SCSS configuration
  sassOptions: {
    includePaths: ['./styles'],
    prependData: `
      @import "styles/variables.scss";
      @import "styles/mixins.scss";
    `,
  },

  // Remove experimental appDir to avoid conflicts
  experimental: {
    cssChunking: 'strict', // Better CSS optimization for Next.js 15
  },
};

module.exports = nextConfig;
