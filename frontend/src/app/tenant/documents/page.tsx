"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

type Document = {
  id: string;
  title: string;
  file_key: string;
  file_type: string;
  created_at: string;
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

  const handleDownload = async (fileKey: string) => {
    try {
      const { download_url } = await fetchAPI<{ download_url: string }>(`/api/v1/uploads/download-url?file_key=${encodeURIComponent(fileKey)}`);
      window.open(download_url, "_blank");
    } catch (err) {
      alert("Failed to get download link");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Shared Documents 📄</h1>
      <p className="text-[rgb(var(--ml-text-secondary))]">Important files shared by your landlord (lease agreements, move-in instructions, etc.)</p>

      {loading ? (
        <div className="text-center py-12 text-[rgb(var(--ml-text-secondary))] animate-pulse">
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))]">
          <p className="text-[rgb(var(--ml-text-secondary))]">No documents available.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] transition-colors group">
              <div>
                <h3 className="font-semibold group-hover:text-[rgb(var(--ml-accent))] transition-colors">{doc.title}</h3>
                <span className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Added on {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <button 
                onClick={() => handleDownload(doc.file_key)}
                className="px-4 py-2 bg-[rgb(var(--ml-accent))] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
