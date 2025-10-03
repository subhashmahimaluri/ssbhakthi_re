'use client';

import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { UploadedImage } from './ImageUploader';

export interface ImagePreviewProps {
  image: UploadedImage;
  showEditOptions?: boolean;
  onImageUpdate?: (image: UploadedImage) => void;
  onImageDelete?: (imageId: string) => void;
  className?: string;
}

export default function ImagePreview({
  image,
  showEditOptions = false,
  onImageUpdate,
  onImageDelete,
  className = '',
}: ImagePreviewProps) {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    alt: image.alt || '',
    caption: image.caption || '',
  });
  const [updating, setUpdating] = useState(false);

  const handleEdit = () => {
    setEditData({
      alt: image.alt || '',
      caption: image.caption || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!onImageUpdate) return;

    setUpdating(true);
    try {
      const updatedImage: UploadedImage = {
        ...image,
        alt: editData.alt,
        caption: editData.caption,
      };

      onImageUpdate(updatedImage);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update image:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (onImageDelete && window.confirm('Are you sure you want to delete this image?')) {
      onImageDelete(image.id);
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      console.log('Image URL copied to clipboard');
    });
  };

  const getThumbnailImage = () => {
    // Handle case where urls might be undefined
    if (!image.urls) return image.url || '';

    if (image.urls.webpThumbnail) return image.urls.webpThumbnail;
    if (image.urls.thumbnail) return image.urls.thumbnail;
    return image.urls.original || image.url || '';
  };

  return (
    <>
      <div className={`image-preview ${className}`}>
        <div className="position-relative">
          <img
            src={getThumbnailImage()}
            alt={image.alt || image.originalName}
            className="img-fluid cursor-pointer rounded"
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              cursor: 'pointer',
            }}
          />

          {/* Overlay with actions */}
          {showEditOptions && (
            <div
              className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center start-0 top-0"
              style={{
                background: 'rgba(0,0,0,0.7)',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >
              <div className="d-flex gap-2">
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                  <i className="bi bi-eye"></i>
                </Button>
                <Button variant="secondary" size="sm" onClick={handleEdit}>
                  <i className="bi bi-pencil"></i>
                </Button>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => copyImageUrl(image.urls?.original || image.url || '')}
                >
                  <i className="bi bi-link-45deg"></i>
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  <i className="bi bi-trash"></i>
                </Button>
              </div>
            </div>
          )}

          {/* Format indicators */}
          <div className="position-absolute bottom-0 start-0 p-1">
            {image.processingInfo && image.processingInfo.hasWebP && (
              <span className="badge bg-success me-1">WebP</span>
            )}
            {image.processingInfo && image.processingInfo.hasThumbnail && (
              <span className="badge bg-info me-1">Thumb</span>
            )}
          </div>
        </div>

        {/* Image info */}
        <div className="small text-muted mt-2">
          <div className="fw-bold">{image.originalName}</div>
          {image.dimensions && (
            <div>
              {image.dimensions.width} × {image.dimensions.height}
            </div>
          )}
          <div>{(image.size / 1024).toFixed(1)} KB</div>
          {image.alt && <div className="text-truncate">Alt: {image.alt}</div>}
          {image.caption && <div className="text-truncate">Caption: {image.caption}</div>}
        </div>
      </div>

      {/* Full size preview modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{image.originalName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img
            src={image.urls?.webp || image.urls?.original || image.url || ''}
            alt={image.alt || image.originalName}
            className="img-fluid"
            style={{ maxHeight: '70vh' }}
          />

          <div className="mt-3 text-start">
            <div className="row">
              <div className="col-md-6">
                <h6>Image Details</h6>
                <ul className="list-unstyled small">
                  <li>
                    <strong>Filename:</strong> {image.filename}
                  </li>
                  <li>
                    <strong>Original:</strong> {image.originalName}
                  </li>
                  <li>
                    <strong>Dimensions:</strong>{' '}
                    {image.dimensions
                      ? `${image.dimensions.width} × ${image.dimensions.height}`
                      : 'Unknown'}
                  </li>
                  <li>
                    <strong>Size:</strong> {(image.size / 1024).toFixed(1)} KB
                  </li>
                  <li>
                    <strong>Locale:</strong> {image.locale.toUpperCase()}
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Available URLs</h6>
                <div className="d-flex flex-column gap-1">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => copyImageUrl(image.urls?.original || image.url || '')}
                  >
                    Copy Original URL
                  </Button>
                  {image.urls?.webp && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => copyImageUrl(image.urls!.webp!)}
                    >
                      Copy WebP URL
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Edit modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Image Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Alt Text</Form.Label>
              <Form.Control
                type="text"
                value={editData.alt}
                onChange={e => setEditData(prev => ({ ...prev, alt: e.target.value }))}
                placeholder="Describe the image for accessibility"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Caption</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editData.caption}
                onChange={e => setEditData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Image caption or description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={updating}>
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
