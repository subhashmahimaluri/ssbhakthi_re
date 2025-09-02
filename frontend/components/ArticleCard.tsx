import Link from 'next/link';
import { Card, Col } from 'react-bootstrap';

interface ArticleTranslation {
  title: string;
  seoTitle: string;
  videoId?: string | null;
  body: string;
}

interface Article {
  canonicalSlug: string;
  contentType: string;
  status: string;
  imageUrl?: string | null;
  translations: {
    en?: ArticleTranslation;
    te?: ArticleTranslation;
    hi?: ArticleTranslation;
    kn?: ArticleTranslation;
  };
  createdAt: string;
  updatedAt: string;
}

interface ArticleCardProps {
  article: Article;
  locale: string;
  showCanonicalSlug?: boolean;
}

export default function ArticleCard({
  article,
  locale,
  showCanonicalSlug = true,
}: ArticleCardProps) {
  // Prioritize current locale translation, then fallback to available translations
  const translation =
    article.translations[locale as keyof typeof article.translations] ||
    article.translations.en ||
    article.translations.te ||
    article.translations.hi ||
    article.translations.kn;

  if (!translation) return null;

  // Extract first paragraph or snippet from body HTML for preview
  const getBodyPreview = (htmlBody: string): string => {
    // Remove HTML tags and get first 150 characters
    const textContent = htmlBody.replace(/<[^>]*>/g, '');
    return textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
  };

  return (
    <Col md={6} lg={4} className="mb-4">
      <Card className="h-100 hover-card shadow-sm">
        <Card.Body className="d-flex flex-column">
          <Card.Title className="h5 mb-3">
            <Link
              href={`/articles/${article.canonicalSlug}`}
              className="text-decoration-none article-title-link"
            >
              {translation.title}
            </Link>
          </Card.Title>

          {translation.body && (
            <Card.Text className="text-muted flex-grow-1 mb-3">
              {getBodyPreview(translation.body)}
            </Card.Text>
          )}

          <div className="mt-auto">
            {translation.videoId && (
              <div className="mb-2">
                <small className="text-primary">
                  <i className="bi bi-play-circle me-1"></i>
                  Video Available
                </small>
              </div>
            )}

            {showCanonicalSlug && (
              <div className="mb-2">
                <small className="text-muted">
                  <strong>ID:</strong> {article.canonicalSlug}
                </small>
              </div>
            )}

            <div>
              <small className="text-muted">
                Updated: {new Date(article.updatedAt).toLocaleDateString()}
              </small>
            </div>

            <div className="mt-2">
              <Link
                href={`/articles/${article.canonicalSlug}`}
                className="btn btn-outline-primary btn-sm"
              >
                Read Article
              </Link>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}
