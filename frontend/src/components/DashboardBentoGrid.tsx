import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AlertCircle, Activity, Home, FileText, Wrench, Zap, Key, Droplets, Plus, LucideIcon } from "lucide-react"

function formatStatusText(str: string) {
  if (!str) return "Unknown";
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function getStatusColor(str: string) {
  const s = (str || "").toLowerCase();
  if (s === 'closed' || s === 'resolved') return 'text-muted-foreground';
  return 'text-teal-600 dark:text-[#2DD4BF]';
}

const getMaintenanceIcon = (title: string): LucideIcon => {
  const t = title.toLowerCase();
  if (t.includes('toilet') || t.includes('flush') || t.includes('bathroom') || t.includes('plumb') || t.includes('leak') || t.includes('faucet') || t.includes('water') || t.includes('tap') || t.includes('sink') || t.includes('pipe') || t.includes('drain')) {
    if (t.includes('toilet') || t.includes('bathroom') || t.includes('flush')) return Droplets;
    return Wrench;
  }
  if (t.includes('light') || t.includes('bulb') || t.includes('electric') || t.includes('wire') || t.includes('power')) return Zap;
  if (t.includes('key') || t.includes('lock') || t.includes('door') || t.includes('gate')) return Key;
  return Wrench;
};

const getUnitInitials = (label: string): string => {
  const noiseWords = new Set(["unit", "the", "a", "an", "of", "and", "or", "in", "on", "at", "to", "for", "with"]);
  const words = label
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/[\s-]+/)
    .filter(w => w.trim() && !noiseWords.has(w));

  if (words.length === 0) return "UN";

  if (words.length === 1) {
    const singleWord = words[0];
    if (/^\d+$/.test(singleWord)) {
      return singleWord.slice(0, 4).toUpperCase();
    }
    return singleWord.slice(0, 2).toUpperCase();
  }

  const first = words[0][0] || '';
  const second = words[1][0] || '';
  return (first + second).toUpperCase();
};


function formatAddress(str: string) {
  if (!str) return "";
  return str
    .split(' ')
    .map((word) => {
      let w = word.toLowerCase();
      if (w === 'drives') w = 'drive';
      if (w === 'streets') w = 'street';
      if (w === 'avenues') w = 'avenue';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

export type DashboardData = {
  property_stats: {
    total_properties: number;
    total_units: number;
    occupied_units: number;
    vacant_units: number;
  };
  units: Array<{
    id: string;
    property_id: string;
    property_name: string;
    unit_label: string;
    is_occupied: boolean;
    tenant_name?: string;
    has_pending_maintenance?: boolean;
    has_pending?: boolean;
  }>;
  urgent_maintenance: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    unit_label: string;
    property_name?: string;
    created_at: string;
  }>;
  recent_activity: Array<{
    type: "maintenance_update" | "document_upload" | "announcement_posted";
    id: string;
    title: string;
    timestamp: string;
    meta?: string;
    actor?: string;
    property_name?: string;
    unit_label?: string;
  }>;
};

interface DashboardBentoGridProps {
  data: DashboardData;
}

export function DashboardBentoGrid({ data }: DashboardBentoGridProps) {
  const getPriorityLeftBorder = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'urgent') return 'border-l-[3px] border-l-[#FB923C]'; // Red/Orange
    if (p === 'high') return 'border-l-[3px] border-l-[#FB923C]'; // Orange
    if (p === 'medium') return 'border-l-[3px] border-l-[#818CF8]'; // Indigo/Amber
    return 'border-l-[3px] border-l-muted-foreground';
  };

  const getPriorityPillClass = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'urgent' || p === 'high') return 'bg-orange-500/10 text-orange-600 dark:bg-[rgba(251,146,60,0.12)] dark:text-[#FB923C]';
    if (p === 'medium') return 'bg-indigo-500/10 text-indigo-600 dark:bg-[rgba(129,140,248,0.12)] dark:text-[#818CF8]';
    return 'bg-muted text-muted-foreground';
  };

  const getPriorityIconClass = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'urgent' || p === 'high') return 'bg-orange-500/10 text-orange-600 dark:bg-[rgba(251,146,60,0.12)] dark:text-[#FB923C]';
    if (p === 'medium') return 'bg-indigo-500/10 text-indigo-600 dark:bg-[rgba(129,140,248,0.12)] dark:text-[#818CF8]';
    return 'bg-muted text-muted-foreground';
  };

  const priorityWeight: Record<string, number> = {
    'urgent': 1,
    'high': 2,
    'medium': 3,
    'low': 4
  };

  const activeRequests = [...data.urgent_maintenance]
    .filter(req => {
      const s = (req.status || "").toLowerCase();
      return s === 'open' || s === 'in_progress' || s === 'pending' || s === 'in progress';
    })
    .sort((a, b) => {
      const weightA = priorityWeight[a.priority.toLowerCase()] || 99;
      const weightB = priorityWeight[b.priority.toLowerCase()] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const displayedRequests = activeRequests.slice(0, 4);
  const hasMoreRequests = activeRequests.length > 4;

  const occupiedAndPendingUnits = [...data.units]
    .filter(u => u.is_occupied || u.has_pending_maintenance || u.has_pending)
    .sort((a, b) => {
      const isPendingA = a.has_pending_maintenance || a.has_pending;
      const isPendingB = b.has_pending_maintenance || b.has_pending;

      const scoreA = isPendingA ? 1 : (a.is_occupied ? 2 : 3);
      const scoreB = isPendingB ? 1 : (b.is_occupied ? 2 : 3);

      if (scoreA !== scoreB) return scoreA - scoreB;
      return (a.unit_label || '').localeCompare(b.unit_label || '', undefined, { numeric: true, sensitivity: 'base' });
    });

  const displayedUnits = occupiedAndPendingUnits.slice(0, 6);
  const hasMoreUnits = occupiedAndPendingUnits.length > 6;

  // Calculate occupancy percentage
  const totalUnits = data.property_stats.total_units || 0;
  const occupiedUnits = data.property_stats.occupied_units || 0;
  const occupancyPercent = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const circumference = 163.4;
  const strokeDashoffset = circumference - (occupancyPercent / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start animate-fade-slide-up">
      
      {/* LEFT COLUMN: Maintenance & Activity */}
      <div className="md:col-span-7 flex flex-col gap-5">
        
        {/* Card 1 (Active Maintenance) */}
        <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-6 shadow-sm">
          <div className="flex items-center justify-between px-6 pb-4">
            <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
              Active maintenance
            </span>
            {activeRequests.length > 0 && (
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border/40">
                {activeRequests.length} open
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {activeRequests.length === 0 ? (
              <EmptyState 
                icon={AlertCircle}
                title="All Caught Up"
                description="No active maintenance requests."
                className="border-none bg-transparent shadow-none py-6 mx-6"
              />
            ) : (
              <div>
                <ul className="divide-y divide-border/40">
                  {displayedRequests.map((req) => {
                    const MaintIcon = getMaintenanceIcon(req.title);
                    return (
                      <li key={req.id}>
                        <Link href={`/landlord/requests?id=${req.id}`}>
                          <div className={cn(
                            "flex items-center justify-between py-3 px-6 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 transition-all duration-200 cursor-pointer group",
                            getPriorityLeftBorder(req.priority)
                          )}>
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center text-[15px] flex-shrink-0",
                                getPriorityIconClass(req.priority)
                              )}>
                                <MaintIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                                  {req.title}
                                </div>
                                <div className="text-xs text-[rgb(var(--ml-text-secondary))] font-semibold mt-0.5 truncate">
                                  {formatAddress(req.property_name || "Unknown Property")} · Unit {req.unit_label}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="flex flex-col items-end justify-center">
                                <span className={cn('text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize uppercase tracking-wider', getPriorityPillClass(req.priority))}>
                                  {req.priority}
                                </span>
                                <span className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium mt-1">
                                  Reported {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-lg leading-none select-none">&rsaquo;</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {hasMoreRequests && (
                  <div className="px-6 pt-3 pb-1 border-t border-border/40 text-center">
                    <Link 
                      href="/landlord/requests"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline cursor-pointer"
                    >
                      View all active requests ({activeRequests.length}) &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card 2 (Recent Activity) */}
        <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-6 shadow-sm overflow-hidden">
          <div className="px-6 pb-4">
            <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
              Recent activity
            </span>
          </div>
          <div className="flex-1 overflow-x-hidden">
            {(() => {
              const filteredActivity = data.recent_activity.filter(act => {
                if (act.meta === 'closed' && act.actor !== 'tenant') return false;
                return true;
              });
              if (filteredActivity.length === 0) {
                return (
                  <EmptyState 
                    icon={Activity}
                    title="No Activity Yet"
                    description="Recent updates will appear here."
                    className="border-none bg-transparent shadow-none py-6 mx-6"
                  />
                );
              }
              const displayedActivity = filteredActivity.slice(0, 5);
              return (
                <ul className="divide-y divide-border/40">
                  {displayedActivity.map((act, idx) => {
                    const isReopened = act.meta === 'reopened';
                    const isClosedByTenant = act.meta === 'closed' && act.actor === 'tenant';
                    const isResolved = act.type === "maintenance_update" && (act.meta === 'resolved' || isClosedByTenant);
                    let linkHref = `/landlord/requests?id=${act.id}`;
                    if (act.type === "document_upload") {
                      linkHref = `/landlord/documents?id=${act.id}`;
                    } else if (act.type === "announcement_posted") {
                      linkHref = `/landlord/announcements?id=${act.id}`;
                    }
                    const MaintIcon = getMaintenanceIcon(act.title);
                    return (
                      <li key={`${act.type}-${act.id}-${act.timestamp}-${idx}`}>
                        <Link href={linkHref}>
                          <div className="py-3 px-6 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 flex gap-3.5 items-start transition-all duration-200 cursor-pointer group">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-[13px] flex-shrink-0 mt-0.5",
                              isReopened ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                              isResolved ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20"
                            )}>
                              {act.type === "maintenance_update" ? (
                                <MaintIcon className="w-4 h-4" />
                              ) : act.type === "document_upload" ? (
                                <FileText className="w-4 h-4" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                                {act.title}
                              </div>
                              <div className="text-xs text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5">
                                {act.property_name && (
                                  <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                                    {formatAddress(act.property_name)}{act.unit_label ? ` · Unit ${act.unit_label}` : ''}
                                    {' · '}
                                  </span>
                                )}
                                {act.type === "maintenance_update" ? (
                                  isReopened ? (
                                    <span className="font-bold text-amber-600 dark:text-amber-400">Case reopened by tenant</span>
                                  ) : isClosedByTenant ? (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Case closed by tenant</span>
                                  ) : (
                                    <>Status changed to <span className={cn("font-bold", getStatusColor(act.meta || ""))}>{formatStatusText(act.meta || "")}</span></>
                                  )
                                ) : act.type === "document_upload" ? (
                                  <>Document uploaded</>
                                ) : (
                                  <>Announcement posted</>
                                )}
                                {' · '}{new Date(act.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                            <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-lg self-center select-none ml-2">&rsaquo;</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Overview & Units */}
      <div className="md:col-span-5 flex flex-col gap-5">
        
        {/* Card 3 (Property Overview) */}
        <div className="bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl p-6 shadow-sm">
          <div className="pb-4">
            <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
              Overview
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-2xl overflow-hidden">
              <div className="flex-1 p-4">
                <div className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-extrabold mb-1.5 uppercase tracking-wider">Properties</div>
                <div className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] leading-none tabular-nums">{data.property_stats.total_properties}</div>
              </div>
              <div className="flex-1 p-4 border-l border-border/60">
                <div className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-extrabold mb-1.5 uppercase tracking-wider">Total units</div>
                <div className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] leading-none tabular-nums">{data.property_stats.total_units}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 py-1">
              <svg width="60" height="60" viewBox="0 0 64 64" className="flex-shrink-0">
                <circle cx="32" cy="32" r="26" fill="none" className="stroke-zinc-200 dark:stroke-[#1E2731]" strokeWidth="8"/>
                <circle cx="32" cy="32" r="26" fill="none" className="stroke-[rgb(var(--ml-accent))]" strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                  transform="rotate(-90 32 32)"/>
              </svg>
              <div className="text-[13px] text-[rgb(var(--ml-text-secondary))] font-semibold leading-tight select-none">
                <span className="text-[rgb(var(--ml-text-primary))] text-base font-black">{occupancyPercent}%</span> occupancy<br />across your portfolio
              </div>
            </div>

            {data.property_stats.vacant_units === 0 && data.property_stats.total_units > 0 && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <span className="font-extrabold uppercase tracking-wider block">100% Occupied</span>
                  <span className="font-medium opacity-90 text-[11px]">All {data.property_stats.total_units} unit{data.property_stats.total_units > 1 ? 's' : ''} have active tenants.</span>
                </div>
              </div>
            )}

            <div className="border-t border-border/40 pt-2 space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <div className="flex items-center gap-2.5 text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                  Occupied
                </div>
                <div className="text-sm font-black text-[rgb(var(--ml-text-primary))] tabular-nums">{data.property_stats.occupied_units}</div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2.5 text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></span>
                  Vacant
                </div>
                <div className="text-sm font-black text-[rgb(var(--ml-text-primary))] tabular-nums">{data.property_stats.vacant_units}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4 (My Units List) */}
        <div className="flex flex-col flex-1 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-6 shadow-sm">
          <div className="px-6 pb-4">
            <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
              Occupied Units
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {data.property_stats.total_properties === 0 ? (
              <EmptyState 
                icon={Home}
                title="Portfolio Hasn't Been Created"
                description="Add your first property to start managing units."
                className="border-none bg-transparent shadow-none py-10 mx-6"
                action={
                  <Link href="/landlord/properties?add=true">
                    <Button className="rounded-full px-6 font-bold flex items-center gap-2 bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]">
                      <Plus className="w-4 h-4" /> Add Property
                    </Button>
                  </Link>
                }
              />
            ) : displayedUnits.length === 0 ? (
              <EmptyState 
                icon={Home}
                title="No Active Tenants Yet"
                description="Units with active tenants or pending maintenance will appear here."
                className="border-none bg-transparent shadow-none py-10 mx-6"
              />
            ) : (
              <div>
                <ul className="divide-y divide-border/40">
                  {displayedUnits.map((unit) => {
                    const isPending = unit.has_pending_maintenance || unit.has_pending;
                    return (
                      <li key={unit.id}>
                        <Link href={`/landlord/units/${unit.id}`} className="block">
                          <div className="flex items-center gap-3.5 py-3 px-6 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 transition-all duration-200 cursor-pointer group">
                            <div className="w-10 h-10 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border/40 flex items-center justify-center font-black text-xs text-[rgb(var(--ml-text-primary))] flex-shrink-0 px-1">
                              {getUnitInitials(unit.unit_label)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                                Unit {unit.unit_label}
                              </div>
                              <div className="text-xs text-[rgb(var(--ml-text-secondary))] font-semibold mt-0.5 truncate">
                                {unit.tenant_name ? `${unit.tenant_name} · ` : ''}{formatAddress(unit.property_name)}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              {unit.is_occupied ? (
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Occupied</span>
                              ) : isPending ? (
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Pending Maint.</span>
                              ) : (
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-muted text-[rgb(var(--ml-text-secondary))] border border-border/40">Vacant</span>
                              )}
                              <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-lg leading-none select-none">&rsaquo;</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {hasMoreUnits && (
                  <div className="px-6 pt-3 pb-1 border-t border-border/40 text-center">
                    <Link 
                      href="/landlord/units"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline cursor-pointer"
                    >
                      View all units ({occupiedAndPendingUnits.length}) &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export function DashboardBentoSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN: Maintenance & Activity */}
      <div className="md:col-span-7 flex flex-col gap-5">
        {/* Card 1 (Active Maintenance) */}
        <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-3xl py-6 shadow-sm">
          <div className="flex items-center justify-between px-6 pb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-3 w-32 rounded-md" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div>
            <ul className="divide-y divide-border/40">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="py-3 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-4 w-44 sm:w-56 rounded-md" />
                      <Skeleton className="h-3 w-28 sm:w-36 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 pl-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                    <Skeleton className="w-2.5 h-4 rounded-sm opacity-40" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card 2 (Recent Activity) */}
        <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-3xl py-6 shadow-sm overflow-hidden">
          <div className="px-6 pb-4 flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
          <div>
            <ul className="divide-y divide-border/40">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="py-3 px-6 flex gap-3.5 items-start">
                  <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-4 w-48 sm:w-64 rounded-md" />
                    <Skeleton className="h-3 w-56 sm:w-72 rounded-md" />
                  </div>
                  <Skeleton className="w-2.5 h-4 rounded-sm self-center ml-2 opacity-40" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Overview & Units */}
      <div className="md:col-span-5 flex flex-col gap-5">
        {/* Card 3 (Property Overview) */}
        <div className="bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-3xl p-6 shadow-sm">
          <div className="pb-4 flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-2xl overflow-hidden">
              <div className="flex-1 p-4">
                <Skeleton className="h-2.5 w-16 mb-2 rounded-md" />
                <Skeleton className="h-8 w-12 rounded-lg" />
              </div>
              <div className="flex-1 p-4 border-l border-border/60">
                <Skeleton className="h-2.5 w-16 mb-2 rounded-md" />
                <Skeleton className="h-8 w-12 rounded-lg" />
              </div>
            </div>

            <div className="flex items-center gap-4 py-1">
              <Skeleton className="w-[60px] h-[60px] rounded-full flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
              </div>
            </div>

            <div className="border-t border-border/40 pt-2 space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-2.5 h-2.5 rounded-full" />
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-4 w-6 rounded-md" />
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-2.5 h-2.5 rounded-full" />
                  <Skeleton className="h-3.5 w-14 rounded-md" />
                </div>
                <Skeleton className="h-4 w-6 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4 (Occupied Units) */}
        <div className="flex flex-col flex-1 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-3xl py-6 shadow-sm">
          <div className="px-6 pb-4 flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
          <div>
            <ul className="divide-y divide-border/40">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="py-3 px-6 flex items-center gap-3.5">
                  <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-4 w-24 sm:w-32 rounded-md" />
                    <Skeleton className="h-3 w-32 sm:w-44 rounded-md" />
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="w-2.5 h-4 rounded-sm opacity-40" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
