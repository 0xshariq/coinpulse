'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getBinanceUsdtPair } from '@/lib/binance';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/stream?streams=';
const UNSUPPORTED_PAIR_TIMEOUT_MS = 8_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * Streams Binance Spot data for one USDT pair and normalizes it for the existing UI.
 * Public Binance market streams do not require an API key.
 */
export const useBinanceWebSocket = ({
  symbol,
  liveInterval = '1s',
}: UseBinanceWebSocketProps): UseBinanceWebSocketReturn => {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);
  const [bookTicker, setBookTicker] = useState<BinanceBookTicker | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const pair = useMemo(() => getBinanceUsdtPair(symbol), [symbol]);

  useEffect(() => {
    let disposed = false;
    let unsupportedTimer: ReturnType<typeof setTimeout> | null = null;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      if (disposed || !pair) return;

      const streams = [`${pair}@ticker`, `${pair}@aggTrade`, `${pair}@kline_${liveInterval}`, `${pair}@bookTicker`];
      const socket = new WebSocket(`${BINANCE_WS_BASE}${streams.join('/')}`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (disposed) return;
        reconnectAttemptRef.current = 0;
        setIsConnected(true);
      };

      socket.onmessage = (event: MessageEvent) => {
        let message: Partial<BinanceCombinedStreamMessage>;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        const data = message.data;
        if (!data) return;

        if (!('e' in data) && 'b' in data && 'a' in data) {
          setBookTicker({
            bidPrice: Number(data.b),
            bidQuantity: Number(data.B),
            askPrice: Number(data.a),
            askQuantity: Number(data.A),
          });
          return;
        }

        if (!('e' in data)) return;

        // A valid ticker confirms that the requested Spot pair is available.
        if (data.e === '24hrTicker') {
          setIsAvailable(true);
          if (unsupportedTimer) clearTimeout(unsupportedTimer);
          setPrice({
            usd: Number(data.c),
            coin: data.s,
            price: Number(data.c),
            change24h: Number(data.P),
            priceChange24h: Number(data.p),
            volume24h: Number(data.q),
            timestamp: data.E,
          });
          return;
        }

        if (data.e === 'aggTrade') {
          const tradePrice = Number(data.p);
          const amount = Number(data.q);
          setTrades((previous) => [
            {
              price: tradePrice,
              amount,
              value: tradePrice * amount,
              timestamp: data.T,
              // Binance's `m` means the buyer is the market maker, so the taker sold.
              type: data.m ? 's' : 'b',
            },
            ...previous,
          ].slice(0, 7));
          return;
        }

        if (data.e === 'kline') {
          setOhlcv([
            data.k.t,
            Number(data.k.o),
            Number(data.k.h),
            Number(data.k.l),
            Number(data.k.c),
          ]);
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        setIsConnected(false);
        const delay = Math.min(1_000 * 2 ** reconnectAttemptRef.current, MAX_RECONNECT_DELAY_MS);
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    };

    setPrice(null);
    setTrades([]);
    setOhlcv(null);
    setBookTicker(null);
    setIsConnected(false);
    setIsAvailable(null);
    clearReconnectTimer();

    if (!pair) {
      setIsAvailable(false);
      return;
    }

    connect();

    unsupportedTimer = setTimeout(() => {
      if (!disposed) setIsAvailable((available) => available ?? false);
    }, UNSUPPORTED_PAIR_TIMEOUT_MS);

    return () => {
      disposed = true;
      if (unsupportedTimer) clearTimeout(unsupportedTimer);
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [pair, liveInterval]);

  return { price, trades, ohlcv, bookTicker, isConnected, isAvailable };
};
