# CoinPulse - Live Cryptocurrency Dashboard

A lightweight, high-performance cryptocurrency dashboard with real-time price tracking, interactive charts, and live market data powered by CoinGecko and Binance.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [File Reference](#file-reference)
- [API Routes](#api-routes)
- [WebSocket Integration](#websocket-integration)
- [Data Flow](#data-flow)
- [Performance Optimizations](#performance-optimizations)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

- **Live Price Tracking**: Real-time cryptocurrency prices via Binance WebSocket
- **Interactive Charts**: Lightweight-charts powered candlestick charts with multiple timeframes (1d, 7d, 30d, 90d, 180d, 365d, max)
- **Market Overview**: Trending coins, top categories, market statistics
- **Coin Search**: Debounced search with live Binance prices
- **Price Converter**: Convert between 50+ supported fiat currencies
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safe**: Full TypeScript with strict mode
- **Production Ready**: Error boundaries, loading states, fallbacks

## 🚀 Quick Start

### Prerequisites

- Node.js 20.9+ (for stability and compatibility)
- pnpm 9+ (enable Corepack: `corepack enable`)
- CoinGecko API key (free tier: 100 calls/minute, 10,000 monthly call-credits)

### Installation

```bash
# Clone repository
git clone https://github.com/0xshariq/coinpulse.git
cd coinpulse

# Enable Corepack for pnpm management
corepack enable

# Install dependencies
pnpm install

# Setup environment - copy example file
cp .env.example .env.local

# Edit .env.local and add your credentials:
# COINGECKO_API_KEY=your_api_key_here
# COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
nano .env.local

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

### High-Level System Diagram

```text
┌─────────────────────────────────────────────────────────┐
│              Browser (Client)                           │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   React UI     │  │ State (SWR)  │  │ WebSocket  │  │
│  │  Components    │  │              │  │  Manager   │  │
│  └────────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                        │
           │         HTTP           │    WebSocket
           ▼                        │       ▼
┌─────────────────────────────────┐│   ┌──────────────┐
│     Next.js Server              ││   │ Binance WS   │
│  ├─ Server Components           ││   │ (Real-time)  │
│  ├─ Route Handlers              ││   └──────────────┘
│  └─ Server Actions              │
└─────────────────────────────────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
  ┌────────┐  ┌──────────┐
  │CoinGecko│ │Binance   │
  │  API   │ │REST API  │
  └────────┘ └──────────┘
```

### Data Architecture

**Hybrid Provider Model:**

| Provider | Role | Data | Why |
|----------|------|------|-----|
| **CoinGecko** | Primary data source | Historical OHLC, market cap, rankings, metadata, categories | Comprehensive market-wide aggregation; free tier: 100 calls/min, 10,000 calls/month |
| **Binance WebSocket** | Real-time updates | Live prices, trades, candles (1s intervals) | Zero-latency public streams, no API key required |

**Key Insight:** CoinGecko REST data is market-wide aggregated (accurate but cached), while Binance streams show Binance Spot USDT pair activity (live but exchange-specific). Small price differences are expected and normal.

### Server/Client Split

```text
┌──────────────────────────────────────────────────────┐
│ SERVER COMPONENTS (Next.js)                          │
│ ├─ Fetch from CoinGecko (API key protected)          │
│ ├─ Pre-render pages with initial data                │
│ ├─ Cache metadata and historical data                │
│ └─ Pass data to client components                    │
└──────────────────────────────────────────────────────┘
                    │
                    │ (serialized props)
                    ▼
┌──────────────────────────────────────────────────────┐
│ CLIENT COMPONENTS (React)                            │
│ ├─ Subscribe to Binance WebSocket                    │
│ ├─ Update chart with live candles                    │
│ ├─ Handle user interactions                          │
│ └─ Manage client-side state with SWR                │
└──────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 20.9+ | Server runtime |
| **Framework** | Next.js 16 | React framework with SSR |
| **UI** | React 19 | Component library |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **Charts** | Lightweight-charts | High-performance charting |
| **State** | SWR | Client data fetching |
| **Types** | TypeScript 5 | Type safety |
| **Real-time** | Binance WebSocket | Live market data |
| **Components** | shadcn/ui | Pre-built UI kit |
| **Linting** | ESLint 9 + Prettier | Code quality |

## 📁 Project Structure

```
coinpulse/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout + metadata
│   │   ├── page.tsx                      # Home page
│   │   ├── coins/
│   │   │   ├── page.tsx                  # Coins listing
│   │   │   ├── loading.tsx               # Loading state
│   │   │   ├── error.tsx                 # Error boundary
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Coin detail
│   │   │       ├── loading.tsx           # Detail loading
│   │   │       └── error.tsx             # Detail error
│   │   └── api/
│   │       └── ohlc/route.ts             # OHLC data endpoint
│   │
│   ├── components/                       # React components
│   │   ├── home/
│   │   │   ├── Hero.tsx                  # Landing section
│   │   │   ├── TrendingCoins.tsx         # Trending coins
│   │   │   ├── Categories.tsx            # Market categories
│   │   │   └── MarketStats.tsx           # Statistics
│   │   ├── coins/
│   │   │   ├── CoinsTable.tsx            # Coins list
│   │   │   ├── CoinsClient.tsx           # Client wrapper
│   │   │   └── CoinDetail.tsx            # Detail view
│   │   ├── CandlestickChart.tsx          # Chart component
│   │   ├── Converter.tsx                 # Currency converter
│   │   ├── SearchModal.tsx               # Search interface
│   │   ├── Navbar.tsx                    # Navigation
│   │   ├── Footer.tsx                    # Footer
│   │   ├── ErrorBoundary.tsx             # Error boundary
│   │   ├── EmptyState.tsx                # Empty states
│   │   ├── LoadingSkeleton.tsx           # Loading skeleton
│   │   ├── LiveDataWrapper.tsx           # Live data provider
│   │   └── ui/                           # shadcn components
│   │
│   ├── lib/                              # Utilities and helpers
│   │   ├── utils.ts                      # Helper functions
│   │   ├── apiClient.ts                  # HTTP client
│   │   ├── coingeckoClient.ts            # CoinGecko client
│   │   ├── coingecko.actions.ts          # Server actions
│   │   ├── binance.ts                    # Binance helpers
│   │   ├── binance.actions.ts            # Binance server actions
│   │   ├── binanceWebSocketManager.ts    # WS manager
│   │   ├── boundedCache.ts               # LRU cache
│   │   ├── constants.ts                  # App constants
│   │   └── ...
│   │
│   └── hooks/                            # React hooks
│       ├── useBinancePrice.ts            # Price hook
│       ├── useBinanceWebSocket.ts        # WS hook
│       └── useBinanceTickers.ts          # Tickers hook
│
├── public/
│   ├── assets/                           # Images & SVGs
│   └── favicon.ico
│
└── Configuration files
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── eslint.config.mjs
    ├── .env.example
    └── pnpm-lock.yaml
```

## 📄 File Reference

### App Files

**`src/app/layout.tsx`** (111 lines)
- Root layout component with metadata
- Open Graph and Twitter card tags
- Dynamic title templates
- Navbar and Footer wrapper

**`src/app/page.tsx`** (60 lines)
- Home page server component
- Fetches trending coins and categories
- Hero section, market overview
- Static generation for performance

**`src/app/coins/page.tsx`** (60 lines)
- All coins listing page
- Server-side data fetching
- Dynamic metadata for SEO
- Error and loading states

**`src/app/coins/[id]/page.tsx`** (180 lines)
- Coin detail page
- Dynamic metadata generation with coin name/image
- Fetches coin data, OHLC, Binance ticker
- LiveDataWrapper for real-time updates

**`src/app/coins/[id]/error.tsx`** (50 lines)
- Error boundary for coin detail page
- Shows error message and retry button
- Graceful fallback UI

**`src/app/coins/[id]/loading.tsx`** (35 lines)
- Loading skeleton for coin detail
- Placeholder for chart, converter, table
- Smooth loading experience

**`src/app/api/ohlc/route.ts`** (65 lines)
- Server proxy for OHLC data
- Validates `coinId` and `days` parameters
- Enforces whitelist: 1, 7, 30, 90, 180, 365, max
- Returns HTTP cache headers (10s - 1hr TTL)

### Components

**`src/components/CandlestickChart.tsx`** (280 lines)
- Lightweight-charts integration
- State sync with coin/period changes
- Bounded cache (50 entries max)
- Live candle merging

**`src/components/SearchModal.tsx`** (200 lines)
- Debounced coin search (300ms)
- Live Binance price integration
- Keyboard navigation (arrows, enter, escape)
- Trending coins fallback

**`src/components/Converter.tsx`** (120 lines)
- Multi-currency conversion
- Fiat currency validation
- Safe error handling
- Real-time price updates

**`src/components/LiveDataWrapper.tsx`** (150 lines)
- WebSocket subscription management
- Price and change updates
- Trade table population
- Chart integration

**`src/components/ErrorBoundary.tsx`** (52 lines)
- React error boundary
- Graceful error display
- Retry mechanism

**`src/components/EmptyState.tsx`** (70 lines)
- Reusable empty state component
- Error state variant
- No data fallback

### Utilities

**`src/lib/utils.ts`** (270 lines)
- `formatCurrency()`: Safe currency formatting
- `formatPercentage()`: Percentage formatting
- `isFiniteNumber()`: Number validation
- `filterFiatCurrencies()`: Filter non-ISO codes
- `convertOHLCData()`: OHLC validation

**`src/lib/apiClient.ts`** (170 lines)
- Generic HTTP client
- 10-second timeout (configurable)
- Exponential backoff retry
- Structured error handling
- Rate-limit aware (Retry-After header)

**`src/lib/binanceWebSocketManager.ts`** (210 lines)
- Singleton WebSocket manager
- Connection pooling (100 streams max)
- Auto-reconnect with exponential backoff
- Subscription deduplication

**`src/lib/boundedCache.ts`** (210 lines)
- LRU cache with expiry
- Configurable max size (default: 50)
- TTL-based cleanup
- Storage persistence

### Hooks

**`src/hooks/useBinancePrice.ts`** (45 lines)
- Real-time price subscription
- Uses shared WebSocket manager
- Auto cleanup on unmount

**`src/hooks/useBinanceWebSocket.ts`** (140 lines)
- Generic WebSocket hook
- Connection lifecycle management
- Message parsing

**`src/hooks/useBinanceTickers.ts`** (110 lines)
- Multi-ticker subscription
- Batching and pooling
- Connection state tracking

## 🔌 API Routes

### GET `/api/ohlc`

Fetch OHLC candlestick data with validation.

**Query Parameters:**
- `coinId` (required): CoinGecko coin ID
- `days` (required): 1|7|30|90|180|365|max

**Example:**
```bash
curl "http://localhost:3000/api/ohlc?coinId=bitcoin&days=30"
```

**Response:**
```json
[
  [1704067200000, 42500, 43000, 42000, 42800],
  [1704153600000, 42800, 43200, 42500, 43000]
]
```

**Cache Control:**
- `1d`: 10 seconds
- `7d`: 30 seconds
- `30d`: 5 minutes
- `365d`: 1 hour

**Error Responses:**
- `400`: Invalid coinId or days parameter
- `429`: Rate limited (respects Retry-After)
- `500`: Server error

## 🌐 WebSocket Integration

### Binance Streams Used

1. **Ticker Stream** (`symbol@ticker`)
   - 1-second updates
   - Price, high, low, volume, bid, ask

2. **Kline Stream** (`symbol@kline_1s`)
   - 1-second candles
   - Real-time chart updates

3. **Aggregate Trade Stream** (`symbol@aggTrade`)
   - Compressed trades
   - Trade table updates

### Connection Management

```typescript
// Shared manager handles:
- Single connection per origin
- Up to 100 streams per connection
- Automatic reconnection (exponential backoff)
- Subscription deduplication
- Clean lifecycle management
```

## 📊 Data Flow Diagram

### Home Page
```
Server-Side:
  CoinGecko.getTrending() → [coins]
  CoinGecko.getCategories() → [categories]
  
Client-Side:
  useBinanceTickers() → Real-time prices
  Render with live updates
```

### Coin Detail Page
```
Server-Side:
  CoinGecko.getCoinData(id) → metadata
  CoinGecko.getOHLC(id, "30") → historical
  Binance.getTicker24h(symbol) → snapshot
  
Client-Side:
  useBinancePrice() → Live price
  useBinanceWebSocket() → Live trades
  CandlestickChart.mergeCandle() → Chart update
```

### Search Modal
```
User types (debounced 300ms)
  CoinGecko.search(query)
  CoinGecko.getMarkets(ids)
  Binance.getPrice(symbols)
  Display with live prices
```

## ⚡ Performance Optimizations

### 1. Caching Strategy

```
HTTP Cache Headers:
  Static pages: max-age=31536000
  API routes: 10s-1hr (varies by timeframe)
  stale-while-revalidate for background updates

BoundedCache (Client):
  Max 50 OHLC datasets
  LRU eviction policy
  TTL-based cleanup
```

### 2. WebSocket Optimization
- Single connection per origin
- Stream batching (100 max)
- Automatic deduplication
- Backpressure handling

### 3. Code Splitting
- Route-based splits
- Dynamic imports
- Component lazy loading

### 4. Image Optimization
- Next.js Image component
- WebP format support
- Responsive srcSet

## 🛡️ Error Handling

### Layer 1: Route-Level
- `error.tsx`: Catches component errors
- `loading.tsx`: Shows skeleton
- `notFound()`: 404 handling

### Layer 2: API-Level
```typescript
// Auto retry with backoff
// Timeout: 10s (configurable)
// Rate-limit aware
// Structured errors
```

### Layer 3: Component-Level
- Error boundaries
- Graceful fallbacks
- Data validation

### Layer 4: Data Validation
```typescript
isFiniteNumber(value)     // Safe number check
Array.isArray(data)       // Array validation
filterFiatCurrencies()    // Currency filter
convertOHLCData()         // OHLC validation
```

## 🚀 Deployment

### Vercel

```bash
vercel link
vercel env add COINGECKO_API_KEY
vercel deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 📈 Build & Performance

### Build Command
```bash
pnpm build
```

**Build Output:**
- Route (app): Static pages prerendered, dynamic routes on-demand
- Size optimizations: Turbopack, code splitting, tree-shaking
- Type checking: Full TypeScript validation
- ESLint: Code quality checks

### Performance Metrics

Target metrics:
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3.8s

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/name`
5. Create pull request

## 📚 API Documentation

- [CoinGecko Docs](https://docs.coingecko.com/)
- [Binance WebSocket](https://binance-docs.github.io/apidocs/)
- [Lightweight-charts](https://tradingview.github.io/lightweight-charts/)
- [Next.js Docs](https://nextjs.org/docs)

## 🔄 Recent Improvements

✅ Added error and loading states
✅ Hardened currency conversion
✅ Improved metadata for SEO
✅ Added bounded cache
✅ Fixed Binance pair resolution
✅ Consolidated WebSocket connections
✅ Enhanced chart state management
✅ Added numeric data validation
✅ Improved category resilience

## 📝 License

MIT License - see LICENSE file

## 👤 Author

[0xshariq](https://github.com/0xshariq) - CoinPulse Creator

---

**Last Updated:** August 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
