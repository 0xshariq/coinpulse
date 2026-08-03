import { fetcher } from "@/lib/coingecko.actions";
import CoinsClient from '@/components/CoinsClient';

const Coins = async () => {

  const coinsData = await fetcher<CoinMarketData[]>("/coins/markets", {
    vs_currency: "usd",
    order: "market_cap_desc",
    sparkline: "false",
    price_change_percentage: "24h",
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
