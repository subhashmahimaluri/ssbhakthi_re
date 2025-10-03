/**
 * Image URL utilities for handling relative and absolute URLs
 * Ensures compatibility between development and production environments
 */

/**
 * Convert relative image path to full URL based on current environment
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  // If already a full URL (starts with http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If relative path, prepend the current origin
  if (imagePath.startsWith('/')) {
    // In browser environment, use current window location
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${imagePath}`;
    }

    // For SSR, use default localhost:3000 in development
    if (process.env.NODE_ENV === 'development') {
      return `http://localhost:3000${imagePath}`;
    }

    // In production, assume same origin
    return imagePath;
  }

  return imagePath;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'hq720' = 'hq720'
): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Get fallback image URL
 */
export function getFallbackImage(): string {
  return '/images/default-content.jpg';
}

/**
 * Choose the best available image for display based on priority
 * Priority: Language-specific image > Global image > YouTube thumbnail > Fallback
 */
export function getBestImage(
  translationImageUrl?: string | null,
  globalImageUrl?: string | null,
  videoId?: string | null,
  fallbackImage: string = getFallbackImage()
): string {
  // Priority 1: Translation-specific image
  const translationImg = getImageUrl(translationImageUrl);
  if (translationImg) return translationImg;

  // Priority 2: Global image
  const globalImg = getImageUrl(globalImageUrl);
  if (globalImg) return globalImg;

  // Priority 3: YouTube thumbnail
  if (videoId) return getYouTubeThumbnail(videoId);

  // Priority 4: Fallback
  return fallbackImage;
}

/**
 * Extract relative path from full image URL
 * Used when saving image URLs to database
 */
export function getRelativePath(imageUrl: string): string {
  if (!imageUrl) return '';

  // If already relative, return as is
  if (imageUrl.startsWith('/')) return imageUrl;

  try {
    const url = new URL(imageUrl);
    return url.pathname;
  } catch {
    return imageUrl;
  }
}
