import { useEffect, useState } from 'react';
import { VRATH_DATA } from '../lib/vrathData';

export default function TestVrathData() {
  const [vrathCount, setVrathCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('VRATH_DATA:', VRATH_DATA);
      setVrathCount(VRATH_DATA.length);
    } catch (err) {
      console.error('Error loading vrath data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Vrath Data Import</h1>
      {error ? (
        <div style={{ color: 'red' }}>
          <p>Error: {error}</p>
        </div>
      ) : (
        <div>
          <p>Successfully loaded {vrathCount} vrath entries.</p>
          <h3>Sample Vrath Data:</h3>
          <ul>
            {VRATH_DATA.slice(0, 5).map(vrath => (
              <li key={vrath.id}>
                <strong>{vrath.nameEnglish}</strong> ({vrath.nameTelugu}) - {vrath.category}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
