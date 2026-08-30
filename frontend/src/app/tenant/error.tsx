"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TenantErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Tenant subview error:", error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl border border-red-500/20 bg-[rgb(var(--ml-bg-secondary))] text-center shadow-lg space-y-6">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Unable to Load Section
        </h2>
        <p className="text-xs sm:text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
          An unexpected issue occurred while rendering this tenant view. Your portal navigation remains fully operational.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => reset()}
          className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[rgb(var(--ml-accent))] text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:bg-[rgb(var(--ml-accent))]/90 transition-all duration-200 active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
        <Link href="/tenant" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 rounded-xl border-border/60 text-[rgb(var(--ml-text-primary))] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[rgb(var(--ml-bg-primary))]"
          >
            <Home className="w-4 h-4" />
            <span>Tenant Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
