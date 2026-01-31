import { NextResponse } from 'next/server';
import { insertSnapshot } from '@/lib/db-queries';

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_URL = 'https://sklep.ebilet.pl/api/event/getsectorfreeseatscount';
const EVENT_ID = '218143106950758457';
const API_PARAMS = {
  eid: EVENT_ID,
  sids: '{"334:335:336":[696,697,698,699,560,582,595,596,597,598,583,584,585,586,701,587,588,589,590,621,599,600,601,602,606,676,677,678,679,692,693,700,682,683,685,688,689,690,686,695,681,691,674,675,694]}',
  ec: 'null',
  exid: '',
  tid: '0'
};

export async function GET() {
  try {
    const params = new URLSearchParams();
    params.append('eid', API_PARAMS.eid);
    params.append('sids', API_PARAMS.sids);
    params.append('ec', API_PARAMS.ec);
    params.append('exid', API_PARAMS.exid);
    params.append('tid', API_PARAMS.tid);

    const fullUrl = `${API_URL}?${params.toString()}`;

    // Get cookie from environment variable (set in Vercel or .env.local)
    const cookie = process.env.EBILET_COOKIE || '';

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    // Add cookie if available
    if (cookie) {
      headers['Cookie'] = `wdctx=${cookie}`;
      console.log('[eBilet] Using cookie from env');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(fullUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();

      // Check if it's a captcha/rate limit response
      if (response.status === 429 || errorText.includes('allegrocaptcha')) {
        console.error('[eBilet] Rate limited or captcha required');
        return NextResponse.json(
          {
            error: 'Captcha required. Set EBILET_COOKIE env variable with wdctx cookie value from browser.',
            code: 'CAPTCHA_REQUIRED'
          },
          { status: 429 }
        );
      }

      console.error('[eBilet] API error:', response.status, errorText.substring(0, 200));
      return NextResponse.json(
        { error: `API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const sfc = data.sfc || {};
    console.log('[eBilet] Success! Got', Object.keys(sfc).length, 'sectors');

    // Calculate total and save to database (only if data changed)
    const totalAvailable = Object.values(sfc as Record<string, number>).reduce((sum, val) => sum + val, 0);
    try {
      const saved = await insertSnapshot(totalAvailable, sfc);
      console.log(saved ? '[eBilet] Saved snapshot to database' : '[eBilet] Skipped - no changes');
    } catch (dbError) {
      console.error('[eBilet] Failed to save to database:', dbError);
      // Continue even if database save fails
    }

    return NextResponse.json({ sfc });

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[eBilet] Request timeout');
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    console.error('[eBilet] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket data' },
      { status: 500 }
    );
  }
}
