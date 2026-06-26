"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Menu, 
  LayoutDashboard, 
  Building2, 
  Home, 
  Wrench, 
  Megaphone, 
  FileText, 
  Settings2, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",     icon: LayoutDashboard, href: "/landlord/dashboard" },
  { label: "Properties",    icon: Building2,       href: "/landlord/properties" },
  { label: "Units",         icon: Home,            href: "/landlord/units" },
  { label: "Requests",      icon: Wrench,          href: "/landlord/requests" },
  { label: "Announcements", icon: Megaphone,       href: "/landlord/announcements" },
  { label: "Documents",     icon: FileText,        href: "/landlord/documents" },
  { label: "Settings",      icon: Settings2,       href: "/landlord/settings" },
];

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const collapsed = localStorage.getItem("landlord_sidebar_collapsed") === "true";
    setIsCollapsed(collapsed);
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("landlord_sidebar_collapsed", String(nextState));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300 relative py-6",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-8 right-[-14px] bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] p-1 rounded-full text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] shadow-sm transition-colors z-50 hover:bg-[rgb(var(--ml-bg-tertiary))] cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {!isCollapsed && (
          <Link href="/" className="block text-xl font-bold mb-8 text-[rgb(var(--ml-accent))] px-6 tracking-tight hover:opacity-80 transition-opacity">
            🏠 Homepost
          </Link>
        )}

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))] group relative",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] font-bold border-l-4 border-[rgb(var(--ml-accent))] rounded-l-none"
                    : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-text-primary))]"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-105", isActive && "text-[rgb(var(--ml-accent))]" )} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Control Bar — Desktop */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 border-b border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 backdrop-blur-md bg-opacity-85">
          <div className="font-bold text-lg text-[rgb(var(--ml-text-primary))] capitalize">
            {(() => {
              const parts = pathname.split("/");
              const last = parts.pop() || "dashboard";
              if (last.length === 36 && last.includes("-")) {
                return "Unit Details";
              }
              return last.replace(/-/g, " ");
            })()}
          </div>
          <div className="flex gap-4 items-center">
            <UserButton />
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40">
          <Link href="/" className="text-lg font-bold text-[rgb(var(--ml-accent))] hover:opacity-80 transition-opacity">🏠 Homepost</Link>
          <div className="flex gap-3 items-center">
            <UserButton />
            <ThemeToggle />
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              }>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 pt-10">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <Link href="/" onClick={() => setIsMobileOpen(false)} className="block px-6 py-2 text-xl font-bold text-[rgb(var(--ml-accent))] hover:opacity-80 transition-opacity">
                  🏠 Homepost
                </Link>
                <nav className="space-y-1 p-4">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))]",
                          isActive
                            ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] font-bold border-l-4 border-[rgb(var(--ml-accent))] rounded-l-none"
                            : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))]"
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span>{item.label}</span>
                      </a>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
