"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Users, 
  Wrench, 
  Megaphone, 
  FileText, 
  Settings2, 
  Settings,
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Home, 
  UserPlus, 
  Zap, 
  Droplets, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Sun, 
  Wifi, 
  Battery, 
  Signal, 
  Lock,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DemoDashboardProps {
  role?: "owner" | "tenant";
  onLaunchDemo?: (role: "owner" | "tenant") => void;
}

// ---------------------------------------------------------------------------
// Landlord Navigation Items & Mock Data
// ---------------------------------------------------------------------------
const LANDLORD_NAV_ITEMS = [
  { id: "Dashboard",     label: "Dashboard",     icon: LayoutDashboard, badge: null },
  { id: "Properties",    label: "Properties",    icon: Building2,       badge: "2" },
  { id: "Units",         label: "Units",         icon: Home,            badge: "4" },
  { id: "Requests",      label: "Requests",      icon: Wrench,          badge: "3", badgeColor: "amber" },
  { id: "Announcements", label: "Announcements", icon: Megaphone,       badge: null },
  { id: "Documents",     label: "Documents",     icon: FileText,        badge: null },
  { id: "Settings",      label: "Settings",      icon: Settings2,       badge: null },
];

const LANDLORD_ACTIVE_REQUESTS = [
  {
    id: "req-1",
    title: "HVAC blowing warm air",
    priority: "urgent",
    status: "in_progress",
    unit_label: "2A",
    property_name: "Sunset Vista",
    created_at: "11 Aug 2026",
    icon: Zap,
  },
  {
    id: "req-2",
    title: "Leaking kitchen sink pipe",
    priority: "high",
    status: "open",
    unit_label: "101",
    property_name: "Maplewood Heights",
    created_at: "13 Aug 2026",
    icon: Droplets,
  },
];

const LANDLORD_RECENT_ACTIVITY = [
  {
    id: "act-1",
    type: "maintenance_update",
    title: "HVAC blowing warm air",
    property_name: "Sunset Vista",
    unit_label: "2A",
    status_text: "In Progress",
    status_type: "in_progress",
    date: "14 Aug 2026",
    icon: Zap,
  },
  {
    id: "act-2",
    type: "maintenance_update",
    title: "Leaking kitchen sink pipe",
    property_name: "Maplewood Heights",
    unit_label: "101",
    status_text: "Open",
    status_type: "open",
    date: "13 Aug 2026",
    icon: Droplets,
  },
  {
    id: "act-3",
    type: "maintenance_update",
    title: "Broken balcony door latch",
    property_name: "Maplewood Heights",
    unit_label: "101",
    status_text: "Case closed by tenant",
    status_type: "closed",
    date: "10 Aug 2026",
    icon: Wrench,
  },
  {
    id: "act-4",
    type: "announcement_posted",
    title: "Scheduled Plumbing Riser Inspection",
    property_name: "Maplewood Heights",
    unit_label: "",
    status_text: "Announcement posted",
    status_type: "announcement",
    date: "9 Aug 2026",
    icon: Megaphone,
  },
];

const LANDLORD_OCCUPIED_UNITS = [
  {
    id: "unit-1",
    initials: "101",
    unit_label: "101",
    tenant_name: "Sarah Jenkins",
    property_name: "Maplewood Heights",
    has_maintenance: true,
  },
  {
    id: "unit-2",
    initials: "2A",
    unit_label: "2A",
    tenant_name: "Alex Rivera",
    property_name: "Sunset Vista",
    has_maintenance: true,
  },
];

// ---------------------------------------------------------------------------
// Tenant Navigation Items & Mock Data
// ---------------------------------------------------------------------------
const TENANT_TABS = [
  { id: "home",     label: "Home",     icon: Home },
  { id: "requests", label: "Requests", icon: Wrench },
  { id: "news",     label: "News",     icon: Megaphone },
  { id: "docs",     label: "Docs",     icon: FileText },
];

const TENANT_REQUESTS = [
  {
    id: "treq-1",
    title: "Leaking kitchen sink pipe",
    status: "open",
    priority: "high",
    date: "Aug 13",
  },
  {
    id: "treq-2",
    title: "Broken balcony door latch",
    status: "resolved",
    priority: "low",
    date: "Aug 5",
  },
];

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

  // Occupancy circular ring calculation
  const occupancyPercent = 50;
  const circumference = 163.4;
  const strokeDashoffset = circumference - (occupancyPercent / 100) * circumference;

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
              {/* Collapsible Sidebar (reproduced from landlord/layout.tsx) */}
              <aside className={cn(
                "hidden md:flex flex-col border-r border-border bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300 shrink-0 relative select-none",
                isSidebarCollapsed ? "w-16" : "w-56 lg:w-60"
              )}>
                {/* Sidebar Collapse Toggle Button */}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="absolute top-6 right-[-12px] bg-[rgb(var(--ml-bg-secondary))] border border-border p-1 rounded-full text-[rgb(var(--ml-text-secondary))] shadow-sm z-30 cursor-pointer transition-all duration-200 hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                  aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </button>

                {/* Inner Sidebar Container */}
                <div className="flex flex-col h-full py-5">
                  {/* Homepost Logo */}
                  {!isSidebarCollapsed ? (
                    <div className="flex items-center gap-2 text-lg font-bold mb-6 text-[rgb(var(--ml-text-primary))] px-5 tracking-tight">
                      <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
                      <span>Homepost</span>
                    </div>
                  ) : (
                    <div className="flex justify-center mb-6">
                      <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
                    </div>
                  )}

                  {/* Nav Links */}
                  <nav className="flex-1 space-y-1 px-2.5">
                    {LANDLORD_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeLandlordTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveLandlordTab(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer text-left group",
                            isSidebarCollapsed && "justify-center px-0",
                            isActive
                              ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] font-bold border-l-2 border-[rgb(var(--ml-accent))] rounded-l-none"
                              : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-text-primary))]"
                          )}
                          title={isSidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-105", isActive && "text-[rgb(var(--ml-accent))]")} />
                          {!isSidebarCollapsed && (
                            <span className="truncate flex-1 font-semibold">{item.label}</span>
                          )}
                          {!isSidebarCollapsed && item.badge && (
                            <span className={cn(
                              "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border",
                              item.badgeColor === "amber"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-muted text-[rgb(var(--ml-text-secondary))] border-border/40"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Sidebar Bottom Indicator */}
                  {!isSidebarCollapsed && (
                    <div className="pt-4 border-t border-border/60 px-4 flex items-center justify-between text-[11px] text-[rgb(var(--ml-text-secondary))]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Database
                      </span>
                      <span className="font-mono text-[10px] opacity-70">v2.4</span>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main Landlord Content View */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Desktop Top Header Bar (from landlord/layout.tsx header) */}
                <header className="h-14 items-center justify-between px-6 border-b border-border bg-[rgb(var(--ml-bg-secondary))] hidden md:flex sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
                  <div className="font-bold text-base text-[rgb(var(--ml-text-primary))] capitalize">
                    {activeLandlordTab}
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-7 h-7 rounded-full bg-[rgb(var(--ml-accent))]/20 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/40 flex items-center justify-center text-xs font-bold">
                      MV
                    </div>
                    <div className="p-1.5 rounded-lg border border-border bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))]">
                      <Sun className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </header>

                {/* Dashboard Inner Body (DashboardHeader + Action Banner + Bento Grid) */}
                <div className="p-4 sm:p-6 lg:p-7 flex flex-col gap-5 max-w-7xl mx-auto w-full">
                  
                  {/* Dashboard Header (from DashboardHeader.tsx) */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1 border-b border-border/40">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                        <LayoutDashboard className="w-3 h-3 text-[rgb(var(--ml-accent))]" />
                        Control Center
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                        Landlord Dashboard
                      </h1>
                      <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                        Overview of property performance, maintenance requests, and tenant activity.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => onLaunchDemo?.("owner")}
                        className="text-xs font-bold border border-border/60 text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <UserPlus className="h-3.5 w-3.5 text-[rgb(var(--ml-text-secondary))]" />
                        Invite Tenant
                      </button>
                      <button 
                        onClick={() => onLaunchDemo?.("owner")}
                        className="text-xs bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-3.5 py-2 rounded-xl hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all duration-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Megaphone className="h-3.5 w-3.5" />
                        New Announcement
                      </button>
                    </div>
                  </div>

                  {/* Action Required Banner (from landlord/dashboard/page.tsx) */}
                  <div className="bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-border transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[rgb(var(--ml-text-primary))]">Action Required</h4>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            1 Pending
                          </span>
                        </div>
                        <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] mt-0.5">
                          You have 1 pending tenant request waiting for approval.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onLaunchDemo?.("owner")}
                      className="px-3 py-1.5 bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all"
                    >
                      Review Requests
                    </button>
                  </div>

                  {/* 4 Bento Grid Cards (exact replica of DashboardBentoGrid.tsx) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN: Active Maintenance & Recent Activity */}
                    <div className="lg:col-span-7 flex flex-col gap-5">
                      
                      {/* Card 1: Active Maintenance */}
                      <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-5 shadow-xs">
                        <div className="flex items-center justify-between px-5 pb-3">
                          <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
                            Active maintenance
                          </span>
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border/40">
                            2 open
                          </span>
                        </div>
                        <div className="divide-y divide-border/40">
                          {LANDLORD_ACTIVE_REQUESTS.map((req) => {
                            const ReqIcon = req.icon;
                            return (
                              <div 
                                key={req.id}
                                className="flex items-center justify-between py-2.5 px-5 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 transition-all duration-200 cursor-pointer group border-l-[3px] border-l-[#FB923C]"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-orange-500/10 text-orange-600 dark:bg-[rgba(251,146,60,0.12)] dark:text-[#FB923C]">
                                    <ReqIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[13px] font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                                      {req.title}
                                    </div>
                                    <div className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-semibold mt-0.5 truncate">
                                      {req.property_name} · Unit {req.unit_label}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 pl-2">
                                  <div className="flex flex-col items-end justify-center">
                                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full capitalize uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:bg-[rgba(251,146,60,0.12)] dark:text-[#FB923C]">
                                      {req.priority}
                                    </span>
                                    <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5">
                                      Reported {req.created_at}
                                    </span>
                                  </div>
                                  <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-base leading-none select-none">&rsaquo;</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-5 pt-3 border-t border-border/40 text-center">
                          <button 
                            onClick={() => onLaunchDemo?.("owner")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline cursor-pointer"
                          >
                            View all active requests (2) &rarr;
                          </button>
                        </div>
                      </div>

                      {/* Card 2: Recent Activity */}
                      <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-5 shadow-xs overflow-hidden">
                        <div className="px-5 pb-3">
                          <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
                            Recent activity
                          </span>
                        </div>
                        <div className="divide-y divide-border/40">
                          {LANDLORD_RECENT_ACTIVITY.map((act) => {
                            const ActIcon = act.icon;
                            const isResolved = act.status_type === "closed";
                            return (
                              <div 
                                key={act.id}
                                className="py-2.5 px-5 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 flex gap-3 items-start transition-all duration-200 cursor-pointer group"
                              >
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                                  isResolved 
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                    : "bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))]/20"
                                )}>
                                  <ActIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                                    {act.title}
                                  </div>
                                  <div className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5">
                                    <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                                      {act.property_name}{act.unit_label ? ` · Unit ${act.unit_label}` : ""} ·{" "}
                                    </span>
                                    {isResolved ? (
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{act.status_text}</span>
                                    ) : (
                                      <>Status: <span className="font-bold text-teal-600 dark:text-[#2DD4BF]">{act.status_text}</span></>
                                    )}
                                    {" · "}{act.date}
                                  </div>
                                </div>
                                <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-base self-center select-none">&rsaquo;</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: Overview & Occupied Units */}
                    <div className="lg:col-span-5 flex flex-col gap-5">
                      
                      {/* Card 3: Property Overview */}
                      <div className="bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl p-5 shadow-xs">
                        <div className="pb-3">
                          <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
                            Overview
                          </span>
                        </div>
                        <div className="flex flex-col gap-3.5">
                          <div className="flex bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-2xl overflow-hidden">
                            <div className="flex-1 p-3.5">
                              <div className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-extrabold mb-1 uppercase tracking-wider">Properties</div>
                              <div className="text-2xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] leading-none tabular-nums">2</div>
                            </div>
                            <div className="flex-1 p-3.5 border-l border-border/60">
                              <div className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-extrabold mb-1 uppercase tracking-wider">Total units</div>
                              <div className="text-2xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] leading-none tabular-nums">4</div>
                            </div>
                          </div>

                          {/* SVG Occupancy Percentage Ring */}
                          <div className="flex items-center gap-3.5 py-1">
                            <svg width="54" height="54" viewBox="0 0 64 64" className="shrink-0">
                              <circle cx="32" cy="32" r="26" fill="none" className="stroke-zinc-200 dark:stroke-[#1E2731]" strokeWidth="8"/>
                              <circle 
                                cx="32" 
                                cy="32" 
                                r="26" 
                                fill="none" 
                                className="stroke-[rgb(var(--ml-accent))]" 
                                strokeWidth="8"
                                strokeDasharray={circumference} 
                                strokeDashoffset={strokeDashoffset} 
                                strokeLinecap="round"
                                transform="rotate(-90 32 32)"
                              />
                            </svg>
                            <div className="text-xs text-[rgb(var(--ml-text-secondary))] font-semibold leading-tight select-none">
                              <span className="text-[rgb(var(--ml-text-primary))] text-sm font-black">50%</span> occupancy<br />across your portfolio
                            </div>
                          </div>

                          {/* Breakdown Rows */}
                          <div className="border-t border-border/40 pt-1 space-y-1">
                            <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                              <div className="flex items-center gap-2 text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                Occupied
                              </div>
                              <div className="text-xs font-black text-[rgb(var(--ml-text-primary))] tabular-nums">2</div>
                            </div>
                            <div className="flex justify-between items-center py-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                                Vacant
                              </div>
                              <div className="text-xs font-black text-[rgb(var(--ml-text-primary))] tabular-nums">2</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Occupied Units */}
                      <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-5 shadow-xs">
                        <div className="px-5 pb-3">
                          <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
                            Occupied Units
                          </span>
                        </div>
                        <div className="divide-y divide-border/40">
                          {LANDLORD_OCCUPIED_UNITS.map((unit) => (
                            <div 
                              key={unit.id}
                              className="flex items-center gap-3 py-2.5 px-5 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 transition-all duration-200 cursor-pointer group"
                            >
                              <div className="w-8 h-8 rounded-xl bg-[rgb(var(--ml-bg-tertiary))] border border-border/40 flex items-center justify-center font-black text-xs text-[rgb(var(--ml-text-primary))] shrink-0">
                                {unit.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                                  Unit {unit.unit_label}
                                </div>
                                <div className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-semibold mt-0.5 truncate">
                                  {unit.tenant_name} · {unit.property_name}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {unit.has_maintenance && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Maint.
                                  </span>
                                )}
                                <span className="text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Occupied
                                </span>
                                <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-base leading-none select-none ml-1">&rsaquo;</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 pt-3 border-t border-border/40 text-center">
                          <button 
                            onClick={() => onLaunchDemo?.("owner")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline cursor-pointer"
                          >
                            View all units (4) &rarr;
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
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
              {/* Soft Ambient Glow behind phone */}
              <div className="absolute w-72 h-72 bg-[rgb(var(--ml-accent))]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Realistic Smartphone Chassis */}
              <div className="w-full max-w-[390px] rounded-[48px] p-3 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-[3px] border-zinc-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] relative z-10 transition-all duration-300">
                
                {/* Device Screen Viewport */}
                <div className="rounded-[38px] overflow-hidden bg-background border border-border/50 relative flex flex-col min-h-[620px] max-h-[680px]">
                  
                  {/* Top iOS/Android Status Bar */}
                  <div className="h-10 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between px-6 pt-1 text-[11px] font-bold text-[rgb(var(--ml-text-primary))] z-30 select-none">
                    <span>9:41</span>
                    {/* Dynamic Island / Camera Pill */}
                    <div className="w-24 h-4 bg-black rounded-full mx-auto" />
                    <div className="flex items-center gap-1.5 text-[rgb(var(--ml-text-secondary))]">
                      <Signal className="w-3 h-3" />
                      <Wifi className="w-3 h-3" />
                      <Battery className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>

                  {/* Tenant Portal Top Header (reproduced from tenant/layout.tsx) */}
                  <header className="p-3.5 flex justify-between items-center border-b border-border bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                    <div className="flex items-center gap-1.5 font-bold text-base text-[rgb(var(--ml-text-primary))]">
                      <Building2 className="size-4 text-[rgb(var(--ml-accent))]" />
                      <span className="tracking-tight">Homepost</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="size-7 rounded-lg flex items-center justify-center bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border">
                        <Settings className="size-3.5" />
                      </div>
                      <div className="size-7 rounded-lg flex items-center justify-center bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border">
                        <Sun className="size-3.5" />
                      </div>
                      <div className="size-7 rounded-full bg-[rgb(var(--ml-accent))] text-black font-extrabold text-[10px] flex items-center justify-center">
                        SJ
                      </div>
                    </div>
                  </header>

                  {/* Scrollable Tenant Dashboard Content (from tenant/dashboard/page.tsx) */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                    
                    {/* 1. Header Section */}
                    <div className="space-y-0.5 pb-0.5">
                      <h1 className="text-2xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                        Welcome Home
                      </h1>
                      <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                        Unit 101 · Maplewood Heights, Austin
                      </p>
                    </div>

                    {/* 2. Latest Announcement Banner */}
                    <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all duration-200 cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-400">
                              Latest Notice
                            </span>
                            <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium">
                              Yesterday
                            </span>
                          </div>
                          <h3 className="font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate mt-0.5">
                            Scheduled Plumbing Riser Inspection
                          </h3>
                          <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] line-clamp-1 mt-0.5 leading-snug">
                            Plumbing inspection for Unit 101 is scheduled for tomorrow at 2:00 PM.
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))] self-center shrink-0" />
                      </div>
                    </div>

                    {/* 3. Hero Metric Cards: Rent Due + Lease Expiration (2-col grid) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Rent Due Card */}
                      <div className="p-3.5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[rgb(var(--ml-accent))]" />
                          Rent Due
                        </span>
                        <div className="my-1.5">
                          <span className="text-2xl font-black text-[rgb(var(--ml-accent))]">16d</span>
                        </div>
                        <p className="text-[10px] font-medium text-[rgb(var(--ml-text-secondary))] leading-tight">
                          Due 1st of month
                        </p>
                      </div>

                      {/* Lease Expiration Card */}
                      <div className="p-3.5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[rgb(var(--ml-accent))]" />
                          Lease Left
                        </span>
                        <div className="my-1.5">
                          <span className="text-2xl font-black text-[rgb(var(--ml-text-primary))]">138d</span>
                        </div>
                        <p className="text-[10px] font-medium text-[rgb(var(--ml-text-secondary))] leading-tight">
                          Ends Jan 1, 2027
                        </p>
                      </div>
                    </div>

                    {/* 4. Primary Full-Width CTA: New Maintenance Request */}
                    <Button
                      onClick={() => onLaunchDemo?.("tenant")}
                      className="w-full h-11 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs shadow-sm cursor-pointer transition-all duration-200 hover:bg-[rgb(var(--ml-accent))] hover:text-black flex items-center justify-center gap-2"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>+ New Maintenance Request</span>
                    </Button>

                    {/* 5. Recent Maintenance Activity */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between px-0.5">
                        <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                          Recent Maintenance
                        </h2>
                        <span className="text-[10px] font-bold text-[rgb(var(--ml-accent))]">2 tickets</span>
                      </div>

                      <div className="space-y-2">
                        {TENANT_REQUESTS.map((req) => (
                          <div
                            key={req.id}
                            className="p-3 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between gap-2 hover:border-[rgb(var(--ml-accent))]/40 transition-all cursor-pointer"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider border",
                                  req.status === "open"
                                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                )}>
                                  {req.status}
                                </span>
                                <span className="text-[9px] text-[rgb(var(--ml-text-secondary))] font-medium capitalize">
                                  {req.priority}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                                {req.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--ml-text-secondary))] shrink-0 font-medium">
                              <span>{req.date}</span>
                              <ArrowRight className="w-3 h-3 text-[rgb(var(--ml-text-secondary))]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* 6. Mobile Bottom Navigation Bar (from tenant/layout.tsx) */}
                  <nav className="absolute bottom-0 left-0 right-0 h-14 border-t border-border bg-[rgb(var(--ml-bg-secondary))]/95 backdrop-blur-md flex items-center justify-around z-30 px-2">
                    {TENANT_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTenantTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTenantTab(tab.id)}
                          className={cn(
                            "flex flex-col items-center justify-center text-[10px] font-medium transition-all px-2 py-1 rounded-lg cursor-pointer",
                            isActive
                              ? "text-[rgb(var(--ml-accent))] font-bold"
                              : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
                          )}
                        >
                          <Icon className={cn("size-4 transition-transform", isActive && "scale-110 text-[rgb(var(--ml-accent))]")} />
                          <span className="mt-0.5 text-[9px]">{tab.label}</span>
                          {isActive && (
                            <span className="w-1 h-1 rounded-full bg-[rgb(var(--ml-accent))] mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Phone Bottom Home Indicator */}
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center z-40 pointer-events-none">
                    <div className="w-24 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>

                </div>
              </div>
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

