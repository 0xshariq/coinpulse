interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-4xl text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function NoDataFound() {
  return (
    <EmptyState
      title="No data found"
      description="We couldn't find any data for your search. Try adjusting your filters or search terms."
      icon="📊"
    />
  );
}

export function NoCoinsFound() {
  return (
    <EmptyState
      title="No coins found"
      description="We couldn't find any coins matching your search. Try searching for something else."
      icon="🪙"
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-red-50 rounded-lg border border-red-200">
      <div className="mb-4 text-4xl">⚠️</div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">{'Something went wrong'}</h3>
      <p className="text-sm text-red-700 max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
