import Layout from '@/components/Layout/Layout';
import StotraCard from '@/components/StotraCard';
import { useTranslation } from '@/hooks/useTranslation';
import { getStotrasMetaData } from '@/utils/seo';
import { useEffect, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

// Hymns / Prayers category ID
const HYMNS_PRAYERS_CATEGORY_ID = '68ac2239bfcc70ec4468aa77';
const ITEMS_PER_PAGE = 30;

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

export default function HymnsPrayers() {
  const { t, locale } = useTranslation();
  const { title, description } = getStotrasMetaData(locale);

  console.log('Current locale:', locale);
  const [stotras, setStotras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    fetchStotras(1, true);
  }, [locale]); // Re-fetch when locale changes

  const fetchStotras = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Filter by Hymns / Prayers category ID
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
      const apiUrl = `${backendUrl}/rest/stotras?lang=${locale}&page=${page}&limit=${ITEMS_PER_PAGE}&categoryId=${HYMNS_PRAYERS_CATEGORY_ID}`;
      console.log('Fetching hymns/prayers from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch hymns/prayers');
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
    <Layout title={title} description={description}>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            <h1 className="text-center">Hymns / Prayers</h1>

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
                      categoryContext="default"
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
                <p className="text-muted">No hymns/prayers available at the moment.</p>
              </div>
            )}
          </div>
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h2>About Hymns / Prayers</h2>
            <p className="text-muted small">
              <strong>Hymns and Prayers</strong> are sacred compositions dedicated to various
              deities. These spiritual texts contain devotional verses that help in meditation,
              worship, and spiritual growth.
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

            <hr />

            <h6>Other Categories</h6>
            <div className="d-grid gap-2">
              <a href="/ashtothram" className="btn btn-outline-secondary btn-sm">
                Ashtottara Shatanamavali
              </a>
              <a href="/sahasranamavali" className="btn btn-outline-secondary btn-sm">
                Sahasranamavali
              </a>
              <a href="/sahasranamam" className="btn btn-outline-secondary btn-sm">
                Sahasranamam
              </a>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
