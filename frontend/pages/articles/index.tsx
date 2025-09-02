import ArticleCard from '@/components/ArticleCard';
import Layout from '@/components/Layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { getArticlesMetaData } from '@/utils/seo';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [locale]); // Re-fetch when locale changes

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const apiUrl = `http://localhost:4000/rest/articles?lang=${locale}`;
      console.log('Fetching articles from:', apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data: ArticlesResponse = await response.json();
      setArticles(data.articles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
            <h2>Sidebar</h2>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
