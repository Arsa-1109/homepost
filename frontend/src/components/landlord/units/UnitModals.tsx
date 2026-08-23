"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Pencil, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";

export interface EditLeaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  unitLabel: string;
  initialStart: string;
  initialEnd: string;
  onSuccess: () => void;
}

export function EditLeaseModal({
  open,
  onOpenChange,
  unitId,
  unitLabel,
  initialStart,
  initialEnd,
  onSuccess,
}: EditLeaseModalProps) {
  const [editStart, setEditStart] = useState(initialStart);
  const [editEnd, setEditEnd] = useState(initialEnd);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setEditStart(initialStart || "");
    setEditEnd(initialEnd || "");
  }, [initialStart, initialEnd, open]);

  const handleUpdateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await fetchAPI(`/api/v1/landlord/units/${unitId}/lease`, {
        method: "PUT",
        body: JSON.stringify({
          lease_start: editStart || null,
          lease_end: editEnd || null,
        }),
      });
      toast.success("Lease dates updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update lease dates");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-border/20 pb-4">
          <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
              Set Lease Dates
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
              Contract range for Unit {unitLabel}
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleUpdateLease} className="space-y-4 pt-1">
          <div>
            <label className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block mb-1.5">
              Lease Start Date
            </label>
            <DatePicker
              value={editStart}
              onChange={setEditStart}
              placeholder="Select start date"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block mb-1.5">
              Lease End Date
            </label>
            <DatePicker
              value={editEnd}
              onChange={setEditEnd}
              placeholder="Select end date"
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-border/30">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] text-xs font-bold transition-colors cursor-pointer text-[rgb(var(--ml-text-primary))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 h-11 rounded-xl bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)] disabled:opacity-50"
            >
              {isUpdating ? "Saving..." : "Save Dates"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface EditUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  initialLabel: string;
  initialRentDay: string;
  onSuccess: () => void;
}

export function EditUnitModal({
  open,
  onOpenChange,
  unitId,
  initialLabel,
  initialRentDay,
  onSuccess,
}: EditUnitModalProps) {
  const [editLabel, setEditLabel] = useState(initialLabel);
  const [editRentDay, setEditRentDay] = useState(initialRentDay);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setEditLabel(initialLabel || "");
    setEditRentDay(initialRentDay || "1");
  }, [initialLabel, initialRentDay, open]);

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await fetchAPI(`/api/v1/landlord/units/${unitId}`, {
        method: "PUT",
        body: JSON.stringify({
          unit_label: editLabel.trim(),
          rent_due_day: parseInt(editRentDay, 10),
        }),
      });
      toast.success("Unit updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update unit");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl outline-none ring-0">
        <form onSubmit={handleUpdateUnit}>
          <div className="p-6 sm:p-7 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0 shadow-inner">
                <Pencil className="h-6 w-6 text-[rgb(var(--ml-accent))]" />
              </div>
              <div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
                    Edit Unit
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    Update the unit label or monthly rent due date.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                  Unit Label
                </label>
                <input
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. Apt 101, Basement, etc."
                  className="w-full h-11 px-3.5 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-xs font-medium outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all text-[rgb(var(--ml-text-primary))]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                  Rent Due Day
                </label>
                <Select value={editRentDay} onValueChange={(val) => setEditRentDay(val || "1")}>
                  <SelectTrigger className="w-full h-11 px-3.5 bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl text-xs font-medium outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all">
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-60 overflow-y-auto z-[100]">
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem
                        key={i + 1}
                        value={(i + 1).toString()}
                        className="font-semibold text-xs cursor-pointer"
                      >
                        Day {i + 1} of every month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-3 border-t border-border/30 flex gap-3 justify-end items-center">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] rounded-xl flex-1 sm:flex-initial shadow-sm shadow-[rgba(var(--ml-accent),0.15)] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface DeleteUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  unitLabel: string;
  onSuccess: () => void;
}

export function DeleteUnitModal({
  open,
  onOpenChange,
  unitId,
  unitLabel,
  onSuccess,
}: DeleteUnitModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUnit = async () => {
    setIsDeleting(true);
    try {
      await fetchAPI(`/api/v1/landlord/units/${unitId}`, {
        method: "DELETE",
      });
      toast.success("Unit deleted successfully");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete unit");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl outline-none ring-0">
        <div className="p-6 sm:p-7 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shrink-0 shadow-inner">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
                  Delete Unit
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-[rgb(var(--ml-text-primary))]">Unit {unitLabel}</span>? All lease history, invitations, and related documents will be permanently removed.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className="pt-4 border-t border-border/30 flex gap-3 justify-end items-center">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
            >
              Cancel
            </button>
            <button
              disabled={isDeleting}
              onClick={handleDeleteUnit}
              className="px-5 py-2.5 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial shadow-sm shadow-red-600/20 active:scale-[0.98]"
            >
              {isDeleting ? "Deleting..." : "Yes, delete unit"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
