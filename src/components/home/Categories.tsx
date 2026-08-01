import { fetcher } from '@/lib/coingecko.actions';
import DataTable from '@/components/DataTable';
import Image from 'next/image';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CategoriesFallback } from './fallback';

const Categories = async () => {
  try {
    const categories = await fetcher<Category[]>('/coins/categories');

    const normalizedCategories = categories?.filter(
      (category): category is Category => Boolean(category) && Array.isArray(category.top_3_coins),
    );

    if (!Array.isArray(categories) || categories.some((category) => !category || !Array.isArray(category.top_3_coins))) {
      throw new Error('Malformed category data');
    }

    const columns: (DataTableColumn<Category> & ({ id: string | number } | { key: string | number }))[] = [
      { id: 'category', header: 'Category', cellClassName: 'category-cell', cell: (category) => category.name },
      {
        id: 'top-gainers',
        header: 'Top Coins',
        cellClassName: 'top-gainers-cell',
        cell: (category) =>
            category.top_3_coins.map((coin) => (
            <Image src={coin} alt="" key={coin} width={28} height={28} style={{ width: 'auto', height: 'auto' }} />
          )),
      },
      {
        id: 'change-24h',
        header: '24h Change',
        cellClassName: 'change-header-cell',
        cell: (category) => {
          const change = category.market_cap_change_24h;
          const isTrendingUp = change > 0;
          const isNeutral = change === 0;

          return (
            <div className={cn('change-cell', isTrendingUp ? 'text-green-500' : isNeutral ? 'text-gray-400' : 'text-red-500')}>
              <p className="flex items-center">
                {formatPercentage(change)}
                {isTrendingUp ? (
                  <TrendingUp width={16} height={16} />
                ) : isNeutral ? null : (
                  <TrendingDown width={16} height={16} />
                )}
              </p>
            </div>
          );
        },
      },
      {
        id: 'market-cap',
        header: 'Market Cap',
        cellClassName: 'market-cap-cell',
        cell: (category) => formatCurrency(category.market_cap),
      },
      {
        id: 'volume-24h',
        header: '24h Volume',
        cellClassName: 'volume-cell',
        cell: (category) => formatCurrency(category.volume_24h),
      },
    ];

    return (
      <div id="categories" className="custom-scrollbar">
        <h4>Top Categories</h4>

        <DataTable
          columns={columns}
          data={categories?.slice(0, 30)}
          rowKey={(_, index) => index}
          tableClassName="mt-3"
        />
      </div>
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return <CategoriesFallback />;
  }
};

export default Categories;