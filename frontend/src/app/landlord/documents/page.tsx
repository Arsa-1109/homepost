"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { FileText, FileImage, Download, Eye, File } from "lucide-react";

type Property = { id: string; name: string };
type Unit = { id: string; unit_label: string };
type Document = {
  id: string;
  title: string;
  file_key: string;
  file_type: string;
  created_at: string;
  unit_id?: string | null;
  file_url?: string;
};

export default function LandlordDocumentsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProps() {
      try {
        const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
        setProperties(data);
        if (data.length > 0) {
          setSelectedProperty(data[0].id);
        }
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
    
    // Load units for the selected property
    async function loadUnits() {
      try {
        const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${selectedProperty}/units`);
        setUnits(data);
      } catch (err) {
        console.error(err);
      }
    }

    // Load documents for the selected property
    async function loadDocs() {
      setDocsLoading(true);
      try {
        const data = await fetchAPI<Document[]>(`/api/v1/landlord/properties/${selectedProperty}/documents`);
        setDocuments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setDocsLoading(false);
      }
    }
    
    setSelectedUnit(""); // Reset unit selection when property changes
    loadUnits();
    loadDocs();
  }, [selectedProperty]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !file) return;
    
    setIsSubmitting(true);
    try {
      const fileKey = await uploadFile(file, "documents");
      
      const payload: any = {
        property_id: selectedProperty, 
        title, 
        file_key: fileKey,
        file_type: file.type || "application/octet-stream"
      };

      if (selectedUnit) {
        payload.unit_id = selectedUnit;
      }

      const newDoc = await fetchAPI<Document>("/api/v1/landlord/documents", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      setDocuments(prev => [newDoc, ...prev]);
      setTitle("");
      setFile(null);
      setSelectedUnit("");
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Helper to find unit label
  const getUnitLabel = (unitId: string | null | undefined) => {
    if (!unitId) return "Property-Wide (All Units)";
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.unit_label : "Unknown Unit";
  };

  if (loading) return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Documents 📄</h1>
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 bg-[rgb(var(--ml-border))] rounded-md"></div>
        <div className="h-48 w-full bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl"></div>
        <div className="h-8 w-32 bg-[rgb(var(--ml-border))] rounded-md mt-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 w-full bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Documents 📄</h1>

      {properties.length === 0 ? (
        <div className="text-center py-12 border border-[rgb(var(--ml-border))] rounded-xl">
          Please add a property first before uploading documents.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 items-center">
              <span className="font-medium text-[rgb(var(--ml-text-secondary))]">Select Property:</span>
              <select 
                value={selectedProperty} 
                onChange={e => setSelectedProperty(e.target.value)}
                className="bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-lg p-2 outline-none focus:border-[rgb(var(--ml-accent))] appearance-none"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id} className="bg-background">{p.name}</option>
                ))}
              </select>
            </div>
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
              <select 
                value={selectedUnit} 
                onChange={e => setSelectedUnit(e.target.value)}
                className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] appearance-none"
              >
                <option value="" className="bg-background">Assign to: All Units (Property-wide)</option>
                {units.map(u => (
                  <option key={u.id} value={u.id} className="bg-background">Assign to: {u.unit_label}</option>
                ))}
              </select>
            </div>
            <div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docsLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="flex gap-4 p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse">
                  <div className="w-20 h-20 bg-[rgb(var(--ml-border))] rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-[rgb(var(--ml-border))] rounded w-3/4" />
                    <div className="h-3 bg-[rgb(var(--ml-border))] rounded w-1/4" />
                    <div className="h-3 bg-[rgb(var(--ml-border))] rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : documents.length === 0 ? (
              <div className="col-span-full text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl text-[rgb(var(--ml-text-secondary))]">
                No documents uploaded for this property yet.
              </div>
            ) : (
              documents.map(doc => {
                const isImage = doc.file_type.startsWith("image/");
                const isPdf = doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

                return (
                  <div key={doc.id} className="flex gap-4 p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] transition-all group shadow-sm hover:shadow-md">
                    {/* Preview Thumbnail */}
                    <div className="relative w-20 h-20 border border-[rgb(var(--ml-border))] rounded-lg overflow-hidden shrink-0">
                      {isImage && doc.file_url ? (
                        <div className="relative w-full h-full bg-muted flex items-center justify-center">
                          <img 
                            src={doc.file_url} 
                            alt={doc.title} 
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : isPdf ? (
                        <div className="w-full h-full bg-red-500/10 text-red-600 dark:text-red-400 flex flex-col items-center justify-center gap-1">
                          <FileText className="h-8 w-8" />
                          <span className="text-[10px] font-bold tracking-wider uppercase">PDF</span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center gap-1">
                          <File className="h-8 w-8" />
                          <span className="text-[10px] font-bold tracking-wider uppercase">DOC</span>
                        </div>
                      )}
                    </div>

                    {/* Document Details & Actions */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base text-foreground group-hover:text-[rgb(var(--ml-accent))] transition-colors truncate">
                            {doc.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-500/10 text-slate-400 border-slate-500/20 font-medium">
                            {properties.find(p => p.id === selectedProperty)?.name || "Property"}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${doc.unit_id ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"} font-medium`}>
                            {getUnitLabel(doc.unit_id)}
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
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
