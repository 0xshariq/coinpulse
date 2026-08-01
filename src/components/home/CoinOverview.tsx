import React from 'react';
import { fetcher } from '@/lib/coingecko.actions';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { CoinOverviewFallback } from './fallback';
import CandlestickChart from '@/components/CandlestickChart';

const CoinOverview = async () => {
  try {
    const coin = await fetcher<CoinDetailsData>('/coins/bitcoin', {
      dex_pair_format: 'symbol',
    });

    // The Coingecko OHLC endpoint does not accept `interval` or `precision` query
    // parameters. Requesting them triggers a 400 "invalid interval parameter".
    // Fetch OHLC separately and fail gracefully if the OHLC call errors.
    let coinOHLCData: OHLCData[] = [];
    try {
      coinOHLCData = await fetcher<OHLCData[]>('/coins/bitcoin/ohlc', {
        vs_currency: 'usd',
        days: 1,
      });
    } catch (err) {
      console.warn('Could not fetch OHLC data, continuing without chart data:', err);
      coinOHLCData = [];
    }
    return (
      <div id="coin-overview">
        <CandlestickChart data={coinOHLCData} coinId="bitcoin" liveInterval="1m">
          <div className="header pt-2">
            <Image src={coin.image.large} alt={coin.name} width={56} height={56} style={{ width: 'auto', height: 'auto' }} />
            <div className="info">
              <p>
                {coin.name} / {coin.symbol.toUpperCase()}
              </p>
              <h1>{formatCurrency(coin.market_data.current_price.usd)}</h1>
            </div>
          </div>
        </CandlestickChart>
      </div>
    );
  } catch (error) {
    console.error('Error fetching coin overview:', error);
    return <CoinOverviewFallback />;
  }
};

export default CoinOverview;