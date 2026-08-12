"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronDown, 
  MessageSquare, 
  Clock, 
  RefreshCcw, 
  Wrench, 
  Search, 
  Plus, 
  FileText, 
  Eye, 
  DownloadIcon,
  Building2,
  Paperclip,
  X,
  CheckCircle2
} from "lucide-react";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";
import { LightboxModal, getFriendlyFileName } from "@/components/LightboxModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadFiles } from "@/lib/upload";
import { toast } from "sonner";

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  image_urls?: string[];
  landlord_notes?: string;
  landlord_image_urls?: string[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  resolved: { label: "Resolved", color: "bg-lime-500/10 text-lime-400 border-lime-500/20" },
  closed: { label: "Closed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

function AttachmentThumbnail({ 
  url, 
  onViewImage 
}: { 
  url: string; 
  onViewImage: (url: string) => void; 
}) {
  const pathOnly = url.split("?")[0];
  const isImage = pathOnly.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || url.includes("image");
  const friendlyName = getFriendlyFileName(url);
  const rawFileName = pathOnly.split("/").pop() || "Attachment";

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

function CompactRequestCard({
  req,
  isExpanded,
  onToggle,
  onReopen,
  onCloseRequest,
  isClosing,
  onViewImage,
}: {
  req: MaintenanceRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onReopen: (id: string, e: React.MouseEvent) => void;
  onCloseRequest: (id: string, e: React.MouseEvent) => void;
  isClosing: boolean;
  onViewImage: (url: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.closed;

  const canReopen = req.status === "resolved" && (
    !req.updated_at ||
    (new Date().getTime() - new Date(req.updated_at).getTime()) < 14 * 24 * 60 * 60 * 1000
  );

  return (
    <div
      className="rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/20 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-all duration-300 hover-lift flex flex-col overflow-hidden group/card"
    >
      {/* Collapsed Card Header */}
      <div
        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none relative z-10"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 shrink-0 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
            <Wrench className="w-5.5 h-5.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-lg font-bold truncate text-[rgb(var(--ml-text-primary))] group-hover/card:text-orange-400 transition-colors">
                {req.title}
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold shrink-0 ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <div className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-2">
              <span>Reported on {new Date(req.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-border/40 pt-4 sm:pt-0">
          <div className="flex items-center gap-3 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            <span className={`px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] border ${
              req.priority === "urgent"
                ? "bg-red-500/10 text-red-500 border-red-500/25 animate-pulse"
                : req.priority === "high"
                ? "bg-orange-500/15 text-orange-400 border-orange-500/30 font-bold"
                : req.priority === "medium"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/25"
            }`}>
              {req.priority === "urgent" ? "Emergency" : req.priority}
            </span>
          </div>
          <button className="p-2 rounded-xl hover:bg-[rgb(var(--ml-bg-tertiary))] transition-colors group/btn border border-border/30 cursor-pointer">
            <ChevronDown className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover/btn:text-[rgb(var(--ml-accent))] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/40 bg-[rgb(var(--ml-bg-tertiary))]/30"
          >
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider mb-2.5">
                  Request Description
                </h4>
                <div className="text-xs sm:text-sm text-[rgb(var(--ml-text-primary))] leading-relaxed bg-[rgb(var(--ml-bg-secondary))] p-5 rounded-2xl border border-border/50 whitespace-pre-wrap font-medium shadow-sm">
                  {req.description}
                </div>
              </div>

              {req.landlord_notes && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-[rgb(var(--ml-bg-tertiary))]/40 border border-border/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[rgb(var(--ml-accent))]/10 border border-[rgb(var(--ml-accent))]/20 text-[rgb(var(--ml-accent))] flex items-center justify-center shrink-0">
                      <Building2 className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                      Landlord Note
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[rgb(var(--ml-text-secondary))] font-medium leading-relaxed whitespace-pre-wrap">
                    {req.landlord_notes}
                  </p>
                </div>
              )}

              {req.image_urls && req.image_urls.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                    Your Attachments
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {req.image_urls.map((url, idx) => (
                      <AttachmentThumbnail key={idx} url={url} onViewImage={onViewImage} />
                    ))}
                  </div>
                </div>
              )}

              {req.landlord_image_urls && req.landlord_image_urls.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                    Landlord Attachments
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {req.landlord_image_urls.map((url, idx) => (
                      <AttachmentThumbnail key={idx} url={url} onViewImage={onViewImage} />
                    ))}
                  </div>
                </div>
              )}

              {req.status === "resolved" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-lime-500/10 border border-lime-500/20 shadow-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))] font-medium">
                      Landlord marked this request as resolved. Confirm resolution by closing, or reopen if needed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => onCloseRequest(req.id, e)}
                      disabled={isClosing}
                      className="px-3.5 py-2 text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-secondary))]/80 dark:bg-[rgb(var(--ml-bg-tertiary))]/60 border border-black/10 dark:border-white/15 hover:bg-[rgb(var(--ml-bg-tertiary))] rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                      {isClosing ? "Closing..." : "Close Request"}
                    </button>
                    {canReopen && (
                      <button
                        onClick={(e) => onReopen(req.id, e)}
                        className="px-3.5 py-2 text-xs font-bold text-black bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent-light))] rounded-xl transition-all shrink-0 cursor-pointer shadow-sm active:scale-[0.98] flex items-center gap-1.5"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Reopen Request
                      </button>
                    )}
                  </div>
                </div>
              )}

              {req.status === "resolved" && !canReopen && (
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]/60 italic flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Resolved over 14 days ago — reopen window has expired.
                </p>
              )}

              <div className="border-t border-border/30 pt-4">
                <MaintenanceTimeline requestId={req.id} userType="tenant" onViewImage={onViewImage} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ReopenModalProps = {
  open: boolean;
  requestId: string | null;
  onClose: () => void;
  onSuccess: (updatedRequest: MaintenanceRequest) => void;
};

function ReopenModal({ open, requestId, onClose, onSuccess }: ReopenModalProps) {
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes("");
      setFiles([]);
    }
  }, [open]);

  if (!open || !requestId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 3) {
        toast.error("You can upload a maximum of 3 attachments.");
        return;
      }
      setFiles((prev) => [...prev, ...selected].slice(0, 3));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error("Please provide a reason/comment for reopening this request.");
      return;
    }

    setSubmitting(true);
    try {
      let image_keys: string[] | undefined = undefined;
      if (files.length > 0) {
        image_keys = await uploadFiles(files, "maintenance");
      }

      const updatedReq = await fetchAPI<MaintenanceRequest>(
        `/api/v1/tenant/maintenance/${requestId}/reopen`,
        {
          method: "POST",
          body: JSON.stringify({
            notes: notes.trim(),
            image_keys,
          }),
        }
      );

      toast.success("Maintenance request reopened successfully.");
      onSuccess(updatedReq);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to reopen request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !submitting && onClose()}>
      <DialogContent 
        overlayClassName="bg-black/40 dark:bg-black/75 backdrop-blur-md"
        className="sm:max-w-md bg-[rgb(var(--ml-bg-secondary))]/90 dark:bg-[rgb(var(--ml-bg-primary))]/85 backdrop-blur-xl border border-black/10 dark:border-white/15 ring-0 p-6 rounded-2xl shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-lime-400" />
            Reopen Maintenance Request
          </DialogTitle>
          <DialogDescription className="text-xs text-[rgb(var(--ml-text-secondary))] font-medium">
            Please explain why this request needs to be reopened and optionally attach photos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <label className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">
              Reason / Comment <span className="text-red-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              required
              placeholder="Detail what remains unresolved or any new issue..."
              className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/60 rounded-xl p-3 text-xs font-medium outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all min-h-[90px] resize-none placeholder:text-[rgb(var(--ml-text-secondary))]/50 text-[rgb(var(--ml-text-primary))]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">
              Attach Photos/Files (Optional, Max 3)
            </label>
            <div className="flex items-center gap-2">
              <label className="px-3 py-2 bg-[rgb(var(--ml-bg-primary))] border border-border/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-xs font-medium text-[rgb(var(--ml-text-primary))] rounded-xl cursor-pointer transition-all flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))]" />
                Choose Files
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  disabled={submitting || files.length >= 3}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-[rgb(var(--ml-text-secondary))]">
                {files.length}/3 selected
              </span>
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-[rgb(var(--ml-bg-primary))] border border-border/60 text-xs"
                  >
                    <span className="truncate max-w-[220px] text-[rgb(var(--ml-text-primary))] font-medium">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      disabled={submitting}
                      className="text-red-400 hover:text-red-300 transition-colors p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-xs border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[rgb(var(--ml-text-primary))]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !notes.trim()}
              className="text-xs font-bold bg-[rgb(var(--ml-accent))] text-black hover:bg-[rgb(var(--ml-accent-light))]"
            >
              {submitting ? "Reopening..." : "Submit & Reopen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TenantRequestsContent() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmReopen, setConfirmReopen] = useState<{ id: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "open" | "in_progress" | "resolved" | "closed">("ALL");

  useEffect(() => {
    async function loadAll() {
      try {
        const [reqs, prof] = await Promise.all([
          fetchAPI<MaintenanceRequest[]>("/api/v1/tenant/maintenance"),
          fetchAPI<any>("/api/v1/tenant/profile")
        ]);
        setRequests(reqs);
        setProfile(prof);
      } catch (err) {
        console.error("Failed to load requests", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const [closingId, setClosingId] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<{ id: string } | null>(null);

  const handleReopen = (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmReopen({ id: requestId });
  };

  const handleCloseRequest = (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmClose({ id: requestId });
  };

  const executeCloseRequest = async (requestId: string) => {
    setClosingId(requestId);
    try {
      const updatedReq = await fetchAPI<MaintenanceRequest>(
        `/api/v1/tenant/maintenance/${requestId}/close`,
        { method: "POST" }
      );
      toast.success("Maintenance request closed successfully.");
      setRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
    } catch (err: any) {
      toast.error(err.message || "Failed to close request.");
    } finally {
      setClosingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status filter
      if (selectedFilter !== "ALL" && req.status !== selectedFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = req.title.toLowerCase().includes(query);
        const matchesDesc = req.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [requests, selectedFilter, searchQuery]);

  return (
    <>
      <AnimatePresence>
        {previewUrl && (
          <LightboxModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      <ReopenModal
        open={!!confirmReopen}
        requestId={confirmReopen?.id || null}
        onClose={() => setConfirmReopen(null)}
        onSuccess={(updatedReq) => {
          setRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
        }}
      />

      <ConfirmDialog
        open={!!confirmClose}
        title="Close Maintenance Request"
        description="Are you sure you want to mark this request as closed? This confirms that your maintenance issue has been resolved to your satisfaction."
        confirmLabel="Yes, Close Request"
        cancelLabel="Cancel"
        variant="info"
        onCancel={() => setConfirmClose(null)}
        onConfirm={() => {
          if (confirmClose) {
            const reqId = confirmClose.id;
            setConfirmClose(null);
            executeCloseRequest(reqId);
          }
        }}
      />

      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header Section Card */}
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
                Track repair progress, view landlord updates, and submit new requests.
              </p>
            </div>

            {profile?.is_active && (
              <Link
                href="/tenant/requests/new"
                className="bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold px-6 h-11 rounded-xl hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2 text-xs shrink-0 cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                New Request
              </Link>
            )}
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
                    Submit a request whenever something in your unit needs maintenance or repair.
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
                    <CompactRequestCard
                      req={req}
                      isExpanded={expandedId === req.id}
                      onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      onReopen={handleReopen}
                      onCloseRequest={handleCloseRequest}
                      isClosing={closingId === req.id}
                      onViewImage={setPreviewUrl}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default function TenantRequestsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-[rgb(var(--ml-text-secondary))] animate-pulse">Loading requests...</div>}>
      <TenantRequestsContent />
    </Suspense>
  );
}
