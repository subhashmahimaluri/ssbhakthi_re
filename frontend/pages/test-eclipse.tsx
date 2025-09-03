import { useEffect, useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { EclipseEvent, YexaaEclipse } from '../lib/eclipse';

export default function TestEclipse() {
  const { city, country, timezone, lat, lng } = useLocation();
  const [results, setResults] = useState<
    {
      year: number;
      eclipses: EclipseEvent[];
      error?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const testEclipses = async () => {
    setLoading(true);
    const testResults: any[] = [];
    const eclipseCalc = new YexaaEclipse();

    // Test multiple years
    const testYears = [2024, 2025, 2026];

    for (const year of testYears) {
      try {
        console.log(`Testing eclipses for ${year}...`);
        const eclipses = eclipseCalc.getEclipsesForYear(year);
        testResults.push({
          year,
          eclipses,
          count: eclipses.length,
        });
        console.log(`Found ${eclipses.length} eclipses for ${year}:`, eclipses);
      } catch (error) {
        console.error(`Error for ${year}:`, error);
        testResults.push({
          year,
          eclipses: [],
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    testEclipses();
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Eclipse Calculation Test</h1>
      <div className="alert alert-info mb-4">
        <h5>Current Location Settings:</h5>
        <p className="mb-1">
          <strong>Location:</strong> {city}, {country}
        </p>
        <p className="mb-1">
          <strong>Coordinates:</strong> {lat.toFixed(3)}°N, {lng.toFixed(3)}°E
        </p>
        <p className="mb-0">
          <strong>Timezone:</strong> {timezone}
        </p>
      </div>

      <p className="mb-3">Testing the YexaaEclipse utility with astronomy-engine library.</p>
      <button className="btn btn-primary mb-4" onClick={testEclipses} disabled={loading}>
        {loading ? 'Testing...' : 'Run Test Again'}
      </button>

      {results.length > 0 && (
        <div className="row">
          {results.map((result, index) => (
            <div key={index} className="col-md-4 mb-4">
              <div className="card">
                <div className="card-header">
                  <h3>Eclipses {result.year}</h3>
                </div>
                <div className="card-body">
                  {result.error ? (
                    <div className="alert alert-danger">
                      <strong>Error:</strong> {result.error}
                    </div>
                  ) : (
                    <>
                      <p className="mb-3">
                        <strong>Total Eclipses:</strong> {result.eclipses.length}
                      </p>

                      {result.eclipses.length === 0 ? (
                        <div className="alert alert-warning">
                          No eclipses found for {result.year}
                        </div>
                      ) : (
                        <div className="eclipse-list">
                          {result.eclipses.map((eclipse, i) => (
                            <div key={eclipse.id} className="mb-2 rounded border p-2">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>
                                    {eclipse.kind === 'solar' ? '☀️' : '🌙'} {eclipse.kind}
                                  </strong>
                                  <br />
                                  <small>
                                    {eclipse.type} •{' '}
                                    {eclipse.date.toLocaleDateString('en-IN', {
                                      timeZone: timezone,
                                      month: 'short',
                                      day: 'numeric',
                                    })}{' '}
                                    •{' '}
                                    {eclipse.date.toLocaleTimeString('en-IN', {
                                      timeZone: timezone,
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </small>
                                </div>
                                <span className="badge bg-primary">{i + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-4">
        <div className="card-header">
          <h3>Debug Information</h3>
        </div>
        <div className="card-body">
          <p>Check the browser console for detailed eclipse calculation logs.</p>
          <p>
            <strong>Expected Results:</strong>
          </p>
          <ul>
            <li>
              Each year should have at least 2 eclipses (minimum is 2 solar eclipses per year)
            </li>
            <li>Maximum is about 5-7 eclipses per year</li>
            <li>
              If you see "No eclipses found" for all years, there's an issue with astronomy-engine
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
