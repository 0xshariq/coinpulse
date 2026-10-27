import { fetcher } from '@/lib/coingecko.actions';
import type { Metadata } from 'next';
import { getBinanceTicker } from '@/lib/binance.actions';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import LiveDataWrapper from '@/components/LiveDataWrapper';
import Converter from '@/components/Converter';
const isSafeExternalUrl = (value: string | undefined): value is string => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export async function generateMetadata({ params }: NextPageProps): Promise<Metadata> {
  const { id } = await params;
  const coinData = await fetcher<CoinDetailsData>(`/coins/${id}`, {
    dex_pair_format: 'contract_address',
  }).catch(() => null);

  if (!coinData) {
    return {
      title: 'Coin Not Found',
      description: 'The coin you are looking for does not exist on CoinPulse.',
      alternates: { canonical: `/coins/${encodeURIComponent(id)}` },
    };
  }

  const title = `${coinData.name} (${coinData.symbol.toUpperCase()})`;
  const description = coinData.description?.en
    ? coinData.description.en.replace(/<[^>]*>/g, '').slice(0, 160)
    : `Get live price, charts, and market data for ${coinData.name}.`;
  const image = coinData.image?.large || coinData.image?.small || '/og-image.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: image, alt: coinData.name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    alternates: { canonical: `/coins/${encodeURIComponent(id)}` },
  };
}

const Page = async ({ params }: NextPageProps) => {
  const { id } = await params;

  const coinData = await fetcher<CoinDetailsData>(`/coins/${id}`, {
    dex_pair_format: 'contract_address',
  });

  // The OHLC endpoint does not accept `interval` or `precision` query params.
  // Request only supported params and fail gracefully if OHLC fetch fails.
  const [coinOHLCData, binanceTicker] = await Promise.all([
    fetcher<OHLCData[]>(`/coins/${id}/ohlc`, {
      vs_currency: 'usd',
      days: 1,
    }).catch((err) => {
      console.warn('Failed to fetch coin OHLC data for', id, err);
      return [] as OHLCData[];
    }),
    getBinanceTicker(coinData.symbol),
  ]);

  const coinDetails = [
    {
      label: 'Market Cap',
      value: formatCurrency(coinData.market_data.market_cap.usd),
    },
    {
      label: 'Market Cap Rank',
      value: `# ${coinData.market_cap_rank}`,
    },
    {
      label: 'Total Volume',
      value: formatCurrency(coinData.market_data.total_volume.usd),
    },
    ...(binanceTicker
      ? [
          {
            label: 'Binance Pair',
            value: binanceTicker.symbol,
          },
          {
            label: 'Binance 24h High (snapshot)',
            value: formatCurrency(Number(binanceTicker.highPrice)),
          },
          {
            label: 'Binance 24h Low (snapshot)',
            value: formatCurrency(Number(binanceTicker.lowPrice)),
          },
          {
            label: 'Binance 24h Volume (snapshot)',
            value: formatCurrency(Number(binanceTicker.quoteVolume)),
          },
          {
            label: 'Binance Trades (24h) (snapshot)',
            value: binanceTicker.count.toLocaleString('en-US'),
          },
        ]
      : []),
    {
      label: 'Website',
      value: '-',
      link: coinData.links.homepage[0],
      linkText: 'Homepage',
    },
    {
      label: 'Explorer',
      value: '-',
      link: coinData.links.blockchain_site[0],
      linkText: 'Explorer',
    },
    {
      label: 'Community',
      value: '-',
      link: coinData.links.subreddit_url,
      linkText: 'Community',
    },
  ];

  return (
    <main id="coin-details-page">
      <section className="primary">
        <LiveDataWrapper
          coinId={id}
          binanceSymbol={coinData.symbol}
          coin={coinData}
          coinOHLCData={coinOHLCData}
        >
          <h4>Exchange Listings</h4>
        </LiveDataWrapper>
      </section>

      <section className="secondary">
        <Converter
          symbol={coinData.symbol}
          icon={coinData.image.small}
          priceList={coinData.market_data.current_price}
        />

        <div className="details">
          <h4>Coin Details</h4>

          <ul className="details-grid">
            {coinDetails.map(({ label, value, link, linkText }, index) => (
              <li key={index} className="overflow-auto">
                <p className={label}>{label}</p>

                {isSafeExternalUrl(link) ? (
                  <div className="link">
                    <Link href={link} target="_blank" rel="noopener noreferrer">
                      {linkText || label}
                    </Link>
                    <ArrowUpRight size={16} />
                  </div>
                ) : (
                  <p className="text-base font-medium">{value}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};
export default Page;
