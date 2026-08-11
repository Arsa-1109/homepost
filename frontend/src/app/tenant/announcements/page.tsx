"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, 
  Search, 
  Calendar, 
  CheckCircle2,
  Building
} from "lucide-react";

type Announcement = {
  id: string;
  property_id: string;
  unit_id?: string | null;
  title: string;
  body: string;
  created_at: string;
};

export default function TenantAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "RECENT" | "PROPERTY" | "UNIT">("ALL");

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

  const [nowTimestamp] = useState(() => Date.now());

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        ann.title.toLowerCase().includes(query) || 
        ann.body.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (selectedFilter === "RECENT") {
        const sevenDaysAgo = nowTimestamp - 7 * 24 * 60 * 60 * 1000;
        return new Date(ann.created_at).getTime() >= sevenDaysAgo;
      }
      if (selectedFilter === "PROPERTY") {
        return !ann.unit_id;
      }
      if (selectedFilter === "UNIT") {
        return !!ann.unit_id;
      }
      return true;
    });
  }, [announcements, searchQuery, selectedFilter, nowTimestamp]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="space-y-2">
          <div className="skeleton h-8 w-56 rounded-xl" />
          <div className="skeleton h-4 w-72 rounded-md" />
        </div>
        <div className="p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] h-36 skeleton" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-slide-up pb-16">
      {/* Header Section */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
              Landlord Broadcasts
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Announcements
              <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                {announcements.length}
              </span>
            </h1>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
              Stay updated with important notices, building policies, and maintenance alerts from your landlord.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {announcements.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {(["ALL", "RECENT", "PROPERTY", "UNIT"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === filter
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                      : "bg-[rgb(var(--ml-bg-tertiary))]/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/40 hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  {filter === "ALL" && "All Notices"}
                  {filter === "RECENT" && "Last 7 Days"}
                  {filter === "PROPERTY" && "Property-Wide"}
                  {filter === "UNIT" && "Your Unit Only"}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Feed Container */}
      <div className="space-y-4">
        {announcements.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
              Notice Feed ({filteredAnnouncements.length})
            </h2>
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {announcements.length === 0 ? (
              /* Genuinely No Announcements Empty State */
              <motion.div
                key="empty-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">You're all caught up!</h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                    No announcements have been posted by your landlord yet. Important updates and notices will appear here.
                  </p>
                </div>
              </motion.div>
            ) : filteredAnnouncements.length === 0 ? (
              /* Zero Search/Filter Results Empty State */
              <motion.div
                key="empty-search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3"
              >
                <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">No announcements found</p>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Try a different search or filter.</p>
              </motion.div>
            ) : (
              filteredAnnouncements.map((ann) => {
                const isUnitSpecific = !!ann.unit_id;

                return (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="p-6 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-text-primary))]/20 hover:bg-[rgb(var(--ml-bg-secondary))]/90 transition-colors duration-200 space-y-3 relative group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-md border font-bold uppercase tracking-wider ${
                          isUnitSpecific
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        }`}>
                          {isUnitSpecific ? "Direct Notice" : "Property-Wide"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--ml-text-secondary))] font-medium">
                        <Calendar className="w-3.5 h-3.5 opacity-60" />
                        <span>
                          {new Date(ann.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-[rgb(var(--ml-text-primary))] leading-snug">
                        {ann.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap leading-relaxed">
                        {ann.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
