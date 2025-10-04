import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import { getAuthSession } from '@/lib/auth-dev';
import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

interface AdminDashboardProps {
  userRoles: string[];
}

export default function AdminDashboard({ userRoles }: AdminDashboardProps) {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="text-center">
            <h2>Access Denied</h2>
            <p>Please log in to access the admin panel.</p>
          </div>
        </Container>
      </Layout>
    );
  }

  const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

  if (!hasAdminAccess) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="text-center">
            <h2>Access Denied</h2>
            <p>You don't have permission to access the admin panel.</p>
            <Link href="/my-account">
              <Button variant="primary">Go to My Account</Button>
            </Link>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <AdminNav />
      <Row className="justify-content-center">
        <Col>
          <h1 className="mb-4">Admin Dashboard Subhash</h1>
          <p className="text-muted mb-4">
            Welcome to the administration panel. Manage your content and settings here.
          </p>
        </Col>
      </Row>

      <Row>
        <Col md={6} lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>📝 Articles</Card.Title>
              <Card.Text className="flex-grow-1">
                Create, edit, and manage articles on your website.
              </Card.Text>
              <div className="mt-auto">
                <Link href="/admin/add-article" passHref>
                  <Button variant="primary" className="mb-2 me-2">
                    Add Article
                  </Button>
                </Link>
                <Link href="/admin/articles" passHref>
                  <Button variant="outline-primary" className="mb-2">
                    View Articles
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>🕉️ Stotras</Card.Title>
              <Card.Text className="flex-grow-1">
                Create, edit, and manage devotional stotras and prayers.
              </Card.Text>
              <div className="mt-auto">
                <Link href="/admin/add-stotra" passHref>
                  <Button variant="primary" className="mb-2 me-2">
                    Add Stotra
                  </Button>
                </Link>
                <Link href="/admin/stotras" passHref>
                  <Button variant="outline-primary" className="mb-2">
                    View Stotras
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={4} className="mb-4">
          <Card className="h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>🖼️ Media</Card.Title>
              <Card.Text className="flex-grow-1">
                Upload, organize, and manage your media files and images.
              </Card.Text>
              <div className="mt-auto">
                <Link href="/admin/media" passHref>
                  <Button variant="primary" className="mb-2 me-2">
                    Manage Media
                  </Button>
                </Link>
                <Link href="/admin/media" passHref>
                  <Button variant="outline-primary" className="mb-2">
                    Upload Files
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {userRoles.includes('admin') && (
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>👥 Users</Card.Title>
                <Card.Text className="flex-grow-1">Manage user accounts and permissions.</Card.Text>
                <div className="mt-auto">
                  <Button variant="outline-secondary" disabled>
                    Coming Soon
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {(userRoles.includes('admin') || userRoles.includes('editor')) && (
          <Col md={6} lg={4} className="mb-4">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>🏷️ Categories & Tags</Card.Title>
                <Card.Text className="flex-grow-1">
                  Organize your content with categories and tags.
                </Card.Text>
                <div className="mt-auto">
                  <Link href="/admin/categories" passHref>
                    <Button variant="primary" className="mb-2 me-2">
                      Manage Categories
                    </Button>
                  </Link>
                  <Link href="/admin/categories/add" passHref>
                    <Button variant="outline-primary" className="mb-2">
                      Add Category
                    </Button>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Row className="mb-3 mt-4">
        <Col>
          <Card className="bg-light">
            <Card.Body>
              <h5>Your Roles</h5>
              <div>
                {userRoles.map(role => (
                  <span key={role} className="badge bg-primary me-2">
                    {role}
                  </span>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getAuthSession(context.req, context.res);

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
