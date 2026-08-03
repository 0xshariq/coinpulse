import { fetcher } from '@/lib/coingecko.actions';
import { TrendingCoinsFallback } from './fallback';
import TrendingCoinsClient from './TrendingCoinsClient';

const TrendingCoins = async () => {
  let trendingCoins: { coins: TrendingCoin[] } | null = null;

  try {
    trendingCoins = await fetcher<{ coins: TrendingCoin[] }>('/search/trending', undefined, 300);
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return <TrendingCoinsFallback />;
  }

  if (!trendingCoins) return <TrendingCoinsFallback />;

  return (
    <div id="trending-coins" className="w-full">
      <h4>Trending Coins</h4>

      <TrendingCoinsClient coins={trendingCoins.coins.slice(0, 6) || []} />
    </div>
  );
};

export default TrendingCoins;
