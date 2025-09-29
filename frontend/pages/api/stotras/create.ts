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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check permissions
    const userRoles = (session.user?.roles as string[]) || [];
    const hasPermission = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const stotraData: StotraData = req.body;

    // Validate required fields
    if (!stotraData.title || !stotraData.stotra || !stotraData.locale) {
      return res.status(400).json({
        error: 'Missing required fields: title, stotra, and locale are required',
      });
    }

    // Generate slug if not provided
    const slug =
      stotraData.slug ||
      stotraData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();

    // Generate canonical slug (unique identifier)
    const canonicalSlug = `${slug}-${Date.now()}`;

    // Prepare the data structure for the backend API
    const backendData = {
      contentType: 'stotra',
      canonicalSlug,
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

    console.log('Creating stotra with data:', JSON.stringify(backendData, null, 2));

    // Call backend API
    const response = await fetch('http://localhost:4000/rest/stotras', {
      method: 'POST',
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
