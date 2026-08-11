"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function DashboardRedirect() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const checkRole = async () => {
    setError(null);
    try {
      const user: any = await api.get("/api/v1/onboarding/me");
      if (user && user.role && user.role !== "none") {
        // Route to /sync-role to ensure Clerk session metadata and cookies are synced
        router.push("/sync-role");
      } else {
        // User has no role set in database yet -> send to home page to pick a role
        router.push("/");
      }
    } catch (err: any) {
      console.error("Dashboard redirect failed:", err);
      setError(err?.message || "Unable to connect to backend server.");
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    checkRole();
  }, [isLoaded, userId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border shadow-xl text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold tracking-tight">Connection Issue</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={checkRole} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  );
}
