import FestivalTile from '@/components/FestivalTile';
import Layout from '@/components/Layout/Layout';
import LocationAccordion from '@/components/LocationAccordion';
import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/hooks/useTranslation';
import { CalculatedFestival, calculateFestivalDates } from '@/lib/festivalData';
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Row, Spinner } from 'react-bootstrap';

export default function Festivals() {
  const { t, locale } = useTranslation();
  const { lat, lng, city, country } = useLocation();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [festivals, setFestivals] = useState<CalculatedFestival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate festival dates when year or location changes
  useEffect(() => {
    const loadFestivals = async () => {
      setLoading(true);
      setError(null);

      try {
        const validLat = lat || 17.385044; // Default to Hyderabad
        const validLng = lng || 78.486671;

        const calculatedFestivals = calculateFestivalDates(currentYear, validLat, validLng);
        setFestivals(calculatedFestivals);
      } catch (err) {
        console.error('Error loading festivals:', err);
        setError('Failed to load festival data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadFestivals();
  }, [currentYear, lat, lng]);

  const goToPreviousYear = () => {
    if (currentYear > 2024) {
      setCurrentYear(prev => prev - 1);
    }
  };

  const goToNextYear = () => {
    if (currentYear < 2026) {
      setCurrentYear(prev => prev + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
  };

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            {/* Header with Year Navigation and Location Info */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="mb-0">
                  {locale === 'te' ? `తెలుగు పండుగలు ${currentYear}` : `Festivals ${currentYear}`}
                </h1>
                <small className="text-muted">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  Times shown for {city || 'Hyderabad'}, {country || 'India'}
                </small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={goToPreviousYear}
                  disabled={currentYear <= 2024}
                >
                  ← Previous
                </Button>
                <span className="fw-bold px-3">{currentYear}</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={goToNextYear}
                  disabled={currentYear >= 2026}
                >
                  Next →
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-4 text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">
                    {locale === 'te'
                      ? 'పండుగల సమాచారం లోడ్ అవుతోంది...'
                      : 'Loading festival information...'}
                  </span>
                </Spinner>
                <p className="mt-2">
                  {locale === 'te'
                    ? 'పండుగల సమాచారం లోడ్ అవుతోంది...'
                    : 'Loading festival information...'}
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="danger">
                <Alert.Heading>{locale === 'te' ? 'దోషం' : 'Error'}</Alert.Heading>
                <p>{error}</p>
              </Alert>
            )}

            {/* Festival List */}
            {!loading && !error && (
              <>
                {festivals.length === 0 ? (
                  <Alert variant="info">
                    <Alert.Heading>
                      {locale === 'te' ? 'పండుగలు కనుగొనబడలేదు' : 'No festivals found'}
                    </Alert.Heading>
                    <p>
                      {locale === 'te'
                        ? 'ఈ సంవత్సరానికి పండుగల డేటా అందుబాటులో లేదు'
                        : 'Festival data is not available for this year'}
                    </p>
                  </Alert>
                ) : (
                  <div className="festival-list">
                    <p className="text-muted mb-3">
                      {locale === 'te'
                        ? `${festivals.length} పండుగలు కనుగొనబడ్డాయి ${currentYear}లో`
                        : `Found ${festivals.length} festival${festivals.length !== 1 ? 's' : ''} in ${currentYear}`}
                    </p>

                    <Row className="g-4">
                      {festivals.map(festival => (
                        <Col xs={12} md={6} key={festival.id}>
                          <FestivalTile festival={festival} />
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </>
            )}
          </div>
        </Col>

        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          {/* Location Selection */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <LocationAccordion city={city || 'Hyderabad'} country={country || 'India'} />
          </div>

          {/* Festival Summary */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h4>{locale === 'te' ? 'పండుగల సారాంశం' : 'Festival Summary'}</h4>
            <div className="summary-stats mt-3">
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'మొత్తం పండుగలు:' : 'Total Festivals:'}</span>
                <span className="fw-bold text-primary">{festivals.length}</span>
              </div>
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'ప్రధాన పండుగలు:' : 'Major Festivals:'}</span>
                <span className="fw-bold text-success">
                  {festivals.filter(f => f.category === 'Major Festivals').length}
                </span>
              </div>
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'జయంతులు:' : 'Jayanthis:'}</span>
                <span className="fw-bold text-info">
                  {festivals.filter(f => f.category === 'Jayanthis').length}
                </span>
              </div>
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'ప్రాంతీయ పండుగలు:' : 'Regional Festivals:'}</span>
                <span className="fw-bold text-warning">
                  {festivals.filter(f => f.category === 'Regional Festivals').length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Year Navigation */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h4>{locale === 'te' ? 'త్వరిత నావిగేషన్' : 'Quick Navigation'}</h4>
            <div className="d-flex mt-3 flex-wrap gap-2">
              {[2024, 2025, 2026].map(quickYear => (
                <Button
                  key={quickYear}
                  variant={currentYear === quickYear ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setCurrentYear(quickYear)}
                  disabled={loading}
                >
                  {quickYear}
                </Button>
              ))}
            </div>

            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={goToToday}
                className="w-100"
                disabled={loading}
              >
                {locale === 'te' ? 'ఈ సంవత్సరం' : 'Current Year'}
              </Button>
            </div>

            <div className="mt-3">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                {locale === 'te'
                  ? 'వేర్వేరు సంవత్సరాలలో పండుగలను అన్వేషించండి. అన్ని సమయాలు మీ స్థానం ప్రకారం సర్దుబాటు చేయబడతాయి.'
                  : 'Navigate between years to explore festival patterns. All times are automatically adjusted to your selected location.'}
              </small>
            </div>
          </div>

          {/* Festival Categories */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h4>{locale === 'te' ? 'పండుగ వర్గాలు' : 'Festival Categories'}</h4>
            <div className="mt-3">
              <div className="category-item d-flex align-items-center mb-2">
                <Badge bg="primary" className="me-2">
                  Major
                </Badge>
                <small>{locale === 'te' ? 'ప్రధాన పండుగలు' : 'Major Festivals'}</small>
              </div>
              <div className="category-item d-flex align-items-center mb-2">
                <Badge bg="success" className="me-2">
                  Jayanthi
                </Badge>
                <small>{locale === 'te' ? 'దేవతల జయంతులు' : 'Deity Birth Celebrations'}</small>
              </div>
              <div className="category-item d-flex align-items-center mb-2">
                <Badge bg="warning" className="me-2">
                  Regional
                </Badge>
                <small>{locale === 'te' ? 'ప్రాంతీయ పండుగలు' : 'Regional Celebrations'}</small>
              </div>
              <div className="category-item d-flex align-items-center mb-2">
                <Badge bg="info" className="me-2">
                  Seasonal
                </Badge>
                <small>{locale === 'te' ? 'కాలానుగుణ పండుగలు' : 'Seasonal Festivals'}</small>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
