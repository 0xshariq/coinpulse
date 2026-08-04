'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getBinanceUsdtPair } from '@/lib/binance';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/stream?streams=';
const MAX_RECONNECT_DELAY_MS = 30_000;

/** Streams 24-hour ticker updates for a group of Binance USDT Spot pairs. */
export const useBinanceTickers = (symbols: string[]) => {
  const [tickers, setTickers] = useState<Map<string, BinanceLiveTicker>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingTickersRef = useRef<Map<string, BinanceLiveTicker>>(new Map());

  const symbolsKey = symbols.join('|');
  const pairs = useMemo(
    () =>
      Array.from(
        new Set(symbols.map(getBinanceUsdtPair).filter((pair): pair is string => Boolean(pair))),
      ),
    [symbolsKey],
  );

  useEffect(() => {
    let disposed = false;
    let reconnectAttempt = 0;

    const publish = () => {
      frameRef.current = null;
      setTickers(new Map(pendingTickersRef.current));
    };

    const connect = () => {
      if (disposed || !pairs.length) return;

      const streams = pairs.map((pair) => `${pair}@ticker`);
      const socket = new WebSocket(`${BINANCE_WS_BASE}${streams.join('/')}`);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempt = 0;
      };

      socket.onmessage = (event: MessageEvent) => {
        let message: Partial<BinanceCombinedStreamMessage>;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        const data = message.data;
        if (!data || !('e' in data) || data.e !== '24hrTicker') return;

        pendingTickersRef.current.set(data.s.toLowerCase(), {
          price: Number(data.c),
          change24h: Number(data.P),
        });

        if (frameRef.current === null) {
          frameRef.current = requestAnimationFrame(publish);
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        const delay = Math.min(1_000 * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY_MS);
        reconnectAttempt += 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      socket.onerror = () => socket.close();
    };

    pendingTickersRef.current = new Map();
    setTickers(new Map());
    connect();

    return () => {
      disposed = true;
      socketRef.current?.close();
      socketRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [pairs]);

  return tickers;
};
