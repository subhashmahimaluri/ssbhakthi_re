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
    stotraTitle: '', // Common title for all translations
    canonicalSlug: '', // Common slug for all translations
    title: { te: '', en: '', hi: '', kn: '' },
    stotra: { te: '', en: '', hi: '', kn: '' },
    stotraMeaning: { te: '', en: '', hi: '', kn: '' },
    videoId: { te: '', en: '', hi: '', kn: '' }, // YouTube video ID per language
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
      console.log('📂 Loading categories from /api/categories...');
      const response = await fetch('/api/categories');
      console.log('📂 Categories API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📂 Categories API response data:', data);
        console.log('📂 Categories array:', data.categories);
        console.log('📂 Categories count:', data.categories?.length || 0);

        // Log taxonomy distribution
        if (data.categories) {
          const typeCount = data.categories.filter(
            (cat: any) => cat.meta?.taxonomy === 'type'
          ).length;
          const devaCount = data.categories.filter(
            (cat: any) => cat.meta?.taxonomy === 'deva'
          ).length;
          const byNumberCount = data.categories.filter(
            (cat: any) => cat.meta?.taxonomy === 'by-number'
          ).length;
          console.log('📂 Taxonomy distribution:', { typeCount, devaCount, byNumberCount });
        }

        setCategories(data.categories || []);
      } else {
        console.warn('⚠️ Failed to load categories:', response.status, response.statusText);
        const errorText = await response.text();
        console.warn('⚠️ Categories API error:', errorText);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
      console.log('📂 Categories loading completed');
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
        stotraTitle: stotra.stotraTitle || '', // Common title for all translations
        canonicalSlug: stotra.canonicalSlug || '', // Common slug for all translations
        title: { te: '', en: '', hi: '', kn: '' },
        stotra: { te: '', en: '', hi: '', kn: '' },
        stotraMeaning: { te: '', en: '', hi: '', kn: '' },
        videoId: { te: '', en: '', hi: '', kn: '' }, // YouTube video ID per language
        status: stotra.status as 'draft' | 'published' | 'scheduled',
        scheduledAt: stotra.scheduledAt || '',
        seoTitle: stotra.seoTitle || '',
        seoDescription: stotra.seoDescription || '',
        seoKeywords: stotra.seoKeywords || '',
        featuredImage: stotra.featuredImage || '',
        categoryIds: stotra.categories?.typeIds || [],
        devaIds: stotra.categories?.devaIds || [],
        byNumberIds: stotra.categories?.byNumberIds || [],
        tagIds: [],
      };

      console.log('Loading existing categories:', {
        typeIds: stotra.categories?.typeIds,
        devaIds: stotra.categories?.devaIds,
        byNumberIds: stotra.categories?.byNumberIds,
      });

      // Set the current locale data
      newFormData.title[currentLocale as keyof typeof newFormData.title] = stotra.title || '';
      newFormData.stotra[currentLocale as keyof typeof newFormData.stotra] = stotra.stotra || '';
      newFormData.stotraMeaning[currentLocale as keyof typeof newFormData.stotraMeaning] =
        stotra.stotraMeaning || '';
      newFormData.videoId[currentLocale as keyof typeof newFormData.videoId] = stotra.videoId || '';

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
    if (field === 'stotraTitle') {
      setFormData(prev => ({
        ...prev,
        stotraTitle: value,
        // Auto-generate canonical slug from stotra title
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
    } else if (field === 'videoId') {
      setFormData(prev => ({
        ...prev,
        videoId: { ...prev.videoId, [currentLocale]: value },
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
        stotraTitle: formData.stotraTitle,
        canonicalSlug: formData.canonicalSlug,
        stotra: formData.stotra[currentLocale as keyof typeof formData.stotra],
        stotraMeaning:
          formData.stotraMeaning[currentLocale as keyof typeof formData.stotraMeaning] || null,
        videoId: formData.videoId[currentLocale as keyof typeof formData.videoId] || null,
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

      console.log('🔍 Form Data Details:');
      console.log('  - Title:', stotraData.title);
      console.log('  - Stotra Title:', stotraData.stotraTitle);
      console.log('  - Canonical Slug:', stotraData.canonicalSlug);
      console.log('  - Status:', stotraData.status);
      console.log('  - Locale:', stotraData.locale);
      console.log('  - Category IDs:', stotraData.categoryIds);
      console.log('  - Deva IDs:', stotraData.devaIds);
      console.log('  - ByNumber IDs:', stotraData.byNumberIds);
      console.log('  - Stotra Content Length:', stotraData.stotra?.length || 0);
      console.log('  - Stotra Meaning Length:', stotraData.stotraMeaning?.length || 0);
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
          // Ensure errorMessage is always a string
          const rawError = errorData.error || errorData.details || errorData.message;
          if (typeof rawError === 'object') {
            errorMessage = JSON.stringify(rawError);
          } else {
            errorMessage = String(rawError) || `HTTP ${response.status}`;
          }
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

            {/* Common Stotra Title */}
            <Card className="mb-3">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">
                  <i className="bi bi-star-fill me-2"></i>
                  Common Stotra Information
                </h6>
                <small className="text-light">
                  These fields apply to all language translations
                </small>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Stotra Title (Common for all languages)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.stotraTitle}
                    onChange={e => handleFieldChange('stotraTitle', e.target.value)}
                    placeholder="Enter common stotra title (e.g., Shiva Tandava Stotra)"
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
                    Auto-generated from the stotra title above. You can edit it if needed (e.g.,
                    shiva-tandava-stotra)
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Language-specific Title */}
            <Card className="mb-3">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-translate me-2"></i>
                  Language-specific Title ({currentLocale.toUpperCase()})
                </h6>
                <small className="text-muted">
                  Title specific to {currentLocale.toUpperCase()} language
                </small>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Title ({currentLocale.toUpperCase()})</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title[currentLocale as keyof typeof formData.title] || ''}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Enter stotra title in this language"
                    required
                  />
                  <Form.Text className="text-muted">
                    This is the language-specific title for {currentLocale.toUpperCase()}
                  </Form.Text>
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

            {/* Stotra Content Editor */}
            <Card className="stotra-editor-card mb-3">
              <Card.Header>
                <h6 className="mb-0">Stotra Content ({currentLocale.toUpperCase()})</h6>
              </Card.Header>
              <Card.Body className="stotra-content-editor">
                <CKEditor
                  id="stotra-content-editor"
                  ref={stotraEditorRef}
                  data={formData.stotra[currentLocale as keyof typeof formData.stotra] || ''}
                  onChange={handleStotraEditorChange}
                />
              </Card.Body>
            </Card>

            {/* Stotra Meaning/Translation Editor - Separate Section */}
            <Card className="stotra-meaning-card mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-translate me-2"></i>
                  Stotra Meaning/Translation ({currentLocale.toUpperCase()})
                </h6>
                <small className="text-muted">
                  Provide meaning or translation of the stotra content above
                </small>
              </Card.Header>
              <Card.Body className="stotra-meaning-editor">
                <CKEditor
                  id="stotra-meaning-editor"
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
                    {/* Debug categories and form data */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="bg-light mb-3 rounded p-2">
                        <small className="text-muted">
                          <strong>Debug Info:</strong>
                          <br />
                          Categories loaded: {categories.length}
                          <br />
                          Type categories:{' '}
                          {categories.filter(cat => cat.meta?.taxonomy === 'type').length}
                          <br />
                          Deva categories:{' '}
                          {categories.filter(cat => cat.meta?.taxonomy === 'deva').length}
                          <br />
                          ByNumber categories:{' '}
                          {categories.filter(cat => cat.meta?.taxonomy === 'by-number').length}
                          <br />
                          Selected typeIds: [{formData.categoryIds.join(', ')}]<br />
                          Selected devaIds: [{formData.devaIds.join(', ')}]<br />
                          Selected byNumberIds: [{formData.byNumberIds.join(', ')}]<br />
                          <strong>Category ID Mapping:</strong>
                          <br />
                          {formData.categoryIds.length > 0 && (
                            <div>
                              <strong>Type IDs:</strong>{' '}
                              {formData.categoryIds
                                .map(id => {
                                  const cat = categories.find(c => c.id === id);
                                  return cat ? `${id}:${cat.name?.en}` : `${id}:NOT_FOUND`;
                                })
                                .join(', ')}
                              <br />
                            </div>
                          )}
                          {formData.devaIds.length > 0 && (
                            <div>
                              <strong>Deva IDs:</strong>{' '}
                              {formData.devaIds
                                .map(id => {
                                  const cat = categories.find(c => c.id === id);
                                  return cat ? `${id}:${cat.name?.en}` : `${id}:NOT_FOUND`;
                                })
                                .join(', ')}
                              <br />
                            </div>
                          )}
                          {formData.byNumberIds.length > 0 && (
                            <div>
                              <strong>ByNumber IDs:</strong>{' '}
                              {formData.byNumberIds
                                .map(id => {
                                  const cat = categories.find(c => c.id === id);
                                  return cat ? `${id}:${cat.name?.en}` : `${id}:NOT_FOUND`;
                                })
                                .join(', ')}
                              <br />
                            </div>
                          )}
                          <details>
                            <summary>Sample categories (click to expand)</summary>
                            {categories.slice(0, 5).map(cat => (
                              <div key={cat.id} style={{ fontSize: '11px' }}>
                                {cat.id} | {cat.name?.en || 'No name'} |{' '}
                                {cat.meta?.taxonomy || 'No taxonomy'}
                              </div>
                            ))}
                          </details>
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
                          console.log('Type categories selected:', values);
                          setFormData(prev => ({ ...prev, categoryIds: values }));
                        }}
                        style={{ minHeight: '120px' }}
                      >
                        {categories
                          .filter(cat => cat.meta?.taxonomy === 'type')
                          .sort((a, b) => (a.name?.en || '').localeCompare(b.name?.en || ''))
                          .map(category => (
                            <option
                              key={category.id}
                              value={category.id}
                              selected={formData.categoryIds.includes(category.id)}
                            >
                              {category.name?.en || category.slug?.en || 'Untitled'}
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Hold Ctrl/Cmd to select multiple categories. Found{' '}
                        {categories.filter(cat => cat.meta?.taxonomy === 'type').length} type
                        categories. Selected: {formData.categoryIds.length}
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
                          console.log('Deva categories selected:', values);
                          setFormData(prev => ({ ...prev, devaIds: values }));
                        }}
                        style={{ minHeight: '120px' }}
                      >
                        {categories
                          .filter(cat => cat.meta?.taxonomy === 'deva')
                          .sort((a, b) => (a.name?.en || '').localeCompare(b.name?.en || ''))
                          .map(category => (
                            <option
                              key={category.id}
                              value={category.id}
                              selected={formData.devaIds.includes(category.id)}
                            >
                              {category.name?.en || category.slug?.en || 'Untitled'}
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Hold Ctrl/Cmd to select multiple deities. Found{' '}
                        {categories.filter(cat => cat.meta?.taxonomy === 'deva').length} deity
                        categories. Selected: {formData.devaIds.length}
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
                          console.log('ByNumber categories selected:', values);
                          setFormData(prev => ({ ...prev, byNumberIds: values }));
                        }}
                        style={{ minHeight: '120px' }}
                      >
                        {categories
                          .filter(cat => cat.meta?.taxonomy === 'by-number')
                          .sort((a, b) => (a.name?.en || '').localeCompare(b.name?.en || ''))
                          .map(category => (
                            <option
                              key={category.id}
                              value={category.id}
                              selected={formData.byNumberIds.includes(category.id)}
                            >
                              {category.name?.en || category.slug?.en || 'Untitled'}
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Hold Ctrl/Cmd to select multiple number categories. Found{' '}
                        {categories.filter(cat => cat.meta?.taxonomy === 'by-number').length} number
                        categories. Selected: {formData.byNumberIds.length}
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
