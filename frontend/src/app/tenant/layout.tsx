"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Home, Wrench, Megaphone, FileText, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home",     icon: Home,      href: "/tenant/dashboard" },
  { label: "Requests", icon: Wrench,    href: "/tenant/requests" },
  { label: "News",     icon: Megaphone, href: "/tenant/announcements" },
  { label: "Docs",     icon: FileText,  href: "/tenant/documents" },
];

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsActive = pathname === "/tenant/settings" || pathname.startsWith("/tenant/settings/");

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Tenant Portal Top Header */}
      <header className="p-4 flex justify-between items-center border-b border-border bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[rgb(var(--ml-text-primary))] hover:opacity-80 transition-opacity">
          <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
          <span>Homepost</span>
        </Link>
        <div className="flex gap-2.5 items-center">
          <Link
            href="/tenant/settings"
            className={cn(
              "size-9 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.97]",
              isSettingsActive
                ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))]/40 shadow-[0_0_12px_rgba(var(--ml-accent),0.15)]"
                : "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border hover:text-[rgb(var(--ml-text-primary))] hover:border-[rgb(var(--ml-text-primary))]/30"
            )}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className={cn("size-4 transition-transform duration-200", isSettingsActive ? "text-[rgb(var(--ml-accent))] scale-105" : "hover:rotate-45")} />
          </Link>
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      {/* Main content — extra bottom padding so content never hides behind tab bar */}
      <main className="flex-1 p-4 pb-24">{children}</main>

      {/* Bottom Tab Bar — always visible */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 border-t border-border bg-[rgb(var(--ml-bg-secondary))]/90 backdrop-blur-md z-50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center text-xs transition-colors px-3 py-1 rounded-lg ${
                isActive
                  ? "text-[rgb(var(--ml-accent))]"
                  : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
              }`}
            >
              <Icon className={`size-5 transition-transform ${isActive ? "scale-110 text-[rgb(var(--ml-accent))]" : ""}`} />
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
