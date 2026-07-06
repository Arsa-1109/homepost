"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { Megaphone } from "lucide-react";

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
    <div className="w-full min-w-0 space-y-8 max-w-2xl mx-auto animate-fade-slide-up">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] shrink-0">
          <Megaphone className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
          Announcements
        </h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="px-6 py-6 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse shadow-sm">
              <div className="h-6 w-1/3 bg-[rgb(var(--ml-border))]/60 rounded-md mb-4" />
              <div className="h-4 w-full bg-[rgb(var(--ml-border))]/60 rounded-md mb-2" />
              <div className="h-4 w-2/3 bg-[rgb(var(--ml-border))]/60 rounded-md" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[rgb(var(--ml-border))]/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--ml-bg-tertiary))] flex items-center justify-center mb-5 shadow-inner text-[rgb(var(--ml-text-muted))]">
            <Megaphone className="w-6 h-6" />
          </div>
          <p className="text-[rgb(var(--ml-text-primary))] font-bold text-lg">No announcements yet</p>
          <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-2">Check back later for updates from your landlord</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className="p-6 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover-lift transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                <h3 className="font-extrabold text-xl text-[rgb(var(--ml-text-primary))] leading-tight">{ann.title}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] sm:mt-1 shrink-0">
                  {new Date(ann.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap leading-relaxed">{ann.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
