"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Home, Plus } from "lucide-react";

export interface UnitItem {
  id: string;
  property_id: string;
  property_name: string;
  unit_label: string;
  is_occupied: boolean;
  tenant_name?: string | null;
  has_pending_maintenance?: boolean;
  has_pending_invite?: boolean;
  has_pending?: boolean;
}

export interface OccupiedUnitsCardProps {
  totalProperties: number;
  totalUnits: number;
  units: UnitItem[];
}

function getUnitInitials(label: string): string {
  const noiseWords = new Set(["unit", "the", "a", "an", "of", "and", "or", "in", "on", "at", "to", "for", "with"]);
  const words = label
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w.trim() && !noiseWords.has(w));

  if (words.length === 0) return "UN";

  if (words.length === 1) {
    const singleWord = words[0];
    if (/^\d+$/.test(singleWord)) {
      return singleWord.slice(0, 4).toUpperCase();
    }
    return singleWord.slice(0, 2).toUpperCase();
  }

  const first = words[0][0] || "";
  const second = words[1][0] || "";
  return (first + second).toUpperCase();
}

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

export function OccupiedUnitsCard({
  totalProperties,
  totalUnits,
  units,
}: OccupiedUnitsCardProps) {
  const occupiedUnits = [...units].filter((u) => u.is_occupied);
  const displayedUnits = occupiedUnits.slice(0, 4);
  const hasMoreUnits = occupiedUnits.length > 4;

  return (
    <div className="flex flex-col flex-1 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-border/80 transition-all rounded-3xl py-6 shadow-sm">
      <div className="px-6 pb-4">
        <span className="text-[10px] font-extrabold tracking-wider text-[rgb(var(--ml-text-secondary))] uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
          Occupied Units
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-between">
        {totalProperties === 0 ? (
          <EmptyState
            icon={Home}
            title="Portfolio Hasn't Been Created"
            description="Add your first property to start managing units."
            className="border-none bg-transparent shadow-none py-10 mx-6"
            action={
              <Link href="/landlord/properties?add=true">
                <Button className="rounded-full px-6 font-bold flex items-center gap-2 bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]">
                  <Plus className="w-4 h-4" /> Add Property
                </Button>
              </Link>
            }
          />
        ) : displayedUnits.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No Occupied Units Yet"
            description="Units with active tenants will appear here."
            className="border-none bg-transparent shadow-none py-10 mx-6"
            action={
              <Link href="/landlord/units">
                <Button variant="outline" className="rounded-full px-5 text-xs font-bold mt-2">
                  Manage All Units
                </Button>
              </Link>
            }
          />
        ) : (
          <div>
            <ul className="divide-y divide-border/40">
              {displayedUnits.map((unit) => (
                <li key={unit.id}>
                  <Link href={`/landlord/units/${unit.id}`} className="block">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-4 sm:px-6 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 transition-all duration-200 cursor-pointer group gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border/40 flex items-center justify-center font-black text-xs text-[rgb(var(--ml-text-primary))] shrink-0 px-1">
                          {getUnitInitials(unit.unit_label)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-[rgb(var(--ml-text-primary))] leading-snug truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                            {unit.unit_label}
                          </div>
                          <div className="text-xs text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5 truncate">
                            {unit.tenant_name ? `${unit.tenant_name} · ` : ""}
                            {formatAddress(unit.property_name || "Unknown Property")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-12 sm:pl-0">
                        {unit.is_occupied ? (
                          <div className="flex items-center gap-1.5">
                            {unit.has_pending_maintenance && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Maint.
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Occupied
                            </span>
                          </div>
                        ) : unit.has_pending_maintenance ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending Maint.
                          </span>
                        ) : unit.has_pending_invite ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Invite Sent
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-muted text-[rgb(var(--ml-text-secondary))] border border-border/40">
                            Vacant
                          </span>
                        )}
                        <span className="text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 group-hover:text-[rgb(var(--ml-text-primary))] transition-all text-lg leading-none select-none">
                          &rsaquo;
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {hasMoreUnits && (
              <div className="px-6 pt-3 pb-1 border-t border-border/40 text-center">
                <Link
                  href="/landlord/units"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline cursor-pointer"
                >
                  View all units ({totalUnits}) &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
