"use client";

import React, { useState } from "react";
import { errorMessage } from "@/lib/errors";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";
import { Property } from "./PropertyCard";

export interface CreatePropertyFormProps {
  onSuccess: (newProp: Property) => void;
  onCancel: () => void;
}

export function CreatePropertyForm({ onSuccess, onCancel }: CreatePropertyFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !city.trim()) {
      toast.error("Please fill in all required fields (Name, Address, City)");
      return;
    }

    setIsSubmitting(true);
    try {
      const newProp = await fetchAPI<Property>("/api/v1/landlord/properties", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
        }),
      });
      setName("");
      setAddress("");
      setCity("");
      toast.success("Property added successfully!");
      onSuccess(newProp);
    } catch (err) {
      toast.error(errorMessage(err) || "Failed to add property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleCreate}
      className="p-6 sm:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-border rounded-3xl space-y-5 shadow-md mb-8"
    >
      <div>
        <h2 className="text-lg font-black text-[rgb(var(--ml-text-primary))] tracking-tight flex items-center gap-2">
          <Plus className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
          Add New Property
        </h2>
        <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">
          Enter the details of your new building to start managing its units and documents.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
            Property Name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunset Apartments"
            className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
            Street Address
          </label>
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Palm Street"
            className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5">
            City
          </label>
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Los Angeles"
            className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
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
          isLoading={isSubmitting}
          type="submit"
          className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-6 py-2.5 cursor-pointer shadow-sm flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
        >
          <span>Create Property</span>
        </Button>
      </div>
    </form>
  );
}

