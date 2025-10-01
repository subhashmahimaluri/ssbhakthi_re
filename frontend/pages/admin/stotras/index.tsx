import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';

interface Stotra {
  canonicalSlug: string;
  contentType: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  imageUrl?: string | null;
  categories?: {
    typeIds: string[];
    devaIds: string[];
    byNumberIds: string[];
  };
  translations: {
    [key: string]: {
      title: string;
      slug: string;
      path: string;
      stotra?: string;
      stotraMeaning?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

interface StotrasResponse {
  stotras: Stotra[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    language: string;
    contentType: string;
  };
}

interface AdminStotrasPageProps {
  userRoles: string[];
}

export default function AdminStotrasPage({ userRoles }: AdminStotrasPageProps) {
  const router = useRouter();
  const [stotras, setStotras] = useState<Stotra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    locale: 'te',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    hasNext: false,
    hasPrev: false,
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stotraToDelete, setStotraToDelete] = useState<Stotra | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDelete = userRoles.includes('admin');

  useEffect(() => {
    fetchStotras();
  }, [filters, pagination.page]);

  const fetchStotras = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        lang: filters.locale || 'te',
        limit: pagination.limit.toString(),
        offset: ((pagination.page - 1) * pagination.limit).toString(),
      });

      // Only add status filter if a specific status is selected (not 'all')
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }
      // For admin pages, we want to show all statuses by default
      if (filters.search) {
        params.set('search', filters.search);
      }

      const response = await fetch(`/api/stotras?${params.toString()}`, {
        headers: {
          'x-admin-access': 'true', // Mark this as an admin request
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stotras: ${response.status}`);
      }

      const data: StotrasResponse = await response.json();

      setStotras(data.stotras);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev,
      }));
    } catch (error) {
      console.error('Error fetching stotras:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch stotras');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteClick = (stotra: Stotra) => {
    setStotraToDelete(stotra);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stotraToDelete || !canDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/stotras/delete?slug=${stotraToDelete.canonicalSlug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete stotra');
      }

      // Remove from list and refresh
      setStotras(prev => prev.filter(s => s.canonicalSlug !== stotraToDelete.canonicalSlug));
      setShowDeleteModal(false);
      setStotraToDelete(null);

      // Refresh the list to get updated pagination
      fetchStotras();
    } catch (error) {
      console.error('Error deleting stotra:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete stotra');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setStotraToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      published: 'success',
      draft: 'warning',
      scheduled: 'info',
      archived: 'secondary',
    };

    return (
      <Badge bg={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
        <AdminNav />
        <Container className="py-4">
          <div className="py-5 text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading stotras...</p>
          </div>
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
            <h1>Manage Stotras</h1>
            <p className="text-muted">Create, edit, and manage your devotional stotras</p>
          </Col>
          <Col xs="auto">
            <Link href="/admin/add-stotra">
              <Button variant="primary">
                <i className="bi bi-plus-circle me-1"></i>
                Add New Stotra
              </Button>
            </Link>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

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
                    <option value="all">All Status</option>
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
                    placeholder="Search stotras..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Row className="align-items-center">
              <Col>
                <h6 className="mb-0">Stotras ({pagination.total})</h6>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            {stotras.length === 0 ? (
              <div className="py-5 text-center">
                <i className="bi bi-journal-text display-1 text-muted"></i>
                <h5 className="text-muted mt-3">No stotras found</h5>
                <p className="text-muted">Get started by creating your first stotra</p>
                <Link href="/admin/add-stotra">
                  <Button variant="primary">Add New Stotra</Button>
                </Link>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Language</th>
                    <th>Author</th>
                    <th>Updated</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stotras.map(stotra => {
                    const translation =
                      stotra.translations[filters.locale] || Object.values(stotra.translations)[0];
                    const availableLanguages = Object.keys(stotra.translations);
                    return (
                      <tr key={stotra.canonicalSlug}>
                        <td>
                          <div>
                            <h6 className="mb-1">{translation?.title || 'Untitled'}</h6>
                            <small className="text-muted d-block">
                              <strong>Canonical Slug:</strong> <code>{stotra.canonicalSlug}</code>
                            </small>
                            {translation?.slug && translation.slug !== stotra.canonicalSlug && (
                              <small className="text-muted d-block">
                                <strong>Language Slug:</strong> <code>{translation.slug}</code>
                              </small>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(stotra.status)}</td>
                        <td>
                          <div>
                            {availableLanguages.map(lang => (
                              <Badge key={lang} bg="light" text="dark" className="me-1">
                                {lang.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{stotra.author?.name || 'Admin'}</div>
                            <small className="text-muted">{stotra.author?.email || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">{formatDate(stotra.updatedAt)}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Link href={`/stotras/${stotra.canonicalSlug}`}>
                              <Button variant="outline-primary" size="sm">
                                <i className="bi bi-eye me-1"></i>
                                View
                              </Button>
                            </Link>
                            <Link href={`/admin/stotras/${stotra.canonicalSlug}/edit`}>
                              <Button variant="outline-secondary" size="sm">
                                <i className="bi bi-pencil me-1"></i>
                                Edit
                              </Button>
                            </Link>
                            {canDelete && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteClick(stotra)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
          {stotras.length > 0 && (
            <Card.Footer>
              <Row className="align-items-center">
                <Col>
                  <small className="text-muted">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} stotras
                  </small>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Footer>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={handleDeleteCancel}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to delete the stotra{' '}
              <strong>
                {stotraToDelete?.translations.en?.title ||
                  Object.values(stotraToDelete?.translations || {})[0]?.title ||
                  'Untitled'}
              </strong>
              ?
            </p>
            <p className="text-danger">
              <i className="bi bi-exclamation-triangle me-1"></i>
              This action cannot be undone.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Deleting...
                </>
              ) : (
                'Delete Stotra'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
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
