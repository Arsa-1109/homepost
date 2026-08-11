export default function LandlordAnnouncementsLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Section Shell */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              Tenant Communications
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Announcements
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                0
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Broadcast notices, policy updates, and maintenance reminders to tenants.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border border-border/60 rounded-xl h-11 flex items-center px-3 sm:w-56">
              <div className="skeleton h-4 w-32 rounded-md" />
            </div>
            <div className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs flex items-center justify-center gap-2 shrink-0 opacity-80">
              Post Announcement
            </div>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {["All Notices", "Last 7 Days", "Property-Wide", "Unit-Specific"].map((filter, i) => (
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
            <div className="w-full h-8 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Dynamic Card Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={`skel-${i}`} className="p-6 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-3 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="skeleton h-5 w-24 rounded-md" />
                <div className="skeleton h-5 w-20 rounded-md" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="skeleton h-4 w-16 rounded-md" />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="skeleton h-6 w-3/4 rounded-lg" />
              <div className="skeleton h-4 w-full rounded-md mt-2" />
              <div className="skeleton h-4 w-5/6 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
