"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";

type Property = { id: string; name: string };
type Unit = { id: string; unit_label: string };
type Announcement = {
  id: string;
  property_id: string;
  unit_id?: string | null;
  title: string;
  body: string;
  created_at: string;
};

export default function LandlordAnnouncementsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    try {
      const [props, anns] = await Promise.all([
        fetchAPI<Property[]>("/api/v1/landlord/properties"),
        fetchAPI<Announcement[]>("/api/v1/landlord/announcements")
      ]);
      setProperties(props);
      if (props.length > 0) setSelectedProperty(props[0].id);
      setAnnouncements(anns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
    setSelectedUnit("");
    loadUnits();
  }, [selectedProperty]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    
    setIsSubmitting(true);
    try {
      const payload: any = { property_id: selectedProperty, title, body };
      if (selectedUnit) payload.unit_id = selectedUnit;
      
      await fetchAPI("/api/v1/landlord/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTitle("");
      setBody("");
      toast.success("Announcement posted successfully!");
      loadData();
    } catch (err) {
      toast.error("Failed to post announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-balance">Announcements 📢</h1>

      <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl space-y-4 shadow-sm animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4 text-balance">Post New Announcement</h2>
        
        {properties.length === 0 ? (
          <p className="text-[rgb(var(--ml-text-secondary))] text-pretty">You need to add a property before posting an announcement.</p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm text-[rgb(var(--ml-text-secondary))] select-none">Select Property</label>
              <select 
                value={selectedProperty} 
                onChange={e => setSelectedProperty(e.target.value)}
                className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] appearance-none cursor-pointer"
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id} className="bg-background">{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[rgb(var(--ml-text-secondary))] select-none">Select Unit (Optional)</label>
              <select 
                value={selectedUnit} 
                onChange={e => setSelectedUnit(e.target.value)}
                className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] appearance-none cursor-pointer"
              >
                <option value="" className="bg-background">All Units (Property-wide)</option>
                {units.map(u => (
                  <option key={u.id} value={u.id} className="bg-background">{u.unit_label}</option>
                ))}
              </select>
            </div>

            <input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Announcement Title" 
              className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all"
            />
            <textarea 
              required 
              rows={4}
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="What do you want to tell your tenants?" 
              className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all resize-none"
            />
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="w-full bg-[rgb(var(--ml-accent))] text-white font-medium p-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Posting..." : "Post Announcement"}
            </button>
          </>
        )}
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b border-[rgb(var(--ml-border))] pb-2 text-balance">Recent Announcements</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 w-1/3 bg-[rgb(var(--ml-border))] rounded-md"></div>
                  <div className="h-4 w-20 bg-[rgb(var(--ml-border))] rounded-md"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-[rgb(var(--ml-border))] rounded-md"></div>
                  <div className="h-4 w-5/6 bg-[rgb(var(--ml-border))] rounded-md"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-[rgb(var(--ml-border))]">
                  <div className="h-4 w-32 bg-[rgb(var(--ml-border))] rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-[rgb(var(--ml-text-secondary))] py-4 text-pretty">No announcements posted yet.</div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-balance">{ann.title}</h3>
                <span className="text-xs text-[rgb(var(--ml-text-secondary))] tabular-nums">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap text-pretty">{ann.body}</p>
              <div className="mt-4 pt-4 border-t border-[rgb(var(--ml-border))] text-xs text-[rgb(var(--ml-text-secondary))]">
                Property: {properties.find(p => p.id === ann.property_id)?.name || "Unknown"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
