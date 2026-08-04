'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[coins/[id]/error]', error);
  }, [error]);

  const isNotFound =
    error.message?.includes('not found') || error.message?.includes('404');

  return (
    <main id="coin-detail-page">
      <div className="content">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">
            {isNotFound ? 'Coin not found' : 'Something went wrong'}
          </h1>
          <p className="text-gray-400 mb-6 max-w-md">
            {isNotFound
              ? 'The coin you are looking for does not exist or has been delisted.'
              : error.message || 'Failed to load coin details. Please try again.'}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
            >
              Try again
            </button>
            <Link
              href="/coins"
              className="px-6 py-2 bg-dark-300 hover:bg-dark-200 rounded-lg font-medium transition"
            >
              View all coins
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
