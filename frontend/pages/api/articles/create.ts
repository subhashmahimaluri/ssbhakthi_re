import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Generate canonical slug
    const canonicalSlug = articleData.slug || generateSlug(articleData.title);

    // Transform frontend data to backend format
    const backendData = {
      contentType: 'article',
      canonicalSlug,
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

    console.log('🔗 Creating article in backend:', BACKEND_URL);
    console.log('📄 Article data:', JSON.stringify(backendData, null, 2));

    const response = await fetch(`${BACKEND_URL}/rest/articles`, {
      method: 'POST',
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

    const createdArticle = await response.json();

    res.json({
      success: true,
      article: createdArticle,
      message: 'Article created successfully',
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      error: 'Failed to create article',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
