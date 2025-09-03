import { useTranslation } from '@/hooks/useTranslation';
import { CalculatedFestival } from '@/lib/festivalData';
import { Badge, Card } from 'react-bootstrap';

interface FestivalTileProps {
  festival: CalculatedFestival;
  onClick?: () => void;
}

const FestivalTile: React.FC<FestivalTileProps> = ({ festival, onClick }) => {
  const { locale } = useTranslation();

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Major Festivals':
        return 'primary';
      case 'Jayanthis':
        return 'success';
      case 'Seasonal Festivals':
        return 'warning';
      case 'Regional Festivals':
        return 'info';
      case 'Monthly Observances':
        return 'secondary';
      case 'Special Days':
        return 'dark';
      default:
        return 'light';
    }
  };

  const getObservanceIcon = (observanceTime: string): string => {
    switch (observanceTime) {
      case 'Sunrise':
        return '🌅';
      case 'Noon':
        return '☀️';
      case 'Sunset':
        return '🌇';
      case 'Midnight':
        return '🌙';
      case 'Night':
        return '🌃';
      case 'All Day':
        return '📅';
      default:
        return '🕐';
    }
  };

  const handleTileClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Future: Navigate to festival detail page
      // router.push(`/calendar/festivals/${festival.id}`);
      console.log(`Clicked on festival: ${festival.nameEnglish}`);
    }
  };

  return (
    <Card
      className="festival-tile h-100 mb-4 cursor-pointer border-0 shadow-sm"
      onClick={handleTileClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTileClick();
        }
      }}
    >
      <Card.Header className="festival-tile-header border-0 p-3">
        <div className="d-flex justify-content-between align-items-start">
          <Badge bg={getCategoryColor(festival.category)} className="category-badge mb-2">
            {festival.category}
          </Badge>
          <span className="observance-icon fs-4">{getObservanceIcon(festival.observanceTime)}</span>
        </div>
      </Card.Header>

      <Card.Body className="p-3 pt-0">
        <div className="festival-name mb-3">
          <h5 className="title text-dark fw-bold mb-2">
            {locale === 'te' ? festival.nameTelugu : festival.nameEnglish}
          </h5>

          {locale === 'en' && festival.nameTelugu && (
            <p className="subtitle text-muted fs-6 mb-0">{festival.nameTelugu}</p>
          )}

          {locale === 'te' && festival.nameEnglish && (
            <p className="subtitle text-muted fs-6 mb-0">{festival.nameEnglish}</p>
          )}
        </div>

        <div className="festival-date mb-3">
          <div className="gregorian-date mb-2">
            <strong className="text-primary fs-5">{festival.formattedDate}</strong>
          </div>

          <div className="lunar-date">
            <small className="text-muted">
              {festival.month}{' '}
              {locale === 'te'
                ? festival.paksha === 'Shukla'
                  ? 'శుక్ల'
                  : 'కృష్ణ'
                : festival.paksha}{' '}
              {festival.tithi}
            </small>
          </div>
        </div>

        <div className="festival-description">
          <p className="description-text text-dark small mb-2">
            {locale === 'te' ? festival.descriptionTelugu : festival.descriptionEnglish}
          </p>
        </div>
      </Card.Body>

      <Card.Footer className="border-0 bg-transparent p-3 pt-0">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">{festival.observanceTime}</small>
          <small className="text-primary fw-bold">
            {locale === 'te' ? 'వివరాలు చూడండి →' : 'View Details →'}
          </small>
        </div>
      </Card.Footer>

      <style jsx>{`
        .festival-tile {
          transition: all 0.3s ease;
          border-left: 4px solid var(--bs-primary);
          cursor: pointer;
        }

        .festival-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .festival-tile:focus {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }

        .festival-tile-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .category-badge {
          font-size: 0.75em;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .observance-icon {
          opacity: 0.7;
        }

        .festival-name .title {
          color: #2c3e50;
          line-height: 1.3;
          font-size: 1.1em;
        }

        .festival-name .subtitle {
          font-style: italic;
          font-size: 0.85em;
        }

        .gregorian-date strong {
          font-size: 1em;
        }

        .lunar-date {
          font-family: 'Noto Sans Telugu', serif;
        }

        .description-text {
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .festival-tile {
            margin-bottom: 1rem;
          }

          .festival-name .title {
            font-size: 1em;
          }

          .gregorian-date strong {
            font-size: 0.9em;
          }
        }

        @media (max-width: 576px) {
          .card-header,
          .card-body,
          .card-footer {
            padding: 0.75rem !important;
          }

          .description-text {
            -webkit-line-clamp: 2;
          }
        }

        /* Animation for tile grid */
        .festival-tile {
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Accessibility improvements */
        .festival-tile:focus-visible {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }
      `}</style>
    </Card>
  );
};

export default FestivalTile;
