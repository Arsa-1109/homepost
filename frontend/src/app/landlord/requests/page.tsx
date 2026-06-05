"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

type MaintenanceRequest = {
  id: string;
  tenant_id: string;
  unit_id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "emergency";
  created_at: string;
  image_urls?: string[];
};

export default function LandlordMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const data = await fetchAPI<MaintenanceRequest[]>("/api/v1/landlord/maintenance");
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetchAPI(`/api/v1/landlord/maintenance/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "in_progress": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "resolved": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "closed": return "bg-gray-500/20 text-gray-500 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Maintenance Requests 🔧</h1>

      {loading ? (
        <div className="animate-pulse">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl text-[rgb(var(--ml-text-secondary))]">
          No maintenance requests across your properties.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-xl">{req.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-bold ${getStatusColor(req.status)}`}>
                    {req.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap">{req.description}</p>
                
                {req.image_urls && req.image_urls.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide">Attached Photo / Document:</span>
                    <div className="flex flex-wrap gap-4">
                      {req.image_urls.map((url, idx) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group block overflow-hidden rounded-lg border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-colors bg-slate-900"
                        >
                          <div className="relative w-32 h-24 flex items-center justify-center overflow-hidden">
                            <img 
                              src={url} 
                              alt={`Attachment ${idx + 1}`} 
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'text-xs text-[rgb(var(--ml-text-secondary))] p-2 text-center font-medium';
                                  placeholder.innerText = 'View Document';
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-[rgb(var(--ml-text-secondary))] flex gap-4 pt-2">
                  <span>Priority: {req.priority.toUpperCase()}</span>
                  <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="md:w-48 flex flex-col justify-center space-y-2 border-t md:border-t-0 md:border-l border-[rgb(var(--ml-border))] pt-4 md:pt-0 md:pl-6">
                <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mb-1 uppercase tracking-wide">Update Status</span>
                <select 
                  value={req.status}
                  onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                  className="bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-2 text-sm outline-none focus:border-[rgb(var(--ml-accent))] appearance-none w-full"
                >
                  <option value="open" className="bg-[#1e1e1e]">Open</option>
                  <option value="in_progress" className="bg-[#1e1e1e]">In Progress</option>
                  <option value="resolved" className="bg-[#1e1e1e]">Resolved</option>
                  <option value="closed" className="bg-[#1e1e1e]">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
