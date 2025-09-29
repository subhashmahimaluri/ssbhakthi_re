import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Forward request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Build query string from request parameters
    const queryParams = new URLSearchParams();

    if (req.query.lang) queryParams.set('lang', req.query.lang as string);
    if (req.query.limit) queryParams.set('limit', req.query.limit as string);
    if (req.query.offset) queryParams.set('offset', req.query.offset as string);
    if (req.query.status) queryParams.set('status', req.query.status as string);
    if (req.query.search) queryParams.set('search', req.query.search as string);

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

    // Check if this is an admin request (from admin pages)
    const isAdminRequest = req.headers.referer?.includes('/admin/') || req.query.admin === 'true';
    if (isAdminRequest) {
      headers['x-admin-access'] = 'true';
      console.log('🔒 Admin request detected - including all statuses');
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
