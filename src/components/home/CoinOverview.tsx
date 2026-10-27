import React from 'react';
import { fetcher } from '@/lib/coingecko.actions';
import { CoinOverviewFallback } from './fallback';
import CoinOverviewClient from '@/components/home/CoinOverviewClient';

const loadCoinOverview = async (ids: string[]) => {
  try {
    // Fetch coin details in parallel
    const coinPromises = ids.map((id) =>
      fetcher<CoinDetailsData>(`/coins/${id}`, { dex_pair_format: 'symbol' }),
    );

    const coins = await Promise.all(coinPromises);

    // Fetch OHLC for each coin (best-effort)
    const ohlcPromises = ids.map(async (id) => {
      try {
        return await fetcher<OHLCData[]>(`/coins/${id}/ohlc`, { vs_currency: 'usd', days: 1 });
      } catch (err) {
        console.warn(`Could not fetch OHLC for ${id}:`, err);
        return [] as OHLCData[];
      }
    });

    const ohlcResults = await Promise.all(ohlcPromises);

    const coinsData: Record<string, { coin: CoinDetailsData; ohlc: OHLCData[] }> = {};
    ids.forEach((id, idx) => {
      coinsData[id] = { coin: coins[idx], ohlc: ohlcResults[idx] };
    });

    return coinsData;
  } catch (error) {
    console.error('Error fetching coin overview:', error);
    return null;
  }
};

const CoinOverview = async () => {
  const ids = ['bitcoin', 'ethereum', 'solana'];
  const coinsData = await loadCoinOverview(ids);

  return coinsData ? <CoinOverviewClient coinsData={coinsData} /> : <CoinOverviewFallback />;
};

export default CoinOverview;
