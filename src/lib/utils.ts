import { clsx, type ClassValue } from 'clsx';
import { Time } from 'lightweight-charts';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency value with the specified number of digits and currency code.
 * @param value The currency value to format.
 * @param digits The number of decimal digits to display.
 * @param currency The currency code.
 * @param showSymbol Whether to show the currency symbol.
 * @returns The formatted currency string.
 */
export function formatCurrency(
  value: number | null | undefined,
  digits?: number,
  currency?: string,
  showSymbol?: boolean,
) {
  // Validate input is a finite number
  if (!isFiniteNumber(value)) {
    return showSymbol !== false ? '$0.00' : '0.00';
  }

  // Use a fixed locale to avoid server/client locale mismatches during SSR hydration.
  const locale = 'en-US';
  const currencyUpper = currency?.toUpperCase() || 'USD';

  if (showSymbol === undefined || showSymbol === true) {
    try {
      // Verify that the currency code is valid for Intl.NumberFormat
      const testFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyUpper,
      });
      return testFormatter.format(value);
    } catch {
      // Fall back to numeric formatting if currency code is invalid (e.g., "bits", "sats")
      console.warn(`[formatCurrency] Invalid currency code: ${currencyUpper}`);
      return value.toLocaleString(locale, {
        minimumFractionDigits: digits ?? 2,
        maximumFractionDigits: digits ?? 2,
      });
    }
  }

  return value.toLocaleString(locale, {
    minimumFractionDigits: digits ?? 2,
    maximumFractionDigits: digits ?? 2,
  });
}

/**
 * Formats a percentage value with the specified number of decimal digits.
 * @param change The percentage value to format.
 * @param digits The number of decimal digits to display.
 * @returns The formatted percentage string.
 */
export function formatPercentage(change: number | null | undefined, digits = 1): string {
  if (change === null || change === undefined || isNaN(change)) {
    return '0.0%';
  }
  const formattedChange = change.toFixed(digits);
  return `${formattedChange}%`;
}

export function trendingClasses(value: number) {
  const isTrendingUp = value > 0;

  return {
    textClass: isTrendingUp ? 'text-green-400' : 'text-red-400',
    bgClass: isTrendingUp ? 'bg-green-500/10' : 'bg-red-500/10',
    iconClass: isTrendingUp ? 'icon-up' : 'icon-down',
  };
}

export function timeAgo(date: string | number | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime(); // difference in ms

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''}`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;

  // Format date as YYYY-MM-DD
  return past.toISOString().split('T')[0];
}

export function convertOHLCData(data: OHLCData[]) {
  return data
    .map((d) => {
      // Validate and coerce all numeric values to safe numbers
      const time = Number(d[0]);
      const open = Number(d[1]);
      const high = Number(d[2]);
      const low = Number(d[3]);
      const close = Number(d[4]);

      // Skip candles with invalid data
      if (
        !isFiniteNumber(time) ||
        !isFiniteNumber(open) ||
        !isFiniteNumber(high) ||
        !isFiniteNumber(low) ||
        !isFiniteNumber(close)
      ) {
        return null;
      }

      return {
        time: time as Time,
        open,
        high,
        low,
        close,
      };
    })
    .filter(
      (item, index, arr): item is { time: Time; open: number; high: number; low: number; close: number } =>
        item !== null && (index === 0 || item.time !== (arr[index - 1]?.time ?? -1)),
    );
}

/**
 * Checks if a value is a finite number (not NaN, Infinity, etc)
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Common fiat currency codes that Intl.NumberFormat supports
 */
const SUPPORTED_FIAT_CURRENCIES = new Set([
  'usd',
  'eur',
  'gbp',
  'jpy',
  'cad',
  'aud',
  'chf',
  'cny',
  'inr',
  'mxn',
  'brl',
  'zar',
  'hkd',
  'sgd',
  'nzd',
  'kr',
  'sek',
  'nok',
  'dkk',
  'pln',
  'czk',
  'huf',
  'ron',
  'bgn',
  'hrk',
  'uah',
  'rub',
  'try',
  'aed',
  'sar',
  'qar',
  'kwd',
  'bhd',
  'omr',
  'jod',
  'lbp',
  'egp',
  'thb',
  'myr',
  'php',
  'idr',
  'vnd',
  'pkr',
  'bdt',
]);

/**
 * Filters a price list to only include supported fiat currencies
 * @param priceList - Object with currency codes as keys and prices as values
 * @returns Filtered object with only supported fiat currencies
 */
export function filterFiatCurrencies(priceList: Record<string, number>): Record<string, number> {
  if (!priceList || typeof priceList !== 'object') {
    return { usd: 0 };
  }

  const filtered: Record<string, number> = {};

  for (const [currency, price] of Object.entries(priceList)) {
    const currencyLower = String(currency).toLowerCase();

    // Only include supported fiat currencies with valid prices
    if (SUPPORTED_FIAT_CURRENCIES.has(currencyLower) && isFiniteNumber(price)) {
      filtered[currencyLower] = price;
    }
  }

  // Ensure USD is always present as fallback
  if (!filtered.usd && priceList.usd && isFiniteNumber(priceList.usd)) {
    filtered.usd = priceList.usd;
  }

  return Object.keys(filtered).length > 0 ? filtered : { usd: 0 };
}

export const ELLIPSIS = 'ellipsis' as const;
export const buildPageNumbers = (
  currentPage: number,
  totalPages: number,
): (number | typeof ELLIPSIS)[] => {
  const MAX_VISIBLE_PAGES = 5;

  const pages: (number | typeof ELLIPSIS)[] = [];

  if (totalPages <= MAX_VISIBLE_PAGES) {
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1);

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push(ELLIPSIS);
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push(ELLIPSIS);
  }

  pages.push(totalPages);

  return pages;
};
