import Image from 'next/image';
import Link from 'next/link';
import { Col } from 'react-bootstrap';

// Utility function to get the best available image URL
function getBestImage(
  translationImageUrl?: string | null,
  globalImageUrl?: string | null,
  videoId?: string | null,
  fallbackImage: string = '/images/default-content.jpg'
): string {
  // Convert relative path to full URL if needed
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('/')) {
      return imagePath; // Use relative path, browser will resolve
    }

    return imagePath;
  };

  // Priority 1: Translation-specific image
  const translationImg = getImageUrl(translationImageUrl);
  if (translationImg) return translationImg;

  // Priority 2: Global image
  const globalImg = getImageUrl(globalImageUrl);
  if (globalImg) return globalImg;

  // Priority 3: YouTube thumbnail
  if (videoId) return `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

  // Priority 4: Fallback
  return fallbackImage;
}

interface ArticleTranslation {
  title: string;
  seoTitle: string;
  videoId?: string | null;
  imageUrl?: string | null;
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

  // Get the best available image using priority logic
  const tyImage = translation.videoId
    ? `https://i.ytimg.com/vi/${translation.videoId}/hq720.jpg`
    : null;

  const articleImage = translation.imageUrl ? translation.imageUrl : tyImage;

  return (
    <Col sm="12" md="6" lg="6" xl="4" className="h5 mb-3">
      <Link
        href={`/articles/${article.canonicalSlug}`}
        className="feature-widget focus-reset d-flex flex-column min-height-px-280 rounded-4 gr-hover-shadow-1 border bg-white text-center"
      >
        <div className="mb-auto">
          {/* Image display using priority logic: Translation imageUrl > Global imageUrl > YouTube thumbnail > Default */}
          {articleImage ? (
            <Image
              className="img-fluid text-center"
              src={articleImage}
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
