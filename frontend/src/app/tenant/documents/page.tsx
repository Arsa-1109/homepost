"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  FileImage, 
  Download, 
  Eye, 
  File, 
  Search, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  FileCode,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LightboxModal, isImageUrl } from "@/components/LightboxModal";

type Document = {
  id: string;
  title: string;
  file_key: string;
  file_type: string;
  created_at: string;
  file_url: string;
};

export default function TenantDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "PDF" | "IMAGE" | "OTHER">("ALL");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchQuery]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAPI<Document[]>("/api/v1/tenant/documents");
        setDocuments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
      alert("Failed to get download link");
    }
  };

  const handleOpenPreview = async (doc: Document) => {
    if (doc.file_url) {
      setPreviewDoc(doc);
      return;
    }
    try {
      const { download_url } = await fetchAPI<{ download_url: string }>(
        `/api/v1/uploads/download-url?file_key=${encodeURIComponent(doc.file_key)}`,
      );
      setPreviewDoc({ ...doc, file_url: download_url });
    } catch (err) {
      alert("Failed to load document preview");
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isImage = doc.file_type.startsWith("image/") || isImageUrl(doc.file_url || doc.file_key);
      const isPdf = doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

      if (selectedFilter === "PDF") return matchesSearch && isPdf;
      if (selectedFilter === "IMAGE") return matchesSearch && isImage;
      if (selectedFilter === "OTHER") return matchesSearch && !isPdf && !isImage;
      return matchesSearch;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [documents, searchQuery, selectedFilter]);

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE) || 1;

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocuments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocuments, currentPage]);

  const renderPreview = (doc: Document) => {
    const isImage = doc.file_type.startsWith("image/") || isImageUrl(doc.file_url || doc.file_key);
    const isPdf = doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

    if (isImage && doc.file_url) {
      return (
        <div className="relative w-full h-full bg-muted/30 flex items-center justify-center overflow-hidden">
          <img 
            src={doc.file_url} 
            alt={doc.title} 
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-950/20 text-rose-500 dark:text-rose-400 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
            <FileText className="h-6 w-6 text-rose-500" />
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase text-rose-500/90 dark:text-rose-300">PDF</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-indigo-950/20 text-indigo-500 dark:text-indigo-400 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
          <File className="h-6 w-6 text-indigo-500" />
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase text-indigo-500/90 dark:text-indigo-300">DOC</span>
      </div>
    );
  };

  const getFileBadge = (fileType: string, fileKey: string) => {
    if (fileType.startsWith("image/") || isImageUrl(fileKey)) return { label: "Image", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
    if (fileType === "application/pdf" || fileKey.endsWith(".pdf")) return { label: "PDF Document", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
    if (fileType.includes("word") || fileType.includes("officedocument")) return { label: "Word Document", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    return { label: "File", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  };

  return (
    <>
      <AnimatePresence>
        {previewDoc && previewDoc.file_url && (
          <LightboxModal
            url={previewDoc.file_url}
            title={previewDoc.title}
            fileType={previewDoc.file_type}
            onClose={() => setPreviewDoc(null)}
            onDownload={() =>
              handleDownload(previewDoc.file_key, previewDoc.title)
            }
          />
        )}
      </AnimatePresence>

      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Landlord Documents
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
                Shared Documents
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border flex items-center justify-center min-w-[28px] min-h-[24px]">
                  {loading ? (
                    <span className="skeleton h-3 w-4 rounded-full inline-block" />
                  ) : (
                    documents.length
                  )}
                </span>
              </h1>
              <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Important lease agreements, move-in checklists, and property notices uploaded directly by your landlord.
              </p>
            </div>

            {/* Search & Quick Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {(["ALL", "PDF", "IMAGE", "OTHER"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                  selectedFilter === filter
                    ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                    : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                }`}
              >
                {filter === "ALL" && "All Documents"}
                {filter === "PDF" && "PDFs"}
                {filter === "IMAGE" && "Images"}
                {filter === "OTHER" && "Other"}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 rounded-xl skeleton shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2.5 py-1">
                    <div className="skeleton h-4 w-20 rounded-md" />
                    <div className="skeleton h-5 w-4/5 rounded-lg" />
                    <div className="skeleton h-3.5 w-24 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-border/40">
                  <div className="skeleton h-9 flex-1 rounded-xl" />
                  <div className="skeleton h-9 flex-1 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[rgb(var(--ml-text-primary))]">No Documents Shared</h3>
              <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Your landlord has not uploaded any shared documents for your unit yet. When they do, they will appear here.
              </p>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3">
            <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
            <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">No matching documents found</p>
            <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Try adjusting your search terms or filter selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedDocuments.map((doc) => {
              const badge = getFileBadge(doc.file_type, doc.file_key);
              const isImage = doc.file_type.startsWith("image/") || isImageUrl(doc.file_url || doc.file_key);
              return (
                <div 
                  key={doc.id} 
                  className="group relative flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20"
                >
                  <div className="flex gap-4 items-start">
                    {/* Thumbnail Preview Container */}
                    <div 
                      onClick={() => handleOpenPreview(doc)}
                      className="relative w-24 h-24 rounded-xl border border-border/60 overflow-hidden shrink-0 shadow-inner bg-[rgb(var(--ml-bg-primary))] cursor-pointer group-hover:border-[rgb(var(--ml-text-primary))]/40 transition-colors"
                      title={`Click to preview ${doc.title}`}
                    >
                      {renderPreview(doc)}
                    </div>

                    {/* Document Meta Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="space-y-1">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${badge.color}`}>
                          {badge.label}
                        </span>
                        <h3 className="font-bold text-base text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-text-primary))]/80 transition-colors line-clamp-2 leading-tight">
                          {doc.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium">
                        <Calendar className="w-3 h-3 text-[rgb(var(--ml-text-secondary))]/70" />
                        <span>{new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                    {/* Interactive Actions Footer */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-border/40">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPreview(doc)}
                      className="flex-1 h-9 gap-1.5 px-3 text-xs font-semibold rounded-xl cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))]"
                    >
                      <Eye className="h-3.5 w-3.5 text-[rgb(var(--ml-text-secondary))]" />
                      View
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      onClick={() => handleDownload(doc.file_key, doc.title)}
                      className={`h-9 gap-1.5 px-3 text-xs font-semibold rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] shadow-sm cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)] ${
                        !doc.file_url ? "w-full" : "flex-1"
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls Bar */}
        {!loading && filteredDocuments.length > 0 && (
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
                  filteredDocuments.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                {filteredDocuments.length}
              </span>{" "}
              documents
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
  );
}

