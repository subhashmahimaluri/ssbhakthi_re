import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  status: string;
  locale: string;
  publishedAt?: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
}

interface ArticlesPageProps {
  userRoles: string[];
}

export default function ArticlesPage({ userRoles }: ArticlesPageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    locale: 'te',
  });

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.locale) params.append('locale', filters.locale);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('limit', '50'); // Show more articles in admin

      const response = await fetch(`/api/articles?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      published: 'success',
      draft: 'secondary',
      scheduled: 'warning',
      archived: 'dark',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading articles...</p>
          </div>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Error Loading Articles</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchArticles}>
              Retry
            </Button>
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h1>Articles Management</h1>
            <p className="text-muted">Manage all articles in your content management system.</p>
          </Col>
          <Col xs="auto">
            <Link href="/admin/add-article" passHref>
              <Button variant="primary">Add New Article</Button>
            </Link>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Language</Form.Label>
                  <Form.Select
                    value={filters.locale}
                    onChange={e => handleFilterChange('locale', e.target.value)}
                  >
                    <option value="">All Languages</option>
                    <option value="te">Telugu</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="kn">Kannada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={e => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search articles..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Articles Table */}
        <Card>
          <Card.Body className="p-0">
            {articles.length === 0 ? (
              <div className="py-5 text-center">
                <h5>No Articles Found</h5>
                <p className="text-muted">
                  {filters.search || filters.status || filters.locale
                    ? 'No articles match your current filters.'
                    : "You haven't created any articles yet."}
                </p>
                <Link href="/admin/add-article" passHref>
                  <Button variant="primary">Create Your First Article</Button>
                </Link>
              </div>
            ) : (
              <Table responsive hover>
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Language</th>
                    <th>Author</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article.id}>
                      <td>
                        <div>
                          <strong>{article.title}</strong>
                          {article.summary && (
                            <div className="text-muted small">
                              {article.summary.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{getStatusBadge(article.status)}</td>
                      <td>
                        <Badge bg="light" text="dark">
                          {article.locale?.toUpperCase() || 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        <div>
                          <div>{article.author?.name || 'Unknown'}</div>
                          <small className="text-muted">{article.author?.email}</small>
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">{formatDate(article.updatedAt)}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Link href={`/admin/articles/${article.slug}/edit`} passHref>
                            <Button variant="outline-primary" size="sm">
                              Edit
                            </Button>
                          </Link>
                          {article.status === 'published' && (
                            <Link href={`/articles/${article.slug}`} passHref>
                              <Button variant="outline-secondary" size="sm" target="_blank">
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Show total count */}
        {articles.length > 0 && (
          <Row className="mt-3">
            <Col>
              <p className="text-muted">
                Showing {articles.length} article{articles.length !== 1 ? 's' : ''}
              </p>
            </Col>
          </Row>
        )}
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
