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
import { BoundedCache } from '@/lib/boundedCache';

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
  const cacheRef = useRef<BoundedCache<OHLCData[]> | null>(null);
  const SESSION_CACHE_KEY = 'cp_ohlc_cache_v1';
  const prevCoinIdRef = useRef<string | undefined>(coinId);

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
    const { days, interval } = PERIOD_CONFIG[selectedPeriod];
    setIsLoadingPeriod(true);
    try {
      // Initialize cache if not already done
      if (!cacheRef.current) {
        cacheRef.current = new BoundedCache<OHLCData[]>(50); // Max 50 entries
      }

      const intervalKey = interval ?? 'auto';
      const cacheKey = `${coinId}-${days}-${intervalKey}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        return cached;
      }

      const params = new URLSearchParams({ coinId, days: String(days) });
      if (interval) {
        params.set('interval', interval);
      }

      const res = await fetch(`/api/ohlc?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch OHLC from proxy: ${res.status}`);
      }

      const newData: OHLCData[] = await res.json();

      // Store in cache with TTL matching server logic
      const ttl = getTtlForDays(days) * 1000;
      cacheRef.current.set(cacheKey, newData ?? [], ttl);

      return newData ?? [];
    } catch (e) {
      console.error('Failed to fetch OHLCData from proxy', e);
      return null;
    } finally {
      setIsLoadingPeriod(false);
    }
  };

  const handlePeriodChange = async (newPeriod: Period) => {
    if (newPeriod === period) return;

    const previousPeriod = period;
    const previousData = ohlcData;

    const fetchedData = await fetchOHLCData(newPeriod);

    if (fetchedData) {
      startTransition(() => {
        setPeriod(newPeriod);
        setOhlcData(fetchedData);
      });
      return;
    }

    startTransition(() => {
      setPeriod(previousPeriod);
      setOhlcData(previousData);
    });
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

  // Sync ohlcData when the data prop changes
  useEffect(() => {
    if (data && data.length > 0) {
      setOhlcData(data);
    }
  }, [data]);

  // Reset period and data when coinId changes
  useEffect(() => {
    if (prevCoinIdRef.current !== coinId) {
      setPeriod(initialPeriod);
      setOhlcData(data ?? []);
      prevCoinIdRef.current = coinId;
    }
  }, [coinId, initialPeriod, data]);

  // Initialize cache on mount and seed with server-provided data
  useEffect(() => {
    // Initialize bounded cache
    if (!cacheRef.current) {
      cacheRef.current = new BoundedCache<OHLCData[]>(50);
    }

    // Seed cache with initial data from server
    try {
      const { days, interval } = PERIOD_CONFIG[period];
      const cacheKey = `${coinId}-${days}-${interval ?? 'auto'}`;
      const cached = cacheRef.current.get(cacheKey);

      if (data && data.length) {
        const ttl = getTtlForDays(days) * 1000;
        cacheRef.current.set(cacheKey, data ?? [], ttl);
      } else if (cached) {
        startTransition(() => setOhlcData(cached));
      }
    } catch (e) {
      // ignore
    }

    // Cleanup on unmount
    return () => {
      // Note: We keep the cache alive for potential reuse in the same session
      // but could call cacheRef.current?.destroy() if needed
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Normalize first, then upsert by second. A current Binance candle must win over
    // a CoinGecko candle for the same second instead of being filtered as a duplicate.
    const candlesBySecond = new Map<number, OHLCData>();
    [...ohlcData, ...(liveOhlcv ? [liveOhlcv] : [])].forEach((item) => {
      const time = Math.floor(item[0] / 1000);
      candlesBySecond.set(time, [time, item[1], item[2], item[3], item[4]]);
    });

    const converted = convertOHLCData(
      Array.from(candlesBySecond.values()).sort((first, second) => first[0] - second[0]),
    );
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
