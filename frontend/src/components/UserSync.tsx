"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !syncedRef.current) {
      syncedRef.current = true;
      const email = user.primaryEmailAddress?.emailAddress || "";
      const fullName = user.fullName || "";
      
      getToken().then((token) => {
        api.post("/api/v1/onboarding/sync", { email, full_name: fullName }, token)
          .catch((err) => console.error("Failed to automatically sync user profile to database:", err));
      });
    }
  }, [isLoaded, user, getToken]);

  return null;
}
