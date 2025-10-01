import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);

    // Development environment bypass
    let effectiveSession = session;
    if (!session && process.env.NODE_ENV === 'development') {
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
    const hasCreateAccess = userRoles.some(role => ['admin', 'editor'].includes(role));

    if (!hasCreateAccess) {
      return res
        .status(403)
        .json({ error: 'Insufficient permissions. Editor or Admin role required.' });
    }

    const { name, slug, description, taxonomy, order, isActive = true } = req.body;

    // Validate required fields
    if (!name || !name.en || !slug || !slug.en || !taxonomy) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'name.en, slug.en, and taxonomy are required',
      });
    }

    // Validate taxonomy
    const validTaxonomies = ['type', 'deva', 'by-number'];
    if (!validTaxonomies.includes(taxonomy)) {
      return res.status(400).json({
        error: 'Invalid taxonomy',
        details: `Taxonomy must be one of: ${validTaxonomies.join(', ')}`,
      });
    }

    // Create category via GraphQL
    const mutation = `
      mutation CreateCategory($input: CategoryInput!) {
        createCategory(input: $input) {
          id
          name {
            en
            te
          }
          slug {
            en
            te
          }
          description {
            en
            te
          }
          order
          isActive
          meta
          createdAt
          updatedAt
        }
      }
    `;

    const variables = {
      input: {
        name,
        slug,
        description: description || undefined,
        order: order || 0,
        meta: {
          taxonomy,
          kind: 'category',
        },
      },
    };

    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(effectiveSession.accessToken &&
          effectiveSession.accessToken !== 'dev-token' && {
            Authorization: `Bearer ${effectiveSession.accessToken}`,
          }),
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GraphQL responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const actualData = data.body?.singleResult || data;

    if (actualData.errors) {
      const errorMessage = actualData.errors[0]?.message || 'GraphQL error';
      return res.status(400).json({
        error: 'Failed to create category',
        details: errorMessage,
      });
    }

    const category = actualData.data?.createCategory;
    if (!category) {
      return res.status(500).json({ error: 'Category creation failed' });
    }

    console.log(`✅ [Create Category API] Created category: ${category.name.en} (${category.id})`);

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('❌ [Create Category API] Error:', error);
    res.status(500).json({
      error: 'Failed to create category',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
