import { useState } from 'react';
import { LocationProvider } from '../context/LocationContext';
import { YexaaPanchang } from '../lib/panchangam';

export default function TestTithiLookup() {
  const [year, setYear] = useState(2025);
  const [masa, setMasa] = useState('badhrapada');
  const [paksha, setPaksha] = useState('shukla_paksha');
  const [tithiName, setTithiName] = useState('dasami');
  const [lat] = useState(17.385); // Hyderabad
  const [lng] = useState(78.4867); // Hyderabad
  const [results, setResults] = useState<Date[] | null>(null);
  const [singleResult, setSingleResult] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSingleLookup = async () => {
    setLoading(true);
    try {
      const panchang = new YexaaPanchang();
      // Enable debug for troubleshooting
      const result = panchang.findDateByTithi(year, masa, paksha, tithiName, lat, lng, true);
      setSingleResult(result);
      setResults(null);
    } catch (error) {
      console.error('Error in single lookup:', error);
      setSingleResult(null);
    }
    setLoading(false);
  };

  const handleMultipleLookup = async () => {
    setLoading(true);
    try {
      const panchang = new YexaaPanchang();
      // Enable debug for troubleshooting
      const result = panchang.findAllDatesByTithi(year, masa, paksha, tithiName, lat, lng, true);
      setResults(result);
      setSingleResult(null);
    } catch (error) {
      console.error('Error in multiple lookup:', error);
      setResults(null);
    }
    setLoading(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  };

  return (
    <LocationProvider>
      <div className="container mt-4">
        <h1 className="mb-4">Tithi Reverse Lookup Test</h1>
        <p className="mb-3">
          This test demonstrates the reverse lookup functionality to find Gregorian dates based on
          Telugu Panchangam details (Year + Masa + Paksha + Tithi).
        </p>

        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header">
                <h3>Input Parameters</h3>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="year" className="form-label">
                      Year:
                    </label>
                    <input
                      type="number"
                      id="year"
                      className="form-control"
                      value={year}
                      onChange={e => setYear(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="masa" className="form-label">
                      Masa:
                    </label>
                    <select
                      id="masa"
                      className="form-select"
                      value={masa}
                      onChange={e => setMasa(e.target.value)}
                    >
                      <option value="chaitra">Chaitra</option>
                      <option value="vishakam">Vishakam</option>
                      <option value="jyesta">Jyesta</option>
                      <option value="ashada">Ashada</option>
                      <option value="sravana">Sravana</option>
                      <option value="badhrapada">Badhrapada</option>
                      <option value="aswayuja">Aswayuja</option>
                      <option value="karthika">Karthika</option>
                      <option value="margasira">Margasira</option>
                      <option value="pusya">Pusya</option>
                      <option value="magha">Magha</option>
                      <option value="phalguna">Phalguna</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="paksha" className="form-label">
                      Paksha:
                    </label>
                    <select
                      id="paksha"
                      className="form-select"
                      value={paksha}
                      onChange={e => setPaksha(e.target.value)}
                    >
                      <option value="shukla_paksha">Shukla Paksha</option>
                      <option value="krishna_paksha">Krishna Paksha</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="tithi" className="form-label">
                      Tithi:
                    </label>
                    <select
                      id="tithi"
                      className="form-select"
                      value={tithiName}
                      onChange={e => setTithiName(e.target.value)}
                    >
                      <option value="padyami">Padyami</option>
                      <option value="vidhiya">Vidhiya</option>
                      <option value="thadiya">Thadiya</option>
                      <option value="chaviti">Chaviti</option>
                      <option value="panchami">Panchami</option>
                      <option value="shasti">Shasti</option>
                      <option value="saptami">Saptami</option>
                      <option value="ashtami">Ashtami</option>
                      <option value="navami">Navami</option>
                      <option value="dasami">Dasami</option>
                      <option value="ekadasi">Ekadasi</option>
                      <option value="dvadasi">Dvadasi</option>
                      <option value="trayodasi">Trayodasi</option>
                      <option value="chaturdasi">Chaturdasi</option>
                      <option value="pournami">Pournami</option>
                      <option value="amavasya">Amavasya</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-12">
                    <p className="text-muted">
                      <strong>Location:</strong> Hyderabad (Lat: {lat}, Lng: {lng})
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={handleSingleLookup}
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Find First Date'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleMultipleLookup}
                    disabled={loading}
                  >
                    {loading ? 'Searching...' : 'Find All Dates'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {singleResult && (
              <div className="alert alert-success">
                <h4>Single Result:</h4>
                <p className="mb-0">
                  <strong>{formatDate(singleResult)}</strong>
                  <br />
                  <small className="text-muted">{singleResult.toISOString()}</small>
                </p>
              </div>
            )}

            {results && (
              <div className="alert alert-info">
                <h4>All Results ({results.length} found):</h4>
                {results.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {results.map((date, index) => (
                      <li key={index} className="mb-2">
                        <strong>{formatDate(date)}</strong>
                        <br />
                        <small className="text-muted">{date.toISOString()}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-0">No matching dates found.</p>
                )}
              </div>
            )}

            {singleResult === null && results === null && !loading && (
              <div className="alert alert-light">
                <p className="mb-0">
                  Click one of the buttons above to search for dates matching your criteria.
                </p>
              </div>
            )}
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h3>Test Examples</h3>
              </div>
              <div className="card-body">
                <h5>Popular Test Cases:</h5>
                <ul>
                  <li>
                    <strong>Bhadrapada Shukla Dashami 2025</strong>
                    <br />
                    <small>Should find September 2, 2025</small>
                  </li>
                  <li>
                    <strong>Chaitra Shukla Pournami 2025</strong>
                    <br />
                    <small>Full moon in Chaitra month</small>
                  </li>
                  <li>
                    <strong>Karthika Krishna Amavasya 2025</strong>
                    <br />
                    <small>New moon in Karthika month (Diwali)</small>
                  </li>
                </ul>

                <h5 className="mt-4">Expected Behavior:</h5>
                <ul>
                  <li>Single lookup returns first matching date</li>
                  <li>Multiple lookup returns all matching dates</li>
                  <li>Handles Vriddhi cases (multiple occurrences)</li>
                  <li>Results are in IST timezone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocationProvider>
  );
}
