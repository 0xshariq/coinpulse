import { APIClient } from './apiClient';

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) {
  throw new Error('COINGECKO_BASE_URL environment variable is not set');
}

if (!API_KEY) {
  throw new Error('COINGECKO_API_KEY environment variable is not set');
}

/**
 * Shared CoinGecko API client instance
 */
export const coingeckoClient = new APIClient({
  baseURL: BASE_URL,
  apiKey: API_KEY,
  timeout: 15000, // 15 seconds for CoinGecko
  maxRetries: 3,
  retryDelay: 1000,
});

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
