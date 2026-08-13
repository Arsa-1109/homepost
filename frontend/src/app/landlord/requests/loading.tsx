export default function LandlordRequestsLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Shell Skeleton */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              Maintenance & Repairs
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Maintenance Requests
              <span className="skeleton h-6 w-8 rounded-full inline-block" />
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Review and resolve property repair issues reported by tenants.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-56">
              <div className="skeleton h-11 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
            {["All", "Open", "In Progress", "Resolved", "Closed"].map((filter, i) => (
              <div
                key={filter}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${
                  i === 0
                    ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))]"
                    : "bg-[rgb(var(--ml-bg-tertiary))]/60 text-[rgb(var(--ml-text-secondary))] border-border/40"
                }`}
              >
                {filter}
              </div>
            ))}
          </div>
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <div className="w-full h-9 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Skeletons List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="skeleton h-4 w-36 rounded-md" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl skeleton shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-44 sm:w-56 rounded-lg skeleton" />
                    <div className="h-5 w-20 rounded-full skeleton" />
                  </div>
                  <div className="h-4 w-36 rounded-md skeleton" />
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <div className="h-5 w-16 rounded-md skeleton" />
                <div className="h-4 w-24 rounded-md skeleton" />
                <div className="w-8 h-8 rounded-xl skeleton shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
