"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import { errorMessage } from "@/lib/errors";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { ErrorBanner } from "@/components/ErrorBanner";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Search,
  Plus,
  X,
  Building,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LightboxModal } from "@/components/LightboxModal";
import { useAuth } from "@clerk/nextjs";
import { DocumentCard, Document } from "@/components/landlord/documents/DocumentCard";
import { UploadDocumentForm } from "@/components/landlord/documents/UploadDocumentForm";

type Property = { id: string; name: string };
type Unit = { id: string; unit_label: string };

export default function LandlordDocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
          Loading...
        </div>
      }
    >
      <LandlordDocumentsContent />
    </Suspense>
  );
}

function LandlordDocumentsContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const router = useRouter();
  const { isLoaded, getToken } = useAuth();

  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

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

  const { data: propertiesData, isLoading: loading, error: propsError, refetch: refetchProps } =
    useApiQuery<Property[]>(isLoaded ? fetchPropertiesData : null, [isLoaded, fetchPropertiesData]);

  const properties = useMemo(() => propertiesData || [], [propertiesData]);

  useEffect(() => {
    if (properties.length > 0) {
      const initialPropertyId = searchParams.get("property_id");
      if (initialPropertyId && properties.some((p) => p.id === initialPropertyId)) {
        setSelectedProperty(initialPropertyId);
      } else {
        setSelectedProperty((prev) =>
          properties.some((p) => p.id === prev) ? prev : properties[0].id
        );
      }
    } else {
      setSelectedProperty("");
      setDocuments([]);
    }
  }, [properties, searchParams]);

  const loadPropertyData = useCallback(async () => {
    if (!isLoaded || !selectedProperty) {
      setUnits([]);
      setDocuments([]);
      setDocsLoading(false);
      return;
    }
    setDocsLoading(true);
    setDocsError(null);
    try {
      const token = await getToken();
      const [unitData, docData] = await Promise.all([
        fetchAPI<Unit[]>(`/api/v1/landlord/properties/${selectedProperty}/units`, {}, token),
        fetchAPI<Document[]>(`/api/v1/landlord/properties/${selectedProperty}/documents`, {}, token),
      ]);
      const sortedUnits = (unitData || []).slice().sort((a, b) =>
        (a.unit_label || "").localeCompare(b.unit_label || "", undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
      setUnits(sortedUnits);
      setDocuments(Array.isArray(docData) ? docData : []);
    } catch (err) {
      console.error("Failed to load documents/units:", err);
      setDocsError(errorMessage(err) || "Failed to load documents.");
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  }, [selectedProperty, isLoaded, getToken]);

  useEffect(() => {
    loadPropertyData();
  }, [loadPropertyData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, selectedProperty]);

  const handleDownload = async (fileKey: string, title: string) => {
    try {
      const { download_url } = await fetchAPI<{ download_url: string }>(
        `/api/v1/uploads/download-url?file_key=${encodeURIComponent(fileKey)}&download=true`
      );
      const link = document.createElement("a");
      link.href = download_url;
      link.setAttribute("download", title);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error("Failed to get download link");
    }
  };

  const handleOpenPreview = async (doc: Document) => {
    if (doc.file_url) {
      setPreviewDoc(doc);
      return;
    }
    try {
      const { download_url } = await fetchAPI<{ download_url: string }>(
        `/api/v1/uploads/download-url?file_key=${encodeURIComponent(doc.file_key)}`
      );
      setPreviewDoc({ ...doc, file_url: download_url });
    } catch (err) {
      toast.error("Failed to load document preview");
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        if (idParam && doc.id !== idParam) {
          return false;
        }

        const matchesSearch = doc.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        if (selectedFilter === "PROPERTY_WIDE") {
          matchesFilter = !doc.unit_id;
        } else if (selectedFilter !== "ALL") {
          matchesFilter = doc.unit_id === selectedFilter;
        }

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [documents, searchQuery, selectedFilter, idParam]);

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE) || 1;

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocuments, currentPage]);

  const getUnitLabel = (unitId: string | null | undefined) => {
    if (!unitId) return "Property-Wide";
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.unit_label : "Unknown Unit";
  };

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "Property";

  return (
    <>
      <AnimatePresence>
        {previewDoc && previewDoc.file_url && (
          <LightboxModal
            url={previewDoc.file_url}
            title={previewDoc.title}
            fileType={previewDoc.file_type}
            onClose={() => setPreviewDoc(null)}
            onDownload={() => handleDownload(previewDoc.file_key, previewDoc.title)}
          />
        )}
      </AnimatePresence>

      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                Document Management
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
                Property Documents
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border flex items-center justify-center min-w-[28px] min-h-[24px]">
                  {loading || docsLoading ? (
                    <span className="skeleton h-3 w-4 rounded-full inline-block" />
                  ) : (
                    documents.length
                  )}
                </span>
              </h1>
              <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Organize lease agreements, house rules, and inspection reports across properties.
              </p>
            </div>

            {/* Controls */}
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
                        <Building className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))]" />
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
                <span>{showUploadForm ? "Hide Form" : "Upload Document"}</span>
              </Button>
            </div>
          </div>

          {/* Search & Filter Controls Bar */}
          {properties.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedFilter("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === "ALL"
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                      : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  All Documents
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter("PROPERTY_WIDE")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === "PROPERTY_WIDE"
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                      : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  Property-Wide
                </button>
                {units.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => setSelectedFilter(u.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                      selectedFilter === u.id
                        ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                        : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                    }`}
                  >
                    Unit {u.unit_label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:w-64 sm:flex-initial">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
                />
              </div>
            </div>
          )}

          {idParam && (
            <div className="mt-4 flex items-center bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold px-4 py-2 rounded-xl">
              <span>Showing a specific document.</span>
              <button
                type="button"
                onClick={() => router.replace("/landlord/documents")}
                className="ml-auto underline decoration-blue-500/30 hover:decoration-blue-500 underline-offset-2"
              >
                Clear Filter
              </button>
            </div>
          )}

          {propsError && <ErrorBanner message={propsError} onRetry={refetchProps} />}
          {docsError && <ErrorBanner message={docsError} onRetry={loadPropertyData} />}
        </div>

        {!loading && properties.length === 0 && !propsError ? (
          <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-3">
            <Building className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No Properties Found</h3>
            <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
              Please add a property first before uploading documents.
            </p>
          </div>
        ) : (
          <>
            {/* Upload Form */}
            <AnimatePresence>
              {showUploadForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <UploadDocumentForm
                    selectedProperty={selectedProperty}
                    selectedPropertyName={selectedPropertyName}
                    units={units}
                    onSuccess={(newDoc) => {
                      setDocuments((prev) => [newDoc, ...prev]);
                      setShowUploadForm(false);
                    }}
                    onCancel={() => setShowUploadForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Document Library Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                  Document Library ({filteredDocuments.length})
                </h2>
              </div>

              {docsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-4"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-24 h-24 rounded-xl skeleton shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2.5 py-1">
                          <div className="flex items-center gap-1.5">
                            <div className="skeleton h-4 w-14 rounded-md" />
                            <div className="skeleton h-4 w-20 rounded-md" />
                          </div>
                          <div className="skeleton h-5 w-4/5 rounded-lg" />
                          <div className="skeleton h-3.5 w-24 rounded-md" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
                        <div className="skeleton h-9 rounded-xl" />
                        <div className="skeleton h-9 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 && !docsError ? (
                <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                      No Documents Uploaded
                    </h3>
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                      No files have been uploaded for{" "}
                      <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                        {selectedPropertyName}
                      </span>{" "}
                      yet. Click &ldquo;Upload Document&rdquo; to add your first file.
                    </p>
                  </div>
                </div>
              ) : filteredDocuments.length === 0 && !docsError ? (
                <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3">
                  <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    No matching documents
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Try adjusting your search query or file filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      unitLabel={getUnitLabel(doc.unit_id)}
                      onPreview={handleOpenPreview}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {!docsLoading && filteredDocuments.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40">
                  <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                    Showing{" "}
                    <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>
                    –
                    <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredDocuments.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                      {filteredDocuments.length}
                    </span>{" "}
                    documents
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
          </>
        )}
      </div>
    </>
  );
}

