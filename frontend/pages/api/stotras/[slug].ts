import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

interface StotraData {
  title: string;
  slug?: string;
  stotra: string;
  stotraMeaning?: string;
  status: 'draft' | 'published' | 'scheduled';
  locale: string;
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImage?: string;
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
      const response = await fetch(`http://localhost:4000/rest/stotras/${slug}?lang=${locale}`);

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
        status: stotraData.status,
        imageUrl: stotraData.imageUrl,
        categories: stotraData.categories,
        // Extract the current language translation
        title: stotraData.translations[locale as string]?.title || '',
        slug: stotraData.translations[locale as string]?.slug || '',
        stotra: stotraData.translations[locale as string]?.stotra || '',
        stotraMeaning: stotraData.translations[locale as string]?.stotraMeaning || '',
        seoTitle: stotraData.translations[locale as string]?.seoTitle || '',
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

      if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userRoles = (session.user?.roles as string[]) || [];
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
        canonicalSlug: slug,
        status: stotraData.status || 'draft',
        imageUrl: stotraData.featuredImage || null,
        categories: {
          typeIds: stotraData.categoryIds || [],
          devaIds: stotraData.devaIds || [],
          byNumberIds: stotraData.byNumberIds || [],
        },
        translations: {
          [stotraData.locale]: {
            title: stotraData.title,
            seoTitle: stotraData.seoTitle || null,
            videoId: null,
            stotra: stotraData.stotra,
            stotraMeaning: stotraData.stotraMeaning || null,
            body: null, // Stotras don't use body field
          },
        },
      };

      console.log('Updating stotra with data:', JSON.stringify(backendData, null, 2));

      // Call backend API
      const response = await fetch(`http://localhost:4000/rest/stotras/${slug}`, {
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
