"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { completeOnboarding } from "@/app/actions/onboarding";

export default function SyncRolePage() {
  const router = useRouter();
  const [status, setStatus] = useState("Syncing your account...");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function syncRole() {
      try {
        // First check if the user already has a role set
        const user: any = await api.get("/api/v1/onboarding/me");
        
        if (user && user.role && user.role !== "none") {
          if (user.role === "landlord") {
            await completeOnboarding();
            router.push("/landlord/dashboard");
            return;
          } else if (user.role === "tenant") {
            await completeOnboarding();
            router.push("/tenant/dashboard");
            return;
          } else if (user.role === "tenant_pending") {
            setIsPending(true);
            return;
          }
        }

        // No role set. Check local storage for intent.
        const intent = localStorage.getItem("onboarding_intent");
        const landlordEmail = localStorage.getItem("landlord_email");

        if (intent === "landlord") {
          setStatus("Setting up your landlord account...");
          await api.post("/api/v1/onboarding/register-landlord");
          localStorage.removeItem("onboarding_intent");
          await completeOnboarding();
          router.push("/landlord/dashboard");
        } else if (intent === "tenant" && landlordEmail) {
          setStatus("Sending access request to landlord...");
          await api.post("/api/v1/onboarding/request-access", { landlord_email: landlordEmail });
          localStorage.removeItem("onboarding_intent");
          localStorage.removeItem("landlord_email");
          setIsPending(true);
        } else {
          // No intent found, or incomplete info.
          router.push("/");
        }
      } catch (err) {
        console.error("Sync role failed:", err);
        router.push("/");
      }
    }
    syncRole();
  }, [router]);

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-3xl font-bold">🎉 Request Sent!</h1>
          <p className="text-[rgb(var(--ml-text-secondary))]">
            We&apos;ve notified your landlord. You&apos;ll be able to access your dashboard once they approve your request.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-2 rounded-lg bg-[rgb(var(--ml-accent))] text-white font-medium"
          >
            Go to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[rgb(var(--ml-bg-primary))]">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--ml-accent))]"></div>
        <p className="text-[rgb(var(--ml-text-secondary))] font-medium">{status}</p>
      </div>
    </main>
  );
}
