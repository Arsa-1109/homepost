"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  MessageSquare, 
  Paperclip,
  AlertTriangle, 
  PlusCircle, 
  RefreshCcw,
  Clock,
  History,
  ChevronDown,
  ArrowRight,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttachmentThumbnail } from "@/components/landlord/requests/AttachmentThumbnail";
import { isImageUrl } from "@/components/LightboxModal";

export interface MaintenanceEventPayload {
  old_status?: string;
  new_status?: string;
  old_priority?: string;
  new_priority?: string;
  notes?: string;
  image_keys?: string[];
  image_urls?: string[];
  image_count?: number;
}

export type MaintenanceEvent = {
  id: string;
  maintenance_request_id: string;
  actor_id: string;
  actor_name: string;
  event_type: string;
  description: string;
  payload: MaintenanceEventPayload | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface Props {
  requestId: string;
  userType: "tenant" | "landlord";
  refreshKey?: number;
  onViewImage?: (url: string) => void;
}

export function MaintenanceTimeline({ requestId, userType, refreshKey = 0, onViewImage }: Props) {
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);
      setError("");
      try {
        const data = await fetchAPI<MaintenanceEvent[]>(`/api/v1/${userType}/maintenance/${requestId}/events`);
        setEvents(data);
      } catch (err) {
        setError("Failed to load timeline history.");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (requestId) {
      loadEvents();
    }
  }, [requestId, userType, refreshKey]);

  const getEventStyle = (event: MaintenanceEvent) => {
    switch (event.event_type) {
      case "created":
        return <PlusCircle className="h-3.5 w-3.5 text-blue-400" />;
      case "reopened":
        return <RefreshCcw className="h-3.5 w-3.5 text-amber-400" />;
      case "status_changed": {
        const status = event.payload?.new_status?.toLowerCase();
        if (status === "resolved") return <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" />;
        if (status === "closed") return <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />;
        if (status === "in_progress") return <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />;
        return <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />;
      }
      case "priority_changed":
        return <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />;
      case "note_added":
        return <MessageSquare className="h-3.5 w-3.5 text-[rgb(var(--ml-accent))]" />;
      case "images_attached":
        return <Paperclip className="h-3.5 w-3.5 text-[rgb(var(--ml-accent))]" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-[rgb(var(--ml-text-secondary))]" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6 mt-6 border-t border-border/30">
        <div className="w-5 h-5 border-2 border-[rgb(var(--ml-accent))] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mt-6 font-medium">{error}</div>;
  }

  if (events.length === 0) {
    return <div className="text-xs text-[rgb(var(--ml-text-secondary))] p-4 mt-6 border-t border-border/30 font-medium">No history available.</div>;
  }

  return (
    <div className="mt-6 pt-6 border-t border-border/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))] rounded-2xl p-3 -mx-3 transition-all cursor-pointer hover:bg-[rgb(var(--ml-bg-tertiary))]/40 border border-transparent hover:border-border/40"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[rgb(var(--ml-bg-tertiary))] group-hover:bg-[rgb(var(--ml-accent))]/10 transition-colors border border-border/40">
            <History className="w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors" />
          </div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-bold text-[rgb(var(--ml-text-primary))] uppercase tracking-wider">
              Timeline History
            </h3>
            <span className="text-[10px] font-bold bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] px-2.5 py-0.5 rounded-full border border-border/50 shadow-sm">
              {events.length} {events.length === 1 ? "Event" : "Events"}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-text-primary))] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative pl-4 space-y-6 mt-6 pb-2">
              {/* Sleek Vertical Connecting Line (pl-4 = 16px padding. Node is w-6 = 24px wide. Center is at 16 + 12 = 28px. Line left is 27px) */}
              <div className="absolute left-[27px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-border/80 via-border/50 to-border/20 z-0"></div>
              
              <AnimatePresence>
                {events.map((event, idx) => {
                  const style = getEventStyle(event);
                  return (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="relative flex items-start gap-4"
                    >
                      {/* Node Icon Circle (24px wide, ring-4 stays completely inside container with 16px left padding) */}
                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--ml-bg-secondary))] border border-border/70 ring-4 ring-[rgb(var(--ml-bg-tertiary))] shadow-sm mt-0.5">
                        {style}
                      </div>
                      
                      {/* Main Event Card */}
                      <div className="flex-1 bg-[rgb(var(--ml-bg-secondary))]/80 border border-border/50 p-4 rounded-2xl shadow-sm hover:border-border/80 transition-all min-w-0">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))] tracking-tight">
                            {event.actor_name}
                          </span>
                          <span className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))] bg-[rgb(var(--ml-bg-tertiary))]/60 px-2.5 py-0.5 rounded-full border border-border/40 shadow-xs">
                            {format(new Date(event.created_at), "MMM d, yyyy • h:mm a")}
                          </span>
                        </div>

                        <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed font-medium">
                          {event.description.replace(/_/g, " ")}
                        </p>
                        
                        {/* Status Change Badges */}
                        {event.event_type === "status_changed" && event.payload && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-2xs ${(event.payload.old_status && STATUS_COLORS[event.payload.old_status.toLowerCase()]) || STATUS_COLORS.open}`}>
                              {event.payload.old_status?.replace("_", " ")}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[rgb(var(--ml-text-secondary))]/50" />
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-2xs ${(event.payload.new_status && STATUS_COLORS[event.payload.new_status.toLowerCase()]) || STATUS_COLORS.open}`}>
                              {event.payload.new_status?.replace("_", " ")}
                            </span>
                          </div>
                        )}
                        
                        {/* Priority Change Badges */}
                        {event.event_type === "priority_changed" && event.payload && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-2xs ${(event.payload.old_priority && PRIORITY_COLORS[event.payload.old_priority.toLowerCase()]) || PRIORITY_COLORS.medium}`}>
                              {event.payload.old_priority?.replace("_", " ")}
                            </span>
                            <ArrowRight className="w-3 h-3 text-[rgb(var(--ml-text-secondary))]/50" />
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-2xs ${(event.payload.new_priority && PRIORITY_COLORS[event.payload.new_priority.toLowerCase()]) || PRIORITY_COLORS.medium}`}>
                              {event.payload.new_priority?.replace("_", " ")}
                            </span>
                          </div>
                        )}
                        
                        {/* Landlord Note Container */}
                        {event.payload?.notes && (
                          <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-[rgb(var(--ml-bg-tertiary))]/40 border border-border/60 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md bg-[rgb(var(--ml-accent))]/10 border border-[rgb(var(--ml-accent))]/20 text-[rgb(var(--ml-accent))] flex items-center justify-center shrink-0">
                                <Building2 className="w-3 h-3" />
                              </div>
                              <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                {event.event_type === "reopened" ? "Tenant Reopen Note" : "Landlord Note"}
                              </span>
                            </div>
                            <p className="text-xs sm:text-[13px] text-[rgb(var(--ml-text-secondary))] font-medium leading-relaxed whitespace-pre-wrap">
                              {event.payload.notes}
                            </p>
                          </div>
                        )}

                        {/* Attached Files Container */}
                        {event.payload?.image_urls && event.payload.image_urls.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] block mb-2.5 flex items-center gap-1.5">
                              <Paperclip className="w-3 h-3 text-[rgb(var(--ml-text-secondary))]" />
                              Attached Files ({event.payload.image_urls.length})
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {event.payload.image_urls.map((url: string, imgIdx: number) => (
                                <AttachmentThumbnail
                                  key={imgIdx}
                                  url={url}
                                  onViewImage={(targetUrl) => {
                                    if (onViewImage) {
                                      onViewImage(targetUrl);
                                    } else {
                                      window.open(targetUrl, "_blank");
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fallback for OLD events */}
                        {Boolean(event.payload?.image_count && event.payload.image_count > 0 && !event.payload?.image_urls) && (
                          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--ml-bg-primary))]/40 border border-dashed border-border/50">
                            <Paperclip className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium italic">
                              {event.payload?.image_count} file{event.payload?.image_count !== 1 ? "s" : ""} attached
                              <span className="ml-1 opacity-60">(preview unavailable for older records)</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
