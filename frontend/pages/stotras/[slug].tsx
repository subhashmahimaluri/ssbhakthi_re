'use client';

import Layout from '@/components/Layout/Layout';
import CommentSection from '@/components/comments/CommentSection';
import { useAvailableLanguages } from '@/context/AvailableLanguagesContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Locale } from '@/locales';
import { getStotraDetailMetaData } from '@/utils/seo';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

interface StotraTranslation {
  title: string;
  seoTitle: string;
  videoId?: string | null;
  stotra: string;
  imageUrl?: string | null;
  stotraMeaning: string;
  body?: string | null;
}

interface StotraDetail {
  canonicalSlug: string;
  contentType: string;
  status: string;
  imageUrl?: string | null;
  categories?: any;
  translations: {
    [key: string]: StotraTranslation;
  };
  meta: {
    requestedLanguage: string;
    availableLanguages: string[];
    translation: StotraTranslation;
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

export default function StotraPage() {
  const { t, locale } = useTranslation();
  const { data: userSession } = useSession();
  const { setAvailableLanguages, resetAvailableLanguages } = useAvailableLanguages();
  const router = useRouter();
  const { slug } = router.query;
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasRedirectedRef = useRef(false);

  const [stotra, setStotra] = useState<StotraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackLanguage, setIsFallbackLanguage] = useState(false);

  // Memoized function to prevent unnecessary re-renders
  const fetchStotra = useCallback(async () => {
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
      setIsFallbackLanguage(false);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
      const apiUrl = `${backendUrl}/rest/stotras/${slug}?lang=${locale}`;
      console.log('Fetching stotra from:', apiUrl);

      const response = await fetch(apiUrl, {
        signal: abortControllerRef.current.signal,
      });

      // If stotra not found (404), check if it's a translation issue
      if (response.status === 404) {
        try {
          // Try to get the error details from the response
          const errorData = await response.json();

          // If it's a translation not found error, try to fetch with default language
          if (
            errorData.error?.code === 'TRANSLATION_NOT_FOUND' &&
            errorData.error?.availableLanguages
          ) {
            // Set available languages from error response
            setAvailableLanguages(errorData.error.availableLanguages as Locale[]);

            // If current locale is not available, try with the first available language
            if (!errorData.error.availableLanguages.includes(locale)) {
              const fallbackLang = errorData.error.availableLanguages[0];
              const fallbackUrl = `${backendUrl}/rest/stotras/${slug}?lang=${fallbackLang}`;

              const fallbackResponse = await fetch(fallbackUrl, {
                signal: abortControllerRef.current.signal,
              });

              if (fallbackResponse.ok) {
                const fallbackData: StotraDetail = await fallbackResponse.json();

                // Only update state if component is still mounted and request wasn't aborted
                if (!abortControllerRef.current?.signal.aborted) {
                  setStotra(fallbackData);
                  setIsFallbackLanguage(true);
                  setError(null);
                }
                return;
              }
            }
          }
        } catch (jsonError) {
          // If we can't parse the error response, treat as normal 404
          console.warn('Could not parse 404 error response:', jsonError);
        }

        // If no fallback worked or it's a true 404, redirect to 404 page
        hasRedirectedRef.current = true;
        router.push('/404');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: StotraDetail = await response.json();

      // Only update state if component is still mounted and request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setStotra(data);

        // Set available languages for the language switcher
        if (data.meta?.availableLanguages) {
          setAvailableLanguages(data.meta.availableLanguages as Locale[]);
        }

        setError(null);
      }
    } catch (err) {
      // Don't handle aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Error fetching stotra:', err);

      // For network errors or other issues, set error state instead of redirecting
      if (!hasRedirectedRef.current && !abortControllerRef.current?.signal.aborted) {
        setError(
          err instanceof Error ? err.message : 'An error occurred while fetching the stotra'
        );
      }
    } finally {
      // Only set loading to false if request wasn't aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [slug, locale, router]); // Removed setAvailableLanguages to prevent infinite re-renders

  useEffect(() => {
    // Reset redirect flag when dependencies change
    hasRedirectedRef.current = false;

    // Only proceed if router is ready and we have both slug and locale
    if (router.isReady && slug && locale && typeof slug === 'string') {
      fetchStotra();
    }
  }, [router.isReady, slug, locale, fetchStotra]);

  // Cleanup function to abort ongoing requests and reset available languages
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Reset available languages when leaving this page
      resetAvailableLanguages();
    };
  }, []); // Empty dependency array since resetAvailableLanguages is now stable

  // Show loading state while router is not ready or while fetching
  if (!router.isReady || loading) {
    return (
      <Layout title="Loading Stotra | SS Bhakthi">
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
      <Layout title="Error Loading Stotra | SS Bhakthi">
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
                    fetchStotra();
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

  // If no stotra data and no error, something went wrong
  if (!stotra && !loading && !error) {
    return (
      <Layout title="Stotra Not Found | SS Bhakthi">
        <Row className="mt-25 py-5">
          <Col xl="8" lg="8" md="12" className="my-5 py-5">
            <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
              <div className="alert alert-warning" role="alert">
                Stotra not found or failed to load.
              </div>
              <div className="mt-3 text-center">
                <button className="btn btn-primary me-2" onClick={() => fetchStotra()}>
                  Retry
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push(`/${locale}/stotras`)}
                >
                  Browse Stotras
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

  const translation = stotra?.meta?.translation;
  const { title } = translation?.seoTitle
    ? getStotraDetailMetaData(translation.seoTitle)
    : { title: 'Stotra | SS Bhakthi' };

  // Check if user has admin access
  const userRoles = (userSession?.user?.roles as string[]) || [];
  const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

  // Additional safety check for translation data
  if (!translation) {
    return (
      <Layout title="Translation Not Available | SS Bhakthi">
        <Row className="mt-25 py-5">
          <Col xl="8" lg="8" md="12" className="my-5 py-5">
            <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
              <div className="alert alert-warning" role="alert">
                Translation data not available for this stotra.
              </div>
              <div className="mt-3 text-center">
                <button className="btn btn-primary me-2" onClick={() => fetchStotra()}>
                  Retry
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push(`/${locale}/stotras`)}
                >
                  Browse Stotras
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
            {/* Title and Edit Button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="text-primary mb-0">{translation.title}</h1>
              {hasAdminAccess && (
                <Link href={`/admin/stotras/${stotra.canonicalSlug}/edit`}>
                  <Button variant="outline-primary" size="sm">
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </Button>
                </Link>
              )}
            </div>

            {/* Fallback Language Warning */}
            {isFallbackLanguage && (
              <div className="alert alert-info mb-4" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                This content is not available in{' '}
                {locale === 'en' ? 'English' : 'your selected language'}. Showing in{' '}
                {translation.title && stotra.meta?.requestedLanguage
                  ? stotra.meta.requestedLanguage === 'te'
                    ? 'Telugu'
                    : stotra.meta.requestedLanguage === 'en'
                      ? 'English'
                      : stotra.meta.requestedLanguage === 'hi'
                        ? 'Hindi'
                        : stotra.meta.requestedLanguage === 'kn'
                          ? 'Kannada'
                          : stotra.meta.requestedLanguage
                  : 'available language'}{' '}
                instead.
              </div>
            )}

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

            {/* Stotra Content */}
            {translation.stotra && (
              <div className="mb-4">
                <div
                  className="stotra-content"
                  dangerouslySetInnerHTML={{ __html: translation.stotra }}
                />
              </div>
            )}

            {/* Stotra Meaning */}
            {translation.stotraMeaning && (
              <div className="mb-4 pt-5">
                <h2 className="h4 text-secondary mb-3">{t.stotra.stotra_meaning}</h2>
                <div
                  className="stotra-meaning"
                  dangerouslySetInnerHTML={{ __html: translation.stotraMeaning }}
                />
              </div>
            )}

            {/* Additional Body Content (if available) */}
            {translation.body && (
              <div className="mb-4">
                <div
                  className="stotra-body"
                  dangerouslySetInnerHTML={{ __html: translation.body }}
                />
              </div>
            )}

            {/* Metadata */}
            <div className="border-top mt-5 pt-3">
              <small className="text-muted">
                <strong>Available Languages:</strong> {stotra.meta.availableLanguages.join(', ')}
                <br />
                <strong>Canonical ID:</strong> {stotra.canonicalSlug}
              </small>
            </div>

            {/* Comments Section */}
            <CommentSection contentType="stotra" canonicalSlug={stotra.canonicalSlug} />
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
