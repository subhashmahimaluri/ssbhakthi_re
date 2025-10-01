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

    // Build query parameters for backend
    const { locale = 'te', status, search, limit = '50', offset = '0' } = req.query;

    const params = new URLSearchParams();
    params.append('lang', locale as string);
    if (status) params.append('status', status as string);
    if (limit) params.append('limit', limit as string);
    if (offset) params.append('offset', offset as string);

    // For admin, we want to see all articles by default unless status is specified
    if (status && status !== 'all') {
      params.append('status', status as string);
    }

    const backendUrl = `${BACKEND_URL}/rest/articles?${params.toString()}`;

    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        ...(session.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to match the expected format
    const transformedArticles =
      data.articles?.map((article: any) => {
        const translation =
          article.translations[locale as string] || (Object.values(article.translations)[0] as any);

        return {
          id: article.canonicalSlug, // Use slug as ID for now
          title: translation?.title || 'Untitled',
          slug: article.canonicalSlug,
          summary: translation?.summary || '',
          status: article.status,
          locale: locale,
          publishedAt: article.createdAt,
          updatedAt: article.updatedAt,
          author: {
            id: 'unknown',
            name: 'Admin',
            email: session.user?.email || 'admin@example.com',
          },
          categories: article.categories || [],
          tags: [],
        };
      }) || [];

    res.json({
      articles: transformedArticles,
      pagination: data.pagination,
      meta: data.meta,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch articles',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
