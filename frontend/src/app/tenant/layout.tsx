"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

import { Home, Wrench, Megaphone, FileText, Building2 } from "lucide-react";

const TABS = [
  { label: "Home",     icon: Home, href: "/tenant/dashboard" },
  { label: "Requests", icon: Wrench, href: "/tenant/requests" },
  { label: "News",     icon: Megaphone, href: "/tenant/announcements" },
  { label: "Docs",     icon: FileText, href: "/tenant/documents" },
];

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(var(--ml-bg-primary))] relative overflow-hidden">


      {/* Tenant Portal Top Header */}
      <header className="p-4 px-6 flex justify-between items-center border-b border-[rgb(var(--ml-border))]/25 bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <Link href="/" className="font-extrabold text-xl tracking-tight text-[rgb(var(--ml-accent))] hover:opacity-80 transition-opacity z-10 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
          <span className="bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent-light))] bg-clip-text text-transparent">Homepost</span>
        </Link>
        <div className="flex gap-5 items-center z-10">
          <UserButton />
          <ThemeToggle />
        </div>
      </header>

      {/* Main content — extra bottom padding so content never hides behind tab bar */}
      <main className="flex-1 p-5 pb-24 z-10 relative">{children}</main>

      {/* Bottom Tab Bar — always visible */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 border-t border-[rgb(var(--ml-border))]/25 bg-[rgb(var(--ml-bg-secondary))] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center text-[10px] uppercase tracking-wider transition-colors px-4 py-1.5 rounded-xl ${
                isActive
                  ? "text-[rgb(var(--ml-accent))] font-extrabold"
                  : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] font-semibold"
              }`}
            >
              <span className={`transition-transform duration-300 ${isActive ? "scale-115 -translate-y-0.5" : "scale-100"}`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className="mt-1">
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[rgb(var(--ml-accent))] shadow-[0_0_6px_rgba(var(--ml-accent),0.6)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
