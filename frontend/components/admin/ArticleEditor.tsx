'use client';

import CKEditor, { CKEditorRef } from '@/components/admin/CKEditor';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';

interface ArticleEditorProps {
  articleId?: string;
}

interface ArticleData {
  id: string;
  title: string;
  summary: string;
  body: string;
  status: string;
  locale: string;
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImage?: string;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
}

export default function ArticleEditor({ articleId }: ArticleEditorProps) {
  const router = useRouter();
  const editorRef = useRef<CKEditorRef>(null);
  const [currentLocale, setCurrentLocale] = useState('te');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    articleTitle: '', // Common title for all translations
    canonicalSlug: '', // Common slug for all translations
    title: { te: '', en: '', hi: '', kn: '' },
    summary: { te: '', en: '', hi: '', kn: '' },
    body: { te: '', en: '', hi: '', kn: '' },
    videoId: { te: '', en: '', hi: '', kn: '' }, // YouTube video ID per language
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    scheduledAt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    featuredImage: '',
    categoryIds: [] as string[],
    tagIds: [] as string[],
  });

  // Load article data if editing
  useEffect(() => {
    if (articleId && router.isReady) {
      loadArticle();
    }
  }, [articleId, router.isReady, currentLocale]);

  const loadArticle = async () => {
    if (!articleId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}?locale=${currentLocale}`);

      if (!response.ok) {
        if (response.status === 404) {
          setErrors(['Article not found']);
          return;
        }
        throw new Error(`Failed to fetch article: ${response.status}`);
      }

      const article = await response.json();

      // Transform single language article to multilingual format
      const newFormData = {
        articleTitle: article.articleTitle || '', // Common title for all translations
        canonicalSlug: article.canonicalSlug || '', // Common slug for all translations
        title: { te: '', en: '', hi: '', kn: '' },
        summary: { te: '', en: '', hi: '', kn: '' },
        body: { te: '', en: '', hi: '', kn: '' },
        videoId: { te: '', en: '', hi: '', kn: '' }, // YouTube video ID per language
        status: article.status as 'draft' | 'published' | 'scheduled',
        scheduledAt: '',
        seoTitle: article.seoTitle || '',
        seoDescription: article.seoDescription || '',
        seoKeywords: article.seoKeywords || '',
        featuredImage: article.featuredImage || '',
        categoryIds: article.categories?.typeIds || [],
        tagIds: [],
      };

      // Set the current locale data
      newFormData.title[currentLocale as keyof typeof newFormData.title] = article.title || '';
      newFormData.summary[currentLocale as keyof typeof newFormData.summary] =
        article.summary || '';
      newFormData.body[currentLocale as keyof typeof newFormData.body] = article.body || '';
      newFormData.videoId[currentLocale as keyof typeof newFormData.videoId] =
        article.videoId || '';

      setFormData(newFormData);
    } catch (error) {
      setErrors(['Failed to load article data']);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    if (!title.trim()) return '';

    return (
      title
        .toLowerCase()
        // Replace common diacritics and special characters
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Keep only alphanumeric characters, spaces, and hyphens
        .replace(/[^a-z0-9\s-]/g, '')
        // Replace multiple spaces/hyphens with single hyphen
        .replace(/[\s-]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '')
        .trim()
    );
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: { ...prev.title, [currentLocale]: value },
    }));
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'articleTitle') {
      setFormData(prev => ({
        ...prev,
        articleTitle: value,
        // Auto-generate canonical slug from article title
        canonicalSlug: generateSlug(value),
      }));
    } else if (field === 'canonicalSlug') {
      setFormData(prev => ({
        ...prev,
        canonicalSlug: value,
      }));
    } else if (field === 'title') {
      setFormData(prev => ({
        ...prev,
        title: { ...prev.title, [currentLocale]: value },
      }));
    } else if (field === 'summary') {
      setFormData(prev => ({
        ...prev,
        summary: { ...prev.summary, [currentLocale]: value },
      }));
    } else if (field === 'body') {
      setFormData(prev => ({
        ...prev,
        body: { ...prev.body, [currentLocale]: value },
      }));
    } else if (field === 'videoId') {
      setFormData(prev => ({
        ...prev,
        videoId: { ...prev.videoId, [currentLocale]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleEditorChange = (data: string) => {
    setFormData(prev => ({
      ...prev,
      body: { ...prev.body, [currentLocale]: data },
    }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.title[currentLocale as keyof typeof formData.title]?.trim()) {
      newErrors.push('Title is required');
    }

    if (!formData.body[currentLocale as keyof typeof formData.body]?.trim()) {
      newErrors.push('Content is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      const articleData = {
        title: formData.title[currentLocale as keyof typeof formData.title],
        articleTitle: formData.articleTitle,
        canonicalSlug: formData.canonicalSlug,
        summary: formData.summary[currentLocale as keyof typeof formData.summary],
        body: formData.body[currentLocale as keyof typeof formData.body],
        videoId: formData.videoId[currentLocale as keyof typeof formData.videoId],
        status: formData.status,
        locale: currentLocale,
        scheduledAt: formData.scheduledAt || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        featuredImage: formData.featuredImage || undefined,
        categoryIds: formData.categoryIds,
        tagIds: formData.tagIds,
      };

      let response;

      if (articleId) {
        // Update existing article
        response = await fetch(`/api/articles/${articleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        });
      } else {
        // Create new article
        response = await fetch('/api/articles/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(articleData),
        });
      }

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Redirect to articles list
      router.push('/admin/articles');
    } catch (error) {
      let errorMessage = `Failed to save article: ${error instanceof Error ? error.message : 'Unknown error'}`;

      setErrors([errorMessage]);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setFormData(prev => ({ ...prev, status: 'draft' }));
    // Wait for state update then submit
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading article...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h1>{articleId ? 'Edit Article' : 'New Article'}</h1>
        </Col>
        <Col xs="auto">
          <Button variant="outline-secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </Col>
      </Row>

      {errors.length > 0 && (
        <Alert variant="danger">
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            {/* Language Tabs */}
            <Card className="mb-3">
              <Card.Header>
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
              </Card.Header>
            </Card>

            {/* Common Article Title */}
            <Card className="mb-3">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">
                  <i className="bi bi-star-fill me-2"></i>
                  Common Article Information
                </h6>
                <small className="text-light">
                  These fields apply to all language translations
                </small>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Article Title (Common for all languages)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.articleTitle}
                    onChange={e => handleFieldChange('articleTitle', e.target.value)}
                    placeholder="Enter common article title (e.g., Significance of Diwali Festival)"
                  />
                  <Form.Text className="text-muted">
                    This title is shared across all language translations and automatically
                    generates the URL slug
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Label>Canonical Slug (URL identifier)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.canonicalSlug}
                    onChange={e => handleFieldChange('canonicalSlug', e.target.value)}
                    placeholder="canonical-slug-for-all-languages"
                  />
                  <Form.Text className="text-muted">
                    Auto-generated from the article title above. You can edit it if needed (e.g.,
                    significance-of-diwali-festival)
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Language-specific Title */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-translate me-2"></i>
                  Language-specific Content ({currentLocale.toUpperCase()})
                </h6>
                <small className="text-muted">
                  Content specific to {currentLocale.toUpperCase()} language
                </small>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Title ({currentLocale.toUpperCase()})</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title[currentLocale as keyof typeof formData.title] || ''}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Enter article title"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Summary ({currentLocale.toUpperCase()})</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.summary[currentLocale as keyof typeof formData.summary] || ''}
                    onChange={e => handleFieldChange('summary', e.target.value)}
                    placeholder="Brief summary of the article"
                  />
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Label>YouTube Video ID ({currentLocale.toUpperCase()})</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.videoId[currentLocale as keyof typeof formData.videoId] || ''}
                    onChange={e => handleFieldChange('videoId', e.target.value)}
                    placeholder="Enter YouTube video ID (e.g., dQw4w9WgXcQ)"
                  />
                  <Form.Text className="text-muted">
                    YouTube video ID from the URL (e.g., for
                    https://youtube.com/watch?v=dQw4w9WgXcQ, enter 'dQw4w9WgXcQ')
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Content Editor */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Content ({currentLocale.toUpperCase()})</h6>
              </Card.Header>
              <Card.Body>
                <CKEditor
                  ref={editorRef}
                  data={formData.body[currentLocale as keyof typeof formData.body] || ''}
                  onChange={handleEditorChange}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Publish Settings */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Publish Settings</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, status: e.target.value as any }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </Form.Select>
                </Form.Group>

                {formData.status === 'scheduled' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Scheduled Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))
                      }
                    />
                  </Form.Group>
                )}

                <div className="d-grid gap-2">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Saving...' : articleId ? 'Update' : 'Create'} Article
                  </Button>
                  <Button
                    type="button"
                    variant="outline-primary"
                    disabled={saving}
                    onClick={handleSaveAsDraft}
                  >
                    Save as Draft
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* SEO Settings */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">SEO Settings</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>SEO Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.seoTitle}
                    onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="SEO optimized title"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>SEO Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.seoDescription}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, seoDescription: e.target.value }))
                    }
                    placeholder="Meta description for search engines"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Keywords</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.seoKeywords}
                    onChange={e => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
