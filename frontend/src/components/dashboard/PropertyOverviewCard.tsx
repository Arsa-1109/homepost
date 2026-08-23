"use client";

import React from "react";

export interface PropertyOverviewCardProps {
  stats: {
    total_properties: number;
    total_units: number;
    occupied_units: number;
    vacant_units: number;
  };
}

export function PropertyOverviewCard({ stats }: PropertyOverviewCardProps) {
  const occupancyPercent =
    stats.total_units > 0
      ? Math.round((stats.occupied_units / stats.total_units) * 100)
      : 0;

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (occupancyPercent / 100) * circumference;

  return (
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
            <div className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-extrabold mb-1.5 uppercase tracking-wider">
              Properties
            </div>
            <div className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] leading-none tabular-nums">
              {stats.total_properties}
            </div>
          </div>
          <div className="flex-1 p-4 border-l border-border/60">
            <div className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-extrabold mb-1.5 uppercase tracking-wider">
              Total units
            </div>
            <div className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] leading-none tabular-nums">
              {stats.total_units}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 py-1">
          <svg width="60" height="60" viewBox="0 0 64 64" className="flex-shrink-0">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              className="stroke-zinc-200 dark:stroke-[#1E2731]"
              strokeWidth="8"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              className="stroke-[rgb(var(--ml-accent))]"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
            />
          </svg>
          <div className="text-[13px] text-[rgb(var(--ml-text-secondary))] font-semibold leading-tight select-none">
            <span className="text-[rgb(var(--ml-text-primary))] text-base font-black">
              {occupancyPercent}%
            </span>{" "}
            occupancy<br />across your portfolio
          </div>
        </div>

        <div className="border-t border-border/40 pt-2 space-y-1">
          <div className="flex justify-between items-center py-2 border-b border-border/30">
            <div className="flex items-center gap-2.5 text-xs font-bold text-[rgb(var(--ml-text-primary))]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              Occupied
            </div>
            <div className="text-sm font-black text-[rgb(var(--ml-text-primary))] tabular-nums">
              {stats.occupied_units}
            </div>
          </div>
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2.5 text-xs font-bold text-[rgb(var(--ml-text-primary))]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
              Vacant
            </div>
            <div className="text-sm font-black text-[rgb(var(--ml-text-primary))] tabular-nums">
              {stats.vacant_units}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
