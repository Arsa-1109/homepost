"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Paperclip, MessageSquare, Clock, RefreshCcw, Wrench } from "lucide-react";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LightboxModal } from "@/components/LightboxModal";
import { toast } from "sonner";

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  image_urls?: string[];
  landlord_notes?: string;
  landlord_image_urls?: string[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-500 border-blue-500/25", dot: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-500 border-amber-500/25", dot: "bg-amber-500" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25", dot: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-gray-500/10 text-gray-400 border-gray-500/25", dot: "bg-gray-400" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-gray-400" },
  medium: { label: "Medium", color: "text-amber-400" },
  high: { label: "High", color: "text-orange-400" },
  urgent: { label: "Emergency", color: "text-red-400" },
};

function AttachmentGrid({ urls, label, onViewImage }: { urls: string[]; label: string; onViewImage: (url: string) => void }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/60">{label}</span>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewImage(url); }}
            className="group/img block overflow-hidden rounded-lg border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-all hover:shadow-lg bg-[rgb(var(--ml-bg-primary))]"
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
              <img
                src={url}
                alt={`${label} ${idx + 1}`}
                className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = "none";
                  const parent = el.parentElement;
                  if (parent) {
                    const ph = document.createElement("div");
                    ph.className = "text-[10px] text-[rgb(var(--ml-text-secondary))] p-2 text-center font-medium flex flex-col items-center gap-1";
                    ph.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>File';
                    parent.appendChild(ph);
                  }
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RequestCard({ req, onReopen, canReopen, onViewImage }: {
  req: MaintenanceRequest;
  onReopen: (id: string, e: React.MouseEvent) => void;
  canReopen: boolean;
  onViewImage: (url: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.open;
  const priorityCfg = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.medium;

  const hasAttachments = (req.image_urls?.length || 0) + (req.landlord_image_urls?.length || 0);
  const hasNotes = !!req.landlord_notes;

  return (
    <div className="rounded-2xl border border-[rgb(var(--ml-border))]/50 bg-[rgb(var(--ml-bg-secondary))] overflow-hidden transition-all duration-300 hover:border-[rgb(var(--ml-accent))]/50 shadow-sm hover:shadow-md group/card hover-lift">
      {/* --- Collapsed Header --- */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-3 group"
      >
        {/* Status dot */}
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusCfg.dot}`} />

        {/* Title & subtitle */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[rgb(var(--ml-text-primary))] text-sm sm:text-base truncate group-hover:text-[rgb(var(--ml-accent))] transition-colors">
            {req.title}
          </h3>
          <p className="text-xs text-[rgb(var(--ml-text-secondary))]/70 mt-0.5 truncate">
            {req.description}
          </p>
        </div>

        {/* Metadata pills */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <span className={`text-[10px] font-medium ${priorityCfg.color}`}>
            {priorityCfg.label}
          </span>
        </div>

        {/* Indicator badges (compact) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasNotes && (
            <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center" title="Landlord note">
              <MessageSquare className="w-3 h-3 text-blue-400" />
            </span>
          )}
          {hasAttachments > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center" title={`${hasAttachments} attachment(s)`}>
              <Paperclip className="w-3 h-3 text-purple-400" />
            </span>
          )}
        </div>

        {/* Date (mobile: hidden, desktop: shown) */}
        <span className="hidden sm:block text-[11px] text-[rgb(var(--ml-text-secondary))]/50 shrink-0 tabular-nums">
          {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>

        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))]/40 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {/* Mobile status + priority row */}
      {!isExpanded && (
        <div className="flex sm:hidden flex-wrap items-center gap-2 px-4 pb-3 -mt-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <span className={`text-[10px] font-medium shrink-0 ${priorityCfg.color}`}>
            {priorityCfg.label}
          </span>
          <span className="text-[10px] text-[rgb(var(--ml-text-secondary))]/50 ml-auto shrink-0 whitespace-nowrap">
            {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      )}

      {/* --- Expanded Details --- */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[rgb(var(--ml-border))]/50 space-y-4">
              {/* Mobile status + priority (when expanded) */}
              <div className="flex sm:hidden items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                <span className={`text-[10px] font-medium ${priorityCfg.color}`}>
                  {priorityCfg.label}
                </span>
                <span className="text-[10px] text-[rgb(var(--ml-text-secondary))]/50 ml-auto">
                  {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/60 block mb-1">Description</span>
                <p className="text-sm text-[rgb(var(--ml-text-primary))] leading-relaxed whitespace-pre-wrap">
                  {req.description}
                </p>
              </div>

              {/* Landlord Notes */}
              {req.landlord_notes && (
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 border-l-2 border-l-blue-500/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/70 block mb-1">
                    <MessageSquare className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                    Landlord Note
                  </span>
                  <p className="text-sm text-[rgb(var(--ml-text-primary))]/90 whitespace-pre-wrap italic">
                    &quot;{req.landlord_notes}&quot;
                  </p>
                </div>
              )}
              {(req.image_urls?.length || req.landlord_image_urls?.length) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AttachmentGrid urls={req.image_urls || []} label="Your Attachments" onViewImage={onViewImage} />
                  <AttachmentGrid urls={req.landlord_image_urls || []} label="Landlord Attachments" onViewImage={onViewImage} />
                </div>
              ) : null}
              {canReopen && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <RefreshCcw className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Not satisfied with the resolution? You can reopen this within 14 days.</p>
                  </div>
                  <button
                    onClick={(e) => onReopen(req.id, e)}
                    className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors shrink-0"
                  >
                    Reopen
                  </button>
                </div>
              )}
              {req.status === "resolved" && !canReopen && (
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]/50 italic flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Resolved over 14 days ago — reopen window has expired
                </p>
              )}
              <div className="border-t border-[rgb(var(--ml-border))]/50 pt-4">
                <MaintenanceTimeline requestId={req.id} userType="tenant" onViewImage={onViewImage} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TenantRequestsContent() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmReopen, setConfirmReopen] = useState<{ id: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const [reqs, prof] = await Promise.all([
          fetchAPI<MaintenanceRequest[]>("/api/v1/tenant/maintenance"),
          fetchAPI<any>("/api/v1/tenant/profile")
        ]);
        setRequests(reqs);
        setProfile(prof);
      } catch (err) {
        console.error("Failed to load requests", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleReopen = (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmReopen({ id: requestId });
  };

  const doReopen = async (requestId: string) => {
    try {
      const updatedReq = await fetchAPI<MaintenanceRequest>(`/api/v1/tenant/maintenance/${requestId}/reopen`, {
        method: "POST"
      });
      setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
      toast.success("Maintenance request reopened.");
    } catch (err: any) {
      toast.error(err.message || "Failed to reopen request.");
    } finally {
      setConfirmReopen(null);
    }
  };

  const canReopen = (req: MaintenanceRequest) => {
    if (req.status !== "resolved") return false;
    const resolvedDate = new Date(req.updated_at || req.created_at);
    const today = new Date();
    const diffDays = (today.getTime() - resolvedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  };

  return (
    <>
      <AnimatePresence>
        {previewUrl && (
          <LightboxModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmReopen}
        title="Reopen Maintenance Request?"
        description="This will reopen the request and notify your landlord. You can only reopen a resolved request within 14 days."
        confirmLabel="Yes, Reopen"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={() => confirmReopen && doReopen(confirmReopen.id)}
        onCancel={() => setConfirmReopen(null)}
      />

      <div className="w-full min-w-0 space-y-8 max-w-2xl mx-auto animate-fade-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[rgb(var(--ml-accent))]/10 shrink-0">
              <Wrench className="w-6 h-6 text-[rgb(var(--ml-accent))]" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Maintenance Requests
            </h1>
          </div>
          {profile?.is_active && (
            <Link
              href="/tenant/requests/new"
              className="self-start sm:self-auto bg-[rgb(var(--ml-accent))] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap active:scale-95"
            >
              + New Request
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-5 py-5 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[rgb(var(--ml-border))]/60" />
                  <div className="flex-1">
                    <div className="h-5 w-1/3 bg-[rgb(var(--ml-border))]/60 rounded-md mb-2" />
                    <div className="h-4 w-2/3 bg-[rgb(var(--ml-border))]/60 rounded-md" />
                  </div>
                  <div className="h-6 w-20 bg-[rgb(var(--ml-border))]/60 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[rgb(var(--ml-border))]/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[rgb(var(--ml-bg-tertiary))] flex items-center justify-center mb-5 shadow-inner">
              <Wrench className="w-7 h-7 text-[rgb(var(--ml-text-muted))]" />
            </div>
            <p className="text-[rgb(var(--ml-text-primary))] font-bold text-lg">No maintenance requests yet</p>
            <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-2">Submit a request when something needs fixing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                onReopen={handleReopen}
                canReopen={canReopen(req)}
                onViewImage={setPreviewUrl}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function TenantRequestsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-[rgb(var(--ml-text-secondary))] animate-pulse">Loading requests...</div>}>
      <TenantRequestsContent />
    </Suspense>
  );
}
