import { useEffect, useState } from 'react';
import { LocationProvider } from '../context/LocationContext';
import { YexaaPanchang } from '../lib/panchangam';

export default function TestTeluguYearCalculation() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testTeluguYear = () => {
    setLoading(true);
    const testResults: any[] = [];

    try {
      const panchang = new YexaaPanchang();

      // Test dates around the Telugu New Year
      const testDates = [
        { date: '2025-03-29', expected: 'krodhi', description: 'March 29, 2025 (Before New Year)' },
        {
          date: '2025-03-30',
          expected: 'vishwavasu',
          description: 'March 30, 2025 (Telugu New Year - Chaitra Shukla Padyami)',
        },
        {
          date: '2025-03-31',
          expected: 'vishwavasu',
          description: 'March 31, 2025 (After New Year)',
        },
        {
          date: '2026-03-19',
          expected: 'parabhava',
          description: 'March 19, 2026 (Should be Parabhava year)',
        },
        {
          date: '2026-03-20',
          expected: 'parabhava',
          description: 'March 20, 2026 (Chaitra Shukla Vidhiya - Should be Parabhava year)',
        },
        {
          date: '2027-04-08',
          expected: 'plavanga',
          description: 'April 8, 2027 (Should be Plavanga year)',
        },
      ];

      // Hyderabad coordinates
      const lat = 17.385;
      const lng = 78.4867;

      for (const testCase of testDates) {
        const date = new Date(testCase.date);

        try {
          const result = panchang.calculate(date, lat, lng);
          const calendar = result.calendar;

          // Debug log the full calculation
          console.log(`Debug for ${date.toDateString()}:`, {
            calendar,
            teluguYearObj: calendar.TeluguYear,
            teluguYearName: calendar.TeluguYear?.name_en_IN,
            rawResult: result,
          });

          const testResult = {
            description: testCase.description,
            date: date.toDateString(),
            teluguYear: calendar.TeluguYear?.name_en_IN || 'UNDEFINED',
            expected: testCase.expected,
            masa: calendar.MoonMasa?.name_en_IN || 'N/A',
            tithi: result.calculated.Tithi?.name_en_IN || 'N/A',
            paksha: result.calculated.Paksha?.name_en_IN || 'N/A',
            isCorrect: calendar.TeluguYear?.name_en_IN?.toLowerCase() === testCase.expected,
            error: null,
          };

          testResults.push(testResult);
        } catch (error) {
          testResults.push({
            description: testCase.description,
            date: date.toDateString(),
            error: error instanceof Error ? error.message : String(error),
            isCorrect: false,
          });
        }
      }
    } catch (error) {
      console.error('Test error:', error);
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    testTeluguYear();
  }, []);

  return (
    <LocationProvider>
      <div className="container mt-4">
        <h1 className="mb-4">Telugu Year Calculation Test</h1>
        <p className="mb-3">
          Testing the Telugu year calculation around <strong>Chaitra Shukla Padyami 2025</strong>{' '}
          (March 30, 2025).
        </p>

        <button className="btn btn-primary mb-4" onClick={testTeluguYear} disabled={loading}>
          {loading ? 'Testing...' : 'Run Test Again'}
        </button>

        {results.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Test Results</h3>
            </div>
            <div className="card-body">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`mb-3 rounded border p-3 ${result.isCorrect ? 'border-success bg-light-success' : 'border-danger bg-light-danger'}`}
                >
                  <h5>{result.description}</h5>
                  <p>
                    <strong>Date:</strong> {result.date}
                  </p>

                  {result.error ? (
                    <p className="text-danger">
                      <strong>Error:</strong> {result.error}
                    </p>
                  ) : (
                    <>
                      <div className="row">
                        <div className="col-md-6">
                          <p>
                            <strong>Telugu Year:</strong> {result.teluguYear}
                          </p>
                          <p>
                            <strong>Expected:</strong> {result.expected}
                          </p>
                          <p>
                            <strong>Status:</strong>
                            <span
                              className={`badge ms-2 ${result.isCorrect ? 'bg-success' : 'bg-danger'}`}
                            >
                              {result.isCorrect ? 'PASS' : 'FAIL'}
                            </span>
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p>
                            <strong>Masa:</strong> {result.masa}
                          </p>
                          <p>
                            <strong>Tithi:</strong> {result.tithi}
                          </p>
                          <p>
                            <strong>Paksha:</strong> {result.paksha}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card mt-4">
          <div className="card-header">
            <h3>Expected Behavior</h3>
          </div>
          <div className="card-body">
            <ul>
              <li>
                <strong>March 29, 2025:</strong> Should show Telugu year "Krodhi" (2024 cycle)
              </li>
              <li>
                <strong>March 30, 2025:</strong> Should show Telugu year "Viśvāvasu" (2025 cycle) -
                This is Chaitra Shukla Padyami
              </li>
              <li>
                <strong>March 31, 2025:</strong> Should show Telugu year "Viśvāvasu" (2025 cycle)
              </li>
            </ul>

            <h5 className="mt-3">Debug Information</h5>
            <p>
              Check the browser console for detailed debug output about the Telugu year calculation
              logic.
            </p>
          </div>
        </div>
      </div>
    </LocationProvider>
  );
}
