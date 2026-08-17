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
import { isDemoSession, clearDemoSession, startDemoSession } from "@/lib/demo-auth";
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
  const { isSignedIn, isLoaded } = useAuth();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const collapsed = localStorage.getItem("landlord_sidebar_collapsed") === "true";
    setIsCollapsed(collapsed);
    setIsDemo(isDemoSession());
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("landlord_sidebar_collapsed", String(nextState));
  };

  const isDemoActive = isDemo || (isLoaded && !isSignedIn);
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/landlord/settings" && isDemoActive) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — Desktop */}
      {/* aside: overflow-visible + relative so the toggle button can hang -14px to the right without being clipped.
           CSS spec: overflow-y:auto forces overflow-x:hidden on the SAME element, so the button
           must live on the aside itself, not inside the scrollable inner div. */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-border bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300 h-dvh sticky top-0 shrink-0 overflow-visible relative",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Toggle Button — child of aside (overflow-visible), never clipped */}
        <button
          onClick={toggleCollapse}
          className="absolute top-8 right-[-14px] bg-[rgb(var(--ml-bg-secondary))] border border-border p-1 rounded-full text-[rgb(var(--ml-text-secondary))] shadow-sm z-50 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Inner scroll container — only this div scrolls, aside stays overflow-visible */}
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
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar — Desktop */}
        <header className="hidden md:flex h-16 items-center justify-between px-6 border-b border-border bg-[rgb(var(--ml-bg-secondary))]/95 sticky top-0 z-40 backdrop-blur-md">
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
            {!isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--ml-bg-tertiary))] animate-pulse border border-border shrink-0" />
            ) : isSignedIn ? (
              <UserButton />
            ) : isDemoActive ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] border border-border text-xs shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    MV
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="font-semibold text-[rgb(var(--ml-text-primary))] leading-none">Marcus Vance</span>
                    <span className="text-[10px] text-amber-500 font-medium leading-tight">Demo Owner</span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
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
                  className="text-xs h-8 rounded-lg border-border hover:border-[rgb(var(--ml-accent))] cursor-pointer"
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
                  className="text-xs text-[rgb(var(--ml-text-secondary))] hover:text-red-500 h-8 px-2 cursor-pointer"
                  title="Exit Demo Mode"
                >
                  Exit Demo
                </Button>
              </div>
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
            {!isLoaded ? (
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
                <Link href="/" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2 px-6 py-2 text-xl font-bold text-[rgb(var(--ml-text-primary))] hover:opacity-80 transition-opacity">
                  <Building2 className="size-6 text-[rgb(var(--ml-accent))]" />
                  <span>Homepost</span>
                </Link>
                <nav className="space-y-1 p-4">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))]",
                          isActive
                            ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] font-semibold border-l-2 border-[rgb(var(--ml-accent))] rounded-l-none"
                            : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))]"
                        )}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="p-4 md:p-6 pb-24 md:pb-20 min-h-full flex flex-col">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[rgb(var(--ml-bg-secondary))]/95 backdrop-blur-lg border-t border-border px-2 py-1 flex items-center justify-around">
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
          <Sheet>
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
                <Menu className={cn("size-5 transition-transform", visibleNavItems.slice(4).some((item) => pathname === item.href || pathname.startsWith(item.href + "/")) && "scale-110 text-[rgb(var(--ml-accent))]")} />
                <span className="truncate max-w-[68px] tracking-tight mt-0.5">More</span>
              </button>
            }>
            </SheetTrigger>
            <SheetContent side="bottom" className="p-6 rounded-t-3xl max-h-[80vh] overflow-y-auto">
              <SheetTitle className="text-lg font-bold text-[rgb(var(--ml-text-primary))] mb-4">More Options</SheetTitle>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {visibleNavItems.slice(4).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border border-border text-sm font-semibold transition-all duration-200",
                        isActive
                          ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))]"
                          : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))]"
                      )}
                    >
                      <Icon className={cn("size-5 shrink-0", isActive ? "text-[rgb(var(--ml-accent))]" : "text-[rgb(var(--ml-text-secondary))]")} />
                      <span>{item.label}</span>
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
                      startDemoSession("tenant");
                      window.location.href = "/tenant/dashboard";
                    }}
                    className="w-full justify-start text-sm h-11 rounded-xl"
                  >
                    Switch to Resident Demo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      clearDemoSession();
                      window.location.href = "/";
                    }}
                    className="w-full justify-start text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 h-11 rounded-xl"
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
