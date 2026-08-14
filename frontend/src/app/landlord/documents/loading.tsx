export default function LandlordDocumentsLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Shell Skeleton */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
              Document Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Property Documents
              <span className="skeleton h-6 w-8 rounded-full inline-block" />
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Upload and manage leases, agreements, and property notices for your tenants.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-56">
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-2xl w-fit">
            <div className="skeleton h-8 w-20 rounded-xl" />
            <div className="skeleton h-8 w-16 rounded-xl" />
            <div className="skeleton h-8 w-16 rounded-xl" />
          </div>
          <div className="relative flex-1 max-w-xs">
            <div className="skeleton h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="skeleton h-4 w-36 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 rounded-xl skeleton shrink-0" />
                <div className="flex-1 min-w-0 space-y-2.5 py-1">
                  <div className="flex items-center gap-1.5">
                    <div className="skeleton h-4 w-14 rounded-md" />
                    <div className="skeleton h-4 w-20 rounded-md" />
                  </div>
                  <div className="skeleton h-5 w-4/5 rounded-lg" />
                  <div className="skeleton h-3.5 w-24 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
                <div className="skeleton h-9 rounded-xl" />
                <div className="skeleton h-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
