'use client';

import CKEditor, { CKEditorRef } from '@/components/admin/CKEditor';
import AdminApolloProvider from '@/components/providers/AdminApolloProvider';
import AuthProvider from '@/components/providers/SessionProvider';
import {
  CREATE_ARTICLE,
  GET_ARTICLE,
  GET_CATEGORIES,
  GET_TAGS,
  UPDATE_ARTICLE,
} from '@/lib/graphql/articles';
import { CreateArticleInput, UpdateArticleInput } from '@/types/graphql';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';

interface ArticleEditorProps {
  articleId?: string;
}

function ArticleEditorContent({ articleId }: ArticleEditorProps) {
  const router = useRouter();
  const editorRef = useRef<CKEditorRef>(null);
  const [currentLocale, setCurrentLocale] = useState('te');
  const [formData, setFormData] = useState({
    title: { te: '', en: '', hi: '', kn: '' },
    slug: { te: '', en: '', hi: '', kn: '' },
    summary: { te: '', en: '', hi: '', kn: '' },
    body: { te: '', en: '', hi: '', kn: '' },
    status: 'draft' as const,
    scheduledAt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    featuredImage: '',
    categoryIds: [] as string[],
    tagIds: [] as string[],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // GraphQL operations
  const { data: articleData, loading: articleLoading } = useQuery(GET_ARTICLE, {
    variables: { id: articleId },
    skip: !articleId,
    onCompleted: data => {
      if (data.article) {
        const article = data.article;
        setFormData({
          title: {
            te: article.title || '',
            en: '',
            hi: '',
            kn: '',
          },
          slug: {
            te: article.slug || '',
            en: '',
            hi: '',
            kn: '',
          },
          summary: {
            te: article.summary || '',
            en: '',
            hi: '',
            kn: '',
          },
          body: {
            te: article.body || '',
            en: '',
            hi: '',
            kn: '',
          },
          status: article.status,
          scheduledAt: article.scheduledAt || '',
          seoTitle: article.seoTitle || '',
          seoDescription: article.seoDescription || '',
          seoKeywords: article.seoKeywords || '',
          featuredImage: article.featuredImage || '',
          categoryIds: article.categories.map(c => c.id),
          tagIds: article.tags.map(t => t.id),
        });
        setCurrentLocale(article.locale);
      }
    },
  });

  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const { data: tagsData } = useQuery(GET_TAGS);

  const [createArticle] = useMutation(CREATE_ARTICLE);
  const [updateArticle] = useMutation(UPDATE_ARTICLE);

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
    if (['title', 'slug', 'summary', 'body'].includes(field)) {
      setFormData(prev => ({
        ...prev,
        [field]: { ...prev[field as keyof typeof prev.title], [currentLocale]: value },
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

    if (!formData.title[currentLocale].trim()) {
      newErrors.push('Title is required');
    }

    if (!formData.body[currentLocale].trim()) {
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

    try {
      const input: CreateArticleInput | UpdateArticleInput = {
        title: formData.title[currentLocale],
        slug: formData.slug[currentLocale],
        summary: formData.summary[currentLocale],
        body: formData.body[currentLocale],
        status: formData.status,
        scheduledAt: formData.scheduledAt || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        seoKeywords: formData.seoKeywords || undefined,
        featuredImage: formData.featuredImage || undefined,
        categoryIds: formData.categoryIds,
        tagIds: formData.tagIds,
      };

      if (articleId) {
        await updateArticle({
          variables: { id: articleId, input },
        });
      } else {
        await createArticle({
          variables: {
            input: {
              ...input,
              locale: currentLocale,
            } as CreateArticleInput,
          },
        });
      }

      router.push('/admin/articles');
    } catch (error) {
      console.error('Save error:', error);
      setErrors(['Failed to save article. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  if (articleLoading) {
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
                    value={formData.title[currentLocale]}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Enter article title"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Slug ({currentLocale.toUpperCase()})</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.slug[currentLocale]}
                    onChange={e => handleFieldChange('slug', e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Summary ({currentLocale.toUpperCase()})</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.summary[currentLocale]}
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
                  data={formData.body[currentLocale]}
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
                  <Button type="button" variant="outline-primary" disabled={saving}>
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

export default function ArticleEditor({ articleId }: ArticleEditorProps) {
  return (
    <AuthProvider>
      <AdminApolloProvider>
        <ArticleEditorContent articleId={articleId} />
      </AdminApolloProvider>
    </AuthProvider>
  );
}
