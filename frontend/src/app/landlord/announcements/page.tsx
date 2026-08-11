"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-balance">Announcements</h1>

      <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-border rounded-xl space-y-4 shadow-sm animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4 text-balance">Post New Announcement</h2>
        
        {properties.length === 0 ? (
          <p className="text-[rgb(var(--ml-text-secondary))] text-pretty">You need to add a property before posting an announcement.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] select-none">Select Property</label>
                <Select value={selectedProperty} onValueChange={(val) => setSelectedProperty(val || "")}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left line-clamp-1 truncate">
                      {selectedProperty ? properties.find(p => p.id === selectedProperty)?.name : "Select Property"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] select-none">Select Unit (Optional)</label>
                <Select value={selectedUnit || "all"} onValueChange={(val) => setSelectedUnit(val === "all" ? "" : val || "")}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left line-clamp-1 truncate">
                      {selectedUnit === "all" || !selectedUnit ? "All Units (Property-wide)" : units.find(u => u.id === selectedUnit)?.unit_label ? `Unit ${units.find(u => u.id === selectedUnit)?.unit_label}` : "Select Unit"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units (Property-wide)</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>Unit {u.unit_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <input 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Announcement Title" 
              className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-border rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all"
            />
            <textarea 
              required 
              rows={4}
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="What do you want to tell your tenants?" 
              className="w-full bg-[rgb(var(--ml-bg-tertiary))] border border-border rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all resize-none"
            />
            <Button 
              type="submit"
              isLoading={isSubmitting}
              className="w-full sm:w-auto bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/90 text-white font-medium px-6 py-3 rounded-lg cursor-pointer"
            >
              Post Announcement
            </Button>
          </>
        )}
      </form>

      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b border-border pb-2 text-balance">Recent Announcements</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="p-6 border border-border rounded-xl bg-[rgb(var(--ml-bg-secondary))]/60 space-y-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-6 w-48 rounded-lg skeleton" />
                  <div className="h-4 w-20 rounded-md skeleton" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded-md skeleton" />
                  <div className="h-4 w-5/6 rounded-md skeleton" />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="h-3.5 w-36 rounded-md skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center rounded-2xl bg-[rgb(var(--ml-bg-secondary))]/60 border border-blue-500/20 shadow-[0_0_20px_rgba(96,165,250,0.04)]">
            <p className="text-base font-semibold text-[rgb(var(--ml-text-primary))] mb-1">No Announcements Posted</p>
            <p className="text-sm text-[rgb(var(--ml-text-secondary))]">Post an announcement to communicate with your tenants.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="p-6 border border-border rounded-xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(96,165,250,0.06)] transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-balance">{ann.title}</h3>
                <span className="text-xs text-[rgb(var(--ml-text-secondary))] tabular-nums">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap text-pretty">{ann.body}</p>
              <div className="mt-4 pt-4 border-t border-border text-xs text-[rgb(var(--ml-text-secondary))]">
                Property: {properties.find(p => p.id === ann.property_id)?.name || "Unknown"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
