import { GetServerSideProps } from 'next';
import { useState } from 'react';

interface DebugKeycloakProps {
  keycloakConfig: {
    issuer: string;
    clientId: string;
    hasClientSecret: boolean;
    wellKnownUrl: string;
  };
  wellKnownCheck: {
    accessible: boolean;
    error?: string;
    data?: any;
  };
}

export default function DebugKeycloak({ keycloakConfig, wellKnownCheck }: DebugKeycloakProps) {
  const [testResult, setTestResult] = useState<string>('');

  const testKeycloakConnection = async () => {
    setTestResult('Testing...');
    try {
      const response = await fetch(keycloakConfig.wellKnownUrl);
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Connection successful!\nEndpoints found: ${Object.keys(data).length}`);
      } else {
        setTestResult(`❌ HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px' }}>
      <h1>🔍 Keycloak Debug Information</h1>

      <div
        style={{
          background: '#f5f5f5',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
        }}
      >
        <h3>Current Configuration:</h3>
        <ul>
          <li>
            <strong>Issuer:</strong> {keycloakConfig.issuer}
          </li>
          <li>
            <strong>Client ID:</strong> {keycloakConfig.clientId}
          </li>
          <li>
            <strong>Client Secret:</strong>{' '}
            {keycloakConfig.hasClientSecret ? '✅ Set' : '❌ Missing'}
          </li>
          <li>
            <strong>Well-known URL:</strong> {keycloakConfig.wellKnownUrl}
          </li>
        </ul>
      </div>

      <div
        style={{
          background: wellKnownCheck.accessible ? '#d4edda' : '#f8d7da',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
        }}
      >
        <h3>Well-known Endpoint Check:</h3>
        {wellKnownCheck.accessible ? (
          <div>
            <p>✅ Keycloak well-known endpoint is accessible</p>
            <details>
              <summary>Available endpoints:</summary>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(wellKnownCheck.data, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div>
            <p>❌ Cannot access Keycloak well-known endpoint</p>
            <p>
              <strong>Error:</strong> {wellKnownCheck.error}
            </p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testKeycloakConnection}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Test Connection
        </button>
        {testResult && (
          <pre
            style={{
              marginTop: '10px',
              padding: '10px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
            }}
          >
            {testResult}
          </pre>
        )}
      </div>

      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '5px' }}>
        <h3>⚠️ Required Keycloak Client Configuration:</h3>
        <p>Make sure your Keycloak client has these settings:</p>
        <ul>
          <li>
            <strong>Client ID:</strong> admin-app
          </li>
          <li>
            <strong>Client Protocol:</strong> openid-connect
          </li>
          <li>
            <strong>Access Type:</strong> confidential
          </li>
          <li>
            <strong>Standard Flow Enabled:</strong> ON
          </li>
          <li>
            <strong>Valid Redirect URIs:</strong> http://localhost:3000/api/auth/callback/keycloak
          </li>
          <li>
            <strong>Web Origins:</strong> http://localhost:3000
          </li>
          <li>
            <strong>Root URL:</strong> http://localhost:3000
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>
          <strong>Next Steps:</strong>
        </p>
        <ol>
          <li>Ensure Keycloak is running on localhost:8080</li>
          <li>Create/configure the "admin-app" client in Keycloak</li>
          <li>Copy the client secret to your .env.local file</li>
          <li>Restart your Next.js development server</li>
          <li>Try authentication again</li>
        </ol>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const keycloakIssuer = process.env.KEYCLOAK_ISSUER || '';
  const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID || '';
  const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET || '';

  const wellKnownUrl = `${keycloakIssuer}/.well-known/openid-configuration`;

  let wellKnownCheck = {
    accessible: false,
    error: '',
    data: null,
  };

  try {
    const response = await fetch(wellKnownUrl, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      wellKnownCheck = {
        accessible: true,
        error: '',
        data: data,
      };
    } else {
      wellKnownCheck.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    wellKnownCheck.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return {
    props: {
      keycloakConfig: {
        issuer: keycloakIssuer,
        clientId: keycloakClientId,
        hasClientSecret:
          !!keycloakClientSecret &&
          keycloakClientSecret !== 'your-keycloak-client-secret' &&
          keycloakClientSecret !== 'replace-with-actual-client-secret',
        wellKnownUrl,
      },
      wellKnownCheck,
    },
  };
};
