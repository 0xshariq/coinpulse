export default function Loading() {
  return (
    <main id="coins-page">
      <div className="content">
        <h4 className="mb-6">All Coins</h4>

        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-dark-300 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
