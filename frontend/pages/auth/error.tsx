import Layout from '@/components/Layout/Layout';
import { useRouter } from 'next/router';
import { Alert, Button, Card, Col, Container, Row } from 'react-bootstrap';

const errors: Record<string, string> = {
  Signin: 'Try signing in with a different account.',
  OAuthSignin: 'Try signing in with a different account.',
  OAuthCallback: 'Try signing in with a different account.',
  OAuthCreateAccount: 'Try signing in with a different account.',
  EmailCreateAccount: 'Try signing in with a different account.',
  Callback: 'Try signing in with a different account.',
  OAuthAccountNotLinked:
    'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'The e-mail could not be sent.',
  CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
  AccessDenied: 'You do not have permission to access this resource.',
  default: 'Unable to sign in.',
};

export default function ErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  const errorType = error && typeof error === 'string' ? error : 'default';
  const errorMessage = errors[errorType] ?? errors.default;

  return (
    <Layout>
      <Container className="mt-25 py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card>
              <Card.Body>
                <Card.Title className="mb-4 text-center">Authentication Error</Card.Title>

                <Alert variant="danger">
                  <Alert.Heading>Sign In Error</Alert.Heading>
                  <p>{errorMessage}</p>
                </Alert>

                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => router.push('/auth/signin')}>
                    Try Again
                  </Button>
                  <Button variant="outline-secondary" onClick={() => router.push('/')}>
                    Go Home
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
}
