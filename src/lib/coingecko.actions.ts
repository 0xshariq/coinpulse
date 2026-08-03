'use server';

import qs from 'query-string';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) throw new Error('Could not get base url');
if (!API_KEY) throw new Error('Could not get api key');

export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {
  const url = qs.stringifyUrl(
    {
      url: `${BASE_URL}/${endpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );

  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;

    const response = await fetch(url, {
      headers: {
        'x-cg-api-key': API_KEY,
        'Content-Type': 'application/json',
      } as Record<string, string>,
      next: { revalidate },
    });

    if (response.ok) {
      return response.json();
    }

    // If rate limited or server error, attempt a retry with backoff
    const status = response.status;
    const errorBody: CoinGeckoErrorBody = await response.json().catch(() => ({}));

    // If this was the last attempt, throw the error
    if (attempt >= maxAttempts || (status < 500 && status !== 429)) {
      throw new Error(`API Error: ${status}: ${errorBody.error || response.statusText} `);
    }

    // Determine wait time from Retry-After header if provided
    const retryAfter = response.headers.get('Retry-After');
    let waitMs = 1000 * Math.pow(2, attempt - 1); // exponential backoff: 1s,2s,4s
    if (retryAfter) {
      const ra = Number(retryAfter);
      if (!Number.isNaN(ra)) {
        waitMs = ra * 1000;
      }
    }

    // wait before retry
    await new Promise((res) => setTimeout(res, waitMs));
  }

  // Should not reach here
  throw new Error('Unexpected fetch error');
}
