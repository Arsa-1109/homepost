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

      <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl space-y-4 shadow-sm animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4 text-balance">Add New Property</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Name (e.g. Sunset Apartments)" 
            className="bg-[rgb(var(--ml-bg-tertiary))] shadow-sm border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all"
          />
          <input 
            required 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="Address (e.g. 123 Main St)" 
            className="bg-[rgb(var(--ml-bg-tertiary))] shadow-sm border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all"
          />
          <input 
            required 
            value={city} 
            onChange={e => setCity(e.target.value)} 
            placeholder="City" 
            className="bg-[rgb(var(--ml-bg-tertiary))] shadow-sm border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all"
          />
        </div>
        <button 
          disabled={isSubmitting}
          type="submit" 
          className="bg-[rgb(var(--ml-accent))] text-white font-medium p-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Creating..." : "Add Property"}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="animate-pulse flex items-center space-x-4"
          >
            <div className="h-12 w-12 bg-[rgb(var(--ml-bg-tertiary))] rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-[250px] bg-[rgb(var(--ml-bg-tertiary))] rounded"></div>
              <div className="h-4 w-[200px] bg-[rgb(var(--ml-bg-tertiary))] rounded"></div>
            </div>
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
                className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <h3 className="font-bold text-xl">{p.name}</h3>
                <p className="text-[rgb(var(--ml-text-secondary))] mt-2">{p.address}</p>
                <p className="text-[rgb(var(--ml-text-secondary))]">{p.city}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
