import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 [Debug Auth] Starting debug check...');

    // Check all environment variables and request info
    const debugInfo = {
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
        cookie: req.headers.cookie ? 'Present' : 'Missing',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Present' : 'Missing',
        keycloakIssuer: process.env.KEYCLOAK_ISSUER ? 'Present' : 'Missing',
      },
    };

    console.log('🔍 [Debug Auth] Request info:', debugInfo);

    // Check session
    const session = await getServerSession(req, res, authOptions);

    console.log('🔍 [Debug Auth] Session result:', {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            roles: session.user.roles,
          }
        : null,
      accessToken: session?.accessToken ? 'Present' : 'Missing',
    });

    // Test development bypass logic
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV !== 'production' ||
      !process.env.NODE_ENV ||
      process.env.NEXTAUTH_URL?.includes('localhost') ||
      req.headers.host?.includes('localhost');

    console.log('🔍 [Debug Auth] Development bypass check:', {
      nodeEnvDev: process.env.NODE_ENV === 'development',
      nodeEnvNotProd: process.env.NODE_ENV !== 'production',
      nodeEnvEmpty: !process.env.NODE_ENV,
      nextAuthLocalhost: process.env.NEXTAUTH_URL?.includes('localhost'),
      hostLocalhost: req.headers.host?.includes('localhost'),
      finalIsDevelopment: isDevelopment,
    });

    // Simulate the bypass logic
    let effectiveSession = session;
    if (!session && isDevelopment) {
      console.log('🔍 [Debug Auth] Would use development bypass');
      effectiveSession = {
        user: {
          id: 'dev-user',
          email: 'dev@example.com',
          name: 'Development User',
          roles: ['admin'],
        },
        accessToken: 'dev-token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    return res.json({
      success: true,
      debug: debugInfo,
      session: {
        hasOriginalSession: !!session,
        hasEffectiveSession: !!effectiveSession,
        wouldBypass: !session && isDevelopment,
      },
      checks: {
        isDevelopment,
        nodeEnv: process.env.NODE_ENV,
        host: req.headers.host,
      },
    });
  } catch (error) {
    console.error('🔍 [Debug Auth] Error:', error);
    return res.status(500).json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
