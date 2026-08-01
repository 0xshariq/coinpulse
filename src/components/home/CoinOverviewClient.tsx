"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import CandlestickChart from '@/components/CandlestickChart';
import { formatCurrency } from '@/lib/utils';

type Props = {
  coinsData: Record<string, { coin: CoinDetailsData; ohlc: OHLCData[] }>;
};

const CoinOverviewClient: React.FC<Props> = ({ coinsData }) => {
  const ids = Object.keys(coinsData);
  const [selected, setSelected] = useState<string>(ids[0] ?? 'bitcoin');
  const [liveInterval, setLiveInternal] = useState<'1s' | '1m'>('1m');

  const active = coinsData[selected];
  if (!active) return null;

  return (
    <div id="coin-overview-client">
      <div className="tabs flex gap-2 mb-4">
        {ids.map((id) => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`px-3 py-1 rounded ${selected === id ? 'bg-slate-800 text-white' : 'bg-transparent text-slate-400'}`}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      <CandlestickChart data={active.ohlc} coinId={selected} liveInterval={liveInterval} setLiveInterval={setLiveInternal}>
        <div className="header pt-2 flex items-center gap-3">
          <Image src={active.coin.image.large} alt={active.coin.name} width={56} height={56} style={{ width: 'auto', height: 'auto' }} />
          <div className="info">
            <p>
              {active.coin.name} / {active.coin.symbol.toUpperCase()}
            </p>
            <h1>{formatCurrency(active.coin.market_data.current_price.usd)}</h1>
          </div>
        </div>
      </CandlestickChart>
    </div>
  );
};

export default CoinOverviewClient;
