import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import { AlertCircle, Activity, Building, Users, Home } from "lucide-react"

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1 (Urgent Maintenance) - spans 2 columns */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Urgent Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.urgent_maintenance.length === 0 ? (
            <p className="text-sm text-[rgb(var(--ml-text-secondary))] py-6 text-center">
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
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
                        {unit.is_occupied ? 'Occupied' : unit.has_pending ? 'Pending' : 'Vacant'}
                      </span>
                    </div>
                  </div>
                  {unit.is_occupied ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  ) : unit.has_pending ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Vacant</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Card 5 (Recent Activity) - spans 2 columns */}
      <Card className="md:col-span-2 flex flex-col">
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
                  <span className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    {act.type === "maintenance_update" ? "Status: " : "File: "}
                    <span className="capitalize font-medium text-[rgb(var(--ml-accent))]">{act.meta}</span> &bull; {new Date(act.timestamp).toLocaleDateString()}
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Skeleton Card 1 (Urgent Maintenance) */}
      <Card className="md:col-span-2">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-8" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-8" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-8" />
          </div>
        </CardContent>
      </Card>
      
      {/* Skeleton Card 3 (My Units) */}
      <Card className="md:col-span-3">
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
      <Card className="md:col-span-2">
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
