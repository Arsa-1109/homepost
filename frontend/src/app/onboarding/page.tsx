/**
 * Onboarding Page
 *
 * Role selection screen after Clerk sign-up:
 * - "I'm a Landlord" → POST /api/v1/onboarding/register-landlord
 * - "I'm a Tenant" → shows landlord email input
 *   → POST /api/v1/onboarding/request-access
 *
 * Sets __onboarding_complete cookie on success.
 *
 * TODO (Phase 4, Task 4.6): Build full interactive onboarding UI.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<"none" | "landlord" | "tenant">("none");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkUserRole() {
      try {
        const user: any = await api.get("/api/v1/onboarding/me");
        if (user && user.role) {
          if (user.role === "landlord") {
            document.cookie = "__onboarding_complete=true; path=/";
            router.push("/landlord/dashboard");
            return;
          } else if (user.role === "tenant") {
            document.cookie = "__onboarding_complete=true; path=/";
            router.push("/tenant/dashboard");
            return;
          } else if (user.role === "tenant_pending") {
            setSuccess(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user role on mount:", err);
      } finally {
        setChecking(false);
      }
    }
    checkUserRole();
  }, [router]);

  const handleLandlord = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/api/v1/onboarding/register-landlord");
      document.cookie = "__onboarding_complete=true; path=/";
      router.push("/landlord/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/api/v1/onboarding/request-access", { landlord_email: email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to request access. Make sure the email is correct.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[rgb(var(--ml-bg-primary))]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--ml-accent))]"></div>
          <p className="text-[rgb(var(--ml-text-secondary))] font-medium">Checking your account status...</p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-3xl font-bold">🎉 Request Sent!</h1>
          <p className="text-[rgb(var(--ml-text-secondary))]">
            We&apos;ve notified your landlord. You&apos;ll be able to access your dashboard once they approve your request.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to Homepost 🏠</h1>
        <p className="text-[rgb(var(--ml-text-secondary))]">
          Let&apos;s get you set up. Are you a property owner or a tenant?
        </p>

        {error && <div className="text-red-500 bg-red-100/10 p-3 rounded-lg text-sm">{error}</div>}

        {role === "none" && (
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => handleLandlord()}
              disabled={loading}
              className="p-6 rounded-xl border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-colors text-center disabled:opacity-50"
            >
              <div className="text-3xl mb-2">🏘️</div>
              <div className="font-semibold">I&apos;m a Landlord</div>
            </button>
            <button 
              onClick={() => setRole("tenant")}
              disabled={loading}
              className="p-6 rounded-xl border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-colors text-center disabled:opacity-50"
            >
              <div className="text-3xl mb-2">🔑</div>
              <div className="font-semibold">I&apos;m a Tenant</div>
            </button>
          </div>
        )}

        {role === "tenant" && (
          <form onSubmit={handleTenantSubmit} className="space-y-4 text-left pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Landlord&apos;s Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="landlord@example.com"
                required
                className="w-full p-3 rounded-lg border border-[rgb(var(--ml-border))] bg-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("none")}
                className="flex-1 p-3 rounded-lg border border-[rgb(var(--ml-border))] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 p-3 rounded-lg bg-[rgb(var(--ml-accent))] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Sending..." : "Request Access"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
