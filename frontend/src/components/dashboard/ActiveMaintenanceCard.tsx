"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Wrench, Droplets, Zap, Key, LucideIcon } from "lucide-react";

export interface MaintenanceItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  unit_label: string;
  property_name?: string;
  created_at: string;
}

export interface ActiveMaintenanceCardProps {
  requests: MaintenanceItem[];
}

const getMaintenanceIcon = (title: string): LucideIcon => {
  const t = title.toLowerCase();
  if (
    t.includes("toilet") ||
    t.includes("flush") ||
    t.includes("bathroom") ||
    t.includes("plumb") ||
    t.includes("leak") ||
    t.includes("faucet") ||
    t.includes("water") ||
    t.includes("tap") ||
    t.includes("sink") ||
    t.includes("pipe") ||
    t.includes("drain")
  ) {
    if (t.includes("toilet") || t.includes("bathroom") || t.includes("flush")) return Droplets;
    return Wrench;
  }
  if (
    t.includes("light") ||
    t.includes("bulb") ||
    t.includes("electric") ||
    t.includes("wire") ||
    t.includes("power")
  )
    return Zap;
  if (t.includes("key") || t.includes("lock") || t.includes("door") || t.includes("gate"))
    return Key;
  return Wrench;
};

function formatAddress(str: string) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => {
      let w = word.toLowerCase();
      if (w === "drives") w = "drive";
      if (w === "streets") w = "street";
      if (w === "avenues") w = "avenue";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

export function ActiveMaintenanceCard({ requests }: ActiveMaintenanceCardProps) {
  const getPriorityLeftBorder = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "urgent" || p === "high") return "border-l-[3px] border-l-[#FB923C]";
    if (p === "medium") return "border-l-[3px] border-l-[#818CF8]";
    return "border-l-[3px] border-l-muted-foreground";
  };

  const getPriorityClass = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "urgent" || p === "high")
      return "bg-orange-500/10 text-orange-600 dark:bg-[rgba(251,146,60,0.12)] dark:text-[#FB923C]";
    if (p === "medium")
      return "bg-indigo-500/10 text-indigo-600 dark:bg-[rgba(129,140,248,0.12)] dark:text-[#818CF8]";
    return "bg-muted text-muted-foreground";
  };

  const priorityWeight: Record<string, number> = {
    urgent: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  const activeRequests = [...requests]
    .filter((req) => {
      const s = (req.status || "").toLowerCase();
      return s === "open" || s === "in_progress" || s === "pending" || s === "in progress";
    })
    .sort((a, b) => {
      const weightA = priorityWeight[a.priority.toLowerCase()] || 99;
      const weightB = priorityWeight[b.priority.toLowerCase()] || 99;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const displayedRequests = activeRequests.slice(0, 3);
  const hasMoreRequests = activeRequests.length > 3;

  return (
    <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-6 shadow-sm">
      <div className="flex items-center justify-between px-6 pb-4">
        <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
          Active maintenance
        </span>
        <span className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] bg-[rgb(var(--ml-bg-tertiary))] px-2.5 py-0.5 rounded-full border border-border/40">
          {activeRequests.length} active
        </span>
      </div>

      <div>
        {activeRequests.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="All Clear"
            description="No active maintenance requests right now."
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
                      <div
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-4 sm:px-6 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 transition-all duration-200 cursor-pointer group gap-2.5 sm:gap-4",
                          getPriorityLeftBorder(req.priority)
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={cn(
                              "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-[15px] shrink-0",
                              getPriorityClass(req.priority)
                            )}
                          >
                            <MaintIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                                {req.title}
                              </span>
                              <span
                                className={cn(
                                  "sm:hidden text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                  getPriorityClass(req.priority)
                                )}
                              >
                                {req.priority}
                              </span>
                            </div>
                            <div className="text-xs text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5 truncate">
                              {formatAddress(req.property_name || "Unknown Property")} · {req.unit_label}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-12 sm:pl-0">
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-1">
                            <span
                              className={cn(
                                "hidden sm:inline-flex text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize uppercase tracking-wider",
                                getPriorityClass(req.priority)
                              )}
                            >
                              {req.priority}
                            </span>
                            <span className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium">
                              Reported{" "}
                              {new Date(req.created_at).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-lg leading-none select-none">
                            &rsaquo;
                          </span>
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
  );
}
