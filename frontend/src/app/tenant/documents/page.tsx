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
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
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
        <div className="w-full h-full bg-red-950/20 text-red-500 flex flex-col items-center justify-center gap-1">
          <FileText className="h-8 w-8" />
          <span className="text-[10px] font-bold tracking-wider uppercase">PDF</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-blue-950/20 text-blue-400 flex flex-col items-center justify-center gap-1">
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
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Shared Documents 📄</h1>
        <p className="text-[rgb(var(--ml-text-secondary))] text-sm">
          Important files shared by your landlord (lease agreements, move-in instructions, etc.)
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse">
              <div className="w-20 h-20 bg-slate-800 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))]">
          <p className="text-[rgb(var(--ml-text-secondary))]">No documents shared yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="flex gap-4 p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] transition-all group shadow-sm hover:shadow-md"
            >
              {/* Preview Thumbnail */}
              <div className="relative w-20 h-20 border border-[rgb(var(--ml-border))] rounded-lg overflow-hidden shrink-0">
                {renderPreview(doc)}
              </div>

              {/* Document Details & Actions */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base text-white group-hover:text-[rgb(var(--ml-accent))] transition-colors truncate">
                      {doc.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-medium uppercase">
                      {getFileBadge(doc.file_type)}
                    </span>
                    <span className="text-[11px] text-[rgb(var(--ml-text-secondary))]">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {doc.file_url && (
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgb(var(--ml-border))] rounded-lg text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </a>
                  )}
                  <button 
                    onClick={() => handleDownload(doc.file_key, doc.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--ml-accent))] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-3.5 w-3.5" />
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
