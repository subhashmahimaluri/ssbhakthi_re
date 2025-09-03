import { useTranslation } from '@/hooks/useTranslation';
import { CalculatedVrath } from '@/lib/vrathData';
import { Badge, Card } from 'react-bootstrap';

interface VrathTileProps {
  vrath: CalculatedVrath;
  onClick?: () => void;
}

const VrathTile: React.FC<VrathTileProps> = ({ vrath, onClick }) => {
  const { locale } = useTranslation();

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Monthly Observances':
        return 'primary';
      case 'Weekly Observances':
        return 'success';
      case 'Special Observances':
        return 'warning';
      case 'Navratri Festivals':
        return 'info';
      case 'Ekadashi':
        return 'secondary';
      case 'Pradosham':
        return 'dark';
      default:
        return 'light';
    }
  };

  const getFrequencyIcon = (frequency: string): string => {
    switch (frequency) {
      case 'Monthly':
        return '🌙';
      case 'Bi-monthly':
        return '🌗';
      case 'Weekly':
        return '📅';
      case 'Annual':
        return '⭐';
      case 'Seasonal':
        return '🍂';
      case '9 Days':
        return '🔥';
      case '6 Days':
        return '⚡';
      case '16 Days':
        return '🕯️';
      default:
        return '🕐';
    }
  };

  const getUpcomingIndicator = (
    daysUntil: number
  ): { show: boolean; color: string; text: string } => {
    if (daysUntil <= 0) {
      return { show: true, color: 'danger', text: 'Today' };
    } else if (daysUntil === 1) {
      return { show: true, color: 'warning', text: 'Tomorrow' };
    } else if (daysUntil <= 7) {
      return { show: true, color: 'success', text: `${daysUntil} days` };
    }
    return { show: false, color: '', text: '' };
  };

  const handleTileClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Future: Navigate to vrath detail page
      // router.push(`/calendar/vrathas/${vrath.id}`);
      console.log(`Clicked on vrath: ${vrath.nameEnglish}`);
    }
  };

  const upcomingIndicator = getUpcomingIndicator(vrath.daysUntilNext);

  return (
    <Card
      className="vrath-tile h-100 mb-4 cursor-pointer border-0 shadow-sm"
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
      <Card.Header className="vrath-tile-header border-0 p-3">
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex flex-wrap gap-2">
            <Badge bg={getCategoryColor(vrath.category)} className="category-badge">
              {vrath.category}
            </Badge>
            {upcomingIndicator.show && (
              <Badge bg={upcomingIndicator.color} className="upcoming-badge">
                {upcomingIndicator.text}
              </Badge>
            )}
          </div>
          <span className="frequency-icon fs-4">{getFrequencyIcon(vrath.frequency)}</span>
        </div>
      </Card.Header>

      <Card.Body className="p-3 pt-0">
        <div className="vrath-name mb-3">
          <h5 className="title text-dark fw-bold mb-2">
            {locale === 'te' ? vrath.nameTelugu : vrath.nameEnglish}
          </h5>

          {locale === 'en' && vrath.nameTelugu && (
            <p className="subtitle text-muted fs-6 mb-0">{vrath.nameTelugu}</p>
          )}

          {locale === 'te' && vrath.nameEnglish && (
            <p className="subtitle text-muted fs-6 mb-0">{vrath.nameEnglish}</p>
          )}
        </div>

        <div className="vrath-description mb-3">
          <p className="description-text text-dark small mb-2">
            {locale === 'te' ? vrath.descriptionTelugu : vrath.descriptionEnglish}
          </p>
        </div>

        <div className="vrath-next-date mb-3">
          <div className="next-date mb-2">
            <strong className="text-primary fs-6">
              {locale === 'te' ? 'తదుపరి వ్రతం:' : 'Next Observance:'}
            </strong>
            <br />
            <span className="fw-bold text-success">{vrath.nextOccurrenceFormatted}</span>
          </div>

          {vrath.lunarDate && (
            <div className="lunar-date">
              <small className="text-muted">{vrath.lunarDate}</small>
            </div>
          )}
        </div>
      </Card.Body>

      <Card.Footer className="border-0 bg-transparent p-3 pt-0">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            <span className="frequency-text">{vrath.frequency}</span>
          </small>
          <small className="text-primary fw-bold">
            {locale === 'te' ? 'వివరాలు చూడండి →' : 'View Details →'}
          </small>
        </div>
      </Card.Footer>

      <style jsx>{`
        .vrath-tile {
          transition: all 0.3s ease;
          border-left: 4px solid var(--bs-primary);
          cursor: pointer;
        }

        .vrath-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .vrath-tile:focus {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }

        .vrath-tile-header {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .category-badge {
          font-size: 0.7em;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .upcoming-badge {
          font-size: 0.65em;
          padding: 3px 6px;
          border-radius: 10px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            opacity: 1;
          }
        }

        .frequency-icon {
          opacity: 0.7;
        }

        .vrath-name .title {
          color: #2c3e50;
          line-height: 1.3;
          font-size: 1.1em;
        }

        .vrath-name .subtitle {
          font-style: italic;
          font-size: 0.85em;
        }

        .next-date strong {
          font-size: 0.9em;
        }

        .lunar-date {
          font-family: 'Noto Sans Telugu', serif;
        }

        .description-text {
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .frequency-text {
          font-weight: 500;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .vrath-tile {
            margin-bottom: 1rem;
          }

          .vrath-name .title {
            font-size: 1em;
          }

          .next-date strong {
            font-size: 0.85em;
          }
        }

        @media (max-width: 576px) {
          .card-header,
          .card-body,
          .card-footer {
            padding: 0.75rem !important;
          }

          .description-text {
            -webkit-line-clamp: 1;
          }
        }

        /* Animation for tile grid */
        .vrath-tile {
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
        .vrath-tile:focus-visible {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }
      `}</style>
    </Card>
  );
};

export default VrathTile;
