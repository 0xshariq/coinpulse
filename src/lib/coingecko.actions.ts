'use server';

import { coingeckoClient } from './coingeckoClient';
import { APIError } from './apiClient';

/**
 * Legacy fetcher function for backward compatibility
 * Wraps the new APIClient to maintain existing behavior
 */
export async function fetcher<T>(endpoint: string, params?: QueryParams): Promise<T> {
  try {
    const result = await coingeckoClient.get<T>(endpoint, {
      params: (params as Record<string, string | number | boolean>) || {},
    });
    return result;
  } catch (error) {
    // Rethrow APIError instances unchanged to preserve error.status for callers
    throw error;
  }
}

/**
 * Fetches trending coins from CoinGecko
 * @throws {APIError} If the API request fails
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const trendingList: { coins: TrendingCoin[] } = await fetcher<{
      coins: TrendingCoin[];
    }>('/search/trending');

    if (!Array.isArray(trendingList.coins)) {
      throw new Error('Invalid response: coins is not an array');
    }

    return trendingList.coins;
  } catch (error) {
    console.error('[getTrendingCoins] Error:', error);
    throw error;
  }
}

/**
 * Searches for coins by query
 * @param query - The search query string
 * @returns Array of matching coins with market data
 * @throws {APIError} If the API request fails
 */
export async function searchCoins(query: string): Promise<SearchCoin[]> {
  try {
    // Validate input
    const trimmedQuery = String(query || '').trim();

    if (!trimmedQuery) {
      console.warn('[searchCoins] Empty query provided');
      return [];
    }

    if (trimmedQuery.length > 100) {
      console.warn('[searchCoins] Query exceeded max length (100 characters)');
      return [];
    }

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

    if (!Array.isArray(searchResult.coins)) {
      throw new Error('Invalid response: coins is not an array');
    }

    const coins = searchResult.coins.slice(0, 10);

    if (coins.length === 0) {
      return [];
    }

    // 2. Extract ids with validation
    const ids = coins.map((coin) => coin.id).join(',');

    if (!ids) {
      return [];
    }

    // 3. Fetch market data
    const marketData = await fetcher<CoinMarketData[]>('/coins/markets', {
      vs_currency: 'usd',
      ids,
      sparkline: false,
      price_change_percentage: '24h',
    });

    if (!Array.isArray(marketData)) {
      throw new Error('Invalid response: marketData is not an array');
    }

    // 4. Convert market data into a lookup map
    const marketMap = new Map(marketData.map((coin) => [coin.id, coin]));

    // 5. Merge search + market data
    return coins
      .map((coin) => {
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
      })
      .filter((coin) => coin.id && coin.name && coin.symbol);
  } catch (error) {
    console.error('[searchCoins] Error:', error);
    throw error;
  }
}
