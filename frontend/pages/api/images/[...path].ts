import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path } = req.query;

    if (!path || !Array.isArray(path)) {
      return res.status(400).json({ error: 'Invalid image path' });
    }

    // Construct the backend image URL
    const imagePath = path.join('/');
    const backendImageUrl = `${BACKEND_URL}/images/${imagePath}`;

    // Fetch the image from backend
    const imageResponse = await fetch(backendImageUrl);

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({
        error: 'Image not found',
        backendUrl: backendImageUrl,
      });
    }

    // Get the image buffer and content type
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.setHeader('Content-Length', imageBuffer.byteLength);

    // Send the image
    res.status(200).send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
