"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Layers,
  Sparkles,
  AlertCircle,
  Building2,
  Check,
  RotateCcw,
  Minus,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { Unit } from "./UnitCard";

export interface CreateUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProperty: string;
  selectedPropertyName: string;
  existingUnits?: (Unit | string)[];
  onSuccess: (newUnits: Unit[]) => void;
}

const PRESET_CHIPS = [
  "Apt 101",
  "Unit 1",
  "Room A",
  "Suite 1",
  "Studio",
  "Penthouse",
];

const PREFIX_OPTIONS = [
  { label: "Apt", value: "Apt " },
  { label: "Unit", value: "Unit " },
  { label: "Room", value: "Room " },
  { label: "Suite", value: "Suite " },
  { label: "Floor", value: "Floor " },
  { label: "None", value: "" },
];

/**
 * Intelligent helper to auto-increment the last number or trailing letter in a unit label.
 * e.g., "Apt 101" -> "Apt 102", "Unit 1" -> "Unit 2", "Room A" -> "Room B"
 */
export function getNextUnitLabel(label: string): string {
  const numMatch = label.match(/^(.*?)(\d+)$/);
  if (numMatch) {
    const prefix = numMatch[1];
    const num = parseInt(numMatch[2], 10);
    const nextNum = (num + 1).toString().padStart(numMatch[2].length, "0");
    return `${prefix}${nextNum}`;
  }
  // Single letter following a space/dash or numbers (e.g., "Room A" -> "Room B", "101A" -> "101B")
  const letterMatch = label.match(/^(.*?(?:[\s_\-\/]+|\d+))([A-Za-z])$/);
  if (letterMatch) {
    const prefix = letterMatch[1];
    const charCode = letterMatch[2].charCodeAt(0);
    if ((charCode >= 65 && charCode < 90) || (charCode >= 97 && charCode < 122)) {
      return `${prefix}${String.fromCharCode(charCode + 1)}`;
    }
  }
  return "";
}

/**
 * Custom hook for click-and-hold continuous stepping on stepper controls.
 */
function useHoldPress(action: () => void, { initialDelay = 300, interval = 70 } = {}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
      if ("button" in e && e.button !== 0) return;
      e.preventDefault();
      stop();
      actionRef.current(); // Initial step immediately

      timerRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          actionRef.current();
        }, interval);
      }, initialDelay);
    },
    [initialDelay, interval, stop]
  );

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onTouchEnd: stop,
  };
}

export function CreateUnitModal({
  isOpen,
  onClose,
  selectedProperty,
  selectedPropertyName,
  existingUnits = [],
  onSuccess,
}: CreateUnitModalProps) {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single Unit Form State
  const [singleLabel, setSingleLabel] = useState("");
  const [singleError, setSingleError] = useState<string | null>(null);
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false);

  // Bulk Generator State
  const [prefix, setPrefix] = useState("Apt ");
  const [isCustomPrefix, setIsCustomPrefix] = useState(false);
  const [startNumber, setStartNumber] = useState(101);
  const [unitCount, setUnitCount] = useState(10);
  const [excludedLabels, setExcludedLabels] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  const handleDecrement = useCallback(() => {
    setUnitCount((prev) => Math.max(1, prev - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setUnitCount((prev) => Math.min(30, prev + 1));
  }, []);

  const decrementHoldProps = useHoldPress(handleDecrement);
  const incrementHoldProps = useHoldPress(handleIncrement);

  const singleInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSingleError(null);
      setBulkError(null);
      setExcludedLabels(new Set());
      const timer = setTimeout(() => {
        if (activeTab === "single") {
          singleInputRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Set of existing unit names in lowercase for fast duplicate checking
  const existingSet = useMemo(() => {
    const set = new Set<string>();
    for (const u of existingUnits) {
      const label = typeof u === "string" ? u : u.unit_label;
      if (label) set.add(label.trim().toLowerCase());
    }
    return set;
  }, [existingUnits]);

  // Single unit duplicate check
  const isSingleDuplicate = useMemo(() => {
    const clean = singleLabel.trim().toLowerCase();
    if (!clean) return false;
    return existingSet.has(clean);
  }, [singleLabel, existingSet]);

  // Generate batch unit list
  const generatedUnits = useMemo(() => {
    const safeCount = Math.min(Math.max(1, unitCount), 30);
    const items: { label: string; isDuplicate: boolean }[] = [];

    for (let i = 0; i < safeCount; i++) {
      const currentNum = startNumber + i;
      const label = `${prefix}${currentNum}`.trim();
      const isDuplicate = existingSet.has(label.toLowerCase());
      items.push({ label, isDuplicate });
    }
    return items;
  }, [prefix, startNumber, unitCount, existingSet]);

  // Filter out manually removed chips
  const activeBulkUnits = useMemo(() => {
    return generatedUnits.filter((u) => !excludedLabels.has(u.label));
  }, [generatedUnits, excludedLabels]);

  const duplicateBulkCount = useMemo(() => {
    return activeBulkUnits.filter((u) => u.isDuplicate).length;
  }, [activeBulkUnits]);

  const handleRemoveBulkChip = (label: string) => {
    setExcludedLabels((prev) => {
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  };

  const handleRestoreAllChips = () => {
    setExcludedLabels(new Set());
  };

  const handleRemoveAllDuplicates = () => {
    setExcludedLabels((prev) => {
      const next = new Set(prev);
      generatedUnits.forEach((u) => {
        if (u.isDuplicate) next.add(u.label);
      });
      return next;
    });
  };

  // Submit Single Unit
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = singleLabel.trim();
    if (!selectedProperty || !cleanLabel || isSingleDuplicate || isSingleSubmitting) return;

    setIsSingleSubmitting(true);
    setSingleError(null);

    try {
      const newUnit = await fetchAPI<Unit>("/api/v1/landlord/units", {
        method: "POST",
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_label: cleanLabel,
        }),
      });

      toast.success(`Unit "${newUnit.unit_label}" created successfully!`);
      onSuccess([newUnit]);
      setSingleLabel("");
      onClose();
    } catch (err) {
      const msg = errorMessage(err) || "Failed to create unit. Please try again.";
      setSingleError(msg);
      toast.error(msg);
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  // Submit Bulk Units
  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const labelsToCreate = activeBulkUnits.map((u) => u.label);

    if (!selectedProperty || labelsToCreate.length === 0 || isBulkSubmitting) return;

    setIsBulkSubmitting(true);
    setBulkError(null);

    try {
      const createdUnits = await fetchAPI<Unit[]>("/api/v1/landlord/units/batch", {
        method: "POST",
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_labels: labelsToCreate,
        }),
      });

      toast.success(
        `Created ${createdUnits.length} unit${createdUnits.length === 1 ? "" : "s"} successfully!`
      );
      onSuccess(createdUnits);
      setExcludedLabels(new Set());
      onClose();
    } catch (err) {
      const msg = errorMessage(err) || "Failed to create units in batch. Please try again.";
      setBulkError(msg);
      toast.error(msg);
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal / Mobile Sheet Surface */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] bg-[rgb(var(--ml-bg-secondary))] border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-units-title"
          >
            {/* Mobile Drag Indicator Bar */}
            <div className="sm:hidden flex items-center justify-center pt-2.5 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-border/80" />
            </div>

            {/* Header */}
            <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgb(var(--ml-bg-primary))] border border-border/80 flex items-center justify-center text-[rgb(var(--ml-accent))] shadow-2xs">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="add-units-title" className="text-base font-black tracking-tight text-[rgb(var(--ml-text-primary))] leading-tight">
                    Add Units
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[rgb(var(--ml-text-secondary))] mt-0.5">
                    <Building2 className="w-3 h-3 text-[rgb(var(--ml-accent))]" />
                    <span className="truncate max-w-[200px] sm:max-w-[280px]">
                      {selectedPropertyName || "Selected Property"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[rgb(var(--ml-bg-primary))] border border-border/70 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Close (Esc)"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="px-5 sm:px-6 pt-3 shrink-0">
              <div className="grid grid-cols-2 p-1 bg-[rgb(var(--ml-bg-primary))] border border-border/60 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("single")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    activeTab === "single"
                      ? "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] shadow-sm border border-border/60"
                      : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Single Unit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("bulk")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    activeTab === "bulk"
                      ? "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] shadow-sm border border-border/60"
                      : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Bulk Generator</span>
                </button>
              </div>
            </div>

            {/* Content Scrollable Body */}
            <div className="p-5 sm:px-6 py-4 overflow-y-auto [scrollbar-gutter:stable] space-y-4 flex-1">
              {activeTab === "single" ? (
                /* TAB 1: SINGLE UNIT FORM */
                <form id="single-unit-form" onSubmit={handleCreateSingle} className="space-y-4">
                  {singleError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{singleError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSingleError(null)}
                        className="text-xs font-bold hover:underline shrink-0 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="single-unit-input"
                      className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]"
                    >
                      Unit Name / Label
                    </label>
                    <div className="relative">
                      <input
                        ref={singleInputRef}
                        id="single-unit-input"
                        type="text"
                        value={singleLabel}
                        onChange={(e) => {
                          setSingleLabel(e.target.value);
                          if (singleError) setSingleError(null);
                        }}
                        placeholder="e.g. Apt 104, Suite 2B, Penthouse A"
                        className={`w-full h-11 bg-[rgb(var(--ml-bg-primary))] border rounded-xl px-4 text-xs font-semibold text-[rgb(var(--ml-text-primary))] outline-none transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50 ${
                          isSingleDuplicate
                            ? "border-amber-500/80 focus:ring-1 focus:ring-amber-500"
                            : "border-border/70 focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))]"
                        }`}
                      />
                    </div>

                    {/* Duplicate Warning */}
                    {isSingleDuplicate && (
                      <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Unit "{singleLabel.trim()}" already exists in {selectedPropertyName}.</span>
                      </p>
                    )}
                  </div>

                  {/* Quick-Fill Presets */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                      Quick Suggestions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setSingleLabel(chip);
                            singleInputRef.current?.focus();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))] border border-border/60 hover:border-border text-[11px] font-semibold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                /* TAB 2: BULK GENERATOR FORM */
                <form id="bulk-unit-form" onSubmit={handleCreateBulk} className="space-y-4">
                  {bulkError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{bulkError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBulkError(null)}
                        className="text-xs font-bold hover:underline shrink-0 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Generator Inputs */}
                  <div className="space-y-3 bg-[rgb(var(--ml-bg-primary))]/50 p-4 rounded-2xl border border-border/60">
                    {/* Prefix selector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                          Prefix / Format
                        </label>
                        {!isCustomPrefix && prefix && (
                          <span className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))]">
                            Preview: <strong className="text-[rgb(var(--ml-accent))]">{prefix}{startNumber}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {PREFIX_OPTIONS.map((opt) => {
                          const isSelected = !isCustomPrefix && prefix === opt.value;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => {
                                setPrefix(opt.value);
                                setIsCustomPrefix(false);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                isSelected
                                  ? "bg-[rgb(var(--ml-accent))] text-black border-[rgb(var(--ml-accent))] shadow-xs"
                                  : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border-border/70 hover:border-border hover:text-[rgb(var(--ml-text-primary))]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomPrefix(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isCustomPrefix
                              ? "bg-[rgb(var(--ml-accent))] text-black border-[rgb(var(--ml-accent))] shadow-xs"
                              : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border-border/70 hover:border-border hover:text-[rgb(var(--ml-text-primary))]"
                          }`}
                        >
                          Custom...
                        </button>
                      </div>

                      {/* Custom Prefix text input only shown when Custom is selected */}
                      {isCustomPrefix && (
                        <div className="pt-1">
                          <input
                            type="text"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            placeholder="Type custom prefix (e.g. Block A - Apt )"
                            autoFocus
                            className="w-full h-10 bg-[rgb(var(--ml-bg-secondary))] border border-border/70 rounded-xl px-3.5 text-xs font-semibold text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] transition-all"
                          />
                        </div>
                      )}
                    </div>

                    {/* Start Number and Unit Count Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                          Starting Number
                        </label>
                        <input
                          type="number"
                          value={startNumber}
                          onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                          className="w-full h-10 bg-[rgb(var(--ml-bg-secondary))] border border-border/70 rounded-xl px-3 text-xs font-bold text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                            Unit Count
                          </label>
                          <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))]">
                            Max 30
                          </span>
                        </div>
                        <div className="flex items-center h-10 bg-[rgb(var(--ml-bg-secondary))] border border-border/70 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            {...decrementHoldProps}
                            onClick={handleDecrement}
                            disabled={unitCount <= 1}
                            className="px-3 h-full hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] disabled:opacity-30 cursor-pointer flex items-center justify-center select-none active:bg-[rgb(var(--ml-bg-primary))]"
                            title="Decrease count (click or hold)"
                            aria-label="Decrease unit count"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={unitCount}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setUnitCount(Math.min(Math.max(1, val), 30));
                            }}
                            className="w-full h-full text-center text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-transparent outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            {...incrementHoldProps}
                            onClick={handleIncrement}
                            disabled={unitCount >= 30}
                            className="px-3 h-full hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] disabled:opacity-30 cursor-pointer flex items-center justify-center select-none active:bg-[rgb(var(--ml-bg-primary))]"
                            title="Increase count (click or hold)"
                            aria-label="Increase unit count"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Chips Header */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                        <Sparkles className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                        <span>
                          {activeBulkUnits.length} unit{activeBulkUnits.length === 1 ? "" : "s"} will be created
                        </span>
                      </div>

                      {excludedLabels.size > 0 && (
                        <button
                          type="button"
                          onClick={handleRestoreAllChips}
                          className="text-[11px] font-semibold text-[rgb(var(--ml-accent))] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset removed</span>
                        </button>
                      )}
                    </div>

                    {/* Duplicate Warning Banner in Bulk */}
                    {duplicateBulkCount > 0 && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            {duplicateBulkCount} unit{duplicateBulkCount > 1 ? "s" : ""} already exist{duplicateBulkCount === 1 ? "s" : ""}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAllDuplicates}
                          className="text-[11px] font-bold text-amber-800 dark:text-amber-200 underline hover:no-underline cursor-pointer"
                        >
                          Remove existing
                        </button>
                      </div>
                    )}

                    {/* Dismissible Chips Area with stable height to prevent layout shifts */}
                    <div className="flex flex-wrap content-start gap-1.5 h-36 min-h-[144px] overflow-y-auto [scrollbar-gutter:stable] p-2.5 bg-[rgb(var(--ml-bg-primary))]/40 border border-border/60 rounded-2xl">
                      {activeBulkUnits.map((item) => (
                        <div
                          key={item.label}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            item.isDuplicate
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] border border-border/70 shadow-2xs"
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.isDuplicate && (
                            <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-wider">
                              (Exists)
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkChip(item.label)}
                            className="w-3.5 h-3.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] cursor-pointer"
                            title={`Remove ${item.label}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}

                      {activeBulkUnits.length === 0 && (
                        <div className="w-full py-4 text-center text-xs text-[rgb(var(--ml-text-secondary))]">
                          All generated units have been removed. Click "Reset removed" to restore.
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 sm:px-6 py-4 bg-[rgb(var(--ml-bg-primary))]/50 border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs font-bold h-10 px-4 cursor-pointer"
              >
                Cancel
              </Button>

              {activeTab === "single" ? (
                <Button
                  type="submit"
                  form="single-unit-form"
                  disabled={!singleLabel.trim() || isSingleDuplicate || isSingleSubmitting}
                  className="rounded-xl bg-[rgb(var(--ml-accent))] text-black font-black text-xs h-10 px-5 shadow-sm hover:bg-[rgb(var(--ml-accent))]/90 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>{isSingleSubmitting ? "Creating Unit..." : "Create 1 Unit"}</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="bulk-unit-form"
                  disabled={activeBulkUnits.length === 0 || isBulkSubmitting}
                  className="rounded-xl bg-[rgb(var(--ml-accent))] text-black font-black text-xs h-10 px-5 shadow-sm hover:bg-[rgb(var(--ml-accent))]/90 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span>
                    {isBulkSubmitting
                      ? "Creating Units..."
                      : `Create ${activeBulkUnits.length} Unit${activeBulkUnits.length === 1 ? "" : "s"}`}
                  </span>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
