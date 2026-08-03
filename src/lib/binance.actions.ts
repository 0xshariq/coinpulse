const BINANCE_MARKET_DATA_URL = 'https://data-api.binance.vision/api/v3';

const toUsdtPair = (symbol: string) => `${symbol.trim().toUpperCase()}USDT`;

/** Public Binance Spot 24-hour ticker snapshot. No API key is required. */
export async function getBinanceTicker(symbol: string): Promise<BinanceTickerData | null> {
  const pair = toUsdtPair(symbol);

  try {
    const response = await fetch(
      `${BINANCE_MARKET_DATA_URL}/ticker/24hr?symbol=${encodeURIComponent(pair)}`,
      { next: { revalidate: 30 } },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as Partial<BinanceTickerData>;
    if (!data.symbol || !data.lastPrice) return null;

    return data as BinanceTickerData;
  } catch {
    return null;
  }
}
