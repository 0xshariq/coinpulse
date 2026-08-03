'use client';

import DataTable from '@/components/DataTable';
import { useBinanceTickers } from '@/hooks/useBinanceTickers';
import { getBinanceUsdtPair } from '@/lib/binance';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

const CoinsClient = ({ coins }: { coins: CoinMarketData[] }) => {
  const tickers = useBinanceTickers(coins.map((coin) => coin.symbol));

  const columns: (DataTableColumn<CoinMarketData> & ({ id: string | number } | { key: string | number }))[] = [
    {
      id: 'rank',
      header: 'Rank',
      cellClassName: 'rank-cell',
      cell: (coin) => (
        <>
          #{coin.market_cap_rank}
          <Link href={`/coins/${coin.id}`} aria-label="View coin" />
        </>
      ),
    },
    {
      id: 'token',
      header: 'Token',
      cellClassName: 'token-cell',
      cell: (coin) => (
        <div className="token-info">
          <Image src={coin.image} alt={coin.name} width={36} height={36} />
          <p>
            {coin.name} ({coin.symbol.toUpperCase()})
          </p>
        </div>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      cellClassName: 'price-cell',
      cell: (coin) => {
        const live = tickers.get(getBinanceUsdtPair(coin.symbol) ?? '');
        const value = live?.price ?? coin.current_price;
        return formatCurrency(value, value < 0.01 ? 6 : 2);
      },
    },
    {
      id: 'change-24h',
      header: '24h Change',
      cellClassName: 'change-cell',
      cell: (coin) => {
        const live = tickers.get(getBinanceUsdtPair(coin.symbol) ?? '');
        const change = live?.change24h ?? coin.price_change_percentage_24h;
        const isTrendingUp = change > 0;

        return (
          <span
            className={cn('change-value', {
              'text-green-600': isTrendingUp,
              'text-red-500': !isTrendingUp,
            })}
          >
            {isTrendingUp && '+'}
            {formatPercentage(change)}
          </span>
        );
      },
    },
    {
      id: 'market-cap',
      header: 'Market Cap',
      cellClassName: 'market-cap-cell',
      cell: (coin) => formatCurrency(coin.market_cap),
    },
  ];

  return <DataTable tableClassName="coins-table" columns={columns} data={coins} rowKey={(coin) => coin.id} />;
};

export default CoinsClient;
