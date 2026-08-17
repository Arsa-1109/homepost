"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  DoorOpen,
  Search,
  Plus,
  X,
  Home,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  UserX,
  Building2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Check,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

type Property = {
  id: string;
  name: string;
};

type Unit = {
  id: string;
  property_id: string;
  unit_label: string;
  rent_due_day: number;
  lease_start?: string | null;
  lease_end?: string | null;
  is_occupied: boolean;
  has_pending: boolean;
};

function UnitCard({ u, onRefresh }: { u: Unit; onRefresh: () => void }) {
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
    <div className="p-6 border border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between group/card h-full min-h-[240px] shadow-sm relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20">
      <div>
        {/* Header Row: Label & Status Badge */}
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <Link
              href={`/landlord/units/${u.id}`}
              className="font-black text-lg sm:text-xl tracking-tight text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] transition-colors truncate block max-w-[180px]"
              title={`Unit ${u.unit_label}`}
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
                <span className={!u.lease_start || !u.lease_end ? "opacity-40 italic" : ""}>
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

      {/* Card Footer Actions */}
      <div className="mt-6 pt-4 border-t border-border/40 flex flex-col gap-2">
        <Link
          href={`/landlord/units/${u.id}`}
          className="text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))]/80 px-3.5 py-2.5 rounded-xl w-full flex items-center justify-center gap-2 cursor-pointer shadow-sm group/btn transition-all duration-200 ease-out active:scale-[0.98] border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))]"
        >
          <span>View Details</span>
          <ExternalLink className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))] group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>

        {u.is_occupied ? (
          <Dialog
            open={isRemoveDialogOpen}
            onOpenChange={setIsRemoveDialogOpen}
          >
            <DialogTrigger className="text-xs text-center font-bold text-red-600 dark:text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-3.5 py-2.5 rounded-xl transition-all w-full cursor-pointer flex items-center justify-center gap-2">
              <UserX className="w-3.5 h-3.5" />
              <span>Remove Tenant</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl outline-none ring-0">
              <div className="p-6 sm:p-7 space-y-6">
                {/* Header */}
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
                          Unit {u.unit_label}
                        </span>
                        ? This action is permanent and clears their active
                        residency.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-border/30 flex gap-3 justify-end items-center">
                  <button
                    type="button"
                    onClick={() => setIsRemoveDialogOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
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
                {/* Header */}
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
                        Generate a unique, secure invite link for your new
                        tenant moving into{" "}
                        <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                          Unit {u.unit_label}
                        </span>
                        .
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                </div>

                {/* Custom Glassmorphic Checkbox Card for Retain Data */}
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
                      Keep the previous tenant's documents and history attached
                      to this unit.
                    </p>
                  </div>
                </label>

                {/* Lease & Rent Terms Picker */}
                <div className="space-y-3.5 pt-1">
                  {/* Monthly Rent Due Day */}
                  <div>
                    <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 flex items-center gap-1.5">
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

                  {/* Lease Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                      <span>Lease Start Date (Optional)</span>
                    </label>
                    <DatePicker
                      value={leaseStart}
                      onChange={(dateStr) => setLeaseStart(dateStr)}
                      placeholder="Select lease start date"
                    />
                  </div>

                  {/* Lease Tenure */}
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
                        <SelectItem
                          value="3"
                          className="font-semibold text-xs cursor-pointer"
                        >
                          3 Months
                        </SelectItem>
                        <SelectItem
                          value="6"
                          className="font-semibold text-xs cursor-pointer"
                        >
                          6 Months
                        </SelectItem>
                        <SelectItem
                          value="12"
                          className="font-semibold text-xs cursor-pointer"
                        >
                          12 Months (1 Year)
                        </SelectItem>
                        <SelectItem
                          value="24"
                          className="font-semibold text-xs cursor-pointer"
                        >
                          24 Months (2 Years)
                        </SelectItem>
                        <SelectItem
                          value="custom"
                          className="font-semibold text-xs cursor-pointer"
                        >
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
                          onChange={(e) =>
                            setCustomLeaseTenure(e.target.value)
                          }
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

                {/* Actions Footer */}
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
                          },
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

export default function LandlordUnitsPage() {
  const { isLoaded, getToken } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);

  // Progressive disclosure creation state
  const [unitLabel, setUnitLabel] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [inviteImmediately, setInviteImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Invite Modal for immediate invite after creation
  const [createdUnitForInvite, setCreatedUnitForInvite] = useState<Unit | null>(
    null
  );
  const [isImmediateInviteOpen, setIsImmediateInviteOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "OCCUPIED" | "VACANT"
  >("ALL");

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page index when search query, filter, or selected property changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, selectedProperty]);

  useEffect(() => {
    if (!isLoaded) return;
    async function loadProps() {
      try {
        const token = await getToken();
        const data = await fetchAPI<Property[]>("/api/v1/landlord/properties", {}, token);
        setProperties(data);
        if (data.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const initialPropertyId = urlParams.get("property_id");
          if (
            initialPropertyId &&
            data.some((p) => p.id === initialPropertyId)
          ) {
            setSelectedProperty(initialPropertyId);
          } else {
            setSelectedProperty(data[0].id);
          }
        } else {
          setUnitsLoading(false);
        }
      } catch (err) {
        console.error(err);
        setUnitsLoading(false);
      } finally {
        setLoading(false);
      }
    }
    loadProps();
  }, [isLoaded]);

  const loadUnits = async () => {
    if (!isLoaded || !selectedProperty) return;
    setUnitsLoading(true);
    try {
      const token = await getToken();
      const data = await fetchAPI<Unit[]>(
        `/api/v1/landlord/properties/${selectedProperty}/units`,
        {},
        token
      );
      setUnits(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    loadUnits();
  }, [selectedProperty, isLoaded]);

  // Single unit creation
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = unitLabel.trim();
    if (!selectedProperty || !cleanLabel) return;

    setIsSubmitting(true);
    try {
      const newUnit = await fetchAPI<Unit>("/api/v1/landlord/units", {
        method: "POST",
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_label: cleanLabel,
        }),
      });
      setUnits((prev) => [...prev, newUnit]);
      setUnitLabel("");
      toast.success(`Unit "${newUnit.unit_label}" created successfully!`);

      if (inviteImmediately) {
        setCreatedUnitForInvite(newUnit);
        setIsImmediateInviteOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create unit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to parse batch input
  const parsedBatchLabels = useMemo(() => {
    const parts = batchInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result: string[] = [];

    for (const part of parts) {
      const rangeMatch = part.match(
        /^([A-Za-z\s_-]*)(\d+)\s*[-–—]\s*([A-Za-z\s_-]*)(\d+)$/
      );
      if (rangeMatch) {
        const prefix1 = rangeMatch[1];
        const startNum = parseInt(rangeMatch[2], 10);
        const prefix2 = rangeMatch[3];
        const endNum = parseInt(rangeMatch[4], 10);
        const prefix = prefix1 || prefix2 || "";

        if (
          !isNaN(startNum) &&
          !isNaN(endNum) &&
          startNum <= endNum &&
          endNum - startNum <= 50
        ) {
          for (let n = startNum; n <= endNum; n++) {
            result.push(`${prefix}${n}`.trim());
          }
          continue;
        }
      }
      result.push(part);
    }

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of result) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    return unique;
  }, [batchInput]);

  // Batch unit creation
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || parsedBatchLabels.length === 0) return;

    setIsSubmitting(true);
    try {
      const createdUnits = await fetchAPI<Unit[]>(
        "/api/v1/landlord/units/batch",
        {
          method: "POST",
          body: JSON.stringify({
            property_id: selectedProperty,
            unit_labels: parsedBatchLabels,
          }),
        }
      );
      setUnits((prev) => [...prev, ...createdUnits]);
      setBatchInput("");
      setIsBatchMode(false);
      toast.success(
        `Created ${createdUnits.length} unit${
          createdUnits.length === 1 ? "" : "s"
        } successfully!`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to create units in batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "Property";

  const filteredUnits = useMemo(() => {
    return units
      .filter((u) => {
        const matchesSearch = u.unit_label
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (selectedFilter === "OCCUPIED") return u.is_occupied;
        if (selectedFilter === "VACANT") return !u.is_occupied;
        return true;
      })
      .sort((a, b) =>
        a.unit_label.localeCompare(b.unit_label, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
  }, [units, searchQuery, selectedFilter]);

  const totalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE) || 1;

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUnits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUnits, currentPage]);

  const occupiedCount = useMemo(
    () => units.filter((u) => u.is_occupied).length,
    [units],
  );
  const vacantCount = useMemo(
    () => units.filter((u) => !u.is_occupied).length,
    [units],
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Hero Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
              Property Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Units
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                {units.length}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Set up property units, manage occupancy status, and generate
              secure tenant onboarding invite links.
            </p>
          </div>

          {/* Action & Property Selector Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Property Switcher */}
            <div className="relative flex-1 sm:w-56">
              {loading ? (
                <div className="w-full bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl h-11 flex items-center px-3">
                  <div className="skeleton h-4 w-32 rounded-md" />
                </div>
              ) : properties.length > 0 ? (
                <Select
                  value={selectedProperty}
                  onValueChange={(val) => setSelectedProperty(val as string)}
                >
                  <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-secondary))] border-border/60 rounded-xl h-11">
                    <span className="flex items-center gap-2 font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                      <Building2 className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))]" />
                      {selectedPropertyName}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                    {properties.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="font-semibold text-xs"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        {properties.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
              {(["ALL", "OCCUPIED", "VACANT"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === filter
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-transparent shadow-sm"
                      : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:border-border hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  {filter === "ALL" && "All Units"}
                  {filter === "OCCUPIED" && `Occupied (${occupiedCount})`}
                  {filter === "VACANT" && `Vacant (${vacantCount})`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search unit label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {!loading && properties.length === 0 ? (
        <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-3">
          <Building2 className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
            No Properties Found
          </h3>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
            Please add a property first before setting up and managing units.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Metrics Bar */}
          {!unitsLoading && units.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                    Total Units
                  </p>
                  <p className="text-xl font-black text-[rgb(var(--ml-text-primary))] mt-0.5">
                    {units.length}
                  </p>
                </div>
                <Home className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
              </div>
              <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                    Occupied
                  </p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {occupiedCount}
                  </p>
                </div>
                <UserCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                    Vacant
                  </p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {vacantCount}
                  </p>
                </div>
                <UserX className="w-5 h-5 text-amber-500" />
              </div>
              <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                    Occupancy Rate
                  </p>
                  <p className="text-xl font-black text-[rgb(var(--ml-text-primary))] mt-0.5">
                    {units.length
                      ? Math.round((occupiedCount / units.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
              </div>
            </div>
          )}

          {/* Progressive Disclosure Unit Creation Section */}
          <div className="p-5 sm:p-6 bg-[rgb(var(--ml-bg-secondary))] border border-border/70 rounded-3xl space-y-4 shadow-sm relative">
            {!isBatchMode ? (
              /* Single Unit Quick-Add */
              <form onSubmit={handleCreateSingle} className="space-y-3.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={unitLabel}
                      onChange={(e) => setUnitLabel(e.target.value)}
                      placeholder={`Unit label / name (e.g. Apt 104, Room 2B for ${selectedPropertyName})`}
                      className="w-full h-11 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl px-4 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/60"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!unitLabel.trim() || isSubmitting}
                    className="h-11 px-5 rounded-xl bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)] disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmitting ? "Adding..." : "Add Unit"}</span>
                  </Button>
                </div>

                {/* Progressive Disclosure Triggers */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                  {/* Batch Mode Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchMode(true);
                      setBatchInput("");
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>+ Add multiple units</span>
                  </button>

                  {/* Advanced: Invite Tenant Immediately */}
                  <label className="inline-flex items-center gap-2 font-medium text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inviteImmediately}
                      onChange={(e) => setInviteImmediately(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 ${
                        inviteImmediately
                          ? "bg-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))]"
                          : "bg-[rgb(var(--ml-bg-primary))] border-border/80 text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>Invite tenant immediately</span>
                  </label>
                </div>
              </form>
            ) : (
              /* Batch Unit Creation Mode */
              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[rgb(var(--ml-text-primary))]">
                    <Layers className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                    <span>Batch Add Units</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBatchMode(false)}
                    className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] transition-colors cursor-pointer"
                  >
                    Switch to single unit
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder="Enter unit numbers or ranges (e.g. 101, 102, 103 or 101-106, Apt 1-4)"
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/60 resize-none"
                  />

                  {/* Preview Chips */}
                  {parsedBatchLabels.length > 0 && (
                    <div className="p-3 rounded-xl bg-[rgb(var(--ml-bg-primary))]/50 border border-border/40 space-y-1.5">
                      <p className="text-[11px] font-bold text-[rgb(var(--ml-text-secondary))]">
                        Detected Units ({parsedBatchLabels.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {parsedBatchLabels.map((label, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-[rgb(var(--ml-bg-secondary))] border border-border/60 text-[11px] font-bold text-[rgb(var(--ml-text-primary))]"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-1 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBatchMode(false)}
                    className="px-4 py-2 text-xs font-bold border-border/40 rounded-xl hover:bg-[rgb(var(--ml-bg-primary))]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={parsedBatchLabels.length === 0 || isSubmitting}
                    className="px-5 py-2 text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] rounded-xl shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] disabled:opacity-50 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]"
                  >
                    {isSubmitting
                      ? "Creating..."
                      : `Create ${parsedBatchLabels.length} Unit${
                          parsedBatchLabels.length === 1 ? "" : "s"
                        }`}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Units Content Area */}
          <AnimatePresence mode="wait">
            {unitsLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-56 w-full bg-[rgb(var(--ml-bg-secondary))]/40 border border-border/30 rounded-3xl p-6 flex flex-col justify-between animate-pulse"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="h-6 w-28 bg-[rgb(var(--ml-border))]/40 rounded-lg"></div>
                        <div className="h-6 w-16 bg-[rgb(var(--ml-border))]/40 rounded-full"></div>
                      </div>
                      <div className="h-4 w-36 bg-[rgb(var(--ml-border))]/30 rounded-md mt-3"></div>
                    </div>
                    <div className="space-y-2 mt-auto">
                      <div className="h-9 w-full bg-[rgb(var(--ml-border))]/30 rounded-xl"></div>
                      <div className="h-9 w-full bg-[rgb(var(--ml-border))]/20 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : filteredUnits.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 px-6 border border-dashed border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))]/30 space-y-3"
              >
                <Home className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                  {searchQuery
                    ? "No matching units found"
                    : "No units in this property"}
                </h3>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))] max-w-sm mx-auto">
                  {searchQuery
                    ? `No units match your search query "${searchQuery}". Try clearing the search or filter.`
                    : "Get started by adding your first unit to this property using the input above."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`page-${currentPage}`}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {paginatedUnits.map((u) => (
                  <motion.div
                    key={u.id}
                    className="h-full"
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <UnitCard u={u} onRefresh={loadUnits} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination Controls Bar */}
          {!unitsLoading && filteredUnits.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40">
              <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                Showing{" "}
                <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                –
                <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredUnits.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                  {filteredUnits.length}
                </span>{" "}
                units
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center justify-center ${
                          currentPage === pageNum
                            ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-transparent shadow-sm"
                            : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/30 hover:text-[rgb(var(--ml-text-primary))]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Immediate Invite Modal when user checks 'Invite tenant immediately' */}
      {createdUnitForInvite && (
        <ImmediateInviteModal
          unit={createdUnitForInvite}
          isOpen={isImmediateInviteOpen}
          onClose={() => {
            setIsImmediateInviteOpen(false);
            setCreatedUnitForInvite(null);
            loadUnits();
          }}
        />
      )}
    </div>
  );
}

function ImmediateInviteModal({
  unit,
  isOpen,
  onClose,
}: {
  unit: Unit;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [keepData, setKeepData] = useState(true);
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseTenureType, setLeaseTenureType] = useState("12");
  const [customLeaseTenure, setCustomLeaseTenure] = useState("12");
  const [rentDueDay, setRentDueDay] = useState(
    unit.rent_due_day ? unit.rent_due_day.toString() : "1"
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
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
            unit_id: unit.id,
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
      onClose();
    } catch (err) {
      toast.error("Failed to generate invite.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                  Generate a unique, secure invite link for your new tenant
                  moving into{" "}
                  <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                    Unit {unit.unit_label}
                  </span>
                  .
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 flex items-center gap-1.5">
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
              <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 flex items-center gap-1.5">
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
                  <SelectItem
                    value="3"
                    className="font-semibold text-xs cursor-pointer"
                  >
                    3 Months
                  </SelectItem>
                  <SelectItem
                    value="6"
                    className="font-semibold text-xs cursor-pointer"
                  >
                    6 Months
                  </SelectItem>
                  <SelectItem
                    value="12"
                    className="font-semibold text-xs cursor-pointer"
                  >
                    12 Months (1 Year)
                  </SelectItem>
                  <SelectItem
                    value="24"
                    className="font-semibold text-xs cursor-pointer"
                  >
                    24 Months (2 Years)
                  </SelectItem>
                  <SelectItem
                    value="custom"
                    className="font-semibold text-xs cursor-pointer"
                  >
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
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="px-5 py-2.5 text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] rounded-xl flex-1 sm:flex-initial shadow-sm shadow-[rgba(var(--ml-accent),0.2)] cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)] disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Generating..." : "Generate Link"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
