"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  MessageSquare, 
  Image as ImageIcon, 
  AlertTriangle, 
  PlusCircle, 
  RefreshCcw,
  Clock,
  History,
  ChevronDown
} from "lucide-react";

export type MaintenanceEvent = {
  id: string;
  maintenance_request_id: string;
  actor_id: string;
  actor_name: string;
  event_type: string;
  description: string;
  payload: any;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  closed: "bg-gray-500/10 text-gray-400 border-gray-500/25",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-400 border-gray-500/25",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/25",
  critical: "bg-red-500/10 text-red-500 border-red-500/25",
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
        return <PlusCircle className="h-3.5 w-3.5 text-blue-500" />;
      case "reopened":
        return <RefreshCcw className="h-3.5 w-3.5 text-amber-500" />;
      case "status_changed": {
        const status = event.payload?.new_status?.toLowerCase();
        if (status === "resolved") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
        if (status === "closed") return <CheckCircle2 className="h-3.5 w-3.5 text-gray-400" />;
        if (status === "in_progress") return <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />;
        return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
      }
      case "priority_changed":
        return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;
      case "note_added":
        return <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />;
      case "images_attached":
        return <ImageIcon className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-[rgb(var(--ml-text-secondary))]" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6 mt-6 border-t border-[rgb(var(--ml-border))]">
        <div className="w-5 h-5 border-2 border-[rgb(var(--ml-accent))] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mt-6">{error}</div>;
  }

  if (events.length === 0) {
    return <div className="text-sm text-[rgb(var(--ml-text-secondary))] p-4 mt-6 border-t border-[rgb(var(--ml-border))]">No history available.</div>;
  }

  return (
    <div className="mt-6 pt-6 border-t border-[rgb(var(--ml-border))]">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))] rounded-lg p-1 -ml-1 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[rgb(var(--ml-bg-tertiary))] group-hover:bg-[rgb(var(--ml-accent))]/10 transition-colors border border-[rgb(var(--ml-border))]">
            <History className="w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors" />
          </div>
          <h3 className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-text-primary))] uppercase tracking-wide transition-colors">
            Timeline History
          </h3>
          <span className="ml-2 text-[10px] font-medium bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] px-2 py-0.5 rounded-full border border-[rgb(var(--ml-border))] group-hover:border-[rgb(var(--ml-border-hover))] transition-colors">
            {events.length} Event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-accent))] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
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
            <div className="relative pl-3 space-y-6 mt-6 pb-2">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[rgb(var(--ml-border))]"></div>
              
              <AnimatePresence>
                {events.map((event, idx) => {
                  const style = getEventStyle(event);
                  return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative flex gap-4"
                  >
                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--ml-bg-primary))] border border-[rgb(var(--ml-border))] ring-4 ring-[rgb(var(--ml-bg-secondary))] mt-0.5 shadow-sm">
                      {style}
                    </div>
                    
                    <div className="flex-1 bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] p-3 rounded-lg shadow-sm group/card hover:border-[rgb(var(--ml-border-hover))] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                          {event.actor_name}
                        </span>
                        <span className="text-[11px] font-medium text-[rgb(var(--ml-text-secondary))] bg-[rgb(var(--ml-bg-secondary))] px-2 py-0.5 rounded-full border border-[rgb(var(--ml-border))]">
                          {format(new Date(event.created_at), "MMM d, yyyy • h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                        {event.description.replace(/_/g, " ")}
                      </p>
                      
                      {/* Specific payload rendering */}
                      {event.event_type === "status_changed" && event.payload && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${STATUS_COLORS[event.payload.old_status?.toLowerCase()] || STATUS_COLORS.open}`}>
                            {event.payload.old_status?.replace("_", " ")}
                          </span>
                          <span className="text-[rgb(var(--ml-text-secondary))]/50">→</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${STATUS_COLORS[event.payload.new_status?.toLowerCase()] || STATUS_COLORS.open}`}>
                            {event.payload.new_status?.replace("_", " ")}
                          </span>
                        </div>
                      )}
                      
                      {event.event_type === "priority_changed" && event.payload && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${PRIORITY_COLORS[event.payload.old_priority?.toLowerCase()] || PRIORITY_COLORS.medium}`}>
                            {event.payload.old_priority?.replace("_", " ")}
                          </span>
                          <span className="text-[rgb(var(--ml-text-secondary))]/50">→</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${PRIORITY_COLORS[event.payload.new_priority?.toLowerCase()] || PRIORITY_COLORS.medium}`}>
                            {event.payload.new_priority?.replace("_", " ")}
                          </span>
                        </div>
                      )}
                      
                      {/* Notes: shown for note_added events AND bundled into status_changed etc */}
                      {event.payload?.notes && (
                        <div className="mt-3 p-3 rounded-lg bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/50 border-l-2 border-l-blue-500/50">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/70 block mb-1">
                            <MessageSquare className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                            Note
                          </span>
                          <p className="text-sm text-[rgb(var(--ml-text-primary))]/90 whitespace-pre-wrap">
                            {event.payload.notes}
                          </p>
                        </div>
                      )}

                      {/* Images: show thumbnails if image_urls present (new events with keys) */}
                      {event.payload?.image_urls && event.payload.image_urls.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[rgb(var(--ml-border))]/30">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/60 block mb-2">Attached Files</span>
                          <div className="flex flex-wrap gap-2">
                            {event.payload.image_urls.map((url: string, imgIdx: number) => (
                              <button 
                                key={imgIdx} 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onViewImage) {
                                    onViewImage(url);
                                  } else {
                                    window.open(url, "_blank");
                                  }
                                }}
                                className="group/img block overflow-hidden rounded-lg border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-all hover:shadow-lg bg-[rgb(var(--ml-bg-primary))]"
                              >
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={url} 
                                    alt={`Attachment ${imgIdx + 1}`} 
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
                      )}

                      {/* Fallback for OLD events: had image_count but no image_keys stored */}
                      {event.payload?.image_count > 0 && !event.payload?.image_urls && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--ml-bg-secondary))] border border-dashed border-[rgb(var(--ml-border))]">
                          <span className="text-purple-400/60 text-sm">🖼</span>
                          <span className="text-[11px] text-[rgb(var(--ml-text-secondary))]/60 italic">
                            {event.payload.image_count} file{event.payload.image_count !== 1 ? 's' : ''} attached
                            <span className="ml-1 opacity-50">(preview unavailable for older records)</span>
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
