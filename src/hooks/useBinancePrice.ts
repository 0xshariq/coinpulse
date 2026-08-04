'use client';

import { useEffect, useState } from 'react';
import { getBinanceUsdtPair } from '@/lib/binance';

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

    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        const pair = getBinanceUsdtPair(symbol);
        if (!pair) {
          setPriceData({ price: null, loading: false });
          return;
        }

        // Binance WebSocket for ticker data
        ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${pair}@ticker`
        );

        ws.onopen = () => {
          console.log('[v0] WebSocket connected for', symbol);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.c) {
              const price = parseFloat(data.c);
              setPriceData({ price, loading: false });
            }
          } catch (error) {
            console.error('[v0] Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[v0] WebSocket error:', error);
          setPriceData((prev) => ({ ...prev, loading: false }));
        };

        ws.onclose = () => {
          console.log('[v0] WebSocket closed for', symbol);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error('[v0] Error connecting to WebSocket:', error);
        setPriceData({ price: null, loading: false });
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [symbol]);

  return priceData;
};
