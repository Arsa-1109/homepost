import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AlertCircle, Activity, Home, FileText, Wrench, Zap, Key, Droplets, LucideIcon } from "lucide-react"

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
    type: "maintenance_update" | "document_upload";
    id: string;
    title: string;
    timestamp: string;
    meta?: string;
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
      return weightA - weightB;
    });

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
        <Card className="flex flex-col bg-card border-border/60 hover:border-border transition-colors rounded-2xl shadow-sm">
          <CardHeader className="pb-4 px-6 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                Active maintenance
              </span>
              {activeRequests.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                  {activeRequests.length} open
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px] px-6 pb-4">
            {activeRequests.length === 0 ? (
              <EmptyState 
                icon={AlertCircle}
                title="All Caught Up"
                description="No active maintenance requests."
                className="border-none bg-transparent shadow-none py-6"
              />
            ) : (
              <ul className="divide-y divide-border/40">
                {activeRequests.map((req) => {
                  const MaintIcon = getMaintenanceIcon(req.title);
                  return (
                    <li key={req.id} className="-mx-6">
                      <Link href={`/landlord/requests?id=${req.id}`}>
                        <div className={cn(
                          "flex items-center justify-between py-3 px-6 hover:bg-muted/50 transition-all cursor-pointer group",
                          getPriorityLeftBorder(req.priority)
                        )}>
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center text-[15px] flex-shrink-0",
                              getPriorityIconClass(req.priority)
                            )}>
                              <MaintIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[15px] font-semibold text-foreground leading-snug truncate">
                                {req.title}
                              </div>
                              <div className="text-[13px] text-muted-foreground font-medium mt-0.5 truncate">
                                {req.property_name || "Unknown Property"} · Unit {req.unit_label}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="flex flex-col items-end justify-center">
                              <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full capitalize', getPriorityPillClass(req.priority))}>
                                {req.priority}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-medium mt-1">
                                Reported {new Date(req.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <span className="text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all text-lg leading-none select-none">›</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Card 2 (Recent Activity) */}
        <Card className="flex flex-col bg-card border-border/60 hover:border-border transition-colors rounded-2xl shadow-sm">
          <CardHeader className="pb-4 px-6 pt-5">
            <span className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
              Recent activity
            </span>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px] px-6 pb-4">
            {data.recent_activity.length === 0 ? (
              <EmptyState 
                icon={Activity}
                title="No Activity Yet"
                description="Recent updates will appear here."
                className="border-none bg-transparent shadow-none py-6"
              />
            ) : (
              <ul className="divide-y divide-border/40">
                {data.recent_activity.map((act) => {
                  const isClosed = act.type === "maintenance_update" && (act.meta === 'closed' || act.meta === 'resolved');
                  const linkHref = act.type === "maintenance_update" 
                    ? `/landlord/requests?id=${act.id}` 
                    : `/landlord/documents`;
                  const MaintIcon = getMaintenanceIcon(act.title);
                  return (
                    <li key={act.id} className="-mx-6">
                      <Link href={linkHref}>
                        <div className="py-2.5 px-6 hover:bg-muted/30 flex gap-3.5 items-start transition-colors cursor-pointer group">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0 mt-0.5",
                            isClosed ? "bg-muted text-muted-foreground border border-border/40" : "bg-teal-500/10 text-teal-600 dark:bg-[rgba(45,212,191,0.12)] dark:text-[#2DD4BF]"
                          )}>
                            {act.type === "maintenance_update" ? (
                              <MaintIcon className="w-3.5 h-3.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-foreground leading-snug truncate">
                              {act.title}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">
                              {act.type === "maintenance_update" ? (
                                <>Status changed to <span className={cn("font-bold", getStatusColor(act.meta || ""))}>{formatStatusText(act.meta || "")}</span></>
                              ) : (
                                <>Document uploaded</>
                              )}
                              {' · '}{new Date(act.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <span className="text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all text-lg self-center select-none ml-2">›</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Overview & Units */}
      <div className="md:col-span-5 flex flex-col gap-5">
        
        {/* Card 3 (Property Overview) */}
        <Card className="bg-card border-border/60 hover:border-border transition-colors rounded-2xl shadow-sm">
          <CardHeader className="pb-4 px-6 pt-5">
            <span className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
              Overview
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 pb-4">
            <div className="flex bg-muted/40 border border-border/40 rounded-xl">
              <div className="flex-1 p-3.5">
                <div className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Properties</div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground leading-none tabular-nums">{data.property_stats.total_properties}</div>
              </div>
              <div className="flex-1 p-3.5 border-l border-border/40">
                <div className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Total units</div>
                <div className="text-3xl font-extrabold tracking-tight text-foreground leading-none tabular-nums">{data.property_stats.total_units}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 py-0.5">
              <svg width="60" height="60" viewBox="0 0 64 64" className="flex-shrink-0">
                <circle cx="32" cy="32" r="26" fill="none" className="stroke-zinc-200 dark:stroke-[#1E2731]" strokeWidth="8"/>
                <circle cx="32" cy="32" r="26" fill="none" className="stroke-[#4ADE80] dark:stroke-[#34D399]" strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                  transform="rotate(-90 32 32)"/>
              </svg>
              <div className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium leading-tight select-none">
                <span className="text-foreground text-base font-bold">{occupancyPercent}%</span> occupancy<br />across your portfolio
              </div>
            </div>

            <div className="border-t border-border/40 pt-1">
              <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.12)]"></span>
                  Occupied
                </div>
                <div className="text-base font-extrabold text-foreground tabular-nums">{data.property_stats.occupied_units}</div>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.12)]"></span>
                  Vacant
                </div>
                <div className="text-base font-extrabold text-foreground tabular-nums">{data.property_stats.vacant_units}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 (My Units List) */}
        <Card className="flex flex-col flex-1 bg-card border-border/60 hover:border-border transition-colors rounded-2xl shadow-sm">
          <CardHeader className="pb-4 px-6 pt-5">
            <span className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
              My units
            </span>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[385px] px-6 pb-4">
            {data.units.length === 0 ? (
              <EmptyState 
                icon={Home}
                title="No Units"
                description="Add a property to see units here."
                className="border-none bg-transparent shadow-none py-10"
              />
            ) : (
              <div className="space-y-2">
                {data.units.map((unit) => (
                  <Link href={`/landlord/units/${unit.id}`} key={unit.id} className="block">
                    <div className="flex items-center gap-3 p-2.5 px-3 bg-muted/40 border border-border/40 rounded-xl hover:border-border transition-all group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-[#2A2A2A] dark:to-[#141414] border border-border/40 flex items-center justify-center font-extrabold text-sm text-foreground flex-shrink-0 overflow-hidden px-1">
                        {getUnitInitials(unit.unit_label)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-foreground truncate">{unit.unit_label}</div>
                        <div className="text-xs text-muted-foreground font-medium truncate">{unit.property_name}</div>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        {unit.is_occupied ? (
                          <span className="text-[10px] font-extrabold bg-green-500/10 text-green-600 dark:bg-[rgba(74,222,128,0.12)] dark:text-[#4ADE80] px-2.5 py-1 rounded-full uppercase tracking-wider">Occupied</span>
                        ) : unit.has_pending ? (
                          <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:bg-[rgba(245,158,11,0.12)] dark:text-[#F59E0B] px-2.5 py-1 rounded-full uppercase tracking-wider">Pending</span>
                        ) : (
                          <span className="text-[10px] font-extrabold bg-muted text-muted-foreground border border-border/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Vacant</span>
                        )}
                        <span className="text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all text-lg leading-none select-none">›</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

export function DashboardBentoSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN */}
      <div className="md:col-span-7 flex flex-col gap-5">
        <Card className="bg-card border-border/60 rounded-2xl">
          <CardHeader className="pb-4 px-6 pt-5">
            <Skeleton className="h-3 w-36" />
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 rounded-2xl">
          <CardHeader className="pb-4 px-6 pt-5">
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3.5 items-start py-2.5 border-b border-border/40 last:border-0">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="md:col-span-5 flex flex-col gap-5">
        <Card className="bg-card border-border/60 rounded-2xl">
          <CardHeader className="pb-4 px-6 pt-5">
            <Skeleton className="h-3 w-24" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 pb-4">
            <div className="flex bg-muted/40 border border-border/40 rounded-xl">
              <div className="flex-1 p-3.5">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="flex-1 p-3.5 border-l border-border/40">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 py-0.5">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex justify-between items-center py-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-6" />
              </div>
              <div className="flex justify-between items-center py-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/60 rounded-2xl">
          <CardHeader className="pb-4 px-6 pt-5">
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 px-3 border border-border/40 rounded-xl bg-muted/40">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
