import { useEffect, useState } from 'react';
import { Alert, Card, Col, Container, Row } from 'react-bootstrap';

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

export default function TestCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
          setError(`Failed to load categories: ${response.status}`);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const typeCategories = categories.filter(cat => cat.meta?.taxonomy === 'type');
  const devaCategories = categories.filter(cat => cat.meta?.taxonomy === 'deva');
  const byNumberCategories = categories.filter(cat => cat.meta?.taxonomy === 'by-number');

  if (loading)
    return (
      <Container className="py-5">
        <p>Loading...</p>
      </Container>
    );

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1>Categories Test Page</h1>
          <p className="text-muted">Testing the three-category system for Stotra Editor</p>

          {error && (
            <Alert variant="danger">
              <strong>Error:</strong> {error}
            </Alert>
          )}

          <div className="mb-4">
            <h5>Categories Summary:</h5>
            <ul>
              <li>
                <strong>Total Categories:</strong> {categories.length}
              </li>
              <li>
                <strong>Type Categories:</strong> {typeCategories.length}
              </li>
              <li>
                <strong>Deva Categories:</strong> {devaCategories.length}
              </li>
              <li>
                <strong>By-Number Categories:</strong> {byNumberCategories.length}
              </li>
            </ul>
          </div>

          <Row>
            <Col md={4}>
              <Card>
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">Type Categories ({typeCategories.length})</h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {typeCategories.map(cat => (
                    <div key={cat.id} className="border-bottom py-2">
                      <strong>{cat.name?.en || 'No name'}</strong>
                      <br />
                      <small className="text-muted">ID: {cat.id}</small>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Header className="bg-success text-white">
                  <h6 className="mb-0">Deva Categories ({devaCategories.length})</h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {devaCategories.map(cat => (
                    <div key={cat.id} className="border-bottom py-2">
                      <strong>{cat.name?.en || 'No name'}</strong>
                      <br />
                      <small className="text-muted">ID: {cat.id}</small>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Header className="bg-warning text-dark">
                  <h6 className="mb-0">By-Number Categories ({byNumberCategories.length})</h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {byNumberCategories.map(cat => (
                    <div key={cat.id} className="border-bottom py-2">
                      <strong>{cat.name?.en || 'No name'}</strong>
                      <br />
                      <small className="text-muted">ID: {cat.id}</small>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="mt-4">
            <Alert variant="info">
              <h6>Expected IDs for shiva-tandava-stotra:</h6>
              <ul className="mb-0">
                <li>
                  <strong>Selected typeIds:</strong> [68ac2239bfcc70ec4468aa85] - Should be found in
                  Type Categories
                </li>
                <li>
                  <strong>Selected devaIds:</strong> [68ac2239bfcc70ec4468aac0] - Should be found in
                  Deva Categories
                </li>
                <li>
                  <strong>Selected byNumberIds:</strong> [] - Empty as expected
                </li>
              </ul>
            </Alert>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
