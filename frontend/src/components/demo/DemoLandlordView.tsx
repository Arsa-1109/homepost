"use client";

import { useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  Menu,
  Sun,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LANDLORD_ACTIVE_REQUESTS,
  LANDLORD_NAV_ITEMS,
  LANDLORD_OCCUPIED_UNITS,
  LANDLORD_RECENT_ACTIVITY,
} from "@/components/demo/demoData";

interface DemoLandlordViewProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLaunchDemo: (route?: string) => void;
}

const OCCUPANCY_PERCENT = 50;
const RING_CIRCUMFERENCE = 163.4;

export function DemoLandlordView({
  isSidebarCollapsed,
  onToggleSidebar,
  activeTab,
  onSelectTab,
  onLaunchDemo,
}: DemoLandlordViewProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const strokeDashoffset =
    RING_CIRCUMFERENCE - (OCCUPANCY_PERCENT / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="relative w-full flex flex-1 overflow-hidden">
      {/* Collapsible Sidebar (reproduced from landlord/layout.tsx - icon rail on md, full on lg+) */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-border bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300 shrink-0 relative select-none",
        isSidebarCollapsed ? "w-16" : "w-16 lg:w-56 xl:w-60"
      )}>
        {/* Sidebar Collapse Toggle Button (visible on lg+) */}
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex absolute top-6 right-[-12px] bg-[rgb(var(--ml-bg-secondary))] border border-border p-1 rounded-full text-[rgb(var(--ml-text-secondary))] shadow-sm z-30 cursor-pointer transition-all duration-200 hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Inner Sidebar Container */}
        <div className="flex flex-col h-full py-5">
          {/* Homepost Logo */}
          {!isSidebarCollapsed ? (
            <div className="hidden lg:flex items-center gap-2 text-lg font-bold mb-6 text-[rgb(var(--ml-text-primary))] px-5 tracking-tight">
              <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
              <span>Homepost</span>
            </div>
          ) : null}
          <div className={cn("flex justify-center mb-6", !isSidebarCollapsed && "lg:hidden")}>
            <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
          </div>

          {/* Nav Links */}
          <nav className="flex-1 space-y-1 px-2.5">
            {LANDLORD_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onLaunchDemo(item.href || `/landlord/${item.id.toLowerCase().replace(/\s+/g, "-")}`);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer text-left group",
                    isSidebarCollapsed ? "justify-center px-0" : "justify-center lg:justify-start px-0 lg:px-3",
                    isActive
                      ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] font-bold border-l-2 border-[rgb(var(--ml-accent))] rounded-l-none"
                      : "text-[rgb(var(--ml-text-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-text-primary))]"
                  )}
                  title={item.label}
                >
                  <Icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-105", isActive && "text-[rgb(var(--ml-accent))]")} />
                  {!isSidebarCollapsed && (
                    <span className="hidden lg:inline truncate flex-1 font-semibold">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* Main Landlord Content View */}
      <div className="flex-1 flex flex-col min-w-0 bg-[rgb(var(--ml-bg-primary))] max-h-[560px] sm:max-h-none overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Desktop Top Header Bar (from landlord/layout.tsx header) */}
        <header className="h-14 items-center justify-between px-6 border-b border-border bg-[rgb(var(--ml-bg-secondary))] hidden md:flex sticky top-0 z-10 shrink-0">
          <div className="font-bold text-base text-[rgb(var(--ml-text-primary))] capitalize">
            {activeTab}
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

        {/* Mobile Top Header Bar (from landlord/layout.tsx mobile header) */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-[rgb(var(--ml-bg-secondary))] sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--ml-text-primary))]">
            <Building2 className="size-4 text-[rgb(var(--ml-accent))]" />
            <span>Homepost</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-[rgb(var(--ml-accent))]/20 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/40 flex items-center justify-center text-[10px] font-bold">
              MV
            </div>
            <div className="p-1 rounded-lg border border-border bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))]">
              <Sun className="w-3 h-3" />
            </div>
          </div>
        </header>

        {/* Dashboard Inner Body (DashboardHeader + Action Banner + Bento Grid) */}
        <div className="p-3 sm:p-5 lg:p-6 flex flex-col gap-3.5 sm:gap-4 max-w-7xl mx-auto w-full pb-8">

          {/* Dashboard Header (from DashboardHeader.tsx) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-1 border-b border-border/40">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                <LayoutDashboard className="w-3 h-3 text-[rgb(var(--ml-accent))]" />
                Control Center
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                Landlord Dashboard
              </h1>
              <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Overview of property performance, maintenance requests, and tenant activity.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onLaunchDemo("/landlord/units")}
                className="text-xs font-bold border border-border/60 text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5 text-[rgb(var(--ml-text-secondary))]" />
                Invite Tenant
              </button>
              <button
                onClick={() => onLaunchDemo("/landlord/announcements")}
                className="text-xs bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-3 py-2 rounded-xl hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Megaphone className="h-3.5 w-3.5" />
                New Announcement
              </button>
            </div>
          </div>

          {/* Action Required Banner (from landlord/dashboard/page.tsx) */}
          <div className="bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs hover:border-border transition-all">
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
              onClick={() => onLaunchDemo("/landlord/access-requests")}
              className="px-3 py-1.5 bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all"
            >
              Review Requests
            </button>
          </div>

          {/* 4 Bento Grid Cards (exact replica of DashboardBentoGrid.tsx) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 items-start">

            {/* LEFT COLUMN: Active Maintenance & Recent Activity */}
            <div className="md:col-span-7 flex flex-col gap-4 lg:gap-5">

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
                              {req.property_name} · {req.unit_label}
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
                              {act.property_name}{act.unit_label ? ` · ${act.unit_label}` : ""} ·{" "}
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
            <div className="md:col-span-5 flex flex-col gap-4 lg:gap-5">

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
                        strokeDasharray={RING_CIRCUMFERENCE}
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
                          {unit.unit_label}
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
              </div>

            </div>

          </div>

        </div>

        {/* Mobile Bottom Navigation Bar (exact match to landlord/layout.tsx) */}
        <nav className="md:hidden sticky bottom-0 left-0 right-0 z-30 bg-[rgb(var(--ml-bg-secondary))]/95 backdrop-blur-lg border-t border-border px-2 pt-1.5 pb-2 min-h-[58px] flex items-center justify-around">
          {LANDLORD_NAV_ITEMS.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onLaunchDemo(item.href || `/landlord/${item.id.toLowerCase().replace(/\s+/g, "-")}`);
                }}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-1 rounded-xl text-[10px] font-semibold transition-all duration-200 cursor-pointer touch-manipulation",
                  isActive
                    ? "text-[rgb(var(--ml-accent))]"
                    : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
                )}
              >
                <Icon className={cn("size-4.5 transition-transform", isActive && "scale-110 text-[rgb(var(--ml-accent))]")} />
                <span className="truncate max-w-[64px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* 5th Tab: More Button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-1 rounded-xl text-[10px] font-semibold transition-all duration-200 cursor-pointer touch-manipulation",
              (isMoreOpen || LANDLORD_NAV_ITEMS.slice(4).some((item) => activeTab === item.id))
                ? "text-[rgb(var(--ml-accent))]"
                : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
            )}
            aria-label="More navigation options"
          >
            <Menu className={cn("size-4.5 transition-transform", (isMoreOpen || LANDLORD_NAV_ITEMS.slice(4).some((item) => activeTab === item.id)) && "scale-110 text-[rgb(var(--ml-accent))]")} />
            <span className="truncate max-w-[64px] tracking-tight mt-0.5">More</span>
          </button>
        </nav>

        {/* Frame-Contained "More" Slide-up Drawer strictly inside Demo Window */}
        <AnimatePresence>
          {isMoreOpen && (
            <>
              {/* Contained Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMoreOpen(false)}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs cursor-pointer"
              />

              {/* Contained Drawer Panel */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="absolute bottom-0 inset-x-0 z-50 bg-[rgb(var(--ml-bg-secondary))] border-t border-border rounded-t-3xl p-5 shadow-2xl max-h-[80%] overflow-y-auto"
              >
                {/* Drag Handle */}
                <div
                  onClick={() => setIsMoreOpen(false)}
                  className="mx-auto w-12 h-1.5 rounded-full bg-border/80 mb-4 cursor-pointer hover:bg-border transition-colors"
                />

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">More Options</h3>
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))] mt-0.5">
                      Property management tools and settings
                    </p>
                  </div>
                  <button
                    onClick={() => setIsMoreOpen(false)}
                    className="p-1.5 rounded-lg border border-border text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))] cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cohesive Full-Width List Cards */}
                <div className="flex flex-col gap-2.5">
                  {LANDLORD_NAV_ITEMS.slice(4).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setIsMoreOpen(false);
                          onSelectTab(item.id);
                          onLaunchDemo(item.href || `/landlord/${item.id.toLowerCase().replace(/\s+/g, "-")}`);
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.99] text-left w-full",
                          isActive
                            ? "bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))]/40 shadow-sm"
                            : "bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] border-border/70 hover:bg-[rgb(var(--ml-bg-tertiary))] hover:border-border"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isActive 
                              ? "bg-[rgb(var(--ml-accent))]/15 text-[rgb(var(--ml-accent))]" 
                              : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/50"
                          )}>
                            <Icon className="size-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs leading-tight truncate">{item.label}</div>
                            <div className="text-[11px] text-[rgb(var(--ml-text-secondary))] mt-0.5 truncate">
                              {item.description || "Property management tools & settings"}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={cn("size-4 shrink-0 transition-transform ml-2", isActive ? "text-[rgb(var(--ml-accent))]" : "text-[rgb(var(--ml-text-secondary))] opacity-60")} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
