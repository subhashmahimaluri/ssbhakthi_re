import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
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
  description?: {
    en?: string;
    te?: string;
  };
  meta: {
    taxonomy: string;
    kind: string;
    parentSlug?: string | null;
  };
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesPageProps {
  userRoles: string[];
}

export default function CategoriesPage({ userRoles }: CategoriesPageProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>('');

  const hasEditAccess = userRoles.some(role => ['admin', 'editor'].includes(role));
  const hasDeleteAccess = userRoles.includes('admin');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, selectedTaxonomy, searchTerm]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/categories');

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories;

    // Filter by taxonomy
    if (selectedTaxonomy !== 'all') {
      filtered = filtered.filter(cat => cat.meta?.taxonomy === selectedTaxonomy);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        cat =>
          cat.name?.en?.toLowerCase().includes(term) ||
          cat.name?.te?.toLowerCase().includes(term) ||
          cat.slug?.en?.toLowerCase().includes(term) ||
          cat.slug?.te?.toLowerCase().includes(term)
      );
    }

    // Sort by taxonomy first, then by order, then by name
    filtered.sort((a, b) => {
      // First sort by taxonomy
      const taxonomyOrder = ['type', 'deva', 'by-number'];
      const aTaxIndex = taxonomyOrder.indexOf(a.meta?.taxonomy || '');
      const bTaxIndex = taxonomyOrder.indexOf(b.meta?.taxonomy || '');

      if (aTaxIndex !== bTaxIndex) {
        return aTaxIndex - bTaxIndex;
      }

      // Then by order
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      // Finally by name
      return (a.name?.en || '').localeCompare(b.name?.en || '');
    });

    setFilteredCategories(filtered);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      setError('');

      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to delete category: ${response.status}`);
      }

      // Remove from local state
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const getTaxonomyBadgeVariant = (taxonomy: string) => {
    switch (taxonomy) {
      case 'type':
        return 'primary';
      case 'deva':
        return 'info';
      case 'by-number':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getTaxonomyLabel = (taxonomy: string) => {
    switch (taxonomy) {
      case 'type':
        return 'Type';
      case 'deva':
        return 'Deity';
      case 'by-number':
        return 'Number';
      default:
        return taxonomy;
    }
  };

  const getCategoryCounts = () => {
    const counts = {
      all: categories.length,
      type: categories.filter(cat => cat.meta?.taxonomy === 'type').length,
      deva: categories.filter(cat => cat.meta?.taxonomy === 'deva').length,
      'by-number': categories.filter(cat => cat.meta?.taxonomy === 'by-number').length,
    };
    return counts;
  };

  if (loading) {
    return (
      <Layout>
        <AdminNav />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading categories...</p>
          </div>
        </Container>
      </Layout>
    );
  }

  const counts = getCategoryCounts();

  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h1>📂 Categories Management</h1>
            <p className="text-muted">
              Manage categories for organizing your content. Categories are grouped by taxonomy:
              Type, Deity, and Number.
            </p>
          </Col>
          <Col xs="auto">
            {hasEditAccess && (
              <Button variant="primary" onClick={() => router.push('/admin/categories/add')}>
                ➕ Add Category
              </Button>
            )}
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {/* Filter and Search Controls */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Filter by Taxonomy</Form.Label>
                  <Form.Select
                    value={selectedTaxonomy}
                    onChange={e => setSelectedTaxonomy(e.target.value)}
                  >
                    <option value="all">All Categories ({counts.all})</option>
                    <option value="type">Type Categories ({counts.type})</option>
                    <option value="deva">Deity Categories ({counts.deva})</option>
                    <option value="by-number">Number Categories ({counts['by-number']})</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Search Categories</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or slug..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Categories Table */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              Categories ({filteredCategories.length})
              {selectedTaxonomy !== 'all' && (
                <span className="text-muted"> - {getTaxonomyLabel(selectedTaxonomy)} Only</span>
              )}
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            {filteredCategories.length === 0 ? (
              <div className="py-5 text-center">
                <h6 className="text-muted">No categories found</h6>
                <p className="text-muted">
                  {searchTerm.trim() || selectedTaxonomy !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Start by creating your first category.'}
                </p>
                {hasEditAccess && (
                  <Button
                    variant="outline-primary"
                    onClick={() => router.push('/admin/categories/add')}
                  >
                    ➕ Add Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Taxonomy</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map(category => (
                      <tr key={category.id}>
                        <td>
                          <div>
                            <strong>{category.name?.en || 'Untitled'}</strong>
                            {category.name?.te && (
                              <div className="text-muted small">{category.name.te}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <code className="text-primary">{category.slug?.en || '-'}</code>
                            {category.slug?.te && (
                              <div className="text-muted small">
                                <code>{category.slug.te}</code>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge bg={getTaxonomyBadgeVariant(category.meta?.taxonomy || '')}>
                            {getTaxonomyLabel(category.meta?.taxonomy || '')}
                          </Badge>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">{category.order}</span>
                        </td>
                        <td>
                          <Badge bg={category.isActive ? 'success' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {hasEditAccess && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => router.push(`/admin/categories/edit/${category.id}`)}
                              >
                                ✏️ Edit
                              </Button>
                            )}
                            {hasDeleteAccess && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setCategoryToDelete(category);
                                  setShowDeleteModal(true);
                                }}
                              >
                                🗑️ Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Summary Stats */}
        <Row className="mt-4">
          <Col>
            <Card className="bg-light">
              <Card.Body>
                <h6>📊 Category Statistics</h6>
                <Row>
                  <Col sm={3}>
                    <div className="text-center">
                      <div className="h4 text-primary">{counts.type}</div>
                      <div className="text-muted small">Type Categories</div>
                    </div>
                  </Col>
                  <Col sm={3}>
                    <div className="text-center">
                      <div className="h4 text-info">{counts.deva}</div>
                      <div className="text-muted small">Deity Categories</div>
                    </div>
                  </Col>
                  <Col sm={3}>
                    <div className="text-center">
                      <div className="h4 text-warning">{counts['by-number']}</div>
                      <div className="text-muted small">Number Categories</div>
                    </div>
                  </Col>
                  <Col sm={3}>
                    <div className="text-center">
                      <div className="h4 text-success">{counts.all}</div>
                      <div className="text-muted small">Total Categories</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {categoryToDelete && (
              <div>
                <p>
                  Are you sure you want to delete the category{' '}
                  <strong>"{categoryToDelete.name?.en || 'Untitled'}"</strong>?
                </p>
                <div className="alert alert-warning">
                  <small>
                    <strong>Warning:</strong> This action cannot be undone. Any content using this
                    category may be affected.
                  </small>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCategory} disabled={deleting}>
              {deleting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Deleting...
                </>
              ) : (
                'Delete Category'
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
