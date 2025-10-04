import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';

    // Build query string from request parameters
    const queryParams = new URLSearchParams();

    if (req.query.lang) queryParams.set('lang', req.query.lang as string);
    if (req.query.limit) queryParams.set('limit', req.query.limit as string);
    if (req.query.offset) queryParams.set('offset', req.query.offset as string);
    if (req.query.status) queryParams.set('status', req.query.status as string);
    if (req.query.search) queryParams.set('search', req.query.search as string);
    if (req.query.categoryId) queryParams.set('categoryId', req.query.categoryId as string);
    if (req.query.page) queryParams.set('page', req.query.page as string);

    const url = `${backendUrl}/rest/stotras?${queryParams.toString()}`;

    console.log('📋 Forwarding stotras list request to:', url);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add development auth header if in development mode
    if (process.env.NODE_ENV === 'development') {
      headers['Authorization'] = 'Bearer dev-token';
    }

    // Forward admin access header from frontend
    if (req.headers['x-admin-access']) {
      headers['x-admin-access'] = req.headers['x-admin-access'] as string;
      console.log('🔒 Admin access header forwarded to backend:', req.headers['x-admin-access']);
    } else {
      console.log('⚠️ No admin access header found in request');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', response.status, errorData);
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched stotras:', data.pagination);

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching stotras:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch stotras',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
