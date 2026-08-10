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

const getFriendlyFileName = (url: string) => {
  const parts = url.split("/");
  return parts[parts.length - 1].split("?")[0].substring(0, 15) + "...";
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  resolved: { label: "Resolved", color: "bg-lime-500/10 text-lime-400 border-lime-500/20", dot: "bg-lime-400" },
  closed: { label: "Closed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", dot: "bg-zinc-500" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-zinc-400" },
  medium: { label: "Medium", color: "text-amber-400" },
  high: { label: "High", color: "text-orange-400 font-medium" },
  urgent: { label: "Emergency", color: "text-red-400 font-bold animate-pulse" },
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
            className="p-1 rounded-lg border border-[var(--ml-border)] bg-[rgb(var(--ml-bg-tertiary))] text-xs flex items-center gap-1.5 hover:border-[rgb(var(--ml-accent))] transition-colors cursor-pointer"
          >
            <Paperclip className="w-3 h-3 text-[rgb(var(--ml-accent))]" />
            <span className="max-w-[120px] truncate">{getFriendlyFileName(url)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompactRequestCard({
  req,
  isExpanded,
  onToggle,
  onReopen,
  onViewImage,
}: {
  req: MaintenanceRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onReopen: (id: string, e: React.MouseEvent) => void;
  onViewImage: (url: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.closed;
  const priorityCfg = PRIORITY_CONFIG[req.priority] ?? PRIORITY_CONFIG.low;
  const hasNotes = Boolean(req.landlord_notes);
  const hasAttachments = (req.image_urls?.length || 0) + (req.landlord_image_urls?.length || 0);

  const canReopen = req.status === "resolved" && (
    !req.updated_at ||
    (new Date().getTime() - new Date(req.updated_at).getTime()) < 14 * 24 * 60 * 60 * 1000
  );

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? "border-[rgb(var(--ml-accent))]/40 bg-[rgb(var(--ml-bg-secondary))]"
          : "border-[var(--ml-border)] bg-[rgb(var(--ml-bg-secondary))]/80 hover:border-[var(--ml-border)]"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left focus:outline-none cursor-pointer"
      >
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusCfg.dot}`} />
        <span className="font-semibold text-sm text-[rgb(var(--ml-text-primary))] truncate flex-1">
          {req.title}
        </span>
        <span className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
        <span className={`hidden sm:inline-flex text-xs font-medium shrink-0 ${priorityCfg.color}`}>
          {priorityCfg.label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasNotes && (
            <span className="w-5 h-5 rounded-full bg-[rgb(var(--ml-accent))]/10 flex items-center justify-center" title="Landlord note">
              <MessageSquare className="w-3 h-3 text-[rgb(var(--ml-accent))]" />
            </span>
          )}
          {hasAttachments > 0 && (
            <span className="w-5 h-5 rounded-full bg-zinc-500/10 flex items-center justify-center" title={`${hasAttachments} attachment(s)`}>
              <Paperclip className="w-3 h-3 text-zinc-400" />
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[var(--ml-border)]/50 space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/60 block mb-1">Description</span>
                <p className="text-sm text-[rgb(var(--ml-text-primary))] leading-relaxed whitespace-pre-wrap">
                  {req.description}
                </p>
              </div>

              {req.landlord_notes && (
                <div className="p-3 rounded-lg bg-[rgb(var(--ml-accent))]/5 border border-[rgb(var(--ml-accent))]/20 border-l-2 border-l-[rgb(var(--ml-accent))]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-accent))] block mb-1">
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
                <div className="flex items-center gap-3 p-3 rounded-lg bg-lime-500/10 border border-lime-500/20">
                  <RefreshCcw className="w-4 h-4 text-lime-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Not satisfied with the resolution? You can reopen this within 14 days.</p>
                  </div>
                  <button
                    onClick={(e) => onReopen(req.id, e)}
                    className="px-3 py-1.5 text-xs font-semibold text-black bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent-light))] rounded-lg transition-colors shrink-0 cursor-pointer"
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
              <div className="border-t border-[var(--ml-border)]/50 pt-4">
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

      <div className="w-full min-w-0 space-y-5 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[rgb(var(--ml-text-primary))] leading-tight">
              Maintenance Requests
            </h1>
          </div>
          {profile?.is_active && (
            <Link
              href="/tenant/requests/new"
              className="self-start sm:self-auto bg-[rgb(var(--ml-accent))] text-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm font-semibold hover:bg-[rgb(var(--ml-accent-light))] transition-colors shadow-sm whitespace-nowrap"
            >
              + New Request
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="px-5 py-4 border border-[var(--ml-border)] rounded-2xl bg-[rgb(var(--ml-bg-secondary))]/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full skeleton shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-4 w-44 rounded-md skeleton" />
                    <div className="h-3 w-36 rounded-md skeleton" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-5 w-20 rounded-full skeleton hidden sm:block" />
                  <div className="h-4 w-14 rounded-md skeleton hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 border border-orange-500/20 shadow-[0_0_25px_rgba(251,146,60,0.04)] rounded-2xl bg-[rgb(var(--ml-bg-secondary))]/60">
            <Wrench className="w-10 h-10 mx-auto text-orange-400/40 mb-3" />
            <p className="text-[rgb(var(--ml-text-primary))] font-semibold">No maintenance requests yet</p>
            <p className="text-sm text-[rgb(var(--ml-text-secondary))] mt-1">Submit a request when something needs fixing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <CompactRequestCard
                key={req.id}
                req={req}
                isExpanded={expandedId === req.id}
                onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                onReopen={handleReopen}
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
