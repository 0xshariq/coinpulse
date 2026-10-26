import { APIClient } from './apiClient';

/**
 * Creates the shared CoinGecko API client only when a server request needs it.
 * Keeping environment validation inside the factory prevents unrelated routes
 * from failing during static generation or build-time module evaluation.
 */
export function getCoingeckoClient(): APIClient {
  const baseURL = process.env.COINGECKO_BASE_URL;
  const apiKey = process.env.COINGECKO_API_KEY;

  if (!baseURL) {
    throw new Error('COINGECKO_BASE_URL environment variable is not set');
  }

  if (!apiKey) {
    throw new Error('COINGECKO_API_KEY environment variable is not set');
  }

  return new APIClient({
    baseURL,
    apiKey,
    timeout: 15000,
    maxRetries: 3,
    retryDelay: 1000,
  });
}

/**
 * Typed endpoints for CoinGecko API
 */
export const coingeckoEndpoints = {
  /**
   * Search for coins by query
   */
  search: (query: string) => ({
    path: '/search',
    params: { query },
  }),

  /**
   * Get trending coins
   */
  trending: () => ({
    path: '/search/trending',
    params: {},
  }),

  /**
   * Get market data for multiple coins
   */
  markets: (options: {
    ids: string;
    vsCurrency?: string;
    sparkline?: boolean;
    priceChangePercentage?: string;
  }) => ({
    path: '/coins/markets',
    params: {
      ids: options.ids,
      vs_currency: options.vsCurrency ?? 'usd',
      sparkline: options.sparkline ?? false,
      price_change_percentage: options.priceChangePercentage,
    },
  }),

  /**
   * Get OHLC data for a coin
   */
  ohlc: (options: { coinId: string; days: string | number }) => ({
    path: `/coins/${options.coinId}/ohlc`,
    params: {
      vs_currency: 'usd',
      days: options.days,
    },
  }),

  /**
   * Get coin details
   */
  coinDetails: (coinId: string) => ({
    path: `/coins/${coinId}`,
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
    },
  }),
};
