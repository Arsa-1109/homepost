"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { MaintenanceRequest } from "./page";
import { cn } from "@/lib/utils";

import { ClipboardList } from "lucide-react";

interface KanbanBoardProps {
  requests: MaintenanceRequest[];
  onViewDetails?: (req: MaintenanceRequest) => void;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  requests: MaintenanceRequest[];
  colorClass: string;
  onViewDetails?: (req: MaintenanceRequest) => void;
}

function KanbanColumn({ id, title, requests, colorClass, onViewDetails }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const itemIds = React.useMemo(() => requests.map((r) => r.id), [requests]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-4 p-4 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] border border-border/40 w-full min-h-[550px] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.1)]",
        isOver && "bg-accent/5 border-[rgb(var(--ml-accent))]/30 shadow-[0_0_20px_rgba(var(--ml-accent),0.1)] scale-[1.01]"
      )}
    >
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0 shadow-sm", colorClass)} />
          <h3 className="font-extrabold text-sm text-[rgb(var(--ml-text-primary))] tracking-tight">{title}</h3>
          <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-extrabold bg-[rgb(var(--ml-bg-secondary))]/80 px-2 py-0.5 rounded-lg border border-border/10 tabular-nums">
            {requests.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[200px] scrollbar-none">
        {requests.length === 0 ? (
          <div className="flex-grow border border-dashed border-border/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center min-h-[200px] bg-[rgb(var(--ml-bg-secondary))] transition-all duration-300">
            <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2.5 stroke-[1.5]" />
            <h4 className="text-xs font-bold text-[rgb(var(--ml-text-primary))]/80 tracking-tight">No Requests</h4>
            <p className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))]/50 mt-1 max-w-[130px]">
              No maintenance requests in this status.
            </p>
          </div>
        ) : (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {requests.map((req) => (
              <KanbanCard key={req.id} request={req} onViewDetails={onViewDetails} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ requests, onViewDetails }: KanbanBoardProps) {
  const openRequests = React.useMemo(() => requests.filter((r) => r.status === "open"), [requests]);
  const progressRequests = React.useMemo(() => requests.filter((r) => r.status === "in_progress"), [requests]);
  const resolvedRequests = React.useMemo(() => requests.filter((r) => r.status === "resolved"), [requests]);
  const closedRequests = React.useMemo(() => requests.filter((r) => r.status === "closed"), [requests]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      <KanbanColumn
        id="open"
        title="Open"
        requests={openRequests}
        colorClass="bg-yellow-500"
        onViewDetails={onViewDetails}
      />
      <KanbanColumn
        id="in_progress"
        title="In Progress"
        requests={progressRequests}
        colorClass="bg-blue-500"
        onViewDetails={onViewDetails}
      />
      <KanbanColumn
        id="resolved"
        title="Resolved"
        requests={resolvedRequests}
        colorClass="bg-green-500"
        onViewDetails={onViewDetails}
      />
      <KanbanColumn
        id="closed"
        title="Closed"
        requests={closedRequests}
        colorClass="bg-slate-400 dark:bg-slate-600"
        onViewDetails={onViewDetails}
      />
    </div>
  );
}
