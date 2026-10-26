import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-[rgb(var(--ml-bg-secondary))] p-6 rounded-full border border-border mb-6 shadow-sm">
        <AlertTriangle className="size-12 text-[rgb(var(--ml-accent))]" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-balance mb-4">Page Not Found</h1>
      <p className="text-[rgb(var(--ml-text-secondary))] text-pretty max-w-md mb-8">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link 
        href="/dashboard"
        className="px-6 py-3 bg-[rgb(var(--ml-accent))] text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-opacity duration-150"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
