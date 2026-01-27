import { NextRequest, NextResponse } from 'next/server';
import { insertSnapshot } from '@/lib/db-queries';

// Force dynamic rendering
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

async function checkTickets() {
  const params = new URLSearchParams();
  params.append('eid', API_PARAMS.eid);
  params.append('sids', API_PARAMS.sids);
  params.append('ec', API_PARAMS.ec);
  params.append('exid', API_PARAMS.exid);
  params.append('tid', API_PARAMS.tid);

  const fullUrl = `${API_URL}?${params.toString()}`;
  const cookie = process.env.EBILET_COOKIE || '';

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  if (cookie) {
    headers['Cookie'] = `wdctx=${cookie}`;
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
    if (response.status === 429 || errorText.includes('allegrocaptcha')) {
      throw new Error('CAPTCHA_REQUIRED');
    }
    throw new Error(`API returned status ${response.status}`);
  }

  const data = await response.json();
  const sfc = data.sfc || {};

  const totalAvailable = Object.values(sfc as Record<string, number>).reduce((sum, val) => sum + val, 0);
  await insertSnapshot(totalAvailable, sfc);

  return { totalAvailable, sectorsCount: Object.keys(sfc).length };
}

// Verify cron request authenticity
function isValidCronRequest(request: NextRequest): boolean {
  // Vercel Cron sends this header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, verify it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // For external cron services without secret (less secure, but works on free tier)
  // You can also check for specific IPs or other headers here
  return true;
}

export async function GET(request: NextRequest) {
  // Verify the request is from a legitimate cron source
  if (!isValidCronRequest(request)) {
    console.error('[Cron] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await checkTickets();
    const duration = Date.now() - startTime;

    console.log(`[Cron] Success! ${result.totalAvailable} tickets across ${result.sectorsCount} sectors (${duration}ms)`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalAvailable: result.totalAvailable,
      sectorsCount: result.sectorsCount,
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[Cron] Failed: ${errorMessage} (${duration}ms)`);

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      duration: `${duration}ms`
    }, { status: errorMessage === 'CAPTCHA_REQUIRED' ? 429 : 500 });
  }
}
