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
  slug: string;
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
    title: { te: '', en: '', hi: '', kn: '' },
    slug: { te: '', en: '', hi: '', kn: '' },
    summary: { te: '', en: '', hi: '', kn: '' },
    body: { te: '', en: '', hi: '', kn: '' },
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
        title: { te: '', en: '', hi: '', kn: '' },
        slug: { te: '', en: '', hi: '', kn: '' },
        summary: { te: '', en: '', hi: '', kn: '' },
        body: { te: '', en: '', hi: '', kn: '' },
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
      newFormData.slug[currentLocale as keyof typeof newFormData.slug] = article.slug || '';
      newFormData.summary[currentLocale as keyof typeof newFormData.summary] =
        article.summary || '';
      newFormData.body[currentLocale as keyof typeof newFormData.body] = article.body || '';

      setFormData(newFormData);

      console.log('Loaded article data:', article);
      console.log('Set form data:', newFormData);
    } catch (error) {
      console.error('Error loading article:', error);
      setErrors(['Failed to load article data']);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: { ...prev.title, [currentLocale]: value },
      slug: { ...prev.slug, [currentLocale]: generateSlug(value) },
    }));
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'title') {
      setFormData(prev => ({
        ...prev,
        title: { ...prev.title, [currentLocale]: value },
      }));
    } else if (field === 'slug') {
      setFormData(prev => ({
        ...prev,
        slug: { ...prev.slug, [currentLocale]: value },
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
        slug: formData.slug[currentLocale as keyof typeof formData.slug],
        summary: formData.summary[currentLocale as keyof typeof formData.summary],
        body: formData.body[currentLocale as keyof typeof formData.body],
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

      console.log('Submitting article data:', articleData);
      console.log('Article ID:', articleId);

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
      console.log('Article saved successfully:', result);

      // Redirect to articles list
      router.push('/admin/articles');
    } catch (error) {
      console.error('Save error:', error);

      let errorMessage = `Failed to save article: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // Provide specific guidance for creation vs editing issues
      if (
        !articleId &&
        error instanceof Error &&
        error.message.includes('Failed to create article')
      ) {
        errorMessage =
          'Article creation is currently experiencing database validation issues. The article editing feature works correctly. Please try editing an existing article instead, or contact the administrator for assistance with creating new articles.';
      }

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

            {/* Title */}
            <Card className="mb-3">
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
                  <Form.Label>Slug ({currentLocale.toUpperCase()})</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.slug[currentLocale as keyof typeof formData.slug] || ''}
                    onChange={e => handleFieldChange('slug', e.target.value)}
                    placeholder="url-friendly-slug"
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
