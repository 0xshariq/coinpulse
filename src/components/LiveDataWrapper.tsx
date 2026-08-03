'use client';

import { Separator } from '@/components/ui/separator';
import CandlestickChart from '@/components/CandlestickChart';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';
import DataTable from '@/components/DataTable';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { useState } from 'react';
import CoinHeader from '@/components/CoinHeader';

const LiveDataWrapper = ({ children, coinId, binanceSymbol, coin, coinOHLCData }: LiveDataProps) => {
  const [liveInterval, setLiveInterval] = useState<'1s' | '1m'>('1s');
  const { trades, ohlcv, price, bookTicker, isConnected, isAvailable } = useBinanceWebSocket({
    symbol: binanceSymbol,
    liveInterval,
  });

  const tradeColumns: (DataTableColumn<Trade> & ({ id: string | number } | { key: string | number }))[] = [
    {
      id: 'price',
      header: 'Price',
      cellClassName: 'price-cell',
      cell: (trade) => (trade.price ? formatCurrency(trade.price) : '-'),
    },
    {
      id: 'amount',
      header: 'Amount',
      cellClassName: 'amount-cell',
      cell: (trade) => trade.amount?.toFixed(4) ?? '-',
    },
    {
      id: 'value',
      header: 'Value',
      cellClassName: 'value-cell',
      cell: (trade) => (trade.value ? formatCurrency(trade.value) : '-'),
    },
    {
      id: 'type',
      header: 'Buy/Sell',
      cellClassName: 'type-cell',
      cell: (trade) => (
        <span className={trade.type === 'b' ? 'text-green-500' : 'text-red-500'}>
          {trade.type === 'b' ? 'Buy' : 'Sell'}
        </span>
      ),
    },
    {
      id: 'time',
      header: 'Time',
      cellClassName: 'time-cell',
      cell: (trade) => (trade.timestamp ? timeAgo(trade.timestamp) : '-'),
    },
  ];

  const exchangeColumns: (DataTableColumn<Ticker> & ({ id: string | number } | { key: string | number }))[] = [
    {
      id: 'exchange',
      header: 'Exchange',
      cell: (ticker) => ticker.market.name,
    },
    {
      id: 'pair',
      header: 'Pair',
      cell: (ticker) => `${ticker.base.toUpperCase()} / ${ticker.target.toUpperCase()}`,
    },
    {
      id: 'price',
      header: 'Price',
      cell: (ticker) => formatCurrency(ticker.converted_last.usd),
    },
    {
      id: 'last-traded',
      header: 'Last Traded',
      cell: (ticker) => timeAgo(ticker.timestamp),
    },
  ];

  const orderBookRows = bookTicker
    ? [
        { side: 'Bid', price: bookTicker.bidPrice, amount: bookTicker.bidQuantity },
        { side: 'Ask', price: bookTicker.askPrice, amount: bookTicker.askQuantity },
      ]
    : [];
  const orderBookColumns: (DataTableColumn<(typeof orderBookRows)[number]> & ({ id: string | number } | { key: string | number }))[] = [
    {
      id: 'side',
      header: 'Side',
      cell: (row) => <span className={row.side === 'Bid' ? 'text-green-500' : 'text-red-500'}>{row.side}</span>,
    },
    {
      id: 'price',
      header: 'Price',
      cell: (row) => formatCurrency(row.price),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: (row) => row.amount.toFixed(6),
    },
  ];

  return (
    <section id="live-data-wrapper">
      <CoinHeader
        name={coin.name}
        description={coin.description.en}
        image={coin.image.large}
        livePrice={price?.usd ?? coin.market_data.current_price.usd}
        livePriceChangePercentage24h={
          price?.change24h ?? coin.market_data.price_change_percentage_24h_in_currency.usd
        }
        priceChangePercentage30d={coin.market_data.price_change_percentage_30d_in_currency.usd}
        priceChange24h={price?.priceChange24h ?? coin.market_data.price_change_24h_in_currency.usd}
      />
      <Separator className="divider" />

      <p className="px-1 text-xs text-purple-100/60" aria-live="polite">
        {isAvailable === false
          ? `Live Binance data is unavailable for ${binanceSymbol.toUpperCase()}USDT; showing CoinGecko data.`
          : isConnected
            ? `Live market data from Binance: ${binanceSymbol.toUpperCase()}USDT`
            : 'Reconnecting to Binance live market data…'}
      </p>

      <div className="trend">
        <CandlestickChart
          coinId={coinId}
          data={coinOHLCData}
          liveOhlcv={ohlcv}
          mode="live"
          initialPeriod="daily"
          liveInterval={liveInterval}
          setLiveInterval={setLiveInterval}
        >
          <h4>Trend Overview</h4>
        </CandlestickChart>
      </div>

      <Separator className="divider" />

      {tradeColumns && (
        <div className="trades">
          <h4>Recent Trades</h4>

          <DataTable
            columns={tradeColumns}
            data={trades}
            rowKey={(_, index) => index}
            tableClassName="trades-table"
          />
        </div>
      )}

      {coin.tickers.length > 0 && (
        <>
          <Separator className="divider" />

          <div className="trades">
            {children || <h4>Exchange Listings</h4>}

            <DataTable
              columns={exchangeColumns}
              data={coin.tickers.slice(0, 10)}
              rowKey={(ticker, index) => `${ticker.market.name}-${ticker.trade_url || index}`}
              tableClassName="trades-table"
            />
          </div>
        </>
      )}

      {orderBookRows.length > 0 && (
        <>
          <Separator className="divider" />

          <div className="trades">
            <h4>Binance Order Book</h4>

            <DataTable
              columns={orderBookColumns}
              data={orderBookRows}
              rowKey={(row) => row.side}
              tableClassName="trades-table"
            />
          </div>
        </>
      )}
    </section>
  );
};

export default LiveDataWrapper;
