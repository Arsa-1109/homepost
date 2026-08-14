"use client";

import { UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk-appearance";

export default function TenantSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-slide-up pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Settings
        </h1>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-1">
          Manage your account credentials, connected authentication providers, and personal profile.
        </p>
      </div>

      <div className="border border-border/60 hover:border-border/80 transition-all rounded-3xl bg-[rgb(var(--ml-bg-secondary))] p-1.5 sm:p-5 shadow-sm overflow-hidden flex justify-center">
        <UserProfile
          routing="hash"
          appearance={clerkUserProfileAppearance}
        />
      </div>
    </div>
  );
}

