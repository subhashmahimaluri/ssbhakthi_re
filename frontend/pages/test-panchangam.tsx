import { useState } from 'react';
import PanchangamTable from '../components/PanchangamTable';
import { LocationProvider } from '../context/LocationContext';

export default function TestPanchangam() {
  const [selectedDate, setSelectedDate] = useState('2025-01-02');

  const testDates = [
    '2025-01-02', // Current date
    '2025-01-15', // Pournami (full moon)
    '2025-01-29', // Amavasya (new moon)
    '2025-02-13', // Mid month
  ];

  return (
    <LocationProvider>
      <div className="container mt-4">
        <h1 className="mb-4">Enhanced Panchangam Table Test</h1>
        <p className="mb-3">
          This test page demonstrates the enhanced PanchangamTable component with Telugu Panchangam
          rules for tithi display:
        </p>
        <ul className="mb-4">
          <li>
            <strong>Main tithi:</strong> The one present at sunrise
          </li>
          <li>
            <strong>[Tithi Vriddhi]:</strong> Tithi spans across two consecutive sunrises
          </li>
          <li>
            <strong>[Tithi Kshaya]:</strong> Tithi begins and ends between two sunrises
          </li>
          <li>
            <strong>Multiple tithis:</strong> Displayed when overlapping occurs
          </li>
        </ul>

        <div className="mb-4">
          <label htmlFor="dateSelect" className="form-label">
            Select Test Date:
          </label>
          <select
            id="dateSelect"
            className="form-select"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          >
            {testDates.map(date => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <div className="col-12">
            <PanchangamTable date={selectedDate} />
          </div>
        </div>

        <div className="mt-5">
          <h3>Expected Behavior:</h3>
          <ul>
            <li>
              You should see multiple entries for Tithi, Nakshatra, Yoga, and Karana if they overlap
              during the day
            </li>
            <li>Tags like [Vriddhi] or [Kshaya] should appear when applicable for any anga type</li>
            <li>Each anga should show its start and end times with dates</li>
            <li>The format should be like: "Dasami - Jan 02 02:43 AM – Jan 03 03:53 AM"</li>
            <li>The anga present at sunrise is always the main one for that day</li>
          </ul>
        </div>
      </div>
    </LocationProvider>
  );
}
