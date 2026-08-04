// Cache for Binance exchangeInfo to avoid repeated fetches
let exchangeInfoCache: {
  symbols: Set<string>;
  timestamp: number;
} | null = null;

const EXCHANGE_INFO_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Override map for symbols that don't follow the standard SYMBOLUSDT pattern
const PAIR_OVERRIDES: Record<string, string | null> = {
  // Example: 'wbtc': 'wbtcusdt', or 'luna': null if not available
};

/**
 * Fetches and caches the list of active trading pairs from Binance.
 * Returns null if the fetch fails, in which case fallback logic should be used.
 */
async function getExchangeInfo(): Promise<Set<string> | null> {
  try {
    const now = Date.now();

    // Return cached data if still fresh
    if (exchangeInfoCache && now - exchangeInfoCache.timestamp < EXCHANGE_INFO_CACHE_TTL_MS) {
      return exchangeInfoCache.symbols;
    }

    // Fetch from Binance API
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    });

    if (!response.ok) {
      console.error('[Binance] Failed to fetch exchangeInfo:', response.statusText);
      return null;
    }

    const data: { symbols?: Array<{ status: string; symbol: string }> } = await response.json();
    const symbols = new Set<string>();

    if (Array.isArray(data.symbols)) {
      data.symbols.forEach((s) => {
        if (s.status === 'TRADING') {
          symbols.add(s.symbol.toLowerCase());
        }
      });
    }

    exchangeInfoCache = { symbols, timestamp: now };
    return symbols;
  } catch (error) {
    console.error('[Binance] Error fetching exchangeInfo:', error);
    return null;
  }
}

/**
 * Resolves a CoinGecko symbol to a valid Binance USDT pair.
 * Returns null if the pair is not available on Binance.
 *
 * Strategy:
 * 1. Check override map first (for special cases)
 * 2. Try standard SYMBOLUSDT pattern
 * 3. Validate against Binance exchangeInfo if available
 * 4. Fall back to standard pattern if validation unavailable
 */
export async function resolveBinancePair(symbol: string): Promise<string | null> {
  const normalizedSymbol = symbol.trim().toLowerCase();

  if (!normalizedSymbol) return null;

  // Check override map
  if (normalizedSymbol in PAIR_OVERRIDES) {
    return PAIR_OVERRIDES[normalizedSymbol];
  }

  const standardPair = `${normalizedSymbol}usdt`;

  // Try to validate against exchangeInfo
  const activeSymbols = await getExchangeInfo();
  if (activeSymbols) {
    return activeSymbols.has(standardPair) ? standardPair : null;
  }

  // Fallback: return standard pair if validation unavailable
  // (this allows the system to continue even if exchangeInfo fetch fails)
  console.warn(
    `[Binance] ExchangeInfo unavailable; using standard pair ${standardPair} without validation`,
  );
  return standardPair;
}

/**
 * Legacy synchronous function that assumes the standard SYMBOLUSDT pattern.
 * Use resolveBinancePair() for proper validation in async contexts.
 *
 * @deprecated Use resolveBinancePair() instead for async validation
 */
export const getBinanceUsdtPair = (symbol: string) => {
  const normalizedSymbol = symbol.trim().toLowerCase();
  return normalizedSymbol ? `${normalizedSymbol}usdt` : null;
};
