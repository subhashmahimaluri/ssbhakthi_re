import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

interface StotraData {
  title: string;
  stotraTitle?: string;
  canonicalSlug?: string;
  stotra: string;
  stotraMeaning?: string;
  videoId?: string;
  imageUrl?: string; // Translation-level image URL
  status: 'draft' | 'published' | 'scheduled';
  locale: string;
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImage?: string; // Main content level image (deprecated, use imageUrl instead)
  categoryIds?: string[];
  devaIds?: string[];
  byNumberIds?: string[];
  tagIds?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Stotra slug is required' });
  }

  if (req.method === 'GET') {
    try {
      const { locale = 'en' } = req.query;

      // Call backend API to get stotra
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/rest/stotras/${slug}?lang=${locale}`);

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: 'Stotra not found' });
        }
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      const stotraData = await response.json();

      // Transform the backend response to match frontend expectations
      const transformedStotra = {
        canonicalSlug: stotraData.canonicalSlug,
        contentType: stotraData.contentType,
        stotraTitle: stotraData.stotraTitle,
        status: stotraData.status,
        imageUrl: stotraData.translations[locale as string]?.imageUrl || stotraData.imageUrl, // Prioritize translation-level imageUrl
        categories: stotraData.categories,
        // Extract the current language translation
        title: stotraData.translations[locale as string]?.title || '',
        stotra: stotraData.translations[locale as string]?.stotra || '',
        stotraMeaning: stotraData.translations[locale as string]?.stotraMeaning || '',
        videoId: stotraData.translations[locale as string]?.videoId || '',
        seoTitle: stotraData.translations[locale as string]?.seoTitle || '',
        seoDescription: stotraData.translations[locale as string]?.seoDescription || '',
        seoKeywords: stotraData.translations[locale as string]?.seoKeywords || '',
        createdAt: stotraData.createdAt,
        updatedAt: stotraData.updatedAt,
      };

      res.status(200).json(transformedStotra);
    } catch (error) {
      console.error('Error fetching stotra:', error);
      res.status(500).json({
        error: 'Failed to fetch stotra',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else if (req.method === 'PUT') {
    try {
      // Check authentication for admin access
      const session = await getServerSession(req, res, authOptions);

      // Development environment bypass
      let effectiveSession = session;
      if (!session && process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: bypassing authentication for stotra update API');
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

      const stotraData: StotraData = req.body;

      // Validate required fields
      if (!stotraData.title || !stotraData.stotra || !stotraData.locale) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'title, stotra, and locale are required',
        });
      }

      // Transform frontend data to backend format
      const backendData = {
        contentType: 'stotra',
        canonicalSlug: stotraData.canonicalSlug || slug, // Use provided canonicalSlug or fallback to slug param
        stotraTitle: stotraData.stotraTitle || null,
        status: stotraData.status || 'draft',
        imageUrl: stotraData.featuredImage || null, // Keep backwards compatibility
        categories: {
          typeIds: stotraData.categoryIds || [],
          devaIds: stotraData.devaIds || [],
          byNumberIds: stotraData.byNumberIds || [],
        },
        translations: {
          [stotraData.locale]: {
            title: stotraData.title,
            seoTitle: stotraData.seoTitle || null,
            seoDescription: stotraData.seoDescription || null,
            seoKeywords: stotraData.seoKeywords || null,
            videoId: stotraData.videoId || null,
            imageUrl: stotraData.imageUrl || null, // Translation-level image URL
            stotra: stotraData.stotra,
            stotraMeaning: stotraData.stotraMeaning || null,
            body: null, // Stotras don't use body field
          },
        },
      };

      console.log('Updating stotra with data:', JSON.stringify(backendData, null, 2));

      // Call backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/rest/stotras/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Backend error:', responseData);
        return res.status(response.status).json(responseData);
      }

      console.log('Stotra updated successfully:', responseData);

      res.status(200).json({
        success: true,
        stotra: responseData.stotra,
        message: 'Stotra updated successfully',
      });
    } catch (error) {
      console.error('Error updating stotra:', error);
      res.status(500).json({
        error: 'Failed to update stotra',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
