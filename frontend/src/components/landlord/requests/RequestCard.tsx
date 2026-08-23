"use client";

import { errorMessage } from "@/lib/errors";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  AlertTriangle,
  ChevronDown,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadFile } from "@/lib/upload";
import { fetchAPI } from "@/lib/api";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";
import { LightboxModal } from "@/components/LightboxModal";
import { AttachmentThumbnail } from "./AttachmentThumbnail";
import { StagedAttachmentThumbnail } from "./StagedAttachmentThumbnail";

export interface MaintenanceRequest {
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

  if (lowercaseError.includes("demo accounts cannot")) {
    return rawError;
  }

  if (
    lowercaseError.includes("unsupported file type") ||
    lowercaseError.includes("invalid content") ||
    lowercaseError.includes("corrupted file")
  ) {
    return rawError;
  }

  if (lowercaseError.includes("too large") || lowercaseError.includes("10mb")) {
    return "One of the files exceeds the 10MB limit. Please select a smaller file.";
  }

  if (lowercaseError.includes("invalid prefix") || lowercaseError.includes("invalid file key")) {
    return "One of the files you attached has an invalid format or key. Please select another file and try again.";
  }

  if (
    lowercaseError.includes("access denied") ||
    lowercaseError.includes("forbidden") ||
    lowercaseError.includes("permission")
  ) {
    return "You do not have permission to perform this action.";
  }

  if (lowercaseError.includes("not found")) {
    return "This maintenance request could not be found. It may have been removed or updated elsewhere.";
  }

  if (
    lowercaseError.includes("unable to connect") ||
    lowercaseError.includes("failed to fetch") ||
    lowercaseError.includes("network")
  ) {
    return "Unable to connect to the server. Please verify your internet connection or ensure the backend is running.";
  }

  return rawError || "We couldn't update the request right now. Please try again.";
}

export interface RequestCardProps {
  req: MaintenanceRequest;
  onUpdate: () => void;
  defaultExpanded?: boolean;
  isHighlighted?: boolean;
}

export function RequestCard({
  req,
  onUpdate,
  defaultExpanded = false,
  isHighlighted = false,
}: RequestCardProps) {
  const [status, setStatus] = useState(req.status);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  useEffect(() => {
    if (defaultExpanded) {
      setIsExpanded(true);
    }
  }, [defaultExpanded]);

  useEffect(() => {
    setStatus(req.status);
  }, [req.status]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      let newImageKeys: string[] = [];

      if (files.length > 0) {
        for (const file of files) {
          const key = await uploadFile(file, "maintenance");
          newImageKeys.push(key);
        }
      }

      const payload: Record<string, any> = { status };
      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        payload.landlord_notes = trimmedNotes;
      }
      if (newImageKeys.length > 0) {
        payload.landlord_image_keys = newImageKeys;
        payload.attachments = newImageKeys;
      }

      await fetchAPI(`/api/v1/landlord/maintenance/${req.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setNotes("");
      setFiles([]);
      toast.success("Maintenance request updated successfully!");
      setTimelineRefreshKey((k) => k + 1);
      onUpdate();
    } catch (err) {
      const rawMsg = errorMessage(err) || "Failed to update request";
      setError(getEmpatheticErrorMessage(rawMsg));
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges =
    status !== req.status || notes.trim().length > 0 || files.length > 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case "open":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "in_progress":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "resolved":
        return "bg-lime-500/10 text-lime-400 border-lime-500/20";
      case "closed":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const ALLOWED_EXTS = [
        ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
        ".pdf", ".doc", ".docx", ".mp4", ".mov", ".webm", ".m4v"
      ];
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB

      if (files.length + selectedFiles.length > 3) {
        toast.error(
          `You can attach up to 3 files per update. You currently have ${files.length} file(s) selected.`
        );
        e.target.value = "";
        return;
      }

      for (const file of selectedFiles) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ALLOWED_EXTS.includes(ext)) {
          toast.error(
            `"${file.name}" has an unsupported file type.`
          );
          e.target.value = "";
          return;
        }
        if (file.size > MAX_SIZE) {
          toast.error(
            `"${file.name}" exceeds the 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`
          );
          e.target.value = "";
          return;
        }
      }
      setFiles((prev) => [...prev, ...selectedFiles].slice(0, 3));
      e.target.value = "";
    }
  };

  return (
    <div
      id={`request-${req.id}`}
      className={`rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border flex flex-col overflow-hidden group/card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20 ${
        isHighlighted
          ? "border-[rgb(var(--ml-accent))] ring-2 ring-[rgb(var(--ml-accent))] shadow-[0_0_28px_rgba(var(--ml-accent),0.35)] scale-[1.01]"
          : "border-border/60"
      }`}
    >
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
              <h3 className="text-lg font-bold truncate text-[rgb(var(--ml-text-primary))] group-hover/card:text-orange-400 transition-colors">
                {req.title}
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold shrink-0 ${getStatusColor(
                  req.status
                )}`}
              >
                {req.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-2">
              <span className="truncate">
                {req.property_name && req.unit_label
                  ? `${req.property_name} • ${req.unit_label}`
                  : `Unit: ${req.unit_id}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-border/40 pt-4 sm:pt-0">
          <div className="flex items-center gap-4 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            <span
              className={`px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] border ${
                req.priority === "urgent"
                  ? "bg-red-500/10 text-red-500 border-red-500/25 animate-pulse"
                  : req.priority === "high"
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30 font-bold"
                  : req.priority === "medium"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/25"
              }`}
            >
              {req.priority}
            </span>
            <span className="text-[rgb(var(--ml-text-secondary))]">
              {new Date(req.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <button
            type="button"
            className="p-2 rounded-xl group/btn border border-border/30 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
          >
            <ChevronDown
              className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover/btn:text-[rgb(var(--ml-accent))] transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
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

                  {/* Active Landlord Notes / Latest Resolution Summary */}
                  {(req.landlord_notes ||
                    (req.landlord_image_urls && req.landlord_image_urls.length > 0)) && (
                    <div className="space-y-3 p-5 rounded-2xl bg-[rgb(var(--ml-accent))]/5 border border-[rgb(var(--ml-accent))]/20 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-accent))] uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
                          Latest Landlord Notes / Resolution Summary
                        </h4>
                      </div>
                      {req.landlord_notes && (
                        <div className="text-xs sm:text-sm text-[rgb(var(--ml-text-primary))] leading-relaxed whitespace-pre-wrap font-medium">
                          {req.landlord_notes}
                        </div>
                      )}
                      {req.landlord_image_urls && req.landlord_image_urls.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block mb-2">
                            Resolution Files ({req.landlord_image_urls.length})
                          </span>
                          <div className="flex flex-wrap gap-3">
                            {req.landlord_image_urls.map((url, idx) => (
                              <AttachmentThumbnail key={idx} url={url} onViewImage={setLightboxUrl} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Sidebar: Action Composer */}
                <div className="lg:w-80 flex flex-col space-y-5 border-t lg:border-t-0 lg:border-l border-border/40 pt-6 lg:pt-0 lg:pl-8">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider mb-3">
                      Update Case Status
                    </h4>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">
                      Status
                    </span>
                    <Select
                      value={status}
                      onValueChange={(val) => setStatus(val as typeof req.status)}
                      disabled={req.status === "closed"}
                    >
                      <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/30 transition-colors h-11 rounded-xl">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                        {["open", "in_progress", "resolved", "closed"].map((opt) => {
                          const isAllowed =
                            opt === req.status || VALID_TRANSITIONS[req.status]?.includes(opt);
                          return (
                            <SelectItem
                              key={opt}
                              value={opt}
                              disabled={!isAllowed}
                              className="rounded-lg text-xs font-semibold"
                            >
                              {opt === "in_progress"
                                ? "In Progress"
                                : opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">
                      Add Update Note (Optional)
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={req.status === "closed"}
                      placeholder="Add an update or resolution note for this action..."
                      className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/60 rounded-xl p-3.5 text-xs font-medium outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all min-h-[96px] resize-none placeholder:text-[rgb(var(--ml-text-secondary))]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider">
                        Attach Files to Update (Max 3)
                      </span>
                      <span className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))]">
                        {files.length}/3
                      </span>
                    </div>

                    {files.length < 3 && req.status !== "closed" && (
                      <div className="relative group/upload">
                        <input
                          type="file"
                          multiple
                          accept="image/*,application/pdf,.doc,.docx,video/mp4,video/quicktime,video/webm"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                        />
                        <div className="w-full border border-dashed border-border/70 bg-[rgb(var(--ml-bg-primary))] group-hover/upload:border-[rgb(var(--ml-text-primary))]/40 rounded-xl p-4 flex flex-col items-center justify-center gap-1 transition-all">
                          <ImageIcon className="w-5 h-5 text-[rgb(var(--ml-text-secondary))] group-hover/upload:text-[rgb(var(--ml-text-primary))] transition-colors" />
                          <span className="text-xs font-semibold text-[rgb(var(--ml-text-primary))] mt-1">
                            Upload Files
                          </span>
                          <span className="text-[10px] font-medium text-[rgb(var(--ml-text-secondary))]">
                            Photos, docs, or videos (Max 10MB)
                          </span>
                        </div>
                      </div>
                    )}

                    {files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <span className="text-[10px] font-bold text-[rgb(var(--ml-accent))] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--ml-accent))] animate-pulse" />
                          Ready to Upload ({files.length})
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {files.map((file, idx) => (
                            <StagedAttachmentThumbnail
                              key={idx}
                              file={file}
                              onRemove={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                              onViewImage={setLightboxUrl}
                            />
                          ))}
                        </div>
                      </div>
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
                    type="button"
                    onClick={handleUpdate}
                    disabled={!hasChanges || isUpdating || req.status === "closed"}
                    className="w-full bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] text-xs font-bold h-11 rounded-xl shadow-sm disabled:opacity-40 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                  >
                    {isUpdating && (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    )}
                    {isUpdating ? "Updating..." : "Update Request"}
                  </button>
                </div>
              </div>

              {/* Maintenance Timeline Component */}
              <div className="mt-8 border-t border-border/30">
                <MaintenanceTimeline
                  requestId={req.id}
                  userType="landlord"
                  refreshKey={timelineRefreshKey}
                  onViewImage={setLightboxUrl}
                />
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

