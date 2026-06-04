/**
 * Tenant Dashboard
 *
 * Shows rent countdown, lease expiry countdown, recent requests,
 * and latest announcements.
 *
 * TODO (Phase 7, Task 7.7): Build with real data from API.
 */

export default function TenantDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome Home 🏠</h1>

      {/* Counters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]">
          <div className="text-sm text-[rgb(var(--ml-text-secondary))]">
            Rent Due In
          </div>
          <div className="text-3xl font-bold text-[rgb(var(--ml-accent))]">
            -- days
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]">
          <div className="text-sm text-[rgb(var(--ml-text-secondary))]">
            Lease Expires In
          </div>
          <div className="text-3xl font-bold text-[rgb(var(--ml-accent))]">
            -- days
          </div>
        </div>
      </div>

      {/* TODO: Recent requests, latest announcements */}
    </div>
  );
}
