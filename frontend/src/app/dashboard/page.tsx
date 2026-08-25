"use client";

import { ClerkPublicMetadata } from "@/lib/clerk-global";
import { errorMessage } from "@/lib/errors";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { api, UserRoleResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function DashboardRedirect() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  const checkRole = useCallback(async () => {
    if (redirectedRef.current) return;
    setError(null);
    try {
      const metadataRole = (clerkUser?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
      const cookieRole = typeof document !== "undefined"
        ? document.cookie.match(/(^|;\s*)mock_user_role=([^;]*)/)?.[2]
        : null;

      let dbRole: string | null = null;
      try {
        const token = await getToken();
        const user = await api.get<UserRoleResponse>("/api/v1/onboarding/me", token);
        if (user && user.role && user.role !== "none" && user.role !== "unassigned") {
          dbRole = user.role;
        }
      } catch (fetchErr) {
        console.warn("Could not fetch user from backend /me in dashboard redirect:", fetchErr);
      }

      const effectiveRole = dbRole || (metadataRole === "landlord" || metadataRole === "tenant" ? metadataRole : null) || cookieRole;

      if (effectiveRole && effectiveRole !== "none" && effectiveRole !== "unassigned") {
        redirectedRef.current = true;
        if (typeof window !== "undefined") {
          document.cookie = `mock_user_role=${effectiveRole}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `mock_user_onboarding_complete=true; path=/; max-age=604800; SameSite=Lax`;
        }
        if (effectiveRole === "landlord") {
          window.location.replace("/landlord/dashboard");
        } else if (effectiveRole === "tenant") {
          window.location.replace("/tenant/dashboard");
        } else if (effectiveRole === "tenant_pending") {
          window.location.replace("/sync-role");
        } else {
          window.location.replace("/");
        }
      } else {
        // User has no role set anywhere -> send to home page to pick a role
        redirectedRef.current = true;
        window.location.replace("/");
      }
    } catch (err) {
      console.error("Dashboard redirect failed:", err);
      setError(errorMessage(err) || "Unable to connect to backend server.");
    }
  }, [getToken, clerkUser]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      window.location.replace("/sign-in");
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

