"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, AlertTriangle, Building, Home, Paperclip, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MaintenanceRequest } from "./page";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  request: MaintenanceRequest;
  onViewDetails?: (req: MaintenanceRequest) => void;
}

export function KanbanCard({ request, onViewDetails }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: request.id,
    data: {
      type: "request",
      request,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return {
          border: "border-l-4 border-l-red-500",
          badge: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
        };
      case "high":
        return {
          border: "border-l-4 border-l-amber-500",
          badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
        };
      case "medium":
        return {
          border: "border-l-4 border-l-blue-500",
          badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
        };
      default:
        return {
          border: "border-l-4 border-l-slate-400 dark:border-l-slate-600",
          badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
        };
    }
  };

  const priorityStyle = getPriorityClasses(request.priority);
  const attachmentCount = request.image_urls?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/card flex flex-col gap-3.5 p-5 rounded-2xl bg-[rgb(var(--ml-bg-primary))] border border-border/40 shadow-[0_4px_12px_rgba(0,0,0,0.02)] relative transition-all duration-300 hover-lift select-none outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ml-accent))] focus-visible:ring-offset-2 hover:border-[rgb(var(--ml-accent))]/40",
        priorityStyle.border,
        isDragging && "opacity-30 scale-[0.98] shadow-none"
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <h4
            onClick={() => onViewDetails?.(request)}
            className="text-sm font-extrabold text-[rgb(var(--ml-text-primary))] group-hover/card:text-[rgb(var(--ml-accent))] transition-colors cursor-pointer truncate tracking-tight"
            title={request.title}
          >
            {request.title}
          </h4>
        </div>
        <button
          type="button"
          className="p-1 rounded-lg text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))]/50 cursor-grab active:cursor-grabbing transition-all focus-visible:ring-1 focus-visible:ring-[rgb(var(--ml-accent))]"
          aria-label={`Drag handle for ${request.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 shrink-0" />
        </button>
      </div>

      <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] line-clamp-2 min-h-[32px] break-words leading-relaxed">
        {request.description}
      </p>

      <div className="flex flex-wrap gap-2 items-center justify-between pt-2.5 border-t border-border/15 mt-1">
        <div className="flex flex-wrap gap-2.5 items-center text-[10px] text-[rgb(var(--ml-text-secondary))] font-bold">
          <div className="flex items-center gap-1" title={request.property_name}>
            <Building className="h-3 w-3 shrink-0 text-blue-500/80" />
            <span className="truncate max-w-[80px]">{request.property_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3 shrink-0 text-indigo-500/80" />
            <span>Unit {request.unit_label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {attachmentCount > 0 && (
            <div className="flex items-center gap-0.5 text-[rgb(var(--ml-text-secondary))] text-[10px] font-extrabold" title={`${attachmentCount} attachments`}>
              <Paperclip className="h-3 w-3" />
              <span>{attachmentCount}</span>
            </div>
          )}
          <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wider px-2 py-0.5 font-extrabold shrink-0 border", priorityStyle.badge)}>
            {request.priority}
          </Badge>
        </div>
      </div>
    </div>
  );
}
