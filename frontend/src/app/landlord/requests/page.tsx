"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI } from "@/lib/api";
import { 
  FileIcon, 
  ImageIcon, 
  DownloadIcon, 
  Eye, 
  X, 
  InfoIcon, 
  ChevronDown, 
  Wrench,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { uploadFile } from "@/lib/upload";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";
import { LightboxModal, getFriendlyFileName } from "@/components/LightboxModal";

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
  const isImage = pathOnly.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || url.includes("image");
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
        className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-[rgb(var(--ml-border))]/50 overflow-hidden bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-accent))] transition-all cursor-pointer flex-shrink-0"
      >
        <img 
          src={url} 
          alt={friendlyName} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <button 
            onClick={handleView}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            title="View full size"
          >
            <Eye className="w-4 h-4" />
          </button>
          <a 
            href={url} 
            download 
            onClick={handleDownload}
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            title="Download"
          >
            <DownloadIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleView}
      className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-[rgb(var(--ml-border))]/50 bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-accent))] transition-all flex flex-col items-center justify-between p-3 cursor-pointer flex-shrink-0 select-none"
    >
      <div className="flex-1 flex items-center justify-center">
        <FileIcon className="w-8 h-8 text-[rgb(var(--ml-accent))]" />
      </div>
      <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium truncate w-full text-center" title={rawFileName}>
        {friendlyName}
      </span>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl z-10">
        <button 
          onClick={handleView}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
          title="Open file"
        >
          <Eye className="w-4 h-4" />
        </button>
        <a 
          href={url} 
          download 
          onClick={handleDownload}
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
          title="Download"
        >
          <DownloadIcon className="w-4 h-4" />
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
      case "open": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "resolved": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "closed": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      setFiles(selectedFiles);
    }
  };

  return (
    <div className="rounded-3xl backdrop-blur-xl bg-[rgb(var(--ml-bg-secondary))]/60 border border-[rgb(var(--ml-border))]/50 shadow-[0_15px_35px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden transition-all hover:border-[rgb(var(--ml-accent))]/30 group/card">
      <div 
        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none relative z-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/10 shrink-0 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
            <Wrench className="w-5.5 h-5.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-lg font-bold truncate text-[rgb(var(--ml-text-primary))] group-hover/card:text-[rgb(var(--ml-accent))] transition-colors">{req.title}</h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold shrink-0 ${getStatusColor(req.status)}`}>
                {req.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-2">
              <span className="truncate">{req.property_name && req.unit_label ? `${req.property_name} • Unit ${req.unit_label}` : `Unit: ${req.unit_id}`}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-[rgb(var(--ml-border))]/40 pt-4 sm:pt-0">
          <div className="flex items-center gap-4 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            <span className={`px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] border ${
              req.priority === "urgent"
                ? "bg-red-500/10 text-red-500 border-red-500/25 animate-pulse"
                : req.priority === "high"
                ? "bg-orange-500/10 text-orange-500 border-orange-500/25"
                : req.priority === "medium"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                : "bg-gray-500/10 text-gray-400 border-gray-500/25"
            }`}>
              {req.priority}
            </span>
            <span className="text-[rgb(var(--ml-text-muted))]">{new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <button className="p-2 rounded-xl hover:bg-[rgb(var(--ml-bg-tertiary))] transition-colors group/btn border border-[rgb(var(--ml-border))]/30">
            <ChevronDown className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover/btn:text-[rgb(var(--ml-accent))] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-[rgb(var(--ml-border))]/50"
          >
            <div className="p-6 bg-[rgb(var(--ml-bg-primary))]/20">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-widest mb-2.5">Description</h4>
                    <p className="text-sm text-[rgb(var(--ml-text-primary))] leading-relaxed bg-[rgb(var(--ml-bg-primary))]/40 p-5 rounded-2xl border border-[rgb(var(--ml-border))]/30 whitespace-pre-wrap">
                      {req.description}
                    </p>
                  </div>
        
                  {req.image_urls && req.image_urls.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-widest block">Tenant Photos & Context:</span>
                      <div className="flex flex-wrap gap-4">
                        {req.image_urls.map((url, idx) => (
                          <AttachmentThumbnail key={idx} url={url} onViewImage={setLightboxUrl} />
                        ))}
                      </div>
                    </div>
                  )}

                  {req.landlord_image_urls && req.landlord_image_urls.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-widest block">Landlord Resolution Files:</span>
                      <div className="flex flex-wrap gap-4">
                        {req.landlord_image_urls.map((url, idx) => (
                          <AttachmentThumbnail key={idx} url={url} onViewImage={setLightboxUrl} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
      
                <div className="md:w-80 flex flex-col space-y-4 border-t md:border-t-0 md:border-l border-[rgb(var(--ml-border))]/50 pt-6 md:pt-0 md:pl-6">
                  <div>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-2 block uppercase tracking-widest">Status</span>
                    <Select value={status} onValueChange={(val: any) => setStatus(val)} disabled={req.status === "closed"}>
                      <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/40 border-[rgb(var(--ml-border))]/40 hover:bg-[rgb(var(--ml-bg-primary))]/70 transition-colors h-10 rounded-xl">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-[rgb(var(--ml-border))] rounded-xl">
                        {["open", "in_progress", "resolved", "closed"].map((opt) => {
                          const isAllowed = opt === req.status || VALID_TRANSITIONS[req.status]?.includes(opt);
                          return (
                            <SelectItem key={opt} value={opt} disabled={!isAllowed} className="rounded-lg">
                              {opt === "in_progress" ? "In Progress" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-2 block uppercase tracking-widest">Landlord Notes (Optional)</span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={req.status === "closed"}
                      placeholder="Add a comment or internal note..."
                      className="w-full bg-[rgb(var(--ml-bg-primary))]/40 border border-[rgb(var(--ml-border))]/40 rounded-2xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/10 hover:bg-[rgb(var(--ml-bg-primary))]/70 transition-all min-h-[90px] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
        
                  <div>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-2 block uppercase tracking-widest">Attach Photos/Docs (Max 3)</span>
                    <div className="relative group/upload">
                      <input 
                        type="file" 
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        disabled={req.status === "closed"}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                      />
                      <div className="w-full border border-dashed border-[rgb(var(--ml-border))]/70 bg-[rgb(var(--ml-bg-primary))]/40 group-hover/upload:border-[rgb(var(--ml-accent))]/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 transition-all">
                        <ImageIcon className="w-5 h-5 text-[rgb(var(--ml-text-secondary))] group-hover/upload:text-[rgb(var(--ml-accent))] transition-colors" />
                        <span className="text-xs font-semibold text-[rgb(var(--ml-text-primary))] mt-1">Upload Files</span>
                        <span className="text-[10px] text-[rgb(var(--ml-text-secondary))]">PDF or Images</span>
                      </div>
                    </div>
                    {files.length > 0 && (
                      <p className="text-[11px] font-medium text-[rgb(var(--ml-accent))] mt-2 px-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--ml-accent))] animate-pulse"></span>
                        {files.length} file(s) selected
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-start gap-2 break-words animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-300 mb-0.5">Could not update request</p>
                        <p className="leading-relaxed">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpdate}
                    disabled={!hasChanges || isUpdating || req.status === "closed"}
                    className="w-full bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/90 text-white text-sm font-semibold h-11 rounded-xl transition-all shadow-md shadow-[rgb(var(--ml-accent))]/10 hover:shadow-[rgb(var(--ml-accent))]/20 active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                  >
                    {isUpdating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                    {isUpdating ? "Updating..." : "Update Request"}
                  </button>
                </div>
              </div>

              <div className="mt-8 border-t border-[rgb(var(--ml-border))]/30">
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
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const data = await fetchAPI<MaintenanceRequest[]>("/api/v1/landlord/maintenance");
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-screen relative">
      {/* Background orbs */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[rgb(var(--ml-accent))]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-8 flex flex-col gap-2 relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-2xl shadow-inner border border-orange-500/10">
            <Wrench className="w-6 h-6" />
          </div>
          Maintenance Requests
        </h1>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] pl-1">
          Review and resolve property repair issues reported by tenants.
        </p>
      </div>

      {!loading && requests.length >= 50 && (
        <Alert className="bg-orange-500/10 text-orange-600 border-orange-500/20 mb-6">
          <InfoIcon className="h-4 w-4" color="currentColor" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>
            Showing the first 50 requests. Pagination coming soon.
          </AlertDescription>
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="space-y-6"
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 rounded-3xl border border-[rgb(var(--ml-border))]/50 bg-[rgb(var(--ml-bg-secondary))]/40 flex flex-col md:flex-row gap-6 animate-pulse">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-1/3 bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                    <div className="h-6 w-24 bg-[rgb(var(--ml-border))]/40 rounded-full"></div>
                  </div>
                  <div className="h-4 w-1/4 bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                  <div className="space-y-2 pt-2">
                    <div className="h-4 w-full bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                    <div className="h-4 w-full bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                    <div className="h-4 w-2/3 bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <div className="h-3 w-20 bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                    <div className="h-3 w-24 bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                  </div>
                </div>
                <div className="md:w-80 flex flex-col space-y-4 border-t md:border-t-0 md:border-l border-[rgb(var(--ml-border))]/40 pt-4 md:pt-0 md:pl-6">
                  <div className="h-10 w-full bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                  <div className="h-20 w-full bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                  <div className="h-10 w-full bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : requests.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={Wrench}
              title="No Requests"
              description="There are no maintenance requests across your properties."
            />
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
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="space-y-6"
          >
            {requests.map(req => (
              <motion.div 
                key={req.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
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
  );
}
