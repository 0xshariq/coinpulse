export default function Loading() {
  return (
    <main id="coin-detail-page">
      <div className="content space-y-8">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-dark-300 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-dark-300 rounded animate-pulse" />
              <div className="h-4 w-32 bg-dark-300 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-32 bg-dark-300 rounded animate-pulse" />
        </div>

        {/* Details skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-dark-300 rounded animate-pulse" />
              <div className="h-6 w-32 bg-dark-300 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="h-96 bg-dark-300 rounded-lg animate-pulse" />

        {/* Converter skeleton */}
        <div className="h-64 bg-dark-300 rounded-lg animate-pulse" />
      </div>
    </main>
  );
}
