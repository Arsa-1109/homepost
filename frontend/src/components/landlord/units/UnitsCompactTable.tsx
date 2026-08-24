"use client";

import Link from "next/link";
import { UserCheck, UserX } from "lucide-react";
import type { Unit } from "@/components/landlord/units/UnitCard";

interface UnitsCompactTableProps {
  units: Unit[];
}

/**
 * Dense table alternative to the unit card grid — one row per unit with
 * label, occupancy, rent due day, and lease period. `tabular-nums` on all
 * numeric/date cells prevents width jitter while scanning.
 */
export function UnitsCompactTable({ units }: UnitsCompactTableProps) {
  return (
    <div className="overflow-x-auto border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">Units in this property</caption>
        <thead>
          <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
            <th scope="col" className="px-4 py-3 font-extrabold">Unit</th>
            <th scope="col" className="px-4 py-3 font-extrabold">Status</th>
            <th scope="col" className="px-4 py-3 font-extrabold">Rent Due Day</th>
            <th scope="col" className="px-4 py-3 font-extrabold hidden sm:table-cell">Lease Period</th>
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr
              key={u.id}
              className="border-b border-border/30 last:border-b-0 hover:bg-[rgb(var(--ml-bg-tertiary))]/50 transition-colors"
            >
              <td className="px-4 py-2.5 font-bold text-[rgb(var(--ml-text-primary))] max-w-[140px] truncate">
                {u.has_pending && (
                  <span
                    className="inline-block size-1.5 rounded-full bg-amber-500 mr-1.5 align-middle"
                    title="Pending tenant request"
                  />
                )}
                <span title={u.unit_label}>{u.unit_label}</span>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold ${
                    u.is_occupied
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/25"
                  }`}
                >
                  {u.is_occupied ? (
                    <UserCheck className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <UserX className="w-3 h-3" aria-hidden="true" />
                  )}
                  {u.is_occupied ? "Occupied" : "Vacant"}
                </span>
              </td>
              <td className="px-4 py-2.5 tabular-nums text-[rgb(var(--ml-text-secondary))] font-semibold">
                {u.rent_due_day}
              </td>
              <td className="px-4 py-2.5 tabular-nums text-[rgb(var(--ml-text-secondary))] hidden sm:table-cell whitespace-nowrap">
                {u.lease_start && u.lease_end ? (
                  <>
                    {new Date(u.lease_start).toLocaleDateString()} –{" "}
                    {new Date(u.lease_end).toLocaleDateString()}
                  </>
                ) : (
                  <span className="opacity-40 italic">No lease</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2 border-t border-border/40">
        <Link
          href="#"
          onClick={(e) => e.preventDefault()}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
