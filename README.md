# CryptoPulse — Analytics Dashboard

CryptoPulse is a lightweight, high-performance crypto analytics dashboard built with Next.js 16, TypeScript and Tailwind CSS. It combines CoinGecko REST APIs with Binance public WebSocket streams and the TradingView Lightweight Charts library to deliver historical OHLCV visualizations and low-latency live market data.

This README explains the project goals, architecture, data flow, critical implementation details, local setup, and troubleshooting tips.

---

## Overview

- Purpose: provide an extensible, developer-friendly dashboard for exploring crypto markets — live prices, candlestick charts, recent trades, converters and token details.
- Primary data sources: CoinGecko REST API (historical & market data) and Binance's public Spot WebSocket feed for live prices, trades, and candles.
- Key UX goals: fast initial render using server components, smooth client-side interactivity for charts and live updates, and keeping sensitive API keys on the server.

---

## Why this is a hybrid data architecture

CryptoPulse deliberately uses two providers because they solve different parts of the product well:

| Provider | Used for | Why |
| --- | --- | --- |
| CoinGecko REST | coin metadata, rankings, market cap, categories, trending coins, conversion prices, and historical OHLC data | CoinGecko aggregates broad market information that is not tied to one exchange. |
| Binance public WebSocket | live price, 24-hour price change, recent Binance trades, and the active live candle | Binance streams public Spot market events with low latency and needs no API key. |

This keeps the rich discovery and analytics features already provided by CoinGecko while avoiding CoinGecko's paid WebSocket requirement. The trade-off is intentional: Binance live values describe activity on Binance's USDT Spot market, whereas CoinGecko REST values are aggregated across supported exchanges. A small difference between the initial CoinGecko price and a subsequent Binance live price is therefore expected.

### How the live detail page works

1. The server renders `/coins/[id]` with CoinGecko metadata, a REST price snapshot, and historical OHLC candles.
2. The client derives a Binance Spot pair from the CoinGecko ticker, such as `btc` → `BTCUSDT`.
3. `useBinanceWebSocket` opens one combined connection for `<pair>@ticker`, `<pair>@aggTrade`, and `<pair>@kline_<interval>`.
4. Incoming Binance messages are normalized into the existing `price`, `trades`, and `ohlcv` UI shapes. The live price replaces the initial snapshot, recent trades populate the table, and the newest Binance candle is merged into the rendered chart.
5. If Binance does not provide that USDT pair, the app shows an availability notice and retains the CoinGecko REST data; it does not fail the page.

The browser connects directly to Binance because these are public market streams. No Binance API key, secret, account permission, or server proxy is needed. CoinGecko credentials remain server-only and are never exposed to the browser.

### Implemented live-data coverage

- **Home overview:** switching among Bitcoin, Ethereum, and Solana resets the chart to the selected asset and streams its current Binance price and live candle.
- **All Coins and Trending Coins:** each table starts with its server-rendered CoinGecko data, then overlays matching Binance USDT-pair prices and 24-hour changes from a combined ticker connection. Updates are batched once per animation frame to keep rendering smooth.
- **Coin detail page:** the header, recent trades, absolute and percentage 24-hour change, and live candle update from Binance. The server also fetches a cached Binance 24-hour ticker snapshot for high, low, quote volume, and trade-count details.
- **Descriptions and fallbacks:** long descriptions are reduced to four complete sentences. If a coin has no matching Binance USDT market, the interface continues to show its CoinGecko data instead of failing.

The live `1s` setting uses Binance's second-level kline stream. Historical candles continue to come from CoinGecko, so the newest exchange candle can differ slightly from the aggregated historical market value.

---

## Architecture and how it works (deep dive)

1) Server / Client split

- The app uses Next.js App Router and embraces server components for data fetching and fast SSR. Pages and components that require server-only secrets or heavy data fetching live on the server (examples: `/app/coins/[id]/page.tsx`, `src/components/home/CoinOverview.tsx`).
- Interactive UI (charts, live updates, trade tables) are implemented as client components (example: `src/components/CandlestickChart.tsx`, `src/components/LiveDataWrapper.tsx`) using React hooks and browser APIs.

1) REST + proxy pattern

- Server code calls CoinGecko using a small wrapper `fetcher` in `src/lib/coingecko.actions.ts` which attaches the `COINGECKO_API_KEY` and handles errors.
- To avoid shipping secret keys and to centralize allowed query parameters, the app exposes a secure server proxy endpoint `/api/ohlc` (see `src/app/api/ohlc/route.ts`). Client-side requests for OHLC data call this route — the server then calls CoinGecko and returns JSON.

1) Binance WebSockets for live data

 - Live trades, tick prices and streaming OHLC updates are handled by `useBinanceWebSocket` in `src/hooks/useBinanceWebSocket.ts` (client-side). It opens one combined public Binance Spot stream per coin detail page for `ticker`, `aggTrade`, and `kline` events; no Binance API key is required.
 - `LiveDataWrapper` wires WebSocket data into the UI and passes the live `ohlcv` datapoint to `CandlestickChart` to merge live ticks with historical candles.

1) Charts and data flow

- Historical OHLC data is fetched server-side for initial render and passed into `CandlestickChart` as props. The chart converts OHLC arrays into the shape required by Lightweight Charts and renders them.
- Period switches (daily/weekly/etc.) trigger a client fetch to `/api/ohlc` so the chart updates without a full page reload. The API route validates and forwards the request to CoinGecko.
- Live updates merge an incoming OHLC tick with the historical series and call `series.setData(...)` to update the chart in-place for smooth animations.

1) Error handling and resilience

- Server fetching uses try/catch. If OHLC fails, the server returns the page with an empty array and the chart renders a fallback state (no crash).
- Client fetches to `/api/ohlc` will surface errors to console and leave the previous chart data intact.

---

## Important files (map)

- `src/lib/coingecko.actions.ts` — server fetch helper, attaches API key.
- `src/app/api/ohlc/route.ts` — server proxy for OHLC client requests.
- `src/hooks/useBinanceWebSocket.ts` — client WebSocket hook for live updates.
- `src/hooks/useBinanceTickers.ts` — batched client WebSocket hook for live table prices.
- `src/lib/binance.actions.ts` — cached public Binance 24-hour ticker snapshot.
- `src/components/CandlestickChart.tsx` — client chart component using Lightweight Charts.
- `src/components/LiveDataWrapper.tsx` — integrates websocket data, trades table, and chart.
- `src/app/coins/[id]/page.tsx` — token detail page: server-rendered coin data + OHLC initial fetch.

---

## Local setup

1. Install dependencies

```bash
pnpm install
```

1. Environment

Create `.env.local` with:

```env
COINGECKO_BASE_URL=https://pro-api.coingecko.com/api/v3
COINGECKO_API_KEY=your_key_here

```

1. Run

```bash
pnpm dev
```

Open <http://localhost:3000>

---

## Troubleshooting & common errors

- "API Error: 400: invalid interval parameter": caused by sending unsupported query params (e.g. `interval` or `precision`) to the OHLC endpoint. Fix: only pass `vs_currency` and `days` (the app includes a server proxy that enforces this).
- "Functions cannot be passed directly to Client Components": occurs when a server component returns a function prop. Fix: pass only serializable props to client components. `setLiveInterval` is provided from a client wrapper (`LiveDataWrapper`) — server-only pages should not pass functions.
- Next/Image aspect ratio warnings: ensure you provide styles like `style={{ width: 'auto', height: 'auto' }}` when you manipulate one dimension via CSS.

---

## Performance and caching notes

- Server-side caching (what I added): `/api/ohlc` now sets `Cache-Control` headers based on the requested range (short TTL for 1D, longer for historical). This reduces duplicate requests to CoinGecko and lowers rate usage.
- Client-side cache & loading (what I added): `CandlestickChart` now keeps a per-session in-memory cache keyed by `coinId-days` so repeated period switches during a session will use cached data when valid. It also shows a small spinner and disables period/interval buttons while fetching new OHLC data.
- Keep WebSockets on the client — they are low-latency and avoid server-side connection churn.

---

## Testing / Validation

- Manual: run `pnpm dev` and inspect the following pages for console/server errors: home, `/coins/bitcoin`, and any coin detail page.
- Automated: add lightweight unit tests around `src/lib/utils.ts` and an integration test for the `/api/ohlc` route using a mocked `fetcher`.

---

## Contributing / Next improvements

- Add request caching and rate-limit handling for the proxy endpoint.
- Add UI loading/error states for period switches and websocket reconnection status.
- Add E2E tests with Playwright to validate live data flows and chart updates.
