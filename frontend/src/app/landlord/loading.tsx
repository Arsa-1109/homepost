import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="bg-[rgb(var(--ml-bg-secondary))] p-4 rounded-full border border-[rgb(var(--ml-border))] shadow-sm mb-4 animate-pulse">
        <Loader2 className="w-8 h-8 text-[rgb(var(--ml-accent))] animate-spin" />
      </div>
      <p className="text-[rgb(var(--ml-text-secondary))] font-medium animate-pulse">
        Loading...
      </p>
    </div>
  );
}
