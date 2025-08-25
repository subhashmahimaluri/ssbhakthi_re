'use client';

import AuthProvider from '@/components/providers/SessionProvider';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Table } from 'react-bootstrap';

function UsersContent() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && !session.user.roles?.includes('admin')) {
      router.push('/admin');
    }
  }, [session, router]);

  if (!session?.user.roles?.includes('admin')) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>You do not have permission to access user management.</p>
      </Alert>
    );
  }

  // Mock users data - replace with actual GraphQL query
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      roles: ['admin'],
      status: 'active',
      lastLogin: '2024-01-15',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      roles: ['editor'],
      status: 'active',
      lastLogin: '2024-01-14',
    },
  ];

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h1>User Management</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary">Invite User</Button>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.roles.map(role => (
                      <Badge key={role} bg="primary" className="me-1">
                        {role}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    <Badge bg={user.status === 'active' ? 'success' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td>
                    <small>{new Date(user.lastLogin).toLocaleDateString()}</small>
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-1">
                      Edit
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      Disable
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <AuthProvider>
      <UsersContent />
    </AuthProvider>
  );
}
