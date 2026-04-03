export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 bg-gray-200 rounded w-48 mb-8" />
      {/* Hero skeleton */}
      <div className="h-48 bg-gray-200 rounded-2xl mb-8" />
      {/* Filter bar skeleton */}
      <div className="h-16 bg-gray-100 rounded-xl mb-6" />
      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-72 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
