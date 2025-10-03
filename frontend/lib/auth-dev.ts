import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';

export interface DevSession {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
  accessToken: string;
  expires: string;
}

export function isDevelopmentMode(): boolean {
  // Be aggressive about development mode detection
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV !== 'production' ||
    !process.env.NODE_ENV ||
    process.env.NEXTAUTH_URL?.includes('localhost') ||
    process.env.KEYCLOAK_CLIENT_SECRET === 'your_keycloak_client_secret' ||
    !process.env.KEYCLOAK_CLIENT_SECRET
  );
}

export function createDevSession(): DevSession {
  return {
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

export async function getAuthSession(
  req: NextApiRequest | GetServerSidePropsContext['req'],
  res: NextApiResponse | GetServerSidePropsContext['res']
) {
  // In development mode, provide a mock session immediately if no proper Keycloak config
  if (isDevelopmentMode()) {
    console.log('🚀 [Auth Dev] Using development bypass for authentication (pre-check)');
    return createDevSession();
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (session) {
      return session;
    }

    return null;
  } catch (error) {
    console.error('❌ [Auth Dev] Error getting session:', error);
    return null;
  }
}
