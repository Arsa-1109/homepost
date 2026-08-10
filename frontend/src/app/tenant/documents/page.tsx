"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { FileText, FileImage, Download, Eye, File } from "lucide-react";
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Shared Documents</h1>
        <p className="text-[rgb(var(--ml-text-secondary))] text-sm">
          Important files shared by your landlord (lease agreements, move-in instructions, etc.)
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border border-[var(--ml-border)] rounded-xl bg-[rgb(var(--ml-bg-secondary))]/60">
              <div className="w-20 h-20 rounded-lg skeleton shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="skeleton h-4 w-3/4 rounded-md" />
                <div className="skeleton h-3 w-1/4 rounded-md" />
                <div className="skeleton h-7 w-20 rounded-lg mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 border border-blue-500/20 shadow-[0_0_25px_rgba(96,165,250,0.04)] rounded-2xl bg-[rgb(var(--ml-bg-secondary))]/60">
          <p className="text-[rgb(var(--ml-text-primary))] font-semibold">No documents shared yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="flex gap-4 p-4 border border-[var(--ml-border)] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(96,165,250,0.06)] transition-all group shadow-sm"
            >
              {/* Preview Thumbnail */}
              <div className="relative w-20 h-20 border border-[var(--ml-border)] rounded-lg overflow-hidden shrink-0">
                {renderPreview(doc)}
              </div>

              {/* Document Details & Actions */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base text-foreground group-hover:text-[rgb(var(--ml-accent))] transition-colors truncate">
                      {doc.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--ml-border)] bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-medium uppercase">
                      {getFileBadge(doc.file_type)}
                    </span>
                    <span className="text-[11px] text-[rgb(var(--ml-text-secondary))]">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {doc.file_url && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-3 text-xs"
                    >
                      <a 
                        href={doc.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(doc.file_key, doc.title)}
                    className="h-8 gap-1.5 px-3 text-xs font-medium cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
