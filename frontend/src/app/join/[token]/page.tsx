/**
 * Invite Join Page — /join/[token]
 *
 * Handles the invite token fast-track onboarding flow.
 * Extracts token from URL, validates via backend, and redirects.
 *
 * TODO (Phase 4, Task 4.7): Implement full invite acceptance logic.
 */

"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { completeOnboarding } from "@/app/actions/onboarding";

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      // User is not signed in. Redirect to sign-in page with redirect_url back to this page
      const currentUrl = typeof window !== "undefined" ? window.location.pathname : `/join/${token}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    async function checkUserRole() {
      try {
        const user: any = await api.get("/api/v1/onboarding/me");
        if (user && user.role) {
          if (user.role === "landlord") {
            router.push("/landlord/dashboard");
            return;
          } else if (user.role === "tenant") {
            // Already a tenant, set the onboarding complete cookie and go to dashboard
            await completeOnboarding();
            router.push("/tenant/dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check user role:", err);
      } finally {
        setChecking(false);
      }
    }
    checkUserRole();
  }, [isLoaded, userId, token, router]);

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/api/v1/onboarding/accept-invite", { token });
      await completeOnboarding();
      router.push("/tenant/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to accept invite. It may have expired or already been used.");
      setLoading(false);
    }
  };

  if (checking || !isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[rgb(var(--ml-bg-primary))]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--ml-accent))]"></div>
          <p className="text-[rgb(var(--ml-text-secondary))] font-medium">Checking invitation...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-bold">🎉 You&apos;ve been invited!</h1>
        <p className="text-[rgb(var(--ml-text-secondary))]">
          Click below to accept your invite and join the property.
        </p>

        {error && <div className="text-red-500 bg-red-100/10 p-3 rounded-lg text-sm">{error}</div>}

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full p-4 rounded-xl bg-[rgb(var(--ml-accent))] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
        >
          {loading ? "Accepting..." : "Accept Invite"}
        </button>
      </div>
    </main>
  );
}
