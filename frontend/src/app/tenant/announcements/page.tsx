"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { unwrapPage } from "@/lib/pagination";
import {
  PROPERTY_WIDE_ANNOUNCEMENT_LABEL,
  formatAnnouncementUnitLabel,
} from "@/lib/announcement-labels";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ErrorBanner } from "@/components/ErrorBanner";
import { motion, AnimatePresence } from "motion/react";
import {
  Megaphone,
  Search,
  RotateCcw,
  Calendar,
  CheckCircle2,
  FileText,
  FileImage,
  Video,
  FileSpreadsheet,
  File,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LightboxModal,
  getFriendlyFileName,
  getFileTypeInfo,
  isImageUrl,
} from "@/components/LightboxModal";
import { useAuth } from "@clerk/nextjs";

type Announcement = {
  id: string;
  property_id: string;
  unit_id?: string | null;
  unit_label?: string | null;
  property_name?: string | null;
  title: string;
  body: string;
  attachment_keys?: string[];
  attachment_urls?: string[];
  created_at: string;
};

interface AttachmentThumbnailProps {
  url: string;
  onViewImage: (url: string) => void;
  className?: string;
}

export function AttachmentThumbnail({
  url,
  onViewImage,
  className = "",
}: AttachmentThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const pathOnly = url.split("?")[0];
  const isImage = isImageUrl(url) && !hasError;
  const friendlyName = getFriendlyFileName(url);
  const rawFileName = pathOnly.split("/").pop() || "Attachment";
  const fileInfo = getFileTypeInfo(url);

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewImage(url);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderFileIcon = () => {
    switch (fileInfo.category) {
      case "video":
        return <Video className="w-5 h-5 text-violet-400" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-500" />;
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "sheet":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case "image":
        return <FileImage className="w-5 h-5 text-emerald-500" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  if (isImage) {
    return (
      <div
        onClick={handleView}
        className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border/60 overflow-hidden bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-text-primary))]/30 transition-all duration-200 cursor-pointer flex-shrink-0 shadow-sm ${className}`}
      >
        <Image
          src={url}
          alt={friendlyName}
          fill
          unoptimized
          sizes="(max-width: 640px) 80px, 96px"
          onError={() => setHasError(true)}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <button
            type="button"
            onClick={handleView}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
            title="Preview file"
            aria-label="Preview file"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <a
            href={url}
            download={friendlyName}
            onClick={handleDownload}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
            title="Download file"
            aria-label="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleView}
      className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border/60 bg-gradient-to-br ${fileInfo.gradientClass} hover:border-[rgb(var(--ml-text-primary))]/30 transition-all duration-200 flex flex-col items-center justify-between p-2.5 cursor-pointer flex-shrink-0 select-none shadow-sm ${className}`}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        <div className="p-1.5 rounded-xl bg-white/10 border border-white/10 shadow-xs">
          {renderFileIcon()}
        </div>
        <span
          className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded-md ${fileInfo.badgeClass}`}
        >
          {fileInfo.label}
        </span>
      </div>

      <span
        className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-semibold truncate w-full text-center group-hover:text-[rgb(var(--ml-text-primary))] transition-colors"
        title={rawFileName}
      >
        {friendlyName}
      </span>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl z-10">
        <button
          type="button"
          onClick={handleView}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
          title="Preview file"
          aria-label="Preview file"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <a
          href={url}
          download={friendlyName}
          onClick={handleDownload}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
          title="Download file"
          aria-label="Download file"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function TenantAnnouncementsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
          Loading announcements...
        </div>
      }
    >
      <TenantAnnouncementsContent />
    </Suspense>
  );
}

interface TenantAnnouncementsData {
  tenantUnitLabel: string | null;
  announcements: Announcement[];
}

function TenantAnnouncementsContent() {
  const searchParams = useSearchParams();
  const targetAnnouncementId =
    searchParams.get("id") || searchParams.get("announcementId");
  const { isLoaded, getToken } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "RECENT" | "PROPERTY" | "UNIT"
  >("ALL");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAnnouncements = useCallback(
    async (signal: AbortSignal): Promise<TenantAnnouncementsData> => {
      const token = await getToken();
      const [profileData, announcementsData] = await Promise.all([
        fetchAPI<{ unit_label?: string }>("/api/v1/tenant/profile", { signal }, token).catch(
          () => null
        ),
        fetchAPI<Announcement[] | { items?: Announcement[] }>(
          "/api/v1/tenant/announcements",
          { signal },
          token
        ),
      ]);
      return {
        tenantUnitLabel: profileData?.unit_label ?? null,
        announcements: unwrapPage<Announcement>(announcementsData),
      };
    },
    [getToken]
  );

  const { data, isLoading: loading, error, refetch } =
    useApiQuery<TenantAnnouncementsData>(
      isLoaded ? fetchAnnouncements : null,
      [isLoaded, fetchAnnouncements]
    );

  const announcements = useMemo(() => data?.announcements || [], [data]);
  const tenantUnitLabel = data?.tenantUnitLabel ?? null;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery]);

  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);
  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((ann) => {
        const query = debouncedSearchQuery.toLowerCase();
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
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [announcements, searchQuery, selectedFilter, nowTimestamp]);

  const totalPages =
    Math.ceil(filteredAnnouncements.length / ITEMS_PER_PAGE) || 1;

  const hasActiveFilters = searchQuery.trim() !== "" || selectedFilter !== "ALL";
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedFilter("ALL");
  };

  useEffect(() => {
    if (!loading && targetAnnouncementId && announcements.length > 0) {
      const target = announcements.find((a) => a.id === targetAnnouncementId);
      if (target) {
        setHighlightedId(targetAnnouncementId);

        if (selectedFilter === "PROPERTY" && target.unit_id) {
          setSelectedFilter("ALL");
        } else if (selectedFilter === "UNIT" && !target.unit_id) {
          setSelectedFilter("ALL");
        }
        if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
          const matches =
            target.title.toLowerCase().includes(q) ||
            target.body.toLowerCase().includes(q);
          if (!matches) {
            setSearchQuery("");
          }
        }

        const targetIndex = filteredAnnouncements.findIndex(
          (a) => a.id === targetAnnouncementId
        );
        if (targetIndex !== -1) {
          const targetPage = Math.floor(targetIndex / ITEMS_PER_PAGE) + 1;
          if (currentPage !== targetPage) {
            setCurrentPage(targetPage);
          }
        }

        const scrollTimer = setTimeout(() => {
          const el = document.getElementById(
            `announcement-${targetAnnouncementId}`
          );
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
  }, [
    loading,
    targetAnnouncementId,
    announcements,
    filteredAnnouncements,
    selectedFilter,
    searchQuery,
    currentPage,
  ]);

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAnnouncements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAnnouncements, currentPage]);

  return (
    <>
      <AnimatePresence>
        {previewUrl && (
          <LightboxModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      <div className="space-y-8 max-w-4xl mx-auto pb-16">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                Landlord Broadcasts
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
                Announcements
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                  {announcements.length}
                </span>
              </h1>
              <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Stay updated with important notices, building policies, and maintenance alerts from your landlord.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
              {(["ALL", "RECENT", "PROPERTY", "UNIT"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
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
                  {filter === "UNIT" && "Your Unit Only"}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>

          {error && <ErrorBanner message={error} onRetry={refetch} />}
        </div>

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
                <motion.div
                  key="tenant-announcements-loading-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="space-y-4"
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={`skel-${i}`}
                      className="p-6 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-3 relative"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="skeleton h-5 w-24 rounded-md" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="skeleton h-4 w-16 rounded-md" />
                        </div>
                      </div>
                      <div className="space-y-2 pt-1">
                        <div className="skeleton h-6 w-3/4 rounded-lg" />
                        <div className="skeleton h-4 w-full rounded-md mt-2" />
                        <div className="skeleton h-4 w-5/6 rounded-md" />
                      </div>
                    </div>
                  ))}
                </motion.div>
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
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                      You&apos;re all caught up!
                    </h3>
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                      No announcements have been posted by your landlord yet. Important updates and notices will appear here.
                    </p>
                  </div>
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
                  <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                    No announcements found
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Try a different search or filter.
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
                  key={`tenant-announcements-list-${currentPage}-${selectedFilter}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="space-y-4"
                >
                  {paginatedAnnouncements.map((ann) => {
                    const isUnitSpecific = !ann.unit_id;
                    const isHighlighted = highlightedId === ann.id;

                    return (
                      <div
                        id={`announcement-${ann.id}`}
                        key={ann.id}
                        className={`p-6 border rounded-2xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-text-primary))]/20 hover:bg-[rgb(var(--ml-bg-secondary))]/90 transition-all duration-300 space-y-3 relative group ${
                          isHighlighted
                            ? "border-[rgb(var(--ml-accent))] ring-2 ring-[rgb(var(--ml-accent))] shadow-[0_0_28px_rgba(var(--ml-accent),0.35)] scale-[1.01]"
                            : "border-border/60"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-md border font-bold uppercase tracking-wider ${
                                isUnitSpecific
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              }`}
                            >
                              {ann.unit_id
                                ? formatAnnouncementUnitLabel(ann.unit_label || tenantUnitLabel)
                                : PROPERTY_WIDE_ANNOUNCEMENT_LABEL}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--ml-text-secondary))] font-medium">
                            <Calendar className="w-3.5 h-3.5 opacity-60" />
                            <span>
                              {new Date(ann.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-bold text-lg text-[rgb(var(--ml-text-primary))] leading-snug">
                            {ann.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap leading-relaxed">
                            {ann.body}
                          </p>
                        </div>

                        {ann.attachment_urls && ann.attachment_urls.length > 0 && (
                          <div className="pt-2 border-t border-border/30 space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/70 block">
                              Attachments ({ann.attachment_urls.length})
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {ann.attachment_urls.map((url, idx) => (
                                <AttachmentThumbnail
                                  key={idx}
                                  url={url}
                                  onViewImage={setPreviewUrl}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {!loading && filteredAnnouncements.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40">
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                  Showing{" "}
                  <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>
                  –
                  <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredAnnouncements.length)}
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
      </div>
    </>
  );
}
