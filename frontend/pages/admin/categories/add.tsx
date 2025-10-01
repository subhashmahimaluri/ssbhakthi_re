import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';

interface AddCategoryPageProps {
  userRoles: string[];
}

export default function AddCategoryPage({ userRoles }: AddCategoryPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: { en: '', te: '' },
    slug: { en: '', te: '' },
    description: { en: '', te: '' },
    taxonomy: 'type',
    order: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const hasCreateAccess = userRoles.some(role => ['admin', 'editor'].includes(role));

  if (!hasCreateAccess) {
    return (
      <Layout>
        <AdminNav />
        <Container className="py-5">
          <div className="text-center">
            <h2>Access Denied</h2>
            <p>You don't have permission to create categories.</p>
            <Button variant="outline-primary" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </Container>
      </Layout>
    );
  }

  const generateSlug = (text: string): string => {
    if (!text.trim()) return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  };

  const handleNameChange = (lang: 'en' | 'te', value: string) => {
    setFormData(prev => ({
      ...prev,
      name: { ...prev.name, [lang]: value },
      // Auto-generate slug for English name
      ...(lang === 'en' && {
        slug: { ...prev.slug, en: generateSlug(value) },
      }),
    }));
  };

  const handleSlugChange = (lang: 'en' | 'te', value: string) => {
    const cleanSlug = generateSlug(value);
    setFormData(prev => ({
      ...prev,
      slug: { ...prev.slug, [lang]: cleanSlug },
    }));
  };

  const handleDescriptionChange = (lang: 'en' | 'te', value: string) => {
    setFormData(prev => ({
      ...prev,
      description: { ...prev.description, [lang]: value },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validate required English name
    if (!formData.name.en?.trim()) {
      newErrors.push('English name is required');
    }

    // Validate required English slug
    if (!formData.slug.en?.trim()) {
      newErrors.push('English slug is required');
    }

    // Validate taxonomy
    const validTaxonomies = ['type', 'deva', 'by-number'];
    if (!validTaxonomies.includes(formData.taxonomy)) {
      newErrors.push('Invalid taxonomy selected');
    }

    // Validate slug format
    const slugPattern = /^[a-z0-9-]+$/;
    if (formData.slug.en && !slugPattern.test(formData.slug.en)) {
      newErrors.push('English slug must contain only lowercase letters, numbers, and hyphens');
    }
    if (formData.slug.te && !slugPattern.test(formData.slug.te)) {
      newErrors.push('Telugu slug must contain only lowercase letters, numbers, and hyphens');
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
      const categoryData = {
        name: {
          en: formData.name.en.trim(),
          ...(formData.name.te?.trim() && { te: formData.name.te.trim() }),
        },
        slug: {
          en: formData.slug.en.trim(),
          ...(formData.slug.te?.trim() && { te: formData.slug.te.trim() }),
        },
        ...((formData.description.en?.trim() || formData.description.te?.trim()) && {
          description: {
            ...(formData.description.en?.trim() && { en: formData.description.en.trim() }),
            ...(formData.description.te?.trim() && { te: formData.description.te.trim() }),
          },
        }),
        taxonomy: formData.taxonomy,
        order: formData.order,
        isActive: formData.isActive,
      };

      const response = await fetch('/api/categories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to create category: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Category created successfully:', result.category);

      // Redirect to categories list
      router.push('/admin/categories');
    } catch (error) {
      console.error('❌ Error creating category:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to create category']);
    } finally {
      setSaving(false);
    }
  };

  const getTaxonomyDescription = (taxonomy: string): string => {
    switch (taxonomy) {
      case 'type':
        return 'Type categories define the fundamental type or genre of content (e.g., Stotra, Mantra, Prayer)';
      case 'deva':
        return 'Deity categories represent different gods, goddesses, or divine entities (e.g., Shiva, Vishnu, Ganesha)';
      case 'by-number':
        return 'Number categories classify content by count or sequence (e.g., 108 Names, 1000 Names, Ashtothram)';
      default:
        return '';
    }
  };

  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h1>➕ Add New Category</h1>
            <p className="text-muted">
              Create a new category to organize your content. Categories help users find and browse
              related content.
            </p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-secondary" onClick={() => router.back()}>
              ← Cancel
            </Button>
          </Col>
        </Row>

        {errors.length > 0 && (
          <Alert variant="danger">
            <strong>Please fix the following errors:</strong>
            <ul className="mb-0 mt-2">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col lg={8}>
              {/* Category Names */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📝 Category Names</h5>
                  <small className="text-muted">Provide names in both English and Telugu</small>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>English Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name.en}
                          onChange={e => handleNameChange('en', e.target.value)}
                          placeholder="Enter category name in English"
                          required
                        />
                        <Form.Text className="text-muted">
                          This will be the primary display name (required)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Telugu Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name.te}
                          onChange={e => handleNameChange('te', e.target.value)}
                          placeholder="కేటగిరీ పేరు తెలుగులో"
                        />
                        <Form.Text className="text-muted">
                          Optional: Telugu translation of the category name
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Category Slugs */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">🔗 URL Slugs</h5>
                  <small className="text-muted">URL-friendly identifiers for the category</small>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>English Slug *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.slug.en}
                          onChange={e => handleSlugChange('en', e.target.value)}
                          placeholder="category-slug"
                          required
                        />
                        <Form.Text className="text-muted">
                          Auto-generated from English name. Use lowercase, hyphens only.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Telugu Slug</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.slug.te}
                          onChange={e => handleSlugChange('te', e.target.value)}
                          placeholder="telugu-slug"
                        />
                        <Form.Text className="text-muted">
                          Optional: Telugu URL slug (use transliterated form)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Category Descriptions */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📄 Descriptions</h5>
                  <small className="text-muted">Optional descriptions for the category</small>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>English Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={formData.description.en}
                          onChange={e => handleDescriptionChange('en', e.target.value)}
                          placeholder="Brief description of this category..."
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Telugu Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={formData.description.te}
                          onChange={e => handleDescriptionChange('te', e.target.value)}
                          placeholder="ఈ కేటగిరీ గురించి వివరణ..."
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Category Settings */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">⚙️ Category Settings</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Taxonomy *</Form.Label>
                    <Form.Select
                      value={formData.taxonomy}
                      onChange={e => setFormData(prev => ({ ...prev, taxonomy: e.target.value }))}
                      required
                    >
                      <option value="type">Type Categories</option>
                      <option value="deva">Deity Categories</option>
                      <option value="by-number">Number Categories</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      {getTaxonomyDescription(formData.taxonomy)}
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Display Order</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.order}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                      }
                      min="0"
                      step="1"
                    />
                    <Form.Text className="text-muted">
                      Lower numbers appear first in lists (0 = first)
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      id="isActive"
                      label="Active Category"
                      checked={formData.isActive}
                      onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <Form.Text className="text-muted">
                      Inactive categories won't appear in content selection
                    </Form.Text>
                  </Form.Group>

                  <hr />

                  <div className="d-grid gap-2">
                    <Button type="submit" variant="primary" size="lg" disabled={saving}>
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating Category...
                        </>
                      ) : (
                        '✅ Create Category'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => router.back()}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Preview */}
              <Card className="bg-light">
                <Card.Header>
                  <h6 className="mb-0">👁️ Preview</h6>
                </Card.Header>
                <Card.Body>
                  <div className="small">
                    <strong>Display Name:</strong>
                    <br />
                    {formData.name.en || <em className="text-muted">English name required</em>}
                    {formData.name.te && (
                      <>
                        <br />
                        <span className="text-muted">{formData.name.te}</span>
                      </>
                    )}
                  </div>
                  <hr className="my-2" />
                  <div className="small">
                    <strong>URL Slug:</strong>
                    <br />
                    <code>{formData.slug.en || 'slug-required'}</code>
                    {formData.slug.te && (
                      <>
                        <br />
                        <code className="text-muted">{formData.slug.te}</code>
                      </>
                    )}
                  </div>
                  <hr className="my-2" />
                  <div className="small">
                    <strong>Taxonomy:</strong>
                    <br />
                    <span
                      className={`badge bg-${formData.taxonomy === 'type' ? 'primary' : formData.taxonomy === 'deva' ? 'info' : 'warning'}`}
                    >
                      {formData.taxonomy === 'type'
                        ? 'Type'
                        : formData.taxonomy === 'deva'
                          ? 'Deity'
                          : 'Number'}
                    </span>
                    <span className="badge bg-light text-dark ms-2">Order: {formData.order}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const userRoles = (session.user?.roles as string[]) || [];
  const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

  if (!hasAdminAccess) {
    return {
      redirect: {
        destination: '/my-account',
        permanent: false,
      },
    };
  }

  return {
    props: {
      userRoles,
    },
  };
};
