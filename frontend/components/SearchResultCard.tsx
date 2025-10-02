import { CONTENT_TYPE_ROUTES, SearchResult } from '@/types/search';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface SearchResultCardProps {
  result: SearchResult;
  locale: string;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, locale }) => {
  // Helper function to determine the correct route path based on category context
  const getCategoryContext = (
    result: SearchResult
  ): 'ashtothram' | 'sahasranamavali' | 'sahasranamam' | 'default' => {
    const contentType = result.type || result.contentType;

    // For articles, always use default route
    if (contentType === 'article' || contentType === 'Article') {
      return 'default';
    }

    // For stotras, check categories or slug patterns
    if (result.categories && Array.isArray(result.categories)) {
      for (const category of result.categories) {
        const categoryName = typeof category === 'string' ? category.toLowerCase() : '';

        // Check for Ashtottara Shatanamavali
        if (categoryName.includes('ashtottara') || categoryName.includes('ashtothram')) {
          return 'ashtothram';
        }

        // Check for Sahasranamavali (but not sahasranamam)
        if (categoryName.includes('sahasranamavali') && !categoryName.includes('sahasranamam')) {
          return 'sahasranamavali';
        }

        // Check for Sahasranamam
        if (categoryName.includes('sahasranamam') || categoryName.includes('sahasranama')) {
          return 'sahasranamam';
        }
      }
    }

    // Fallback: Check slug patterns
    const slug = result.canonicalSlug?.toLowerCase() || '';

    if (slug.includes('ashtottara') || slug.includes('ashtothram')) {
      return 'ashtothram';
    }

    if (slug.includes('sahasranamavali') && !slug.includes('sahasranamam')) {
      return 'sahasranamavali';
    }

    if (slug.includes('sahasranamam') || slug.includes('sahasranama-stotram')) {
      return 'sahasranamam';
    }

    // Default for Hymns/Prayers and articles
    return 'default';
  };

  // Helper function to determine the correct route path
  const getContentPath = (): string => {
    const contentType = result.type || result.contentType;

    // Handle legacy API structure
    if (result.view_node) {
      const path = locale === 'en' ? result.view_node.slice(3) : result.view_node;
      return `/${CONTENT_TYPE_ROUTES[contentType] || 'articles'}${path}`;
    }

    // Determine route based on category context
    const categoryContext = getCategoryContext(result);

    let routeBase: string;
    switch (categoryContext) {
      case 'ashtothram':
        routeBase = 'ashtothram';
        break;
      case 'sahasranamavali':
        routeBase = 'sahasranamavali';
        break;
      case 'sahasranamam':
        routeBase = 'sahasranamam';
        break;
      default:
        if (contentType === 'article' || contentType === 'Article') {
          routeBase = 'articles';
        } else {
          routeBase = 'stotras'; // Default for general stotras
        }
        break;
    }

    return `/${routeBase}/${result.canonicalSlug}`;
  };

  // Get display title (supports both old and new API structure)
  const getDisplayTitle = (): string => {
    return result.field_display_title || result.title || 'Untitled';
  };

  // Get description/category (only show categories, not meaning)
  const getDescription = (): string => {
    // Only show categories, don't show meaning or body content
    if (result.categories && Array.isArray(result.categories)) {
      return result.categories.join(', ');
    }
    return result.field_category || '';
  };

  // Get image URL with proper YouTube thumbnail size and default image
  const getImageUrl = (): string => {
    if (result.field_image) {
      return `${process.env.NEXT_PUBLIC_API_URL}${result.field_image}`;
    }

    // Use higher resolution YouTube thumbnail (maxresdefault or hq720)
    if (result.imageUrl && result.imageUrl.includes('youtube')) {
      // Replace any existing quality with maxresdefault for better quality
      return result.imageUrl.replace(
        /\/(hq720|mqdefault|sddefault|hqdefault)\.jpg/,
        '/maxresdefault.jpg'
      );
    }

    return result.imageUrl || '/logo.png';
  };

  // Get content type label for display
  const getContentTypeLabel = (): string => {
    const contentType = result.type || result.contentType;
    switch (contentType) {
      case 'Stotra':
      case 'stotra':
        return 'Stotra';
      case 'Sahasranama Stotram':
      case 'sahasranamam':
        return 'Sahasranamam';
      case 'Ashtottara Shatanamavali':
      case 'ashtottara_shatanamavali':
        return 'Ashtottara';
      case 'Sahasra Namavali':
      case 'sahasranamavali':
        return 'Sahasranamavali';
      case 'Article':
      case 'article':
        return 'Article';
      default:
        return 'Content';
    }
  };

  return (
    <Link
      href={getContentPath()}
      className="d-flex justify-content-between rounded-10 align-items-center job-card-hover gr-hover-shadow-5 text-decoration-none mb-4 bg-white px-4 py-4"
    >
      <div className="d-flex align-items-center flex-grow-1">
        {/* Image/Icon */}
        <div className="me-3 flex-shrink-0">
          <div className="search-result-image">
            <Image
              src={getImageUrl()}
              alt={getDisplayTitle()}
              width={80}
              height={45}
              className="rounded object-cover"
              style={{ objectFit: 'cover', aspectRatio: '16/9' }}
              onError={(e: any) => {
                e.target.src = '/logo.png';
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow-1 min-width-0">
          <h3 className="text-primary h6 fw-bold text-truncate mb-1">{getDisplayTitle()}</h3>

          {getDescription() && (
            <p className="text-muted small text-truncate mb-1">{getDescription()}</p>
          )}

          <div className="d-flex align-items-center">
            <span className="badge bg-light text-dark small me-2">{getContentTypeLabel()}</span>
            {result.updatedAt && (
              <small className="text-muted">
                Updated: {new Date(result.updatedAt).toLocaleDateString()}
              </small>
            )}
          </div>
        </div>
      </div>

      {/* Arrow Icon */}
      <div className="ms-3 flex-shrink-0">
        <i className="fas fa-arrow-right text-primary"></i>
      </div>
    </Link>
  );
};

export default SearchResultCard;
