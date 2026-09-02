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
  UserCheck,
  Settings2, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserButton, useAuth } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isDemoSession, exitDemoSession, startDemoSession, sanitizeSession } from "@/lib/demo-auth";
import { DemoHeaderMenu } from "@/components/demo/DemoHeaderMenu";
import { cn } from "@/lib/utils";

const CORE_NAV_ITEMS = [
  { label: "Dashboard",       icon: LayoutDashboard, href: "/landlord/dashboard", description: "Overview of properties, units & cashflow" },
  { label: "Properties",      icon: Building2,       href: "/landlord/properties", description: "Manage property listings & addresses" },
  { label: "Units",           icon: Home,            href: "/landlord/units", description: "Occupancy, leases & unit details" },
  { label: "Requests",        icon: Wrench,          href: "/landlord/requests", description: "Maintenance & tenant work orders" },
  { label: "Announcements",   icon: Megaphone,       href: "/landlord/announcements", description: "Broadcast updates to your residents" },
  { label: "Documents",       icon: FileText,        href: "/landlord/documents", description: "Upload and view leases & property files" },
  { label: "Access Requests", icon: UserCheck,       href: "/landlord/access-requests", description: "Review and approve applicant join requests" },
];

const SETTINGS_NAV_ITEM = {
  label: "Settings",
  icon: Settings2,
  href: "/landlord/settings",
  description: "Account preferences & profile setup",
};

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
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const collapsed = localStorage.getItem("landlord_sidebar_collapsed") === "true";
    setIsCollapsed(collapsed);
    const demo = isDemoSession();
    setIsDemo(demo);
    if (!demo && isSignedIn) {
      sanitizeSession(true);
    }

    const handleExit = () => setIsExiting(true);
    window.addEventListener("homepost:exit-demo", handleExit);
    return () => window.removeEventListener("homepost:exit-demo", handleExit);
  }, [isSignedIn]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("landlord_sidebar_collapsed", String(nextState));
  };

  const isDemoActive = mounted && (isDemo || (isLoaded && !isSignedIn && isDemoSession()));
  const showSettings = mounted && isSignedIn && !isDemo;

  const visibleNavItems = showSettings
    ? [...CORE_NAV_ITEMS, SETTINGS_NAV_ITEM]
    : CORE_NAV_ITEMS;

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
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))] group relative",
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
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Landlord Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isDemoActive && (
              <DemoHeaderMenu
                role="landlord"
                name="Marcus Vance"
                email="landlord@homepost.demo"
                initials="MV"
              />
            )}

            {!mounted || !isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--ml-bg-tertiary))] animate-pulse border border-border shrink-0" />
            ) : isSignedIn && !isDemoActive ? (
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
            {isDemoActive && (
              <DemoHeaderMenu
                role="landlord"
                name="Marcus Vance"
                email="landlord@homepost.demo"
                initials="MV"
                isMobile
              />
            )}
            {!mounted || !isLoaded ? (
              <div className="w-7 h-7 rounded-full bg-[rgb(var(--ml-bg-tertiary))] animate-pulse border border-border shrink-0" />
            ) : isSignedIn && !isDemoActive ? (
              <UserButton />
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[rgb(var(--ml-bg-secondary))]/95 backdrop-blur-lg border-t border-border px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-h-[64px] flex items-center justify-around pointer-events-auto">
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
                      exitDemoSession();
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

      {isExiting && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
          <div className="size-8 rounded-full border-2 border-[rgb(var(--ml-accent))] border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
            Exiting demo...
          </p>
        </div>
      )}
    </div>
  );
}
