import { Request, Response, Router } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth, requireRole } from '../auth/jwt';
import { MediaAsset } from '../models/MediaAsset';
import { ImageProcessor } from '../utils/imageProcessor';
import { LanguageURLManager } from '../utils/languageURLManager';

const router: Router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Create temporary upload directory
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique temporary filename
    const uniqueName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

interface UploadRequest extends Request {
  user?: {
    sub: string;
    preferred_username?: string;
    roles: string[];
  };
}

interface UploadedFile extends Express.Multer.File {
  path: string;
}
router.post(
  '/upload',
  requireAuth,
  requireRole('author', 'editor', 'admin'),
  upload.single('file'),
  async (req: UploadRequest, res: Response): Promise<void> => {
    try {
      const uploadedFile = req.file as UploadedFile;

      if (!uploadedFile) {
        res.status(400).json({
          error: 'No file uploaded',
          code: 'MISSING_FILE',
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHENTICATED',
        });
        return;
      }

      // Extract parameters from request
      const {
        alt = '',
        caption = '',
        locale = 'te',
        contentType = 'general',
        contentId,
      } = req.body;

      // Validate locale
      if (!LanguageURLManager.isValidLocale(locale)) {
        res.status(400).json({
          error: `Invalid locale: ${locale}`,
          code: 'INVALID_LOCALE',
        });
        return;
      }

      // Validate uploaded image
      const validation = await ImageProcessor.validateImage(uploadedFile.path);
      if (!validation.isValid) {
        res.status(400).json({
          error: validation.error,
          code: 'INVALID_IMAGE',
        });
        return;
      }

      // Generate unique filename
      const uniqueFilename = ImageProcessor.generateUniqueFilename(uploadedFile.originalname);

      // Get language-specific upload directory
      const uploadDir = ImageProcessor.getLanguageUploadDir(locale);

      // Process the image (resize, convert to WebP, generate thumbnails)
      const processedImage = await ImageProcessor.processImage(
        uploadedFile.path,
        uploadDir,
        uniqueFilename,
        {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
          generateThumbnail: true,
          thumbnailSize: 300,
          convertToWebP: true,
        }
      );

      // Generate image URLs and variants
      const imageVariants = LanguageURLManager.generateImageVariants(
        uniqueFilename,
        locale,
        true, // hasWebP
        true // hasThumbnail
      );

      // Create MediaAsset document
      const mediaAsset = new MediaAsset({
        filename: uniqueFilename,
        originalName: uploadedFile.originalname,
        mimeType: uploadedFile.mimetype,
        size: processedImage.metadata.size,
        url: imageVariants.paths.original, // Store relative path, not full URL
        alt,
        caption,
        uploadedBy: req.user.sub,
        isPublic: true,
        locale,

        // Store all variants with relative paths
        variants: {
          original: {
            url: imageVariants.paths.original, // Relative path
            path: processedImage.originalPath,
            width: processedImage.metadata.width,
            height: processedImage.metadata.height,
            size: processedImage.metadata.size,
          },
          ...(processedImage.webpPath && {
            webp: {
              url: imageVariants.paths.webp!, // Relative path
              path: processedImage.webpPath,
              size: processedImage.metadata.size, // WebP size would be different in real implementation
            },
          }),
          ...(processedImage.thumbnailPath && {
            thumbnail: {
              url: imageVariants.paths.thumbnail!, // Relative path
              path: processedImage.thumbnailPath,
              width: 300,
              height: 300,
              size: processedImage.metadata.size, // Thumbnail size would be different
            },
          }),
          ...(processedImage.webpThumbnailPath && {
            webpThumbnail: {
              url: imageVariants.paths.webpThumbnail!, // Relative path
              path: processedImage.webpThumbnailPath,
              size: processedImage.metadata.size, // WebP thumbnail size would be different
            },
          }),
        },

        // Processing metadata
        processingMetadata: {
          originalFormat: processedImage.metadata.originalFormat,
          originalSize: processedImage.metadata.originalSize,
          originalWidth: validation.metadata?.width || 0,
          originalHeight: validation.metadata?.height || 0,
          compressionRatio: processedImage.metadata.originalSize / processedImage.metadata.size,
          processingDate: new Date(),
          hasWebP: !!processedImage.webpPath,
          hasThumbnail: !!processedImage.thumbnailPath,
          hasResponsive: false, // We can implement this later
        },

        // Content association
        contentType: contentType as 'article' | 'stotra' | 'general',
        ...(contentId && { contentId }),
      });

      // Save to database
      await mediaAsset.save();

      console.log(`✅ Image uploaded successfully: ${uniqueFilename} for locale ${locale}`);

      // Return success response with full URLs for frontend (generated dynamically)
      res.status(201).json({
        id: mediaAsset.id,
        filename: mediaAsset.filename,
        originalName: mediaAsset.originalName,
        url: imageVariants.urls.original, // Full URL for CKEditor compatibility
        urls: imageVariants.urls, // All variant URLs (full URLs)
        variants: imageVariants, // Path and URL information
        alt: mediaAsset.alt,
        caption: mediaAsset.caption,
        locale: mediaAsset.locale,
        size: mediaAsset.size,
        dimensions: {
          width: processedImage.metadata.width,
          height: processedImage.metadata.height,
        },
        processingInfo: {
          hasWebP: !!processedImage.webpPath,
          hasThumbnail: !!processedImage.thumbnailPath,
          compressionRatio: mediaAsset.processingMetadata.compressionRatio,
        },
        createdAt: mediaAsset.createdAt,
      });
    } catch (error) {
      console.error('❌ Image upload failed:', error);

      res.status(500).json({
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'UPLOAD_FAILED',
      });
    }
  }
);

// Get media info by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mediaAsset = await MediaAsset.findById(id);

    if (!mediaAsset) {
      res.status(404).json({
        error: 'Media asset not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Helper function to generate full URLs from stored paths (which might be relative or full URLs)
    const generateFullURL = (storedPath: string) => {
      if (!storedPath) return storedPath;
      // First extract relative path from potentially full URL, then generate new full URL
      const relativePath = LanguageURLManager.extractRelativePath(storedPath);
      return LanguageURLManager.generateImageURL(relativePath, mediaAsset.locale);
    };

    res.json({
      id: mediaAsset.id,
      filename: mediaAsset.filename,
      originalName: mediaAsset.originalName,
      url: generateFullURL(mediaAsset.url), // Generate full URL from stored relative path
      urls: {
        original: generateFullURL(mediaAsset.variants?.original?.url || mediaAsset.url),
        webp: mediaAsset.variants?.webp?.url
          ? generateFullURL(mediaAsset.variants.webp.url)
          : undefined,
        thumbnail: mediaAsset.variants?.thumbnail?.url
          ? generateFullURL(mediaAsset.variants.thumbnail.url)
          : undefined,
        webpThumbnail: mediaAsset.variants?.webpThumbnail?.url
          ? generateFullURL(mediaAsset.variants.webpThumbnail.url)
          : undefined,
      },
      variants: mediaAsset.variants,
      alt: mediaAsset.alt,
      caption: mediaAsset.caption,
      locale: mediaAsset.locale,
      size: mediaAsset.size,
      dimensions: {
        width:
          mediaAsset.variants?.original?.width || mediaAsset.processingMetadata?.originalWidth || 0,
        height:
          mediaAsset.variants?.original?.height ||
          mediaAsset.processingMetadata?.originalHeight ||
          0,
      },
      processingInfo: {
        hasWebP: mediaAsset.processingMetadata?.hasWebP || false,
        hasThumbnail: mediaAsset.processingMetadata?.hasThumbnail || false,
        compressionRatio: mediaAsset.processingMetadata?.compressionRatio || 1,
      },
      mimeType: mediaAsset.mimeType,
      processingMetadata: mediaAsset.processingMetadata,
      contentType: mediaAsset.contentType,
      contentId: mediaAsset.contentId,
      createdAt: mediaAsset.createdAt,
      updatedAt: mediaAsset.updatedAt,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch media info',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'FETCH_FAILED',
    });
  }
});

// List media assets with filtering
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { locale, contentType, contentId, page = '1', limit = '20' } = req.query;

    const query: any = {};

    if (locale && typeof locale === 'string') {
      query.locale = locale;
    }

    if (contentType && typeof contentType === 'string') {
      query.contentType = contentType;
    }

    if (contentId && typeof contentId === 'string') {
      query.contentId = contentId;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [mediaAssets, total] = await Promise.all([
      MediaAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      MediaAsset.countDocuments(query),
    ]);

    // Helper function to generate full URLs from stored paths (which might be relative or full URLs)
    const generateFullURL = (storedPath: string, locale: string) => {
      if (!storedPath) return storedPath;
      // First extract relative path from potentially full URL, then generate new full URL
      const relativePath = LanguageURLManager.extractRelativePath(storedPath);
      return LanguageURLManager.generateImageURL(relativePath, locale);
    };

    res.json({
      data: mediaAssets.map(asset => ({
        id: asset.id,
        filename: asset.filename,
        originalName: asset.originalName,
        url: generateFullURL(asset.url, asset.locale), // Generate full URL from stored relative path
        urls: {
          original: generateFullURL(asset.variants?.original?.url || asset.url, asset.locale),
          webp: asset.variants?.webp?.url
            ? generateFullURL(asset.variants.webp.url, asset.locale)
            : undefined,
          thumbnail: asset.variants?.thumbnail?.url
            ? generateFullURL(asset.variants.thumbnail.url, asset.locale)
            : undefined,
          webpThumbnail: asset.variants?.webpThumbnail?.url
            ? generateFullURL(asset.variants.webpThumbnail.url, asset.locale)
            : undefined,
        },
        alt: asset.alt,
        caption: asset.caption,
        locale: asset.locale,
        size: asset.size,
        dimensions: {
          width: asset.variants?.original?.width || asset.processingMetadata?.originalWidth || 0,
          height: asset.variants?.original?.height || asset.processingMetadata?.originalHeight || 0,
        },
        processingInfo: {
          hasWebP: asset.processingMetadata?.hasWebP || false,
          hasThumbnail: asset.processingMetadata?.hasThumbnail || false,
          compressionRatio: asset.processingMetadata?.compressionRatio || 1,
        },
        mimeType: asset.mimeType,
        contentType: asset.contentType,
        contentId: asset.contentId,
        createdAt: asset.createdAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch media list',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'LIST_FAILED',
    });
  }
});

// Delete media asset
router.delete(
  '/:id',
  requireAuth,
  requireRole('author', 'editor', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const mediaAsset = await MediaAsset.findById(id);

      if (!mediaAsset) {
        res.status(404).json({
          error: 'Media asset not found',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Delete physical files
      const filesToDelete: any = {};
      if (mediaAsset.variants?.original?.path)
        filesToDelete.original = mediaAsset.variants.original.path;
      if (mediaAsset.variants?.webp?.path) filesToDelete.webp = mediaAsset.variants.webp.path;
      if (mediaAsset.variants?.thumbnail?.path)
        filesToDelete.thumbnail = mediaAsset.variants.thumbnail.path;
      if (mediaAsset.variants?.webpThumbnail?.path)
        filesToDelete.webpThumbnail = mediaAsset.variants.webpThumbnail.path;

      await ImageProcessor.deleteImageFiles(filesToDelete);

      // Delete database record
      await MediaAsset.findByIdAndDelete(id);

      console.log(`✅ Media asset deleted: ${mediaAsset.filename}`);

      res.json({
        success: true,
        message: 'Media asset deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete media asset',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'DELETE_FAILED',
      });
    }
  }
);

export default router;
