"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import { errorMessage } from "@/lib/errors";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  DoorOpen,
  Search,
  Home,
  UserCheck,
  UserX,
  Sparkles,
  Building2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { shouldShowEmpty } from "@/lib/empty-state";
import { useViewPreference } from "@/hooks/useViewPreference";
import { ViewToggle } from "@/components/shared/ViewToggle";
import { UnitsCompactTable } from "@/components/landlord/units/UnitsCompactTable";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useAuth } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { UnitCard, Unit } from "@/components/landlord/units/UnitCard";
import { CreateUnitModal } from "@/components/landlord/units/CreateUnitModal";

type Property = {
  id: string;
  name: string;
};

export default function LandlordUnitsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
          Loading...
        </div>
      }
    >
      <LandlordUnitsContent />
    </Suspense>
  );
}

function LandlordUnitsContent() {
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("property_id");
  const { isLoaded, getToken } = useAuth();

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "OCCUPIED" | "VACANT">("ALL");

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch properties via useApiQuery
  const fetchPropertiesData = useCallback(
    async (signal: AbortSignal): Promise<Property[]> => {
      const token = await getToken();
      const res = await fetchAPI<{ items?: Property[] } | Property[]>("/api/v1/landlord/properties", { signal }, token);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.items)) return res.items;
      return [];
    },
    [getToken]
  );

  const { data: propertiesData, isLoading: loading, error: propsError, refetch: refetchProps } =
    useApiQuery<Property[]>(isLoaded ? fetchPropertiesData : null, [isLoaded, fetchPropertiesData]);

  const properties = useMemo(() => propertiesData || [], [propertiesData]);

  // Set selected property initially
  useEffect(() => {
    if (properties.length > 0) {
      if (initialPropertyId && properties.some((p) => p.id === initialPropertyId)) {
        setSelectedProperty(initialPropertyId);
      } else {
        setSelectedProperty((prev) =>
          properties.some((p) => p.id === prev) ? prev : properties[0].id
        );
      }
    } else {
      setSelectedProperty("");
      setUnits([]);
    }
  }, [properties, initialPropertyId]);

  // Load units for selected property
  const loadUnits = useCallback(async () => {
    if (!isLoaded || !selectedProperty) {
      // No property selected yet (auth/properties still loading): stay in
      // skeleton state instead of flashing the "no units" empty state.
      setUnits([]);
      setUnitsError(null);
      setUnitsLoading(true);
      return;
    }
    setUnitsLoading(true);
    setUnitsError(null);
    try {
      const token = await getToken();
      const data = await fetchAPI<Unit[]>(
        `/api/v1/landlord/properties/${selectedProperty}/units`,
        {},
        token
      );
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load units for property:", err);
      setUnitsError(errorMessage(err) || "Failed to load property units.");
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, [selectedProperty, isLoaded, getToken]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProperty, selectedFilter, searchQuery]);

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "Property";

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);
  const filteredUnits = useMemo(() => {
    return units
      .filter((u) => {
        const matchesSearch = u.unit_label
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (selectedFilter === "OCCUPIED") return u.is_occupied;
        if (selectedFilter === "VACANT") return !u.is_occupied;
        return true;
      })
      .sort((a, b) =>
        a.unit_label.localeCompare(b.unit_label, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
  }, [units, searchQuery, selectedFilter]);

  const totalPages = Math.ceil(filteredUnits.length / ITEMS_PER_PAGE) || 1;

  const hasActiveFilters = searchQuery.trim() !== "" || selectedFilter !== "ALL";
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedFilter("ALL");
  };

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUnits.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUnits, currentPage]);

  const occupiedCount = useMemo(() => units.filter((u) => u.is_occupied).length, [units]);
  const vacantCount = useMemo(() => units.filter((u) => !u.is_occupied).length, [units]);

  // Persisted Grid / Compact Table preference
  const [viewMode, setViewMode] = useViewPreference("landlord_units_view");

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Section */}
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
              Set up property units, manage occupancy status, and generate secure tenant onboarding invite links.
            </p>
          </div>

          {/* Action & Property Selector Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-56">
              {loading ? (
                <div className="w-full bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl h-11 flex items-center px-3">
                  <div className="skeleton h-4 w-32 rounded-md" />
                </div>
              ) : properties.length > 0 ? (
                <Select value={selectedProperty} onValueChange={(val) => setSelectedProperty(val as string)}>
                  <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-secondary))] border-border/60 rounded-xl h-11">
                    <span className="flex items-center gap-2 font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                      <Building2 className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))]" />
                      {selectedPropertyName}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="font-semibold text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            {properties.length > 0 && (
              <Button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-11 px-5 rounded-xl bg-[rgb(var(--ml-accent))] text-black font-extrabold text-xs flex items-center justify-center gap-2 shrink-0 whitespace-nowrap cursor-pointer shadow-sm hover:bg-[rgb(var(--ml-accent))]/90 transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Unit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        {properties.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
              {(["ALL", "OCCUPIED", "VACANT"] as const).map((filter) => (
                <button
                  type="button"
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

        {propsError && <ErrorBanner message={propsError} onRetry={refetchProps} />}
        {unitsError && <ErrorBanner message={unitsError} onRetry={loadUnits} />}
      </div>

      {!loading && properties.length === 0 && !propsError ? (
        <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-3">
          <Building2 className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No Properties Found</h3>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
            Please add a property first before setting up and managing units.
          </p>
        </div>
      ) : (
        <>
          {/* Metrics Bar */}
          {!unitsLoading && units.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                    Total Units
                  </p>
                  <p className="text-xl font-black text-[rgb(var(--ml-text-primary))] mt-0.5 tabular-nums">
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
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
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
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
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
                  <p className="text-xl font-black text-[rgb(var(--ml-text-primary))] mt-0.5 tabular-nums">
                    {units.length ? Math.round((occupiedCount / units.length) * 100) : 0}%
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
              </div>
            </div>
          )}

          {/* Units Grid */}
          <div className="space-y-4">
            {units.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                  Units in {selectedPropertyName} ({filteredUnits.length})
                </h2>
                <ViewToggle value={viewMode} onChange={setViewMode} />
              </div>
            )}

            {viewMode === "table" && !unitsLoading && filteredUnits.length > 0 ? (
              <UnitsCompactTable units={paginatedUnits} />
            ) : (
              <AnimatePresence mode="wait">
                {unitsLoading ? (
                  <motion.div
                    key="units-skeleton-loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={`skel-${i}`}
                        className="h-60 sm:h-64 w-full bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-3xl p-6 flex flex-col justify-between shadow-sm overflow-hidden"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-3">
                            <div className="skeleton h-6 w-28 rounded-xl" />
                            <div className="skeleton h-6 w-20 rounded-full" />
                          </div>
                          <div className="space-y-2 mt-3.5">
                            <div className="skeleton h-4 w-36 rounded-md" />
                            <div className="skeleton h-4 w-44 rounded-md" />
                          </div>
                        </div>
                        <div className="space-y-2 mt-auto pt-4 border-t border-border/30">
                          <div className="skeleton h-9 w-full rounded-xl" />
                          <div className="skeleton h-9 w-full rounded-xl" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : shouldShowEmpty(unitsLoading, units, Boolean(unitsError)) ? (
                  <motion.div
                    key="empty-units"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-14 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--ml-accent))]/10 border border-[rgb(var(--ml-accent))]/20 flex items-center justify-center mx-auto text-[rgb(var(--ml-accent))]">
                      <DoorOpen className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                        No units in {selectedPropertyName}
                      </h3>
                      <p className="text-xs text-[rgb(var(--ml-text-secondary))] max-w-xs mx-auto">
                        Get started by adding your first unit or generating multiple units in bulk.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="h-10 px-5 rounded-xl bg-[rgb(var(--ml-accent))] text-black font-extrabold text-xs inline-flex items-center gap-2 shadow-sm hover:bg-[rgb(var(--ml-accent))]/90 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add Your First Unit</span>
                    </Button>
                  </motion.div>
                ) : shouldShowEmpty(unitsLoading, filteredUnits, Boolean(unitsError)) ? (
                  <motion.div
                    key="empty-search"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3"
                  >
                    <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                    <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                      No units found
                    </p>
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                      Try adjusting your search or occupancy filter.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[rgb(var(--ml-bg-primary))] border border-border/60 text-[rgb(var(--ml-text-primary))] cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        Reset Filters
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`units-grid-${selectedProperty}-${selectedFilter}-${currentPage}`}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.06 },
                      },
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
                  >
                    {paginatedUnits.map((u) => (
                      <motion.div
                        key={u.id}
                        className="h-full"
                        variants={{
                          hidden: { opacity: 0, y: 14 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.25, ease: "easeOut" },
                          },
                        }}
                      >
                        <UnitCard u={u} onRefresh={loadUnits} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

            {/* Pagination Controls */}
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
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        type="button"
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
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

      {/* Create Unit Modal & Mobile Sheet */}
      <CreateUnitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        selectedProperty={selectedProperty}
        selectedPropertyName={selectedPropertyName}
        existingUnits={units}
        onSuccess={(newUnits) => {
          setUnits((prev) => [...prev, ...newUnits]);
        }}
      />
    </div>
  );
}

