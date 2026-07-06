"use client";

import { useEffect, useState } from "react";
import { fetchAPI, api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardBentoGrid, DashboardBentoSkeleton, DashboardData } from "@/components/DashboardBentoGrid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PendingTenant {
  id: string;
  email: string;
  full_name: string;
}

export default function LandlordDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [pendingTenants, setPendingTenants] = useState<PendingTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const router = useRouter();

  const doResetRole = async () => {
    setConfirmReset(false);
    setResetting(true);
    try {
      await api.post("/api/v1/onboarding/reset-role");
      const { resetOnboarding } = await import("@/app/actions/onboarding");
      await resetOnboarding();
      router.push("/");
    } catch (err) {
      console.error("Failed to reset role:", err);
      toast.error("Failed to reset role. Please try again.");
      setResetting(false);
    }
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [dashResult, pendingResult] = await Promise.all([
          fetchAPI<DashboardData>("/api/v1/landlord/dashboard"),
          fetchAPI<PendingTenant[]>("/api/v1/landlord/pending-tenants")
        ]);
        setData(dashResult);
        setPendingTenants(pendingResult);
      } catch (err) {
        console.error("Failed to load landlord dashboard summary:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  async function handleApproveTenant(tenantId: string) {
    const unitId = selectedUnits[tenantId];
    if (!unitId) return;
    
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/landlord/approve-tenant", {
        user_id: tenantId,
        unit_id: unitId
      });
      // Remove from pending list
      setPendingTenants(prev => prev.filter(t => t.id !== tenantId));
      // Refresh dashboard data
      const result = await fetchAPI<DashboardData>("/api/v1/landlord/dashboard");
      setData(result);
    } catch (err) {
      console.error("Failed to approve tenant:", err);
      alert("Failed to approve tenant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const headerDesc = data 
    ? (() => {
        const uniqueProperties = Array.from(new Set(data.units.map(u => u.property_name).filter(Boolean)));
        if (uniqueProperties.length === 1) {
          const totalUnitsLabel = `${data.property_stats.total_units} unit${data.property_stats.total_units !== 1 ? 's' : ''}`;
          return `${uniqueProperties[0]} · 1 property · ${totalUnitsLabel}`;
        }
        return `${data.property_stats.total_properties} properties · ${data.property_stats.total_units} units`;
      })()
    : undefined;

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader description={headerDesc} />
      {loading ? (
        <DashboardBentoSkeleton />
      ) : error || !data ? (
        <div className="p-6 border border-red-200 rounded-xl bg-red-50 text-red-700 text-sm">
          {error || "Failed to load dashboard data."}
        </div>
      ) : (
        <>
          <ConfirmDialog
            open={confirmReset}
            title="Switch to Tenant?"
            description="This will permanently reset your role from Landlord to Tenant. All your properties and listings will be removed. This cannot be undone."
            confirmLabel="Yes, Switch Role"
            cancelLabel="Keep Landlord"
            variant="danger"
            onConfirm={doResetRole}
            onCancel={() => setConfirmReset(false)}
          />

          {data.property_stats.total_properties === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-yellow-600 dark:text-yellow-500">Chose Landlord by mistake?</h4>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-500/80">You currently have no properties. You can reset your account and switch to a tenant role.</p>
              </div>
              <button 
                onClick={() => setConfirmReset(true)}
                disabled={resetting}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Switch to Tenant"}
              </button>
            </div>
          )}

          {pendingTenants.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">Action Required</h4>
                  <p className="text-sm text-blue-800/80 dark:text-blue-300/80">You have {pendingTenants.length} pending tenant request{pendingTenants.length > 1 ? 's' : ''} waiting for approval.</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/landlord/access-requests')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Review Requests
              </button>
            </div>
          )}

          <DashboardBentoGrid data={data} />
        </>
      )}
    </div>
  );
}
