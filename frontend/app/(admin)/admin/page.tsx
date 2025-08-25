'use client';

import AdminApolloProvider from '@/components/providers/AdminApolloProvider';
import AuthProvider from '@/components/providers/SessionProvider';
import { useSession } from 'next-auth/react';
import { Card, Col, Row } from 'react-bootstrap';

function DashboardContent() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      <Row>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>📝</Card.Title>
              <Card.Text>
                <strong>Articles</strong>
                <br />
                <small className="text-muted">Manage content</small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>🖼️</Card.Title>
              <Card.Text>
                <strong>Media</strong>
                <br />
                <small className="text-muted">Upload files</small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>📅</Card.Title>
              <Card.Text>
                <strong>Panchangam</strong>
                <br />
                <small className="text-muted">Calendar data</small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        {session?.user.roles?.includes('admin') && (
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <Card.Title>👥</Card.Title>
                <Card.Text>
                  <strong>Users</strong>
                  <br />
                  <small className="text-muted">Manage users</small>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>Welcome</Card.Header>
            <Card.Body>
              <Card.Text>Welcome to the SSBhakthi Admin Panel, {session?.user.name}!</Card.Text>
              <Card.Text>Your roles: {session?.user.roles?.join(', ')}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AuthProvider>
      <AdminApolloProvider>
        <DashboardContent />
      </AdminApolloProvider>
    </AuthProvider>
  );
}
