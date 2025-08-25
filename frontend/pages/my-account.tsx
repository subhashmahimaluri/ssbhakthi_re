import Layout from '@/components/Layout/Layout';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Badge, Button, Card, Col, Container, Row, Tab, Tabs } from 'react-bootstrap';
import { authOptions } from './api/auth/[...nextauth]';

export default function MyAccount() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (!session) {
    return (
      <Layout>
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={6}>
              <Card>
                <Card.Body className="text-center">
                  <h3>Please Sign In</h3>
                  <p>You need to be signed in to access your account page.</p>
                  <Button href="/auth/signin" variant="primary">
                    Sign In
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="py-5">
        <Row>
          <Col md={12}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>My Account</h1>
              <Button variant="outline-danger" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>

            <Tabs
              id="account-tabs"
              activeKey={activeTab}
              onSelect={k => setActiveTab(k || 'profile')}
              className="mb-4"
            >
              <Tab eventKey="profile" title="Profile">
                <Card>
                  <Card.Header>
                    <h4>Profile Information</h4>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Name:</label>
                          <p className="form-control-plaintext">
                            {session.user.name || 'Not provided'}
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Email:</label>
                          <p className="form-control-plaintext">
                            {session.user.email || 'Not provided'}
                          </p>
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label fw-bold">User ID:</label>
                          <p className="form-control-plaintext">
                            <code>{session.user.id}</code>
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Roles:</label>
                          <div>
                            {session.user.roles && session.user.roles.length > 0 ? (
                              session.user.roles.map(role => (
                                <Badge key={role} bg="primary" className="me-1">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <Badge bg="secondary">User</Badge>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              <Tab eventKey="preferences" title="Preferences">
                <Card>
                  <Card.Header>
                    <h4>Account Preferences</h4>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Language:</label>
                          <p className="form-control-plaintext">Telugu / English</p>
                          <small className="text-muted">
                            Language preferences are managed through the site navigation
                          </small>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Notifications:</label>
                          <p className="form-control-plaintext">Enabled</p>
                          <small className="text-muted">
                            Notification settings will be available in future updates
                          </small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab>

              <Tab eventKey="activity" title="Activity">
                <Card>
                  <Card.Header>
                    <h4>Recent Activity</h4>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-muted py-4 text-center">
                      <h5>No Recent Activity</h5>
                      <p>
                        Your account activity will appear here once you start using the platform.
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>

            {/* Admin Panel Access */}
            {session.user.roles?.some(role => ['admin', 'editor', 'author'].includes(role)) && (
              <Card className="border-warning mt-4">
                <Card.Header className="bg-warning bg-opacity-25">
                  <h5 className="mb-0">🔐 Administrative Access</h5>
                </Card.Header>
                <Card.Body>
                  <p className="mb-3">You have administrative privileges on this platform.</p>
                  <Button variant="warning" href="/admin">
                    Access Admin Panel
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Allow access even without session - component will handle redirect
  return {
    props: {},
  };
};
