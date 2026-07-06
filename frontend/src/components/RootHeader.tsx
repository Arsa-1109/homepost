"use client";

import { usePathname } from "next/navigation";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Building2 } from "lucide-react";

export function RootHeader() {
  const pathname = usePathname();

  // Hide the global root header on portal routes and onboarding
  const isPortal =
    pathname?.startsWith("/landlord") ||
    pathname?.startsWith("/tenant") ||
    pathname?.startsWith("/onboarding");

  if (isPortal) return null;

  return (
    <header className="p-4 flex justify-between items-center border-b border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))]">
      <div className="font-extrabold text-lg flex items-center gap-2 text-[rgb(var(--ml-accent))]">
        <Building2 className="w-5 h-5" />
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
