"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { uploadFile } from "@/lib/upload";
import {
  FileText,
  FileImage,
  Download,
  Eye,
  File,
  Search,
  Upload,
  Calendar,
  Building,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [docsLoading, setDocsLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadProps() {
      try {
        const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
        setProperties(data);
        if (data.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const initialPropertyId = urlParams.get("property_id");
          if (
            initialPropertyId &&
            data.some((p) => p.id === initialPropertyId)
          ) {
            setSelectedProperty(initialPropertyId);
          } else {
            setSelectedProperty(data[0].id);
          }
        } else {
          setDocsLoading(false);
        }
      } catch (err) {
        console.error(err);
        setDocsLoading(false);
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
        const data = await fetchAPI<Unit[]>(
          `/api/v1/landlord/properties/${selectedProperty}/units`,
        );
        setUnits(data);
      } catch (err) {
        console.error(err);
      }
    }

    // Load documents for the selected property
    async function loadDocs() {
      setDocsLoading(true);
      try {
        const data = await fetchAPI<Document[]>(
          `/api/v1/landlord/properties/${selectedProperty}/documents`,
        );
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
        file_type: file.type || "application/octet-stream",
      };

      if (selectedUnit && selectedUnit !== "all") {
        payload.unit_id = selectedUnit;
      }

      const newDoc = await fetchAPI<Document>("/api/v1/landlord/documents", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setDocuments((prev) => [newDoc, ...prev]);
      setTitle("");
      setFile(null);
      setSelectedUnit("");
      setShowUploadForm(false);
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
        `/api/v1/uploads/download-url?file_key=${encodeURIComponent(fileKey)}&download=true`,
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

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (selectedFilter === "PROPERTY_WIDE") {
        matchesFilter = !doc.unit_id;
      } else if (selectedFilter !== "ALL") {
        matchesFilter = doc.unit_id === selectedFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [documents, searchQuery, selectedFilter]);

  // Helper to find unit label
  const getUnitLabel = (unitId: string | null | undefined) => {
    if (!unitId) return "Property-Wide";
    const unit = units.find((u) => u.id === unitId);
    return unit ? `Unit ${unit.unit_label}` : "Unknown Unit";
  };

  const renderPreview = (doc: Document) => {
    const isImage = doc.file_type.startsWith("image/");
    const isPdf =
      doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

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
          <span className="text-[10px] font-black tracking-widest uppercase text-rose-500/90 dark:text-rose-300">
            PDF
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-indigo-950/20 text-indigo-500 dark:text-indigo-400 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
          <File className="h-6 w-6 text-indigo-500" />
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase text-indigo-500/90 dark:text-indigo-300">
          DOC
        </span>
      </div>
    );
  };

  const getFileBadge = (fileType: string, fileKey: string) => {
    if (fileType.startsWith("image/"))
      return {
        label: "Image",
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
    if (fileType === "application/pdf" || fileKey.endsWith(".pdf"))
      return {
        label: "PDF",
        color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      };
    if (fileType.includes("word") || fileType.includes("officedocument"))
      return {
        label: "Word",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      };
    return {
      label: "File",
      color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
  };

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "Property";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Section */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              Document Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Property Documents
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border flex items-center justify-center min-w-[28px] min-h-[24px]">
                {loading || docsLoading ? (
                  <span className="skeleton h-3 w-4 rounded-full inline-block" />
                ) : (
                  documents.length
                )}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Upload and manage leases, agreements, and property notices for
              your tenants.
            </p>
          </div>

          {/* Action & Property Selector Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Property Switcher */}
            <div className="relative flex-1 sm:w-56">
              {loading ? (
                <div className="skeleton h-11 w-full rounded-xl" />
              ) : properties.length > 0 ? (
                <Select
                  value={selectedProperty}
                  onValueChange={(val) => setSelectedProperty(val as string)}
                >
                  <SelectTrigger
                    id="select-doc-property"
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border-border/60 rounded-xl h-11"
                  >
                    <span className="flex items-center gap-2 font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                      {selectedPropertyName}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                    {properties.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="font-semibold text-xs"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            {/* Upload Modal Toggle Button */}
            {properties.length > 0 && (
              <Button
                onClick={() => setShowUploadForm((prev) => !prev)}
                className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
              >
                {showUploadForm ? (
                  <FolderOpen className="w-4 h-4" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>
                  {showUploadForm ? "Hide Upload Form" : "Upload Document"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
          {/* Filter Pills & Select */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                selectedFilter === "ALL"
                  ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                  : "bg-[rgb(var(--ml-bg-tertiary))]/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/40 hover:text-[rgb(var(--ml-text-primary))]"
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setSelectedFilter("PROPERTY_WIDE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                selectedFilter === "PROPERTY_WIDE"
                  ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                  : "bg-[rgb(var(--ml-bg-tertiary))]/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/40 hover:text-[rgb(var(--ml-text-primary))]"
              }`}
            >
              Property-Wide
            </button>

            {units.length > 0 && (
              <div className="min-w-[140px]">
                <Select
                  value={
                    selectedFilter !== "ALL" &&
                    selectedFilter !== "PROPERTY_WIDE"
                      ? selectedFilter
                      : ""
                  }
                  onValueChange={(val) => setSelectedFilter(val as string)}
                >
                  <SelectTrigger
                    className={`h-8 rounded-xl text-xs font-semibold border transition-all ${
                      selectedFilter !== "ALL" &&
                      selectedFilter !== "PROPERTY_WIDE"
                        ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                        : "bg-[rgb(var(--ml-bg-tertiary))]/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/40"
                    }`}
                  >
                    <span className="truncate">
                      {selectedFilter !== "ALL" &&
                      selectedFilter !== "PROPERTY_WIDE"
                        ? `Unit ${units.find((u) => u.id === selectedFilter)?.unit_label || ""}`
                        : "Specific Unit..."}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-60 overflow-y-auto">
                    {units.map((unit) => (
                      <SelectItem
                        key={unit.id}
                        value={unit.id}
                        className="font-semibold text-xs cursor-pointer"
                      >
                        Unit {unit.unit_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
            />
          </div>
        </div>
      </div>

      {!loading && properties.length === 0 ? (
        <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-3">
          <Building className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
            No Properties Found
          </h3>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
            Please add a property first before uploading documents for your
            units.
          </p>
        </div>
      ) : (
        <>
          {/* Upload Form (Collapsible) */}
          <AnimatePresence>
            {showUploadForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleUpload}
                  className="p-6 sm:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-border rounded-3xl space-y-5 shadow-md mb-8"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
                        <Upload className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                        Upload New Document
                      </h2>
                      <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                        Targeting{" "}
                        <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                          {selectedPropertyName}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="doc-title"
                        className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]"
                      >
                        Document Title
                      </label>
                      <input
                        id="doc-title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Move-in Checklist 2026"
                        className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="select-doc-unit"
                        className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]"
                      >
                        Target Scope / Unit
                      </label>
                      <Select
                        value={selectedUnit || "all"}
                        onValueChange={(val) => setSelectedUnit(val as string)}
                      >
                        <SelectTrigger
                          id="select-doc-unit"
                          className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11"
                        >
                          <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-xs text-[rgb(var(--ml-text-primary))]">
                            {selectedUnit === "all" || !selectedUnit
                              ? "Assign to: All Units (Property-wide)"
                              : `Assign to: Unit ${units.find((u) => u.id === selectedUnit)?.unit_label}`}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                          <SelectItem
                            value="all"
                            className="font-semibold text-xs"
                          >
                            Assign to: All Units (Property-wide)
                          </SelectItem>
                          {units.map((u) => (
                            <SelectItem
                              key={u.id}
                              value={u.id}
                              className="font-semibold text-xs"
                            >
                              Assign to: Unit {u.unit_label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="doc-file"
                      className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]"
                    >
                      Select File
                    </label>
                    <div className="relative border-2 border-dashed border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 bg-[rgb(var(--ml-bg-primary))]/30 hover:bg-[rgb(var(--ml-bg-primary))]/60 transition-all duration-200 ease-out rounded-2xl p-4 text-center">
                      <input
                        id="doc-file"
                        required
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-[rgb(var(--ml-text-secondary))] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-bold file:text-xs file:bg-[rgb(var(--ml-text-primary))] file:text-[rgb(var(--ml-bg-primary))] hover:file:opacity-90 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUploadForm(false)}
                      className="rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!file}
                      isLoading={isSubmitting}
                      type="submit"
                      className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-6 py-2.5 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                    >
                      Upload Document
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Document Library ({filteredDocuments.length})
              </h2>
            </div>

            {loading || docsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-4"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-24 h-24 rounded-xl skeleton shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2.5 py-1">
                        <div className="flex items-center gap-1.5">
                          <div className="skeleton h-4 w-14 rounded-md" />
                          <div className="skeleton h-4 w-20 rounded-md" />
                        </div>
                        <div className="skeleton h-5 w-4/5 rounded-lg" />
                        <div className="skeleton h-3.5 w-24 rounded-md" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
                      <div className="skeleton h-9 rounded-xl" />
                      <div className="skeleton h-9 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                    No Documents Uploaded
                  </h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    No files have been uploaded for{" "}
                    <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                      {selectedPropertyName}
                    </span>{" "}
                    yet. Click "Upload Document" to add your first file.
                  </p>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3">
                <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                  No matching documents
                </p>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Try adjusting your search query or file filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDocuments.map((doc) => {
                  const badge = getFileBadge(doc.file_type, doc.file_key);
                  return (
                    <div
                      key={doc.id}
                      className="group relative flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20"
                    >
                      <div className="flex gap-4 items-start">
                        {/* Thumbnail Preview Container */}
                        <div className="relative w-24 h-24 rounded-xl border border-border/60 overflow-hidden shrink-0 shadow-inner bg-[rgb(var(--ml-bg-primary))]">
                          {renderPreview(doc)}
                        </div>

                        {/* Document Meta Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold truncate ${
                                  doc.unit_id
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                }`}
                              >
                                {getUnitLabel(doc.unit_id)}
                              </span>
                            </div>
                            <h3 className="font-bold text-base text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-text-primary))]/80 transition-colors line-clamp-2 leading-tight pt-0.5">
                              {doc.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium">
                            <Calendar className="w-3 h-3 text-[rgb(var(--ml-text-secondary))]/70" />
                            <span>
                              {new Date(doc.created_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-border/40">
                        {doc.file_url ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="w-full h-9 rounded-xl text-[rgb(var(--ml-text-primary))] font-semibold text-xs gap-1.5 transition-all duration-200 ease-out active:scale-[0.98] border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))]"
                          >
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))]" />
                              View
                            </a>
                          </Button>
                        ) : (
                          <div />
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleDownload(doc.file_key, doc.title)
                          }
                          className="w-full h-9 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs gap-1.5 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
