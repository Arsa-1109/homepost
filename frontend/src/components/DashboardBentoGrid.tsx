"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ActiveMaintenanceCard, MaintenanceItem } from "@/components/dashboard/ActiveMaintenanceCard";
import { RecentActivityCard, ActivityItem } from "@/components/dashboard/RecentActivityCard";
import { PropertyOverviewCard } from "@/components/dashboard/PropertyOverviewCard";
import { OccupiedUnitsCard, UnitItem } from "@/components/dashboard/OccupiedUnitsCard";

export type DashboardData = {
  property_stats: {
    total_properties: number;
    total_units: number;
    occupied_units: number;
    vacant_units: number;
  };
  units: UnitItem[];
  urgent_maintenance: MaintenanceItem[];
  recent_activity: ActivityItem[];
  pending_approvals?: Array<{
    id: string;
    name: string;
    email: string;
    unit_label?: string;
  }>;
};

export interface DashboardBentoGridProps {
  data: DashboardData;
}

export function DashboardBentoGrid({ data }: DashboardBentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN: Maintenance & Activity */}
      <div className="md:col-span-7 flex flex-col gap-5">
        <ActiveMaintenanceCard requests={data.urgent_maintenance} />
        <RecentActivityCard activity={data.recent_activity} />
      </div>

      {/* RIGHT COLUMN: Overview & Units */}
      <div className="md:col-span-5 flex flex-col gap-5">
        <PropertyOverviewCard stats={data.property_stats} />
        <OccupiedUnitsCard
          totalProperties={data.property_stats.total_properties}
          totalUnits={data.property_stats.total_units}
          units={data.units}
        />
      </div>
    </div>
  );
}

export function DashboardBentoSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN: Maintenance & Activity */}
      <div className="md:col-span-7 flex flex-col gap-5">
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
  );
}
