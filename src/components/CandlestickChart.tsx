'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  getCandlestickConfig,
  getChartConfig,
  LIVE_INTERVAL_BUTTONS,
  PERIOD_BUTTONS,
  PERIOD_CONFIG,
} from '@/lib/constants';
import { CandlestickSeries, createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { convertOHLCData } from '@/lib/utils';

const CandlestickChart = ({
  children,
  data,
  coinId,
  height = 360,
  initialPeriod = 'daily',
  liveOhlcv = null,
  mode = 'historical',
  liveInterval,
  setLiveInterval,
}: CandlestickChartProps) => {
  // Refs to hold chart container and chart instance
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  // Refs to hold chart and series instances
  const chartRef = useRef<IChartApi | null>(null);
  // Refs to hold series instance and previous data length for comparison
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const prevOhlcDataLength = useRef<number>(data?.length || 0);

  const [period, setPeriod] = useState(initialPeriod);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cacheRef = useRef<Map<string, { data: OHLCData[]; expires: number }>>(new Map());
  const SESSION_CACHE_KEY = 'cp_ohlc_cache_v1';

  const getTtlForDays = (days: number | string) => {
    if (typeof days === 'string') {
      if (days === 'max') return 3600; // long TTL for 'max'
      const parsed = Number(days);
      if (Number.isNaN(parsed)) return 300;
      days = parsed;
    }

    if (days <= 1) return 10; // seconds
    if (days <= 7) return 30;
    if (days <= 30) return 300;
    return 3600;
  };

  const fetchOHLCData = async (selectedPeriod: Period) => {
    const { days } = PERIOD_CONFIG[selectedPeriod];
    setIsLoadingPeriod(true);
    try {
      const cacheKey = `${coinId}-${days}`;
      const cached = cacheRef.current.get(cacheKey);
      const now = Date.now();
      if (cached && cached.expires > now) {
        startTransition(() => setOhlcData(cached.data ?? []));
        return;
      }

      const res = await fetch(`/api/ohlc?coinId=${encodeURIComponent(coinId)}&days=${encodeURIComponent(
        String(days),
      )}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch OHLC from proxy: ${res.status}`);
      }

      const newData: OHLCData[] = await res.json();

      // store in cache with ttl matching server logic
      const ttl = getTtlForDays(days) * 1000;
      cacheRef.current.set(cacheKey, { data: newData ?? [], expires: Date.now() + ttl });
      try {
        const serial = Array.from(cacheRef.current.entries());
        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(serial));
      } catch (e) {
        // ignore sessionStorage errors
      }

      startTransition(() => {
        setOhlcData(newData ?? []);
      });
    } catch (e) {
      console.error('Failed to fetch OHLCData from proxy', e);
    } finally {
      setIsLoadingPeriod(false);
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod === period) return;

    setPeriod(newPeriod);
    fetchOHLCData(newPeriod);
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const showTime = ['daily', 'weekly', 'monthly'].includes(period);

    const chart = createChart(container, {
      ...getChartConfig(height, showTime),
      width: container.clientWidth,
    });
    const series = chart.addSeries(CandlestickSeries, getCandlestickConfig());

    const convertedToSeconds = ohlcData.map(
      (item) => [Math.floor(item[0] / 1000), item[1], item[2], item[3], item[4]] as OHLCData,
    );

    series.setData(convertOHLCData(convertedToSeconds));
    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = series;

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      chart.applyOptions({ width: entries[0].contentRect.width });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height, period]);

  // Hydrate cache from sessionStorage on mount and seed cache with server-provided data
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (raw) {
        const parsed: [string, { data: OHLCData[]; expires: number }][] = JSON.parse(raw);
        const map = new Map(parsed);
        const now = Date.now();
        // remove expired
        for (const [k, v] of map.entries()) {
          if (!v || v.expires <= now) map.delete(k);
        }
        cacheRef.current = map;
      }
    } catch (e) {
      // ignore
    }

    // seed cache with initial server data if present
    try {
      if (data && data.length) {
        const days = PERIOD_CONFIG[period].days;
        const cacheKey = `${coinId}-${days}`;
        const ttl = getTtlForDays(days) * 1000;
        cacheRef.current.set(cacheKey, { data: data ?? [], expires: Date.now() + ttl });
        const serial = Array.from(cacheRef.current.entries());
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(serial));
        } catch { }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const convertedToSeconds = ohlcData.map(
      (item) => [Math.floor(item[0] / 1000), item[1], item[2], item[3], item[4]] as OHLCData,
    );

    let merged: OHLCData[];

    if (liveOhlcv) {
      const liveTimestamp = liveOhlcv[0];

      const lastHistoricalCandle = convertedToSeconds[convertedToSeconds.length - 1];

      if (lastHistoricalCandle && lastHistoricalCandle[0] === liveTimestamp) {
        merged = [...convertedToSeconds.slice(0, -1), liveOhlcv];
      } else {
        merged = [...convertedToSeconds, liveOhlcv];
      }
    } else {
      merged = convertedToSeconds;
    }

    merged.sort((a, b) => a[0] - b[0]);

    const converted = convertOHLCData(merged);
    candleSeriesRef.current.setData(converted);

    const dataChanged = prevOhlcDataLength.current !== ohlcData.length;

    if (dataChanged || mode === 'historical') {
      chartRef.current?.timeScale().fitContent();
      prevOhlcDataLength.current = ohlcData.length;
    }
  }, [ohlcData, period, liveOhlcv, mode]);

  return (
    <div id="candlestick-chart">
      <div className="chart-header">
        <div className="flex-1">{children}</div>

        <div className="button-group">
          <span className="text-sm mx-2 font-medium text-purple-100/50">Period:</span>
          {PERIOD_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              className={period === value ? 'config-button-active' : 'config-button'}
              onClick={() => handlePeriodChange(value)}
              disabled={isPending || isLoadingPeriod}
            >
              {label}
            </button>
          ))}
          {isLoadingPeriod && (
            <div className="ml-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {liveInterval && (
          <div className="button-group">
            <span className="text-sm mx-2 font-medium text-purple-100/50">Update Frequency:</span>
            {LIVE_INTERVAL_BUTTONS.map(({ value, label }) => (
              <button
                key={value}
                className={liveInterval === value ? 'config-button-active' : 'config-button'}
                onClick={() => setLiveInterval && setLiveInterval(value)}
                disabled={isPending || isLoadingPeriod}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={chartContainerRef} className="chart" style={{ height }} />
    </div>
  );
};

export default CandlestickChart;