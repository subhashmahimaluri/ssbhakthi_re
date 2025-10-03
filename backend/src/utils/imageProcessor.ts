import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
  convertToWebP?: boolean;
  deleteOriginalAfterWebP?: boolean; // New option to delete JPEG/PNG after WebP conversion
}

export interface ProcessedImageResult {
  originalPath: string;
  webpPath?: string;
  thumbnailPath?: string;
  webpThumbnailPath?: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    originalFormat: string;
    originalSize: number;
  };
}

export class ImageProcessor {
  private static readonly DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    generateThumbnail: true,
    thumbnailSize: 300,
    convertToWebP: true,
    deleteOriginalAfterWebP: true, // Enable by default to save storage
  };

  /**
   * Process an uploaded image with optimization and thumbnail generation
   */
  static async processImage(
    inputPath: string,
    outputDir: string,
    filename: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Ensure output directories exist
    await this.ensureDirectories(outputDir);

    // Get original image metadata
    const originalMetadata = await sharp(inputPath).metadata();
    const originalStats = await fs.stat(inputPath);

    const baseFilename = path.parse(filename).name;
    const originalExt = path.parse(filename).ext;

    // Process main image
    const processedMainPath = path.join(outputDir, `${baseFilename}${originalExt}`);
    const mainImage = sharp(inputPath);

    // Resize if needed
    if (originalMetadata.width! > opts.maxWidth || originalMetadata.height! > opts.maxHeight) {
      mainImage.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Save optimized original format
    await mainImage
      .jpeg({ quality: opts.quality })
      .png({ quality: opts.quality })
      .toFile(processedMainPath);

    const result: ProcessedImageResult = {
      originalPath: processedMainPath,
      metadata: {
        width: 0,
        height: 0,
        format: originalMetadata.format || '',
        size: 0,
        originalFormat: originalMetadata.format || '',
        originalSize: originalStats.size,
      },
    };

    // Generate WebP version if requested
    if (opts.convertToWebP) {
      const webpPath = path.join(outputDir, `${baseFilename}.webp`);
      await sharp(inputPath)
        .resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: opts.quality })
        .toFile(webpPath);

      result.webpPath = webpPath;
    }

    // Generate thumbnail if requested
    if (opts.generateThumbnail) {
      const thumbnailDir = path.join(outputDir, 'thumbnails');
      const thumbnailPath = path.join(thumbnailDir, `${baseFilename}${originalExt}`);

      await sharp(inputPath)
        .resize(opts.thumbnailSize, opts.thumbnailSize, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .png({ quality: 80 })
        .toFile(thumbnailPath);

      result.thumbnailPath = thumbnailPath;

      // Generate WebP thumbnail
      if (opts.convertToWebP) {
        const webpThumbnailPath = path.join(thumbnailDir, `${baseFilename}.webp`);
        await sharp(inputPath)
          .resize(opts.thumbnailSize, opts.thumbnailSize, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 80 })
          .toFile(webpThumbnailPath);

        result.webpThumbnailPath = webpThumbnailPath;
      }
    }

    // Get final metadata
    const finalMetadata = await sharp(result.originalPath).metadata();
    const finalStats = await fs.stat(result.originalPath);

    result.metadata = {
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      format: finalMetadata.format || '',
      size: finalStats.size,
      originalFormat: originalMetadata.format || '',
      originalSize: originalStats.size,
    };

    // Delete original JPEG/PNG files after WebP conversion to save storage
    if (opts.convertToWebP && opts.deleteOriginalAfterWebP && result.webpPath) {
      try {
        // Delete original format (JPEG/PNG) but keep WebP
        await fs.unlink(result.originalPath);
        console.log(
          `🗑️ Deleted original ${originalMetadata.format?.toUpperCase()} file: ${path.basename(result.originalPath)}`
        );

        // Update result to use WebP as the primary original
        result.originalPath = result.webpPath;

        // Also delete original thumbnail if it exists and we have WebP thumbnail
        if (result.thumbnailPath && result.webpThumbnailPath) {
          await fs.unlink(result.thumbnailPath);
          console.log(
            `🗑️ Deleted original ${originalMetadata.format?.toUpperCase()} thumbnail: ${path.basename(result.thumbnailPath)}`
          );

          // Update result to use WebP thumbnail as primary
          result.thumbnailPath = result.webpThumbnailPath;
        }
      } catch (error) {
        console.warn('Failed to delete original format files after WebP conversion:', error);
      }
    }

    // Clean up temporary input file
    try {
      await fs.unlink(inputPath);
    } catch (error) {
      console.warn('Failed to cleanup temporary file:', inputPath, error);
    }

    return result;
  }

  /**
   * Generate responsive image sizes
   */
  static async generateResponsiveSizes(
    inputPath: string,
    outputDir: string,
    baseFilename: string,
    sizes: number[] = [640, 750, 828, 1080, 1200, 1920]
  ): Promise<string[]> {
    const generatedFiles: string[] = [];

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${baseFilename}-${size}w.webp`);

      await sharp(inputPath)
        .resize(size, null, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(outputPath);

      generatedFiles.push(outputPath);
    }

    return generatedFiles;
  }

  /**
   * Validate image file
   */
  static async validateImage(filePath: string): Promise<{
    isValid: boolean;
    error?: string;
    metadata?: sharp.Metadata;
  }> {
    try {
      const metadata = await sharp(filePath).metadata();

      // Check if it's a valid image format
      const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'svg'];
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        return {
          isValid: false,
          error: `Unsupported image format: ${metadata.format}`,
        };
      }

      // Check dimensions
      if (!metadata.width || !metadata.height) {
        return {
          isValid: false,
          error: 'Invalid image dimensions',
        };
      }

      // Check reasonable size limits (max 50MB)
      const stats = await fs.stat(filePath);
      if (stats.size > 50 * 1024 * 1024) {
        return {
          isValid: false,
          error: 'Image file too large (max 50MB)',
        };
      }

      return {
        isValid: true,
        metadata,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get language-specific upload directory
   */
  static getLanguageUploadDir(locale: string, baseDir: string = 'uploads/images'): string {
    const validLocales = ['te', 'en', 'hi', 'kn'];
    const safeLocale = validLocales.includes(locale) ? locale : 'en';

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    return path.join(baseDir, safeLocale, year.toString(), month);
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    // Sanitize filename
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${sanitizedName}-${timestamp}-${random}${ext}`;
  }

  /**
   * Ensure required directories exist
   */
  private static async ensureDirectories(outputDir: string): Promise<void> {
    const thumbnailDir = path.join(outputDir, 'thumbnails');

    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(thumbnailDir, { recursive: true });
  }

  /**
   * Delete processed image files
   */
  static async deleteImageFiles(imagePaths: {
    original?: string;
    webp?: string;
    thumbnail?: string;
    webpThumbnail?: string;
  }): Promise<void> {
    const pathsToDelete = Object.values(imagePaths).filter(Boolean) as string[];

    for (const filePath of pathsToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete image file: ${filePath}`, error);
      }
    }
  }
}
