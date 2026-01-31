import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/db-queries';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '72', 10);
    const since = searchParams.get('since');
    const sinceTimestamp = since ? parseInt(since, 10) : undefined;

    const history = await getHistory(hours, sinceTimestamp);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[History] Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
