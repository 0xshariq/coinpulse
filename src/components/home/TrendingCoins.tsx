import { fetcher } from '@/lib/coingecko.actions';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import DataTable from '@/components/DataTable';
import { TrendingCoinsFallback } from './fallback';

const TrendingCoins = async () => {
  let trendingCoins: { coins: TrendingCoin[] } | null = null;

  try {
    trendingCoins = await fetcher<{ coins: TrendingCoin[] }>('/search/trending', undefined, 300);
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return <TrendingCoinsFallback />;
  }

  if (!trendingCoins) return <TrendingCoinsFallback />;


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
      cell: (coin) => {
        const coinData = coin.item;
        return (
          <p className="line-clamp-3 text-sm text-slate-400 leading-6">
            {coinData.data.content?.description || 'No description available.'}
          </p>
        );
      }
    },
    {
      id: 'change-24h',
      header: '24h Change',
      cellClassName: 'change-cell',
      cell: (coin) => {
        const coinData = coin.item;
        const isTrendingUp = coinData.data.price_change_percentage_24h.usd > 0;

        return (
          <div className={cn('price-change', isTrendingUp ? 'text-green-500' : 'text-red-500')}>
            <p className="flex items-center">
              {formatPercentage(coinData.data.price_change_percentage_24h.usd)}
              {isTrendingUp ? (
                <TrendingUp width={16} height={16} className='ml-1' />
              ) : (
                <TrendingDown width={16} height={16} className='ml-1' />
              )}
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
      cell: (coin) => formatCurrency(coin.item.data.price),
    },
  ];

  return (
    <div id="trending-coins" className="w-full">
      <h4>Trending Coins</h4>

      <DataTable
        data={trendingCoins.coins.slice(0, 6) || []}
        columns={columns}
        rowKey={(coin) => coin.item.id}
        tableClassName="trending-coins-table"
        headerCellClassName="py-3!"
        bodyCellClassName="py-2!"
      />
    </div>
  );
};

export default TrendingCoins;