import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { AlertCircle, Activity, Building, Users, Home, FileText, Image as ImageIcon } from "lucide-react"

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
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver(() => {
      if (!gridRef.current) return;
      const children = gridRef.current.children;
      if (children.length >= 4) {
        const sizes = {
          urgent: children[0].getBoundingClientRect().height,
          overview: children[1].getBoundingClientRect().height,
          units: children[2].getBoundingClientRect().height,
          activity: children[3].getBoundingClientRect().height,
        };
        localStorage.setItem('dashboard_bento_sizes', JSON.stringify(sizes));
      }
    });
    
    Array.from(gridRef.current.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1 (Urgent Maintenance) - spans 2 columns */}
      <Card className="md:col-span-2 self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Urgent Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.urgent_maintenance.length === 0 ? (
            <p className="text-sm text-[rgb(var(--ml-text-secondary))] py-4 text-center">
              No urgent maintenance requests.
            </p>
          ) : (
            <ul className="space-y-4">
              {data.urgent_maintenance.map((req) => (
                <li key={req.id} className="flex flex-col border-b border-[rgb(var(--ml-border))] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm capitalize">{req.title}</p>
                    <Badge variant="destructive" className="capitalize">{req.priority}</Badge>
                  </div>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] mt-1">
                    Unit {req.unit_label} &bull; Reported {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Card 2 (Property Overview) - spans 1 column */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-500" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex flex-col justify-center items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
              <span className="text-xs font-medium text-blue-600 dark:text-slate-200 mb-1">Properties</span>
              <span className="text-2xl font-bold text-blue-700 dark:text-white">{data.property_stats.total_properties}</span>
            </div>
            <div className="flex flex-col justify-center items-center p-3 bg-slate-50/50 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-200 mb-1">Total Units</span>
              <span className="text-2xl font-bold text-slate-700 dark:text-white">{data.property_stats.total_units}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-green-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>Occupied</span>
            <span className="font-bold">{data.property_stats.occupied_units}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-amber-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Vacant</span>
            <span className="font-bold">{data.property_stats.vacant_units}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 (My Units) - spans 3 columns to beautifully show all units */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-indigo-500" />
            My Units
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.units.length === 0 ? (
            <p className="text-sm text-[rgb(var(--ml-text-secondary))] py-6 text-center">
              No units found. Add a property to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.units.map((unit) => (
                <div key={unit.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${unit.is_occupied ? 'bg-white dark:bg-slate-800/50 border-green-100 dark:border-green-900/30 hover:border-green-200' : unit.has_pending ? 'bg-slate-50/50 dark:bg-slate-800/50 border-amber-100 dark:border-amber-900/30 hover:border-amber-200' : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center p-2 rounded-lg ${unit.is_occupied ? 'bg-green-100 text-green-600' : unit.has_pending ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{unit.unit_label}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {unit.property_name}
                      </span>
                    </div>
                  </div>
                  {unit.is_occupied ? (
                    <span className="text-sm font-medium text-green-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>Occupied</span>
                  ) : unit.has_pending ? (
                    <span className="text-sm font-medium text-amber-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Pending</span>
                  ) : (
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-500"></div>Vacant</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Card 5 (Recent Activity) - spans 3 columns */}
      <Card className="md:col-span-3 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {data.recent_activity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[rgb(var(--ml-text-secondary))] py-6 text-center">
                No recent activity.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {data.recent_activity.map((act) => (
                <li key={act.id} className="flex flex-col border-l-2 border-[rgb(var(--ml-border))] pl-4 py-1">
                  <span className="text-sm font-medium capitalize">{act.title}</span>
                  <span className="text-xs text-[rgb(var(--ml-text-secondary))] mt-0.5">
                    {act.type === "maintenance_update" ? (
                      <>Status: <span className={`font-medium ${getStatusColor(act.meta || "")}`}>{formatStatusText(act.meta || "")}</span></>
                    ) : (
                      <>{getFileIcon(act.meta || "")}<span className="font-medium text-[rgb(var(--ml-accent))]">{formatFileText(act.meta || "")}</span></>
                    )} &bull; {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardBentoSkeleton() {
  const [sizes, setSizes] = useState<{ [key: string]: number } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dashboard_bento_sizes');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Skeleton Card 1 (Urgent Maintenance) */}
      <Card className="md:col-span-2 self-start" suppressHydrationWarning style={{ minHeight: sizes?.urgent }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b pb-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Card 2 (Property Overview) */}
      <Card suppressHydrationWarning style={{ minHeight: sizes?.overview }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6" />
          </div>
        </CardContent>
      </Card>
      
      {/* Skeleton Card 3 (My Units) */}
      <Card className="md:col-span-3" suppressHydrationWarning style={{ minHeight: sizes?.units }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
           </div>
        </CardContent>
      </Card>


      {/* Skeleton Card 5 (Recent Activity) */}
      <Card className="md:col-span-3" suppressHydrationWarning style={{ minHeight: sizes?.activity }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 pl-4 border-l-2 border-slate-100">
            <div className="space-y-2 py-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="space-y-2 py-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
