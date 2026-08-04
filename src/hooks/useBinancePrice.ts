'use client';

import { useEffect, useState } from 'react';
import { getBinanceUsdtPair } from '@/lib/binance';
import { binanceWSManager } from '@/lib/binanceWebSocketManager';

interface PriceData {
  price: number | null;
  loading: boolean;
}

export const useBinancePrice = (symbol: string) => {
  const [priceData, setPriceData] = useState<PriceData>({
    price: null,
    loading: true,
  });

  useEffect(() => {
    if (!symbol) {
      setPriceData({ price: null, loading: false });
      return;
    }

    const pair = getBinanceUsdtPair(symbol);
    if (!pair) {
      setPriceData({ price: null, loading: false });
      return;
    }

    const stream = `${pair}@ticker`;

    const handleMessage = (data: any) => {
      if (data.c) {
        const price = parseFloat(data.c);
        setPriceData({ price, loading: false });
      }
    };

    // Subscribe through the shared manager
    const unsubscribe = binanceWSManager.subscribe(stream, handleMessage);
    setPriceData((prev) => ({ ...prev, loading: false }));

    return unsubscribe;
  }, [symbol]);

  return priceData;
};
