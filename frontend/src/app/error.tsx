"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20 mb-6 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4">Something went wrong</h1>
      <p className="text-[rgb(var(--ml-text-secondary))] max-w-md mb-8">
        An unexpected error occurred while processing your request. We've been notified and are looking into it.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} className="bg-[rgb(var(--ml-accent))] hover:opacity-90 text-white">
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = "/landlord/dashboard"}>
          Return Home
        </Button>
      </div>
    </div>
  );
}
