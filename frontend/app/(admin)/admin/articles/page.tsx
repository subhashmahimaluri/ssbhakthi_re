'use client';

import AdminApolloProvider from '@/components/providers/AdminApolloProvider';
import AuthProvider from '@/components/providers/SessionProvider';
import { GET_ARTICLES } from '@/lib/graphql/articles';
import { Article } from '@/types/graphql';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { useState } from 'react';
import { Alert, Badge, Button, Col, Form, Pagination, Row, Spinner, Table } from 'react-bootstrap';

function ArticlesListContent() {
  const [filters, setFilters] = useState({
    locale: '',
    status: '',
    search: '',
    page: 1,
    limit: 20,
  });

  const { data, loading, error, refetch } = useQuery(GET_ARTICLES, {
    variables: {
      locale: filters.locale || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      sort: '-updatedAt',
    },
    errorPolicy: 'all',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'scheduled':
        return 'warning';
      case 'archived':
        return 'dark';
      default:
        return 'light';
    }
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error loading articles</Alert.Heading>
        <p>{error.message}</p>
        <Button variant="outline-danger" onClick={() => refetch()}>
          Try Again
        </Button>
      </Alert>
    );
  }

  const articles: Article[] = data?.articles || [];

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h1>Articles</h1>
        </Col>
        <Col xs="auto">
          <Link href="/admin/articles/new" passHref>
            <Button variant="primary">New Article</Button>
          </Link>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Locale</Form.Label>
            <Form.Select
              value={filters.locale}
              onChange={e => handleFilterChange('locale', e.target.value)}
            >
              <option value="">All Locales</option>
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
              <option value="draft">Draft</option>
              <option value="published">Published</option>
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
              placeholder="Search titles, content..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Articles Table */}
      <Table responsive striped hover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Locale</th>
            <th>Author</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-4 text-center">
                No articles found.
              </td>
            </tr>
          ) : (
            articles.map(article => (
              <tr key={article.id}>
                <td>
                  <Link href={`/admin/articles/${article.id}`} className="text-decoration-none">
                    {article.title}
                  </Link>
                  {article.summary && (
                    <div className="text-muted small">{article.summary.substring(0, 100)}...</div>
                  )}
                </td>
                <td>
                  <Badge bg={getStatusVariant(article.status)}>{article.status}</Badge>
                </td>
                <td>
                  <Badge bg="info">{article.locale.toUpperCase()}</Badge>
                </td>
                <td>{article.author.name}</td>
                <td>
                  <small>{new Date(article.updatedAt).toLocaleDateString()}</small>
                </td>
                <td>
                  <Link href={`/admin/articles/${article.id}`} passHref>
                    <Button variant="outline-primary" size="sm" className="me-1">
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline-danger" size="sm">
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Pagination */}
      <Row className="justify-content-center">
        <Col xs="auto">
          <Pagination>
            <Pagination.Prev
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            />
            <Pagination.Item active>{filters.page}</Pagination.Item>
            <Pagination.Next
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            />
          </Pagination>
        </Col>
      </Row>
    </div>
  );
}

export default function ArticlesList() {
  return (
    <AuthProvider>
      <AdminApolloProvider>
        <ArticlesListContent />
      </AdminApolloProvider>
    </AuthProvider>
  );
}
