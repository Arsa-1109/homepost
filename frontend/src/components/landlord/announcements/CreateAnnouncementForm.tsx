"use client";

import React, { useState } from "react";
import { errorMessage } from "@/lib/errors";
import { Megaphone, Paperclip, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { uploadFile } from "@/lib/upload";
import { useFormDraft } from "@/hooks/useFormDraft";
import {
  formatAnnouncementUnitLabel,
} from "@/lib/announcement-labels";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_label: string;
}

export interface CreateAnnouncementFormProps {
  properties: Property[];
  selectedProperty: string;
  onPropertyChange: (propertyId: string) => void;
  units: Unit[];
  onSuccess: () => void;
  onCancel: () => void;
}

const DRAFT_KEY = "landlord_draft_announcement";

export function CreateAnnouncementForm({
  properties,
  selectedProperty,
  onPropertyChange,
  units,
  onSuccess,
  onCancel,
}: CreateAnnouncementFormProps) {
  const {
    values,
    updateField,
    isDraftRestored,
    discardDraft,
    clearDraft,
  } = useFormDraft(DRAFT_KEY, {
    title: "",
    body: "",
    selectedUnit: "",
  });

  const { title, body, selectedUnit } = values;
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPropertyName =
    properties.find((p) => p.id === selectedProperty)?.name || "Property";

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (attachments.length + newFiles.length > 3) {
      toast.error("You can only attach a maximum of 3 files.");
      e.target.value = "";
      return;
    }

    const ALLOWED_EXTS = [
      ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
      ".pdf", ".doc", ".docx", ".mp4", ".mov", ".webm", ".m4v"
    ];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    for (const file of newFiles) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        toast.error(`"${file.name}" has an unsupported format.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB size limit.`);
        e.target.value = "";
        return;
      }
    }

    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    setIsSubmitting(true);
    try {
      let attachmentKeys: string[] = [];
      if (attachments.length > 0) {
        attachmentKeys = await Promise.all(
          attachments.map((file) => uploadFile(file, "announcements"))
        );
      }

      const payload: Record<string, unknown> = { property_id: selectedProperty, title, body };
      if (selectedUnit) payload.unit_id = selectedUnit;
      if (attachmentKeys.length > 0) payload.attachment_keys = attachmentKeys;

      await fetchAPI("/api/v1/landlord/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      clearDraft();
      setAttachments([]);
      toast.success("Announcement posted successfully!");
      onSuccess();
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to post announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleCreate}
      className="p-6 sm:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-border rounded-3xl space-y-5 shadow-md mb-8"
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
            Post New Announcement
          </h2>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
            Broadcasting to <span className="font-semibold text-[rgb(var(--ml-text-primary))]">{selectedPropertyName}</span>
          </p>
        </div>
        {isDraftRestored && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Draft Restored
            </span>
            <button
              type="button"
              onClick={discardDraft}
              className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] hover:text-red-400 underline transition-colors cursor-pointer"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
            Target Property
          </label>
          <Select value={selectedProperty} onValueChange={(val) => onPropertyChange(val as string)}>
            <SelectTrigger className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11">
              <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-xs text-[rgb(var(--ml-text-primary))]">
                {selectedPropertyName}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id} className="font-semibold text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
            Target Scope / Unit (Optional)
          </label>
          <Select
            value={selectedUnit || "all"}
            onValueChange={(val) => updateField("selectedUnit", val === "all" ? "" : (val as string))}
          >
            <SelectTrigger className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11">
              <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-xs text-[rgb(var(--ml-text-primary))]">
                {selectedUnit === "all" || !selectedUnit
                  ? "All Units (Property-wide)"
                  : formatAnnouncementUnitLabel(
                      units.find((u) => u.id === selectedUnit)?.unit_label
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
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
          Announcement Title
        </label>
        <input
          required
          value={title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Scheduled Water Maintenance"
          className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
          Notice Details
        </label>
        <textarea
          required
          value={body}
          onChange={(e) => updateField("body", e.target.value)}
          placeholder="Write your announcement details here..."
          rows={4}
          className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50 resize-y"
        />
      </div>

      {/* File Attachment Dropzone */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] block">
            Attach Files (Optional)
          </label>
          <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))]/70 uppercase tracking-wider">
            {attachments.length} / 3 Uploaded
          </span>
        </div>

        <div className="space-y-3">
          {attachments.length > 0 && (
            <div className="grid gap-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Paperclip className="w-4 h-4 text-[rgb(var(--ml-accent))] shrink-0" />
                    <span className="text-xs font-semibold text-[rgb(var(--ml-text-primary))] truncate">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-1 rounded-lg text-[rgb(var(--ml-text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {attachments.length < 3 && (
            <div className="relative border-2 border-dashed border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 bg-[rgb(var(--ml-bg-primary))]/30 hover:bg-[rgb(var(--ml-bg-primary))]/60 p-5 rounded-2xl text-center cursor-pointer transition-all duration-200 ease-out group">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,video/mp4,video/quicktime,video/webm"
                onChange={handleAttachmentChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center gap-3 pointer-events-none">
                <div className="p-2 rounded-xl bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-text-primary))] transition-all border border-border/40">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                    Click or drag files to attach
                  </p>
                  <p className="text-[10px] text-[rgb(var(--ml-text-secondary))]">
                    Photos, docs, or videos up to 10MB (Max 3)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl text-xs font-bold"
        >
          Cancel
        </Button>
        <Button
          isLoading={isSubmitting}
          type="submit"
          className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-6 py-2.5 cursor-pointer shadow-sm flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
        >
          <span>Post Announcement</span>
        </Button>
      </div>
    </form>
  );
}

