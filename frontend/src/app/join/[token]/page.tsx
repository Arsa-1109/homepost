/**
 * Invite Join Page — /join/[token]
 *
 * Handles the invite token fast-track onboarding flow.
 * Extracts token from URL, validates via backend, and redirects.
 *
 * TODO (Phase 4, Task 4.7): Implement full invite acceptance logic.
 */

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/onboarding/accept-invite", { token });
      document.cookie = "__onboarding_complete=true; path=/";
      router.push("/tenant/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to accept invite. It may have expired or already been used.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-3xl font-bold">🎉 You&apos;ve been invited!</h1>
        <p className="text-[rgb(var(--ml-text-secondary))]">
          Click below to accept your invite and join the property.
        </p>

        {error && <div className="text-red-500 bg-red-100/10 p-3 rounded-lg text-sm">{error}</div>}

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full p-4 rounded-xl bg-[rgb(var(--ml-accent))] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
        >
          {loading ? "Accepting..." : "Accept Invite"}
        </button>
      </div>
    </main>
  );
}
