"use client";

import { errorMessage } from "@/lib/errors";

import React, { useState, useEffect } from "react";
import { RefreshCcw, Paperclip, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadFiles } from "@/lib/upload";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";
import { MaintenanceRequest } from "./TenantRequestCard";

export interface ReopenModalProps {
  open: boolean;
  requestId: string | null;
  onClose: () => void;
  onSuccess: (updatedRequest: MaintenanceRequest) => void;
}

export function ReopenModal({ open, requestId, onClose, onSuccess }: ReopenModalProps) {
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
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to reopen request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !submitting && onClose()}>
      <DialogContent className="sm:max-w-md bg-[rgb(var(--ml-bg-secondary))]/90 dark:bg-[rgb(var(--ml-bg-primary))]/85 backdrop-blur-xl border border-black/10 dark:border-white/15 ring-0 p-6 rounded-2xl shadow-2xl">
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
                      className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer touch-manipulation"
                      aria-label="Remove attached file"
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

