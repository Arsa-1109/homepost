"use client";

import { errorMessage } from "@/lib/errors";

import React, { useState, useMemo } from "react";
import { Plus, Layers, X, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";
import { Unit } from "./UnitCard";

export interface CreateUnitFormProps {
  selectedProperty: string;
  selectedPropertyName: string;
  onSuccess: (newUnits: Unit[]) => void;
}

export function CreateUnitForm({
  selectedProperty,
  selectedPropertyName,
  onSuccess,
}: CreateUnitFormProps) {
  const [unitLabel, setUnitLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState("");

  const parsedBatchLabels = useMemo(() => {
    const parts = batchInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const result: string[] = [];

    for (const part of parts) {
      const rangeMatch = part.match(
        /^([A-Za-z\s_-]*)(\d+)\s*[-–—]\s*([A-Za-z\s_-]*)(\d+)$/
      );
      if (rangeMatch) {
        const prefix1 = rangeMatch[1];
        const startNum = parseInt(rangeMatch[2], 10);
        const prefix2 = rangeMatch[3];
        const endNum = parseInt(rangeMatch[4], 10);
        const prefix = prefix1 || prefix2 || "";

        if (
          !isNaN(startNum) &&
          !isNaN(endNum) &&
          startNum <= endNum &&
          endNum - startNum <= 50
        ) {
          for (let n = startNum; n <= endNum; n++) {
            result.push(`${prefix}${n}`.trim());
          }
          continue;
        }
      }
      result.push(part);
    }

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of result) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    return unique;
  }, [batchInput]);

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = unitLabel.trim();
    if (!selectedProperty || !cleanLabel) return;

    setIsSubmitting(true);
    try {
      const newUnit = await fetchAPI<Unit>("/api/v1/landlord/units", {
        method: "POST",
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_label: cleanLabel,
        }),
      });
      setUnitLabel("");
      toast.success(`Unit "${newUnit.unit_label}" created successfully!`);
      onSuccess([newUnit]);
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to create unit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || parsedBatchLabels.length === 0) return;

    setIsSubmitting(true);
    try {
      const createdUnits = await fetchAPI<Unit[]>("/api/v1/landlord/units/batch", {
        method: "POST",
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_labels: parsedBatchLabels,
        }),
      });
      setBatchInput("");
      setIsBatchMode(false);
      toast.success(
        `Created ${createdUnits.length} unit${
          createdUnits.length === 1 ? "" : "s"
        } successfully!`
      );
      onSuccess(createdUnits);
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to create units in batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 bg-[rgb(var(--ml-bg-secondary))] border border-border/70 rounded-3xl space-y-4 shadow-sm relative">
      {!isBatchMode ? (
        <form onSubmit={handleCreateSingle} className="space-y-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder={`Unit label / name (e.g. Apt 104, Room 2B for ${selectedPropertyName})`}
                className="w-full h-11 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl px-4 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/60"
              />
            </div>
            <Button
              type="submit"
              disabled={!unitLabel.trim() || isSubmitting}
              className="h-11 px-5 rounded-xl bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Adding..." : "Add Unit"}</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsBatchMode(true);
                setBatchInput("");
              }}
              className="inline-flex items-center gap-1.5 font-bold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Add multiple units</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[rgb(var(--ml-text-primary))]">
                Batch Add Units to {selectedPropertyName}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsBatchMode(false)}
              className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Single mode</span>
            </button>
          </div>

          <div>
            <textarea
              rows={3}
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder="Enter unit labels separated by commas or line breaks (e.g. 101-110, 201, 202, Penthouse A)"
              className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all resize-y"
            />
          </div>

          {parsedBatchLabels.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--ml-accent))]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Will create {parsedBatchLabels.length} units: {parsedBatchLabels.slice(0, 5).join(", ")}{parsedBatchLabels.length > 5 ? "..." : ""}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBatchMode(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={parsedBatchLabels.length === 0 || isSubmitting}
              className="rounded-xl bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold text-xs px-5 shadow-sm hover:bg-[rgb(var(--ml-accent))] hover:text-black"
            >
              {isSubmitting ? "Creating Units..." : `Create ${parsedBatchLabels.length} Units`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

