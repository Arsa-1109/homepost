"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";

export default function DashboardRedirect() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    async function checkRole() {
      try {
        const user: any = await api.get("/api/v1/onboarding/me");
        if (user && user.role) {
          if (user.role === "landlord") {
            router.push("/landlord/dashboard");
          } else if (user.role === "tenant") {
            router.push("/tenant/dashboard");
          } else if (user.role === "tenant_pending") {
            router.push("/sync-role");
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      } catch (err) {
        console.error("Dashboard redirect failed:", err);
        router.push("/");
      }
    }

    checkRole();
  }, [isLoaded, userId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  );
}
