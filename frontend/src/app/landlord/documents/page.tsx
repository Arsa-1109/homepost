"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { uploadFile } from "@/lib/upload";
import { FileText, FileImage, Download, Eye, File } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

      if (selectedUnit && selectedUnit !== "all") {
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
      toast.success("Document uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload document. Please try again.");
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
      toast.error("Failed to get download link");
    }
  };

  // Helper to find unit label
  const getUnitLabel = (unitId: string | null | undefined) => {
    if (!unitId) return "Property-Wide (All Units)";
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.unit_label : "Unknown Unit";
  };

  if (loading) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[rgb(var(--ml-text-primary))]">Documents</h1>
      <div className="space-y-6">
        <div className="p-6 border border-border rounded-xl bg-[rgb(var(--ml-bg-secondary))]/60 space-y-4">
          <div className="skeleton h-6 w-48 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="skeleton h-20 w-full rounded-lg" />
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-slide-up">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))]">
          Documents
        </h1>
        <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-2">
          Upload and manage leases, agreements, and property documentation.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12 border border-border rounded-xl">
          Please add a property first before uploading documents.
        </div>
      ) : (
        <>
          <div className="flex gap-4 items-center bg-[rgb(var(--ml-bg-secondary))] p-4 rounded-2xl border border-border/15 shadow-sm max-w-max">
            <span className="font-bold text-xs uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] select-none">Select Property:</span>
            <Select value={selectedProperty} onValueChange={(val) => setSelectedProperty(val as string)}>
              <SelectTrigger id="select-doc-property" className="w-48 bg-[rgb(var(--ml-bg-primary))]/80 border-border/40 rounded-xl">
                <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-sm">
                  {selectedProperty ? properties.find(p => p.id === selectedProperty)?.name : "Select Property"}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/30 rounded-xl">
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-semibold text-sm">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleUpload} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-border/25 rounded-2xl space-y-4 shadow-sm animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4 text-balance">Upload New Document</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="doc-title" className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Document Title</label>
                <input 
                  id="doc-title"
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Document Title (e.g. Lease Agreement 2026)" 
                  className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 rounded-xl p-3 text-sm text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/40"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="select-doc-unit" className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Target Unit</label>
                <Select value={selectedUnit || "all"} onValueChange={(val) => setSelectedUnit(val as string)}>
                  <SelectTrigger id="select-doc-unit" className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/40 rounded-xl">
                    <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-sm">
                      {selectedUnit === "all" || !selectedUnit ? "Assign to: All Units (Property-wide)" : `Assign to: ${units.find(u => u.id === selectedUnit)?.unit_label}`}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/30 rounded-xl">
                    <SelectItem value="all" className="font-semibold text-sm">Assign to: All Units (Property-wide)</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id} className="font-semibold text-sm">Assign to: {u.unit_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="doc-file" className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Select File</label>
              <input 
                id="doc-file"
                required
                type="file" 
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-[rgb(var(--ml-text-secondary))] file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:font-medium file:bg-[rgb(var(--ml-accent))] file:text-white hover:file:opacity-90 cursor-pointer pt-1"
              />
            </div>
            <Button 
              disabled={!file}
              isLoading={isSubmitting}
              type="submit" 
              className="w-full sm:w-auto bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/90 text-white font-medium px-6 py-3 rounded-lg cursor-pointer transition-opacity"
            >
              Upload Document
            </Button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="wait">
            {docsLoading ? (
              <motion.div 
                key="loading"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border border-border rounded-xl bg-[rgb(var(--ml-bg-secondary))]/60">
                    <div className="w-20 h-20 rounded-lg skeleton shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="skeleton h-4 w-3/4 rounded-md" />
                      <div className="skeleton h-3.5 w-1/3 rounded-md" />
                      <div className="skeleton h-7 w-20 rounded-lg mt-2" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : documents.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center py-12 border border-blue-500/20 shadow-[0_0_20px_rgba(96,165,250,0.04)] rounded-xl text-[rgb(var(--ml-text-secondary))] bg-[rgb(var(--ml-bg-secondary))]/60"
              >
                No documents uploaded for this property yet.
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {documents.map(doc => {
                  const isImage = doc.file_type.startsWith("image/");
                  const isPdf = doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

                  return (
                    <motion.div 
                      key={doc.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 }
                      }}
                      className="flex gap-4 p-4 border border-border rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(96,165,250,0.06)] transition-all group shadow-sm"
                    >
                      {/* Preview Thumbnail */}
                      <div className="relative w-20 h-20 border border-border rounded-lg overflow-hidden shrink-0">
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
                          <div className="w-full h-full bg-blue-500/10 text-blue-400 flex flex-col items-center justify-center gap-1">
                            <File className="h-8 w-8" />
                            <span className="text-[10px] font-bold tracking-wider uppercase text-center px-1 truncate">
                              {doc.file_key.split('.').pop() || 'FILE'}
                            </span>
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
                            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-zinc-500/10 text-zinc-400 border-zinc-500/20 font-medium">
                              {properties.find(p => p.id === selectedProperty)?.name || "Property"}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${doc.unit_id ? "bg-lime-500/10 text-lime-400 border-lime-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"} font-medium`}>
                              {getUnitLabel(doc.unit_id)}
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
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
