"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { FileIcon, ImageIcon, DownloadIcon, ExternalLinkIcon, Eye, X, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { uploadFile } from "@/lib/upload";

type MaintenanceRequest = {
  id: string;
  tenant_id: string;
  unit_id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "emergency";
  created_at: string;
  image_urls?: string[];
  landlord_notes?: string;
  landlord_image_urls?: string[];
  landlord_image_keys?: string[];
  property_name?: string;
  unit_label?: string;
};

function getFriendlyFileName(url: string) {
  try {
    const pathPart = url.split('?')[0];
    const decodedPath = decodeURIComponent(pathPart);
    const baseName = decodedPath.split('/').pop() || '';
    if (!baseName) return 'Document';
    
    const lastDot = baseName.lastIndexOf('.');
    const ext = lastDot > -1 ? baseName.substring(lastDot) : '';
    
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = baseName.match(uuidRegex);
    
    if (match) {
      const uuidStr = match[0];
      let nameWithoutUuid = baseName.replace(uuidStr, '');
      
      if (ext && nameWithoutUuid.endsWith(ext)) {
        nameWithoutUuid = nameWithoutUuid.slice(0, -ext.length);
      }
      
      nameWithoutUuid = nameWithoutUuid.replace(/^[-_.]+|[-_.]+$/g, '');
      
      if (!nameWithoutUuid.trim()) {
        const isImg = ext.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
        return isImg ? `Photo${ext}` : `Document${ext}`;
      }
      
      if (nameWithoutUuid.length > 12) {
        return `${nameWithoutUuid.substring(0, 10)}...${ext}`;
      }
      return `${nameWithoutUuid}${ext}`;
    }
    
    let namePart = lastDot > -1 ? baseName.substring(0, lastDot) : baseName;
    if (namePart.length > 12) {
      return `${namePart.substring(0, 10)}...${ext}`;
    }
    return baseName;
  } catch (e) {
    return 'Document';
  }
}

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

function LightboxModal({ url, onClose }: { url: string; onClose: () => void }) {
  const friendlyName = getFriendlyFileName(url);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 focus:outline-none border border-white/10"
        aria-label="Close preview"
      >
        <X className="w-5 h-5" />
      </button>

      <div 
        className="relative max-w-[90vw] max-h-[80vh] md:max-w-[80vw] md:max-h-[85vh] flex flex-col items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={url} 
          alt="Full resolution attachment" 
          className="object-contain max-w-full max-h-[75vh] rounded-lg shadow-2xl border border-white/10 select-none animate-scaleIn"
        />
        
        <div className="mt-4 flex items-center gap-4 bg-[#1a1a1a]/95 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
          <span className="text-xs text-white/80 font-medium truncate max-w-[200px] sm:max-w-xs" title={url.split('?')[0].split('/').pop() || "Attachment"}>
            {friendlyName}
          </span>
          <div className="w-[1px] h-3 bg-white/25" />
          <a 
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--ml-accent))] hover:text-foreground font-semibold transition-colors"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
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
        className="group relative w-32 h-32 rounded-lg border border-[rgb(var(--ml-border))] overflow-hidden bg-[#121212] hover:border-[rgb(var(--ml-accent))] transition-colors cursor-pointer flex-shrink-0"
      >
        <img 
          src={url} 
          alt={friendlyName} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
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
      className="group relative w-32 h-32 rounded-lg border border-[rgb(var(--ml-border))] bg-[#1a1a1a] hover:border-[rgb(var(--ml-accent))] transition-colors flex flex-col items-center justify-between p-3 cursor-pointer flex-shrink-0 select-none"
    >
      <div className="flex-1 flex items-center justify-center">
        <FileIcon className="w-10 h-10 text-[rgb(var(--ml-accent))]" />
      </div>
      <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium truncate w-full text-center" title={rawFileName}>
        {friendlyName}
      </span>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg z-10">
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

function RequestCard({ req, onUpdate }: { req: MaintenanceRequest, onUpdate: () => void }) {
  const [status, setStatus] = useState(req.status);
  const [notes, setNotes] = useState(req.landlord_notes || "");
  const [files, setFiles] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      let imageKeys: string[] | undefined = undefined;
      
      if (files.length > 0) {
        imageKeys = [];
        for (const file of files) {
          const key = await uploadFile(file, "maintenance");
          imageKeys.push(key);
        }
        // If there were existing keys and we want to append, we would do:
        // imageKeys = [...(req.landlord_image_keys || []), ...imageKeys];
        // But for simplicity, we'll replace or just use the new ones if provided.
        // Wait, if they upload new files, let's append to existing (up to 3 max in backend).
        // Actually, replacing is safer to avoid exceeding 3 without delete UI.
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
      case "open": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "in_progress": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "resolved": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "closed": return "bg-gray-500/20 text-gray-500 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      setFiles(selectedFiles);
    }
  };

  return (
    <div className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-xl">{req.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-bold ${getStatusColor(req.status)}`}>
            {req.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mb-2">
          {req.property_name && req.unit_label ? `${req.property_name} • ${req.unit_label}` : `Unit: ${req.unit_id}`}
        </p>
        <p className="text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap">{req.description}</p>
        
        {req.image_urls && req.image_urls.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block">Tenant Photos & Context:</span>
            <div className="flex flex-wrap gap-4 pt-1">
              {req.image_urls.map((url, idx) => (
                <AttachmentThumbnail 
                  key={idx} 
                  url={url} 
                  onViewImage={setLightboxUrl} 
                />
              ))}
            </div>
          </div>
        )}

        {req.landlord_image_urls && req.landlord_image_urls.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block">Landlord Resolution Files:</span>
            <div className="flex flex-wrap gap-4 pt-1">
              {req.landlord_image_urls.map((url, idx) => (
                <AttachmentThumbnail 
                  key={idx} 
                  url={url} 
                  onViewImage={setLightboxUrl} 
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-[rgb(var(--ml-text-secondary))] flex gap-4 pt-2">
          <span>Priority: {req.priority.toUpperCase()}</span>
          <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="md:w-64 flex flex-col space-y-3 border-t md:border-t-0 md:border-l border-[rgb(var(--ml-border))] pt-4 md:pt-0 md:pl-6">
        <div>
          <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mb-1 block uppercase tracking-wide">Status</span>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            disabled={req.status === "closed"}
            className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-2 text-sm outline-none focus:border-[rgb(var(--ml-accent))] appearance-none w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {["open", "in_progress", "resolved", "closed"].map((opt) => {
              const isAllowed = opt === req.status || VALID_TRANSITIONS[req.status]?.includes(opt);
              return (
                <option 
                  key={opt} 
                  value={opt} 
                  disabled={!isAllowed}
                  className="bg-background disabled:text-gray-500"
                >
                  {opt === "in_progress" ? "In Progress" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mb-1 block uppercase tracking-wide">Landlord Notes (Optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a comment or internal note..."
            className="w-full bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-2 text-sm outline-none focus:border-[rgb(var(--ml-accent))] min-h-[80px] resize-y"
          />
        </div>
        
        <div>
          <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mb-1 block uppercase tracking-wide">Attach Photos/Docs (Max 3)</span>
          <input 
            type="file" 
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="w-full text-xs text-[rgb(var(--ml-text-secondary))] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[rgb(var(--ml-accent))] file:text-white hover:file:opacity-90 cursor-pointer"
          />
          {files.length > 0 && (
            <p className="text-[10px] text-[rgb(var(--ml-text-secondary))] mt-1">
              {files.length} file(s) selected
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2 break-words animate-fadeIn">
            <span className="text-sm select-none mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-red-300 mb-0.5">Could not update request</p>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleUpdate}
          disabled={!hasChanges || isUpdating}
          className="w-full bg-[rgb(var(--ml-accent))] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-auto"
        >
          {isUpdating ? "Updating..." : "Update Request"}
        </button>
      </div>

      {lightboxUrl && (
        <LightboxModal url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Maintenance Requests 🔧</h1>

      {!loading && requests.length >= 50 && (
        <Alert className="bg-orange-500/10 text-orange-600 border-orange-500/20">
          <InfoIcon className="h-4 w-4" color="currentColor" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>
            Showing the first 50 requests. Pagination coming soon.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col md:flex-row gap-6 animate-pulse">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1/3 bg-[rgb(var(--ml-border))] rounded-md"></div>
                  <div className="h-6 w-24 bg-[rgb(var(--ml-border))] rounded-full"></div>
                </div>
                <div className="h-4 w-1/4 bg-[rgb(var(--ml-border))] rounded-md"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full bg-[rgb(var(--ml-border))] rounded-md"></div>
                  <div className="h-4 w-full bg-[rgb(var(--ml-border))] rounded-md"></div>
                  <div className="h-4 w-2/3 bg-[rgb(var(--ml-border))] rounded-md"></div>
                </div>
                <div className="flex gap-4 pt-4">
                  <div className="h-3 w-20 bg-[rgb(var(--ml-border))] rounded-md"></div>
                  <div className="h-3 w-24 bg-[rgb(var(--ml-border))] rounded-md"></div>
                </div>
              </div>
              <div className="md:w-64 flex flex-col space-y-4 border-t md:border-t-0 md:border-l border-[rgb(var(--ml-border))] pt-4 md:pt-0 md:pl-6">
                <div className="h-10 w-full bg-[rgb(var(--ml-border))] rounded-md"></div>
                <div className="h-20 w-full bg-[rgb(var(--ml-border))] rounded-md"></div>
                <div className="h-10 w-full bg-[rgb(var(--ml-border))] rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl text-[rgb(var(--ml-text-secondary))]">
          No maintenance requests across your properties.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <RequestCard key={req.id} req={req} onUpdate={loadData} />
          ))}
        </div>
      )}
    </div>
  );
}
