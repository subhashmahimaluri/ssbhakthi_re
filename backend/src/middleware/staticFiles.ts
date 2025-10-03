import express, { NextFunction, Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { LanguageURLManager } from '../utils/languageURLManager';

/**
 * Static file serving middleware with language-aware routing
 * Serves images from language-specific directories with proper caching
 */
export class StaticFileMiddleware {
  private static readonly CACHE_MAX_AGE = 86400; // 1 day in seconds
  private static readonly THUMBNAIL_CACHE_MAX_AGE = 604800; // 1 week in seconds

  /**
   * Create Express middleware for serving language-specific images
   */
  static createImageMiddleware(baseUploadDir: string = 'uploads/images') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Parse the request path to extract locale and file path
        const urlPath = req.path;

        // Expected format: /images/{locale}/[thumbnails/]{filename}
        // Example: /images/te/some-image.jpg or /images/hi/thumbnails/some-image.webp
        const pathMatch = urlPath.match(/^\/images\/([a-z]{2})\/(.*)/);

        if (!pathMatch) {
          next(); // Not an image request, pass to next middleware
          return;
        }

        const [, locale, filePath] = pathMatch;

        // Ensure we have valid values
        if (!locale || !filePath) {
          next();
          return;
        }

        // Validate locale
        if (!LanguageURLManager.isValidLocale(locale)) {
          res.status(404).json({ error: 'Invalid locale' });
          return;
        }

        // Construct full file path
        const fullFilePath = path.join(process.cwd(), baseUploadDir, locale, filePath);

        // Security check: ensure the resolved path is within the upload directory
        const resolvedPath = path.resolve(fullFilePath);
        const allowedBasePath = path.resolve(process.cwd(), baseUploadDir);

        if (!resolvedPath.startsWith(allowedBasePath)) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }

        // Check if file exists
        try {
          const stats = await fs.stat(resolvedPath);

          if (!stats.isFile()) {
            res.status(404).json({ error: 'File not found' });
            return;
          }

          // Set appropriate headers based on file type and location
          this.setImageHeaders(res, resolvedPath, filePath.includes('/thumbnails/'));

          // Serve the file
          res.sendFile(resolvedPath);
        } catch (fileError) {
          // File doesn't exist or can't be accessed
          res.status(404).json({ error: 'File not found' });
          return;
        }
      } catch (error) {
        console.error('Static file middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Set appropriate headers for image responses
   */
  private static setImageHeaders(res: Response, filePath: string, isThumbnail: boolean): void {
    const ext = path.extname(filePath).toLowerCase();
    const maxAge = isThumbnail ? this.THUMBNAIL_CACHE_MAX_AGE : this.CACHE_MAX_AGE;

    // Set content type based on file extension
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Cache headers
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.setHeader('ETag', `"${path.basename(filePath)}-${Date.now()}"`);
    res.setHeader('Last-Modified', new Date().toUTCString());

    // WebP-specific headers
    if (ext === '.webp') {
      res.setHeader('Vary', 'Accept');
    }

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // CORS headers for cross-origin requests (needed for multi-port setup)
    const allowedOrigins = LanguageURLManager.getCORSOrigins(
      process.env['NODE_ENV'] === 'development'
    );
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(', '));
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }

  /**
   * Create middleware to handle image optimization and format negotiation
   */
  static createOptimizedImageMiddleware(baseUploadDir: string = 'uploads/images') {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const urlPath = req.path;
        const acceptHeader = req.headers.accept || '';

        // Check if client supports WebP
        const supportsWebP = acceptHeader.includes('image/webp');

        // Parse image request
        const pathMatch = urlPath.match(/^\/images\/([a-z]{2})\/(.*)/);

        if (!pathMatch) {
          next();
          return;
        }

        const [, locale, filePath] = pathMatch;

        // Ensure we have valid values
        if (!locale || !filePath) {
          next();
          return;
        }

        // If client supports WebP and it's not already a WebP request, try to serve WebP version
        if (supportsWebP && !filePath.endsWith('.webp')) {
          const webpPath = filePath.replace(/\.[^/.]+$/, '.webp');
          const webpFullPath = path.join(process.cwd(), baseUploadDir, locale, webpPath);

          try {
            await fs.access(webpFullPath);
            // WebP version exists, redirect to it
            req.url = `/images/${locale}/${webpPath}`;
          } catch {
            // WebP version doesn't exist, continue with original
          }
        }

        next();
      } catch (error) {
        next();
      }
    };
  }

  /**
   * Create a comprehensive static file serving setup
   */
  static setupStaticFileServing(
    app: express.Application,
    baseUploadDir: string = 'uploads/images'
  ): void {
    // Handle OPTIONS requests for CORS
    app.options('/images/*', (_req: Request, res: Response) => {
      const allowedOrigins = LanguageURLManager.getCORSOrigins(
        process.env['NODE_ENV'] === 'development'
      );
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(', '));
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      );
      res.status(200).end();
    });

    // Apply optimization middleware first
    app.use('/images', this.createOptimizedImageMiddleware(baseUploadDir));

    // Apply main image serving middleware
    app.use('/images', this.createImageMiddleware(baseUploadDir));

    console.log('✅ Static file serving configured for /images/* with language-aware routing');
  }

  /**
   * Health check for static file serving
   */
  static createHealthCheckEndpoint() {
    return async (_req: Request, res: Response): Promise<void> => {
      try {
        const uploadDir = path.join(process.cwd(), 'uploads/images');

        // Check if upload directories exist for all locales
        const locales = ['te', 'en', 'hi', 'kn'];
        const checks = await Promise.all(
          locales.map(async locale => {
            try {
              await fs.access(path.join(uploadDir, locale));
              return { locale, status: 'ok' };
            } catch {
              return { locale, status: 'missing' };
            }
          })
        );

        const allHealthy = checks.every(check => check.status === 'ok');

        res.status(allHealthy ? 200 : 503).json({
          status: allHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          checks,
          uploadDirectory: uploadDir,
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };
  }
}
