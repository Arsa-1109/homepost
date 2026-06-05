"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardBentoGrid, DashboardBentoSkeleton, DashboardData } from "@/components/DashboardBentoGrid";

export default function LandlordDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <DashboardBentoGrid data={data} />
      )}
    </div>
  );
}
