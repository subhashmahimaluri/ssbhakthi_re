import { useLocation } from '@/context/LocationContext';
import { YexaaPanchang } from '@/lib/panchangam';
import { formatTimeIST } from '@/utils/utils';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface TestResult {
  date: string;
  success: boolean;
  data?: any;
  error?: string;
}

export default function TestMonthlyCalendar() {
  const { lat, lng, city, country } = useLocation();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const testPanchangamCalculations = async () => {
    setLoading(true);
    const results: TestResult[] = [];

    // Test a few dates
    const testDates = [
      new Date(2025, 8, 1), // September 1, 2025
      new Date(2025, 8, 15), // September 15, 2025
      new Date(), // Today
    ];

    for (const date of testDates) {
      try {
        console.log(`Testing date: ${date.toDateString()}`);
        const panchang = new YexaaPanchang();

        // Test basic calculation
        const calculated = panchang.calculate(date);
        const sun = panchang.sunTimer(date, lat, lng);

        results.push({
          date: format(date, 'yyyy-MM-dd'),
          success: true,
          data: {
            sunrise: formatTimeIST(sun.sunRise),
            sunset: formatTimeIST(sun.sunSet),
            tithi: calculated.Tithi?.name_en_IN || 'N/A',
            nakshatra: calculated.Nakshatra?.name_en_IN || 'N/A',
            yoga: calculated.Yoga?.name_en_IN || 'N/A',
            karana: calculated.Karna?.name_en_IN || 'N/A',
          },
        });

        console.log(`Success for ${date.toDateString()}`);
      } catch (error) {
        console.error(`Error for ${date.toDateString()}:`, error);
        results.push({
          date: format(date, 'yyyy-MM-dd'),
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (lat && lng) {
      testPanchangamCalculations();
    }
  }, [lat, lng]);

  return (
    <div className="container mt-4">
      <h1>Monthly Calendar Test</h1>

      <div className="alert alert-info">
        <h5>Current Location:</h5>
        <p>
          <strong>City:</strong> {city}, {country}
        </p>
        <p>
          <strong>Coordinates:</strong> {lat.toFixed(3)}°N, {lng.toFixed(3)}°E
        </p>
      </div>

      <button
        className="btn btn-primary mb-4"
        onClick={testPanchangamCalculations}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Run Test'}
      </button>

      {testResults.length > 0 && (
        <div className="row">
          {testResults.map((result, index) => (
            <div key={index} className="col-md-4 mb-3">
              <div className={`card ${result.success ? 'border-success' : 'border-danger'}`}>
                <div className="card-header">
                  <h5 className="mb-0">
                    {result.date}
                    <span className={`badge ms-2 ${result.success ? 'bg-success' : 'bg-danger'}`}>
                      {result.success ? 'SUCCESS' : 'ERROR'}
                    </span>
                  </h5>
                </div>
                <div className="card-body">
                  {result.success && result.data ? (
                    <div>
                      <p>
                        <strong>Sunrise:</strong> {result.data.sunrise}
                      </p>
                      <p>
                        <strong>Sunset:</strong> {result.data.sunset}
                      </p>
                      <p>
                        <strong>Tithi:</strong> {result.data.tithi}
                      </p>
                      <p>
                        <strong>Nakshatra:</strong> {result.data.nakshatra}
                      </p>
                      <p>
                        <strong>Yoga:</strong> {result.data.yoga}
                      </p>
                      <p>
                        <strong>Karana:</strong> {result.data.karana}
                      </p>
                    </div>
                  ) : (
                    <div className="text-danger">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <h3>Expected Behavior:</h3>
        <ul>
          <li>All test dates should return success</li>
          <li>Sunrise/sunset times should be valid</li>
          <li>Tithi, Nakshatra, Yoga, and Karana should have valid names</li>
          <li>No errors should occur during calculation</li>
        </ul>
      </div>
    </div>
  );
}
