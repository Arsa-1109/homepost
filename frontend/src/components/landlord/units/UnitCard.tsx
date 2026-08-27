"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  DoorOpen,
  Calendar,
  Clock,
  ExternalLink,
  UserCheck,
  UserX,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";

export interface Unit {
  id: string;
  property_id: string;
  unit_label: string;
  rent_due_day: number;
  lease_start?: string | null;
  lease_end?: string | null;
  is_occupied: boolean;
  has_pending: boolean;
}

export interface UnitCardProps {
  u: Unit;
  onRefresh: () => void;
}

export function UnitCard({ u, onRefresh }: UnitCardProps) {
  const [keepData, setKeepData] = useState(true);
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseTenureType, setLeaseTenureType] = useState("12");
  const [customLeaseTenure, setCustomLeaseTenure] = useState("12");
  const [rentDueDay, setRentDueDay] = useState(
    u.rent_due_day ? u.rent_due_day.toString() : "1"
  );

  const isLeaseExpired = useMemo(() => {
    if (!u.lease_end) return false;
    const end = new Date(u.lease_end);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  }, [u.lease_end]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveTenant = async () => {
    setIsRemoving(true);
    try {
      await fetchAPI(`/api/v1/landlord/units/${u.id}/tenant`, {
        method: "DELETE",
      });
      toast.success("Tenant removed successfully.");
      setIsRemoveDialogOpen(false);
      onRefresh();
    } catch (err) {
      toast.error("Failed to remove tenant.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="p-6 border border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between group/card h-full min-h-[240px] shadow-sm relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20">
      <div>
        {/* Header Row */}
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <Link
              href={`/landlord/units/${u.id}`}
              className="font-black text-lg sm:text-xl tracking-tight text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] transition-colors truncate block"
              title={u.unit_label}
            >
              {u.unit_label}
            </Link>
            <div className="space-y-1 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                <span>Rent due on day {u.rent_due_day}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                <span className={(!u.lease_start || !u.lease_end ? "opacity-40 italic " : "") + "tabular-nums"}>
                  {u.lease_start && u.lease_end
                    ? `${new Date(u.lease_start).toLocaleDateString()} – ${new Date(u.lease_end).toLocaleDateString()}`
                    : "No lease period set"}
                </span>
              </div>
              {isLeaseExpired && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 mt-1.5 self-start shadow-sm">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Lease Expired</span>
                </div>
              )}
            </div>
          </div>

          <Badge
            variant="outline"
            className={`capitalize tracking-wider text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 border ${
              u.is_occupied
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${u.is_occupied ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
            />
            {u.is_occupied ? "Occupied" : "Vacant"}
          </Badge>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-border/40 flex flex-col gap-2">
        <Link
          href={`/landlord/units/${u.id}`}
          className="text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))]/80 px-3.5 py-2.5 rounded-xl w-full flex items-center justify-center gap-2 cursor-pointer shadow-sm group/btn transition-all duration-200 ease-out active:scale-[0.98] border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))]"
        >
          <span>View Details</span>
          <ExternalLink className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))] group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>

        {u.is_occupied ? (
          <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
            <DialogTrigger className="text-xs text-center font-bold text-red-600 dark:text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-3.5 py-2.5 rounded-xl transition-all w-full cursor-pointer flex items-center justify-center gap-2">
              <UserX className="w-3.5 h-3.5" />
              <span>Remove Tenant</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl outline-none ring-0">
              <div className="p-6 sm:p-7 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shrink-0 shadow-inner">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
                        Remove Tenant
                      </DialogTitle>
                      <DialogDescription className="mt-1.5 text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                        Are you sure you want to remove the tenant from{" "}
                        <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                          {u.unit_label}
                        </span>
                        ? This action is permanent and clears their active residency.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30 flex gap-3 justify-end items-center">
                  <button
                    type="button"
                    onClick={() => setIsRemoveDialogOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={handleRemoveTenant}
                    className="px-5 py-2.5 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial shadow-sm shadow-red-600/20 active:scale-[0.98]"
                  >
                    {isRemoving ? "Removing..." : "Yes, remove tenant"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="text-xs text-center bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-3.5 py-2.5 rounded-xl w-full cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Invite Tenant</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-visible border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl outline-none ring-0">
              <div className="p-6 sm:p-7 space-y-5 relative">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0 shadow-inner ring-4 ring-[rgb(var(--ml-accent))]/5">
                    <DoorOpen className="h-6 w-6 text-[rgb(var(--ml-accent))]" />
                  </div>
                  <div>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
                        Invite Tenant
                      </DialogTitle>
                      <DialogDescription className="mt-1.5 text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                        Generate a unique, secure invite link for your new tenant moving into{" "}
                        <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                          {u.unit_label}
                        </span>
                        .
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                </div>

                <label className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/60 border border-border/30 hover:border-[rgb(var(--ml-text-primary))]/40 transition-all cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={keepData}
                    onChange={(e) => setKeepData(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 shrink-0 ${
                      keepData
                        ? "bg-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] shadow-[0_2px_10px_rgba(var(--ml-accent),0.3)] scale-100"
                        : "bg-[rgb(var(--ml-bg-primary))] border-border/80 text-transparent group-hover:border-[rgb(var(--ml-text-primary))]/40"
                    }`}
                  >
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] transition-all duration-200 ${keepData ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors">
                      Retain Previous Data
                    </p>
                    <p className="text-[11px] font-medium text-[rgb(var(--ml-text-secondary))] leading-normal">
                      Keep the previous tenant&apos;s documents and history attached to this unit.
                    </p>
                  </div>
                </label>

                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                      <span>Monthly Rent Due Day</span>
                    </label>
                    <Select
                      value={rentDueDay}
                      onValueChange={(val) => setRentDueDay(val || "1")}
                    >
                      <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11 text-xs font-medium">
                        <SelectValue placeholder="Select Rent Due Day" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-56 overflow-y-auto z-[120]">
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem
                            key={i + 1}
                            value={(i + 1).toString()}
                            className="font-semibold text-xs cursor-pointer"
                          >
                            Day {i + 1} of every month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                      <span>Lease Start Date (Optional)</span>
                    </label>
                    <DatePicker
                      value={leaseStart}
                      onChange={(dateStr) => setLeaseStart(dateStr)}
                      placeholder="Select lease start date"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
                      Lease Tenure
                    </label>
                    <Select
                      value={leaseTenureType}
                      onValueChange={(val) => setLeaseTenureType(val || "12")}
                    >
                      <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11 text-xs font-medium">
                        <SelectValue placeholder="Select Tenure" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-60 overflow-y-auto z-[120]">
                        <SelectItem value="3" className="font-semibold text-xs cursor-pointer">
                          3 Months
                        </SelectItem>
                        <SelectItem value="6" className="font-semibold text-xs cursor-pointer">
                          6 Months
                        </SelectItem>
                        <SelectItem value="12" className="font-semibold text-xs cursor-pointer">
                          12 Months (1 Year)
                        </SelectItem>
                        <SelectItem value="24" className="font-semibold text-xs cursor-pointer">
                          24 Months (2 Years)
                        </SelectItem>
                        <SelectItem value="custom" className="font-semibold text-xs cursor-pointer">
                          Custom Duration...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {leaseTenureType === "custom" && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={customLeaseTenure}
                          onChange={(e) => setCustomLeaseTenure(e.target.value)}
                          placeholder="Months (e.g. 18)"
                          className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-2.5 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))]"
                        />
                        <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] shrink-0">
                          Months
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30 flex gap-3 justify-end items-center">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        let lease_start: string | null = null;
                        let lease_end: string | null = null;

                        if (leaseStart) {
                          lease_start = leaseStart;
                          const finalTenureMonths =
                            leaseTenureType === "custom"
                              ? parseInt(customLeaseTenure)
                              : parseInt(leaseTenureType);

                          if (!isNaN(finalTenureMonths) && finalTenureMonths >= 1) {
                            const startDate = new Date(leaseStart);
                            if (!isNaN(startDate.getTime())) {
                              const endDate = new Date(startDate);
                              endDate.setMonth(endDate.getMonth() + finalTenureMonths);
                              lease_end = endDate.toISOString().split("T")[0];
                            }
                          }
                        }

                        const res = await fetchAPI<{ token: string }>(
                          "/api/v1/landlord/generate-invite",
                          {
                            method: "POST",
                            body: JSON.stringify({
                              unit_id: u.id,
                              clear_data: !keepData,
                              lease_start,
                              lease_end,
                              rent_due_day: parseInt(rentDueDay) || 1,
                            }),
                          }
                        );
                        const link = `${window.location.origin}/join/${res.token}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Invite link copied to clipboard!");
                        setIsDialogOpen(false);
                        onRefresh();
                      } catch (err) {
                        toast.error("Failed to generate invite.");
                      }
                    }}
                    className="px-5 py-2.5 text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] rounded-xl flex-1 sm:flex-initial shadow-sm shadow-[rgba(var(--ml-accent),0.2)] cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Generate Link</span>
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
