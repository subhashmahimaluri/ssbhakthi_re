import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Public route - get stotras
    try {
      const { lang = 'en', limit = '50', offset = '0', status = 'published' } = req.query;

      // For admin requests, get all statuses unless explicitly filtered
      const session = await getServerSession(req, res, authOptions);
      const userRoles = (session?.user?.roles as string[]) || [];
      const isAdmin = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

      let finalStatus = status;
      if (isAdmin && !status) {
        finalStatus = 'all'; // Show all statuses for admin
      }

      const apiUrl = `http://localhost:4000/rest/stotras?lang=${lang}&limit=${limit}&offset=${offset}&status=${finalStatus}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching stotras:', error);
      res.status(500).json({ error: 'Failed to fetch stotras' });
    }
  } else if (req.method === 'POST') {
    // Protected route - create stotra
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userRoles = (session.user?.roles as string[]) || [];
      const hasPermission = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const response = await fetch('http://localhost:4000/rest/stotras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating stotra:', error);
      res.status(500).json({ error: 'Failed to create stotra' });
    }
  } else if (req.method === 'PUT') {
    // Protected route - update stotra
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userRoles = (session.user?.roles as string[]) || [];
      const hasPermission = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { slug } = req.query;

      const response = await fetch(`http://localhost:4000/rest/stotras/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error updating stotra:', error);
      res.status(500).json({ error: 'Failed to update stotra' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
