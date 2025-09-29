import Image from 'next/image';
import Link from 'next/link';
import { Col } from 'react-bootstrap';

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
    <Col sm="12" md="6" lg="6" xl="4" className="h5 mb-3">
      <Link
        href={`/stotras/${stotra.canonicalSlug}`}
        className="feature-widget focus-reset d-flex flex-column min-height-px-280 rounded-4 gr-hover-shadow-1 border bg-white text-center"
      >
        <div className="mb-auto">
          {translation.videoId ? (
            <Image
              className="img-fluid text-center"
              src={`https://i.ytimg.com/vi/${translation.videoId}/hq720.jpg`}
              alt={translation.title}
              width={720}
              height={405}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="video-placeholder d-flex align-items-center justify-content-center position-relative">
              <div className="video-title-overlay position-absolute end-0 start-0 p-3">
                <span className="fw-bold text-white">{translation.title}</span>
              </div>
            </div>
          )}
          <h3 className="gr-text-7 text-blackish-blue px-4 py-6 text-left">{translation.title}</h3>
          <span className="btn-link with-icon gr-text-blue gr-text-9 fw-bold float-right text-right text-end">
            Read More <i className="icon icon-tail-right fw-bold"></i>
          </span>
        </div>
      </Link>
    </Col>
  );
}
