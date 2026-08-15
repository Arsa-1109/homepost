"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api, UserRoleResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function DashboardRedirect() {
  const { isLoaded, userId, getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const checkRole = useCallback(async () => {
    setError(null);
    try {
      const token = await getToken();
      const user = await api.get<UserRoleResponse>("/api/v1/onboarding/me", token);
      if (user && user.role && user.role !== "none" && user.role !== "unassigned") {
        if (typeof window !== "undefined") {
          document.cookie = `mock_user_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `mock_user_onboarding_complete=true; path=/; max-age=604800; SameSite=Lax`;
        }
        if (user.role === "landlord") {
          window.location.href = "/landlord/dashboard";
        } else if (user.role === "tenant") {
          window.location.href = "/tenant/dashboard";
        } else if (user.role === "tenant_pending") {
          window.location.href = "/sync-role";
        } else {
          window.location.href = "/";
        }
      } else {
        // User has no role set in database yet -> send to home page to pick a role
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error("Dashboard redirect failed:", err);
      setError(err?.message || "Unable to connect to backend server.");
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    checkRole();

    // Fallback: If verification takes longer than 6 seconds, show error state with retry
    const fallbackTimer = setTimeout(() => {
      setError((prev) => prev || "Dashboard loading took longer than expected. Please retry.");
    }, 6000);

    return () => clearTimeout(fallbackTimer);
  }, [isLoaded, userId, router, checkRole]);

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
