"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

type Property = {
  id: string;
  name: string;
};

type Unit = {
  id: string;
  property_id: string;
  unit_label: string;
  rent_due_day: number;
};

function UnitCard({ u }: { u: Unit }) {
  const [keepData, setKeepData] = useState(true);

  return (
    <div className="p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-lg">{u.unit_label}</h3>
        <p className="text-sm text-[rgb(var(--ml-text-secondary))] mt-1 mb-4">Rent due on day {u.rent_due_day}</p>
      </div>
      
      <div className="mt-auto flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm text-[rgb(var(--ml-text-secondary))] cursor-pointer">
          <input 
            type="checkbox" 
            checked={keepData}
            onChange={(e) => setKeepData(e.target.checked)}
            className="rounded border-[rgb(var(--ml-border))] accent-[rgb(var(--ml-accent))]"
          />
          Keep previous tenant documents?
        </label>

        <button
          onClick={async () => {
            try {
              const res = await fetchAPI<{ token: string }>("/api/v1/landlord/generate-invite", {
                method: "POST",
                body: JSON.stringify({ unit_id: u.id, clear_data: !keepData })
              });
              const link = `${window.location.origin}/join/${res.token}`;
              navigator.clipboard.writeText(link);
              alert("Invite link copied to clipboard!\n\n" + link);
            } catch (err) {
              alert("Failed to generate invite.");
            }
          }}
          className="text-xs bg-[rgb(var(--ml-accent))] text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity w-full"
        >
          Copy Invite Link
        </button>
      </div>
    </div>
  );
}

export default function LandlordUnitsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [unitLabel, setUnitLabel] = useState("");
  const [rentDay, setRentDay] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProps() {
      try {
        const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
        setProperties(data);
        if (data.length > 0) {
          setSelectedProperty(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProps();
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;
    async function loadUnits() {
      try {
        const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${selectedProperty}/units`);
        setUnits(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadUnits();
  }, [selectedProperty]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    
    setIsSubmitting(true);
    try {
      const newUnit = await fetchAPI<Unit>("/api/v1/landlord/units", {
        method: "POST",
        body: JSON.stringify({ 
          property_id: selectedProperty, 
          unit_label: unitLabel, 
          rent_due_day: parseInt(rentDay) 
        }),
      });
      setUnits(prev => [...prev, newUnit]);
      setUnitLabel("");
      setRentDay("1");
    } catch (err) {
      alert("Failed to create unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Units 🚪</h1>
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-64 bg-[rgb(var(--ml-border))] rounded-md"></div>
        <div className="h-40 w-full bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 w-full bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Units 🚪</h1>

      {properties.length === 0 ? (
        <div className="text-center py-12 border border-[rgb(var(--ml-border))] rounded-xl">
          Please add a property first before managing units.
        </div>
      ) : (
        <>
          <div className="flex gap-4 items-center">
            <span className="font-medium text-[rgb(var(--ml-text-secondary))]">Select Property:</span>
            <select 
              value={selectedProperty} 
              onChange={e => setSelectedProperty(e.target.value)}
              className="bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-lg p-2 outline-none focus:border-[rgb(var(--ml-accent))] appearance-none"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id} className="bg-background">{p.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl space-y-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Add New Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                value={unitLabel} 
                onChange={e => setUnitLabel(e.target.value)} 
                placeholder="Unit Label (e.g. Apt 101, Basement, etc.)" 
                className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[rgb(var(--ml-text-secondary))]">Rent Due Day:</span>
                <input 
                  required 
                  type="number"
                  min="1" max="31"
                  value={rentDay} 
                  onChange={e => setRentDay(e.target.value)} 
                  className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors w-24"
                />
              </div>
            </div>
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="bg-[rgb(var(--ml-accent))] text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Add Unit"}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {units.length === 0 ? (
              <div className="col-span-full text-center py-8 text-[rgb(var(--ml-text-secondary))] border border-dashed border-[rgb(var(--ml-border))] rounded-xl">
                No units in this property yet.
              </div>
            ) : (
              units.map(u => (
                <UnitCard key={u.id} u={u} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
