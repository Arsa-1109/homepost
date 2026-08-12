"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Building2,
  MapPin,
  Plus,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
};

export type PropertyUnitSummary = {
  totalUnits: number;
  occupiedUnits: number;
};

function PropertyCard({ p }: { p: Property }) {
  const [unitSummary, setUnitSummary] = useState<PropertyUnitSummary | null>(
    null,
  );
  const [loadingUnits, setLoadingUnits] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadUnitSummary() {
      try {
        const units = await fetchAPI<{ id: string; is_occupied: boolean }[]>(
          `/api/v1/landlord/properties/${p.id}/units`,
        );
        if (isMounted) {
          const total = units.length;
          const occupied = units.filter((u) => u.is_occupied).length;
          setUnitSummary({ totalUnits: total, occupiedUnits: occupied });
        }
      } catch (err) {
        if (isMounted) {
          setUnitSummary({ totalUnits: 0, occupiedUnits: 0 });
        }
      } finally {
        if (isMounted) {
          setLoadingUnits(false);
        }
      }
    }
    loadUnitSummary();
    return () => {
      isMounted = false;
    };
  }, [p.id]);

  return (
    <div className="p-6 border border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between hover:border-[rgb(var(--ml-accent))]/40 transition-all duration-300 group/card min-h-[250px] shadow-sm relative overflow-hidden">
      {/* Ambient background glow on hover */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-[rgb(var(--ml-accent))]/5 rounded-full blur-2xl group-hover/card:bg-[rgb(var(--ml-accent))]/15 transition-all duration-500 pointer-events-none" />

      <div>
        {/* Top Row: Property Icon & City Badge */}
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
            <Building2 className="w-6 h-6" />
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border bg-[rgb(var(--ml-bg-primary))]/80 text-[rgb(var(--ml-text-secondary))] border-border/60"
          >
            {p.city}
          </Badge>
        </div>

        {/* Property Name & Address */}
        <div className="space-y-1.5">
          <h3
            className="font-black text-xl tracking-tight text-[rgb(var(--ml-text-primary))] group-hover/card:text-[rgb(var(--ml-accent))] transition-colors truncate"
            title={p.name}
          >
            {p.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            <MapPin className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))] shrink-0" />
            <span className="truncate">{p.address}</span>
          </div>
        </div>

        {/* Units Stats Pill */}
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            <Home className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))]" />
            <span>
              {loadingUnits ? (
                <span className="skeleton h-3 w-16 rounded inline-block" />
              ) : (
                `${unitSummary?.totalUnits || 0} ${unitSummary?.totalUnits === 1 ? "Unit" : "Units"}`
              )}
            </span>
          </div>
          {!loadingUnits && unitSummary && unitSummary.totalUnits > 0 && (
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                unitSummary.occupiedUnits === unitSummary.totalUnits
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}
            >
              {unitSummary.occupiedUnits}/{unitSummary.totalUnits} Occupied
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Quick Actions */}
      <div className="mt-6 pt-4 border-t border-border/40 grid grid-cols-2 gap-2">
        <Link
          href={`/landlord/units?property_id=${p.id}`}
          className="text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 hover:bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-text-primary))]/30 px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group/btn"
        >
          <Home className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
          <span>Units</span>
        </Link>
        <Link
          href={`/landlord/documents?property_id=${p.id}`}
          className="text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 hover:bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-text-primary))]/30 px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group/btn"
        >
          <FileText className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
          <span>Docs</span>
        </Link>
      </div>
    </div>
  );
}

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("ALL");

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  async function loadData() {
    try {
      const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
      setProperties(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchAPI("/api/v1/landlord/properties", {
        method: "POST",
        body: JSON.stringify({ name, address, city }),
      });
      setName("");
      setAddress("");
      setCity("");
      setShowAddForm(false);
      toast.success("Property created successfully!");
      loadData();
    } catch (err) {
      toast.error("Failed to create property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unique list of cities for filtering
  const uniqueCities = useMemo(() => {
    const cities = properties.map((p) => p.city).filter(Boolean);
    return Array.from(new Set(cities));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCityFilter !== "ALL" && p.city !== selectedCityFilter)
        return false;
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
      {/* Header Hero Section */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              Building Catalog
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Properties
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                {loading ? (
                  <span className="skeleton h-3 w-4 rounded-full inline-block" />
                ) : (
                  properties.length
                )}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Manage your real estate portfolio, configure building details, and
              organize property units.
            </p>
          </div>

          {/* Action Button: Toggle Add Form */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              {showAddForm ? (
                <X className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{showAddForm ? "Hide Form" : "Add Property"}</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        {properties.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
            {/* City Filter Dropdown */}
            <div className="flex-1 sm:w-48 sm:flex-initial">
              <Select
                value={selectedCityFilter}
                onValueChange={(val) => setSelectedCityFilter(val as string)}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-[38px] text-xs font-semibold">
                  <SelectValue placeholder="Filter by City" />
                </SelectTrigger>
                <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-60 overflow-y-auto">
                  <SelectItem
                    value="ALL"
                    className="font-semibold text-xs cursor-pointer"
                  >
                    All Cities ({properties.length})
                  </SelectItem>
                  {uniqueCities.map((cityName) => {
                    const count = properties.filter(
                      (p) => p.city === cityName,
                    ).length;
                    return (
                      <SelectItem
                        key={cityName}
                        value={cityName}
                        className="font-semibold text-xs cursor-pointer"
                      >
                        {cityName} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search property or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Metrics Bar */}
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
                Active Catalog
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                Operational
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      )}

      {/* Add Property Form (Collapsible with smooth Motion reveal) */}
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
                  Add New Property
                </h2>
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">
                  Enter the details of your new building to start managing its
                  units and documents.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
                    Property Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sunset Apartments"
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
                    Street Address
                  </label>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main St"
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
                    City
                  </label>
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
                  />
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
                  {isSubmitting ? "Creating..." : "Save Property"}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Cards Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
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
                className="h-60 w-full bg-[rgb(var(--ml-bg-secondary))]/40 border border-border/30 rounded-3xl p-6 flex flex-col justify-between animate-pulse"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--ml-border))]/40"></div>
                    <div className="h-5 w-16 bg-[rgb(var(--ml-border))]/40 rounded-full"></div>
                  </div>
                  <div className="h-6 w-36 bg-[rgb(var(--ml-border))]/40 rounded-lg mt-4"></div>
                  <div className="h-4 w-48 bg-[rgb(var(--ml-border))]/30 rounded-md mt-2"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-border/20">
                  <div className="h-9 w-full bg-[rgb(var(--ml-border))]/30 rounded-xl"></div>
                  <div className="h-9 w-full bg-[rgb(var(--ml-border))]/30 rounded-xl"></div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredProperties.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 px-6 border border-dashed border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))]/30 space-y-3 max-w-md mx-auto"
          >
            <Building2 className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
              {searchQuery || selectedCityFilter !== "ALL"
                ? "No matching properties"
                : "No Properties Added"}
            </h3>
            <p className="text-xs text-[rgb(var(--ml-text-secondary))] max-w-sm mx-auto">
              {searchQuery || selectedCityFilter !== "ALL"
                ? "Try adjusting your search query or city filter."
                : "You haven't added any properties to your portfolio yet. Add your first building above."}
            </p>
            {!searchQuery && selectedCityFilter === "ALL" && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-xs font-bold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent-dark))] rounded-xl px-4 py-2"
              >
                Add Property Now
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
            {paginatedProperties.map((p) => (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <PropertyCard p={p} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls Bar */}
      {!loading && filteredProperties.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40">
          <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            Showing{" "}
            <span className="font-bold text-[rgb(var(--ml-text-primary))]">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>
            –
            <span className="font-bold text-[rgb(var(--ml-text-primary))]">
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredProperties.length,
              )}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[rgb(var(--ml-text-primary))]">
              {filteredProperties.length}
            </span>{" "}
            properties
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
