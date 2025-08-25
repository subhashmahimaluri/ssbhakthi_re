import { GetServerSideProps } from 'next';

interface ConfigCheckProps {
  config: {
    nextAuthUrl: boolean;
    nextAuthSecret: boolean;
    keycloakIssuer: boolean;
    keycloakClientId: boolean;
    keycloakClientSecret: boolean;
  };
}

export default function ConfigCheck({ config }: ConfigCheckProps) {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 NextAuth Configuration Check</h1>
      <p>This page helps you verify your NextAuth environment configuration.</p>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
        <h3>Environment Variables Status:</h3>
        <ul>
          <li>NEXTAUTH_URL: {config.nextAuthUrl ? '✅ Set' : '❌ Missing'}</li>
          <li>NEXTAUTH_SECRET: {config.nextAuthSecret ? '✅ Set' : '❌ Missing'}</li>
          <li>KEYCLOAK_ISSUER: {config.keycloakIssuer ? '✅ Set' : '❌ Missing'}</li>
          <li>KEYCLOAK_CLIENT_ID: {config.keycloakClientId ? '✅ Set' : '❌ Missing'}</li>
          <li>KEYCLOAK_CLIENT_SECRET: {config.keycloakClientSecret ? '✅ Set' : '❌ Missing'}</li>
        </ul>
      </div>

      {Object.values(config).every(Boolean) ? (
        <div
          style={{ background: '#d4edda', padding: '15px', borderRadius: '5px', marginTop: '20px' }}
        >
          <h3>✅ Configuration looks good!</h3>
          <p>
            All required environment variables are set. You can now try accessing the admin panel:
          </p>
          <ul>
            <li>
              <a href="/admin">Admin Panel</a>
            </li>
            <li>
              <a href="/api/auth/signin">Sign In</a>
            </li>
          </ul>
        </div>
      ) : (
        <div
          style={{ background: '#f8d7da', padding: '15px', borderRadius: '5px', marginTop: '20px' }}
        >
          <h3>❌ Configuration Issues</h3>
          <p>
            Please check your <code>.env.local</code> file and ensure all required environment
            variables are set.
          </p>
          <p>Make sure you have:</p>
          <ol>
            <li>
              Created a <code>.env.local</code> file in your project root
            </li>
            <li>Added all the required NextAuth and Keycloak configuration</li>
            <li>Restarted your development server after adding environment variables</li>
          </ol>
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p>
          <strong>Note:</strong> This page is for development only. Remove it in production.
        </p>
        <p>If you're still having issues, check the server console for detailed error messages.</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      config: {
        nextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        keycloakIssuer: !!process.env.KEYCLOAK_ISSUER,
        keycloakClientId: !!process.env.KEYCLOAK_CLIENT_ID,
        keycloakClientSecret: !!process.env.KEYCLOAK_CLIENT_SECRET,
      },
    },
  };
};
