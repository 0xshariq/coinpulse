import { NextResponse } from 'next/server';
import { fetcher } from '@/lib/coingecko.actions';
import { APIError } from '@/lib/apiClient';

// Allowed values for the days parameter
const ALLOWED_DAYS = ['1', '7', '30', '90', '180', '365', 'max'] as const;
type AllowedDays = (typeof ALLOWED_DAYS)[number];

function isValidCoinId(coinId: string): boolean {
  // CoinGecko coin IDs contain lowercase letters, numbers, and hyphens
  return /^[a-z0-9-]+$/.test(coinId) && coinId.length <= 50;
}

function isValidDays(days: string): days is AllowedDays {
  return ALLOWED_DAYS.includes(days as AllowedDays);
}

function getDaysValue(days: AllowedDays): string | number {
  if (days === 'max') {
    return 'max';
  }
  const num = Number(days);
  return Number.isFinite(num) && num > 0 ? num : 1;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId');
    const daysParam = searchParams.get('days') || '1';

    // Validate coinId
    if (!coinId || !isValidCoinId(coinId)) {
      return NextResponse.json(
        { error: 'Invalid coinId. Must contain only lowercase letters, numbers, and hyphens.' },
        { status: 400 },
      );
    }

    // Validate days parameter
    if (!isValidDays(daysParam)) {
      return NextResponse.json(
        { error: `Invalid days parameter. Allowed values: ${ALLOWED_DAYS.join(', ')}` },
        { status: 400 },
      );
    }

    const daysValue = getDaysValue(daysParam);

    const data = await fetcher<OHLCData[]>(`/coins/${coinId}/ohlc`, {
      vs_currency: 'usd',
      days: daysValue,
    });

    // Choose a short cache TTL depending on the requested range.
    // Shorter TTL for recent data, longer for historical ranges.
    let ttl = 10; // seconds by default
    if (daysValue === 1) {
      ttl = 10; // live-ish
    } else if (daysValue === 'max') {
      ttl = 3600; // historical all-time data: 1 hour
    } else if (typeof daysValue === 'number') {
      if (daysValue <= 7) ttl = 30;
      else if (daysValue <= 30) ttl = 300;
      else ttl = 3600;
    }

    const headers = {
      'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=60`,
    };

    return NextResponse.json(data, { headers });
  } catch (error: unknown) {
    console.error('API /api/ohlc error:', error);

    if (error instanceof APIError) {
      // Authentication and authorization failures from CoinGecko are provider failures,
      // not client-correctable errors for this endpoint.
      const status =
        error.status === 401
          ? 502
          : error.status === 403
            ? 503
            : error.status >= 400 && error.status < 500
              ? error.status
              : 502;
      return NextResponse.json(
        { error: 'Unable to load market data', code: error.code },
        { status },
      );
    }

    return NextResponse.json({ error: 'Unable to load market data' }, { status: 500 });
  }
}
