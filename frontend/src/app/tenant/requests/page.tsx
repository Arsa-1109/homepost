"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "emergency";
  created_at: string;
};

export default function TenantRequestsPage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await fetchAPI<MaintenanceRequest[]>("/api/v1/tenant/maintenance");
        setRequests(data);
      } catch (err) {
        console.error("Failed to load requests", err);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        <Link 
          href="/tenant/requests/new" 
          className="bg-[rgb(var(--ml-accent))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Request
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[rgb(var(--ml-text-secondary))] animate-pulse">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))]">
          <p className="text-[rgb(var(--ml-text-secondary))]">No maintenance requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg group-hover:text-[rgb(var(--ml-accent))] transition-colors">{req.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-bold ${getStatusColor(req.status)}`}>
                  {req.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-[rgb(var(--ml-text-secondary))] line-clamp-2">{req.description}</p>
              <div className="mt-4 text-xs text-[rgb(var(--ml-text-secondary))] flex items-center justify-between">
                <span>Priority: {req.priority.toUpperCase()}</span>
                <span>{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
