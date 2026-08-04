'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import CandlestickChart from '@/components/CandlestickChart';
import { formatCurrency } from '@/lib/utils';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';

type Props = {
  coinsData: Record<string, { coin: CoinDetailsData; ohlc: OHLCData[] }>;
};

const CoinOverviewClient: React.FC<Props> = ({ coinsData }) => {
  const ids = Object.keys(coinsData);
  const [selected, setSelected] = useState<string>(ids[0] ?? 'bitcoin');
  const [liveInterval, setLiveInternal] = useState<'1s' | '1m'>('1m');

  const active = coinsData[selected];
  const { price, ohlcv } = useBinanceWebSocket({
    symbol: active?.coin.symbol ?? '',
    liveInterval,
  });

  if (!active) return null;

  return (
    <div id="coin-overview-client" className="w-full lg:col-span-2 xl:col-span-2">
      <div className="tabs flex gap-2 mb-4">
        {ids.map((id) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`px-3 py-1 rounded ${selected === id ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400'}`}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      <CandlestickChart
        key={selected}
        data={active.ohlc}
        coinId={selected}
        liveOhlcv={ohlcv}
        mode="live"
        liveInterval={liveInterval}
        setLiveInterval={setLiveInternal}
      >
        <div className="header pt-2 flex items-center gap-3">
          <Image
            src={active.coin.image.large}
            alt={active.coin.name}
            width={56}
            height={56}
            style={{ width: 'auto', height: 'auto' }}
          />
          <div className="info">
            <p className="whitespace-nowrap">
              <span className="font-semibold text-sm md:text-base">{active.coin.name}</span>
              <span className="ml-2 text-xs md:text-sm text-purple-100/70">
                / {active.coin.symbol.toUpperCase()}
              </span>
            </p>
            <h1 className="text-xl md:text-2xl">
              {formatCurrency(price?.usd ?? active.coin.market_data.current_price.usd)}
            </h1>
          </div>
        </div>
      </CandlestickChart>
    </div>
  );
};

export default CoinOverviewClient;
