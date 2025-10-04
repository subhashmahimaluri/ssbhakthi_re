import ArticleCard from '@/components/ArticleCard';
import Layout from '@/components/Layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { getArticlesMetaData } from '@/utils/seo';
import { useEffect, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

const ITEMS_PER_PAGE = 30;

// Response interface for API
interface ArticlesResponse {
  articles: Array<{
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

export default function Articles() {
  const { t, locale } = useTranslation();
  const { title, description } = getArticlesMetaData(locale);

  console.log('Current locale:', locale);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    fetchArticles(1, true);
  }, [locale]); // Re-fetch when locale changes

  const fetchArticles = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      // Only show published articles for public users
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
      const apiUrl = `${backendUrl}/rest/articles?lang=${locale}&status=published&page=${page}&limit=${ITEMS_PER_PAGE}`;
      console.log('Fetching articles from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data: ArticlesResponse = await response.json();

      if (reset) {
        setArticles(data.articles);
      } else {
        // Only add new items that don't already exist
        setArticles(prev => {
          const existingSlugs = new Set(prev.map(a => a.canonicalSlug));
          const newArticles = data.articles.filter(a => !existingSlugs.has(a.canonicalSlug));
          return [...prev, ...newArticles];
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
    fetchArticles(nextPage, false);
  };
  return (
    <Layout title={title} description={description}>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            <h1 className="text-center">Articles</h1>

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
                  {articles.map(article => (
                    <ArticleCard
                      key={article.canonicalSlug}
                      article={article}
                      locale={locale}
                      showCanonicalSlug={true}
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
                        Showing {articles.length} of {pagination.total} results
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!loading && !error && articles.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-muted">No articles available at the moment.</p>
              </div>
            )}
          </div>
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h2>About Articles</h2>
            <p className="text-muted small">
              <strong>Articles</strong> provide spiritual insights, devotional content, and
              educational material about Hindu festivals, traditions, and spiritual practices. These
              articles help in understanding the deeper meaning of our cultural and religious
              heritage.
            </p>

            {pagination && (
              <div className="mt-3">
                <h6>Collection Stats</h6>
                <ul className="list-unstyled small text-muted">
                  <li>Total Articles: {pagination.total}</li>
                  <li>Articles Loaded: {articles.length}</li>
                  <li>Current Page: {currentPage}</li>
                </ul>
              </div>
            )}

            <hr />

            <h6>Other Content</h6>
            <div className="d-grid gap-2">
              <a href="/stotras" className="btn btn-outline-secondary btn-sm">
                Hymns & Prayers
              </a>
              <a href="/ashtothram" className="btn btn-outline-secondary btn-sm">
                Ashtottara Shatanamavali
              </a>
              <a href="/sahasranamam" className="btn btn-outline-secondary btn-sm">
                Sahasranamam
              </a>
              <a href="/sahasranamavali" className="btn btn-outline-secondary btn-sm">
                Sahasranamavali
              </a>
            </div>

            <hr />

            <h6>Categories</h6>
            <div className="d-grid gap-1">
              <small className="text-muted">• Festivals & Celebrations</small>
              <small className="text-muted">• Spiritual Practices</small>
              <small className="text-muted">• Religious Stories</small>
              <small className="text-muted">• Devotional Content</small>
              <small className="text-muted">• Cultural Heritage</small>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
