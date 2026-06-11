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
  Clock
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

interface Props {
  requestId: string;
  userType: "tenant" | "landlord";
}

export function MaintenanceTimeline({ requestId, userType }: Props) {
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [requestId, userType]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "created":
        return <PlusCircle className="h-4 w-4 text-emerald-500" />;
      case "reopened":
        return <RefreshCcw className="h-4 w-4 text-amber-500" />;
      case "status_changed":
        return <CheckCircle2 className="h-4 w-4 text-[rgb(var(--ml-accent))]" />;
      case "priority_changed":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "note_added":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "images_attached":
        return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-[rgb(var(--ml-text-secondary))]" />;
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
      <h3 className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide mb-4">
        Timeline History
      </h3>
      <div className="relative pl-3 space-y-6">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[rgb(var(--ml-border))]"></div>
        
        <AnimatePresence>
          {events.map((event, idx) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative flex gap-4"
            >
              <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--ml-bg-primary))] border border-[rgb(var(--ml-border))] ring-4 ring-[rgb(var(--ml-bg-secondary))] mt-0.5 shadow-sm">
                {getEventIcon(event.event_type)}
              </div>
              
              <div className="flex-1 bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] p-3 rounded-lg shadow-sm group hover:border-[rgb(var(--ml-border-hover))] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    {event.actor_name}
                  </span>
                  <span className="text-[11px] font-medium text-[rgb(var(--ml-text-secondary))] bg-[rgb(var(--ml-bg-secondary))] px-2 py-0.5 rounded-full border border-[rgb(var(--ml-border))]">
                    {format(new Date(event.created_at), "MMM d, yyyy • h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                  {event.description}
                </p>
                
                {/* Specific payload rendering */}
                {event.event_type === "status_changed" && event.payload && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                    <span className="px-2 py-1 rounded bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] text-[rgb(var(--ml-text-secondary))] uppercase">
                      {event.payload.old_status?.replace("_", " ")}
                    </span>
                    <span className="text-[rgb(var(--ml-text-secondary))]">→</span>
                    <span className="px-2 py-1 rounded bg-[rgba(var(--ml-accent),0.1)] border border-[rgba(var(--ml-accent),0.2)] text-[rgb(var(--ml-accent))] uppercase">
                      {event.payload.new_status?.replace("_", " ")}
                    </span>
                  </div>
                )}
                
                {event.event_type === "priority_changed" && event.payload && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                    <span className="px-2 py-1 rounded bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] text-[rgb(var(--ml-text-secondary))] uppercase">
                      {event.payload.old_priority?.replace("_", " ")}
                    </span>
                    <span className="text-[rgb(var(--ml-text-secondary))]">→</span>
                    <span className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400 uppercase">
                      {event.payload.new_priority?.replace("_", " ")}
                    </span>
                  </div>
                )}
                
                {event.event_type === "note_added" && event.payload?.notes && (
                  <div className="mt-2 p-2 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded text-xs text-[rgb(var(--ml-text-secondary))] italic border-l-2 border-l-[rgb(var(--ml-accent))]">
                    "{event.payload.notes}"
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
