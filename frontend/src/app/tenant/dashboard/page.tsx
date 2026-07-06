"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import { BentoGrid, BentoBox } from "@/components/ui/bento-box";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  Megaphone, 
  FileText, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Home, 
  AlertCircle,
  TrendingUp,
  User
} from "lucide-react";

type TenantProfile = {
  unit_label: string;
  property_name: string;
  property_address: string;
  property_city: string;
  lease_start: string | null;
  lease_end: string | null;
  rent_due_day: number;
  is_active: boolean;
  tenant_name: string;
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

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

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
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/10",
  in_progress: "bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-500/5 dark:border-orange-500/10",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20 dark:bg-green-500/5 dark:border-green-500/10",
  closed: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20 dark:bg-neutral-500/5 dark:border-neutral-500/10",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  medium: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
  high: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
  urgent: "bg-red-500/10 text-red-500 dark:text-red-400 font-extrabold animate-pulse",
};

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning";
  if (hr < 17) return "Good afternoon";
  return "Good evening";
}

export default function TenantDashboard() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 p-4 md:p-6 animate-pulse">
        <div className="flex flex-col gap-2.5 pb-2">
          <div className="h-9 w-48 bg-[rgb(var(--ml-border))]/50 rounded-xl" />
          <div className="h-5 w-64 bg-[rgb(var(--ml-border))]/30 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[240px] bg-[rgb(var(--ml-border))]/20 rounded-[2rem] border border-[rgb(var(--ml-border))]/30 p-1.5">
            <div className="w-full h-full bg-[rgb(var(--ml-bg-secondary))] rounded-[calc(2rem-0.375rem)]" />
          </div>
          <div className="h-[240px] bg-[rgb(var(--ml-border))]/20 rounded-[2rem] border border-[rgb(var(--ml-border))]/30 p-1.5">
            <div className="w-full h-full bg-[rgb(var(--ml-bg-secondary))] rounded-[calc(2rem-0.375rem)]" />
          </div>
          <div className="md:col-span-2 h-[340px] bg-[rgb(var(--ml-border))]/20 rounded-[2rem] border border-[rgb(var(--ml-border))]/30 p-1.5">
            <div className="w-full h-full bg-[rgb(var(--ml-bg-secondary))] rounded-[calc(2rem-0.375rem)]" />
          </div>
          <div className="h-[340px] bg-[rgb(var(--ml-border))]/20 rounded-[2rem] border border-[rgb(var(--ml-border))]/30 p-1.5">
            <div className="w-full h-full bg-[rgb(var(--ml-bg-secondary))] rounded-[calc(2rem-0.375rem)]" />
          </div>
          <div className="md:col-span-3 h-[200px] bg-[rgb(var(--ml-border))]/20 rounded-[2rem] border border-[rgb(var(--ml-border))]/30 p-1.5">
            <div className="w-full h-full bg-[rgb(var(--ml-bg-secondary))] rounded-[calc(2rem-0.375rem)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <div className="p-8 rounded-3xl border border-red-500/30 bg-red-500/5 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <p className="text-red-400 font-extrabold text-lg tracking-tight">Could not load your dashboard</p>
          <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const rentDays = profile ? daysUntilRent(profile.rent_due_day) : null;
  const leaseDays = profile ? daysUntil(profile.lease_end) : null;
  const rentUrgent = rentDays !== null && rentDays <= 3;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-4 md:p-6 animate-fade-slide-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
            <User className="w-8 h-8 text-[rgb(var(--ml-accent))]" />
            {getGreeting()}{profile?.tenant_name ? `, ${profile.tenant_name.split(" ")[0]}` : ""}
          </h1>
          {profile && (
            <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-1 pl-0.5">
              {profile.unit_label} · {profile.property_name} · {profile.property_address}
            </p>
          )}
        </div>
      </div>

      {/* Bento Grid */}
      <BentoGrid>
        
        {/* Bento 1: Welcome & Quick Navigation */}
        <BentoBox colSpan="md:col-span-2" className="flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[rgb(var(--ml-accent))]">
              Workspace
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] mt-2 leading-tight">
              Manage your home states, submit requests, and inspect documents.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3.5 mt-6">
            <Link
              href="/tenant/requests/new"
              className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-[rgb(var(--ml-border))]/60 hover:border-[rgb(var(--ml-accent))]/50 hover:bg-[rgb(var(--ml-accent))]/5 transition-all duration-300 text-center group hover-lift bg-[rgb(var(--ml-bg-primary))]"
            >
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 transition-transform duration-300 group-hover:scale-105">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-[rgb(var(--ml-text-primary))]">Request</span>
            </Link>
            <Link
              href="/tenant/announcements"
              className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-[rgb(var(--ml-border))]/60 hover:border-[rgb(var(--ml-accent))]/50 hover:bg-[rgb(var(--ml-accent))]/5 transition-all duration-300 text-center group hover-lift bg-[rgb(var(--ml-bg-primary))]"
            >
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 transition-transform duration-300 group-hover:scale-105">
                <Megaphone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-[rgb(var(--ml-text-primary))]">News</span>
            </Link>
            <Link
              href="/tenant/documents"
              className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border border-[rgb(var(--ml-border))]/60 hover:border-[rgb(var(--ml-accent))]/50 hover:bg-[rgb(var(--ml-accent))]/5 transition-all duration-300 text-center group hover-lift bg-[rgb(var(--ml-bg-primary))]"
            >
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500 transition-transform duration-300 group-hover:scale-105">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-[rgb(var(--ml-text-primary))]">Docs</span>
            </Link>
          </div>
        </BentoBox>

        {/* Bento 2: Rent Reminder (De-prioritized & Non-functional) */}
        <BentoBox colSpan="md:col-span-1" className="flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[rgb(var(--ml-text-secondary))]">
              Rent Reminder
            </span>
            <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-1">
              {profile ? `Monthly billing cycle due on the ${profile.rent_due_day}${getOrdinalSuffix(profile.rent_due_day)}` : "No cycle active"}
            </p>
          </div>
          <div className="my-auto py-2">
            <div className="flex items-baseline gap-1">
              <span className={`text-6xl font-black tracking-tighter ${rentUrgent ? "text-red-500 dark:text-red-400" : "text-[rgb(var(--ml-text-primary))]"}`}>
                {rentDays !== null ? `${rentDays}d` : "—"}
              </span>
              <span className="text-xs font-bold text-[rgb(var(--ml-text-secondary))]">remaining</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[rgb(var(--ml-text-secondary))]">
            <Clock className="w-3.5 h-3.5" />
            <span>Informational reminder</span>
          </div>
        </BentoBox>

        {/* Bento 3: Recent Maintenance Requests (Interactive) */}
        <BentoBox colSpan="md:col-span-2" className="flex flex-col justify-between min-h-[300px]">
          <div className="w-full">
            <div className="flex justify-between items-center mb-5">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[rgb(var(--ml-text-secondary))]">
                  Maintenance
                </span>
                <h3 className="text-lg font-bold text-[rgb(var(--ml-text-primary))] tracking-tight mt-0.5">Active Requests</h3>
              </div>
              <Link
                href="/tenant/requests"
                className="text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline flex items-center gap-1 group/link"
              >
                View all
                <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/link:translate-x-1" />
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="h-[160px] border border-dashed border-[rgb(var(--ml-border))]/60 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/30 flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="w-8 h-8 text-[rgb(var(--ml-text-muted))] mb-2" />
                <p className="text-[rgb(var(--ml-text-primary))] font-bold text-sm">All clear!</p>
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-1">No active maintenance issues at the moment.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {requests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/tenant/requests?requestId=${req.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-[rgb(var(--ml-border))]/50 bg-[rgb(var(--ml-bg-primary))] hover:border-[rgb(var(--ml-accent))]/40 transition-all duration-300 group/item hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))] truncate group-hover/item:text-[rgb(var(--ml-accent))] transition-colors">
                        {req.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))]">
                          {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className="text-[10px] text-[rgb(var(--ml-text-secondary))]/60">•</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${PRIORITY_COLOR[req.priority]}`}>
                          {req.priority}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] px-2.5 py-1.5 rounded-lg border uppercase tracking-wider font-extrabold ${
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
        </BentoBox>

        {/* Bento 4: Lease Status */}
        <BentoBox colSpan="md:col-span-1" className="flex flex-col justify-between min-h-[300px]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[rgb(var(--ml-text-secondary))]">
              Lease Terms
            </span>
            <h3 className="text-lg font-bold text-[rgb(var(--ml-text-primary))] tracking-tight mt-0.5">Agreement Details</h3>
          </div>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[rgb(var(--ml-text-secondary))]/5 text-[rgb(var(--ml-text-secondary))]">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[rgb(var(--ml-text-secondary))]">Lease Period</p>
                <p className="text-xs font-extrabold text-[rgb(var(--ml-text-primary))] mt-0.5 truncate">
                  {profile?.lease_start ? new Date(profile.lease_start).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"} 
                  {" to "} 
                  {profile?.lease_end ? new Date(profile.lease_end).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[rgb(var(--ml-text-secondary))]/5 text-[rgb(var(--ml-text-secondary))]">
                <Home className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[rgb(var(--ml-text-secondary))]">Status</p>
                <p className="text-xs font-extrabold text-[rgb(var(--ml-text-primary))] mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  Active Resident
                </p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Link
              href="/tenant/documents"
              className="flex items-center justify-center gap-2 w-full py-2.5 border border-[rgb(var(--ml-border))]/60 hover:border-[rgb(var(--ml-accent))]/50 hover:bg-[rgb(var(--ml-bg-secondary))] bg-[rgb(var(--ml-bg-primary))] rounded-xl text-xs font-bold text-[rgb(var(--ml-text-primary))] transition-all duration-300 hover-lift"
            >
              <FileText className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
              View Digital Agreement
            </Link>
          </div>
        </BentoBox>

        {/* Bento 5: Full Width Announcements */}
        <BentoBox colSpan="md:col-span-3" className="flex flex-col justify-between min-h-[160px]">
          <div className="w-full flex items-center justify-between mb-4 border-b border-[rgb(var(--ml-border))]/20 pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[rgb(var(--ml-text-secondary))]">
                Announcements
              </span>
            </div>
            <Link
              href="/tenant/announcements"
              className="text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline flex items-center gap-1 group/link"
            >
              All announcements
              <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/link:translate-x-1" />
            </Link>
          </div>
          <div className="w-full py-2">
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-[rgb(var(--ml-bg-primary))] border border-[rgb(var(--ml-border))]/40 p-4 rounded-xl">
              <div className="p-2.5 rounded-lg bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))]">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[rgb(var(--ml-text-secondary))]">LATEST UPDATE</p>
                <p className="text-sm font-extrabold text-[rgb(var(--ml-text-primary))] mt-0.5 truncate">
                  Welcome to the brand new Homepost Tenant Portal! We hope you love the polished experience.
                </p>
              </div>
            </div>
          </div>
        </BentoBox>

      </BentoGrid>
    </div>
  );
}
