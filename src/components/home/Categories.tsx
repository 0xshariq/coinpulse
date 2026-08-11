import { fetcher } from '@/lib/coingecko.actions';
import DataTable from '@/components/DataTable';
import Image from 'next/image';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CategoriesFallback } from './fallback';

const Categories = async () => {
  try {
    const categories = await fetcher<Category[]>('/coins/categories');

    if (!Array.isArray(categories) || categories.length === 0) {
      return <CategoriesFallback />;
    }

    // Filter to only valid categories, logging any malformed ones
    const validCategories = categories.filter((category) => {
      if (!category) {
        console.warn('[Categories] Skipping null/undefined category');
        return false;
      }

      if (!Array.isArray(category.top_3_coins)) {
        console.warn('[Categories] Skipping category with malformed top_3_coins:', category.name);
        return false;
      }

      if (
        typeof category.market_cap_change_24h !== 'number' ||
        !Number.isFinite(category.market_cap_change_24h)
      ) {
        console.warn(
          '[Categories] Skipping category with invalid market_cap_change_24h:',
          category.name,
        );
        return false;
      }

      return true;
    });

    if (validCategories.length === 0) {
      console.warn('[Categories] No valid categories found');
      return <CategoriesFallback />;
    }

    const columns: (DataTableColumn<Category> &
      ({ id: string | number } | { key: string | number }))[] = [
      {
        id: 'category',
        header: 'Category',
        cellClassName: 'category-cell',
        cell: (category) => category.name,
      },
      {
        id: 'top-gainers',
        header: 'Top Coins',
        cellClassName: 'top-gainers-cell',
        cell: (category) =>
          category.top_3_coins.map((coin) => (
            <Image
              src={coin}
              alt=""
              key={coin}
              width={28}
              height={28}
              style={{ width: 'auto', height: 'auto' }}
            />
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
            <div
              className={cn(
                'change-cell',
                isTrendingUp ? 'text-green-500' : isNeutral ? 'text-gray-400' : 'text-red-500',
              )}
            >
              <p className="flex items-center">
                {formatPercentage(change)}
                {isTrendingUp ? (
                  <TrendingUp width={16} height={16} className="ml-1" />
                ) : isNeutral ? null : (
                  <TrendingDown width={16} height={16} className="ml-1" />
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
        cell: (category) => `$${category.market_cap}`,
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
          data={validCategories.slice(0, 15)}
          rowKey={(_, index) => index}
          tableClassName="mt-3"
        />
      </div>
    );
  } catch (error) {
    console.error('[Categories] Error fetching categories:', error);
    return <CategoriesFallback />;
  }
};

export default Categories;
