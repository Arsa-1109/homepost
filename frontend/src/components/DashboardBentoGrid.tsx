import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Activity, Building, Users } from "lucide-react"

export function DashboardBentoGrid() {
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
          <ul className="space-y-4">
            <li className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">Leaking Pipe in Kitchen</p>
                <p className="text-xs text-muted-foreground">Unit 4B &bull; Reported 2 hours ago</p>
              </div>
              <Badge variant="destructive">High</Badge>
            </li>
            <li className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">Broken AC</p>
                <p className="text-xs text-muted-foreground">Unit 12A &bull; Reported 5 hours ago</p>
              </div>
              <Badge variant="destructive">High</Badge>
            </li>
          </ul>
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
            <span className="text-lg font-bold">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Occupied Units</span>
            <span className="text-lg font-bold">48</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Vacant Units</span>
            <span className="text-lg font-bold text-amber-600">3</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3 (Pending Approvals) - spans 1 column */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Pending Approvals
            <Badge className="ml-2 bg-amber-500 hover:bg-amber-600">3</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li className="flex justify-between items-center">
              <span className="text-sm font-medium">Jane Doe</span>
              <span className="text-xs text-muted-foreground">Unit 2A</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-sm font-medium">John Smith</span>
              <span className="text-xs text-muted-foreground">Unit 5C</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-sm font-medium">Alice Johnson</span>
              <span className="text-xs text-muted-foreground">Unit 1B</span>
            </li>
          </ul>
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
          <ul className="space-y-4">
            <li className="flex flex-col border-l-2 border-slate-200 pl-4 py-1">
              <span className="text-sm font-medium">Rent Paid</span>
              <span className="text-xs text-muted-foreground">Unit 3B &bull; $1,200</span>
            </li>
            <li className="flex flex-col border-l-2 border-slate-200 pl-4 py-1">
              <span className="text-sm font-medium">Maintenance Resolved</span>
              <span className="text-xs text-muted-foreground">Unit 7A &bull; Window repaired</span>
            </li>
            <li className="flex flex-col border-l-2 border-slate-200 pl-4 py-1">
              <span className="text-sm font-medium">New Lease Signed</span>
              <span className="text-xs text-muted-foreground">Unit 4D &bull; 12 month term</span>
            </li>
          </ul>
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
