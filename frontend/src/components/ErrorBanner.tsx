"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorBannerProps {
  message?: string | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Reusable accessible ErrorBanner for data fetching failure states (H9/H10).
 */
export function ErrorBanner({
  message = "Failed to load information from the server.",
  title = "Something went wrong",
  onRetry,
  className,
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:p-5 text-destructive transition-all duration-200",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            {title && <p className="text-sm font-bold tracking-tight">{title}</p>}
            <p className="text-xs font-medium text-destructive/90 break-words">{message}</p>
          </div>
        </div>

        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0 h-9 px-3.5 rounded-xl border-destructive/40 bg-background/50 hover:bg-destructive/10 text-destructive font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    </div>
  );
}
