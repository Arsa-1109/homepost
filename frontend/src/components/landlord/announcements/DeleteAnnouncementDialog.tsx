"use client";

import React, { useState } from "react";
import { errorMessage } from "@/lib/errors";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";
import { Announcement } from "./AnnouncementCard";

export interface DeleteAnnouncementDialogProps {
  announcement: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteAnnouncementDialog({
  announcement,
  onClose,
  onSuccess,
}: DeleteAnnouncementDialogProps) {
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const confirmDelete = async () => {
    if (!announcement) return;
    setIsDeleteSubmitting(true);
    try {
      await fetchAPI(`/api/v1/landlord/announcements/${announcement.id}`, {
        method: "DELETE",
      });
      toast.success("Announcement deleted successfully!");
      onClose();
      onSuccess();
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to delete announcement.");
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  return (
    <Dialog open={!!announcement} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md p-6 sm:p-8 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Delete Announcement?
          </DialogTitle>
          <DialogDescription className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-[rgb(var(--ml-text-primary))]">&ldquo;{announcement?.title}&rdquo;</span>? This notice will be immediately removed from all tenant feeds.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            isLoading={isDeleteSubmitting}
            onClick={confirmDelete}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 shadow-sm"
          >
            Delete Notice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

