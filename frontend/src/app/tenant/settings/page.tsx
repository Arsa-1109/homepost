"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk-appearance";
import { toast } from "sonner";

export default function TenantSettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.info("Account settings are only available for registered accounts");
      router.replace("/tenant/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-slide-up pb-16">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Resident Portal
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Resident Settings
        </h1>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-1">
          Manage your resident credentials, security settings, and profile details.
        </p>
      </div>

      <div className="border border-border/60 hover:border-border/80 transition-all rounded-3xl bg-[rgb(var(--ml-bg-secondary))] p-1.5 sm:p-5 shadow-sm overflow-hidden flex justify-center">
        <UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
      </div>
    </div>
  );
}
