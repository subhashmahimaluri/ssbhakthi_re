'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ChangeEvent, DragEvent, useCallback, useRef, useState } from 'react';
import { Alert, Button, ProgressBar, Spinner } from 'react-bootstrap';

export interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  urls: {
    original: string;
    webp?: string;
    thumbnail?: string;
    webpThumbnail?: string;
  };
  alt?: string;
  caption?: string;
  locale: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  processingInfo: {
    hasWebP: boolean;
    hasThumbnail: boolean;
    compressionRatio: number;
  };
}

export interface ImageUploaderProps {
  onImageUploaded?: (image: UploadedImage) => void;
  onImageUploadError?: (error: string) => void;
  locale?: string;
  contentType?: 'article' | 'stotra' | 'general';
  contentId?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  accept?: string;
  showPreview?: boolean;
  className?: string;
}

export default function ImageUploader({
  onImageUploaded,
  onImageUploadError,
  locale = 'te',
  contentType = 'general',
  contentId,
  multiple = false,
  maxFiles = 5,
  maxFileSize = 10, // 10MB default
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  showPreview = true,
  className = '',
}: ImageUploaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Get current locale from router if not provided
  const currentLocale = locale || router.locale || 'te';

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    if (!allowedTypes.includes(file.type)) {
      return `File type not supported. Please use: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedImage> => {
    if (!session?.accessToken) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('locale', currentLocale);
    formData.append('contentType', contentType);
    if (contentId) {
      formData.append('contentId', contentId);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000'}/rest/media/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      let errorMessage = `Upload failed: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || errorMessage;
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);
      setUploadProgress(0);

      const filesToUpload = Array.from(files).slice(0, multiple ? maxFiles : 1);

      // Validate all files first
      for (const file of filesToUpload) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          onImageUploadError?.(validationError);
          return;
        }
      }

      setUploading(true);

      try {
        const uploadPromises = filesToUpload.map(async (file, index) => {
          const uploadedImage = await uploadFile(file);

          // Update progress
          setUploadProgress(((index + 1) / filesToUpload.length) * 100);

          return uploadedImage;
        });

        const results = await Promise.all(uploadPromises);

        // Update state with uploaded images
        setUploadedImages(prev => [...prev, ...results]);

        // Call callbacks for each uploaded image
        results.forEach(image => {
          onImageUploaded?.(image);
        });

        console.log('✅ Images uploaded successfully:', results.length);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setError(errorMessage);
        onImageUploadError?.(errorMessage);
        console.error('❌ Image upload failed:', error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [
      currentLocale,
      contentType,
      contentId,
      maxFiles,
      maxFileSize,
      multiple,
      session?.accessToken,
      onImageUploaded,
      onImageUploadError,
    ]
  );

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div className={`image-uploader ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload area */}
      <div
        className={`upload-area rounded border-2 border-dashed p-4 text-center ${
          dragOver ? 'border-primary bg-light' : 'border-secondary'
        } ${uploading ? 'pe-none' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploading ? handleClick : undefined}
        style={{
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? (
          <div className="w-100">
            <Spinner animation="border" size="sm" className="mb-2" />
            <div>Uploading... {Math.round(uploadProgress)}%</div>
            {uploadProgress > 0 && (
              <ProgressBar now={uploadProgress} className="mt-2" style={{ height: '6px' }} />
            )}
          </div>
        ) : (
          <>
            <div className="mb-2">
              <i className="bi bi-cloud-upload fs-1 text-muted"></i>
            </div>
            <div className="fw-bold mb-1">
              {dragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </div>
            <div className="text-muted small">
              {multiple ? `Up to ${maxFiles} files, ` : 'Single file, '}
              max {maxFileSize}MB each
            </div>
            <div className="text-muted small">Supported: JPG, PNG, GIF, WebP</div>
          </>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="danger" className="mt-3" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload info */}
      <div className="small text-muted mt-2">
        <div>
          Uploading to: <strong>{currentLocale.toUpperCase()}</strong> locale
        </div>
        {contentType !== 'general' && (
          <div>
            Content type: <strong>{contentType}</strong>
          </div>
        )}
      </div>

      {/* Preview of uploaded images */}
      {showPreview && uploadedImages.length > 0 && (
        <div className="uploaded-images mt-4">
          <h6>Uploaded Images</h6>
          <div className="row g-3">
            {uploadedImages.map(image => (
              <div key={image.id} className="col-md-6 col-lg-4">
                <div className="card">
                  <div className="position-relative">
                    <img
                      src={image.urls.thumbnail || image.urls.original}
                      alt={image.alt || image.originalName}
                      className="card-img-top"
                      style={{ height: '150px', objectFit: 'cover' }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute end-0 top-0 m-1"
                      onClick={() => removeImage(image.id)}
                    >
                      <i className="bi bi-x"></i>
                    </Button>
                  </div>
                  <div className="card-body p-2">
                    <div className="small">
                      <div className="fw-bold">{image.originalName}</div>
                      <div className="text-muted">
                        {image.dimensions.width} × {image.dimensions.height}
                      </div>
                      <div className="text-muted">
                        {(image.size / 1024).toFixed(1)} KB
                        {image.processingInfo.hasWebP && (
                          <span className="badge bg-success ms-1">WebP</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
