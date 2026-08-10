"use client";

import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function RootHeader() {
  const pathname = usePathname();

  // Hide the global root header on portal routes and onboarding
  const isPortal =
    pathname?.startsWith("/landlord") ||
    pathname?.startsWith("/tenant") ||
    pathname?.startsWith("/onboarding");

  if (isPortal) return null;

  return (
    <header className="p-4 flex justify-between items-center border-b border-[var(--ml-border)] bg-[rgb(var(--ml-bg-secondary))]">
      <div className="flex items-center gap-2 font-bold text-lg text-[rgb(var(--ml-text-primary))]">
        <Building2 className="size-5 text-[rgb(var(--ml-accent))]" />
        <span>Homepost</span>
      </div>
      <div className="flex gap-4 items-center">
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
        <ThemeToggle />
      </div>
    </header>
  );
}
