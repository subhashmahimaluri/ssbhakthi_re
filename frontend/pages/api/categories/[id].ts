import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Category ID is required' });
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

    if (req.method === 'PUT') {
      // Update category
      const hasEditAccess = userRoles.some(role => ['admin', 'editor'].includes(role));
      if (!hasEditAccess) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions. Editor or Admin role required.' });
      }

      const { name, slug, description, taxonomy, order, isActive } = req.body;

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

      // Update category via GraphQL
      const mutation = `
        mutation UpdateCategory($id: ID!, $input: CategoryInput!) {
          updateCategory(id: $id, input: $input) {
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
        id,
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
          error: 'Failed to update category',
          details: errorMessage,
        });
      }

      const category = actualData.data?.updateCategory;
      if (!category) {
        return res.status(404).json({ error: 'Category not found or update failed' });
      }

      console.log(
        `✅ [Update Category API] Updated category: ${category.name.en} (${category.id})`
      );

      res.json({
        success: true,
        category,
      });
    } else if (req.method === 'DELETE') {
      // Delete category
      const hasDeleteAccess = userRoles.includes('admin');
      if (!hasDeleteAccess) {
        return res.status(403).json({ error: 'Insufficient permissions. Admin role required.' });
      }

      // Delete category via GraphQL
      const mutation = `
        mutation DeleteCategory($id: ID!) {
          deleteCategory(id: $id)
        }
      `;

      const variables = { id };

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
          error: 'Failed to delete category',
          details: errorMessage,
        });
      }

      const deleted = actualData.data?.deleteCategory;
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found or deletion failed' });
      }

      console.log(`🗑️ [Delete Category API] Deleted category: ${id}`);

      res.json({
        success: true,
        deleted: true,
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`❌ [Category API] Error (${req.method}):`, error);
    res.status(500).json({
      error: `Failed to ${req.method === 'PUT' ? 'update' : 'delete'} category`,
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
