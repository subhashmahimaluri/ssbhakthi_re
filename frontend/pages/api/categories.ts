import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication for admin access
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = (session.user?.roles as string[]) || [];
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

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error');
    }

    const categories = data.data?.categories?.items || [];

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

    res.json({
      categories: parsedCategories,
      total: parsedCategories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
