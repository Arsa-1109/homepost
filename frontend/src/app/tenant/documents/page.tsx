"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { FileText, FileImage, Download, Eye, File } from "lucide-react";

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

  const renderPreview = (doc: Document) => {
    const isImage = doc.file_type.startsWith("image/");
    const isPdf = doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

    if (isImage && doc.file_url) {
      return (
        <div className="relative w-full h-full bg-muted flex items-center justify-center">
          <img 
            src={doc.file_url} 
            alt={doc.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full bg-red-500/10 text-red-600 dark:text-red-400 flex flex-col items-center justify-center gap-1">
          <FileText className="h-8 w-8" />
          <span className="text-[10px] font-bold tracking-wider uppercase">PDF</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center gap-1">
        <File className="h-8 w-8" />
        <span className="text-[10px] font-bold tracking-wider uppercase">DOC</span>
      </div>
    );
  };

  const getFileBadge = (fileType: string) => {
    if (fileType.startsWith("image/")) return "Image";
    if (fileType === "application/pdf") return "PDF";
    if (fileType.includes("word") || fileType.includes("officedocument")) return "Word";
    return "Document";
  };

  return (
    <div className="w-full min-w-0 space-y-8 max-w-4xl mx-auto animate-fade-slide-up p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-[rgb(var(--ml-accent))]/10 shrink-0">
          <FileText className="w-6 h-6 text-[rgb(var(--ml-accent))]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))]">Shared Documents</h1>
          <p className="text-[rgb(var(--ml-text-secondary))] text-sm font-medium mt-1 truncate">
            Important files shared by your landlord
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4 p-5 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse shadow-sm">
              <div className="w-20 h-20 bg-[rgb(var(--ml-border))]/60 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-[rgb(var(--ml-border))]/60 rounded-md w-3/4" />
                <div className="h-4 bg-[rgb(var(--ml-border))]/60 rounded-md w-1/4" />
                <div className="h-4 bg-[rgb(var(--ml-border))]/60 rounded-md w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[rgb(var(--ml-border))]/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--ml-bg-tertiary))] flex items-center justify-center mb-5 shadow-inner">
            <FileText className="w-7 h-7 text-[rgb(var(--ml-text-muted))]" />
          </div>
          <p className="text-[rgb(var(--ml-text-primary))] font-bold text-lg">No documents shared yet</p>
          <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-2">Check back later for lease agreements and notices</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
              <div 
              key={doc.id} 
              className="flex gap-5 p-5 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))]/50 transition-all duration-300 group hover-lift shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
            >
              {/* Preview Thumbnail */}
              <div className="relative w-20 h-20 border border-[rgb(var(--ml-border))]/50 rounded-xl overflow-hidden shrink-0 shadow-sm">
                {renderPreview(doc)}
              </div>

              {/* Document Details & Actions */}
              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-base text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors truncate">
                      {doc.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] px-2.5 py-1 rounded-md border border-[rgb(var(--ml-border))]/80 bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold uppercase tracking-wider">
                      {getFileBadge(doc.file_type)}
                    </span>
                    <span className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">
                      {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  {doc.file_url && (
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-4 py-2 border border-[rgb(var(--ml-border))]/80 rounded-xl text-xs font-bold text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] transition-all active:scale-95"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </a>
                  )}
                  <button 
                    onClick={() => handleDownload(doc.file_key, doc.title)}
                    className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-4 py-2 bg-[rgb(var(--ml-accent))] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-sm hover:shadow"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
