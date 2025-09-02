'use client';

import Layout from '@/components/Layout/Layout';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

interface StotraTranslation {
  title: string;
  seoTitle: string;
  slug: string;
  path: string;
  youtubeUrl?: string | null;
  stotra: string;
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
const YouTubeEmbed = ({ url }: { url: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Async load after page load
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(url);

  if (!isLoaded || !videoId) {
    return (
      <div className="py-3 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading video...</span>
        </div>
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
      ></iframe>
    </div>
  );
};

export default function StotraPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { slug } = router.query;

  const [stotra, setStotra] = useState<StotraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only proceed if router is ready and we have both slug and locale
    if (router.isReady && slug && locale && typeof slug === 'string') {
      fetchStotra();
    }
  }, [router.isReady, slug, locale]);

  const fetchStotra = async () => {
    try {
      setLoading(true);

      // Basic slug validation
      if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
        router.push('/404');
        return;
      }

      const apiUrl = `http://localhost:4000/rest/stotras/${slug}?lang=${locale}`;
      console.log('Fetching stotra from:', apiUrl);

      const response = await fetch(apiUrl);

      // If stotra not found (404), redirect to 404 page
      if (response.status === 404) {
        router.push('/404');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch stotra');
      }

      const data: StotraDetail = await response.json();
      setStotra(data);
      setError(null);
    } catch (err) {
      // For network errors or other issues, also redirect to 404
      console.error('Error fetching stotra:', err);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
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

  if (error || !stotra) {
    return (
      <Layout>
        <Row className="mt-25 py-5">
          <Col xl="8" lg="8" md="12" className="my-5 py-5">
            <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
              <div className="alert alert-danger" role="alert">
                {error || 'Stotra not found'}
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

  const translation = stotra.meta.translation;

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
            {/* Title */}
            <h1 className="text-primary mb-4 text-center">{translation.title}</h1>

            {/* YouTube Video Embed (async load) */}
            {translation.youtubeUrl && (
              <div className="mb-4">
                <YouTubeEmbed url={translation.youtubeUrl} />
              </div>
            )}

            {/* Stotra Content */}
            {translation.stotra && (
              <div className="mb-4">
                <h2 className="h4 text-secondary mb-3">{t.stotra.stotra}</h2>
                <div
                  className="stotra-content"
                  dangerouslySetInnerHTML={{ __html: translation.stotra }}
                />
              </div>
            )}

            {/* Stotra Meaning */}
            {translation.stotraMeaning && (
              <div className="mb-4">
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
