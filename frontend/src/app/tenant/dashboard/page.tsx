"use client";

import { errorMessage } from "@/lib/errors";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { fetchAPI } from "@/lib/api";
import { unwrapPage } from "@/lib/pagination";
import { 
  Wrench, 
  Megaphone, 
  Calendar, 
  Plus, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  KeyRound,
  Send,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type TenantProfile = {
  unit_label: string;
  property_name: string;
  property_address: string;
  property_city: string;
  lease_start: string | null;
  lease_end: string | null;
  rent_due_day: number;
  is_active: boolean;
  is_pending_approval?: boolean;
  requested_landlord_email?: string | null;
  requested_landlord_name?: string | null;
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
  const router = useRouter();
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unlinked tenant form states
  const [landlordEmail, setLandlordEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const { isLoaded, getToken } = useAuth();

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const [profRes, reqsRes, annsRes] = await Promise.allSettled([
        fetchAPI<TenantProfile>("/api/v1/tenant/profile", {}, token),
        fetchAPI<{ items?: MaintenanceRequest[] } | MaintenanceRequest[]>("/api/v1/tenant/maintenance", {}, token),
        fetchAPI<{ items?: Announcement[] } | Announcement[]>("/api/v1/tenant/announcements", {}, token),
      ]);

      if (profRes.status === "fulfilled") {
        setProfile(profRes.value);
      } else {
        throw profRes.reason;
      }

      if (reqsRes.status === "fulfilled") {
        const reqsList = unwrapPage(reqsRes.value);
        setRequests(reqsList.slice(0, 5));
      } else {
        setRequests([]);
      }

      if (annsRes.status === "fulfilled") {
        const annsList = unwrapPage(annsRes.value);
        setAnnouncements(annsList);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      setError(errorMessage(err) ?? "Something went wrong loading your dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    loadAll();
  }, [isLoaded, getToken]);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!landlordEmail.trim() || isRequesting) return;
    setIsRequesting(true);
    setRequestError("");
    try {
      const token = await getToken();
      await fetchAPI("/api/v1/onboarding/request-access", {
        method: "POST",
        body: JSON.stringify({ landlord_email: landlordEmail.trim() }),
      }, token);
      toast.success("Access request sent to landlord!");
      setLandlordEmail("");
      await loadAll();
    } catch (err) {
      const msg = errorMessage(err) ?? "Could not send access request. Please verify the landlord email.";
      setRequestError(msg);
      toast.error(msg);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = inviteCode.trim();
    if (!raw) return;
    // Extract token if user pasted full URL (e.g. /join/tok_123 or https://.../join/tok_123)
    const tokenMatch = raw.match(/\/join\/([^/?#]+)/);
    const token = tokenMatch ? tokenMatch[1] : raw;
    router.push(`/join/${encodeURIComponent(token)}`);
  };

  const handleCancelRequest = async () => {
    setIsCancelling(true);
    try {
      const token = await getToken();
      await fetchAPI("/api/v1/onboarding/reset-role", {
        method: "POST",
      }, token);
      toast.success("Access request cancelled.");
      await loadAll();
    } catch (err) {
      toast.error(errorMessage(err) ?? "Failed to cancel request.");
    } finally {
      setIsCancelling(false);
    }
  };

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
      <div className="max-w-xl mx-auto space-y-4 pt-8 animate-fade-slide-up">
        <div className="p-6 rounded-3xl border border-border/80 bg-[rgb(var(--ml-bg-secondary))] text-center space-y-3 shadow-sm">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
              Could not load your dashboard
            </h3>
            <p className="text-xs text-[rgb(var(--ml-text-secondary))] mt-1">
              {error}
            </p>
          </div>
          <Button
            onClick={() => void loadAll()}
            className="rounded-xl bg-[rgb(var(--ml-accent))] text-black font-bold text-xs hover:bg-[rgb(var(--ml-accent-light))] cursor-pointer mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isUnlinked = !profile || !profile.property_name || profile.property_name === "No Active Tenancy" || profile.unit_label === "Unassigned";

  // Unlinked / Pending Activation State
  if (isUnlinked) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-slide-up pb-16">
        {profile?.is_pending_approval ? (
          <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                  Access Request Pending
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--ml-text-primary))]">
                  Awaiting Landlord Approval
                </h2>
              </div>
            </div>
            <p className="text-sm text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xl">
              You requested access from{" "}
              <strong className="text-[rgb(var(--ml-text-primary))] font-semibold">
                {profile.requested_landlord_email || "your landlord"}
              </strong>
              . Once your landlord approves your request and links your unit, your maintenance portal, announcements, and lease documents will activate automatically.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => void loadAll()}
                variant="outline"
                size="sm"
                className="rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Check Approval Status
              </Button>
              <Button
                onClick={() => void handleCancelRequest()}
                disabled={isCancelling}
                variant="ghost"
                size="sm"
                className="rounded-xl text-[rgb(var(--ml-text-secondary))] hover:text-red-400 hover:bg-red-500/10 cursor-pointer text-xs"
              >
                {isCancelling ? "Cancelling..." : "Cancel Request / Change Landlord"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                Connect to Your Home
              </h1>
              <p className="text-sm text-[rgb(var(--ml-text-secondary))] max-w-xl">
                Your tenant account is active, but not linked to a property yet. Request access from your landlord or redeem an invitation code below to activate your portal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Option 1: Request access by landlord email */}
              <div className="p-6 rounded-3xl border border-border/80 bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between space-y-4 shadow-sm hover:border-[rgb(var(--ml-accent))]/40 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                    Request Access by Email
                  </h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    Enter the email address of your property owner or manager. We&apos;ll notify them to approve your tenancy and link your unit.
                  </p>
                </div>

                <form onSubmit={handleRequestAccess} className="space-y-3 pt-2">
                  <input
                    type="email"
                    required
                    value={landlordEmail}
                    onChange={(e) => setLandlordEmail(e.target.value)}
                    placeholder="landlord@example.com"
                    className="w-full rounded-xl border border-border/80 bg-[rgb(var(--ml-bg-primary))] px-3.5 py-2.5 text-xs text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-tertiary))] focus:border-[rgb(var(--ml-accent))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ml-accent))]/30 transition-all"
                    disabled={isRequesting}
                  />
                  <Button
                    type="submit"
                    disabled={!landlordEmail.trim() || isRequesting}
                    className="w-full h-10 rounded-xl bg-[rgb(var(--ml-accent))] text-black font-bold text-xs hover:bg-[rgb(var(--ml-accent-light))] cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isRequesting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Sending Request...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        Send Access Request
                      </span>
                    )}
                  </Button>
                  {requestError && (
                    <p className="text-[11px] text-red-500 font-medium">{requestError}</p>
                  )}
                </form>
              </div>

              {/* Option 2: Redeem invite token/link */}
              <div className="p-6 rounded-3xl border border-border/80 bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between space-y-4 shadow-sm hover:border-blue-500/40 transition-all">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                    Have an Invite Code?
                  </h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    If your landlord sent you a lease invitation link or code, enter or paste it here to link your unit immediately.
                  </p>
                </div>

                <form onSubmit={handleRedeemCode} className="space-y-3 pt-2">
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Paste invite token or full URL"
                    className="w-full rounded-xl border border-border/80 bg-[rgb(var(--ml-bg-primary))] px-3.5 py-2.5 text-xs text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-tertiary))] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                  />
                  <Button
                    type="submit"
                    disabled={!inviteCode.trim()}
                    className="w-full h-10 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-400 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Join Property &amp; Unit
                    </span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
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
          className="group block p-5 rounded-3xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)]"
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
          className={`p-5 sm:p-6 rounded-3xl border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] ${
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
                className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${
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
          className={`p-5 sm:p-6 rounded-3xl border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] ${
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
                className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${
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
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] gap-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20"
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

