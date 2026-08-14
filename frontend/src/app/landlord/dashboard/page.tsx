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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DashboardHeader />
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
            <div className="bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <h4 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">Chose Landlord by mistake?</h4>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))] mt-0.5">You currently have no properties. You can reset your account and switch to a tenant role.</p>
              </div>
              <button 
                onClick={() => setConfirmReset(true)}
                disabled={resetting}
                className="px-4 py-2 bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-primary))] border border-border/60 text-xs font-bold rounded-xl disabled:opacity-50 shrink-0 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-primary))]"
              >
                {resetting ? "Resetting..." : "Switch to Tenant"}
              </button>
            </div>
          )}

          {pendingTenants.length > 0 && (
            <div className="bg-[rgb(var(--ml-bg-secondary))] border border-border/60 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-border transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">Action Required</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {pendingTenants.length} Pending
                    </span>
                  </div>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))] mt-0.5">
                    You have {pendingTenants.length} pending tenant request{pendingTenants.length > 1 ? 's' : ''} waiting for approval.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/landlord/access-requests')}
                className="px-4 py-2.5 bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-text-primary))] border border-transparent hover:border-border/60"
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
