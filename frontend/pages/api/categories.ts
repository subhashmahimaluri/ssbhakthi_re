import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔎 [Categories API] Starting request...');

  try {
    // Check authentication for admin access (with development bypass)
    const session = await getServerSession(req, res, authOptions);

    // Development environment bypass
    let effectiveSession = session;
    if (!session && process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: bypassing authentication for categories API');
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

    if (!effectiveSession) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = (effectiveSession.user?.roles as string[]) || [];
    const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

    if (!hasAdminAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Since there's no direct REST categories endpoint, we'll fetch from GraphQL
    const query = `
      query GetCategories {
        categories {
          items {
            id
            name {
              en
              te
            }
            slug {
              en
              te
            }
            meta
          }
        }
      }
    `;

    console.log('🔎 [Categories API] Making GraphQL request to:', `${BACKEND_URL}/graphql`);
    console.log('🔎 [Categories API] GraphQL query:', query.trim());

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(effectiveSession.accessToken &&
          effectiveSession.accessToken !== 'dev-token' && {
            Authorization: `Bearer ${effectiveSession.accessToken}`,
          }),
      },
      body: JSON.stringify({ query }),
    });

    console.log('🔎 [Categories API] GraphQL response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('😱 [Categories API] GraphQL error response:', errorText);
      throw new Error(`GraphQL responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('🔎 [Categories API] GraphQL response data:', JSON.stringify(data, null, 2));

    // Handle Apollo Server's nested response format
    const actualData = data.body?.singleResult || data;

    if (actualData.errors) {
      console.error('😱 [Categories API] GraphQL errors:', actualData.errors);
      throw new Error(actualData.errors[0]?.message || 'GraphQL error');
    }

    const categories = actualData.data?.categories?.items || [];
    console.log(`🔎 [Categories API] Retrieved ${categories.length} categories from GraphQL`);

    // Parse meta field if it's a string
    const parsedCategories = categories.map((cat: any) => {
      let parsedMeta = cat.meta;
      if (typeof cat.meta === 'string') {
        try {
          parsedMeta = JSON.parse(cat.meta);
        } catch (e) {
          console.warn('Failed to parse meta for category:', cat.id);
          parsedMeta = { taxonomy: 'unknown' };
        }
      }
      return {
        ...cat,
        meta: parsedMeta,
      };
    });

    console.log(
      `🔎 [Categories API] Parsed ${parsedCategories.length} categories, returning to client`
    );

    res.json({
      categories: parsedCategories,
      total: parsedCategories.length,
    });
  } catch (error) {
    console.error('😱 [Categories API] Error:', error);
    console.error('😱 [Categories API] Error stack:', (error as Error)?.stack);
    res.status(500).json({
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
