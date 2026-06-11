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

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = ["Dashboard", "Properties", "Units", "Requests", "Announcements", "Documents", "Settings"];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] p-4">
        <div className="text-xl font-bold mb-8 text-[rgb(var(--ml-accent))] px-2">
          🏠 Homepost
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item}
              href={`/landlord/${item.toLowerCase()}`}
              className="block px-3 py-2 rounded-lg text-sm hover:bg-[rgb(var(--ml-bg-tertiary))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))]"
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))]">
          <div className="text-lg font-bold text-[rgb(var(--ml-accent))]">🏠 Homepost</div>
          <Sheet>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            }>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 pt-10">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <nav className="space-y-1 p-4">
                {navItems.map((item) => (
                  <a
                    key={item}
                    href={`/landlord/${item.toLowerCase()}`}
                    className="block px-3 py-2 rounded-lg text-sm hover:bg-[rgb(var(--ml-bg-tertiary))] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))]"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
