"use client";

import { UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk-appearance";

export default function TenantSettingsPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-slide-up pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Settings
        </h1>
        <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-1">
          Manage your account settings, security options, and personal profile.
        </p>
      </div>

      <div className="border border-border/60 hover:border-border/80 transition-all rounded-3xl bg-[rgb(var(--ml-bg-secondary))] p-2 sm:p-6 shadow-sm overflow-hidden flex justify-center">
        <UserProfile
          routing="hash"
          appearance={clerkUserProfileAppearance}
        />
      </div>
    </div>
  );
}

