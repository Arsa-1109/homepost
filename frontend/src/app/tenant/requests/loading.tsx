export default function TenantRequestsLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Shell Skeleton */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="skeleton h-5 w-36 rounded-full" />
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-64 rounded-xl" />
              <div className="skeleton h-6 w-8 rounded-full" />
            </div>
            <div className="skeleton h-4 w-80 rounded-lg" />
          </div>
          <div className="skeleton h-11 w-36 rounded-xl shrink-0" />
        </div>

        {/* Search & Filter Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-8 w-20 rounded-xl shrink-0" />
            ))}
          </div>
          <div className="skeleton h-9 w-full sm:w-64 rounded-xl" />
        </div>
      </div>

      {/* Feed List Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-2xl skeleton shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-48 rounded-lg skeleton" />
                  <div className="h-5 w-16 rounded-full skeleton" />
                </div>
                <div className="h-4 w-32 rounded-md skeleton" />
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
              <div className="h-5 w-14 rounded-md skeleton" />
              <div className="w-8 h-8 rounded-xl skeleton shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
