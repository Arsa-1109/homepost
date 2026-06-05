"use client";

import { useEffect, useState } from "react";
import { fetchAPI, api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardBentoGrid, DashboardBentoSkeleton, DashboardData } from "@/components/DashboardBentoGrid";

export default function LandlordDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const result = await fetchAPI<DashboardData>("/api/v1/landlord/dashboard");
        setData(result);
      } catch (err) {
        console.error("Failed to load landlord dashboard summary:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader />
      {loading ? (
        <DashboardBentoSkeleton />
      ) : error || !data ? (
        <div className="p-6 border border-red-200 rounded-xl bg-red-50 text-red-700 text-sm">
          {error || "Failed to load dashboard data."}
        </div>
      ) : (
        <>
          {data.property_stats.total_properties === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-yellow-600 dark:text-yellow-500">Chose Landlord by mistake?</h4>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-500/80">You currently have no properties. You can reset your account and switch to a tenant role.</p>
              </div>
              <button 
                onClick={async () => {
                  if (!confirm("Are you sure you want to reset your role? This cannot be undone.")) return;
                  setResetting(true);
                  try {
                    await api.post("/api/v1/onboarding/reset-role");
                    document.cookie = "__onboarding_complete=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    router.push("/onboarding");
                  } catch (err) {
                    console.error("Failed to reset role:", err);
                    alert("Failed to reset role.");
                    setResetting(false);
                  }
                }}
                disabled={resetting}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Switch to Tenant"}
              </button>
            </div>
          )}
          <DashboardBentoGrid data={data} />
        </>
      )}
    </div>
  );
}
