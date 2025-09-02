import Layout from '@/components/Layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, Col, Row } from 'react-bootstrap';

export default function Custom404() {
  const { t, locale } = useTranslation();
  const router = useRouter();

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
            <div className="error-404 text-center">
              <div className="mb-4">
                <h1 className="display-1 text-primary">404</h1>
                <h2 className="h3 text-secondary mb-3">Page Not Found</h2>
                <p className="text-muted error-description mb-4">
                  The page you are looking for might have been removed, had its name changed, or is
                  temporarily unavailable.
                </p>
              </div>

              <div className="d-flex flex-column flex-sm-row justify-content-center error-actions gap-3">
                <Button variant="primary" onClick={() => router.back()} className="px-4">
                  Go Back
                </Button>

                <Link href={`/${locale}`} passHref>
                  <Button variant="outline-primary" className="px-4">
                    Go to Homepage
                  </Button>
                </Link>

                <Link href={`/${locale}/stotras`} passHref>
                  <Button variant="outline-secondary" className="px-4">
                    Browse Stotras
                  </Button>
                </Link>
              </div>

              <div className="border-top mt-5 pt-4">
                <p className="text-muted small">
                  If you believe this is an error, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h3 className="h5 mb-3">Quick Links</h3>
            <ul className="list-unstyled quick-links">
              <li className="mb-2">
                <Link href={`/${locale}`} className="text-decoration-none">
                  🏠 Homepage
                </Link>
              </li>
              <li className="mb-2">
                <Link href={`/${locale}/stotras`} className="text-decoration-none">
                  📜 Stotras
                </Link>
              </li>
              <li className="mb-2">
                <Link href={`/${locale}/calendar`} className="text-decoration-none">
                  📅 Calendar
                </Link>
              </li>
              <li className="mb-2">
                <Link href={`/${locale}/panchangam`} className="text-decoration-none">
                  🌙 Panchangam
                </Link>
              </li>
            </ul>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
