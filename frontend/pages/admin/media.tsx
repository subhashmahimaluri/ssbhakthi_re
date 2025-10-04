'use client';

import AdminNav from '@/components/admin/AdminNav';
import ImageUploader, { UploadedImage } from '@/components/admin/ImageUploader';
import Layout from '@/components/Layout/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Tab,
  Tabs,
} from 'react-bootstrap';

interface ExtendedUploadedImage extends UploadedImage {
  contentType?: string;
  mimeType?: string;
  createdAt?: string;
}

interface ApiResponse {
  data: ExtendedUploadedImage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function MediaManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState('te');
  const [selectedContentType, setSelectedContentType] = useState<
    'all' | 'article' | 'stotra' | 'general'
  >('all');
  const [images, setImages] = useState<ExtendedUploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApiResponse['pagination'] | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchImages = async (pageNum: number = 1, resetImages: boolean = true) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '24', // More images per page for admin view
      });

      if (currentLocale) params.append('locale', currentLocale);
      if (selectedContentType !== 'all') params.append('contentType', selectedContentType);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000'}/rest/media?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      // Map API response to include contentType
      const mappedImages = data.data.map(img => ({
        ...img,
        contentType: img.contentType || 'general',
      }));

      if (resetImages || pageNum === 1) {
        setImages(mappedImages);
      } else {
        setImages(prev => [...prev, ...mappedImages]);
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
    fetchImages(1, true);
  }, [currentLocale, selectedContentType]);

  const handleImageUploaded = (image: UploadedImage) => {
    const extendedImage: ExtendedUploadedImage = {
      ...image,
      contentType: selectedContentType === 'all' ? 'general' : selectedContentType,
    };
    setImages(prev => [extendedImage, ...prev]);
    console.log('✅ New image uploaded:', image.originalName);
  };

  const handleImageUploadError = (error: string) => {
    setError(`Image upload error: ${error}`);
  };

  const handleImageSelect = (image: ExtendedUploadedImage) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(image.id)) {
        newSet.delete(image.id);
      } else {
        newSet.add(image.id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!session?.accessToken || selectedImages.size === 0) {
      return;
    }

    setDeleteInProgress(true);
    setDeleteError(null);

    try {
      const deletePromises = Array.from(selectedImages).map(async imageId => {
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
          throw new Error(`Failed to delete image ${imageId}: ${response.status}`);
        }

        return imageId;
      });

      const deletedIds = await Promise.all(deletePromises);

      // Remove deleted images from state
      setImages(prev => prev.filter(img => !deletedIds.includes(img.id)));
      setSelectedImages(new Set());
      setShowDeleteModal(false);

      console.log(`✅ Successfully deleted ${deletedIds.length} images`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete images';
      setDeleteError(errorMessage);
      console.error('Failed to delete images:', error);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const loadMore = () => {
    if (pagination && pagination.hasNext) {
      fetchImages(page + 1, false);
    }
  };

  if (loading && images.length === 0) {
    return (
      <Layout>
        <AdminNav />
        <Container className="py-4">
          <div className="py-5 text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading media library...</p>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h1>Media Management</h1>
            <p className="text-muted">Upload, organize, and manage your media files</p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-secondary" onClick={() => router.push('/admin')}>
              ← Back to Dashboard
            </Button>
          </Col>
        </Row>

        {/* Error display */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6} lg={3}>
                <Form.Group className="mb-md-0 mb-3">
                  <Form.Label className="fw-bold">Language</Form.Label>
                  <div className="d-flex gap-2">
                    {['te', 'en', 'hi', 'kn'].map(locale => (
                      <Button
                        key={locale}
                        variant={currentLocale === locale ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => setCurrentLocale(locale)}
                      >
                        {locale.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </Form.Group>
              </Col>

              <Col md={6} lg={3}>
                <Form.Group className="mb-md-0 mb-3">
                  <Form.Label className="fw-bold">Content Type</Form.Label>
                  <Form.Select
                    value={selectedContentType}
                    onChange={e => setSelectedContentType(e.target.value as any)}
                    size="sm"
                  >
                    <option value="all">All Types</option>
                    <option value="article">Articles</option>
                    <option value="stotra">Stotras</option>
                    <option value="general">General</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col lg={6}>
                <div className="d-flex justify-content-lg-end gap-2">
                  {selectedImages.size > 0 && (
                    <>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setSelectedImages(new Set())}
                      >
                        Clear Selection ({selectedImages.size})
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                        <i className="bi bi-trash me-1"></i>
                        Delete Selected ({selectedImages.size})
                      </Button>
                    </>
                  )}
                  <Button variant="outline-primary" size="sm" onClick={handleSelectAll}>
                    {selectedImages.size === images.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Main content */}
        <Tabs defaultActiveKey="gallery" className="mb-4">
          <Tab eventKey="gallery" title={`Gallery (${pagination?.total || 0})`}>
            {images.length === 0 ? (
              <div className="py-5 text-center">
                <div className="text-muted mb-3">
                  <i className="bi bi-images fs-1"></i>
                </div>
                <p className="text-muted">
                  No images found for {currentLocale.toUpperCase()} locale
                </p>
                {selectedContentType !== 'all' && (
                  <p className="text-muted small">Content type: {selectedContentType}</p>
                )}
              </div>
            ) : (
              <>
                {/* Image grid */}
                <Row className="g-3 mb-4">
                  {images.map(image => (
                    <Col key={image.id} sm={6} md={4} lg={3} xl={2}>
                      <div className="position-relative">
                        <Form.Check
                          type="checkbox"
                          className="position-absolute end-0 top-0 m-2"
                          style={{ zIndex: 10 }}
                          checked={selectedImages.has(image.id)}
                          onChange={() => handleImageSelect(image)}
                        />

                        <div
                          className="card cursor-pointer"
                          onClick={() => handleImageSelect(image)}
                          style={{
                            transition: 'transform 0.2s',
                            ...(selectedImages.has(image.id)
                              ? { transform: 'scale(0.95)', opacity: 0.7 }
                              : {}),
                          }}
                        >
                          <img
                            src={
                              image.urls?.webpThumbnail ||
                              image.urls?.thumbnail ||
                              image.urls?.webp ||
                              image.urls?.original ||
                              image.url
                            }
                            alt={image.alt || image.originalName}
                            className="card-img-top"
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                          <div className="card-body p-2">
                            <h6 className="card-title small text-truncate mb-1">
                              {image.originalName}
                            </h6>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {image.dimensions &&
                                  `${image.dimensions.width}×${image.dimensions.height}`}
                              </small>
                              <small className="text-muted">
                                {(image.size / 1024).toFixed(1)} KB
                              </small>
                            </div>
                            {image.contentType && (
                              <small className="badge bg-primary">{image.contentType}</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Load more button */}
                {pagination && pagination.hasNext && (
                  <div className="text-center">
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
                      Showing {images.length} of {pagination.total} images
                      {selectedContentType !== 'all' && ` in ${selectedContentType}`}
                      {' • '}Language: {currentLocale.toUpperCase()}
                    </small>
                  </div>
                )}
              </>
            )}
          </Tab>

          <Tab eventKey="upload" title="Upload">
            <Row className="justify-content-center">
              <Col lg={8}>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-cloud-upload me-2"></i>
                      Upload New Media
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <ImageUploader
                      locale={currentLocale}
                      contentType={selectedContentType === 'all' ? 'general' : selectedContentType}
                      onImageUploaded={handleImageUploaded}
                      onImageUploadError={handleImageUploadError}
                      multiple={true}
                      maxFiles={20}
                      showPreview={true}
                      className="mb-3"
                    />

                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Storage Optimization:</strong> JPEG and PNG files are automatically
                      converted to WebP format and original files are deleted to save storage space.
                      Thumbnails are generated for faster loading.
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab>
        </Tabs>

        {/* Delete confirmation modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-exclamation-triangle text-warning me-2"></i>
              Delete Images
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteError && (
              <Alert variant="danger" className="mb-3">
                {deleteError}
              </Alert>
            )}

            <p>
              Are you sure you want to delete <strong>{selectedImages.size}</strong> selected
              image(s)?
            </p>

            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action cannot be undone. The images and their
              thumbnails will be permanently deleted from the server.
            </div>

            {selectedImages.size > 0 && (
              <div>
                <h6>Selected images:</h6>
                <div className="row g-2">
                  {Array.from(selectedImages)
                    .slice(0, 6)
                    .map(imageId => {
                      const image = images.find(img => img.id === imageId);
                      return image ? (
                        <div key={imageId} className="col-4">
                          <img
                            src={image.urls?.webpThumbnail || image.urls?.thumbnail || image.url}
                            alt={image.originalName}
                            className="img-fluid rounded"
                            style={{ height: '60px', width: '100%', objectFit: 'cover' }}
                          />
                          <small className="text-truncate d-block">{image.originalName}</small>
                        </div>
                      ) : null;
                    })}
                  {selectedImages.size > 6 && (
                    <div className="col-4 d-flex align-items-center justify-content-center">
                      <span className="text-muted">+{selectedImages.size - 6} more</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSelected} disabled={deleteInProgress}>
              {deleteInProgress ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-2"></i>
                  Delete {selectedImages.size} Image(s)
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </Layout>
  );
}
