"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { fetchAPI } from "@/lib/api";
import { Wrench, Megaphone, Calendar, Plus, ArrowRight, Clock, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type TenantProfile = {
  unit_label: string;
  property_name: string;
  property_address: string;
  property_city: string;
  lease_start: string | null;
  lease_end: string | null;
  rent_due_day: number;
  is_active: boolean;
};

type MaintenanceRequest = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/** Days from today until the given date (positive = future, negative = past) */
function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Days until the next occurrence of `day` of month */
function daysUntilRent(dueDay: number): number {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (thisMonth <= today) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    return Math.round((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.round((thisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function TenantDashboard() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    async function loadAll() {
      try {
        const token = await getToken();
        const [prof, reqs, anns] = await Promise.all([
          fetchAPI<TenantProfile>("/api/v1/tenant/profile", {}, token),
          fetchAPI<MaintenanceRequest[]>("/api/v1/tenant/maintenance", {}, token),
          fetchAPI<Announcement[]>("/api/v1/tenant/announcements", {}, token),
        ]);
        setProfile(prof);
        setRequests(reqs.slice(0, 5)); // Show up to 5 recent requests
        setAnnouncements(anns);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [isLoaded, getToken]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-4 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] h-28 skeleton" />
          <div className="p-6 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] h-28 skeleton" />
        </div>
        <div className="h-14 rounded-2xl skeleton" />
        <div className="space-y-3">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto space-y-4 pt-8">
        <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/10 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 font-bold mb-1">Could not load your dashboard</p>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))]">{error}</p>
        </div>
      </div>
    );
  }

  const rentDays = profile ? daysUntilRent(profile.rent_due_day) : null;
  const rentUrgent = rentDays !== null && rentDays <= 3;
  const leaseDays = profile ? daysUntil(profile.lease_end) : null;
  const isLeaseExpired = leaseDays !== null && leaseDays < 0;
  const leaseUrgent = leaseDays !== null && leaseDays >= 0 && leaseDays <= 30;
  const isLeaseDateValid = Boolean(profile?.lease_end && !isNaN(new Date(profile.lease_end).getTime()));
  const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-slide-up pb-16">
      {/* 1. Header Section */}
      <div className="space-y-1 pb-1">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Welcome Home
        </h1>
        {profile && (
          <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
            {profile.unit_label} · {profile.property_name}
            {profile.property_city ? `, ${profile.property_city}` : ""}
          </p>
        )}
      </div>

      {/* 2. Latest Announcement Banner (if available) */}
      {latestAnnouncement && (
        <Link 
          href={`/tenant/announcements?id=${latestAnnouncement.id}`}
          className="group block p-5 rounded-3xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                  Latest Announcement
                </span>
                <span className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium">
                  {new Date(latestAnnouncement.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[rgb(var(--ml-text-primary))] group-hover:text-purple-400 transition-colors mt-0.5 truncate">
                {latestAnnouncement.title}
              </h3>
              <p className="text-xs text-[rgb(var(--ml-text-secondary))] line-clamp-1 mt-0.5">
                {latestAnnouncement.body}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 transition-transform self-center shrink-0" />
          </div>
        </Link>
      )}

      {/* 3. Hero Metric Cards: Rent Due + Lease Expiration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rent Due Card */}
        <div 
          className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] ${
            rentUrgent
              ? "bg-red-500/10 border-red-500/30 text-red-500"
              : "bg-[rgb(var(--ml-bg-secondary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/20"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                Rent Due In
              </span>
              <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">
                {profile
                  ? `Due on the ${profile.rent_due_day}${getOrdinalSuffix(profile.rent_due_day)} of each month`
                  : "Monthly rent schedule"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span 
                className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  rentUrgent ? "text-red-500" : "text-[rgb(var(--ml-accent))]"
                }`}
              >
                {rentDays !== null ? `${rentDays}d` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Lease Expiration Card */}
        <div 
          className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] ${
            isLeaseExpired
              ? "bg-red-500/10 border-red-500/30 text-red-500"
              : leaseUrgent
              ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
              : "bg-[rgb(var(--ml-bg-secondary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/20"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                Lease Ends In
              </span>
              <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">
                {isLeaseDateValid
                  ? `${isLeaseExpired ? "Expired on" : "Ends on"} ${new Date(profile!.lease_end!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : "No lease end date set"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span 
                className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  isLeaseExpired ? "text-red-500 text-2xl sm:text-3xl" : leaseUrgent ? "text-amber-500" : "text-[rgb(var(--ml-text-primary))]"
                }`}
              >
                {isLeaseExpired ? "Expired" : leaseDays !== null ? `${leaseDays}d` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Primary Single CTA: New Maintenance Request */}
      <Button
        asChild
        size="lg"
        className="w-full h-14 rounded-2xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-sm shadow-md cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
      >
        <Link href="/tenant/requests/new" className="flex items-center justify-center gap-2">
          <Wrench className="w-5 h-5" />
          <span>New Maintenance Request</span>
        </Link>
      </Button>

      {/* 5. Main Activity Section: Recent Requests */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
            Recent Maintenance Activity
          </h2>
          <Link
            href="/tenant/requests"
            className="text-xs font-bold text-[rgb(var(--ml-text-primary))] hover:underline flex items-center gap-1"
          >
            View all ({requests.length}) <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 rounded-3xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm text-[rgb(var(--ml-text-primary))]">All clear! No active requests</p>
              <p className="text-xs text-[rgb(var(--ml-text-secondary))] max-w-sm mx-auto">
                Need something fixed? Tap the button above to submit a new ticket directly to your landlord.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/tenant/requests?id=${req.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] gap-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-extrabold ${
                        STATUS_COLOR[req.status] ?? STATUS_COLOR.closed
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium">
                      Priority: <span className="capitalize">{req.priority}</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors truncate">
                    {req.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[rgb(var(--ml-text-secondary))] pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
