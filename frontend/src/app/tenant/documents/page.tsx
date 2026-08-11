"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/api";
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
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isImage = doc.file_type.startsWith("image/");
      const isPdf = doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

      if (selectedFilter === "PDF") return matchesSearch && isPdf;
      if (selectedFilter === "IMAGE") return matchesSearch && isImage;
      if (selectedFilter === "OTHER") return matchesSearch && !isPdf && !isImage;
      return matchesSearch;
    });
  }, [documents, searchQuery, selectedFilter]);

  const renderPreview = (doc: Document) => {
    const isImage = doc.file_type.startsWith("image/");
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
    if (fileType.startsWith("image/")) return { label: "Image", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
    if (fileType === "application/pdf" || fileKey.endsWith(".pdf")) return { label: "PDF Document", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
    if (fileType.includes("word") || fileType.includes("officedocument")) return { label: "Word Document", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    return { label: "File", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-slide-up pb-12">
      {/* Header Section */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Landlord Documents
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Shared Documents
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                {documents.length}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Important lease agreements, move-in checklists, and property notices uploaded directly by your landlord.
            </p>
          </div>

          {/* Search & Quick Filter Controls */}
          {documents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        {documents.length > 0 && (
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border/40 overflow-x-auto no-scrollbar">
            {(["ALL", "PDF", "IMAGE", "OTHER"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                  selectedFilter === filter
                    ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                    : "bg-[rgb(var(--ml-bg-tertiary))]/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/40 hover:text-[rgb(var(--ml-text-primary))]"
                }`}
              >
                {filter === "ALL" && "All Files"}
                {filter === "PDF" && "PDFs"}
                {filter === "IMAGE" && "Images"}
                {filter === "OTHER" && "Other Docs"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex gap-4 p-4 border border-border/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))]">
              <div className="w-24 h-24 rounded-xl skeleton shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="skeleton h-4 w-3/4 rounded-lg" />
                <div className="skeleton h-3 w-1/2 rounded-md" />
                <div className="flex gap-2 pt-2">
                  <div className="skeleton h-8 w-16 rounded-xl" />
                  <div className="skeleton h-8 w-20 rounded-xl" />
                </div>
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
          {filteredDocuments.map((doc) => {
            const badge = getFileBadge(doc.file_type, doc.file_key);
            return (
              <div 
                key={doc.id} 
                className="group relative flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-text-primary))]/20 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-all duration-300 hover-lift overflow-hidden"
              >
                <div className="flex gap-4 items-start">
                  {/* Thumbnail Preview Container */}
                  <div className="relative w-24 h-24 rounded-xl border border-border/60 overflow-hidden shrink-0 shadow-inner bg-[rgb(var(--ml-bg-primary))]">
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
                  {doc.file_url && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 gap-1.5 px-3 text-xs font-semibold rounded-xl border-border/60 hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-text-primary))] transition-all cursor-pointer"
                    >
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-3.5 w-3.5 text-[rgb(var(--ml-text-secondary))]" />
                        View
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => handleDownload(doc.file_key, doc.title)}
                    className={`h-9 gap-1.5 px-3 text-xs font-semibold rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-95 ${
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
    </div>
  );
}

