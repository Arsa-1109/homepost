"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI } from "@/lib/api";
import { 
  FileIcon, 
  ImageIcon, 
  DownloadIcon, 
  Eye, 
  ChevronDown, 
  Wrench,
  AlertTriangle,
  Search,
  Building,
  InfoIcon,
  FileText
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { uploadFile } from "@/lib/upload";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";
import { LightboxModal, getFriendlyFileName, isImageUrl } from "@/components/LightboxModal";

export type Property = { id: string; name: string };
export type Unit = { id: string; unit_label: string };

export type MaintenanceRequest = {
  id: string;
  tenant_id: string;
  unit_id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  image_urls?: string[];
  landlord_notes?: string;
  landlord_image_urls?: string[];
  landlord_image_keys?: string[];
  property_name?: string;
  unit_label?: string;
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed", "open"],
  closed: [],
};

function getEmpatheticErrorMessage(rawError: string): string {
  const lowercaseError = rawError.toLowerCase();
  
  if (lowercaseError.includes("invalid status transition")) {
    if (lowercaseError.includes("from 'open'")) {
      return "Please set this request's status to 'In Progress' first so the tenant knows you are working on the issue.";
    }
    if (lowercaseError.includes("from 'in_progress'")) {
      return "Only requests currently 'In Progress' can be marked as 'Resolved'.";
    }
    return "This request status sequence is invalid. Please follow the standard workflow steps.";
  }
  
  if (lowercaseError.includes("invalid prefix") || lowercaseError.includes("invalid file key")) {
    return "One of the files you attached has an invalid format or size. Please select another file and try again.";
  }
  
  if (lowercaseError.includes("access denied") || lowercaseError.includes("forbidden")) {
    return "You do not have permission to update this maintenance request. Try logging in again.";
  }
  
  if (lowercaseError.includes("not found")) {
    return "This maintenance request could not be found. It may have been removed or updated elsewhere.";
  }
  
  return "We couldn't update the request right now. Please verify your internet connection and try again.";
}

function AttachmentThumbnail({ 
  url, 
  onViewImage 
}: { 
  url: string; 
  onViewImage: (url: string) => void; 
}) {
  const pathOnly = url.split('?')[0];
  const isImage = isImageUrl(url);
  const friendlyName = getFriendlyFileName(url);
  const rawFileName = pathOnly.split('/').pop() || "Attachment";

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isImage) {
      onViewImage(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isImage) {
    return (
      <div 
        onClick={handleView}
        className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-border/60 overflow-hidden bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-text-primary))]/30 transition-all cursor-pointer flex-shrink-0 shadow-sm"
      >
        <img 
          src={url} 
          alt={friendlyName} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <button 
            onClick={handleView}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
            title="View full size"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <a 
            href={url} 
            download 
            onClick={handleDownload}
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
            title="Download"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleView}
      className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-text-primary))]/30 transition-all flex flex-col items-center justify-between p-2.5 cursor-pointer flex-shrink-0 select-none shadow-sm"
    >
      <div className="flex-1 flex items-center justify-center">
        <FileText className="w-6 h-6 text-[rgb(var(--ml-accent))]" />
      </div>
      <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-semibold truncate w-full text-center" title={rawFileName}>
        {friendlyName}
      </span>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl z-10">
        <button 
          onClick={handleView}
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
          title="Open file"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <a 
          href={url} 
          download 
          onClick={handleDownload}
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
          title="Download"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export function RequestCard({ req, onUpdate }: { req: MaintenanceRequest, onUpdate: () => void }) {
  const [status, setStatus] = useState(req.status);
  const [notes, setNotes] = useState(req.landlord_notes || "");
  const [files, setFiles] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      let imageKeys: string[] | undefined = undefined;
      
      if (files.length > 0) {
        imageKeys = [...(req.landlord_image_keys || [])];
        for (const file of files) {
          const key = await uploadFile(file, "maintenance");
          imageKeys.push(key);
        }
      }

      await fetchAPI(`/api/v1/landlord/maintenance/${req.id}`, {
        method: "PATCH",
        body: JSON.stringify({ 
          status, 
          landlord_notes: notes || null,
          ...(imageKeys ? { landlord_image_keys: imageKeys } : {})
        }),
      });
      setFiles([]);
      toast.success("Maintenance request updated successfully!");
      setTimelineRefreshKey(k => k + 1);
      onUpdate();
    } catch (err: any) {
      const rawMsg = err.message || "Failed to update request";
      setError(getEmpatheticErrorMessage(rawMsg));
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = status !== req.status || notes !== (req.landlord_notes || "") || files.length > 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case "open": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "in_progress": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "resolved": return "bg-lime-500/10 text-lime-400 border-lime-500/20";
      case "closed": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      setFiles(selectedFiles);
    }
  };

  return (
    <div className="rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border border-border/60 flex flex-col overflow-hidden group/card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20">
      {/* Collapsed Card Header */}
      <div 
        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none relative z-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 shrink-0 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
            <Wrench className="w-5.5 h-5.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-lg font-bold truncate text-[rgb(var(--ml-text-primary))] group-hover/card:text-orange-400 transition-colors">{req.title}</h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold shrink-0 ${getStatusColor(req.status)}`}>
                {req.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-2">
              <span className="truncate">{req.property_name && req.unit_label ? `${req.property_name} • Unit ${req.unit_label}` : `Unit: ${req.unit_id}`}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-border/40 pt-4 sm:pt-0">
          <div className="flex items-center gap-4 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            <span className={`px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] border ${
              req.priority === "urgent"
                ? "bg-red-500/10 text-red-500 border-red-500/25 animate-pulse"
                : req.priority === "high"
                ? "bg-orange-500/15 text-orange-400 border-orange-500/30 font-bold"
                : req.priority === "medium"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/25"
            }`}>
              {req.priority}
            </span>
            <span className="text-[rgb(var(--ml-text-secondary))]">{new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <button className="p-2 rounded-xl group/btn border border-border/30 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]">
            <ChevronDown className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover/btn:text-[rgb(var(--ml-accent))] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expanded Case Details & Action Sidebar */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/40 bg-[rgb(var(--ml-bg-tertiary))]/30"
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Case Content */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider mb-2.5">
                      Case Description
                    </h4>
                    <div className="text-xs sm:text-sm text-[rgb(var(--ml-text-primary))] leading-relaxed bg-[rgb(var(--ml-bg-secondary))] p-5 rounded-2xl border border-border/50 whitespace-pre-wrap font-medium shadow-sm">
                      {req.description}
                    </div>
                  </div>
        
                  {req.image_urls && req.image_urls.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                        Tenant Photos & Attachments
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {req.image_urls.map((url, idx) => (
                          <AttachmentThumbnail key={idx} url={url} onViewImage={setLightboxUrl} />
                        ))}
                      </div>
                    </div>
                  )}

                  {req.landlord_image_urls && req.landlord_image_urls.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                        Landlord Resolution Files
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {req.landlord_image_urls.map((url, idx) => (
                          <AttachmentThumbnail key={idx} url={url} onViewImage={setLightboxUrl} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
      
                {/* Action Sidebar */}
                <div className="lg:w-80 flex flex-col space-y-5 border-t lg:border-t-0 lg:border-l border-border/40 pt-6 lg:pt-0 lg:pl-8">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider mb-3">
                      Update Case Status
                    </h4>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">Status</span>
                    <Select value={status} onValueChange={(val: any) => setStatus(val)} disabled={req.status === "closed"}>
                      <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/30 transition-colors h-11 rounded-xl">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                        {["open", "in_progress", "resolved", "closed"].map((opt) => {
                          const isAllowed = opt === req.status || VALID_TRANSITIONS[req.status]?.includes(opt);
                          return (
                            <SelectItem key={opt} value={opt} disabled={!isAllowed} className="rounded-lg text-xs font-semibold">
                              {opt === "in_progress" ? "In Progress" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">Landlord Notes (Optional)</span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={req.status === "closed"}
                      placeholder="Add an internal note or message to tenant..."
                      className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/60 rounded-xl p-3.5 text-xs font-medium outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all min-h-[96px] resize-none placeholder:text-[rgb(var(--ml-text-secondary))]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
        
                  <div>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">Attach Photos/Docs (Max 3)</span>
                    <div className="relative group/upload">
                      <input 
                        type="file" 
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        disabled={req.status === "closed"}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                      />
                      <div className="w-full border border-dashed border-border/70 bg-[rgb(var(--ml-bg-primary))] group-hover/upload:border-[rgb(var(--ml-text-primary))]/40 rounded-xl p-4 flex flex-col items-center justify-center gap-1 transition-all">
                        <ImageIcon className="w-5 h-5 text-[rgb(var(--ml-text-secondary))] group-hover/upload:text-[rgb(var(--ml-text-primary))] transition-colors" />
                        <span className="text-xs font-semibold text-[rgb(var(--ml-text-primary))] mt-1">Upload Files</span>
                        <span className="text-[10px] font-medium text-[rgb(var(--ml-text-secondary))]">PDF or Images</span>
                      </div>
                    </div>
                    {files.length > 0 && (
                      <p className="text-[11px] font-semibold text-[rgb(var(--ml-accent))] mt-2 px-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--ml-accent))] animate-pulse"></span>
                        {files.length} file(s) selected
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5 break-words animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-300 mb-0.5">Could not update request</p>
                        <p className="leading-relaxed text-[11px] font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpdate}
                    disabled={!hasChanges || isUpdating || req.status === "closed"}
                    className="w-full bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] text-xs font-bold h-11 rounded-xl shadow-sm disabled:opacity-40 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                  >
                    {isUpdating && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>}
                    {isUpdating ? "Updating..." : "Update Request"}
                  </button>
                </div>
              </div>

              {/* Maintenance Timeline Component */}
              <div className="mt-8 border-t border-border/30">
                <MaintenanceTimeline requestId={req.id} userType="landlord" refreshKey={timelineRefreshKey} onViewImage={setLightboxUrl} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxUrl && (
          <LightboxModal url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandlordMaintenancePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [unitsLoading, setUnitsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "open" | "in_progress" | "resolved" | "closed">("ALL");

  async function loadData() {
    try {
      const [propsData, reqsData] = await Promise.all([
        fetchAPI<Property[]>("/api/v1/landlord/properties"),
        fetchAPI<MaintenanceRequest[]>("/api/v1/landlord/maintenance")
      ]);
      setProperties(propsData);
      setRequests(reqsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedProperty || selectedProperty === "all") {
      setUnits([]);
      setSelectedUnit("all");
      return;
    }

    async function loadUnits() {
      setUnitsLoading(true);
      try {
        const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${selectedProperty}/units`);
        setUnits(data);
      } catch (err) {
        console.error(err);
        setUnits([]);
      } finally {
        setUnitsLoading(false);
      }
    }

    setSelectedUnit("all");
    loadUnits();
  }, [selectedProperty]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Property filter
      if (selectedProperty && selectedProperty !== "all") {
        const propObj = properties.find(p => p.id === selectedProperty);
        if (propObj && req.property_name && req.property_name !== propObj.name) {
          return false;
        }
      }

      // Unit filter
      if (selectedUnit && selectedUnit !== "all") {
        const unitObj = units.find(u => u.id === selectedUnit);
        if (unitObj) {
          if (req.unit_id && req.unit_id !== unitObj.id && req.unit_label !== unitObj.unit_label) {
            return false;
          }
        }
      }

      // Status filter
      if (selectedFilter !== "ALL" && req.status !== selectedFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = req.title.toLowerCase().includes(query);
        const matchesDesc = req.description.toLowerCase().includes(query);
        const matchesProp = req.property_name?.toLowerCase().includes(query);
        const matchesUnit = req.unit_label?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesProp && !matchesUnit) {
          return false;
        }
      }

      return true;
    });
  }, [requests, properties, selectedProperty, selectedUnit, units, selectedFilter, searchQuery]);

  const selectedPropertyName = selectedProperty === "all" || !selectedProperty
    ? "All Properties"
    : properties.find(p => p.id === selectedProperty)?.name || "All Properties";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Section */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              Maintenance & Repairs
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Maintenance Requests
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border flex items-center justify-center min-w-[28px] min-h-[24px]">
                {loading ? (
                  <span className="skeleton h-3 w-4 rounded-full inline-block" />
                ) : (
                  requests.length
                )}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Review and resolve property repair issues reported by tenants.
            </p>
          </div>

          {/* Property & Unit Selector Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Property Selector */}
            <div className="relative flex-1 sm:w-56">
              {loading ? (
                <div className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border border-border/60 rounded-xl h-11 flex items-center px-3">
                  <div className="skeleton h-4 w-32 rounded-md" />
                </div>
              ) : properties.length > 0 ? (
                <Select value={selectedProperty} onValueChange={(val) => setSelectedProperty(val as string)}>
                  <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border-border/60 rounded-xl h-11">
                    <span className="flex items-center gap-2 font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                      {selectedPropertyName}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                    <SelectItem value="all" className="font-semibold text-xs">All Properties</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id} className="font-semibold text-xs">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            {/* Unit Selector (visible when a property is selected) */}
            {selectedProperty && selectedProperty !== "all" && (
              <div className="relative flex-1 sm:w-48">
                {unitsLoading ? (
                  <div className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border border-border/60 rounded-xl h-11 flex items-center px-3">
                    <div className="skeleton h-4 w-24 rounded-md" />
                  </div>
                ) : (
                  <Select value={selectedUnit} onValueChange={(val) => setSelectedUnit(val as string)}>
                    <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/90 border-border/60 rounded-xl h-11">
                      <span className="flex items-center gap-2 font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                        {selectedUnit === "all" || !selectedUnit
                          ? "All Units"
                          : `Unit ${units.find(u => u.id === selectedUnit)?.unit_label || selectedUnit}`}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                      <SelectItem value="all" className="font-semibold text-xs">All Units</SelectItem>
                      {units.map(u => (
                        <SelectItem key={u.id} value={u.id} className="font-semibold text-xs">Unit {u.unit_label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: "ALL", label: "All Requests" },
              { id: "open", label: "Open" },
              { id: "in_progress", label: "In Progress" },
              { id: "resolved", label: "Resolved" },
              { id: "closed", label: "Closed" }
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                  selectedFilter === filter.id
                    ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                    : "bg-[rgb(var(--ml-bg-tertiary))]/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/40 hover:text-[rgb(var(--ml-text-primary))]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
            />
          </div>
        </div>
      </div>

      {!loading && requests.length >= 50 && (
        <Alert className="bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-text-primary))] border-[rgb(var(--ml-accent))]/20 mb-6">
          <InfoIcon className="h-4 w-4 text-[rgb(var(--ml-accent))]" color="currentColor" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>
            Showing the first 50 requests. Pagination coming soon.
          </AlertDescription>
        </Alert>
      )}

      {!loading && properties.length === 0 ? (
        <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-3">
          <Building className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No Properties Found</h3>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
            Please add a property first to manage tenant repair requests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Request Feed ({filteredRequests.length})
              </h2>
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="space-y-4"
              >
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-2xl skeleton shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-44 sm:w-56 rounded-lg skeleton" />
                          <div className="h-5 w-20 rounded-full skeleton" />
                        </div>
                        <div className="h-4 w-36 rounded-md skeleton" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div className="h-5 w-16 rounded-md skeleton" />
                      <div className="h-4 w-24 rounded-md skeleton" />
                      <div className="w-8 h-8 rounded-xl skeleton shrink-0" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : requests.length === 0 ? (
              <motion.div 
                key="empty-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                  <Wrench className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No maintenance requests</h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                    There are currently no maintenance or repair requests reported across your properties.
                  </p>
                </div>
              </motion.div>
            ) : filteredRequests.length === 0 ? (
              <motion.div
                key="empty-search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3"
              >
                <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">No matching requests</p>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Try adjusting your search or filter.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                className="space-y-4"
              >
                {filteredRequests.map(req => (
                  <motion.div 
                    key={req.id}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <RequestCard req={req} onUpdate={loadData} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
