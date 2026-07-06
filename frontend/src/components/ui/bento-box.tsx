"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BentoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  outerClassName?: string;
  colSpan?: string; // e.g. "col-span-1", "md:col-span-2"
  rowSpan?: string; // e.g. "row-span-1", "row-span-2"
  interactive?: boolean;
}

export function BentoBox({
  children,
  className,
  outerClassName,
  colSpan = "col-span-1",
  rowSpan = "row-span-1",
  interactive = false,
  ...props
}: BentoBoxProps) {
  return (
    <div
      className={cn(
        "p-1.5 rounded-[2rem]",
        "bg-[rgb(var(--ml-border))]/10 dark:bg-white/5",
        "border border-[rgb(var(--ml-border))]/30 dark:border-white/10",
        "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        interactive && "hover-lift cursor-pointer hover:border-[rgb(var(--ml-accent))]/40 dark:hover:border-[rgb(var(--ml-accent))]/30",
        colSpan,
        rowSpan,
        outerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "w-full h-full p-5 sm:p-6",
          "rounded-[calc(2rem-0.375rem)]",
          "bg-[rgb(var(--ml-bg-secondary))]",
          "shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function BentoGrid({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 auto-rows-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
