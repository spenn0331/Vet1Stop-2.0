export default function HomeBaseLoading() {
  return (
    <main className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="h-8 w-64 bg-white/10 rounded-full" />
              <div className="h-12 w-full max-w-lg bg-white/10 rounded-xl" />
              <div className="h-6 w-96 bg-white/5 rounded" />
              <div className="flex gap-4 pt-4">
                <div className="h-12 w-40 bg-white/10 rounded-xl" />
                <div className="h-12 w-44 bg-white/10 rounded-xl" />
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-center gap-5">
              <div className="h-16 w-64 bg-white/10 rounded-2xl" />
              <div className="h-16 w-56 bg-white/10 rounded-2xl" />
              <div className="h-16 w-60 bg-white/10 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Trust bar skeleton */}
      <div className="bg-white border-y border-gray-100 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="h-5 w-36 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits grid skeleton */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <div className="h-10 w-80 bg-gray-200 rounded mx-auto" />
            <div className="h-5 w-64 bg-gray-100 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3"
              >
                <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent cards skeleton */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 space-y-3">
            <div className="h-10 w-72 bg-gray-200 rounded mx-auto" />
            <div className="h-5 w-96 bg-gray-100 rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 min-h-[380px] space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-10 w-full bg-gray-200 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
