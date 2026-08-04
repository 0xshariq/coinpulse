import { fetcher } from '@/lib/coingecko.actions';
import CoinsClient from '@/components/CoinsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Coins | CoinPulse',
  description:
    'Browse the complete list of cryptocurrencies with live prices, 24h changes, market cap, and volume on CoinPulse.',
  openGraph: {
    title: 'All Coins | CoinPulse',
    description:
      'Browse the complete list of cryptocurrencies with live prices, 24h changes, market cap, and volume on CoinPulse.',
    type: 'website',
    url: 'https://coinpulse.vercel.app/coins',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Coins | CoinPulse',
    description:
      'Browse the complete list of cryptocurrencies with live prices, 24h changes, market cap, and volume on CoinPulse.',
  },
  alternates: {
    canonical: 'https://coinpulse.vercel.app/coins',
  },
};

const Coins = async () => {
  const coinsData = await fetcher<CoinMarketData[]>('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    sparkline: 'false',
    price_change_percentage: '24h',
  });

  return (
    <main id="coins-page">
      <div className="content">
        <h4>All Coins</h4>

        <CoinsClient coins={coinsData} />
      </div>
    </main>
  );
};

export default Coins;
