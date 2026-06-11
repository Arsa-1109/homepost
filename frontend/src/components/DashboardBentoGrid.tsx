import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

import { AlertCircle, Activity, Building, Home, FileText, Image as ImageIcon } from "lucide-react"

function formatStatusText(str: string) {
  if (!str) return "Unknown";
  return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function getStatusColor(str: string) {
  const s = (str || "").toLowerCase();
  if (s === 'closed' || s === 'resolved') return 'text-slate-400 dark:text-slate-500';
  return 'text-teal-600 dark:text-teal-400';
}

function getFileIcon(meta: string) {
  if ((meta || "").toLowerCase().includes('image')) return <ImageIcon className="inline-block w-3 h-3 mr-1 align-text-bottom" />;
  return <FileText className="inline-block w-3 h-3 mr-1 align-text-bottom" />;
}

function formatFileText(meta: string) {
  const m = (meta || "").toLowerCase();
  if (m.includes('png') || m.includes('jpeg') || m.includes('jpg') || m.includes('image')) return 'Image';
  if (m.includes('pdf')) return 'PDF Document';
  return 'Document';
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
    has_pending?: boolean;
  }>;
  urgent_maintenance: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    unit_label: string;
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
  // Determine if a request is actually urgent based on string matching
  const getPriorityColor = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'urgent') return "destructive";
    if (p === 'high') return "default";
    if (p === 'medium') return "secondary";
    return "outline";
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      
      {/* LEFT COLUMN: Maintenance & Activity */}
      <div className="md:col-span-2 flex flex-col gap-6">
        {/* Card 1 (Active Maintenance) */}
        <Card className="flex flex-col shadow-sm border-[rgb(var(--ml-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Active Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
            {activeRequests.length === 0 ? (
              <EmptyState 
                icon={AlertCircle}
                title="All Caught Up"
                description="There are no active maintenance requests at the moment."
                className="border-none bg-transparent shadow-none py-8"
              />
            ) : (
              <ul className="space-y-3">
                {activeRequests.map((req) => (
                  <li key={req.id} className="flex flex-col border border-[rgb(var(--ml-border))] rounded-xl p-4 bg-[rgb(var(--ml-bg-secondary))] transition-colors hover:bg-[rgb(var(--ml-bg-tertiary))]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm capitalize text-[rgb(var(--ml-text-primary))]">{req.title}</p>
                      <Badge variant={getPriorityColor(req.priority) as any} className="capitalize shadow-none">{req.priority}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">
                        Unit {req.unit_label}
                      </p>
                      <p className="text-xs text-[rgb(var(--ml-text-muted))]">
                        Reported {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Card 2 (Recent Activity) */}
        <Card className="flex flex-col shadow-sm border-[rgb(var(--ml-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
            {data.recent_activity.length === 0 ? (
              <EmptyState 
                icon={Activity}
                title="No Activity Yet"
                description="Recent updates like maintenance or document uploads will appear here."
                className="border-none bg-transparent shadow-none py-8"
              />
            ) : (
              <ul className="space-y-4">
                {data.recent_activity.map((act) => (
                  <li key={act.id} className="flex flex-col border-l-2 border-[rgb(var(--ml-border))] pl-4 py-1">
                    <span className="text-sm font-semibold capitalize text-[rgb(var(--ml-text-primary))]">{act.title}</span>
                    <span className="text-xs text-[rgb(var(--ml-text-secondary))] mt-1 font-medium">
                      {act.type === "maintenance_update" ? (
                        <>Status changed to <span className={`${getStatusColor(act.meta || "")}`}>{formatStatusText(act.meta || "")}</span></>
                      ) : (
                        <>{getFileIcon(act.meta || "")}<span className="text-[rgb(var(--ml-accent))]">{formatFileText(act.meta || "")}</span> uploaded</>
                      )} &bull; {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Overview & Units */}
      <div className="md:col-span-1 flex flex-col gap-6">
        {/* Card 3 (Property Overview) */}
        <Card className="shadow-sm border-[rgb(var(--ml-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-blue-500" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 mb-1">
              <div className="flex flex-col justify-center items-center p-3 bg-[rgb(var(--ml-bg-tertiary))] rounded-xl border border-[rgb(var(--ml-border))]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--ml-text-secondary))] mb-1">Properties</span>
                <span className="text-3xl font-bold text-[rgb(var(--ml-accent))] leading-none tabular-nums">{data.property_stats.total_properties}</span>
              </div>
              <div className="flex flex-col justify-center items-center p-3 bg-[rgb(var(--ml-bg-tertiary))] rounded-xl border border-[rgb(var(--ml-border))]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[rgb(var(--ml-text-secondary))] mb-1">Total Units</span>
                <span className="text-3xl font-bold text-[rgb(var(--ml-text-primary))] leading-none tabular-nums">{data.property_stats.total_units}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>Occupied
                </span>
                <span className="font-bold text-[rgb(var(--ml-text-primary))] tabular-nums">{data.property_stats.occupied_units}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>Vacant
                </span>
                <span className="font-bold text-[rgb(var(--ml-text-primary))] tabular-nums">{data.property_stats.vacant_units}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 (My Units List) */}
        <Card className="flex flex-col flex-1 shadow-sm border-[rgb(var(--ml-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="h-5 w-5 text-indigo-500" />
              My Units
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[385px] custom-scrollbar pr-2">
            {data.units.length === 0 ? (
              <EmptyState 
                icon={Home}
                title="No Units"
                description="Add a property to see units here."
                className="border-none bg-transparent shadow-none py-12"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {data.units.map((unit) => (
                  <div key={unit.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${unit.is_occupied ? 'bg-white dark:bg-slate-800/50 border-green-100 dark:border-green-900/30 hover:border-green-200' : unit.has_pending ? 'bg-slate-50/50 dark:bg-slate-800/50 border-amber-100 dark:border-amber-900/30 hover:border-amber-200' : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center p-2 rounded-lg ${unit.is_occupied ? 'bg-green-100 text-green-600' : unit.has_pending ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <Home className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{unit.unit_label}</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1 w-[100px]" title={unit.property_name}>
                          {unit.property_name}
                        </span>
                      </div>
                    </div>
                    {unit.is_occupied ? (
                      <Badge variant="success" className="uppercase tracking-wider text-[10px]">Occupied</Badge>
                    ) : unit.has_pending ? (
                      <Badge variant="warning" className="uppercase tracking-wider text-[10px]">Pending</Badge>
                    ) : (
                      <Badge variant="outline" className="uppercase tracking-wider text-[10px]">Vacant</Badge>
                    )}
                  </div>
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {/* LEFT COLUMN */}
      <div className="md:col-span-2 flex flex-col gap-6">
        <Card className="shadow-sm border-[rgb(var(--ml-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-[rgb(var(--ml-border))] rounded-xl p-4 bg-[rgb(var(--ml-bg-secondary))] space-y-3">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-[rgb(var(--ml-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2 py-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="md:col-span-1 flex flex-col gap-6">
        <Card className="shadow-sm border-[rgb(var(--ml-border))]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-36" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 mb-1">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-[rgb(var(--ml-border))] flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
