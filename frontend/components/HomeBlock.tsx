import { useTranslation } from '@/hooks/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Col } from 'react-bootstrap';

// Category ID constants
const CATEGORY_IDS = {
  ashtothram: '68ac2239bfcc70ec4468aa8c', // Ashtottara Shatanamavali
  sahasranamavali: '68ac2239bfcc70ec4468aa8f', // Sahasranamavali
  stotras: '68ac2239bfcc70ec4468aa77', // Hymns / Prayers
} as const;

// Interface for translation data
interface StotraTranslation {
  title: string;
  seoTitle: string;
  videoId?: string | null;
  stotra: string;
  stotraMeaning: string;
  body?: string | null;
}

// Interface for stotra data
interface Stotra {
  canonicalSlug: string;
  contentType: string;
  stotraTitle: string;
  status: string;
  imageUrl?: string | null;
  categories?: {
    typeIds?: string[];
    devaIds?: string[];
    byNumberIds?: string[];
  };
  translations: {
    en?: StotraTranslation;
    te?: StotraTranslation;
    hi?: StotraTranslation;
    kn?: StotraTranslation;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response interface
interface StotrasResponse {
  stotras: Stotra[];
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

// HomeBlock component props
interface HomeBlockProps {
  title: string;
  path: string;
  categoryKey: keyof typeof CATEGORY_IDS;
  showItems?: number;
}

const HomeBlock: React.FC<HomeBlockProps> = ({ title, path, categoryKey, showItems = 5 }) => {
  const { t, locale } = useTranslation();
  const [stotras, setStotras] = useState<Stotra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStotras();
  }, [locale, categoryKey]);

  const fetchStotras = async () => {
    try {
      setLoading(true);
      const categoryId = CATEGORY_IDS[categoryKey];
      const apiUrl = `http://localhost:4000/rest/stotras?lang=${locale}&page=1&limit=${showItems}&categoryId=${categoryId}`;

      console.log(`Fetching ${categoryKey} from:`, apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${categoryKey}`);
      }

      const data: StotrasResponse = await response.json();
      setStotras(data.stotras);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(`Error fetching ${categoryKey}:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Get translation for current locale with fallback
  const getTranslation = (stotra: Stotra) => {
    return (
      stotra.translations[locale as keyof typeof stotra.translations] ||
      stotra.translations.en ||
      stotra.translations.te ||
      stotra.translations.hi ||
      stotra.translations.kn
    );
  };

  // Generate the correct link path for each stotra
  const getStotraLink = (stotra: Stotra, index: number) => {
    const translation = getTranslation(stotra);
    if (!translation) return `${path}/${stotra.canonicalSlug}`;

    return `${path}/${stotra.canonicalSlug}`;
  };

  // Get display title for stotra
  const getDisplayTitle = (stotra: Stotra) => {
    const translation = getTranslation(stotra);
    return translation?.title || stotra.stotraTitle || 'Untitled';
  };

  // Get image URL for first stotra
  const getImageUrl = (stotra: Stotra) => {
    const translation = getTranslation(stotra);
    if (translation?.videoId) {
      return `https://i.ytimg.com/vi/${translation.videoId}/hq720.jpg`;
    }
    if (stotra.imageUrl) {
      return `${process.env.NEXT_PUBLIC_API_URL}${stotra.imageUrl}`;
    }
    return null;
  };

  if (loading) {
    return (
      <Col lg="4" md="6" sm="8" className="col-lg-4 col-md-6 col-sm-8 mb-9">
        <div className="pricing-card gr-hover-shadow-1 rounded-8 bg-white py-2 text-center">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '200px' }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </Col>
    );
  }

  if (error || stotras.length === 0) {
    return (
      <Col lg="4" md="6" sm="8" className="col-lg-4 col-md-6 col-sm-8 mb-9">
        <div className="pricing-card gr-hover-shadow-1 rounded-8 bg-white py-3 text-center">
          <div className="price-content light-mode-texts">
            <div className="d-flex align-items-end justify-content-center">
              <h2 className="text-primary gr-text-6 fw-bold mb-0">{title}</h2>
            </div>
            <div className="text-muted mt-4">
              {error ? `Error: ${error}` : 'No content available'}
            </div>
          </div>
        </div>
      </Col>
    );
  }

  return (
    <Col lg="4" md="6" sm="8" className="col-lg-4 col-md-6 col-sm-8 mb-2">
      <div className="pricing-card gr-hover-shadow-1 rounded-8 mb-2 mt-2 bg-white py-2 text-center">
        <div className="price-content light-mode-texts">
          <div className="d-flex align-items-end justify-content-center my-3">
            <h2 className="text-primary gr-text-6 fw-bold mb-0">{title}</h2>
          </div>

          <ul className="card-list list-style-border mx-auto mb-3 mt-6 px-4 text-center">
            {stotras.map((stotra, index) => {
              const translation = getTranslation(stotra);
              const borderTop = index !== 0 ? ' border-top' : '';
              const imageUrl = index === 0 ? getImageUrl(stotra) : null;

              if (!translation) return null;

              return (
                <li
                  key={stotra.canonicalSlug}
                  className={`gr-text-8 border-gray-3 d-block mb-0 pt-0 text-black ${borderTop}`}
                >
                  <Link
                    href={getStotraLink(stotra, index)}
                    className="gr-hover-text-orange text-decoration-none text-black"
                  >
                    {index === 0 && imageUrl && (
                      <div className="mb-3">
                        <Image
                          className="img-fluid rounded"
                          src={imageUrl}
                          alt={getDisplayTitle(stotra)}
                          width={300}
                          height={200}
                          style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                        />
                      </div>
                    )}
                    <p className="gr-hover-text-orange py-2 text-black">
                      {getDisplayTitle(stotra)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <Link
          href={path}
          className="gr-hover-y gr-text-9 btn btn btn-primary white-text mx-auto mb-3 px-8 py-1"
        >
          {t.panchangam.explore_more} <i className="icon icon-tail-right fw-bold"></i>
        </Link>
      </div>
    </Col>
  );
};

export default HomeBlock;
