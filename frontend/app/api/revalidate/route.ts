import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check for the secret header
    const authorizationHeader = request.headers.get('authorization');
    const expectedSecret = process.env.REVALIDATE_SECRET;

    if (!expectedSecret) {
      return NextResponse.json({ error: 'Revalidation not configured' }, { status: 500 });
    }

    if (!authorizationHeader || authorizationHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { paths } = body;

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { paths: string[] }' },
        { status: 400 }
      );
    }

    // Validate paths
    for (const path of paths) {
      if (typeof path !== 'string') {
        return NextResponse.json({ error: 'All paths must be strings' }, { status: 400 });
      }
    }

    // Revalidate each path
    const results = [];
    for (const path of paths) {
      try {
        revalidatePath(path);
        results.push({ path, status: 'success' });
      } catch (error) {
        console.error(`Failed to revalidate path ${path}:`, error);
        results.push({
          path,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const hasErrors = results.some(result => result.status === 'error');
    const statusCode = hasErrors ? 207 : 200; // 207 Multi-Status for partial success

    return NextResponse.json(
      {
        message: 'Revalidation completed',
        results,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error('Revalidation endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
