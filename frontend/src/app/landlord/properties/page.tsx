"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  Building2,
  MapPin,
  Plus,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { PropertyCard, Property } from "@/components/landlord/properties/PropertyCard";
import { CreatePropertyForm } from "@/components/landlord/properties/CreatePropertyForm";

export default function LandlordPropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
          Loading...
        </div>
      }
    >
      <LandlordPropertiesContent />
    </Suspense>
  );
}

function LandlordPropertiesContent() {
  const { isLoaded, getToken } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState("ALL");
  const [totalUnitsCount, setTotalUnitsCount] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPropertiesData = useCallback(
    async (signal: AbortSignal): Promise<Property[]> => {
      const token = await getToken();
      const props = await fetchAPI<Property[]>("/api/v1/landlord/properties", { signal }, token);
      return Array.isArray(props) ? props : [];
    },
    [getToken]
  );

  const { data, isLoading: loading, error, refetch } = useApiQuery<Property[]>(
    isLoaded ? fetchPropertiesData : null,
    [isLoaded, fetchPropertiesData]
  );

  const properties = useMemo(() => data || [], [data]);

  // Load total units count across all properties
  useEffect(() => {
    if (!isLoaded || properties.length === 0) {
      if (!loading && properties.length === 0) setTotalUnitsCount(0);
      return;
    }

    let isMounted = true;
    async function loadAllUnitsCount() {
      try {
        const token = await getToken();
        const results = await Promise.allSettled(
          properties.map((p) =>
            fetchAPI<{ id: string }[]>(`/api/v1/landlord/properties/${p.id}/units`, {}, token)
          )
        );
        if (isMounted) {
          let count = 0;
          results.forEach((res) => {
            if (res.status === "fulfilled" && Array.isArray(res.value)) {
              count += res.value.length;
            }
          });
          setTotalUnitsCount(count);
        }
      } catch {
        if (isMounted) setTotalUnitsCount(0);
      }
    }

    loadAllUnitsCount();
    return () => {
      isMounted = false;
    };
  }, [properties, isLoaded, getToken, loading]);

  const uniqueCities = useMemo(() => {
    const map = new Map<string, string>();
    properties.forEach((p) => {
      if (p.city && p.city.trim()) {
        const normalized = p.city.trim().toLowerCase();
        if (!map.has(normalized)) {
          map.set(normalized, p.city.trim());
        }
      }
    });
    return Array.from(map.entries()).map(([key, displayName]) => ({
      key,
      displayName,
    }));
  }, [properties]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCityFilter, searchQuery]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCityFilter !== "ALL") {
        if (!p.city || p.city.trim().toLowerCase() !== selectedCityFilter.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [properties, searchQuery, selectedCityFilter]);

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE) || 1;

  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProperties, currentPage]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
              Real Estate Asset Registry
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Properties
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                {loading ? (
                  <span className="skeleton h-3 w-4 rounded-full inline-block" />
                ) : (
                  properties.length
                )}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Manage your real estate portfolio, configure building details, and organize property units.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              href="/landlord/access-requests"
              className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-primary))] font-bold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98]"
            >
              <Users className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
              <span>Access Requests</span>
            </Link>
            <Button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:border-transparent hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddForm ? "Hide Form" : "Add Property"}</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        {properties.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex-1 sm:w-48 sm:flex-initial">
              <Select
                value={selectedCityFilter}
                onValueChange={(val) => setSelectedCityFilter(val as string)}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-[rgb(var(--ml-bg-secondary))] border-border/60 rounded-xl h-[38px] text-xs font-semibold capitalize">
                  <SelectValue placeholder="Filter by City">
                    {selectedCityFilter === "ALL"
                      ? `All Cities (${properties.length})`
                      : (uniqueCities.find((c) => c.key === selectedCityFilter)?.displayName || selectedCityFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-60 overflow-y-auto">
                  <SelectItem value="ALL" className="font-semibold text-xs cursor-pointer">
                    All Cities ({properties.length})
                  </SelectItem>
                  {uniqueCities.map((cityObj) => {
                    const count = properties.filter(
                      (p) => p.city && p.city.trim().toLowerCase() === cityObj.key
                    ).length;
                    return (
                      <SelectItem
                        key={cityObj.key}
                        value={cityObj.key}
                        className="font-semibold text-xs cursor-pointer"
                      >
                        {cityObj.displayName} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search property or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={refetch} />}
      </div>

      {/* Metrics Bar */}
      {!loading && properties.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Total Properties
              </p>
              <p className="text-xl font-black text-[rgb(var(--ml-text-primary))] mt-0.5">
                {properties.length}
              </p>
            </div>
            <Building2 className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
          </div>
          <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Cities Covered
              </p>
              <p className="text-xl font-black text-[rgb(var(--ml-text-primary))] mt-0.5">
                {uniqueCities.length}
              </p>
            </div>
            <MapPin className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
          </div>
          <div className="p-4 rounded-2xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Total Units
              </p>
              <p className="text-xl font-black text-[rgb(var(--ml-text-primary))] mt-0.5">
                {totalUnitsCount === null ? (
                  <span className="skeleton h-5 w-8 rounded-md inline-block" />
                ) : (
                  totalUnitsCount
                )}
              </p>
            </div>
            <Home className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
          </div>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <CreatePropertyForm
              onSuccess={() => {
                setShowAddForm(false);
                refetch();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Cards Grid */}
      <div className="space-y-4">
        {properties.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Properties ({filteredProperties.length})
            </h2>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="wait">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={`skel-${i}`}
                  className="p-6 border border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between min-h-[260px] space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="skeleton w-12 h-12 rounded-2xl" />
                    <div className="skeleton w-16 h-5 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="skeleton w-3/4 h-6 rounded-lg" />
                    <div className="skeleton w-1/2 h-4 rounded-md" />
                  </div>
                  <div className="skeleton w-full h-8 rounded-xl" />
                </div>
              ))
            ) : properties.length === 0 && !error ? (
              <div className="col-span-full text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                    No properties added yet
                  </h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                    Add your first property to start managing units, leases, and tenant communications.
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-5 py-2 cursor-pointer inline-flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Property</span>
                </Button>
              </div>
            ) : filteredProperties.length === 0 && !error ? (
              <div className="col-span-full text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3">
                <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                  No properties found
                </p>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Try adjusting your search or city filter.
                </p>
              </div>
            ) : (
              paginatedProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  p={p}
                  onUpdate={refetch}
                  onDelete={refetch}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredProperties.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40">
            <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
              Showing{" "}
              <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>
              –
              <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProperties.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                {filteredProperties.length}
              </span>{" "}
              properties
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
      </div>
    </div>
  );
}
