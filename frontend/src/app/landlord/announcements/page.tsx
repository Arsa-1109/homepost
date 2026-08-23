"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LightboxModal } from "@/components/LightboxModal";
import { motion, AnimatePresence } from "motion/react";
import {
  Megaphone,
  Search,
  Plus,
  Building,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { AnnouncementCard, Announcement } from "@/components/landlord/announcements/AnnouncementCard";
import { CreateAnnouncementForm } from "@/components/landlord/announcements/CreateAnnouncementForm";
import { EditAnnouncementDialog } from "@/components/landlord/announcements/EditAnnouncementDialog";
import { DeleteAnnouncementDialog } from "@/components/landlord/announcements/DeleteAnnouncementDialog";

type Property = { id: string; name: string };
type Unit = { id: string; unit_label: string };

interface AnnouncementsData {
  properties: Property[];
  announcements: Announcement[];
}

export default function LandlordAnnouncementsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
          Loading...
        </div>
      }
    >
      <LandlordAnnouncementsContent />
    </Suspense>
  );
}

function LandlordAnnouncementsContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const router = useRouter();
  const { isLoaded, getToken } = useAuth();

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit & Delete State
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "RECENT" | "PROPERTY" | "UNIT">("ALL");

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAnnouncementsData = useCallback(
    async (signal: AbortSignal): Promise<AnnouncementsData> => {
      const token = await getToken();
      const [propsRes, annsRes] = await Promise.all([
        fetchAPI<{ items?: Property[] } | Property[]>("/api/v1/landlord/properties", { signal }, token),
        fetchAPI<{ items?: Announcement[] } | Announcement[]>("/api/v1/landlord/announcements", { signal }, token),
      ]);
      const properties = Array.isArray(propsRes) ? propsRes : (propsRes && Array.isArray(propsRes.items) ? propsRes.items : []);
      const announcements = Array.isArray(annsRes) ? annsRes : (annsRes && Array.isArray(annsRes.items) ? annsRes.items : []);
      return { properties, announcements };
    },
    [getToken]
  );

  const { data, isLoading: loading, error, refetch } = useApiQuery<AnnouncementsData>(
    isLoaded ? fetchAnnouncementsData : null,
    [isLoaded, fetchAnnouncementsData]
  );

  const properties = useMemo(() => data?.properties || [], [data]);
  const announcements = useMemo(() => data?.announcements || [], [data]);

  // Set initial selectedProperty when properties load
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
  }, [selectedProperty, selectedFilter, searchQuery]);

  // Load units for selected property
  useEffect(() => {
    if (!isLoaded || !selectedProperty) return;
    let isCancelled = false;

    async function loadUnits() {
      try {
        const token = await getToken();
        const unitData = await fetchAPI<Unit[]>(
          `/api/v1/landlord/properties/${selectedProperty}/units`,
          {},
          token
        );
        if (!isCancelled) {
          const sorted = (unitData || []).slice().sort((a, b) =>
            (a.unit_label || "").localeCompare(b.unit_label || "", undefined, {
              numeric: true,
              sensitivity: "base",
            })
          );
          setUnits(sorted);
        }
      } catch (err) {
        console.error("Failed to load units for property:", err);
      }
    }

    loadUnits();
    return () => {
      isCancelled = true;
    };
  }, [selectedProperty, isLoaded, getToken]);

  const [nowTimestamp, setNowTimestamp] = useState<number>(0);
  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((ann) => {
        if (selectedProperty && ann.property_id !== selectedProperty) {
          return false;
        }
        if (idParam && ann.id !== idParam) {
          return false;
        }

        const query = searchQuery.toLowerCase();
        const matchesSearch =
          ann.title.toLowerCase().includes(query) ||
          ann.body.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        if (selectedFilter === "RECENT") {
          const sevenDaysAgo = nowTimestamp - 7 * 24 * 60 * 60 * 1000;
          return new Date(ann.created_at).getTime() >= sevenDaysAgo;
        }
        if (selectedFilter === "PROPERTY") {
          return !ann.unit_id;
        }
        if (selectedFilter === "UNIT") {
          return !!ann.unit_id;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [announcements, searchQuery, selectedFilter, nowTimestamp, idParam, selectedProperty]);

  const totalPages = Math.ceil(filteredAnnouncements.length / ITEMS_PER_PAGE) || 1;

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAnnouncements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAnnouncements, currentPage]);

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "Property";

  const getUnitLabel = (unitId: string | null | undefined) => {
    if (!unitId) return "Property-Wide";
    const unit = units.find((u) => u.id === unitId);
    return unit ? `Unit ${unit.unit_label}` : "Unit Specific";
  };

  return (
    <>
      <AnimatePresence>
        {previewUrl && (
          <LightboxModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                Tenant Communications
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
                Announcements
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                  {announcements.length}
                </span>
              </h1>
              <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Broadcast notices, policy updates, and maintenance reminders to tenants.
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

              <Button
                onClick={() => setShowUploadForm((prev) => !prev)}
                className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:border-transparent hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]"
              >
                {showUploadForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{showUploadForm ? "Hide Form" : "Post Announcement"}</span>
              </Button>
            </div>
          </div>

          {/* Search & Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
              {(["ALL", "RECENT", "PROPERTY", "UNIT"] as const).map((filter) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === filter
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                      : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  {filter === "ALL" && "All Notices"}
                  {filter === "RECENT" && "Last 7 Days"}
                  {filter === "PROPERTY" && "Property-Wide"}
                  {filter === "UNIT" && "Unit-Specific"}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>

          {idParam && (
            <div className="mt-4 flex items-center bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold px-4 py-2 rounded-xl">
              <span>Showing a specific announcement.</span>
              <button
                type="button"
                onClick={() => router.replace("/landlord/announcements")}
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
              Please add a property first before posting announcements.
            </p>
          </div>
        ) : (
          <>
            {/* Post Form (Collapsible) */}
            <AnimatePresence>
              {showUploadForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <CreateAnnouncementForm
                    properties={properties}
                    selectedProperty={selectedProperty}
                    onPropertyChange={setSelectedProperty}
                    units={units}
                    onSuccess={() => {
                      setShowUploadForm(false);
                      refetch();
                    }}
                    onCancel={() => setShowUploadForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Announcements List */}
            <div className="space-y-4">
              {announcements.length > 0 && (
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                    Notice Feed ({filteredAnnouncements.length})
                  </h2>
                </div>
              )}

              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={`skel-${i}`}
                        className="p-6 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-3 relative"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="skeleton h-5 w-24 rounded-md" />
                            <div className="skeleton h-5 w-20 rounded-md" />
                          </div>
                          <div className="skeleton h-4 w-16 rounded-md" />
                        </div>
                        <div className="space-y-2 pt-1">
                          <div className="skeleton h-6 w-3/4 rounded-lg" />
                          <div className="skeleton h-4 w-full rounded-md mt-2" />
                          <div className="skeleton h-4 w-5/6 rounded-md" />
                        </div>
                      </div>
                    ))
                  ) : announcements.length === 0 && !error ? (
                    <motion.div
                      key="empty-all"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                        <Megaphone className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No announcements yet</h3>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                          Keep your tenants informed with property updates, maintenance notices, and important reminders.
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowUploadForm(true)}
                        className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-5 py-2 cursor-pointer inline-flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Post announcement</span>
                      </Button>
                    </motion.div>
                  ) : filteredAnnouncements.length === 0 && !error ? (
                    <motion.div
                      key="empty-search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3"
                    >
                      <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                      <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">No announcements found</p>
                      <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Try a different search or filter.</p>
                    </motion.div>
                  ) : (
                    paginatedAnnouncements.map((ann) => {
                      const propertyName =
                        properties.find((p) => p.id === ann.property_id)?.name || "Property";
                      const unitLabel = getUnitLabel(ann.unit_id);

                      return (
                        <AnnouncementCard
                          key={ann.id}
                          announcement={ann}
                          propertyName={propertyName}
                          unitLabel={unitLabel}
                          onEdit={setEditingAnnouncement}
                          onDelete={setDeletingAnnouncement}
                          onViewImage={setPreviewUrl}
                        />
                      );
                    })
                  )}
                </AnimatePresence>

                {/* Pagination Controls */}
                {!loading && filteredAnnouncements.length > 0 && (
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
                          filteredAnnouncements.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                        {filteredAnnouncements.length}
                      </span>{" "}
                      announcements
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
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <EditAnnouncementDialog
        announcement={editingAnnouncement}
        properties={properties}
        units={units}
        onClose={() => setEditingAnnouncement(null)}
        onSuccess={refetch}
      />

      {/* Delete Dialog */}
      <DeleteAnnouncementDialog
        announcement={deletingAnnouncement}
        onClose={() => setDeletingAnnouncement(null)}
        onSuccess={refetch}
      />
    </>
  );
}
