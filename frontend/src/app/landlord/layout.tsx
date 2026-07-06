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
    <div className="flex min-h-screen bg-[rgb(var(--ml-bg-primary))] relative overflow-hidden">


      {/* Sidebar — Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-[rgb(var(--ml-border))]/25 bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300 relative py-6 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-8 right-[-12px] bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/35 p-1 rounded-full text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] shadow-md transition-all z-50 hover:bg-[rgb(var(--ml-bg-tertiary))] cursor-pointer scale-95 hover:scale-105 active:scale-95"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {!isCollapsed && (
          <Link href="/" className="block text-xl font-extrabold mb-8 text-[rgb(var(--ml-accent))] px-6 tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
            <span className="bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent-light))] bg-clip-text text-transparent">Homepost</span>
          </Link>
        )}

        <nav className="flex-1 space-y-1.5 px-3.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))] group relative overflow-hidden",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                    : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))]/50 hover:text-[rgb(var(--ml-text-primary))]"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-[rgb(var(--ml-accent))] shadow-[0_0_8px_rgba(var(--ml-accent),0.6)]" />
                )}
                <Icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-105 duration-300", isActive && "text-[rgb(var(--ml-accent))]" )} />
                {!isCollapsed && <span className="truncate tracking-wide">{item.label}</span>}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden z-10 relative">
        {/* Top Control Bar — Desktop */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-[rgb(var(--ml-border))]/25 bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="font-extrabold text-xl tracking-tight text-[rgb(var(--ml-text-primary))] capitalize">
            {(() => {
              const parts = pathname.split("/");
              const last = parts.pop() || "dashboard";
              if (last.length === 36 && last.includes("-")) {
                return "Unit Details";
              }
              return last.replace(/-/g, " ");
            })()}
          </div>
          <div className="flex gap-5 items-center">
            <UserButton />
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[rgb(var(--ml-border))]/40 bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40">
          <Link href="/" className="text-lg font-bold text-[rgb(var(--ml-accent))] hover:opacity-80 transition-opacity flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
            <span>Homepost</span>
          </Link>
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
                <Link href="/" onClick={() => setIsMobileOpen(false)} className="px-6 py-2 text-xl font-bold text-[rgb(var(--ml-accent))] hover:opacity-80 transition-opacity flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
                  <span>Homepost</span>
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
                            ? "bg-[rgb(var(--ml-bg-tertiary))]/60 text-[rgb(var(--ml-accent))] font-bold border-l-4 border-[rgb(var(--ml-accent))] rounded-l-none"
                            : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))]/40"
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
