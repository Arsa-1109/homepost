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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-balance">Properties 🏢</h1>
      </div>

      <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl space-y-5 shadow-sm animate-fadeIn">
        <div>
          <h2 className="text-xl font-semibold text-[rgb(var(--ml-text-primary))] text-balance">Add New Property</h2>
          <p className="text-sm text-[rgb(var(--ml-text-secondary))] mt-1">Enter the details of your new building to start managing its units.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Name (e.g. Sunset Apartments)" 
            className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] rounded-lg p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all placeholder-[rgb(var(--ml-text-muted))]"
          />
          <input 
            required 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="Address (e.g. 123 Main St)" 
            className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] rounded-lg p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all placeholder-[rgb(var(--ml-text-muted))]"
          />
          <input 
            required 
            value={city} 
            onChange={e => setCity(e.target.value)} 
            placeholder="City" 
            className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] rounded-lg p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all placeholder-[rgb(var(--ml-text-muted))]"
          />
        </div>
        <div className="flex justify-end pt-2 border-t border-[rgb(var(--ml-border))]">
          <button 
            disabled={isSubmitting}
            type="submit" 
            className="bg-[rgb(var(--ml-accent))] text-white font-medium px-6 py-2.5 text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
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
              <div key={i} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse">
                <div className="h-7 w-1/2 bg-[rgb(var(--ml-border))] rounded mb-4"></div>
                <div className="h-5 w-3/4 bg-[rgb(var(--ml-border))] rounded mb-2"></div>
                <div className="h-5 w-1/4 bg-[rgb(var(--ml-border))] rounded"></div>
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
                className="flex flex-col p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[rgb(var(--ml-bg-tertiary))] rounded-lg border border-[rgb(var(--ml-border))] group-hover:border-[rgb(var(--ml-accent))] group-hover:bg-[rgba(var(--ml-accent),0.1)] transition-colors">
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
