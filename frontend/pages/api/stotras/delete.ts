import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check permissions - only admin can delete
    const userRoles = (session.user?.roles as string[]) || [];
    const hasDeletePermission = userRoles.includes('admin');

    if (!hasDeletePermission) {
      return res.status(403).json({
        error: 'Insufficient permissions. Only admins can delete stotras.',
      });
    }

    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Stotra slug is required' });
    }

    // Call backend API to delete stotra
    const response = await fetch(`http://localhost:4000/rest/stotras/${slug}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error deleting stotra:', error);
    res.status(500).json({ error: 'Failed to delete stotra' });
  }
}
