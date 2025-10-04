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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);

    // Development environment bypass
    let effectiveSession = session;
    if (!session && process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: bypassing authentication for stotra creation API');
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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check permissions
    const userRoles = (effectiveSession.user?.roles as string[]) || [];
    const hasPermission = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const stotraData: StotraData = req.body;

    console.log('📹 Debug: Received stotra data:', {
      title: stotraData.title,
      videoId: stotraData.videoId,
      locale: stotraData.locale,
      videoIdType: typeof stotraData.videoId,
    });

    // Validate required fields
    if (!stotraData.title || !stotraData.stotra || !stotraData.locale) {
      return res.status(400).json({
        error: 'Missing required fields: title, stotra, and locale are required',
      });
    }

    // Use provided canonicalSlug or generate one from title
    const canonicalSlug =
      stotraData.canonicalSlug ||
      stotraData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim() +
        '-' +
        Date.now();

    // Helper function to validate and filter category IDs (backend will handle ObjectId conversion)
    const validateCategoryIds = (ids: string[] | undefined): string[] => {
      if (!ids || !Array.isArray(ids)) return [];
      return ids.filter(id => typeof id === 'string' && id.length === 24); // Basic ObjectId validation
    };

    // Prepare the data structure for the backend API
    const backendData = {
      contentType: 'stotra',
      canonicalSlug,
      stotraTitle: stotraData.stotraTitle || null,
      status: stotraData.status || 'draft',
      imageUrl: stotraData.featuredImage || null, // Keep backwards compatibility
      categories: {
        typeIds: validateCategoryIds(stotraData.categoryIds),
        devaIds: validateCategoryIds(stotraData.devaIds),
        byNumberIds: validateCategoryIds(stotraData.byNumberIds),
      },
      translations: {
        [stotraData.locale]: {
          title: stotraData.title,
          seoTitle: stotraData.seoTitle || null,
          seoDescription: stotraData.seoDescription || null,
          seoKeywords: stotraData.seoKeywords || null,
          summary: null, // Required field for schema validation
          videoId: stotraData.videoId || null,
          imageUrl: stotraData.imageUrl || null, // Translation-level image URL
          stotra: stotraData.stotra,
          stotraMeaning: stotraData.stotraMeaning || null,
          body: null, // Stotras don't use body field but required for schema
        },
      },
    };

    console.log('Creating stotra with data:', JSON.stringify(backendData, null, 2));

    // Prepare headers with authentication for development
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add development authentication token
    if (process.env.NODE_ENV === 'development') {
      headers['Authorization'] = 'Bearer dev-token';
    }

    // Call backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/rest/stotras`, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Backend error:', responseData);
      return res.status(response.status).json(responseData);
    }

    console.log('Stotra created successfully:', responseData);

    res.status(201).json({
      success: true,
      stotra: responseData.stotra,
      message: 'Stotra created successfully',
    });
  } catch (error) {
    console.error('Error creating stotra:', error);
    res.status(500).json({
      error: 'Failed to create stotra',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
