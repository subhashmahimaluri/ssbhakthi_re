import CKEditor, { CKEditorRef } from '@/components/admin/CKEditor';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';

interface StotraEditorProps {
  stotraId?: string;
}

interface Category {
  id: string;
  name: {
    en?: string;
    te?: string;
  };
  slug: {
    en?: string;
    te?: string;
  };
  meta: {
    taxonomy: string;
    kind: string;
    parentSlug?: string | null;
  };
}

export default function StotraEditor({ stotraId }: StotraEditorProps) {
  const router = useRouter();
  const stotraEditorRef = useRef<CKEditorRef>(null);
  const meaningEditorRef = useRef<CKEditorRef>(null);
  const [currentLocale, setCurrentLocale] = useState('te');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState({
    title: { te: '', en: '', hi: '', kn: '' },
    slug: { te: '', en: '', hi: '', kn: '' },
    stotra: { te: '', en: '', hi: '', kn: '' },
    stotraMeaning: { te: '', en: '', hi: '', kn: '' },
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    scheduledAt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    featuredImage: '',
    categoryIds: [] as string[],
    devaIds: [] as string[],
    byNumberIds: [] as string[],
    tagIds: [] as string[],
  });

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load stotra data if editing
  useEffect(() => {
    if (stotraId && router.isReady) {
      loadStotra();
    }
  }, [stotraId, router.isReady, currentLocale]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        console.log('Categories loaded:', data.categories);
        setCategories(data.categories || []);
      } else {
        console.warn('Failed to load categories:', response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadStotra = async () => {
    if (!stotraId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/stotras/${stotraId}?locale=${currentLocale}`);

      if (!response.ok) {
        if (response.status === 404) {
          setErrors(['Stotra not found']);
          return;
        }
        throw new Error(`Failed to fetch stotra: ${response.status}`);
      }

      const stotra = await response.json();

      // Transform single language stotra to multilingual format
      const newFormData = {
        title: { te: '', en: '', hi: '', kn: '' },
        slug: { te: '', en: '', hi: '', kn: '' },
        stotra: { te: '', en: '', hi: '', kn: '' },
        stotraMeaning: { te: '', en: '', hi: '', kn: '' },
        status: stotra.status as 'draft' | 'published' | 'scheduled',
        scheduledAt: '',
        seoTitle: stotra.seoTitle || '',
        seoDescription: stotra.seoDescription || '',
        seoKeywords: stotra.seoKeywords || '',
        featuredImage: stotra.featuredImage || '',
        categoryIds: stotra.categories?.typeIds || [],
        devaIds: stotra.categories?.devaIds || [],
        byNumberIds: stotra.categories?.byNumberIds || [],
        tagIds: [],
      };

      // Set the current locale data
      newFormData.title[currentLocale as keyof typeof newFormData.title] = stotra.title || '';
      newFormData.slug[currentLocale as keyof typeof newFormData.slug] = stotra.slug || '';
      newFormData.stotra[currentLocale as keyof typeof newFormData.stotra] = stotra.stotra || '';
      newFormData.stotraMeaning[currentLocale as keyof typeof newFormData.stotraMeaning] =
        stotra.stotraMeaning || '';

      setFormData(newFormData);

      console.log('Loaded stotra data:', stotra);
      console.log('Set form data:', newFormData);
    } catch (error) {
      console.error('Error loading stotra:', error);
      setErrors(['Failed to load stotra data']);
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
    } else if (field === 'stotra') {
      setFormData(prev => ({
        ...prev,
        stotra: { ...prev.stotra, [currentLocale]: value },
      }));
    } else if (field === 'stotraMeaning') {
      setFormData(prev => ({
        ...prev,
        stotraMeaning: { ...prev.stotraMeaning, [currentLocale]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleStotraEditorChange = (data: string) => {
    setFormData(prev => ({
      ...prev,
      stotra: { ...prev.stotra, [currentLocale]: data },
    }));
  };

  const handleMeaningEditorChange = (data: string) => {
    setFormData(prev => ({
      ...prev,
      stotraMeaning: { ...prev.stotraMeaning, [currentLocale]: data },
    }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.title[currentLocale as keyof typeof formData.title]?.trim()) {
      newErrors.push('Title is required');
    }

    if (!formData.stotra[currentLocale as keyof typeof formData.stotra]?.trim()) {
      newErrors.push('Stotra content is required');
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
      const stotraData = {
        title: formData.title[currentLocale as keyof typeof formData.title],
        slug: formData.slug[currentLocale as keyof typeof formData.slug],
        stotra: formData.stotra[currentLocale as keyof typeof formData.stotra],
        stotraMeaning: formData.stotraMeaning[currentLocale as keyof typeof formData.stotraMeaning],
        status: formData.status,
        locale: currentLocale,
        scheduledAt: formData.scheduledAt || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        featuredImage: formData.featuredImage || undefined,
        categoryIds: formData.categoryIds,
        devaIds: formData.devaIds,
        byNumberIds: formData.byNumberIds,
        tagIds: formData.tagIds,
      };

      console.log('Submitting stotra data:', stotraData);
      console.log('Stotra ID:', stotraId);

      let response;

      if (stotraId) {
        // Update existing stotra
        response = await fetch(`/api/stotras/${stotraId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stotraData),
        });
      } else {
        // Create new stotra
        response = await fetch('/api/stotras/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stotraData),
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
      console.log('Stotra saved successfully:', result);

      // Redirect to stotras list
      router.push('/admin/stotras');
    } catch (error) {
      console.error('Save error:', error);

      let errorMessage = `Failed to save stotra: ${error instanceof Error ? error.message : 'Unknown error'}`;

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
        <p className="mt-2">Loading stotra...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h1>{stotraId ? 'Edit Stotra' : 'New Stotra'}</h1>
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
                    placeholder="Enter stotra title"
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
              </Card.Body>
            </Card>

            {/* Stotra Content Editor */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Stotra Content ({currentLocale.toUpperCase()})</h6>
              </Card.Header>
              <Card.Body>
                <CKEditor
                  ref={stotraEditorRef}
                  data={formData.stotra[currentLocale as keyof typeof formData.stotra] || ''}
                  onChange={handleStotraEditorChange}
                />
              </Card.Body>
            </Card>

            {/* Stotra Meaning/Translation Editor - Separate Section */}
            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-translate me-2"></i>
                  Stotra Meaning/Translation ({currentLocale.toUpperCase()})
                </h6>
                <small className="text-muted">
                  Provide meaning or translation of the stotra content above
                </small>
              </Card.Header>
              <Card.Body>
                <CKEditor
                  ref={meaningEditorRef}
                  data={
                    formData.stotraMeaning[currentLocale as keyof typeof formData.stotraMeaning] ||
                    ''
                  }
                  onChange={handleMeaningEditorChange}
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
                    {saving ? 'Saving...' : stotraId ? 'Update' : 'Create'} Stotra
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

            {/* Categories */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">Categories</h6>
              </Card.Header>
              <Card.Body>
                {loadingCategories ? (
                  <div className="py-3 text-center">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading categories...</span>
                  </div>
                ) : (
                  <>
                    {/* Debug categories */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="bg-light mb-3 rounded p-2">
                        <small className="text-muted">
                          <strong>Debug - Categories loaded:</strong> {categories.length}
                          <br />
                          {categories.slice(0, 3).map(cat => (
                            <div key={cat.id}>
                              {cat.name?.en || 'No name'} - {cat.meta?.taxonomy || 'No taxonomy'}
                            </div>
                          ))}
                        </small>
                      </div>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Type Categories</Form.Label>
                      <Form.Select
                        multiple
                        value={formData.categoryIds}
                        onChange={e => {
                          const values = Array.from(
                            e.target.selectedOptions,
                            option => option.value
                          );
                          setFormData(prev => ({ ...prev, categoryIds: values }));
                        }}
                      >
                        {categories
                          .filter(cat => cat.meta?.taxonomy === 'type')
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name?.en || category.slug?.en || 'Untitled'}
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Hold Ctrl/Cmd to select multiple categories. Found{' '}
                        {categories.filter(cat => cat.meta?.taxonomy === 'type').length} type
                        categories.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Deity Categories</Form.Label>
                      <Form.Select
                        multiple
                        value={formData.devaIds}
                        onChange={e => {
                          const values = Array.from(
                            e.target.selectedOptions,
                            option => option.value
                          );
                          setFormData(prev => ({ ...prev, devaIds: values }));
                        }}
                      >
                        {categories
                          .filter(cat => cat.meta?.taxonomy === 'deva')
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name?.en || category.slug?.en || 'Untitled'}
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Hold Ctrl/Cmd to select multiple deities. Found{' '}
                        {categories.filter(cat => cat.meta?.taxonomy === 'deva').length} deity
                        categories.
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Number Categories</Form.Label>
                      <Form.Select
                        multiple
                        value={formData.byNumberIds}
                        onChange={e => {
                          const values = Array.from(
                            e.target.selectedOptions,
                            option => option.value
                          );
                          setFormData(prev => ({ ...prev, byNumberIds: values }));
                        }}
                      >
                        {categories
                          .filter(cat => cat.meta?.taxonomy === 'by-number')
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name?.en || category.slug?.en || 'Untitled'}
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Hold Ctrl/Cmd to select multiple number categories. Found{' '}
                        {categories.filter(cat => cat.meta?.taxonomy === 'by-number').length} number
                        categories.
                      </Form.Text>
                    </Form.Group>
                  </>
                )}
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
