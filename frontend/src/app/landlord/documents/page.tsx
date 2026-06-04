"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { uploadFile } from "@/lib/upload";

type Property = { id: string; name: string };
type Document = {
  id: string;
  title: string;
  file_key: string;
  file_type: string;
  created_at: string;
};

export default function LandlordDocumentsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProps() {
      try {
        const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
        setProperties(data);
        if (data.length > 0) setSelectedProperty(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProps();
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;
    async function loadDocs() {
      try {
        const data = await fetchAPI<Document[]>(`/api/v1/landlord/properties/${selectedProperty}/documents`);
        setDocuments(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadDocs();
  }, [selectedProperty]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !file) return;
    
    setIsSubmitting(true);
    try {
      const fileKey = await uploadFile(file, "documents");
      
      const newDoc = await fetchAPI<Document>("/api/v1/landlord/documents", {
        method: "POST",
        body: JSON.stringify({ 
          property_id: selectedProperty, 
          title, 
          file_key: fileKey,
          file_type: file.type || "application/octet-stream"
        }),
      });
      
      setDocuments(prev => [newDoc, ...prev]);
      setTitle("");
      setFile(null);
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (fileKey: string) => {
    try {
      const { download_url } = await fetchAPI<{ download_url: string }>(`/api/v1/uploads/download-url?file_key=${encodeURIComponent(fileKey)}`);
      window.open(download_url, "_blank");
    } catch (err) {
      alert("Failed to get download link");
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Documents 📄</h1>

      {properties.length === 0 ? (
        <div className="text-center py-12 border border-[rgb(var(--ml-border))] rounded-xl">
          Please add a property first before uploading documents.
        </div>
      ) : (
        <>
          <div className="flex gap-4 items-center">
            <span className="font-medium text-[rgb(var(--ml-text-secondary))]">Select Property:</span>
            <select 
              value={selectedProperty} 
              onChange={e => setSelectedProperty(e.target.value)}
              className="bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-lg p-2 outline-none focus:border-[rgb(var(--ml-accent))] appearance-none"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id} className="bg-[#1e1e1e]">{p.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleUpload} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl space-y-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Document Title (e.g. Lease Agreement 2026)" 
                className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors"
              />
              <input 
                required
                type="file" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-[rgb(var(--ml-text-secondary))] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[rgb(var(--ml-accent))] file:text-white hover:file:opacity-90 cursor-pointer pt-1"
              />
            </div>
            <button 
              disabled={isSubmitting || !file}
              type="submit" 
              className="bg-[rgb(var(--ml-accent))] text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Uploading..." : "Upload Document"}
            </button>
          </form>

          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-[rgb(var(--ml-text-secondary))] border border-dashed border-[rgb(var(--ml-border))] rounded-xl">
                No documents uploaded for this property yet.
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))]">
                  <div>
                    <h3 className="font-bold text-lg">{doc.title}</h3>
                    <p className="text-sm text-[rgb(var(--ml-text-secondary))] mt-1">
                      Added on {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDownload(doc.file_key)}
                    className="bg-[rgb(var(--ml-accent))] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Download
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
