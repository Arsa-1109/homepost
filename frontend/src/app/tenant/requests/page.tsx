"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { ErrorBanner } from "@/components/ErrorBanner";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  Search,
  Plus,
} from "lucide-react";
import { LightboxModal } from "@/components/LightboxModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { TenantRequestCard, MaintenanceRequest } from "@/components/tenant/requests/TenantRequestCard";
import { ReopenModal } from "@/components/tenant/requests/ReopenModal";

interface ProfileData {
  is_active: boolean;
  unit_id?: string | null;
}

interface TenantRequestsData {
  profile: ProfileData | null;
  requests: MaintenanceRequest[];
}

export default function TenantRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-[rgb(var(--ml-text-secondary))] animate-pulse">
          Loading requests...
        </div>
      }
    >
      <TenantRequestsContent />
    </Suspense>
  );
}

function TenantRequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetRequestId = searchParams.get("id");
  const { isLoaded, getToken } = useAuth();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmReopen, setConfirmReopen] = useState<{ id: string } | null>(null);
  const [confirmClose, setConfirmClose] = useState<{ id: string } | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "open" | "in_progress" | "resolved" | "closed"
  >("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchTenantRequests = useCallback(
    async (signal: AbortSignal): Promise<TenantRequestsData> => {
      const token = await getToken();
      const [profileData, requestsData] = await Promise.all([
        fetchAPI<ProfileData>("/api/v1/tenant/profile", { signal }, token).catch(() => null),
        fetchAPI<MaintenanceRequest[]>("/api/v1/tenant/maintenance", { signal }, token),
      ]);
      return {
        profile: profileData,
        requests: Array.isArray(requestsData) ? requestsData : [],
      };
    },
    [getToken]
  );

  const { data, isLoading: loading, error, refetch } = useApiQuery<TenantRequestsData>(
    isLoaded ? fetchTenantRequests : null,
    [isLoaded, fetchTenantRequests]
  );

  const profile = data?.profile ?? null;
  const requests = useMemo(() => data?.requests ?? [], [data]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (selectedFilter !== "ALL" && r.status !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, selectedFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));

  // Deep linking and URL navigation handler
  useEffect(() => {
    if (!loading && targetRequestId && requests.length > 0) {
      const index = filteredRequests.findIndex((r) => r.id === targetRequestId);
      if (index !== -1) {
        const page = Math.floor(index / pageSize) + 1;
        setCurrentPage(page);
        setExpandedId(targetRequestId);
        setHighlightedId(targetRequestId);

        const scrollTimer = setTimeout(() => {
          const el = document.getElementById(`request-${targetRequestId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);

        const highlightTimer = setTimeout(() => {
          setHighlightedId(null);
        }, 3000);

        return () => {
          clearTimeout(scrollTimer);
          clearTimeout(highlightTimer);
        };
      }
    }
  }, [loading, targetRequestId, requests, filteredRequests, pageSize]);

  const handleFilterChange = (filter: "ALL" | "open" | "in_progress" | "resolved" | "closed") => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleReopen = (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmReopen({ id: requestId });
  };

  const handleCloseRequest = (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmClose({ id: requestId });
  };

  const executeCloseRequest = async (requestId: string) => {
    setClosingId(requestId);
    try {
      await fetchAPI<MaintenanceRequest>(
        `/api/v1/tenant/maintenance/${requestId}/close`,
        { method: "POST" }
      );
      toast.success("Maintenance request closed successfully.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to close request.");
    } finally {
      setClosingId(null);
    }
  };

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  return (
    <>
      <AnimatePresence>
        {previewUrl && (
          <LightboxModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      <ReopenModal
        open={!!confirmReopen}
        requestId={confirmReopen?.id || null}
        onClose={() => setConfirmReopen(null)}
        onSuccess={() => {
          refetch();
        }}
      />

      <ConfirmDialog
        open={!!confirmClose}
        title="Close Maintenance Request"
        description="Are you sure you want to mark this request as closed? This confirms that your maintenance issue has been resolved to your satisfaction."
        confirmLabel="Yes, Close Request"
        cancelLabel="Cancel"
        variant="info"
        onCancel={() => setConfirmClose(null)}
        onConfirm={() => {
          if (confirmClose) {
            const reqId = confirmClose.id;
            setConfirmClose(null);
            executeCloseRequest(reqId);
          }
        }}
      />

      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                Maintenance & Repairs
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
                Maintenance Requests
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border flex items-center justify-center min-w-[28px] min-h-[24px]">
                  {loading ? (
                    <span className="skeleton h-3 w-4 rounded-full inline-block" />
                  ) : (
                    requests.length
                  )}
                </span>
              </h1>
              <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Track repair progress, view landlord updates, and submit new requests.
              </p>
            </div>

            {profile?.is_active && (
              <Link
                href="/tenant/requests/new"
                className="bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold px-6 h-11 rounded-xl hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:border-transparent hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)] transition-all duration-200 ease-out shadow-sm flex items-center justify-center gap-2 text-xs shrink-0 cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                New Request
              </Link>
            )}
          </div>

          {/* Filter & Search Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Requests" },
                { id: "open", label: "Open" },
                { id: "in_progress", label: "In Progress" },
                { id: "resolved", label: "Resolved" },
                { id: "closed", label: "Closed" },
              ].map((filter) => (
                <button
                  type="button"
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === filter.id
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                      : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>

          {error && <ErrorBanner message={error} onRetry={refetch} />}
        </div>

        <div id="request-feed-top" className="space-y-4">
          {requests.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Request Feed ({filteredRequests.length})
              </h2>
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="space-y-4"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl skeleton shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-44 sm:w-56 rounded-lg skeleton" />
                          <div className="h-5 w-20 rounded-full skeleton" />
                        </div>
                        <div className="h-4 w-36 rounded-md skeleton" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : requests.length === 0 && !error ? (
              <motion.div
                key="empty-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                  <Wrench className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                    No maintenance requests
                  </h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                    Submit a request whenever something in your unit needs maintenance or repair.
                  </p>
                </div>
              </motion.div>
            ) : filteredRequests.length === 0 && !error ? (
              <motion.div
                key="empty-search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3"
              >
                <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                  No matching requests
                </p>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Try adjusting your search or filter.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`content-page-${currentPage}`}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 },
                  },
                }}
                className="space-y-4"
              >
                {paginatedRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <TenantRequestCard
                      req={req}
                      isExpanded={expandedId === req.id}
                      onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      onReopen={handleReopen}
                      onCloseRequest={handleCloseRequest}
                      isClosing={closingId === req.id}
                      onViewImage={setPreviewUrl}
                      isHighlighted={highlightedId === req.id}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filteredRequests.length > 0 && !loading && (
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </>
  );
}
