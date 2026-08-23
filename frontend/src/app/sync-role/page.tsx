"use client";

import { ClerkPublicMetadata } from "@/lib/clerk-global";

import { errorMessage, errorStatus as extractErrorStatus } from "@/lib/errors";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useUser, useSession } from "@clerk/nextjs";
import { api, UserRoleResponse } from "@/lib/api";
import { completeOnboarding } from "@/app/actions/onboarding";

function SyncRoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { session } = useSession();
  const [status, setStatus] = useState("Syncing your account...");
  const [isPending, setIsPending] = useState(false);
  
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const syncInProgress = useRef(false);

  useEffect(() => {
    if (!isAuthLoaded) return;

    async function syncRole() {
      // Guard against React Strict Mode double-invocation
      if (syncInProgress.current) return;
      syncInProgress.current = true;

      try {
        const token = await getToken();
        let user: UserRoleResponse | null = null;

        try {
          user = await api.get<UserRoleResponse>("/api/v1/onboarding/me", token);
        } catch (fetchErr) {
          console.warn("Could not fetch user role directly from /me:", fetchErr);
        }

        const metadataRole = (clerkUser?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
        const effectiveRole = (user && user.role && user.role !== "none" && user.role !== "unassigned")
          ? user.role
          : (metadataRole === "landlord" || metadataRole === "tenant" ? metadataRole : null);
        
        if (effectiveRole) {
          // Cookies required for offline clerk mock system and fast middleware checks
          if (typeof window !== "undefined") {
            document.cookie = "mock_user_onboarding_complete=true; path=/; max-age=604800; SameSite=Lax";
            document.cookie = `mock_user_role=${effectiveRole}; path=/; max-age=604800; SameSite=Lax`;
          }
          if (effectiveRole === "landlord") {
            try {
              await completeOnboarding("landlord");
              if (session) await session.reload();
            } catch (e) {
              console.warn("Non-fatal onboarding sync notice:", e);
            }
            window.location.href = "/landlord/dashboard";
            return;
          } else if (effectiveRole === "tenant") {
            try {
              await completeOnboarding("tenant");
              if (session) await session.reload();
            } catch (e) {
              console.warn("Non-fatal onboarding sync notice:", e);
            }
            window.location.href = "/tenant/dashboard";
            return;
          } else if (effectiveRole === "tenant_pending") {
            setIsPending(true);
            return;
          }
        }

        const intent = searchParams.get("intent");
        const landlordEmail = searchParams.get("landlord_email");

        if (intent === "landlord") {
          setStatus("Setting up your landlord account...");
          if (typeof window !== "undefined") {
            document.cookie = "mock_user_onboarding_complete=true; path=/; max-age=604800; SameSite=Lax";
            document.cookie = "mock_user_role=landlord; path=/; max-age=604800; SameSite=Lax";
          }
          try {
            await api.post("/api/v1/onboarding/register-landlord", undefined, token);
          } catch {
            // If already registered, proceed safely
          }
          try {
            await completeOnboarding("landlord");
            if (session) await session.reload();
          } catch (e) {
            console.warn("Non-fatal onboarding sync notice:", e);
          }
          window.location.href = "/landlord/dashboard";
        } else if (intent === "tenant" && landlordEmail) {
          setStatus("Sending access request to landlord...");
          await api.post("/api/v1/onboarding/request-access", { landlord_email: landlordEmail }, token);
          setIsPending(true);
        } else {
          window.location.href = "/";
        }
      } catch (err) {
        console.error("Sync role failed:", err);
        const code = extractErrorStatus(err) ?? 500;
        setErrorStatus(code);
        if (code === 400) {
          setErrorMessage("Looks like you already have an account role set up.");
        } else {
          setErrorMessage("Something went wrong finishing your setup. Try again?");
        }
      } finally {
        syncInProgress.current = false;
      }
    }
    syncRole();
  }, [isAuthLoaded, router, session, searchParams, clerkUser, getToken]);

  if (errorStatus) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-3xl font-bold text-destructive">Oops!</h1>
          <p className="text-[rgb(var(--ml-text-secondary))]">{errorMessage}</p>
          <div className="mt-6 flex justify-center gap-4">
            {errorStatus === 400 ? (
              <button onClick={() => router.push("/dashboard")} className="px-6 py-2 rounded-lg bg-[rgb(var(--ml-accent))] text-white font-medium">
                Go to Dashboard
              </button>
            ) : (
              <button onClick={() => { syncInProgress.current = false; window.location.reload(); }} className="px-6 py-2 rounded-lg bg-[rgb(var(--ml-accent))] text-white font-medium">
                Retry
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

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

export default function SyncRolePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4 bg-[rgb(var(--ml-bg-primary))]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--ml-accent))]"></div>
      </main>
    }>
      <SyncRoleContent />
    </Suspense>
  );
}

