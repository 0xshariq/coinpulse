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

export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  const trendingList: { coins: TrendingCoin[] } = await fetcher<{ coins: TrendingCoin[] }>(
    '/search/trending',
    undefined,
    300,
  );
  return trendingList.coins;
}

export async function searchCoins(query: string): Promise<SearchCoin[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) return [];

  // 1. Search for matching coins
  const searchResult = await fetcher<{
    coins: {
      id: string;
      name: string;
      symbol: string;
      thumb: string;
      large: string;
      market_cap_rank: number;
    }[];
  }>('/search', {
    query: trimmedQuery,
  });

  const coins = searchResult.coins.slice(0, 10);

  if (coins.length === 0) return [];

  // 2. Extract ids
  const ids = coins.map((coin) => coin.id).join(',');

  // 3. Fetch market data
  const marketData = await fetcher<CoinMarketData[]>('/coins/markets', {
    vs_currency: 'usd',
    ids,
    sparkline: false,
    price_change_percentage: '24h',
  });

  // 4. Convert market data into a lookup map
  const marketMap = new Map(marketData.map((coin) => [coin.id, coin]));

  // 5. Merge search + market data
  return coins.map((coin) => {
    const market = marketMap.get(coin.id);

    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      thumb: coin.thumb,
      large: coin.large,
      market_cap_rank: market?.market_cap_rank ?? coin.market_cap_rank,
      data: {
        price: market?.current_price ?? 0,
        price_change_percentage_24h: market?.price_change_percentage_24h ?? 0,
      },
    };
  });
}
