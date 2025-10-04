import Layout from '@/components/Layout/Layout';
import StotraCard from '@/components/StotraCard';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

// Response interface for API
interface StotrasResponse {
  stotras: Array<{
    canonicalSlug: string;
    contentType: string;
    status: string;
    imageUrl?: string | null;
    translations: {
      en?: any;
      te?: any;
      hi?: any;
      kn?: any;
    };
    createdAt: string;
    updatedAt: string;
  }>;
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

export default function Sahasranamavali() {
  const { t, locale } = useTranslation();
  const [stotras, setStotras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const SAHASRANAMAVALI_CATEGORY_ID = '68ac2239bfcc70ec4468aa8f';
  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    // Reset state when locale changes
    setStotras([]);
    setCurrentPage(1);
    fetchStotras(1, true);
  }, [locale]);

  const fetchStotras = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
      const apiUrl = `${backendUrl}/rest/stotras?lang=${locale}&page=${page}&limit=${ITEMS_PER_PAGE}&categoryId=${SAHASRANAMAVALI_CATEGORY_ID}`;
      console.log('Fetching stotras from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch stotras');
      }

      const data: StotrasResponse = await response.json();

      if (reset) {
        setStotras(data.stotras);
      } else {
        // Only add new items that don't already exist
        setStotras(prev => {
          const existingSlugs = new Set(prev.map(s => s.canonicalSlug));
          const newStotras = data.stotras.filter(s => !existingSlugs.has(s.canonicalSlug));
          return [...prev, ...newStotras];
        });
      }

      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchStotras(nextPage, false);
  };

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            <h1 className="text-center">Sahasranamavali</h1>
            <p className="text-center">Collection of 1000 names of deities</p>

            {loading && (
              <div className="py-4 text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                Error: {error}
              </div>
            )}

            {!loading && !error && (
              <>
                <Row className="g-4 mt-3">
                  {stotras.map(stotra => (
                    <StotraCard
                      key={stotra.canonicalSlug}
                      stotra={stotra}
                      locale={locale}
                      showCanonicalSlug={true}
                      categoryContext="sahasranamavali"
                    />
                  ))}
                </Row>

                {pagination && pagination.hasNext && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="primary"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-4 py-2"
                    >
                      {loadingMore ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                    {pagination && (
                      <div className="text-muted small mt-2">
                        Showing {stotras.length} of {pagination.total} results
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!loading && !error && stotras.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-muted">No Sahasranamavali available at the moment.</p>
              </div>
            )}
          </div>
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h2>About Sahasranamavali</h2>
            <p className="text-muted">
              Sahasranamavali refers to the 1000 sacred names of various deities. Each collection
              contains divine names that are chanted for devotion and spiritual benefit.
            </p>
            {pagination && (
              <div className="mt-3">
                <h6>Collection Stats</h6>
                <ul className="list-unstyled small text-muted">
                  <li>Total Items: {pagination.total}</li>
                  <li>Items Loaded: {stotras.length}</li>
                  <li>Current Page: {currentPage}</li>
                </ul>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
