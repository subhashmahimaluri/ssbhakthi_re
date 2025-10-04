import { getAuthSession } from '@/lib/auth-dev';
import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication using our dev-friendly helper
    const effectiveSession = await getAuthSession(req, res);

    console.log('🔐 [Create Category API] Session check:', {
      hasSession: !!effectiveSession,
      nodeEnv: process.env.NODE_ENV,
      sessionUser: effectiveSession?.user?.email,
      sessionRoles: effectiveSession?.user?.roles,
    });

    if (!effectiveSession) {
      console.log('❌ [Create Category API] No session found, authentication required');
      return res.status(401).json({
        error: 'Authentication required',
        debug: {
          nodeEnv: process.env.NODE_ENV,
          host: req.headers.host,
          nextAuthUrl: process.env.NEXTAUTH_URL,
        },
      });
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

    console.log('🚀 [Create Category API] GraphQL response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Create Category API] GraphQL error response:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
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
