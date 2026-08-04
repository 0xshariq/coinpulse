'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[coins/error]', error);
  }, [error]);

  return (
    <main id="coins-page">
      <div className="content">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-md">
            {error.message || 'Failed to load coins. Please try again.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
