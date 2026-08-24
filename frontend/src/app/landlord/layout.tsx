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
import { UserButton, useAuth } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isDemoSession, clearDemoSession, startDemoSession, sanitizeSession } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",     icon: LayoutDashboard, href: "/landlord/dashboard", description: "Overview of properties, units & cashflow" },
  { label: "Properties",    icon: Building2,       href: "/landlord/properties", description: "Manage property listings & addresses" },
  { label: "Units",         icon: Home,            href: "/landlord/units", description: "Occupancy, leases & unit details" },
  { label: "Requests",      icon: Wrench,          href: "/landlord/requests", description: "Maintenance & tenant work orders" },
  { label: "Announcements", icon: Megaphone,       href: "/landlord/announcements", description: "Broadcast updates to your residents" },
  { label: "Documents",     icon: FileText,        href: "/landlord/documents", description: "Upload and view leases & property files" },
  { label: "Settings",      icon: Settings2,       href: "/landlord/settings", description: "Account preferences & profile setup" },
];

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const [isDemo, setIsDemo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const collapsed = localStorage.getItem("landlord_sidebar_collapsed") === "true";
    setIsCollapsed(collapsed);
    if (isSignedIn) {
      sanitizeSession(true);
      setIsDemo(false);
    } else {
      setIsDemo(isDemoSession());
    }
  }, [isSignedIn]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("landlord_sidebar_collapsed", String(nextState));
  };

  const isDemoActive = mounted && (isDemo || (isLoaded && !isSignedIn));
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/landlord/settings" && isDemoActive) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-border bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300 h-dvh sticky top-0 shrink-0 overflow-visible relative",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-8 right-[-14px] bg-[rgb(var(--ml-bg-secondary))] border border-border p-1 rounded-full text-[rgb(var(--ml-text-secondary))] shadow-sm z-50 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Inner scroll container */}
        <div className="flex flex-col h-full overflow-y-auto py-6">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-8 text-[rgb(var(--ml-text-primary))] px-6 tracking-tight hover:opacity-80 transition-opacity">
              <Building2 className="size-6 text-[rgb(var(--ml-accent))]" />
              <span>Homepost</span>
            </Link>
          )}

          <nav className="flex-1 space-y-1 px-3">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))] group relative",
                    isCollapsed && "justify-center px-0",
                    isActive
                      ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] font-semibold border-l-2 border-[rgb(var(--ml-accent))] rounded-l-none"
                      : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-text-primary))]"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-105", isActive && "text-[rgb(var(--ml-accent))]" )} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Demo Controls */}
          {isDemoActive && !isCollapsed && (
            <div className="p-3 mx-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2 mt-auto">
              <div className="flex items-center gap-1.5 font-bold text-amber-500 text-[11px] tracking-wide uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Demo Mode
              </div>
              <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] leading-tight">
                Previewing as Property Owner (Marcus Vance).
              </p>
              <div className="pt-1 flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    startDemoSession("tenant");
                    window.location.href = "/tenant/dashboard";
                  }}
                  className="w-full text-xs h-7 rounded-lg border-amber-500/30 hover:bg-amber-500/15 text-amber-500 hover:text-amber-400 cursor-pointer"
                >
                  Switch to Resident Demo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearDemoSession();
                    window.location.href = "/";
                  }}
                  className="w-full text-xs text-[rgb(var(--ml-text-secondary))] hover:text-red-400 h-7 rounded-lg cursor-pointer"
                >
                  Exit Demo
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Landlord Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isDemoActive && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] border border-border text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold flex items-center justify-center text-[10px]">
                    MV
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-[rgb(var(--ml-text-primary))] leading-none text-[11px]">Marcus Vance</span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    DEMO
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    startDemoSession("tenant");
                    window.location.href = "/tenant/dashboard";
                  }}
                  className="text-xs h-8 rounded-lg border-border hover:border-[rgb(var(--ml-accent))] cursor-pointer px-2.5"
                  title="Switch to Resident Demo"
                >
                  Resident Demo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearDemoSession();
                    window.location.href = "/";
                  }}
                  className="text-xs text-[rgb(var(--ml-text-secondary))] hover:text-red-500 h-8 px-2.5 cursor-pointer"
                  title="Exit Demo Mode"
                >
                  Exit Demo
                </Button>
              </div>
            )}

            {!mounted || !isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--ml-bg-tertiary))] animate-pulse border border-border shrink-0" />
            ) : isSignedIn ? (
              <UserButton />
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 sm:p-4 border-b border-border bg-[rgb(var(--ml-bg-secondary))]/95 sticky top-0 z-40 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[rgb(var(--ml-text-primary))] hover:opacity-80 transition-opacity">
            <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
            <span>Homepost</span>
          </Link>
          <div className="flex gap-2.5 items-center">
            {!mounted || !isLoaded ? (
              <div className="w-7 h-7 rounded-full bg-[rgb(var(--ml-bg-tertiary))] animate-pulse border border-border shrink-0" />
            ) : isSignedIn ? (
              <UserButton />
            ) : isDemoActive ? (
              <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-0.5 rounded-full bg-[rgb(var(--ml-bg-tertiary))] border border-border text-xs">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold flex items-center justify-center text-[10px]">
                  MV
                </div>
                <span className="text-[10px] font-bold text-amber-500">DEMO</span>
              </div>
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="p-4 md:p-6 pb-[max(6rem,calc(4rem+env(safe-area-inset-bottom)))] md:pb-20 min-h-full flex flex-col">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[rgb(var(--ml-bg-secondary))]/95 backdrop-blur-lg border-t border-border px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-h-[64px] flex items-center justify-around">
          {visibleNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl text-[10.5px] font-semibold transition-all duration-200 cursor-pointer touch-manipulation",
                  isActive
                    ? "text-[rgb(var(--ml-accent))]"
                    : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
                )}
              >
                <Icon className={cn("size-5 transition-transform", isActive && "scale-110 text-[rgb(var(--ml-accent))]")} />
                <span className="truncate max-w-[68px] tracking-tight mt-0.5">{item.label}</span>
              </Link>
            );
          })}

          {/* 5th Tab: More Drawer */}
          <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <SheetTrigger render={
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl text-[10.5px] font-semibold transition-all duration-200 cursor-pointer touch-manipulation",
                  visibleNavItems.slice(4).some((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
                    ? "text-[rgb(var(--ml-accent))]"
                    : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
                )}
                aria-label="More navigation options"
              >
                <Menu className={cn("size-5 transition-transform", visibleNavItems.slice(4).some((item) => pathname === item.href || pathname.startsWith(item.href + "/")) && "scale-110 text-[rgb(var(--ml-accent))]" )} />
                <span className="truncate max-w-[68px] tracking-tight mt-0.5">More</span>
              </button>
            }>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-6 rounded-t-3xl max-h-[85vh] overflow-y-auto bg-[rgb(var(--ml-bg-secondary))] border-t border-border shadow-2xl">
              {/* Drag handle indicator */}
              <div className="mx-auto w-12 h-1.5 rounded-full bg-border/80 mb-4" />

              <div className="mb-5">
                <SheetTitle className="text-lg font-bold text-[rgb(var(--ml-text-primary))]">More Options</SheetTitle>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))] mt-0.5">
                  Property management tools and settings
                </p>
              </div>

              {/* Cohesive Full-Width List Cards */}
              <div className="flex flex-col gap-2.5 mb-6">
                {visibleNavItems.slice(4).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99]",
                        isActive
                          ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))]/40 shadow-sm"
                          : "bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] border-border/70 hover:bg-[rgb(var(--ml-bg-tertiary))] hover:border-border"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          isActive 
                            ? "bg-[rgb(var(--ml-accent))]/15 text-[rgb(var(--ml-accent))]" 
                            : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/50"
                        )}>
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm leading-tight truncate">{item.label}</div>
                          <div className="text-xs text-[rgb(var(--ml-text-secondary))] mt-0.5 truncate">
                            {item.description || (item.label === "Announcements" ? "Broadcast updates to residents" : item.label === "Documents" ? "Manage property documents & files" : "Account preferences & profile")}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={cn("size-4 shrink-0 transition-transform ml-2", isActive ? "text-[rgb(var(--ml-accent))]" : "text-[rgb(var(--ml-text-secondary))] opacity-60")} />
                    </Link>
                  );
                })}
              </div>

              {isDemoActive && (
                <div className="pt-4 border-t border-border flex flex-col gap-2.5">
                  <div className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider">Demo Controls</div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsMoreOpen(false);
                      startDemoSession("tenant");
                      window.location.href = "/tenant/dashboard";
                    }}
                    className="w-full justify-start text-sm h-11 rounded-xl border-border hover:border-amber-500/50 cursor-pointer"
                  >
                    Switch to Resident Demo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMoreOpen(false);
                      clearDemoSession();
                      window.location.href = "/";
                    }}
                    className="w-full justify-start text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 h-11 rounded-xl cursor-pointer"
                  >
                    Exit Demo Mode
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  );
}
