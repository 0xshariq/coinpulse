export function ChartSkeleton() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4 animate-pulse">
      <div className="h-8 bg-gray-800 rounded mb-4 w-1/4" />
      <div className="h-64 bg-gray-800 rounded" />
    </div>
  );
}

export function TableSkeletonRow() {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      <div className="h-10 w-10 bg-gray-800 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-800 rounded w-3/4" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
      </div>
      <div className="h-4 bg-gray-800 rounded w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <TableSkeletonRow key={i} />
      ))}
    </div>
  );
}

export function DataGridSkeleton({ rows = 10 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
      ))}
    </div>
  );
}
