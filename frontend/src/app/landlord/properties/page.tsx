"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
};

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    try {
      const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchAPI("/api/v1/landlord/properties", {
        method: "POST",
        body: JSON.stringify({ name, address, city }),
      });
      setName("");
      setAddress("");
      setCity("");
      toast.success("Property created successfully!");
      loadData();
    } catch (err) {
      toast.error("Failed to create property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-balance">Properties</h1>
      </div>

      <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[var(--ml-border)] rounded-xl space-y-4 shadow-sm animate-fadeIn">
        <div>
          <h2 className="text-xl font-semibold text-[rgb(var(--ml-text-primary))] text-balance">Add New Property</h2>
          <p className="text-sm text-[rgb(var(--ml-text-secondary))] mt-1">Enter the details of your new building to start managing its units.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="property-name" className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Property Name</label>
            <input 
              id="property-name"
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Name (e.g. Sunset Apartments)" 
              className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[var(--ml-border)] rounded-lg p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all placeholder-[rgb(var(--ml-text-muted))]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="property-address" className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Street Address</label>
            <input 
              id="property-address"
              required 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              placeholder="Address (e.g. 123 Main St)" 
              autoComplete="street-address"
              className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[var(--ml-border)] rounded-lg p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all placeholder-[rgb(var(--ml-text-muted))]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="property-city" className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">City</label>
            <input 
              id="property-city"
              required 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              placeholder="City" 
              autoComplete="address-level2"
              className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[var(--ml-border)] rounded-lg p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all placeholder-[rgb(var(--ml-text-muted))]"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-[var(--ml-border)]">
          <Button 
            type="submit" 
            isLoading={isSubmitting}
            className="bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/90 text-white font-medium px-6 py-3 rounded-lg cursor-pointer transition-opacity disabled:opacity-50 w-full sm:w-auto mt-2"
          >
            Add Property
          </Button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border border-[var(--ml-border)] rounded-xl bg-[rgb(var(--ml-bg-secondary))]/60 space-y-3">
                <div className="skeleton h-6 w-1/2 rounded-lg" />
                <div className="skeleton h-4 w-3/4 rounded-md" />
                <div className="skeleton h-4 w-1/4 rounded-md" />
              </div>
            ))}
          </motion.div>
        ) : properties.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={Building2}
              title="No Properties"
              description="You haven't added any properties yet. Add your first property above."
            />
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {properties.map(p => (
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                key={p.id} 
                className="flex flex-col p-6 border border-[var(--ml-border)] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[rgb(var(--ml-bg-tertiary))] rounded-lg border border-[var(--ml-border)] group-hover:border-[rgb(var(--ml-accent))] group-hover:bg-[rgba(var(--ml-accent),0.1)] transition-colors">
                    <Building2 className="w-6 h-6 text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[rgb(var(--ml-text-primary))]">{p.name}</h3>
                    <p className="text-sm text-[rgb(var(--ml-text-secondary))] mt-1">{p.address}</p>
                    <p className="text-sm text-[rgb(var(--ml-text-secondary))]">{p.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
