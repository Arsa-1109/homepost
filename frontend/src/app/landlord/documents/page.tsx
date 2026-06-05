"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { uploadFile } from "@/lib/upload";

type Property = { id: string; name: string };
type Unit = { id: string; unit_label: string };
type Document = {
  id: string;
  title: string;
  file_key: string;
  file_type: string;
  created_at: string;
  unit_id?: string | null;
};

export default function LandlordDocumentsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  
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
      try {
        const data = await fetchAPI<Document[]>(`/api/v1/landlord/properties/${selectedProperty}/documents`);
        setDocuments(data);
      } catch (err) {
        console.error(err);
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

  const handleDownload = async (fileKey: string) => {
    try {
      const { download_url } = await fetchAPI<{ download_url: string }>(`/api/v1/uploads/download-url?file_key=${encodeURIComponent(fileKey)}`);
      window.open(download_url, "_blank");
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
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 items-center">
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
                <option value="" className="bg-[#1e1e1e]">Assign to: All Units (Property-wide)</option>
                {units.map(u => (
                  <option key={u.id} value={u.id} className="bg-[#1e1e1e]">Assign to: {u.unit_label}</option>
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

          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-[rgb(var(--ml-text-secondary))] border border-dashed border-[rgb(var(--ml-border))] rounded-xl">
                No documents uploaded for this property yet.
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))]">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{doc.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${doc.unit_id ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}`}>
                        {getUnitLabel(doc.unit_id)}
                      </span>
                    </div>
                    <p className="text-sm text-[rgb(var(--ml-text-secondary))]">
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
