import { useTranslation } from '@/hooks/useTranslation';
import { Button, Col, Row } from 'react-bootstrap';

interface FestivalYearNavigationProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
}

const FestivalYearNavigation: React.FC<FestivalYearNavigationProps> = ({
  currentYear,
  onYearChange,
  minYear = 2024,
  maxYear = 2026,
}) => {
  const { t, locale } = useTranslation();

  const goToPreviousYear = () => {
    if (currentYear > minYear) {
      onYearChange(currentYear - 1);
    }
  };

  const goToNextYear = () => {
    if (currentYear < maxYear) {
      onYearChange(currentYear + 1);
    }
  };

  const goToSpecificYear = (year: number) => {
    onYearChange(year);
  };

  const availableYears = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  return (
    <div className="festival-year-navigation mb-4">
      <Row className="align-items-center">
        {/* Previous Year Button */}
        <Col xs={12} md={3} className="mb-md-0 mb-2">
          <Button
            variant="outline-primary"
            size="lg"
            className="w-100 year-nav-btn"
            onClick={goToPreviousYear}
            disabled={currentYear <= minYear}
          >
            <span className="nav-arrow">‹</span>
            <span className="nav-text d-none d-sm-inline ms-2">
              {locale === 'te' ? 'మునుపటి సంవత్సరం' : 'Previous Year'}
            </span>
            <span className="nav-text d-sm-none ms-2">{currentYear - 1}</span>
          </Button>
        </Col>

        {/* Current Year Display */}
        <Col xs={12} md={6} className="mb-md-0 mb-2">
          <div className="current-year-section text-center">
            <h2 className="current-year-display mb-3">
              <span className="year-number">{currentYear}</span>
              <span className="year-label ms-2">{locale === 'te' ? 'పండుగలు' : 'Festivals'}</span>
            </h2>

            {/* Year Quick Selection */}
            <div className="year-quick-select d-flex justify-content-center gap-2">
              {availableYears.map(year => (
                <Button
                  key={year}
                  variant={year === currentYear ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => goToSpecificYear(year)}
                  className="year-quick-btn"
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
        </Col>

        {/* Next Year Button */}
        <Col xs={12} md={3}>
          <Button
            variant="outline-primary"
            size="lg"
            className="w-100 year-nav-btn"
            onClick={goToNextYear}
            disabled={currentYear >= maxYear}
          >
            <span className="nav-text d-none d-sm-inline me-2">
              {locale === 'te' ? 'తరువాతి సంవత్సరం' : 'Next Year'}
            </span>
            <span className="nav-text d-sm-none me-2">{currentYear + 1}</span>
            <span className="nav-arrow">›</span>
          </Button>
        </Col>
      </Row>

      <style jsx>{`
        .festival-year-navigation {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .year-nav-btn {
          border: 2px solid var(--bs-primary);
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .year-nav-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 123, 255, 0.3);
        }

        .year-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nav-arrow {
          font-size: 1.5em;
          font-weight: bold;
        }

        .nav-text {
          transition: all 0.3s ease;
        }

        .current-year-display {
          color: #2c3e50;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .year-number {
          font-size: 2.5em;
          background: linear-gradient(135deg, #007bff, #0056b3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .year-label {
          font-size: 1.2em;
          color: #6c757d;
          font-weight: 500;
        }

        .year-quick-select {
          margin-top: 1rem;
        }

        .year-quick-btn {
          min-width: 60px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .year-quick-btn:hover {
          transform: scale(1.05);
        }

        .year-quick-btn.btn-primary {
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .festival-year-navigation {
            padding: 1.5rem 1rem;
          }

          .current-year-display .year-number {
            font-size: 2em;
          }

          .current-year-display .year-label {
            font-size: 1em;
          }

          .year-nav-btn {
            margin-bottom: 0.5rem;
          }

          .year-quick-select {
            flex-wrap: wrap;
            gap: 0.5rem !important;
          }

          .year-quick-btn {
            min-width: 50px;
            font-size: 0.9em;
          }
        }

        @media (max-width: 576px) {
          .festival-year-navigation {
            padding: 1rem;
          }

          .current-year-display {
            margin-bottom: 1rem !important;
          }

          .year-quick-select {
            justify-content: center !important;
          }
        }

        /* Animation for year changes */
        .festival-year-navigation {
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

        /* Loading state animation */
        .year-nav-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
        }

        /* Accessibility improvements */
        .year-nav-btn:focus-visible {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }

        .year-quick-btn:focus-visible {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default FestivalYearNavigation;
