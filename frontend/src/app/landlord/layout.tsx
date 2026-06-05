/**
 * Landlord Route Group Layout
 *
 * Desktop sidebar navigation with:
 * - Property context switcher (hidden if 1 property, animated dropdown if >1)
 * - Nav links: Dashboard, Properties, Requests, Announcements, Documents, Settings
 * - Amber focus-visible rings for accessibility
 *
 * TODO (Phase 7, Task 7.4): Build full sidebar with adaptive property switcher.
 */

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — TODO: build in Phase 7 */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] p-4">
        <div className="text-xl font-bold mb-8 text-[rgb(var(--ml-accent))]">
          🏠 Homepost
        </div>
        <nav className="space-y-2">
          {["Dashboard", "Properties", "Units", "Requests", "Announcements", "Documents", "Settings"].map(
            (item) => (
              <a
                key={item}
                href={`/landlord/${item.toLowerCase()}`}
                className="block px-3 py-2 rounded-lg text-sm hover:bg-[rgb(var(--ml-bg-tertiary))] transition-colors"
              >
                {item}
              </a>
            )
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
