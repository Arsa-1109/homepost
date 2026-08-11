"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";

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
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Days until the next occurrence of `day` of month */
function daysUntilRent(dueDay: number): number {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (thisMonth <= today) {
    // Due date already passed this month — look at next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    return Math.round((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
  return Math.round((thisMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

import { Wrench, Megaphone, FileText } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function CountdownCard({
  label,
  value,
  sublabel,
  urgent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-2xl border flex flex-col items-center text-center justify-center gap-1 transition-all ${
        urgent
          ? "bg-red-500/10 border-red-500/40"
          : "bg-[rgb(var(--ml-bg-secondary))] border-border"
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-widest text-[rgb(var(--ml-text-secondary))]">
        {label}
      </span>
      <span
        className={`text-5xl font-extrabold my-2 ${
          urgent ? "text-red-400" : "text-[rgb(var(--ml-accent))]"
        }`}
      >
        {value}
      </span>
      {sublabel && (
        <span className="text-sm text-[rgb(var(--ml-text-secondary))]">{sublabel}</span>
      )}
    </div>
  );
}

export default function TenantDashboard() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sizes = JSON.parse(localStorage.getItem('tenant_dashboard_sizes') || '{}');
      if (sizes.welcome) document.documentElement.style.setProperty('--ts-welcome', sizes.welcome + 'px');
      if (sizes.countdown) document.documentElement.style.setProperty('--ts-countdown', sizes.countdown + 'px');
      if (sizes.actions) document.documentElement.style.setProperty('--ts-actions', sizes.actions + 'px');
      if (sizes.requests) document.documentElement.style.setProperty('--ts-requests', sizes.requests + 'px');
    } catch(e) {}

    async function loadAll() {
      try {
        const [prof, reqs] = await Promise.all([
          fetchAPI<TenantProfile>("/api/v1/tenant/profile"),
          fetchAPI<MaintenanceRequest[]>("/api/v1/tenant/maintenance"),
        ]);
        setProfile(prof);
        setRequests(reqs.slice(0, 3)); // Show last 3 requests
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver(() => {
      if (!gridRef.current) return;
      const children = gridRef.current.children;
      if (children.length >= 4) {
        const sizes = {
          welcome: children[0].getBoundingClientRect().height,
          countdown: children[1].getBoundingClientRect().height,
          actions: children[2].getBoundingClientRect().height,
          requests: children[3].getBoundingClientRect().height,
        };
        localStorage.setItem('tenant_dashboard_sizes', JSON.stringify(sizes));
      }
    });
    Array.from(gridRef.current.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-4 w-36 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="p-6 rounded-2xl border border-border bg-[rgb(var(--ml-bg-secondary))]/60 flex flex-col items-center justify-center space-y-3 h-[170px]">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-12 w-20 rounded-xl" />
            <div className="skeleton h-3 w-40 rounded" />
          </div>

          <div className="p-5 rounded-2xl border border-border bg-[rgb(var(--ml-bg-secondary))]/60 flex flex-col justify-between space-y-3 h-[170px]">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="grid grid-cols-3 gap-3">
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="p-4 rounded-xl border border-border bg-[rgb(var(--ml-bg-secondary))]/80 flex items-center justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-4 w-44 rounded" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
                <div className="skeleton h-5 w-20 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-center">
          <p className="text-red-400 font-medium mb-1">Could not load your dashboard</p>
          <p className="text-sm text-[rgb(var(--ml-text-secondary))]">{error}</p>
        </div>
      </div>
    );
  }

  const rentDays = profile ? daysUntilRent(profile.rent_due_day) : null;
  const leaseDays = profile ? daysUntil(profile.lease_end) : null;
  const leaseUrgent = leaseDays !== null && leaseDays <= 30;
  const rentUrgent = rentDays !== null && rentDays <= 3;

  return (
    <div ref={gridRef} className="space-y-6 max-w-4xl mx-auto">

      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome Home</h1>
        {profile && (
          <p className="text-[rgb(var(--ml-text-secondary))] mt-1 text-sm">
            {profile.unit_label} · {profile.property_name}
            {profile.property_city ? `, ${profile.property_city}` : ""}
          </p>
        )}
      </div>

      {/* Hero cards: Countdown + Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <CountdownCard
          label="Rent Due In"
          value={rentDays !== null ? `${rentDays}d` : "—"}
          sublabel={
            profile
              ? `Due on the ${profile.rent_due_day}${getOrdinalSuffix(profile.rent_due_day)} of each month`
              : undefined
          }
          urgent={rentUrgent}
        />

        <div className="p-5 rounded-2xl border border-border bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[rgb(var(--ml-text-secondary))]">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/tenant/requests/new"
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-border hover:border-orange-500/40 hover:bg-orange-500/10 transition-all text-center group"
            >
              <Wrench className="size-6 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">New Request</span>
            </Link>
            <Link
              href="/tenant/announcements"
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-border hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-center group"
            >
              <Megaphone className="size-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Announcements</span>
            </Link>
            <Link
              href="/tenant/documents"
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-border hover:border-blue-500/40 hover:bg-blue-500/10 transition-all text-center group"
            >
              <FileText className="size-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Documents</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent maintenance requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[rgb(var(--ml-text-secondary))]">
            Recent Requests
          </h2>
          <Link
            href="/tenant/requests"
            className="text-xs text-[rgb(var(--ml-accent))] hover:underline"
          >
            View all →
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 rounded-2xl border border-orange-500/20 shadow-[0_0_20px_rgba(251,146,60,0.04)] bg-[rgb(var(--ml-bg-secondary))]/60 text-center">
            <p className="text-[rgb(var(--ml-text-secondary))] text-sm">No maintenance requests yet.</p>
            <Link
              href="/tenant/requests/new"
              className="mt-3 inline-block text-sm font-medium text-orange-400 hover:underline"
            >
              Submit your first request →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/tenant/requests?requestId=${req.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))]/50 transition-colors cursor-pointer block"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{req.title}</p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] mt-0.5">
                    {new Date(req.created_at).toLocaleDateString()}
                    {" · "}Priority: {req.priority.toUpperCase()}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-bold ${
                    STATUS_COLOR[req.status] ?? STATUS_COLOR.closed
                  }`}
                >
                  {req.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
