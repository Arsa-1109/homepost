"use client";

import { useEffect, useState } from "react";
import { fetchAPI, api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardBentoGrid, DashboardBentoSkeleton, DashboardData } from "@/components/DashboardBentoGrid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, CheckCircle, XCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function LandlordDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleApprove = async (userId: string) => {
    const unitId = selectedUnits[userId];
    if (!unitId) return;
    
    setIsSubmitting(true);
    try {
      await fetchAPI("/api/v1/landlord/approve-tenant", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, unit_id: unitId }),
      });
      
      setData((prev) => prev ? {
        ...prev,
        pending_approvals: prev.pending_approvals.filter((t) => t.id !== userId),
      } : prev);
    } catch (err) {
      alert("Failed to approve tenant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async (userId: string) => {
    if (!confirm("Are you sure you want to deny this request?")) return;
    setIsSubmitting(true);
    try {
      await fetchAPI("/api/v1/landlord/deny-tenant", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      
      setData((prev) => prev ? {
        ...prev,
        pending_approvals: prev.pending_approvals.filter((t) => t.id !== userId),
      } : prev);
    } catch (err) {
      alert("Failed to deny tenant.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {data.pending_approvals && data.pending_approvals.length > 0 && (
            <Sheet>
              <SheetTrigger
                render={
                  <Alert className="bg-amber-50 border-amber-200 text-amber-800 cursor-pointer hover:bg-amber-100 transition-colors">
                    <Users className="h-4 w-4 stroke-amber-600" />
                    <AlertTitle className="text-amber-800 font-semibold">Pending Tenants</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      You have {data.pending_approvals.length} pending tenant requests. Click here to review and assign them to a unit.
                    </AlertDescription>
                  </Alert>
                }
              />
              <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Pending Tenant Requests</SheetTitle>
                  <SheetDescription>
                    Review requests from users who signed up with your email and assign them to a unit.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {data.pending_approvals.map((tenant) => (
                    <div key={tenant.id} className="p-4 border border-[rgb(var(--ml-border))] rounded-xl space-y-3">
                      <div>
                        <p className="font-bold text-sm">{tenant.name || "Unnamed Tenant"}</p>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))]">{tenant.email}</p>
                      </div>
                      <div className="space-y-2">
                        <select
                          className="w-full bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded p-2 text-sm appearance-none outline-none focus:ring-2 focus:ring-[rgb(var(--ml-accent))] focus:border-transparent"
                          value={selectedUnits[tenant.id] || ""}
                          onChange={(e) => setSelectedUnits({ ...selectedUnits, [tenant.id]: e.target.value })}
                        >
                          <option value="" disabled>Select a unit to assign...</option>
                          {data.units.map(u => (
                            <option key={u.id} value={u.id}>
                              Unit: {u.unit_label} {u.is_occupied ? "(Occupied)" : "(Vacant)"}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(tenant.id)}
                            disabled={isSubmitting || !selectedUnits[tenant.id]}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleDeny(tenant.id)}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-1 border border-red-500/50 text-red-500 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" /> Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
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
                    const { resetOnboarding } = await import("@/app/actions/onboarding");
                    await resetOnboarding();
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
