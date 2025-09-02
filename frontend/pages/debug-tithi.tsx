import { useState } from 'react';
import { LocationProvider } from '../context/LocationContext';
import { YexaaPanchang } from '../lib/panchangam';

export default function TithiDebugger() {
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [running, setRunning] = useState(false);

  const runDebugTest = () => {
    setRunning(true);
    setDebugOutput('');

    // Capture console.log output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(
        args
          .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
          .join(' ')
      );
      originalLog(...args);
    };

    try {
      const panchang = new YexaaPanchang();

      // Test the exact case: 2025, Chaitra, Shukla Paksha, Padyami
      console.log('=== Testing Chaitra Shukla Padyami 2025 ===');

      // First, let's see all Chaitra occurrences in 2025
      console.log('\n=== All Chaitra masa occurrences in 2025 ===');
      const chaitraOccurrences = panchang.debugFindTithiOccurrences(
        2025,
        'Chaitra',
        '', // Empty to get all paksha
        '', // Empty to get all tithi
        17.385,
        78.4867
      );

      // Look specifically for Shukla Paksha Padyami in Chaitra
      console.log('\n=== Looking for Shukla Paksha Padyami in Chaitra 2025 ===');
      const padyamiInChaitra = chaitraOccurrences.filter(item => {
        const normalizedPaksha = item.paksha.toLowerCase().replace(/\s+/g, '_');
        const normalizedTithi = item.tithi.toLowerCase();
        return normalizedPaksha.includes('shukla') && normalizedTithi === 'padyami';
      });

      console.log(`Found ${padyamiInChaitra.length} Chaitra Shukla Padyami occurrences:`);
      padyamiInChaitra.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ${item.date.toDateString()}: ${item.masa} ${item.paksha} ${item.tithi}`
        );
      });

      // Now test the original search method
      console.log('\n=== Testing original findAllDatesByTithi method ===');
      const result = panchang.findAllDatesByTithi(
        2025,
        'Chaitra',
        'Shukla Paksha',
        'Padyami',
        17.385, // Hyderabad lat
        78.4867, // Hyderabad lng
        true // Enable debug
      );

      console.log('\n=== Final Result ===');
      console.log('Found dates:', result.length);
      result.forEach((date, index) => {
        console.log(`${index + 1}. ${date.toDateString()} (${date.toISOString()})`);
      });

      // Test some successful cases for comparison
      console.log('\n=== Testing successful cases for comparison ===');

      console.log('\n--- Chaitra Shukla Vidhiya 2025 (should work) ---');
      const vidhiyaResult = panchang.findAllDatesByTithi(
        2025,
        'Chaitra',
        'Shukla Paksha',
        'Vidhiya',
        17.385,
        78.4867,
        false // Disable debug for cleaner output
      );
      console.log(`Found ${vidhiyaResult.length} dates:`);
      vidhiyaResult.forEach((date, index) => {
        console.log(`  ${index + 1}. ${date.toDateString()}`);
      });
    } catch (error) {
      console.log('ERROR:', error instanceof Error ? error.message : String(error));
    } finally {
      // Restore original console.log
      console.log = originalLog;
      setDebugOutput(logs.join('\\n'));
      setRunning(false);
    }
  };

  return (
    <LocationProvider>
      <div className="container mt-4">
        <h1 className="mb-4">Tithi Lookup Debugger</h1>
        <p className="mb-3">
          This page helps debug the specific issue: <strong>Chaitra Shukla Padyami 2025</strong>{' '}
          returning no results.
        </p>

        <div className="row">
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-header">
                <h3>Debug Test</h3>
              </div>
              <div className="card-body">
                <button className="btn btn-primary mb-3" onClick={runDebugTest} disabled={running}>
                  {running
                    ? 'Running Debug Test...'
                    : 'Run Debug Test for Chaitra Shukla Padyami 2025'}
                </button>

                {debugOutput && (
                  <div>
                    <h5>Debug Output:</h5>
                    <pre
                      className="bg-light p-3"
                      style={{ fontSize: '12px', maxHeight: '600px', overflow: 'auto' }}
                    >
                      {debugOutput}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3>What to Look For in Debug Output</h3>
              </div>
              <div className="card-body">
                <ul>
                  <li>
                    <strong>Normalized Values:</strong> Check if inputs are being normalized
                    correctly
                  </li>
                  <li>
                    <strong>Search Range:</strong> Verify Chaitra date range is appropriate (Mar-May
                    2025)
                  </li>
                  <li>
                    <strong>Matching Details:</strong> See which condition (masa/paksha/tithi) is
                    failing
                  </li>
                  <li>
                    <strong>Sample Dates:</strong> Manual verification of what panchangam data shows
                    for sample dates
                  </li>
                  <li>
                    <strong>Common Issues:</strong>
                    <ul>
                      <li>Masa name mismatch (e.g., 'chaitra' vs actual masa returned)</li>
                      <li>Paksha format issues ('shukla_paksha' vs actual paksha returned)</li>
                      <li>Tithi name variations ('padyami' vs actual tithi returned)</li>
                      <li>Date range too narrow for Chaitra masa</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocationProvider>
  );
}
