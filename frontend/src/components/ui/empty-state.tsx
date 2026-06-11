import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[rgb(var(--ml-border))] rounded-2xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm", className)}>
      <div className="bg-[rgb(var(--ml-bg-tertiary))] p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-[rgb(var(--ml-text-secondary))]" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-[rgb(var(--ml-text-secondary))] max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
