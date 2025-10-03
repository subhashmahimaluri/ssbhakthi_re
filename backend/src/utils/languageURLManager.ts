/**
 * Language-aware URL generation utility for multi-port architecture
 * Handles development (localhost:3000/3001/3002) and production domain mapping
 */

export interface LanguagePortConfig {
  locale: string;
  port: number;
  domain?: string; // For production
}

export interface URLGenerationOptions {
  locale: string;
  isDevelopment?: boolean;
  baseURL?: string;
  usePort?: boolean;
}

export class LanguageURLManager {
  private static readonly DEFAULT_PORT_CONFIG: LanguagePortConfig[] = [
    { locale: 'te', port: 3000 }, // Telugu (default with English)
    { locale: 'en', port: 3000 }, // English (same as Telugu)
    { locale: 'hi', port: 3001 }, // Hindi
    { locale: 'kn', port: 3002 }, // Kannada
  ];

  private static readonly PRODUCTION_DOMAINS: Record<string, string> = {
    te: process.env['FRONTEND_TE_DOMAIN'] || 'https://ssbhakthi.com',
    en: process.env['FRONTEND_EN_DOMAIN'] || 'https://ssbhakthi.com/en',
    hi: process.env['FRONTEND_HI_DOMAIN'] || 'https://hi.ssbhakthi.com',
    kn: process.env['FRONTEND_KN_DOMAIN'] || 'https://kn.ssbhakthi.com',
  };

  /**
   * Get the appropriate base URL for a given locale
   */
  static getBaseURL(locale: string, isDevelopment: boolean = true): string {
    const validLocales = ['te', 'en', 'hi', 'kn'];
    const safeLocale = validLocales.includes(locale) ? locale : 'en';

    if (isDevelopment) {
      const config = this.DEFAULT_PORT_CONFIG.find(c => c.locale === safeLocale);
      if (config) {
        return `http://localhost:${config.port}`;
      }
      return 'http://localhost:3000'; // Fallback
    }

    return (
      this.PRODUCTION_DOMAINS[safeLocale] ||
      this.PRODUCTION_DOMAINS['en'] ||
      'https://ssbhakthi.com'
    );
  }

  /**
   * Extract relative path from a full URL
   * Useful for converting existing full URLs to relative paths
   */
  static extractRelativePath(fullURL: string): string {
    if (!fullURL) return '';

    // If it's already a relative path, return as-is
    if (!fullURL.startsWith('http://') && !fullURL.startsWith('https://')) {
      return fullURL;
    }

    try {
      const url = new URL(fullURL);
      return url.pathname;
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = fullURL.match(/https?:\/\/[^\/]+(\/.*)$/);
      return match?.[1] || fullURL;
    }
  }

  /**
   * Generate a complete image URL for a given locale and image path
   * Handles both relative paths and existing full URLs properly
   */
  static generateImageURL(
    imagePath: string,
    locale: string,
    options: Partial<URLGenerationOptions> = {}
  ): string {
    if (!imagePath) return '';

    // If imagePath is already a full URL, return it as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const isDev = options.isDevelopment ?? process.env['NODE_ENV'] === 'development';
    const baseURL = options.baseURL || this.getBaseURL(locale, isDev);

    // Clean the image path and ensure it starts with /images/
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    let finalPath;

    if (cleanPath.startsWith('/images/')) {
      // Convert /images/... to /api/images/... for frontend proxy
      finalPath = `/api${cleanPath}`;
    } else {
      finalPath = `/api/images${cleanPath}`;
    }

    return `${baseURL}${finalPath}`;
  }

  /**
   * Generate language-specific image paths (relative paths only)
   */
  static generateLanguageImagePath(
    filename: string,
    locale: string,
    isWebP: boolean = false,
    isThumbnail: boolean = false,
    includeTimestampPath: boolean = true
  ): string {
    const validLocales = ['te', 'en', 'hi', 'kn'];
    const safeLocale = validLocales.includes(locale) ? locale : 'en';

    // Extract filename parts
    const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const extension = isWebP ? 'webp' : filename.split('.').pop() || 'jpg';

    // Build path components
    const pathComponents = ['/images', safeLocale];

    // Add year/month for uploaded files (if enabled)
    if (includeTimestampPath) {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      pathComponents.push(year.toString(), month);
    }

    if (isThumbnail) {
      pathComponents.push('thumbnails');
    }

    pathComponents.push(`${baseName}.${extension}`);

    return pathComponents.join('/');
  }

  /**
   * Get all image variants for a given image
   * Returns relative paths for storage and full URLs for API responses
   */
  static generateImageVariants(
    baseFilename: string,
    locale: string,
    hasWebP: boolean = true,
    hasThumbnail: boolean = true
  ): {
    paths: {
      original: string;
      webp?: string;
      thumbnail?: string;
      webpThumbnail?: string;
    };
    urls: {
      original: string;
      webp?: string;
      thumbnail?: string;
      webpThumbnail?: string;
    };
  } {
    const isDev = process.env['NODE_ENV'] === 'development';

    // Generate relative paths (for database storage)
    const paths: any = {
      original: this.generateLanguageImagePath(baseFilename, locale, false, false),
    };

    if (hasWebP) {
      paths.webp = this.generateLanguageImagePath(baseFilename, locale, true, false);
    }

    if (hasThumbnail) {
      paths.thumbnail = this.generateLanguageImagePath(baseFilename, locale, false, true);

      if (hasWebP) {
        paths.webpThumbnail = this.generateLanguageImagePath(baseFilename, locale, true, true);
      }
    }

    // Generate full URLs (for API responses)
    const urls: any = {
      original: this.generateImageURL(paths.original, locale, { isDevelopment: isDev }),
    };

    if (paths.webp) {
      urls.webp = this.generateImageURL(paths.webp, locale, { isDevelopment: isDev });
    }

    if (paths.thumbnail) {
      urls.thumbnail = this.generateImageURL(paths.thumbnail, locale, { isDevelopment: isDev });
    }

    if (paths.webpThumbnail) {
      urls.webpThumbnail = this.generateImageURL(paths.webpThumbnail, locale, {
        isDevelopment: isDev,
      });
    }

    return { paths, urls };
  }

  /**
   * Parse locale from request or headers
   */
  static parseLocaleFromRequest(req: any): string {
    // Try to get locale from query parameter
    if (req.query?.locale && typeof req.query.locale === 'string') {
      return req.query.locale;
    }

    // Try to get locale from headers
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0];
      if (['te', 'en', 'hi', 'kn'].includes(preferredLocale)) {
        return preferredLocale;
      }
    }

    // Try to get from referer URL
    const referer = req.headers.referer || req.headers.referrer;
    if (referer) {
      const url = new URL(referer);
      const port = parseInt(url.port, 10);

      switch (port) {
        case 3001:
          return 'hi';
        case 3002:
          return 'kn';
        case 3000:
        default:
          // Check if it's English path
          if (url.pathname.startsWith('/en/')) {
            return 'en';
          }
          return 'te';
      }
    }

    return 'te'; // Default fallback
  }

  /**
   * Get port configuration for locale
   */
  static getPortForLocale(locale: string): number {
    const config = this.DEFAULT_PORT_CONFIG.find(c => c.locale === locale);
    return config?.port || 3000;
  }

  /**
   * Validate if locale is supported
   */
  static isValidLocale(locale: string): boolean {
    return ['te', 'en', 'hi', 'kn'].includes(locale);
  }

  /**
   * Get CORS origins for all language ports
   */
  static getCORSOrigins(isDevelopment: boolean = true): string[] {
    if (isDevelopment) {
      return [
        'http://localhost:3000', // Telugu/English
        'http://localhost:3001', // Hindi
        'http://localhost:3002', // Kannada
      ];
    }

    return Object.values(this.PRODUCTION_DOMAINS);
  }

  /**
   * Get image serving configuration for Express static middleware
   */
  static getStaticServingConfig() {
    return {
      maxAge: '1d', // Cache for 1 day
      etag: true,
      lastModified: true,
      setHeaders: (res: any, path: string) => {
        // Set appropriate cache headers based on file type
        if (path.endsWith('.webp')) {
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
          res.setHeader('Vary', 'Accept');
        } else if (path.includes('/thumbnails/')) {
          res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week for thumbnails
        }
      },
    };
  }
}
