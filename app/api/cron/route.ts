import { NextResponse } from 'next/server';

// Vercel Cron Job - runs every hour to fetch fresh data
export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without secret in development or if not configured
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const results = {
    timestamp: new Date().toISOString(),
    ebilet: { success: false, error: null as string | null },
    alebilet: { success: false, error: null as string | null },
  };

  // Fetch eBilet data
  try {
    const ebiletResponse = await fetch(`${baseUrl}/api/tickets`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (ebiletResponse.ok) {
      results.ebilet.success = true;
    } else {
      results.ebilet.error = `Status: ${ebiletResponse.status}`;
    }
  } catch (error) {
    results.ebilet.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Fetch AleBilet data
  try {
    const alebiletResponse = await fetch(`${baseUrl}/api/alebilet`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (alebiletResponse.ok) {
      results.alebilet.success = true;
    } else {
      results.alebilet.error = `Status: ${alebiletResponse.status}`;
    }
  } catch (error) {
    results.alebilet.error = error instanceof Error ? error.message : 'Unknown error';
  }

  const allSuccess = results.ebilet.success && results.alebilet.success;

  console.log('[CRON]', results);

  return NextResponse.json(results, {
    status: allSuccess ? 200 : 207 // 207 Multi-Status if partial success
  });
}

// Vercel Cron requires GET method
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for the cron job
