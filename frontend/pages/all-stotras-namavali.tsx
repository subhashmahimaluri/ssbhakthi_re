import Layout from '@/components/Layout/Layout';
import StotraCard from '@/components/StotraCard';
import { useTranslation } from '@/hooks/useTranslation';
import { getStotrasMetaData } from '@/utils/seo';
import { useEffect, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

const ITEMS_PER_PAGE = 30;

// Response interface for API
interface StotrasResponse {
  stotras: Array<{
    canonicalSlug: string;
    contentType: string;
    status: string;
    imageUrl?: string | null;
    categories?: Array<{
      _id: string;
      name: string;
      slug: string;
    }>;
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

// Helper function to determine category context based on stotra categories or slug patterns
const getCategoryContext = (
  stotra: any
): 'ashtothram' | 'sahasranamavali' | 'sahasranamam' | 'default' => {
  // First try to detect based on categories if available
  if (stotra.categories && Array.isArray(stotra.categories)) {
    for (const category of stotra.categories) {
      const categoryName = category.name?.toLowerCase() || '';
      const categorySlug = category.slug?.toLowerCase() || '';
      const categoryId = category._id || '';

      // Check for Ashtottara Shatanamavali category
      if (
        categoryName.includes('ashtottara') ||
        categoryName.includes('ashtothram') ||
        categorySlug.includes('ashtottara') ||
        categorySlug.includes('ashtothram') ||
        categoryId === '68ac2239bfcc70ec4468aa8a'
      ) {
        return 'ashtothram';
      }

      // Check for Sahasranamavali category
      if (
        categoryName.includes('sahasranamavali') ||
        categorySlug.includes('sahasranamavali') ||
        categoryId === '68ac2239bfcc70ec4468aa8f'
      ) {
        return 'sahasranamavali';
      }

      // Check for Sahasranamam category
      if (
        categoryName.includes('sahasranamam') ||
        categorySlug.includes('sahasranamam') ||
        categoryId === '68dce4a832e525e497f29abc'
      ) {
        return 'sahasranamam';
      }
    }
  }

  // Fallback: Detect based on canonicalSlug patterns when categories is null/empty
  const slug = stotra.canonicalSlug?.toLowerCase() || '';

  // Check for Ashtottara patterns in slug
  if (slug.includes('ashtottara') || slug.includes('ashtothram')) {
    return 'ashtothram';
  }

  // Check for Sahasranamavali patterns in slug (but not sahasranamam)
  if (slug.includes('sahasranamavali') && !slug.includes('sahasranamam')) {
    return 'sahasranamavali';
  }

  // Check for Sahasranamam patterns in slug
  if (slug.includes('sahasranamam') || slug.includes('sahasranama-stotram')) {
    return 'sahasranamam';
  }

  // Default to 'default' for Hymns/Prayers or other categories (routes to /stotras/[slug])
  return 'default';
};

export default function AllStotras() {
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

      const apiUrl = `http://localhost:4000/rest/stotras?lang=${locale}&page=${page}&limit=${ITEMS_PER_PAGE}`;
      console.log('Fetching all stotras from:', apiUrl);

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
    <Layout title={title} description={description}>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            <h1 className="text-center">All Stotras & Namavali</h1>
            <p className="text-muted text-center">
              Complete collection of devotional prayers and sacred names
            </p>

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
                  {stotras.map(stotra => {
                    const categoryContext = getCategoryContext(stotra);
                    // Debug log to see category detection
                    console.log(
                      'Stotra:',
                      stotra.canonicalSlug,
                      'Categories:',
                      stotra.categories,
                      'Context:',
                      categoryContext
                    );
                    return (
                      <StotraCard
                        key={stotra.canonicalSlug}
                        stotra={stotra}
                        locale={locale}
                        showCanonicalSlug={true}
                        categoryContext={categoryContext}
                      />
                    );
                  })}
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
                <p className="text-muted">No stotras available at the moment.</p>
              </div>
            )}
          </div>
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h2>About This Collection</h2>
            <p className="text-muted small">
              This comprehensive collection includes all categories of devotional content:
              <strong> Hymns & Prayers, Ashtottara Shatanamavali, Sahasranamavali,</strong> and
              <strong> Sahasranamam</strong>.
            </p>

            {pagination && (
              <div className="mt-3">
                <h6>Collection Stats</h6>
                <ul className="list-unstyled small text-muted">
                  <li>
                    <strong>Total Items:</strong> {pagination.total}
                  </li>
                  <li>
                    <strong>Items Loaded:</strong> {stotras.length}
                  </li>
                  <li>
                    <strong>Current Page:</strong> {currentPage}
                  </li>
                </ul>
              </div>
            )}

            <hr />

            <h6>Browse by Category</h6>
            <div className="d-grid gap-2">
              <a href="/stotras" className="btn btn-outline-primary btn-sm">
                📿 Hymns & Prayers
              </a>
              <a href="/ashtothram" className="btn btn-outline-secondary btn-sm">
                🕉️ Ashtottara Shatanamavali
              </a>
              <a href="/sahasranamavali" className="btn btn-outline-secondary btn-sm">
                📜 Sahasranamavali
              </a>
              <a href="/sahasranamam" className="btn btn-outline-secondary btn-sm">
                🙏 Sahasranamam
              </a>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
