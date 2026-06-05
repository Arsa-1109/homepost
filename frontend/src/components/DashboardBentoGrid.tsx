import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Activity, Building, Users } from "lucide-react"

export type DashboardData = {
  property_stats: {
    total_properties: number;
    total_units: number;
    occupied_units: number;
    vacant_units: number;
  };
  urgent_maintenance: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    unit_label: string;
    created_at: string;
  }>;
  pending_approvals: Array<{
    id: string;
    name: string;
    email: string;
    unit_label: string;
  }>;
  recent_activity: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    unit_label: string;
    updated_at: string;
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
                <li key={req.id} className="flex items-start justify-between border-b border-[rgb(var(--ml-border))] pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{req.title}</p>
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                      Unit {req.unit_label} &bull; Reported {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="destructive" className="capitalize">{req.priority}</Badge>
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
            Property Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Properties</span>
            <span className="text-lg font-bold">{data.property_stats.total_properties}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Occupied Units</span>
            <span className="text-lg font-bold">{data.property_stats.occupied_units}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Vacant Units</span>
            <span className="text-lg font-bold text-amber-600">{data.property_stats.vacant_units}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 (Pending Approvals) - spans 1 column */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Pending Approvals
            {data.pending_approvals.length > 0 && (
              <Badge className="ml-2 bg-amber-500 hover:bg-amber-600">{data.pending_approvals.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.pending_approvals.length === 0 ? (
            <p className="text-sm text-[rgb(var(--ml-text-secondary))] py-6 text-center">
              No pending tenant approvals.
            </p>
          ) : (
            <ul className="space-y-4">
              {data.pending_approvals.map((tenant) => (
                <li key={tenant.id} className="flex flex-col gap-1 border-b border-[rgb(var(--ml-border))] pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{tenant.name}</span>
                    <span className="text-xs text-[rgb(var(--ml-text-secondary))]">{tenant.unit_label}</span>
                  </div>
                  <span className="text-xs text-[rgb(var(--ml-text-secondary))]">{tenant.email}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Card 4 (Recent Activity) - spans 2 columns */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_activity.length === 0 ? (
            <p className="text-sm text-[rgb(var(--ml-text-secondary))] py-6 text-center">
              No recent activity.
            </p>
          ) : (
            <ul className="space-y-4">
              {data.recent_activity.map((act) => (
                <li key={act.id} className="flex flex-col border-l-2 border-[rgb(var(--ml-border))] pl-4 py-1">
                  <span className="text-sm font-medium">{act.title}</span>
                  <span className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Unit {act.unit_label} &bull; Status: <span className="capitalize font-medium text-[rgb(var(--ml-accent))]">{act.status}</span> &bull; {new Date(act.updated_at).toLocaleDateString()}
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

      {/* Skeleton Card 3 (Pending Approvals) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-6 rounded-full ml-2" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Card 4 (Recent Activity) */}
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
            <div className="space-y-2 py-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
