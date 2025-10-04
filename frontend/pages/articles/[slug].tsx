'use client';

import Layout from '@/components/Layout/Layout';
import CommentSection from '@/components/comments/CommentSection';
import { useTranslation } from '@/hooks/useTranslation';
import { getArticleDetailMetaData } from '@/utils/seo';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

interface ArticleTranslation {
  title: string;
  seoTitle: string;
  videoId?: string | null;
  imageUrl?: string | null;
  body?: string | null;
}

interface ArticleDetail {
  canonicalSlug: string;
  contentType: string;
  status: string;
  imageUrl?: string | null;
  categories?: any;
  translations: {
    [key: string]: ArticleTranslation;
  };
  meta: {
    requestedLanguage: string;
    availableLanguages: string[];
    translation: ArticleTranslation;
  };
  createdAt: string;
  updatedAt: string;
}

// YouTube embed component
const YouTubeEmbed = ({ videoId }: { videoId: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when videoId changes
    setHasError(false);

    // Async load after page load
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [videoId]);

  if (!isLoaded) {
    return (
      <div className="py-3 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading video...</span>
        </div>
      </div>
    );
  }

  if (!videoId || hasError) {
    return (
      <div className="alert alert-warning" role="alert">
        Unable to load video. Invalid YouTube video ID.
      </div>
    );
  }

  return (
    <div className="ratio ratio-16x9 mb-4">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onError={() => setHasError(true)}
      ></iframe>
    </div>
  );
};

export default function ArticlePage() {
  const { t, locale } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  const { slug } = router.query;
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasRedirectedRef = useRef(false);

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized function to prevent unnecessary re-renders
  const fetchArticle = useCallback(async () => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // Basic slug validation
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      hasRedirectedRef.current = true;
      router.push('/404');
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
      const apiUrl = `${backendUrl}/rest/articles/${slug}?lang=${locale}`;
      console.log('Fetching article from:', apiUrl);

      const response = await fetch(apiUrl, {
        signal: abortControllerRef.current.signal,
      });

      // If article not found (404), redirect to 404 page
      if (response.status === 404) {
        hasRedirectedRef.current = true;
        router.push('/404');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ArticleDetail = await response.json();

      // Only update state if component is still mounted and request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setArticle(data);
        setError(null);
      }
    } catch (err) {
      // Don't handle aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Error fetching article:', err);

      // For network errors or other issues, set error state instead of redirecting
      if (!hasRedirectedRef.current && !abortControllerRef.current?.signal.aborted) {
        setError(
          err instanceof Error ? err.message : 'An error occurred while fetching the article'
        );
      }
    } finally {
      // Only set loading to false if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [slug, locale, router]);

  useEffect(() => {
    // Reset redirect flag when dependencies change
    hasRedirectedRef.current = false;

    // Only proceed if router is ready and we have both slug and locale
    if (router.isReady && slug && locale && typeof slug === 'string') {
      fetchArticle();
    }
  }, [router.isReady, slug, locale, fetchArticle]);

  // Cleanup function to abort ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Show loading state while router is not ready or while fetching
  if (!router.isReady || loading) {
    return (
      <Layout title="Loading Article | SS Bhakthi">
        <Row className="mt-25 py-5">
          <Col xl="8" lg="8" md="12" className="my-5 py-5">
            <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
              <div className="py-4 text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
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

  // Show error state only if there's an actual error and we're not loading
  if (error && !loading) {
    return (
      <Layout title="Error Loading Article | SS Bhakthi">
        <Row className="mt-25 py-5">
          <Col xl="8" lg="8" md="12" className="my-5 py-5">
            <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
              <div className="mt-3 text-center">
                <button
                  className="btn btn-primary me-2"
                  onClick={() => {
                    setError(null);
                    fetchArticle();
                  }}
                >
                  Try Again
                </button>
                <button className="btn btn-secondary" onClick={() => router.back()}>
                  Go Back
                </button>
              </div>
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

  // If no article data and no error, something went wrong
  if (!article && !loading && !error) {
    return (
      <Layout title="Article Not Found | SS Bhakthi">
        <Row className="mt-25 py-5">
          <Col xl="8" lg="8" md="12" className="my-5 py-5">
            <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
              <div className="alert alert-warning" role="alert">
                Article not found or failed to load.
              </div>
              <div className="mt-3 text-center">
                <button className="btn btn-primary me-2" onClick={() => fetchArticle()}>
                  Retry
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push(`/${locale}/articles`)}
                >
                  Browse Articles
                </button>
              </div>
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

  const translation = article?.meta?.translation;
  const { title } = translation?.seoTitle
    ? getArticleDetailMetaData(translation.seoTitle)
    : { title: 'Article | SS Bhakthi' };

  // Additional safety check for translation data
  if (!translation) {
    return (
      <Layout title="Translation Not Available | SS Bhakthi">
        <Row className="mt-25 py-5">
          <Col xl="8" lg="8" md="12" className="my-5 py-5">
            <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
              <div className="alert alert-warning" role="alert">
                Translation data not available for this article.
              </div>
              <div className="mt-3 text-center">
                <button className="btn btn-primary me-2" onClick={() => fetchArticle()}>
                  Retry
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push(`/${locale}/articles`)}
                >
                  Browse Articles
                </button>
              </div>
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

  return (
    <Layout title={title}>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
            {/* Title */}
            <h1 className="text-primary mb-4 text-center">{translation.title}</h1>

            {/* Admin Edit Button - Only show for admin users */}
            {session?.user?.roles?.some((role: string) =>
              ['admin', 'editor', 'author'].includes(role)
            ) && (
              <div className="d-flex justify-content-end mb-3">
                <Link href={`/admin/articles/${article.canonicalSlug}/edit`} passHref>
                  <Button variant="outline-primary" size="sm">
                    <i className="bi bi-pencil me-1"></i>
                    Edit Article
                  </Button>
                </Link>
              </div>
            )}

            {/* Media Section - Video first preference, translation imageUrl second, global imageUrl third */}
            {translation.videoId ? (
              <div className="mb-4">
                <YouTubeEmbed videoId={translation.videoId} />
              </div>
            ) : translation.imageUrl ? (
              <div className="mb-4">
                <img
                  src={translation.imageUrl}
                  alt={translation.title}
                  className="img-fluid rounded"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            ) : null}

            {/* Article Body Content */}
            {translation.body && (
              <div className="mb-4">
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: translation.body }}
                />
              </div>
            )}

            {/* Metadata */}
            <div className="border-top mt-5 pt-3">
              <small className="text-muted">
                <strong>Available Languages:</strong> {article.meta.availableLanguages.join(', ')}
                <br />
                <strong>Canonical ID:</strong> {article.canonicalSlug}
              </small>
            </div>

            {/* Comments Section */}
            <CommentSection contentType="article" canonicalSlug={article.canonicalSlug} />
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
