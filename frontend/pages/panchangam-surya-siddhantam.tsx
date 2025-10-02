import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import { LocationProvider, useLocation } from '../context/LocationContext';
import { YexaaPanchang } from '../lib/panchangam';
import { YexaaPanchang_SuryaSiddhantam } from '../lib/panchangam/YexaaPanchang_SuryaSiddhantam';
import { YexaaLocalConstant } from '../lib/panchangam/yexaaLocalConstant';

interface PanchangamResults {
  suryaSiddhanta: any;
  drik: any;
  calculations: {
    date: Date;
    location: {
      lat: number;
      lng: number;
      timezone: string;
    };
    executionTime: {
      suryaSiddhanta: number;
      drik: number;
    };
  };
}

function PanchangamSuryaSiddhantamContent() {
  const router = useRouter();
  const { lat, lng, city, country } = useLocation();
  const [results, setResults] = useState<PanchangamResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for manual input
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    lat: 12.97,
    lng: 77.59,
    timezone: 'Asia/Kolkata',
  });

  // Update form data when URL params or location context changes
  useEffect(() => {
    const { date, lat: urlLat, lon, tz } = router.query;

    setFormData(prev => ({
      ...prev,
      date: (date as string) || format(new Date(), 'yyyy-MM-dd'),
      lat: urlLat ? parseFloat(urlLat as string) : lat || 12.97,
      lng: lon ? parseFloat(lon as string) : lng || 77.59,
      timezone: (tz as string) || 'Asia/Kolkata',
    }));
  }, [router.query, lat, lng]);

  // Auto-calculate when component mounts or dependencies change
  useEffect(() => {
    if (formData.date && formData.lat && formData.lng) {
      calculatePanchangam();
    }
  }, [formData.date, formData.lat, formData.lng, formData.timezone]);

  const calculatePanchangam = async () => {
    setLoading(true);
    setError(null);

    try {
      const targetDate = new Date(formData.date);
      const yexaaConstant = new YexaaLocalConstant();

      // Calculate Surya Siddhanta results
      const startSS = performance.now();
      const suryaSiddhantaEngine = new YexaaPanchang_SuryaSiddhantam(yexaaConstant);
      const suryaSiddhantaResult = suryaSiddhantaEngine.computePanchang({
        date: targetDate,
        lat: formData.lat,
        lon: formData.lng,
        tz: formData.timezone,
      });
      const endSS = performance.now();

      // Calculate Drik results (existing system)
      const startDrik = performance.now();
      const drikEngine = new YexaaPanchang();
      const drikCalculated = drikEngine.calculate(targetDate);
      const drikCalendar = drikEngine.calendar(targetDate, formData.lat, formData.lng);
      const drikSun = drikEngine.sunTimer(targetDate, formData.lat, formData.lng);
      const endDrik = performance.now();

      const drikResult = {
        tithi: {
          number: drikCalculated.Tithi?.ino,
          name: drikCalculated.Tithi?.name_en_IN,
          start: drikCalculated.Tithi?.start,
          end: drikCalculated.Tithi?.end,
        },
        nakshatra: {
          number: drikCalculated.Nakshatra?.ino,
          name: drikCalculated.Nakshatra?.name_en_IN,
          start: drikCalculated.Nakshatra?.start,
          end: drikCalculated.Nakshatra?.end,
        },
        yoga: {
          number: drikCalculated.Yoga?.ino,
          name: drikCalculated.Yoga?.name_en_IN,
          start: drikCalculated.Yoga?.start,
          end: drikCalculated.Yoga?.end,
        },
        karana: {
          number: drikCalculated.Karna?.ino,
          name: drikCalculated.Karna?.name_en_IN,
          start: drikCalculated.Karna?.start,
          end: drikCalculated.Karna?.end,
        },
        sun: {
          longitude: null, // Would need to extract from implementation
          sunrise: drikSun.sunRise,
          sunset: drikSun.sunSet,
        },
        moon: {
          longitude: null, // Would need to extract from implementation
        },
        ayanamsa: drikCalculated.Ayanamsa?.name,
        calendar: drikCalendar,
      };

      setResults({
        suryaSiddhanta: suryaSiddhantaResult,
        drik: drikResult,
        calculations: {
          date: targetDate,
          location: {
            lat: formData.lat,
            lng: formData.lng,
            timezone: formData.timezone,
          },
          executionTime: {
            suryaSiddhanta: endSS - startSS,
            drik: endDrik - startDrik,
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      console.error('Panchangam calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update URL with new parameters
    router.push({
      pathname: '/panchangam-surya-siddhantam',
      query: {
        date: formData.date,
        lat: formData.lat.toString(),
        lon: formData.lng.toString(),
        tz: formData.timezone,
      },
    });
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'HH:mm');
    } catch {
      return 'Invalid';
    }
  };

  const renderComparisonTable = () => {
    if (!results) return null;

    const { suryaSiddhanta, drik } = results;

    return (
      <Table striped bordered responsive className="mt-3">
        <thead className="table-dark">
          <tr>
            <th>Element</th>
            <th>Surya Siddhanta</th>
            <th>Drik (Current System)</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Tithi</strong>
            </td>
            <td>
              {suryaSiddhanta.tithi?.name || 'N/A'} (#{suryaSiddhanta.tithi?.number})<br />
              <small>
                {formatDateTime(suryaSiddhanta.tithi?.start)} –{' '}
                {formatDateTime(suryaSiddhanta.tithi?.end)}
              </small>
            </td>
            <td>
              {drik.tithi?.name || 'N/A'} (#{drik.tithi?.number})<br />
              <small>
                {formatDateTime(drik.tithi?.start)} – {formatDateTime(drik.tithi?.end)}
              </small>
            </td>
            <td>
              {suryaSiddhanta.tithi?.number !== undefined && drik.tithi?.number !== undefined
                ? `Δ${Math.abs(suryaSiddhanta.tithi.number - drik.tithi.number)}`
                : 'N/A'}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Nakshatra</strong>
            </td>
            <td>
              {suryaSiddhanta.nakshatra?.name || 'N/A'} (#{suryaSiddhanta.nakshatra?.number})<br />
              <small>
                {formatDateTime(suryaSiddhanta.nakshatra?.start)} –{' '}
                {formatDateTime(suryaSiddhanta.nakshatra?.end)}
              </small>
            </td>
            <td>
              {drik.nakshatra?.name || 'N/A'} (#{drik.nakshatra?.number})<br />
              <small>
                {formatDateTime(drik.nakshatra?.start)} – {formatDateTime(drik.nakshatra?.end)}
              </small>
            </td>
            <td>
              {suryaSiddhanta.nakshatra?.number !== undefined &&
              drik.nakshatra?.number !== undefined
                ? `Δ${Math.abs(suryaSiddhanta.nakshatra.number - drik.nakshatra.number)}`
                : 'N/A'}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Yoga</strong>
            </td>
            <td>
              {suryaSiddhanta.yoga?.name || 'N/A'} (#{suryaSiddhanta.yoga?.number})<br />
              <small>
                {formatDateTime(suryaSiddhanta.yoga?.start)} –{' '}
                {formatDateTime(suryaSiddhanta.yoga?.end)}
              </small>
            </td>
            <td>
              {drik.yoga?.name || 'N/A'} (#{drik.yoga?.number})<br />
              <small>
                {formatDateTime(drik.yoga?.start)} – {formatDateTime(drik.yoga?.end)}
              </small>
            </td>
            <td>
              {suryaSiddhanta.yoga?.number !== undefined && drik.yoga?.number !== undefined
                ? `Δ${Math.abs(suryaSiddhanta.yoga.number - drik.yoga.number)}`
                : 'N/A'}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Karana</strong>
            </td>
            <td>
              {suryaSiddhanta.karana?.name || 'N/A'} (#{suryaSiddhanta.karana?.number})<br />
              <small>
                {formatDateTime(suryaSiddhanta.karana?.start)} –{' '}
                {formatDateTime(suryaSiddhanta.karana?.end)}
              </small>
            </td>
            <td>
              {drik.karana?.name || 'N/A'} (#{drik.karana?.number})<br />
              <small>
                {formatDateTime(drik.karana?.start)} – {formatDateTime(drik.karana?.end)}
              </small>
            </td>
            <td>
              {suryaSiddhanta.karana?.number !== undefined && drik.karana?.number !== undefined
                ? `Δ${Math.abs(suryaSiddhanta.karana.number - drik.karana.number)}`
                : 'N/A'}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Sun Longitude</strong>
            </td>
            <td>{suryaSiddhanta.sun?.longitude?.toFixed(4)}°</td>
            <td>{drik.sun?.longitude ? drik.sun.longitude.toFixed(4) + '°' : 'N/A'}</td>
            <td>
              {suryaSiddhanta.sun?.longitude && drik.sun?.longitude
                ? `Δ${Math.abs(suryaSiddhanta.sun.longitude - drik.sun.longitude).toFixed(4)}°`
                : 'N/A'}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Moon Longitude</strong>
            </td>
            <td>{suryaSiddhanta.moon?.longitude?.toFixed(4)}°</td>
            <td>{drik.moon?.longitude ? drik.moon.longitude.toFixed(4) + '°' : 'N/A'}</td>
            <td>
              {suryaSiddhanta.moon?.longitude && drik.moon?.longitude
                ? `Δ${Math.abs(suryaSiddhanta.moon.longitude - drik.moon.longitude).toFixed(4)}°`
                : 'N/A'}
            </td>
          </tr>
          <tr>
            <td>
              <strong>Ayanamsa</strong>
            </td>
            <td>{suryaSiddhanta.ayanamsa?.toFixed(4)}°</td>
            <td>{drik.ayanamsa || 'N/A'}</td>
            <td>-</td>
          </tr>
        </tbody>
      </Table>
    );
  };

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <h1 className="mb-4">🌟 Surya Siddhanta Panchangam Test</h1>
          <Alert variant="info">
            <strong>About this test:</strong> This page compares the classical Surya Siddhanta
            astronomical calculation method with the modern Drik (Swiss Ephemeris) system. Surya
            Siddhanta uses mean motion formulas while Drik uses precise ephemeris data.
          </Alert>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>📍 Location & Date Input</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleFormSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Timezone</Form.Label>
                      <Form.Select
                        value={formData.timezone}
                        onChange={e => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Latitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.0001"
                        value={formData.lat}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Longitude</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.0001"
                        value={formData.lng}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Calculating...' : 'Calculate Panchangam'}
                </Button>
              </Form>

              <div className="mt-3">
                <small className="text-muted">
                  Current context: {city}, {country} ({lat?.toFixed(4)}, {lng?.toFixed(4)})
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>⚡ Performance & Info</h5>
            </Card.Header>
            <Card.Body>
              {results && (
                <>
                  <p>
                    <strong>Calculation Date:</strong>{' '}
                    {format(results.calculations.date, 'MMM dd, yyyy')}
                  </p>
                  <p>
                    <strong>Location:</strong> {results.calculations.location.lat.toFixed(4)},{' '}
                    {results.calculations.location.lng.toFixed(4)}
                  </p>
                  <p>
                    <strong>Execution Time:</strong>
                  </p>
                  <ul>
                    <li>
                      Surya Siddhanta:{' '}
                      {results.calculations.executionTime.suryaSiddhanta.toFixed(2)}ms
                    </li>
                    <li>Drik: {results.calculations.executionTime.drik.toFixed(2)}ms</li>
                  </ul>
                  <Alert
                    variant={
                      results.calculations.executionTime.suryaSiddhanta < 250
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {results.calculations.executionTime.suryaSiddhanta < 250
                      ? '✅ Performance target met (<250ms)'
                      : '⚠️ Performance target not met (≥250ms)'}
                  </Alert>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col>
            <Alert variant="danger">
              <strong>Error:</strong> {error}
            </Alert>
          </Col>
        </Row>
      )}

      {results && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5>📊 Surya Siddhanta vs Drik Comparison</h5>
              </Card.Header>
              <Card.Body>
                {renderComparisonTable()}

                <Alert variant="secondary" className="mt-3">
                  <h6>🔍 Understanding the Differences:</h6>
                  <ul className="mb-0">
                    <li>
                      <strong>Surya Siddhanta:</strong> Uses classical mean motion formulas (~5th
                      century CE methods)
                    </li>
                    <li>
                      <strong>Drik:</strong> Uses modern precise ephemeris calculations with
                      perturbations
                    </li>
                    <li>
                      <strong>Expected:</strong> Small differences in timing and positions are
                      normal
                    </li>
                    <li>
                      <strong>Performance:</strong> Surya Siddhanta should be faster due to simpler
                      calculations
                    </li>
                  </ul>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {loading && (
        <Row>
          <Col className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Calculating panchangam values...</p>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default function PanchangamSuryaSiddhantam() {
  return (
    <LocationProvider>
      <PanchangamSuryaSiddhantamContent />
    </LocationProvider>
  );
}
