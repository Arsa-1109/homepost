/**
 * Public Landing Page
 *
 * Marketing page visible to everyone — no auth required.
 * Hero section + feature highlights + CTA to sign up.
 *
 * TODO (Phase 7, Task 7.3): Build the full marketing page with
 * feature cards, testimonials, and animated hero section.
 */

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-6">
        {/* Hero */}
        <h1 className="text-5xl font-bold tracking-tight">
          🏠 Homepost
        </h1>
        <p className="text-xl text-[rgb(var(--ml-text-secondary))]">
          The radically simple tenant portal for individual property owners.
          Manage maintenance requests, share documents, and communicate with
          your tenants — without the bloat.
        </p>

        {/* CTA */}
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/sign-up"
            className="px-6 py-3 rounded-lg bg-[rgb(var(--ml-accent))] text-white font-semibold hover:bg-[rgb(var(--ml-accent-dark))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))]"
          >
            Get Started Free
          </a>
          <a
            href="/sign-in"
            className="px-6 py-3 rounded-lg border border-[rgb(var(--ml-border))] font-semibold hover:bg-[rgb(var(--ml-bg-tertiary))] transition-colors"
          >
            Sign In
          </a>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-4 rounded-xl bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]">
            <div className="text-2xl mb-2">🔧</div>
            <h3 className="font-semibold mb-1">Maintenance Requests</h3>
            <p className="text-sm text-[rgb(var(--ml-text-secondary))]">
              Tenants submit issues with photos. Track status from open to resolved.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]">
            <div className="text-2xl mb-2">📢</div>
            <h3 className="font-semibold mb-1">Announcements</h3>
            <p className="text-sm text-[rgb(var(--ml-text-secondary))]">
              Post property-wide updates. Tenants see what matters to them.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-semibold mb-1">Document Sharing</h3>
            <p className="text-sm text-[rgb(var(--ml-text-secondary))]">
              Upload leases, house rules, and more. Tenants download anytime.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
