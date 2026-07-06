"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

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
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-slide-up">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/10 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          Properties
        </h1>
        <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] pl-1 mt-2">
          Manage your real estate catalog and view general property settings.
        </p>
      </div>

      <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/50 rounded-2xl space-y-5 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <div>
          <h2 className="text-lg font-bold text-[rgb(var(--ml-text-primary))] tracking-tight">Add New Property</h2>
          <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">Enter the details of your new building to start managing its units.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Name (e.g. Sunset Apartments)" 
            className="w-full bg-[rgb(var(--ml-bg-primary))] border border-[rgb(var(--ml-border))]/60 rounded-xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/50"
          />
          <input 
            required 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="Address (e.g. 123 Main St)" 
            className="w-full bg-[rgb(var(--ml-bg-primary))] border border-[rgb(var(--ml-border))]/60 rounded-xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/50"
          />
          <input 
            required 
            value={city} 
            onChange={e => setCity(e.target.value)} 
            placeholder="City" 
            className="w-full bg-[rgb(var(--ml-bg-primary))] border border-[rgb(var(--ml-border))]/60 rounded-xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/50"
          />
        </div>
        <div className="flex justify-end pt-3 border-t border-[rgb(var(--ml-border))]/15">
          <button 
            disabled={isSubmitting}
            type="submit" 
            className="bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-6 py-2.5 text-sm rounded-xl hover:bg-[rgb(var(--ml-accent-dark))] hover-lift transition-all shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creating..." : "Add Property"}
          </button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[1, 2].map((i) => (
              <div key={i} className="p-6 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse shadow-sm">
                <div className="h-7 w-1/2 bg-[rgb(var(--ml-border))]/60 rounded mb-4"></div>
                <div className="h-5 w-3/4 bg-[rgb(var(--ml-border))]/60 rounded mb-2"></div>
                <div className="h-5 w-1/4 bg-[rgb(var(--ml-border))]/60 rounded"></div>
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {properties.map(p => (
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                key={p.id} 
                className="flex flex-col p-6 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] hover-lift transition-all duration-300 group shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[rgb(var(--ml-accent))]/40"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[rgb(var(--ml-bg-primary))] rounded-xl border border-[rgb(var(--ml-border))]/60 group-hover:border-[rgb(var(--ml-accent))]/30 group-hover:bg-[rgb(var(--ml-accent))]/10 transition-all duration-300 shadow-sm">
                    <Building2 className="w-6 h-6 text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-[rgb(var(--ml-text-primary))] tracking-tight">{p.name}</h3>
                    <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-1">{p.address}</p>
                    <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))]/80">{p.city}</p>
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
