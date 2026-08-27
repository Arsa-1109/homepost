"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wrench,
  ChevronDown,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { AttachmentThumbnail } from "./AttachmentThumbnail";
import { MaintenanceTimeline } from "@/components/MaintenanceTimeline";

export type MaintenanceRequest = {
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

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  resolved: { label: "Resolved", color: "bg-lime-500/10 text-lime-400 border-lime-500/20" },
  closed: { label: "Closed", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

export interface TenantRequestCardProps {
  req: MaintenanceRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onReopen: (id: string, e: React.MouseEvent) => void;
  onCloseRequest: (id: string, e: React.MouseEvent) => void;
  isClosing: boolean;
  onViewImage: (url: string) => void;
  isHighlighted?: boolean;
}

export function TenantRequestCard({
  req,
  isExpanded,
  onToggle,
  onReopen,
  onCloseRequest,
  isClosing,
  onViewImage,
  isHighlighted = false,
}: TenantRequestCardProps) {
  const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.closed;

  const canReopen =
    req.status === "resolved" &&
    (!req.updated_at ||
      new Date().getTime() - new Date(req.updated_at).getTime() < 14 * 24 * 60 * 60 * 1000);

  return (
    <div
      id={`request-${req.id}`}
      className={`rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border flex flex-col overflow-hidden group/card transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20 ${
        isHighlighted
          ? "border-[rgb(var(--ml-accent))] ring-2 ring-[rgb(var(--ml-accent))] shadow-[0_0_28px_rgba(var(--ml-accent),0.35)] scale-[1.01]"
          : "border-border/60"
      }`}
    >
      {/* Collapsed Card Header */}
      <div
        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none relative z-10"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 shrink-0 shadow-inner group-hover/card:scale-105 transition-transform duration-300">
            <Wrench className="w-5.5 h-5.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-lg font-bold truncate text-[rgb(var(--ml-text-primary))] group-hover/card:text-orange-400 transition-colors">
                {req.title}
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold shrink-0 ${statusCfg.color}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <div className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-2">
              <span>
                Reported on{" "}
                {new Date(req.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-border/40 pt-4 sm:pt-0">
          <div className="flex items-center gap-3 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            <span
              className={`px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] border ${
                req.priority === "urgent"
                  ? "bg-red-500/10 text-red-500 border-red-500/25 animate-pulse"
                  : req.priority === "high"
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30 font-bold"
                  : req.priority === "medium"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/25"
              }`}
            >
              {req.priority === "urgent" ? "Emergency" : req.priority}
            </span>
          </div>
          <button
            type="button"
            className="p-2 rounded-xl group/btn border border-border/30 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
          >
            <ChevronDown
              className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover/btn:text-[rgb(var(--ml-accent))] transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border/40 bg-[rgb(var(--ml-bg-tertiary))]/30"
          >
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider mb-2.5">
                  Request Description
                </h4>
                <div className="text-xs sm:text-sm text-[rgb(var(--ml-text-primary))] leading-relaxed bg-[rgb(var(--ml-bg-secondary))] p-5 rounded-2xl border border-border/50 whitespace-pre-wrap font-medium shadow-sm">
                  {req.description}
                </div>
              </div>

              {req.landlord_notes && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-[rgb(var(--ml-bg-tertiary))]/40 border border-border/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[rgb(var(--ml-accent))]/10 border border-[rgb(var(--ml-accent))]/20 text-[rgb(var(--ml-accent))] flex items-center justify-center shrink-0">
                      <Building2 className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                      Landlord Note
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[rgb(var(--ml-text-secondary))] font-medium leading-relaxed whitespace-pre-wrap">
                    {req.landlord_notes}
                  </p>
                </div>
              )}

              {req.image_urls && req.image_urls.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                    Your Attachments
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {req.image_urls.map((url, idx) => (
                      <AttachmentThumbnail key={idx} url={url} onViewImage={onViewImage} />
                    ))}
                  </div>
                </div>
              )}

              {req.landlord_image_urls && req.landlord_image_urls.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                    Landlord Attachments
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {req.landlord_image_urls.map((url, idx) => (
                      <AttachmentThumbnail key={idx} url={url} onViewImage={onViewImage} />
                    ))}
                  </div>
                </div>
              )}

              {req.status === "resolved" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-lime-500/10 border border-lime-500/20 shadow-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))] font-medium">
                      Landlord marked this request as resolved. Confirm resolution by closing, or reopen if needed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onCloseRequest(req.id, e)}
                      disabled={isClosing}
                      className="px-3.5 py-2 text-xs font-bold text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-secondary))]/80 dark:bg-[rgb(var(--ml-bg-tertiary))]/60 border border-black/10 dark:border-white/15 hover:bg-[rgb(var(--ml-bg-tertiary))] rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                      {isClosing ? "Closing..." : "Close Request"}
                    </button>
                    {canReopen && (
                      <button
                        type="button"
                        onClick={(e) => onReopen(req.id, e)}
                        className="px-3.5 py-2 text-xs font-bold text-black bg-[rgb(var(--ml-accent))] rounded-xl shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        Reopen Request
                      </button>
                    )}
                  </div>
                </div>
              )}

              {req.status === "resolved" && !canReopen && (
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]/60 italic flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Resolved over 14 days ago — reopen window has expired.
                </p>
              )}

              <div className="border-t border-border/30 pt-4">
                <MaintenanceTimeline requestId={req.id} userType="tenant" onViewImage={onViewImage} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
