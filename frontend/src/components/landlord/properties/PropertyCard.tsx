"use client";

import { errorMessage } from "@/lib/errors";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAPI } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface PropertyUnitSummary {
  totalUnits: number;
  occupiedUnits: number;
}

export interface PropertyCardProps {
  p: Property;
  onUpdate: (updatedProperty: Property) => void;
  onDelete: (propertyId: string) => void;
}

export function PropertyCard({ p, onUpdate, onDelete }: PropertyCardProps) {
  const { isLoaded, getToken } = useAuth();
  const [unitSummary, setUnitSummary] = useState<PropertyUnitSummary | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(p.name);
  const [editAddress, setEditAddress] = useState(p.address);
  const [editCity, setEditCity] = useState(p.city);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!isLoaded) return;

    async function loadUnitSummary() {
      try {
        const token = await getToken();
        const units = await fetchAPI<{ id: string; is_occupied: boolean }[]>(
          `/api/v1/landlord/properties/${p.id}/units`,
          {},
          token
        );
        if (isMounted) {
          const total = units.length;
          const occupied = units.filter((u) => u.is_occupied).length;
          setUnitSummary({ totalUnits: total, occupiedUnits: occupied });
        }
      } catch (err) {
        if (isMounted) {
          setUnitSummary({ totalUnits: 0, occupiedUnits: 0 });
        }
      } finally {
        if (isMounted) {
          setLoadingUnits(false);
        }
      }
    }

    loadUnitSummary();
    return () => {
      isMounted = false;
    };
  }, [p.id, isLoaded, getToken]);

  const handleSave = async () => {
    if (!editName.trim() || !editAddress.trim() || !editCity.trim()) {
      toast.error("All fields (Name, Address, City) are required");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await fetchAPI<Property>(
        `/api/v1/landlord/properties/${p.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: editName.trim(),
            address: editAddress.trim(),
            city: editCity.trim(),
          }),
        }
      );
      onUpdate(updated);
      setIsEditing(false);
      toast.success("Property updated successfully");
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to update property");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetchAPI(`/api/v1/landlord/properties/${p.id}`, {
        method: "DELETE",
      });
      onDelete(p.id);
      toast.success("Property deleted successfully");
      setShowDeleteDialog(false);
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to delete property");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 border border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between group/card min-h-[260px] shadow-sm relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20">
      <div>
        {/* Top Row */}
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
            <Building2 className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditing ? (
              <>
                <Badge
                  variant="outline"
                  className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border bg-[rgb(var(--ml-bg-primary))]/80 text-[rgb(var(--ml-text-secondary))] border-border/60"
                >
                  {p.city}
                </Badge>
                <div className="flex items-center gap-1 opacity-80 group-hover/card:opacity-100 transition-opacity ml-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(p.name);
                      setEditAddress(p.address);
                      setEditCity(p.city);
                      setIsEditing(true);
                    }}
                    title="Edit Property"
                    className="p-1.5 rounded-xl hover:bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors cursor-pointer border border-transparent hover:border-border/40"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    title="Delete Property"
                    className="p-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:text-red-600 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  title="Save Changes"
                  className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  title="Cancel Edit"
                  className="p-1.5 rounded-xl bg-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border/60 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Property Name & Address */}
        {!isEditing ? (
          <div className="space-y-1.5">
            <h3
              className="font-black text-xl tracking-tight text-[rgb(var(--ml-text-primary))] group-hover/card:text-[rgb(var(--ml-accent))] transition-colors truncate"
              title={p.name}
            >
              {p.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
              <MapPin className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))] shrink-0" />
              <span className="truncate">{p.address}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] block mb-1">
                Property Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/70 rounded-xl px-3 py-1.5 text-xs font-semibold text-[rgb(var(--ml-text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ml-accent))]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] block mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/70 rounded-xl px-3 py-1.5 text-xs font-semibold text-[rgb(var(--ml-text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ml-accent))]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] block mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/70 rounded-xl px-3 py-1.5 text-xs font-semibold text-[rgb(var(--ml-text-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ml-accent))]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="pt-4 mt-6 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
          <Users className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
          {loadingUnits ? (
            <span className="skeleton h-3.5 w-20 rounded" />
          ) : (
            <span>
              <strong className="text-[rgb(var(--ml-text-primary))] font-bold">
                {unitSummary?.occupiedUnits ?? 0}
              </strong>
              /{unitSummary?.totalUnits ?? 0} Occupied
            </span>
          )}
        </div>

        <Link
          href={`/landlord/units?property_id=${p.id}`}
          className="text-xs font-bold text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] transition-colors flex items-center gap-1"
        >
          View Units &rarr;
        </Link>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[rgb(var(--ml-text-primary))]">
              Delete Property?
            </DialogTitle>
            <DialogDescription className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed mt-2">
              Are you sure you want to delete <strong className="text-[rgb(var(--ml-text-primary))]">{p.name}</strong>? This action will permanently remove the property and any units associated with it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              {isDeleting ? "Deleting..." : "Delete Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

