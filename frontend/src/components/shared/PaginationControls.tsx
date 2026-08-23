"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  canPrevPage?: boolean;
  canNextPage?: boolean;
  className?: string;
}

/**
 * Shared PaginationControls for browsing paginated lists (M6).
 */
export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  canPrevPage = page > 1,
  canNextPage = page < totalPages,
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {totalItems !== undefined && (
          <span>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {Math.min((page - 1) * (pageSize || 10) + 1, totalItems)}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(page * (pageSize || 10), totalItems)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalItems}</span> results
          </span>
        )}

        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 rounded-lg border border-border/80 bg-[rgb(var(--ml-bg-secondary))] text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ml-accent))] cursor-pointer"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrevPage}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </Button>

        <span className="px-2 font-medium">
          Page <span className="font-bold text-foreground">{page}</span> of{" "}
          <span className="font-bold text-foreground">{Math.max(1, totalPages)}</span>
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNextPage}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
