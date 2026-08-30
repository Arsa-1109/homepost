"use client";

import {
  ArrowRight,
  Battery,
  Building2,
  Calendar,
  Clock,
  Megaphone,
  Settings,
  Signal,
  Sun,
  Wifi,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TENANT_REQUESTS, TENANT_TABS } from "@/components/demo/demoData";

interface DemoTenantPhoneProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLaunchDemo: (route?: string) => void;
}

export function DemoTenantPhone({ activeTab, onSelectTab, onLaunchDemo }: DemoTenantPhoneProps) {
  return (
    <>
      {/* Soft Ambient Glow behind phone */}
      <div className="absolute w-72 h-72 bg-[rgb(var(--ml-accent))]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Realistic Smartphone Chassis */}
      <div className="w-full max-w-[390px] rounded-[48px] p-3 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black border-[3px] border-zinc-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] relative z-10 transition-all duration-300">

        {/* Device Screen Viewport */}
        <div className="rounded-[38px] overflow-hidden bg-background border border-border/50 relative flex flex-col h-[620px] sm:h-[650px] lg:h-[680px] isolate transform-gpu">

          {/* Top iOS/Android Status Bar */}
          <div className="h-10 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between px-6 pt-1 text-[11px] font-bold text-[rgb(var(--ml-text-primary))] z-30 select-none rounded-t-[37px]">
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
          <header className="p-3.5 flex justify-between items-center border-b border-border bg-[rgb(var(--ml-bg-secondary))] z-20">
            <div className="flex items-center gap-1.5 font-bold text-base text-[rgb(var(--ml-text-primary))]">
              <Building2 className="size-4 text-[rgb(var(--ml-accent))]" />
              <span className="tracking-tight">Homepost</span>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => onLaunchDemo("/tenant/settings")}
                className="size-7 rounded-lg flex items-center justify-center bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border cursor-pointer hover:text-[rgb(var(--ml-text-primary))]"
              >
                <Settings className="size-3.5" />
              </button>
              <div className="size-7 rounded-lg flex items-center justify-center bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border">
                <Sun className="size-3.5" />
              </div>
              <div className="size-7 rounded-full bg-[rgb(var(--ml-accent))] text-black font-extrabold text-[10px] flex items-center justify-center">
                SJ
              </div>
            </div>
          </header>

          {/* Scrollable Tenant Dashboard Content (from tenant/dashboard/page.tsx) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 pb-20">

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
            <div 
              onClick={() => onLaunchDemo("/tenant/announcements")}
              className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all duration-200 cursor-pointer"
            >
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
              onClick={() => onLaunchDemo("/tenant/requests/new")}
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
                    onClick={() => onLaunchDemo("/tenant/requests")}
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
                          {req.status.replace("_", " ")}
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
          <nav className="absolute bottom-0 left-0 right-0 h-16 pb-2.5 pt-1.5 border-t border-border bg-[rgb(var(--ml-bg-secondary))]/95 backdrop-blur-md flex items-center justify-around z-30 px-2 rounded-b-[37px] overflow-hidden">
            {TENANT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onSelectTab(tab.id);
                    onLaunchDemo(tab.href || `/tenant/${tab.id}`);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center text-[10px] font-medium transition-all px-2 py-0.5 rounded-lg cursor-pointer",
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
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <div className="w-28 h-1 bg-foreground/25 rounded-full" />
          </div>

        </div>
      </div>
    </>
  );
}
