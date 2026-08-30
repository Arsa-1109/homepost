"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Home,
  Wrench,
  Megaphone,
  FileText,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoSession, exitDemoSession, startDemoSession } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",     icon: Home,      href: "/tenant/dashboard" },
  { label: "Requests",      icon: Wrench,    href: "/tenant/requests" },
  { label: "Announcements", icon: Megaphone, href: "/tenant/announcements" },
  { label: "Documents",     icon: FileText,  href: "/tenant/documents" },
  { label: "Settings",      icon: Settings,  href: "/tenant/settings" },
];

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const collapsed = localStorage.getItem("tenant_sidebar_collapsed") === "true";
    setIsCollapsed(collapsed);
    const demo = isDemoSession();
    setIsDemo(demo);

    const handleExit = () => setIsExiting(true);
    window.addEventListener("homepost:exit-demo", handleExit);
    return () => window.removeEventListener("homepost:exit-demo", handleExit);
  }, [isSignedIn]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("tenant_sidebar_collapsed", String(nextState));
  };

  const isDemoActive = mounted && (isDemo || (isLoaded && !isSignedIn && isDemoSession()));
  const isSettingsActive = pathname === "/tenant/settings" || pathname.startsWith("/tenant/settings/");
  const showSettings = mounted && isSignedIn && !isDemo;

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.href === "/tenant/settings" && isDemoActive) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — Desktop (hidden on mobile, visible on md+) */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300 h-dvh sticky top-0 shrink-0 overflow-visible relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute top-8 right-[-14px] bg-[rgb(var(--ml-bg-secondary))] border border-border p-1 rounded-full text-[rgb(var(--ml-text-secondary))] shadow-sm z-50 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Inner scroll container */}
        <div className="flex flex-col h-full overflow-y-auto py-6">
          {!isCollapsed ? (
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold mb-8 text-[rgb(var(--ml-text-primary))] px-6 tracking-tight hover:opacity-80 transition-opacity"
            >
              <Building2 className="size-6 text-[rgb(var(--ml-accent))]" />
              <span>Homepost</span>
            </Link>
          ) : (
            <div className="flex justify-center mb-8">
              <Building2 className="size-6 text-[rgb(var(--ml-accent))]" />
            </div>
          )}

          {/* Navigation Links */}
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
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-transform group-hover:scale-105",
                      isActive && "text-[rgb(var(--ml-accent))]"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Demo Controls */}
          {isDemoActive && !isCollapsed && (
            <div className="p-3 mx-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-2 mt-auto">
              <div className="flex items-center gap-1.5 font-bold text-purple-400 text-[11px] tracking-wide uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Demo Mode
              </div>
              <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] leading-tight">
                Previewing as Resident (Sarah Jenkins).
              </p>
              <div className="pt-1 flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    startDemoSession("owner");
                    window.location.href = "/landlord/dashboard";
                  }}
                  className="w-full text-xs h-7 rounded-lg border-purple-500/30 hover:bg-purple-500/15 text-purple-400 hover:text-purple-300 cursor-pointer"
                >
                  Switch to Owner Demo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    exitDemoSession();
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
        {/* Persistent Demo Mode Banner across all screen sizes */}
        {isDemoActive && (
          <div className="bg-purple-500/10 border-b border-purple-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-purple-400 font-medium z-50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400"></span>
              </span>
              <span className="font-bold">Resident Demo (Read-Only):</span>
              <span className="text-[rgb(var(--ml-text-secondary))] hidden sm:inline">Browsing as Sarah Jenkins</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  startDemoSession("owner");
                  window.location.href = "/landlord/dashboard";
                }}
                className="h-6 px-2 text-[11px] font-bold text-purple-400 hover:text-purple-300 hover:bg-purple-500/15 rounded-md cursor-pointer"
              >
                Switch to Owner Demo &rarr;
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  exitDemoSession();
                }}
                className="h-6 px-2 text-[11px] font-bold text-[rgb(var(--ml-text-secondary))] hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer"
              >
                Exit
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Header (hidden on mobile, visible on md+) */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Tenant Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isDemoActive && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] border border-border text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">
                    SJ
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-[rgb(var(--ml-text-primary))] leading-none text-[11px]">
                      Sarah Jenkins
                    </span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    DEMO
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    startDemoSession("owner");
                    window.location.href = "/landlord/dashboard";
                  }}
                  className="text-xs h-8 rounded-lg border-border hover:border-[rgb(var(--ml-accent))] cursor-pointer px-2"
                  title="Switch to Owner Demo"
                >
                  Owner Demo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    exitDemoSession();
                  }}
                  className="text-xs text-[rgb(var(--ml-text-secondary))] hover:text-red-500 h-8 px-2 cursor-pointer"
                  title="Exit Demo Mode"
                >
                  Exit
                </Button>
              </div>
            )}

            <ThemeToggle />

            {!mounted || !isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--ml-bg-tertiary))] animate-pulse border border-border shrink-0" />
            ) : isSignedIn ? (
              <UserButton />
            ) : null}
          </div>
        </header>

        {/* Mobile Header (visible only on mobile, hidden on md+) */}
        <header className="md:hidden px-4 py-3 sm:p-4 flex justify-between items-center border-b border-border bg-[rgb(var(--ml-bg-secondary))]/95 sticky top-0 z-40 backdrop-blur-md">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-[rgb(var(--ml-text-primary))] hover:opacity-80 transition-opacity"
          >
            <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
            <span>Homepost</span>
          </Link>
          <div className="flex gap-2.5 items-center">
            {showSettings && (
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
                <Settings
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isSettingsActive ? "text-[rgb(var(--ml-accent))] scale-105" : "hover:rotate-45"
                  )}
                />
              </Link>
            )}
            <ThemeToggle />
            {!mounted || !isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--ml-bg-tertiary))] animate-pulse border border-border shrink-0" />
            ) : isSignedIn ? (
              <UserButton />
            ) : isDemoActive ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] border border-border text-xs shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold flex items-center justify-center text-[10px]">
                    SJ
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-semibold text-[rgb(var(--ml-text-primary))] leading-none text-[11px]">
                      Sarah Jenkins
                    </span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    DEMO
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    startDemoSession("owner");
                    window.location.href = "/landlord/dashboard";
                  }}
                  className="hidden sm:inline-flex text-xs h-8 rounded-lg border-border hover:border-[rgb(var(--ml-accent))] cursor-pointer px-2"
                  title="Switch to Owner Demo"
                >
                  Owner Demo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    exitDemoSession();
                  }}
                  className="text-xs text-[rgb(var(--ml-text-secondary))] hover:text-red-500 h-8 px-2 cursor-pointer"
                  title="Exit Demo Mode"
                >
                  Exit
                </Button>
              </div>
            ) : null}
          </div>
        </header>

        {/* Main Content Area (scrollable on desktop, extra bottom padding on mobile for fixed tab bar) */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto max-w-full pb-[max(6rem,calc(4rem+env(safe-area-inset-bottom)))] md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar (visible ONLY on mobile md:hidden) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center min-h-[64px] border-t border-border bg-[rgb(var(--ml-bg-secondary))]/95 backdrop-blur-md z-50 px-2 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-auto">
          {visibleNavItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] text-xs transition-colors px-2 py-1 rounded-lg touch-manipulation cursor-pointer ${
                  isActive
                    ? "text-[rgb(var(--ml-accent))]"
                    : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
                }`}
              >
                <Icon
                  className={`size-5 transition-transform ${
                    isActive ? "scale-110 text-[rgb(var(--ml-accent))]" : ""
                  }`}
                />
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
