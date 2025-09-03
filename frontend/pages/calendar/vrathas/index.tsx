import Layout from '@/components/Layout/Layout';
import LocationAccordion from '@/components/LocationAccordion';
import VrathTile from '@/components/VrathTile';
import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/hooks/useTranslation';
import { CalculatedVrath } from '@/lib/vrathData';
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Col, Row, Spinner } from 'react-bootstrap';

export default function Vrathas() {
  const { t, locale } = useTranslation();
  const { lat, lng, city, country } = useLocation();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [vraths, setVraths] = useState<CalculatedVrath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate vrath dates when year or location changes
  useEffect(() => {
    const loadVraths = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use the optimized calculateVrathDates function
        const calculatedVraths = await import('@/lib/vrathData').then(module =>
          module.calculateVrathDates(currentYear, lat, lng)
        );

        setVraths(calculatedVraths);
      } catch (err) {
        console.error('Error loading vraths:', err);
        setError('Failed to load vrath data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadVraths();
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

  // Filter upcoming vraths (within next 30 days)
  const upcomingVraths = vraths.filter(vrath => vrath.daysUntilNext <= 30);

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            {/* Header with Year Navigation and Location Info */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="mb-0">
                  {locale === 'te'
                    ? `వ్రతాలు మరియు ఉపవాసలు ${currentYear}`
                    : `Vrath & Upavas ${currentYear}`}
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
                      ? 'వ్రత సమాచారం లోడ్ అవుతోంది...'
                      : 'Loading vrath information...'}
                  </span>
                </Spinner>
                <p className="mt-2">
                  {locale === 'te'
                    ? 'వ్రత సమాచారం లోడ్ అవుతోంది...'
                    : 'Loading vrath information...'}
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

            {/* Vrath List */}
            {!loading && !error && (
              <>
                {vraths.length === 0 ? (
                  <Alert variant="info">
                    <Alert.Heading>
                      {locale === 'te' ? 'వ్రతాలు కనుగొనబడలేదు' : 'No vraths found'}
                    </Alert.Heading>
                    <p>
                      {locale === 'te'
                        ? 'ఈ సంవత్సరానికి వ్రత డేటా అందుబాటులో లేదు'
                        : 'Vrath data is not available for this year'}
                    </p>
                  </Alert>
                ) : (
                  <div className="vrath-list">
                    <p className="text-muted mb-3">
                      {locale === 'te'
                        ? `${vraths.length} వ్రతాలు కనుగొనబడ్డాయి ${currentYear}లో`
                        : `Found ${vraths.length} vrath${vraths.length !== 1 ? 's' : ''} in ${currentYear}`}
                    </p>

                    {/* Responsive tile grid - 3 tiles per row on desktop, 2 on tablet, 1 on mobile */}
                    <Row className="g-4">
                      {vraths.map(vrath => (
                        <Col xs={12} sm={6} lg={4} key={vrath.id}>
                          <VrathTile vrath={vrath} />
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

          {/* Upcoming Vraths */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h4>{locale === 'te' ? 'రాబోయే వ్రతాలు' : 'Upcoming Vraths'}</h4>
            <div className="upcoming-vraths mt-3">
              {upcomingVraths.length === 0 ? (
                <p className="text-muted small">
                  {locale === 'te'
                    ? 'రాబోయే 30 రోజుల్లో వ్రతాలు లేవు'
                    : 'No vraths in the next 30 days'}
                </p>
              ) : (
                upcomingVraths.slice(0, 5).map(vrath => (
                  <div
                    key={vrath.id}
                    className="upcoming-item d-flex justify-content-between align-items-center mb-2 rounded border p-2"
                  >
                    <div>
                      <small className="fw-bold text-dark">
                        {locale === 'te' ? vrath.nameTelugu : vrath.nameEnglish}
                      </small>
                      <br />
                      <small className="text-muted">{vrath.nextOccurrenceFormatted}</small>
                    </div>
                    <Badge bg="success" className="ms-2">
                      {vrath.daysUntilNext === 0
                        ? locale === 'te'
                          ? 'ఈరోజు'
                          : 'Today'
                        : vrath.daysUntilNext === 1
                          ? locale === 'te'
                            ? 'రేపు'
                            : 'Tomorrow'
                          : `${vrath.daysUntilNext}d`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vrath Summary */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h4>{locale === 'te' ? 'వ్రత సారాంశం' : 'Vrath Summary'}</h4>
            <div className="summary-stats mt-3">
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'మొత్తం వ్రతాలు:' : 'Total Vraths:'}</span>
                <span className="fw-bold text-primary">{vraths.length}</span>
              </div>
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'మాసిక వ్రతాలు:' : 'Monthly Observances:'}</span>
                <span className="fw-bold text-success">
                  {vraths.filter(v => v.category === 'Monthly Observances').length}
                </span>
              </div>
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'ఏకాదశి వ్రతాలు:' : 'Ekadashi:'}</span>
                <span className="fw-bold text-info">
                  {vraths.filter(v => v.category === 'Ekadashi').length}
                </span>
              </div>
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'ప్రదోష వ্রতాలు:' : 'Pradosham:'}</span>
                <span className="fw-bold text-warning">
                  {vraths.filter(v => v.category === 'Pradosham').length}
                </span>
              </div>
              <div className="stat-item d-flex justify-content-between mb-2">
                <span>{locale === 'te' ? 'నవరాత্రి వ్రతాలు:' : 'Navratri Festivals:'}</span>
                <span className="fw-bold text-danger">
                  {vraths.filter(v => v.category === 'Navratri Festivals').length}
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
                variant="outline-secondary"
                size="sm"
                onClick={goToToday}
                disabled={loading || currentYear === new Date().getFullYear()}
                className="w-100"
              >
                {locale === 'te' ? 'ఈ సంవత్సరం' : 'Current Year'}
              </Button>
            </div>

            <div className="mt-3">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                {locale === 'te'
                  ? 'అన్ని తేదీలు మీ ఎంచుకున్న స్థానానికి సరిపోయేలా సమయ మండలానికి సరిపోతాయి.'
                  : "All dates are automatically adjusted to your selected location's timezone."}
              </small>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
