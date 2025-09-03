import Layout from '@/components/Layout/Layout';
import LocationAccordion from '@/components/LocationAccordion';
import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/hooks/useTranslation';
import { EclipseEvent, YexaaEclipse } from '@/lib/eclipse';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Row, Spinner } from 'react-bootstrap';

interface EclipseYearPageProps {
  year: number;
}

export default function EclipseYearPage({ year: initialYear }: EclipseYearPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { city, country, timezone, lat, lng } = useLocation();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(initialYear);
  const [eclipses, setEclipses] = useState<EclipseEvent[]>([]);
  const [selectedEclipse, setSelectedEclipse] = useState<EclipseEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eclipseCalc = new YexaaEclipse();

  // Load eclipses for the selected year
  useEffect(() => {
    if (year) {
      loadEclipses(year);
    }
  }, [year]);

  // Update year when route changes
  useEffect(() => {
    if (router.query.year && typeof router.query.year === 'string') {
      const routeYear = parseInt(router.query.year);
      if (!isNaN(routeYear) && routeYear !== year) {
        setYear(routeYear);
      }
    }
  }, [router.query.year]);

  const loadEclipses = async (selectedYear: number) => {
    setLoading(true);
    setError(null);
    try {
      const yearEclipses = eclipseCalc.getEclipsesForYear(selectedYear);
      setEclipses(yearEclipses);
      setSelectedEclipse(null); // Clear selection when year changes
    } catch (err) {
      setError('Failed to load eclipses for this year');
      console.error('Eclipse loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (newYear: number) => {
    if (newYear >= 1900 && newYear <= 2100) {
      // Navigate to new URL
      router.push(`/calendar/eclipse/${newYear}`);
    }
  };

  // Update eclipse formatting to use selected timezone
  const formatEclipseTime = (eclipse: EclipseEvent) => {
    return eclipse.peak.toLocaleTimeString('en-IN', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEclipseDateTime = (eclipse: EclipseEvent) => {
    return eclipse.peak.toLocaleDateString('en-IN', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEclipseIcon = (eclipse: EclipseEvent) => {
    return eclipse.kind === 'solar' ? '☀️' : '🌙';
  };

  const getEclipseTypeColor = (eclipse: EclipseEvent) => {
    if (eclipse.kind === 'solar') {
      return eclipse.type === 'total'
        ? 'danger'
        : eclipse.type === 'annular'
          ? 'warning'
          : 'secondary';
    } else {
      return eclipse.type === 'total' ? 'danger' : eclipse.type === 'partial' ? 'warning' : 'info';
    }
  };

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            {/* Header with Year Navigation and Location Info */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="mb-0">Eclipses {year}</h1>
                <small className="text-muted">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  Times shown for {city}, {country} ({timezone})
                </small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleYearChange(year - 1)}
                  disabled={loading || year <= 1900}
                >
                  ← Previous
                </Button>
                <span className="fw-bold px-3">{year}</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleYearChange(year + 1)}
                  disabled={loading || year >= 2100}
                >
                  Next →
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="py-4 text-center">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading eclipses...</span>
                </Spinner>
                <p className="mt-2">Loading eclipses for {year}...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={() => loadEclipses(year)}>
                  Try Again
                </Button>
              </Alert>
            )}

            {/* Eclipse List */}
            {!loading && !error && (
              <>
                {eclipses.length === 0 ? (
                  <Alert variant="info">
                    <Alert.Heading>No Eclipses Found</Alert.Heading>
                    <p>No solar or lunar eclipses were found for the year {year}.</p>
                  </Alert>
                ) : (
                  <div className="eclipse-list">
                    <p className="text-muted mb-3">
                      Found {eclipses.length} eclipse{eclipses.length !== 1 ? 's' : ''} in {year}
                    </p>

                    {eclipses.map(eclipse => (
                      <Card
                        key={eclipse.id}
                        className={`mb-3 cursor-pointer ${selectedEclipse?.id === eclipse.id ? 'border-primary' : ''}`}
                        onClick={() => setSelectedEclipse(eclipse)}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="d-flex align-items-center gap-3">
                              <span className="fs-3">{getEclipseIcon(eclipse)}</span>
                              <div>
                                <h5 className="mb-1">
                                  {eclipseCalc.getEclipseTypeDisplayName(eclipse)}
                                </h5>
                                <p className="text-muted mb-1">{formatEclipseDateTime(eclipse)}</p>
                                <small className="text-muted">
                                  Peak: {formatEclipseTime(eclipse)}
                                </small>
                              </div>
                            </div>
                            <Badge bg={getEclipseTypeColor(eclipse)}>
                              {eclipse.type.charAt(0).toUpperCase() + eclipse.type.slice(1)}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Col>

        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          {/* Eclipse Detail Sidebar */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            {selectedEclipse ? (
              <>
                <h3 className="d-flex align-items-center mb-3 gap-2">
                  <span>{getEclipseIcon(selectedEclipse)}</span>
                  Eclipse Details
                </h3>

                <div className="eclipse-details">
                  <div className="mb-3">
                    <strong>Type:</strong>
                    <br />
                    <Badge bg={getEclipseTypeColor(selectedEclipse)} className="me-2">
                      {selectedEclipse.type.charAt(0).toUpperCase() + selectedEclipse.type.slice(1)}
                    </Badge>
                    {eclipseCalc.getEclipseTypeDisplayName(selectedEclipse)}
                  </div>

                  <div className="mb-3">
                    <strong>Date & Time ({timezone}):</strong>
                    <br />
                    {formatEclipseDateTime(selectedEclipse)}
                  </div>

                  <div className="mb-3">
                    <strong>Peak Time:</strong>
                    <br />
                    {selectedEclipse.peak.toLocaleTimeString('en-IN', {
                      timeZone: timezone,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>

                  <div className="mb-3">
                    <strong>Location:</strong>
                    <br />
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {city}, {country}
                    <br />
                    <small className="text-muted">
                      {eclipseCalc.getEclipseVisibilityInfo(selectedEclipse, lat, lng).note}
                    </small>
                  </div>

                  <div className="mb-3">
                    <strong>Kind:</strong>
                    <br />
                    {selectedEclipse.kind === 'solar' ? 'Solar Eclipse' : 'Lunar Eclipse'}
                  </div>

                  <div className="mb-3">
                    <strong>Eclipse ID:</strong>
                    <br />
                    <small className="text-muted font-monospace">{selectedEclipse.id}</small>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3>Eclipse Information</h3>
                <p className="text-muted">
                  Click on an eclipse from the list to view detailed information.
                </p>

                <div className="mt-4">
                  <h5>Eclipse Types:</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <Badge bg="danger" className="me-2">
                        Total
                      </Badge>
                      Complete coverage
                    </li>
                    <li className="mb-2">
                      <Badge bg="warning" className="me-2">
                        Partial
                      </Badge>
                      Partial coverage
                    </li>
                    <li className="mb-2">
                      <Badge bg="secondary" className="me-2">
                        Annular
                      </Badge>
                      Ring of fire (solar only)
                    </li>
                    <li className="mb-2">
                      <Badge bg="info" className="me-2">
                        Penumbral
                      </Badge>
                      Subtle shadow (lunar only)
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Location Selection */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <LocationAccordion city={city} country={country} />
          </div>

          {/* Quick Navigation */}
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h4>Quick Navigation</h4>
            <div className="d-flex flex-wrap gap-2">
              {[currentYear - 1, currentYear, currentYear + 1].map(quickYear => (
                <Button
                  key={quickYear}
                  variant={year === quickYear ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => handleYearChange(quickYear)}
                  disabled={loading}
                >
                  {quickYear}
                </Button>
              ))}
            </div>

            <div className="mt-3">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Navigate between years to explore eclipse patterns and timings. All times are
                automatically adjusted to your selected location's timezone.
              </small>
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { year } = context.params!;
  const parsedYear = parseInt(year as string);

  // Validate year
  if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      year: parsedYear,
    },
  };
};
