"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  Wrench,
  Search,
  Building,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useAuth } from "@clerk/nextjs";
import { RequestCard, MaintenanceRequest } from "@/components/landlord/requests/RequestCard";

export type Property = { id: string; name: string };
export type Unit = { id: string; unit_label: string };

interface LandlordRequestsData {
  properties: Property[];
  requests: MaintenanceRequest[];
}

export default function LandlordMaintenancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
          Loading...
        </div>
      }
    >
      <LandlordMaintenanceContent />
    </Suspense>
  );
}

function LandlordMaintenanceContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const router = useRouter();
  const { isLoaded, getToken } = useAuth();

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    "ALL" | "ACTIVE" | "RESOLVED" | "URGENT"
  >("ACTIVE");

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRequestsData = useCallback(
    async (signal: AbortSignal): Promise<LandlordRequestsData> => {
      const token = await getToken();
      const [props, reqs] = await Promise.all([
        fetchAPI<Property[]>("/api/v1/landlord/properties", { signal }, token),
        fetchAPI<MaintenanceRequest[]>("/api/v1/landlord/maintenance", { signal }, token),
      ]);
      return {
        properties: Array.isArray(props) ? props : [],
        requests: Array.isArray(reqs) ? reqs : [],
      };
    },
    [getToken]
  );

  const { data, isLoading: loading, error, refetch } = useApiQuery<LandlordRequestsData>(
    isLoaded ? fetchRequestsData : null,
    [isLoaded, fetchRequestsData]
  );

  const properties = useMemo(() => data?.properties || [], [data]);
  const requests = useMemo(() => data?.requests || [], [data]);

  // Set initial selected property
  useEffect(() => {
    if (properties.length > 0) {
      setSelectedProperty((prev) =>
        properties.some((p) => p.id === prev) ? prev : properties[0].id
      );
    } else {
      setSelectedProperty("");
    }
  }, [properties]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProperty, selectedStatusFilter, searchQuery]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        if (selectedProperty && req.property_name) {
          const matchedProp = properties.find((p) => p.id === selectedProperty);
          if (matchedProp && req.property_name !== matchedProp.name) {
            return false;
          }
        }

        if (idParam && req.id !== idParam) {
          return false;
        }

        const query = searchQuery.toLowerCase();
        const matchesSearch =
          req.title.toLowerCase().includes(query) ||
          req.description.toLowerCase().includes(query) ||
          (req.unit_label && req.unit_label.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        if (selectedStatusFilter === "ACTIVE") {
          return req.status === "open" || req.status === "in_progress";
        }
        if (selectedStatusFilter === "RESOLVED") {
          return req.status === "resolved" || req.status === "closed";
        }
        if (selectedStatusFilter === "URGENT") {
          return req.priority === "urgent" || req.priority === "high";
        }
        return true;
      })
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        const pDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
        if (pDiff !== 0) return pDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [requests, searchQuery, selectedStatusFilter, idParam, selectedProperty, properties]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE) || 1;

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "All Properties";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
              Maintenance Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Service Requests
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                {requests.length}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Track, prioritize, and resolve maintenance issues across your rental portfolio.
            </p>
          </div>

          {/* Property Switcher */}
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

            <button
              type="button"
              onClick={refetch}
              className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] border border-border/60 text-[rgb(var(--ml-text-primary))] font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
            {(["ACTIVE", "ALL", "URGENT", "RESOLVED"] as const).map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() => setSelectedStatusFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                  selectedStatusFilter === filter
                    ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                    : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                }`}
              >
                {filter === "ACTIVE" && "Active Cases"}
                {filter === "ALL" && "All Requests"}
                {filter === "URGENT" && "Urgent / High"}
                {filter === "RESOLVED" && "Resolved"}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
            <input
              type="text"
              placeholder="Search by title, desc, unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
            />
          </div>
        </div>

        {idParam && (
          <div className="mt-4 flex items-center bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold px-4 py-2 rounded-xl">
            <span>Showing a specific maintenance case.</span>
            <button
              type="button"
              onClick={() => router.replace("/landlord/requests")}
              className="ml-auto underline decoration-blue-500/30 hover:decoration-blue-500 underline-offset-2"
            >
              Clear Filter
            </button>
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={refetch} />}
      </div>

      {!loading && properties.length === 0 && !error ? (
        <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-3">
          <Building className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No Properties Found</h3>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
            Add a property first to receive and manage maintenance requests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Request Feed ({filteredRequests.length})
            </h2>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={`skel-${i}`}
                    className="p-6 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="skeleton h-6 w-48 rounded-md" />
                      <div className="skeleton h-4 w-20 rounded-md" />
                    </div>
                    <div className="skeleton h-4 w-3/4 rounded-md" />
                  </div>
                ))
              ) : requests.length === 0 && !error ? (
                <motion.div
                  key="empty-all"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                    <Wrench className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                      All caught up! No requests
                    </h3>
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                      When your tenants submit service requests, they will appear here.
                    </p>
                  </div>
                </motion.div>
              ) : filteredRequests.length === 0 && !error ? (
                <motion.div
                  key="empty-search"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3"
                >
                  <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                  <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                    No requests match your filter
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Try changing your filter or search terms.
                  </p>
                </motion.div>
              ) : (
                paginatedRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onUpdate={refetch}
                    defaultExpanded={req.id === idParam}
                    isHighlighted={req.id === idParam}
                  />
                ))
              )}
            </AnimatePresence>

            {/* Pagination Controls */}
            {!loading && filteredRequests.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40">
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                  Showing{" "}
                  <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>
                  –
                  <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                    {filteredRequests.length}
                  </span>{" "}
                  requests
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
      )}
    </div>
  );
}
