"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export default function TenantAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAPI<Announcement[]>("/api/v1/tenant/announcements");
        setAnnouncements(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Property Announcements 📢</h1>

      {loading ? (
        <div className="text-center py-12 text-[rgb(var(--ml-text-secondary))] animate-pulse">
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))]">
          <p className="text-[rgb(var(--ml-text-secondary))]">No announcements from your landlord.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map(ann => (
            <div key={ann.id} className="p-6 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl">{ann.title}</h3>
                <span className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap">{ann.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
