import type { Metadata } from 'next';
import { Geist, Geist_Mono, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'CoinPulse - Live Crypto Dashboard',
    template: '%s | CoinPulse',
  },
  description:
    'CoinPulse is a lightweight crypto dashboard with live prices, interactive charts, and real-time market data. Track your favorite cryptocurrencies with Binance integration.',
  keywords: [
    'cryptocurrency',
    'bitcoin',
    'ethereum',
    'crypto prices',
    'crypto dashboard',
    'binance',
    'live charts',
    'market data',
  ],
  authors: [{ name: 'CoinPulse' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://coinpulse.vercel.app',
    siteName: 'CoinPulse',
    title: 'CoinPulse - Live Crypto Dashboard',
    description:
      'CoinPulse is a lightweight crypto dashboard with live prices, interactive charts, and real-time market data.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CoinPulse - Live Crypto Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoinPulse - Live Crypto Dashboard',
    description:
      'CoinPulse is a lightweight crypto dashboard with live prices, interactive charts, and real-time market data.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-mono',
        jetbrainsMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col dark">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
