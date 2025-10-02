import Image from 'next/image';
import Link from 'next/link';
import { Col } from 'react-bootstrap';

interface ArticleTranslation {
  title: string;
  seoTitle: string;
  videoId?: string | null;
  body: string;
  summary?: string | null;
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

  return (
    <Col sm="12" md="6" lg="6" xl="4" className="h5 mb-3">
      <Link
        href={`/articles/${article.canonicalSlug}`}
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
