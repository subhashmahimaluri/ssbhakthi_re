import Layout from '@/components/Layout/Layout';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { getServerSession } from 'next-auth/next';
import { getCsrfToken, getProviders, signIn } from 'next-auth/react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import { authOptions } from '../api/auth/[...nextauth]';

export default function SignIn({
  providers,
  csrfToken,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <Layout>
      <Container className="py-5">
        <Row className="justify-content-center my-5 py-5">
          <Col md={6} lg={4}>
            <Card>
              <Card.Body>
                <Card.Title className="mb-4 text-center">Admin Sign In</Card.Title>
                <p className="text-muted mb-4 text-center">Sign in to access the admin panel</p>

                <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

                {Object.values(providers).map(provider => (
                  <div key={provider.name} className="d-grid">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => signIn(provider.id, { callbackUrl: '/my-account' })}
                    >
                      Sign in with {provider.name}
                    </Button>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // If the user is already logged in, redirect to my-account
  if (session) {
    return { redirect: { destination: '/my-account' } };
  }

  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);

  return {
    props: {
      providers: providers ?? [],
      csrfToken: csrfToken ?? '',
    },
  };
}
