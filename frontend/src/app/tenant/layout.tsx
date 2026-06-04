/**
 * Tenant Route Group Layout
 *
 * Mobile-first bottom tab bar navigation:
 * - Dashboard, Requests, Announcements, Documents, Settings
 * - Smooth View Transition API on tab switch
 *
 * TODO (Phase 7, Task 7.5): Build full bottom tab bar with animations.
 */

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content */}
      <main className="flex-1 p-4 pb-20">{children}</main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 border-t border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] md:hidden">
        {[
          { label: "Home", icon: "🏠", href: "/tenant/dashboard" },
          { label: "Requests", icon: "🔧", href: "/tenant/requests" },
          { label: "News", icon: "📢", href: "/tenant/announcements" },
          { label: "Docs", icon: "📄", href: "/tenant/documents" },
          { label: "Profile", icon: "⚙️", href: "/tenant/settings" },
        ].map((tab) => (
          <a
            key={tab.label}
            href={tab.href}
            className="flex flex-col items-center text-xs text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors"
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
