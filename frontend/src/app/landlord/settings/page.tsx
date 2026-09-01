"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk-appearance";
import { toast } from "sonner";

export default function LandlordSettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast.info("Account settings are only available for registered accounts");
      router.replace("/landlord/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-4xl mx-auto animate-fade-slide-up pb-16 overflow-x-hidden">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[rgb(var(--ml-accent)/0.15)] text-[rgb(var(--ml-accent-dark))] dark:text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent)/0.3)]">
            Account Management
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-1">
          Manage your landlord credentials, security settings, and profile details.
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto flex justify-center">
        <UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
      </div>
    </div>
  );
}
