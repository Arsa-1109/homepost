"use client";

import { UserProfile } from "@clerk/nextjs";

export default function LandlordSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-[rgb(var(--ml-text-secondary))] -mt-4">
        Manage your account settings, security options, and personal profile.
      </p>
      
      <div className="border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] p-1 md:p-6 overflow-hidden flex justify-center">
        <UserProfile 
          routing="hash"
          appearance={{
            variables: {
              colorPrimary: "rgb(245, 158, 11)", // match ml-accent (amber-500)
              colorBackground: "transparent",
              colorText: "rgb(248, 250, 252)", // match ml-text-primary in dark mode
              colorTextSecondary: "rgb(148, 163, 184)", // match ml-text-secondary in dark mode
            },
            elements: {
              card: "shadow-none w-full border-0 bg-transparent",
              navbar: "border-r border-[rgb(var(--ml-border))]",
              navbarMobileMenuRow: "border-b border-[rgb(var(--ml-border))]",
              pageScrollable: "bg-transparent",
              profileSectionTitleText: "text-[rgb(var(--ml-text-primary))]",
            }
          }}
        />
      </div>
    </div>
  );
}
