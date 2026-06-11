import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-[rgb(var(--ml-bg-secondary))] p-6 rounded-full border border-[rgb(var(--ml-border))] mb-6 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-[rgb(var(--ml-accent))]" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-4">Page Not Found</h1>
      <p className="text-[rgb(var(--ml-text-secondary))] max-w-md mb-8">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link 
        href="/landlord/dashboard"
        className="px-6 py-3 bg-[rgb(var(--ml-accent))] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
