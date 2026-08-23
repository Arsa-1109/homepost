"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Building2, Home, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DemoLandlordView } from "@/components/demo/DemoLandlordView";
import { DemoTenantPhone } from "@/components/demo/DemoTenantPhone";

interface DemoDashboardProps {
  role?: "owner" | "tenant";
  onLaunchDemo?: (role: "owner" | "tenant") => void;
}

export function DemoDashboard({ role = "owner", onLaunchDemo }: DemoDashboardProps) {
  // Active role can be controlled by parent or switched internally
  const [selectedRole, setSelectedRole] = useState<"owner" | "tenant">(role);

  // Keep internal state synced if parent prop changes
  React.useEffect(() => {
    setSelectedRole(role);
  }, [role]);

  // Landlord demo states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeLandlordTab, setActiveLandlordTab] = useState("Dashboard");

  // Tenant demo states
  const [activeTenantTab, setActiveTenantTab] = useState("home");

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-border/80 glass-panel relative bg-card/85 backdrop-blur-2xl transition-all duration-300 ring-1 ring-white/10 dark:ring-white/5">

      {/* Top Interactive Browser Chrome Bar */}
      <div className="h-14 md:h-16 border-b border-border/70 flex items-center justify-between px-3.5 sm:px-6 bg-[rgb(var(--ml-bg-secondary))]/90 backdrop-blur-xl z-20 gap-2 sm:gap-4">

        {/* Left: Window Controls + Live Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/30 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/30 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/30 inline-block" />
          </div>

          <div className="h-4 w-px bg-border/80 hidden sm:block shrink-0" />

          {/* URL Pill / Title */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/50 border border-border/60 text-xs font-mono text-[rgb(var(--ml-text-secondary))] truncate">
            <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">
              homepost.app/<span className="text-[rgb(var(--ml-text-primary))] font-semibold">{selectedRole === "owner" ? "landlord/dashboard" : "tenant/dashboard"}</span>
            </span>
          </div>

          <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
            <Sparkles className="w-2.5 h-2.5" /> 1:1 Live Preview
          </span>
        </div>

        {/* Center: Interactive Role Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-background/60 border border-border/60 shrink-0">
          <button
            onClick={() => setSelectedRole("owner")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              selectedRole === "owner"
                ? "bg-[rgb(var(--ml-accent))] text-black shadow-xs"
                : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Owner</span>
            <span className="sm:hidden">Owner</span>
          </button>
          <button
            onClick={() => setSelectedRole("tenant")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              selectedRole === "tenant"
                ? "bg-[rgb(var(--ml-accent))] text-black shadow-xs"
                : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
            )}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resident</span>
            <span className="sm:hidden">Tenant</span>
          </button>
        </div>

        {/* Right: Search / User Pill */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.7)] text-black flex items-center justify-center font-black text-xs shadow-sm">
              {selectedRole === "owner" ? "MV" : "SJ"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))] leading-tight">
                {selectedRole === "owner" ? "Marcus Vance" : "Sarah Jenkins"}
              </span>
              <span className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))] leading-tight capitalize">
                {selectedRole === "owner" ? "Landlord Portfolio" : "Unit 101"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage with Animated Role Transitions */}
      <div className="relative min-h-[580px] flex flex-col bg-background/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedRole === "owner" ? (
            /* ===============================================================
               1. PROPERTY OWNER (LANDLORD) DESKTOP 1:1 REPRODUCTION
               =============================================================== */
            <motion.div
              key="owner-desktop-1-to-1"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-1 overflow-hidden"
            >
              <DemoLandlordView
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                activeTab={activeLandlordTab}
                onSelectTab={setActiveLandlordTab}
                onLaunchDemo={() => onLaunchDemo?.("owner")}
              />
            </motion.div>
          ) : (
            /* ===============================================================
               2. RESIDENT (TENANT) SMARTPHONE MOCKUP 1:1 REPRODUCTION
               =============================================================== */
            <motion.div
              key="resident-mobile-1-to-1"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-1 items-center justify-center p-4 sm:p-8 lg:p-10 relative"
            >
              <DemoTenantPhone
                activeTab={activeTenantTab}
                onSelectTab={setActiveTenantTab}
                onLaunchDemo={() => onLaunchDemo?.("tenant")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Instant Launch Banner Bar */}
      <div className="p-3.5 sm:px-6 bg-[rgb(var(--ml-bg-secondary))] border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-2 text-[rgb(var(--ml-text-secondary))] font-medium text-center sm:text-left">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Interactive 1:1 replica with live sample data. Explore full app in one click:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {selectedRole === "owner" ? (
            <Button
              size="sm"
              onClick={() => onLaunchDemo?.("owner")}
              className="w-full sm:w-auto font-bold rounded-xl px-5 bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-black hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Explore Live Owner Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onLaunchDemo?.("tenant")}
              className="w-full sm:w-auto font-bold rounded-xl px-5 bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-black hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Explore Live Resident Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
