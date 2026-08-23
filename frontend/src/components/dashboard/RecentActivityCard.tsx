"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, FileText, AlertCircle, Wrench, Droplets, Zap, Key, LucideIcon } from "lucide-react";

export interface ActivityItem {
  type: "maintenance_update" | "document_upload" | "announcement_posted";
  id: string;
  title: string;
  timestamp: string;
  meta?: string;
  actor?: string;
  property_name?: string;
  unit_label?: string;
}

export interface RecentActivityCardProps {
  activity: ActivityItem[];
}

function formatStatusText(str: string) {
  if (!str) return "Unknown";
  return str
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getStatusColor(str: string) {
  const s = (str || "").toLowerCase();
  if (s === "closed" || s === "resolved") return "text-muted-foreground";
  return "text-teal-600 dark:text-[#2DD4BF]";
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

export function RecentActivityCard({ activity }: RecentActivityCardProps) {
  const filteredActivity = activity.filter((act) => {
    if (act.meta === "closed" && act.actor !== "tenant") return false;
    return true;
  });

  const displayedActivity = filteredActivity.slice(0, 5);

  return (
    <div className="flex flex-col bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-6 shadow-sm overflow-hidden">
      <div className="px-6 pb-4">
        <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
          Recent activity
        </span>
      </div>
      <div className="flex-1 overflow-x-hidden">
        {filteredActivity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Activity Yet"
            description="Recent updates will appear here."
            className="border-none bg-transparent shadow-none py-6 mx-6"
          />
        ) : (
          <ul className="divide-y divide-border/40">
            {displayedActivity.map((act, idx) => {
              const isReopened = act.meta === "reopened";
              const isClosedByTenant = act.meta === "closed" && act.actor === "tenant";
              const isResolved =
                act.type === "maintenance_update" &&
                (act.meta === "resolved" || isClosedByTenant);
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
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-[13px] flex-shrink-0 mt-0.5",
                          isReopened
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : isResolved
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20"
                        )}
                      >
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
                              {formatAddress(act.property_name)}
                              {act.unit_label ? ` · ${act.unit_label}` : ""}
                              {" · "}
                            </span>
                          )}
                          {act.type === "maintenance_update" ? (
                            isReopened ? (
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                Case reopened by tenant
                              </span>
                            ) : isClosedByTenant ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                Case closed by tenant
                              </span>
                            ) : (
                              <>
                                Status changed to{" "}
                                <span className={cn("font-bold", getStatusColor(act.meta || ""))}>
                                  {formatStatusText(act.meta || "")}
                                </span>
                              </>
                            )
                          ) : act.type === "document_upload" ? (
                            <>Document uploaded</>
                          ) : (
                            <>Announcement posted</>
                          )}
                          {" · "}
                          {new Date(act.timestamp).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-lg self-center select-none ml-2">
                        &rsaquo;
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
