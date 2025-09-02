import Link from 'next/link';
import { Card, Col } from 'react-bootstrap';

interface StotraTranslation {
  title: string;
  seoTitle: string;
  videoId?: string | null;
  stotra: string;
  stotraMeaning: string;
  body?: string | null;
}

interface Stotra {
  canonicalSlug: string;
  contentType: string;
  status: string;
  imageUrl?: string | null;
  translations: {
    en?: StotraTranslation;
    te?: StotraTranslation;
    hi?: StotraTranslation;
    kn?: StotraTranslation;
  };
  createdAt: string;
  updatedAt: string;
}

interface StotraCardProps {
  stotra: Stotra;
  locale: string;
  showCanonicalSlug?: boolean;
}

export default function StotraCard({ stotra, locale, showCanonicalSlug = true }: StotraCardProps) {
  // Prioritize current locale translation, then fallback to available translations
  const translation =
    stotra.translations[locale as keyof typeof stotra.translations] ||
    stotra.translations.en ||
    stotra.translations.te ||
    stotra.translations.hi ||
    stotra.translations.kn;

  if (!translation) return null;

  return (
    <Col md={6} lg={4} className="mb-4">
      <Card className="h-100 hover-card shadow-sm">
        <Card.Body className="d-flex flex-column">
          <Card.Title className="h5 mb-3">
            <Link
              href={`/stotras/${stotra.canonicalSlug}`}
              className="text-decoration-none stotra-title-link"
            >
              {translation.title}
            </Link>
          </Card.Title>

          {translation.stotraMeaning && (
            <Card.Text
              className="text-muted flex-grow-1"
              dangerouslySetInnerHTML={{
                __html: translation.stotraMeaning.replace(/<[^>]*>/g, '').substring(0, 120) + '...',
              }}
            />
          )}
        </Card.Body>
      </Card>
    </Col>
  );
}
