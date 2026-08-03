'use client';

import DataTable from '@/components/DataTable';
import { useBinanceTickers } from '@/hooks/useBinanceTickers';
import { getBinanceUsdtPair } from '@/lib/binance';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const TrendingCoinsClient = ({ coins }: { coins: TrendingCoin[] }) => {
  const tickers = useBinanceTickers(coins.map((coin) => coin.item.symbol));

  const columns: (DataTableColumn<TrendingCoin> & ({ id: string | number } | { key: string | number }))[] = [
    {
      id: 'name',
      header: 'Name',
      cellClassName: 'name-cell',
      cell: (coin) => {
        const coinData = coin.item;
        return (
          <Link href={`/coins/${coinData.id}`}>
            <Image src={coinData.large} alt={coinData.name} width={36} height={36} style={{ width: 'auto', height: 'auto' }} />
            <p className="whitespace-nowrap">
              <span className="font-semibold text-sm md:text-base">{coinData.name}</span>
              <span className="ml-2 text-xs md:text-sm text-purple-100/70">/ {coinData.symbol.toUpperCase()}</span>
            </p>
          </Link>
        );
      },
    },
    {
      id: 'description',
      header: 'Description',
      cellClassName: 'description-cell',
      cell: (coin) => (
        <p className="line-clamp-3 text-sm text-slate-400 leading-6">
          {coin.item.data.content?.description || 'No description available.'}
        </p>
      ),
    },
    {
      id: 'change-24h',
      header: '24h Change',
      cellClassName: 'change-cell',
      cell: (coin) => {
        const coinData = coin.item;
        const live = tickers.get(getBinanceUsdtPair(coinData.symbol) ?? '');
        const change = live?.change24h ?? coinData.data.price_change_percentage_24h.usd;
        const isTrendingUp = change > 0;

        return (
          <div className={cn('price-change', isTrendingUp ? 'text-green-500' : 'text-red-500')}>
            <p className="flex items-center">
              {formatPercentage(change)}
              {isTrendingUp ? <TrendingUp width={16} height={16} className="ml-1" /> : <TrendingDown width={16} height={16} className="ml-1" />}
            </p>
          </div>
        );
      },
    },
    {
      id: 'market-cap-rank',
      header: 'Market Cap Rank',
      cellClassName: 'market-cap-cell',
      cell: (coin) => formatCurrency(coin.item.market_cap_rank),
    },
    {
      id: 'price',
      header: 'Price',
      cellClassName: 'price-cell',
      cell: (coin) => {
        const live = tickers.get(getBinanceUsdtPair(coin.item.symbol) ?? '');
        return formatCurrency(live?.price ?? coin.item.data.price);
      },
    },
  ];

  return (
    <DataTable
      data={coins}
      columns={columns}
      rowKey={(coin) => coin.item.id}
      tableClassName="trending-coins-table"
      headerCellClassName="py-3!"
      bodyCellClassName="py-2!"
    />
  );
};

export default TrendingCoinsClient;
