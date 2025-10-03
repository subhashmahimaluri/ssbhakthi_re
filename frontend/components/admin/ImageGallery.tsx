'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import ImagePreview from './ImagePreview';
import { UploadedImage } from './ImageUploader';

export interface ImageGalleryProps {
  locale?: string;
  contentType?: 'article' | 'stotra' | 'general';
  contentId?: string;
  onImageSelect?: (image: UploadedImage) => void;
  selectable?: boolean;
  showEditOptions?: boolean;
  className?: string;
}

interface ApiResponse {
  data: UploadedImage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ImageGallery({
  locale,
  contentType,
  contentId,
  onImageSelect,
  selectable = false,
  showEditOptions = true,
  className = '',
}: ImageGalleryProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Get current locale from router if not provided
  const currentLocale = locale || router.locale || 'te';

  const fetchImages = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (currentLocale) params.append('locale', currentLocale);
      if (contentType) params.append('contentType', contentType);
      if (contentId) params.append('contentId', contentId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000'}/rest/media?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (pageNum === 1) {
        setImages(data.data);
      } else {
        setImages(prev => [...prev, ...data.data]);
      }

      setPagination(data.pagination);
      setPage(pageNum);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch images';
      setError(errorMessage);
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(1);
  }, [currentLocale, contentType, contentId]);

  const handleImageUpdate = (updatedImage: UploadedImage) => {
    setImages(prev => prev.map(img => (img.id === updatedImage.id ? updatedImage : img)));
  };

  const handleImageDelete = async (imageId: string) => {
    if (!session?.accessToken) {
      setError('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000'}/rest/media/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('Failed to delete image:', error);
      setError('Failed to delete image');
    }
  };

  const handleImageSelect = (image: UploadedImage) => {
    if (selectable) {
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(image.id)) {
          newSet.delete(image.id);
        } else {
          newSet.add(image.id);
        }
        return newSet;
      });
    }

    onImageSelect?.(image);
  };

  const loadMore = () => {
    if (pagination && pagination.hasNext) {
      fetchImages(page + 1);
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading images...</p>
      </div>
    );
  }

  if (error && images.length === 0) {
    return (
      <div className="py-5 text-center">
        <div className="text-danger mb-3">
          <i className="bi bi-exclamation-triangle fs-1"></i>
        </div>
        <p className="text-danger">{error}</p>
        <Button variant="outline-primary" onClick={() => fetchImages(1)}>
          Try Again
        </Button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="py-5 text-center">
        <div className="text-muted mb-3">
          <i className="bi bi-images fs-1"></i>
        </div>
        <p className="text-muted">No images found for {currentLocale.toUpperCase()} locale</p>
        {contentType && <p className="text-muted small">Content type: {contentType}</p>}
      </div>
    );
  }

  return (
    <div className={`image-gallery ${className}`}>
      {/* Gallery header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h6 className="mb-0">
            Image Gallery ({images.length} of {pagination?.total || 0})
          </h6>
          <small className="text-muted">
            Locale: {currentLocale.toUpperCase()}
            {contentType && ` • Content type: ${contentType}`}
          </small>
        </div>

        {selectable && selectedImages.size > 0 && (
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setSelectedImages(new Set())}
            >
              Clear Selection ({selectedImages.size})
            </Button>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert-warning alert-dismissible" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Image grid */}
      <Row className="g-3">
        {images.map(image => (
          <Col key={image.id} sm={6} md={4} lg={3}>
            <div
              className={`position-relative ${selectable ? 'cursor-pointer' : ''}`}
              onClick={() => handleImageSelect(image)}
            >
              {selectable && (
                <Form.Check
                  type="checkbox"
                  className="position-absolute end-0 top-0 m-2"
                  style={{ zIndex: 10 }}
                  checked={selectedImages.has(image.id)}
                  onChange={() => handleImageSelect(image)}
                />
              )}

              <ImagePreview
                image={image}
                showEditOptions={showEditOptions}
                onImageUpdate={handleImageUpdate}
                onImageDelete={handleImageDelete}
              />
            </div>
          </Col>
        ))}
      </Row>

      {/* Load more button */}
      {pagination && pagination.hasNext && (
        <div className="mt-4 text-center">
          <Button variant="outline-primary" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              <>Load More ({pagination.total - images.length} remaining)</>
            )}
          </Button>
        </div>
      )}

      {/* Pagination info */}
      {pagination && (
        <div className="mt-3 text-center">
          <small className="text-muted">
            Page {pagination.page} of {pagination.pages} • Showing {images.length} of{' '}
            {pagination.total} images
          </small>
        </div>
      )}
    </div>
  );
}
