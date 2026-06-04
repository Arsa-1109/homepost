"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

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
      loadData();
    } catch (err) {
      alert("Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Properties 🏢</h1>
      </div>

      <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl space-y-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add New Property</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Name (e.g. Sunset Apartments)" 
            className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors"
          />
          <input 
            required 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="Address (e.g. 123 Main St)" 
            className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors"
          />
          <input 
            required 
            value={city} 
            onChange={e => setCity(e.target.value)} 
            placeholder="City" 
            className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors"
          />
        </div>
        <button 
          disabled={isSubmitting}
          type="submit" 
          className="bg-[rgb(var(--ml-accent))] text-white font-medium p-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Add Property"}
        </button>
      </form>

      {loading ? (
        <div className="animate-pulse">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl text-[rgb(var(--ml-text-secondary))]">
          You haven't added any properties yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map(p => (
            <div key={p.id} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] group hover:border-[rgb(var(--ml-accent))] transition-colors">
              <h3 className="font-bold text-xl group-hover:text-[rgb(var(--ml-accent))] transition-colors">{p.name}</h3>
              <p className="text-[rgb(var(--ml-text-secondary))] mt-2">{p.address}</p>
              <p className="text-[rgb(var(--ml-text-secondary))]">{p.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
