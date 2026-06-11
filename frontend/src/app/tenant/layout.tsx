"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

const TABS = [
  { label: "Home",     icon: "🏠", href: "/tenant/dashboard" },
  { label: "Requests", icon: "🔧", href: "/tenant/requests" },
  { label: "News",     icon: "📢", href: "/tenant/announcements" },
  { label: "Docs",     icon: "📄", href: "/tenant/documents" },
];

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Tenant Portal Top Header */}
      <header className="p-4 flex justify-between items-center border-b border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <div className="font-bold text-lg text-[rgb(var(--ml-text-primary))]">🏠 Homepost</div>
        <div className="flex gap-4 items-center">
          <UserButton />
          <ThemeToggle />
        </div>
      </header>

      {/* Main content — extra bottom padding so content never hides behind tab bar */}
      <main className="flex-1 p-4 pb-24">{children}</main>

      {/* Bottom Tab Bar — always visible */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 border-t border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] z-50">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center text-xs transition-colors px-3 py-1 rounded-lg ${
                isActive
                  ? "text-[rgb(var(--ml-accent))]"
                  : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))]"
              }`}
            >
              <span className={`text-2xl transition-transform ${isActive ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className={`mt-0.5 font-medium ${isActive ? "font-bold" : ""}`}>
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="mt-0.5 w-1 h-1 rounded-full bg-[rgb(var(--ml-accent))]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
