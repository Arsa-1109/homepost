"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Property = { id: string; name: string };
type Unit = { id: string; unit_label: string; property_id: string };

export default function PendingTenantsPage() {
  const [tenants, setTenants] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for approval form
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [t, p] = await Promise.all([
          fetchAPI<User[]>("/api/v1/landlord/pending-tenants"),
          fetchAPI<Property[]>("/api/v1/landlord/properties")
        ]);
        setTenants(t);
        setProperties(p);
      } catch (err) {
        console.error("Failed to load pending tenants", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;
    async function loadUnits() {
      try {
        const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${selectedProperty}/units`);
        setUnits(data);
        if (data.length > 0) setSelectedUnit(data[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    loadUnits();
  }, [selectedProperty]);

  const handleApprove = async () => {
    if (!selectedTenant || !selectedUnit) return;
    setIsSubmitting(true);
    try {
      await fetchAPI("/api/v1/landlord/approve-tenant", {
        method: "POST",
        body: JSON.stringify({ user_id: selectedTenant, unit_id: selectedUnit }),
      });
      setTenants(prev => prev.filter(t => t.id !== selectedTenant));
      setSelectedTenant(null);
    } catch (err) {
      alert("Failed to approve tenant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async (userId: string) => {
    if (!confirm("Are you sure you want to deny this request?")) return;
    try {
      await fetchAPI("/api/v1/landlord/deny-tenant", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      setTenants(prev => prev.filter(t => t.id !== userId));
      if (selectedTenant === userId) setSelectedTenant(null);
    } catch (err) {
      alert("Failed to deny tenant.");
    }
  };

  if (loading) return <div className="animate-pulse">Loading pending requests...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Pending Tenants 👤</h1>
      <p className="text-[rgb(var(--ml-text-secondary))]">
        Tenants who requested access using your email address will appear here.
      </p>

      {tenants.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl text-[rgb(var(--ml-text-secondary))]">
          No pending tenant requests.
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map(t => (
            <div key={t.id} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg">{t.first_name} {t.last_name}</h3>
                <p className="text-[rgb(var(--ml-text-secondary))]">{t.email}</p>
              </div>

              {selectedTenant === t.id ? (
                <div className="bg-black/20 dark:bg-black/50 p-4 rounded-lg w-full md:w-auto space-y-3 border border-[rgb(var(--ml-border))]">
                  <div className="text-sm font-semibold text-[rgb(var(--ml-accent))]">Assign to Unit:</div>
                  <select 
                    value={selectedProperty} 
                    onChange={e => setSelectedProperty(e.target.value)}
                    className="w-full bg-transparent border border-[rgb(var(--ml-border))] rounded p-2 outline-none text-sm appearance-none"
                  >
                    <option value="" disabled>Select Property</option>
                    {properties.map(p => <option key={p.id} value={p.id} className="bg-[#1e1e1e]">{p.name}</option>)}
                  </select>
                  
                  {selectedProperty && (
                    <select 
                      value={selectedUnit} 
                      onChange={e => setSelectedUnit(e.target.value)}
                      className="w-full bg-transparent border border-[rgb(var(--ml-border))] rounded p-2 outline-none text-sm appearance-none"
                    >
                      {units.map(u => <option key={u.id} value={u.id} className="bg-[#1e1e1e]">{u.unit_label}</option>)}
                    </select>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleApprove}
                      disabled={isSubmitting || !selectedUnit}
                      className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-500 transition-colors disabled:opacity-50 flex-1"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setSelectedTenant(null)}
                      className="border border-[rgb(var(--ml-border))] px-3 py-1.5 rounded text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedTenant(t.id)}
                    className="bg-[rgb(var(--ml-accent))] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleDeny(t.id)}
                    className="border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-500/10 transition-colors"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
