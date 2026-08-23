"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { uploadFile } from "@/lib/upload";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";
import { Document } from "./DocumentCard";

interface Unit {
  id: string;
  unit_label: string;
}

export interface UploadDocumentFormProps {
  selectedProperty: string;
  selectedPropertyName: string;
  units: Unit[];
  onSuccess: (newDoc: Document) => void;
  onCancel: () => void;
}

export function UploadDocumentForm({
  selectedProperty,
  selectedPropertyName,
  units,
  onSuccess,
  onCancel,
}: UploadDocumentFormProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      setTitle("");
      setFile(null);
      setSelectedUnit("");
      toast.success("Document uploaded successfully!");
      onSuccess(newDoc);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                  : `Assign to: ${units.find((u) => u.id === selectedUnit)?.unit_label}`}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
              <SelectItem value="all" className="font-semibold text-xs">
                Assign to: All Units (Property-wide)
              </SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id} className="font-semibold text-xs">
                  Assign to: {u.unit_label}
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
            accept="image/*,application/pdf,.doc,.docx,video/mp4,video/quicktime,video/webm"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              if (selected) {
                const ALLOWED_EXTS = [
                  ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
                  ".pdf", ".doc", ".docx", ".mp4", ".mov", ".webm", ".m4v"
                ];
                const ext = "." + selected.name.split(".").pop()?.toLowerCase();
                if (!ALLOWED_EXTS.includes(ext)) {
                  toast.error(`"${selected.name}" has an unsupported format.`);
                  e.target.value = "";
                  setFile(null);
                  return;
                }
                if (selected.size > 10 * 1024 * 1024) {
                  toast.error(`"${selected.name}" exceeds the 10MB size limit.`);
                  e.target.value = "";
                  setFile(null);
                  return;
                }
              }
              setFile(selected);
            }}
            className="w-full text-xs text-[rgb(var(--ml-text-secondary))] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-bold file:text-xs file:bg-[rgb(var(--ml-text-primary))] file:text-[rgb(var(--ml-bg-primary))] hover:file:opacity-90 cursor-pointer"
          />
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
          disabled={!file}
          isLoading={isSubmitting}
          type="submit"
          className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-6 py-2.5 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
        >
          Upload Document
        </Button>
      </div>
    </form>
  );
}
