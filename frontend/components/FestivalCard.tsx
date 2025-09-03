import { useTranslation } from '@/hooks/useTranslation';
import { CalculatedFestival, TELUGU_MONTHS } from '@/lib/festivalData';
import { Badge, Card, Col, Row } from 'react-bootstrap';

interface FestivalCardProps {
  festival: CalculatedFestival;
  showCategory?: boolean;
}

const FestivalCard: React.FC<FestivalCardProps> = ({ festival, showCategory = true }) => {
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

  return (
    <Card className="festival-card h-100 mb-4 border-0 shadow-sm">
      <Card.Body className="p-4">
        <Row className="align-items-start">
          <Col xs={12} md={8}>
            <div className="festival-header mb-3">
              <h5 className="festival-name text-dark fw-bold mb-2">
                {locale === 'te' ? festival.nameTelugu : festival.nameEnglish}
              </h5>

              {locale === 'en' && festival.nameTelugu && (
                <p className="festival-name-alt text-muted fs-6 mb-2">{festival.nameTelugu}</p>
              )}

              {locale === 'te' && festival.nameEnglish && (
                <p className="festival-name-alt text-muted fs-6 mb-2">{festival.nameEnglish}</p>
              )}

              {showCategory && (
                <Badge bg={getCategoryColor(festival.category)} className="mb-2 me-2">
                  {festival.category}
                </Badge>
              )}
            </div>

            <div className="festival-description mb-3">
              <p className="text-dark mb-2">
                {locale === 'te' ? festival.descriptionTelugu : festival.descriptionEnglish}
              </p>

              {festival.significance && (
                <div className="festival-significance">
                  <small className="text-muted">
                    <strong>Significance:</strong> {festival.significance}
                  </small>
                </div>
              )}
            </div>
          </Col>

          <Col xs={12} md={4}>
            <div className="festival-details text-md-end">
              <div className="festival-date mb-3">
                <div className="gregorian-date">
                  <h6 className="text-primary fw-bold mb-1">{festival.formattedDate}</h6>
                </div>

                <div className="lunar-date">
                  <p className="text-muted fs-6 mb-1">{festival.lunarDate}</p>
                </div>
              </div>

              <div className="festival-timing mb-2">
                <Badge bg="outline-secondary" className="me-1">
                  {getObservanceIcon(festival.observanceTime)} {festival.observanceTime}
                </Badge>
              </div>

              <div className="festival-lunar-details">
                <Row className="g-1">
                  <Col xs={6}>
                    <div className="bg-light rounded p-2 text-center">
                      <small className="text-muted d-block">Month</small>
                      <small className="fw-bold text-dark">
                        {locale === 'te' && festival.month in TELUGU_MONTHS
                          ? TELUGU_MONTHS[festival.month as keyof typeof TELUGU_MONTHS]
                          : festival.month}
                      </small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="bg-light rounded p-2 text-center">
                      <small className="text-muted d-block">Paksha</small>
                      <small className="fw-bold text-dark">
                        {locale === 'te'
                          ? festival.paksha === 'Shukla'
                            ? 'శుక్ల'
                            : 'కృష్ణ'
                          : festival.paksha}
                      </small>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>

      <style jsx>{`
        .festival-card {
          transition: all 0.3s ease;
          border-left: 4px solid var(--bs-primary);
        }

        .festival-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
        }

        .festival-name {
          color: #2c3e50;
          line-height: 1.3;
        }

        .festival-name-alt {
          font-style: italic;
          font-size: 0.9em;
        }

        .festival-description {
          line-height: 1.5;
        }

        .festival-significance {
          background-color: #f8f9fa;
          padding: 8px 12px;
          border-radius: 6px;
          border-left: 3px solid #6c757d;
        }

        .gregorian-date h6 {
          font-size: 1.1em;
        }

        .lunar-date p {
          font-family: 'Noto Sans Telugu', serif;
        }

        .festival-lunar-details .bg-light {
          background-color: #f8f9fa !important;
        }

        @media (max-width: 768px) {
          .festival-details {
            margin-top: 1rem;
          }

          .festival-card .card-body {
            padding: 1rem !important;
          }

          .festival-lunar-details .col-6 {
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </Card>
  );
};

export default FestivalCard;
