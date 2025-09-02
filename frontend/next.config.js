/** @type {import('next').NextConfig} */

// Detect which instance this is based on environment or port
const getInstanceConfig = () => {
  const port = process.env.PORT;
  const defaultLocale = process.env.DEFAULT_LOCALE;
  const supportedLocales = process.env.SUPPORTED_LOCALES;

  // If specific environment variables are set, use them
  if (defaultLocale && supportedLocales) {
    const locales = supportedLocales.split(',');
    return {
      locales,
      defaultLocale,
      localeDetection: false,
    };
  }

  // Default fallback based on port
  switch (port) {
    case '3001':
      return {
        locales: ['hi'],
        defaultLocale: 'hi',
        localeDetection: false,
      };
    case '3002':
      return {
        locales: ['kn'],
        defaultLocale: 'kn',
        localeDetection: false,
      };
    default:
      // Port 3000 or undefined - Telugu/English instance
      return {
        locales: ['te', 'en'],
        defaultLocale: 'te',
        localeDetection: false,
      };
  }
};

const i18nConfig = getInstanceConfig();

const nextConfig = {
  // i18n configuration (Pages Router)
  i18n: i18nConfig,
  trailingSlash: false,

  // Redirects to handle default locale properly
  async redirects() {
    const redirects = [];

    // Only add redirects for Telugu/English instance (port 3000)
    if (i18nConfig.defaultLocale === 'te' && i18nConfig.locales.includes('te')) {
      redirects.push({
        source: '/te/:path*',
        destination: '/:path*',
        permanent: true,
      });
    }

    return redirects;
  },

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
