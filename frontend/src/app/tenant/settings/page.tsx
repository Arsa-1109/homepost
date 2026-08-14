"use client";

import { UserProfile } from "@clerk/nextjs";

export default function TenantSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-slide-up">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))]">
          Settings
        </h1>
        <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-2">
          Manage your account settings, security options, and personal profile.
        </p>
      </div>

      <div className="border border-border rounded-xl bg-[rgb(var(--ml-bg-secondary))] p-1 md:p-6 overflow-hidden flex justify-center">
        <UserProfile
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "rgb(var(--ml-accent))",
              colorBackground: "transparent",
              colorText: "rgb(var(--ml-text-primary))",
              colorTextSecondary: "rgb(var(--ml-text-secondary))",
            },
            elements: {
              card: "shadow-none w-full border-0 bg-transparent",
              navbar: "border-r border-border",
              navbarMobileMenuRow: "border-b border-border",
              pageScrollable: "bg-transparent",
              profileSectionTitleText: "text-[rgb(var(--ml-text-primary))]",
            },
          }}
        />
      </div>
    </div>
  );
}
