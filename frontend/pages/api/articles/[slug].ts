import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// Helper function to get effective session (with dev bypass)
async function getEffectiveSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Development bypass - if no session in development, create a mock one
  if (!session && process.env.NODE_ENV === 'development') {
    console.log('⚠️  Development mode: Creating mock session for testing');
    return {
      user: {
        id: 'dev-user',
        name: 'Development User',
        email: 'dev@example.com',
        roles: ['admin', 'editor', 'author'],
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as any;
  }

  return session;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (req.method === 'GET') {
    try {
      // Check authentication for admin access
      const effectiveSession = await getEffectiveSession(req, res);

      if (!effectiveSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRoles = (effectiveSession.user?.roles as string[]) || [];
      const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

      if (!hasAdminAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { locale = 'te' } = req.query;

      const backendUrl = `${BACKEND_URL}/rest/articles/${slug}?lang=${locale}`;

      console.log('🔗 Fetching article from backend:', backendUrl);

      const response = await fetch(backendUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveSession.accessToken && {
            Authorization: `Bearer ${effectiveSession.accessToken}`,
          }),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: 'Article not found' });
        }
        throw new Error(`Backend responded with ${response.status}`);
      }

      const article = await response.json();

      // Transform backend data to frontend format
      const translation =
        article.translations[locale as string] || (Object.values(article.translations)[0] as any);

      const transformedArticle = {
        id: article.canonicalSlug,
        title: translation?.title || 'Untitled',
        slug: article.canonicalSlug,
        summary: translation?.summary || '',
        body: translation?.body || '',
        status: article.status,
        locale: locale,
        seoTitle: translation?.seoTitle || '',
        seoDescription: '',
        seoKeywords: '',
        featuredImage: article.imageUrl || '',
        categories: article.categories || { typeIds: [], devaIds: [], byNumberIds: [] },
        tags: [],
        publishedAt: article.createdAt,
        updatedAt: article.updatedAt,
      };

      res.json(transformedArticle);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({
        error: 'Failed to fetch article',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Check authentication for admin access
      const effectiveSession = await getEffectiveSession(req, res);

      if (!effectiveSession) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRoles = (effectiveSession.user?.roles as string[]) || [];
      const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

      if (!hasAdminAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const articleData = req.body;

      // Validate required fields
      if (!articleData.title || !articleData.body || !articleData.locale) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'title, body, and locale are required',
        });
      }

      // Transform frontend data to backend format
      const backendData = {
        contentType: 'article',
        canonicalSlug: slug,
        status: articleData.status || 'draft',
        imageUrl: articleData.featuredImage || null,
        categories: {
          typeIds: articleData.categoryIds || [],
          devaIds: [],
          byNumberIds: [],
        },
        translations: {
          [articleData.locale]: {
            title: articleData.title,
            seoTitle: articleData.seoTitle || null,
            videoId: null,
            stotra: null,
            stotraMeaning: null,
            body: articleData.body,
          },
        },
      };

      console.log('🔗 Updating article in backend:', `${BACKEND_URL}/rest/articles/${slug}`);
      console.log('📄 Article data:', JSON.stringify(backendData, null, 2));

      const response = await fetch(`${BACKEND_URL}/rest/articles/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveSession.accessToken && {
            Authorization: `Bearer ${effectiveSession.accessToken}`,
          }),
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const updatedArticle = await response.json();

      res.json({
        success: true,
        article: updatedArticle,
        message: 'Article updated successfully',
      });
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({
        error: 'Failed to update article',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
