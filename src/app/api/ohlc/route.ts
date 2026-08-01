import { NextResponse } from 'next/server';
import { fetcher } from '@/lib/coingecko.actions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId');
    const days = searchParams.get('days');

    if (!coinId) {
      return NextResponse.json({ error: 'coinId is required' }, { status: 400 });
    }

    const parsedDays = days ? Number(days) : 1;

    const data = await fetcher<OHLCData[]>(`/coins/${coinId}/ohlc`, {
      vs_currency: 'usd',
      days: parsedDays,
    });

    // Choose a short cache TTL depending on the requested range.
    // Shorter TTL for recent data, longer for historical ranges.
    let ttl = 10; // seconds by default
    if (parsedDays <= 1) ttl = 10; // live-ish
    else if (parsedDays <= 7) ttl = 30;
    else if (parsedDays <= 30) ttl = 300;
    else ttl = 3600;

    const headers = {
      'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=60`,
    };

    return NextResponse.json(data, { headers });
  } catch (err: any) {
    console.error('API /api/ohlc error:', err);
    const status = err?.message?.includes('API Error: 400') ? 400 : 500;
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status });
  }
}
