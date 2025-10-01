import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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

    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: 'Article slug is required' });
    }

    // Call backend API to delete article
    const backendUrl = `${BACKEND_URL}/rest/articles/${encodeURIComponent(slug)}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        ...(session.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `Backend responded with ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      message: data.message || 'Article deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete article',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
