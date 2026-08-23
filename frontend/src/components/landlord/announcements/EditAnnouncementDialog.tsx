"use client";

import React, { useState, useEffect } from "react";
import { errorMessage } from "@/lib/errors";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { fetchAPI } from "@/lib/api";
import { formatAnnouncementUnitLabel } from "@/lib/announcement-labels";
import { toast } from "sonner";
import { Announcement } from "./AnnouncementCard";

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_label: string;
}

export interface EditAnnouncementDialogProps {
  announcement: Announcement | null;
  properties: Property[];
  units: Unit[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAnnouncementDialog({
  announcement,
  properties,
  units,
  onClose,
  onSuccess,
}: EditAnnouncementDialogProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editUnitId, setEditUnitId] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    if (announcement) {
      setEditTitle(announcement.title);
      setEditBody(announcement.body);
      setEditUnitId(announcement.unit_id || "");
    }
  }, [announcement]);

  const propertyName =
    properties.find((p) => p.id === announcement?.property_id)?.name || "Property";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;

    setIsEditSubmitting(true);
    try {
      const payload: Record<string, unknown> = { title: editTitle, body: editBody };
      payload.unit_id = editUnitId ? editUnitId : null;

      await fetchAPI(`/api/v1/landlord/announcements/${announcement.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.success("Announcement updated successfully!");
      onClose();
      onSuccess();
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to update announcement. Please try again.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <Dialog open={!!announcement} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 sm:p-8 space-y-5">
        <DialogHeader className="border-b border-border/40 pb-4">
          <DialogTitle className="text-lg font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
            Edit Announcement
          </DialogTitle>
          <DialogDescription className="text-xs text-[rgb(var(--ml-text-secondary))]">
            Updating notice for <span className="font-semibold text-[rgb(var(--ml-text-primary))]">{propertyName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Target Scope / Unit
            </label>
            <Select
              value={editUnitId || "all"}
              onValueChange={(val) => setEditUnitId(val === "all" ? "" : (val as string))}
            >
              <SelectTrigger className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11">
                <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-xs text-[rgb(var(--ml-text-primary))]">
                  {editUnitId === "all" || !editUnitId
                    ? "All Units (Property-wide)"
                    : formatAnnouncementUnitLabel(
                        units.find((u) => u.id === editUnitId)?.unit_label
                      )}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                <SelectItem value="all" className="font-semibold text-xs">
                  All Units (Property-wide)
                </SelectItem>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="font-semibold text-xs">
                    {formatAnnouncementUnitLabel(u.unit_label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Announcement Title
            </label>
            <input
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Notice Details
            </label>
            <textarea
              required
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
              className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all resize-y"
            />
          </div>

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
              isLoading={isEditSubmitting}
              type="submit"
              className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-5 cursor-pointer shadow-sm hover:bg-[rgb(var(--ml-accent))] hover:text-black"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

