export const getBinanceUsdtPair = (symbol: string) => {
  const normalizedSymbol = symbol.trim().toLowerCase();
  return normalizedSymbol ? `${normalizedSymbol}usdt` : null;
};
