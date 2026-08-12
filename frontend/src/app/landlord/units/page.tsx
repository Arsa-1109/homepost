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
} from "lucide-react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
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

type Property = {
  id: string;
  name: string;
};

type Unit = {
  id: string;
  property_id: string;
  unit_label: string;
  rent_due_day: number;
  is_occupied: boolean;
  has_pending: boolean;
};

function UnitCard({ u, onRefresh }: { u: Unit; onRefresh: () => void }) {
  const [keepData, setKeepData] = useState(true);
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
    <div className="p-6 border border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between hover:border-[rgb(var(--ml-accent))]/40 transition-all duration-300 group/card min-h-[220px] shadow-sm relative overflow-hidden">
      {/* Background Accent Mesh Effect on Hover */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-[rgb(var(--ml-accent))]/5 rounded-full blur-2xl group-hover/card:bg-[rgb(var(--ml-accent))]/15 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Header Row: Label & Status Badge */}
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1">
            <Link
              href={`/landlord/units/${u.id}`}
              className="font-black text-lg sm:text-xl tracking-tight text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] transition-colors truncate block max-w-[180px]"
              title={`Unit ${u.unit_label}`}
            >
              {u.unit_label}
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
              <Calendar className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
              <span>Rent due on day {u.rent_due_day}</span>
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
          className="text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 hover:bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-text-primary))]/30 px-3.5 py-2.5 rounded-xl transition-all w-full flex items-center justify-center gap-2 cursor-pointer shadow-sm group/btn"
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
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl">
              <div className="bg-red-500/10 px-6 pt-8 pb-6 flex flex-col items-center border-b border-border/30">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 mb-4 ring-8 ring-red-500/5">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
                    Remove Tenant
                  </DialogTitle>
                  <DialogDescription className="text-center mt-3 text-pretty text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-[320px] mx-auto">
                    Are you sure you want to remove the tenant from{" "}
                    <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                      Unit {u.unit_label}
                    </span>
                    ? This action is permanent and clears their active
                    residency.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="bg-[rgb(var(--ml-bg-secondary))] px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end items-center">
                <button
                  onClick={() => setIsRemoveDialogOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={isRemoving}
                  onClick={handleRemoveTenant}
                  className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto shadow-sm shadow-red-600/20 active:scale-[0.98]"
                >
                  {isRemoving ? "Removing..." : "Yes, remove tenant"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="text-xs text-center bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-3.5 py-2.5 rounded-xl hover:bg-[rgb(var(--ml-accent-dark))] transition-all w-full cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] active:scale-[0.98]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Invite Tenant</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl">
              <div className="bg-[rgb(var(--ml-accent))]/10 px-6 pt-8 pb-6 flex flex-col items-center border-b border-border/20">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgb(var(--ml-accent))]/20 text-[rgb(var(--ml-accent))] mb-4 ring-8 ring-[rgb(var(--ml-accent))]/5">
                  <DoorOpen className="h-7 w-7" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
                    Invite Tenant
                  </DialogTitle>
                  <DialogDescription className="text-center mt-2 text-pretty text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-[320px] mx-auto">
                    Generate a unique, secure invite link for your new tenant
                    moving into{" "}
                    <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                      Unit {u.unit_label}
                    </span>
                    .
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="bg-[rgb(var(--ml-bg-primary))]/40">
                <div className="px-6 py-5 border-b border-border/20">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] cursor-pointer hover:border-[rgb(var(--ml-accent))]/40 transition-all group">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={keepData}
                        onChange={(e) => setKeepData(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-[rgb(var(--ml-accent))] focus:ring-[rgb(var(--ml-accent))] cursor-pointer accent-[rgb(var(--ml-accent))]"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                        Retain Previous Data
                      </p>
                      <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))] mt-0.5">
                        Keep the previous tenant's documents and history
                        attached to this unit.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="px-6 py-4 flex gap-3 justify-end items-center">
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetchAPI<{ token: string }>(
                          "/api/v1/landlord/generate-invite",
                          {
                            method: "POST",
                            body: JSON.stringify({
                              unit_id: u.id,
                              clear_data: !keepData,
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
                    className="px-5 py-2.5 text-xs font-bold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent-dark))] rounded-xl transition-all w-full sm:w-auto shadow-sm shadow-[rgba(var(--ml-accent),0.15)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);

  const [unitLabel, setUnitLabel] = useState("");
  const [rentDay, setRentDay] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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
    async function loadProps() {
      try {
        const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
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
  }, []);

  const loadUnits = async () => {
    if (!selectedProperty) return;
    setUnitsLoading(true);
    try {
      const data = await fetchAPI<Unit[]>(
        `/api/v1/landlord/properties/${selectedProperty}/units`,
      );
      setUnits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [selectedProperty]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    setIsSubmitting(true);
    try {
      const newUnit = await fetchAPI<Unit>("/api/v1/landlord/units", {
        method: "POST",
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_label: unitLabel,
          rent_due_day: parseInt(rentDay),
        }),
      });
      setUnits((prev) => [...prev, newUnit]);
      setUnitLabel("");
      setRentDay("1");
      setShowAddForm(false);
      toast.success("Unit created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create unit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "Property";

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchesSearch = u.unit_label
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedFilter === "OCCUPIED") return u.is_occupied;
      if (selectedFilter === "VACANT") return !u.is_occupied;
      return true;
    });
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
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              Property Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Units
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
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
                <div className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border border-border/60 rounded-xl h-11 flex items-center px-3">
                  <div className="skeleton h-4 w-32 rounded-md" />
                </div>
              ) : properties.length > 0 ? (
                <Select
                  value={selectedProperty}
                  onValueChange={(val) => setSelectedProperty(val as string)}
                >
                  <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border-border/60 rounded-xl h-11">
                    <span className="flex items-center gap-2 font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                      <Building2 className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
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

            {/* Toggle Add Unit Form Button */}
            {properties.length > 0 && (
              <Button
                onClick={() => setShowAddForm((prev) => !prev)}
                className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
              >
                {showAddForm ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{showAddForm ? "Hide Form" : "Add Unit"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        {properties.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {(["ALL", "OCCUPIED", "VACANT"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === filter
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-transparent shadow-sm"
                      : "bg-[rgb(var(--ml-bg-primary))]/50 text-[rgb(var(--ml-text-secondary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/30 hover:text-[rgb(var(--ml-text-primary))]"
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
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
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

          {/* Add Unit Form (Collapsible with smooth Motion reveal) */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleCreate}
                  className="p-6 sm:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-border rounded-3xl space-y-5 shadow-md mb-8"
                >
                  <div>
                    <h2 className="text-lg font-black text-[rgb(var(--ml-text-primary))] tracking-tight flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                      Add New Unit
                    </h2>
                    <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">
                      Define a unit identifier and select the monthly rent due
                      day for{" "}
                      <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                        {selectedPropertyName}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
                        Unit Label / Name
                      </label>
                      <input
                        required
                        value={unitLabel}
                        onChange={(e) => setUnitLabel(e.target.value)}
                        placeholder="e.g. Apt 101, Penthouse, Unit B"
                        className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
                        Monthly Rent Due Day
                      </label>
                      <Select
                        value={rentDay}
                        onValueChange={(val) => setRentDay(val || "1")}
                      >
                        <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11 text-xs font-medium">
                          <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                        <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-60 overflow-y-auto">
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
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-border/30">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2 text-xs font-bold border-border/40 rounded-xl hover:bg-[rgb(var(--ml-bg-primary))]"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isSubmitting}
                      type="submit"
                      className="px-6 py-2 text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent-dark))] rounded-xl transition-all shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? "Creating Unit..." : "Save Unit"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

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
                    : "Get started by adding your first unit to this property above."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 text-xs font-bold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent-dark))] rounded-xl px-4 py-2"
                  >
                    Add Unit Now
                  </Button>
                )}
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
                  className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
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
                  className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
