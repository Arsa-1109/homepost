"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI, api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, User as UserIcon, Calendar, Wrench, FileText, DownloadIcon, ChevronLeft, ChevronRight, Building, Pencil, Trash2, AlertTriangle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaintenanceRequest, RequestCard } from "@/app/landlord/requests/page";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@clerk/nextjs";

type UnitDetail = {
  unit: {
    id: string;
    property_id: string;
    unit_label: string;
    rent_amount: number;
    rent_due_day: number;
    is_occupied: boolean;
    has_pending: boolean;
  };
  property_name: string;
  tenant_name: string | null;
  tenant_email: string | null;
  lease_start: string | null;
  lease_end: string | null;
};

type Document = {
  id: string;
  title: string;
  file_type: string;
  file_url: string;
  created_at: string;
};

export default function UnitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;
  const { isLoaded, getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unitData, setUnitData] = useState<UnitDetail | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const MAINTENANCE_ITEMS_PER_PAGE = 3;
  const [maintenancePage, setMaintenancePage] = useState(1);

  const totalMaintenancePages = Math.ceil(maintenanceRequests.length / MAINTENANCE_ITEMS_PER_PAGE);
  const currentMaintenanceRequests = maintenanceRequests.slice(
    (maintenancePage - 1) * MAINTENANCE_ITEMS_PER_PAGE,
    maintenancePage * MAINTENANCE_ITEMS_PER_PAGE
  );

  const [isEditLeaseOpen, setIsEditLeaseOpen] = useState(false);
  const [editLeaseStart, setEditLeaseStart] = useState("");
  const [editLeaseEnd, setEditLeaseEnd] = useState("");
  const [isUpdatingLease, setIsUpdatingLease] = useState(false);

  // Edit Unit states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editRentDay, setEditRentDay] = useState("1");
  const [isUpdatingUnit, setIsUpdatingUnit] = useState(false);

  // Delete Unit states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);

  useEffect(() => {
    if (unitData) {
      setEditLeaseStart(unitData.lease_start || "");
      setEditLeaseEnd(unitData.lease_end || "");
      setEditLabel(unitData.unit.unit_label);
      setEditRentDay(String(unitData.unit.rent_due_day));
    }
  }, [unitData]);

  useEffect(() => {
    if (!isLoaded || !unitId) return;
    async function loadData() {
      try {
        const token = await getToken();
        const [unitRes, maintRes, docsRes] = await Promise.all([
          fetchAPI<UnitDetail>(`/api/v1/landlord/units/${unitId}`, {}, token),
          fetchAPI<MaintenanceRequest[]>(`/api/v1/landlord/maintenance?unit_id=${unitId}`, {}, token),
          fetchAPI<Document[]>(`/api/v1/landlord/units/${unitId}/documents`, {}, token)
        ]);
        setUnitData(unitRes);
        setMaintenanceRequests(maintRes);
        setDocuments(docsRes);
      } catch (err) {
        console.error("Failed to load unit details:", err);
        setError("Failed to load unit details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [unitId, isLoaded, getToken]);

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header Hero Skeleton */}
        <div className="space-y-4">
          <div className="skeleton h-5 w-32 rounded-full" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-44 rounded-xl" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="skeleton h-9 w-24 rounded-xl" />
              <div className="skeleton h-9 w-24 rounded-xl" />
              <div className="skeleton h-9 w-36 rounded-xl" />
            </div>
          </div>
          <div className="skeleton h-4 w-32 rounded-lg" />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Unified floating card skeleton */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl p-6 sm:p-8 border border-border/60 bg-[rgb(var(--ml-bg-secondary))] shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="skeleton h-11 w-11 rounded-2xl" />
                <div className="space-y-1.5">
                  <div className="skeleton h-5 w-28 rounded-lg" />
                  <div className="skeleton h-3 w-36 rounded" />
                </div>
              </div>

              <div className="rounded-2xl p-4 border border-border/40 bg-[rgb(var(--ml-bg-primary))]/50 space-y-2">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-5 w-40 rounded-lg" />
              </div>

              <div className="skeleton h-px w-full rounded" />

              <div className="flex items-center gap-3">
                <div className="skeleton h-11 w-11 rounded-2xl" />
                <div className="space-y-1.5">
                  <div className="skeleton h-5 w-36 rounded-lg" />
                  <div className="skeleton h-3 w-40 rounded" />
                </div>
              </div>

              <div className="rounded-2xl p-5 border border-border/40 bg-[rgb(var(--ml-bg-primary))]/50 space-y-4">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-5 w-36 rounded-lg" />
                </div>
                <div className="pt-3 border-t border-border/20 space-y-2">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-4 w-48 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Maintenance + Documents skeleton */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-xl" />
                  <div className="skeleton h-6 w-44 rounded-xl" />
                </div>
                <div className="skeleton h-5 w-8 rounded-full" />
              </div>

              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-3xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="skeleton h-8 w-8 rounded-xl" />
                        <div className="skeleton h-5 w-40 rounded-lg" />
                      </div>
                      <div className="skeleton h-5 w-16 rounded-full" />
                    </div>
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-3 w-24 rounded" />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-xl" />
                  <div className="skeleton h-6 w-32 rounded-xl" />
                </div>
                <div className="skeleton h-5 w-8 rounded-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-3xl border border-border/40 bg-[rgb(var(--ml-bg-secondary))] flex items-start gap-4"
                  >
                    <div className="skeleton h-10 w-10 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-full rounded-lg" />
                      <div className="skeleton h-3 w-24 rounded" />
                      <div className="skeleton h-4 w-20 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }


  if (error || !unitData) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="bg-red-500/10 text-red-600 dark:text-red-400 p-6 rounded-3xl border border-red-500/20 text-center font-bold text-sm">
          {error || "Unit not found."}
        </div>
      </div>
    );
  }

  const { unit, property_name, tenant_name, tenant_email, lease_start, lease_end } = unitData;
  const { unit_label, is_occupied, rent_due_day } = unit;

  const isLeaseExpired = lease_end ? new Date(new Date(lease_end).setHours(23, 59, 59, 999)) < new Date() : false;

  const handleUpdateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingLease(true);
    try {
      await api.put(`/api/v1/landlord/units/${unitId}/lease`, {
        lease_start: editLeaseStart || null,
        lease_end: editLeaseEnd || null
      });
      toast.success("Lease dates updated successfully!");
      const unitRes = await fetchAPI<UnitDetail>(`/api/v1/landlord/units/${unitId}`);
      setUnitData(unitRes);
      setIsEditLeaseOpen(false);
    } catch (err) {
      console.error("Failed to update lease dates:", err);
      toast.error("Failed to update lease dates.");
    } finally {
      setIsUpdatingLease(false);
    }
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUnit(true);
    try {
      await fetchAPI(`/api/v1/landlord/units/${unitId}`, {
        method: "PUT",
        body: JSON.stringify({
          unit_label: editLabel,
          rent_due_day: parseInt(editRentDay),
        }),
      });
      toast.success("Unit updated successfully!");
      setIsEditDialogOpen(false);
      const unitRes = await fetchAPI<UnitDetail>(`/api/v1/landlord/units/${unitId}`);
      setUnitData(unitRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to update unit.");
    } finally {
      setIsUpdatingUnit(false);
    }
  };

  const handleDeleteUnit = async () => {
    setIsDeletingUnit(true);
    try {
      await fetchAPI(`/api/v1/landlord/units/${unitId}`, { method: "DELETE" });
      toast.success("Unit deleted successfully.");
      setIsDeleteDialogOpen(false);
      router.push("/landlord/units");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete unit.");
    } finally {
      setIsDeletingUnit(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 relative">
      {/* Header Hero Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
              <Building className="w-3.5 h-3.5" /> {property_name}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              Unit {unit_label}
              {is_occupied ? (
                <Badge variant="outline" className="uppercase tracking-wider text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Occupied
                </Badge>
              ) : (
                <Badge variant="outline" className="uppercase tracking-wider text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Vacant
                </Badge>
              )}
            </h1>
            <Link href="/landlord/units" className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors inline-flex items-center gap-1 pt-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Units List
            </Link>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setEditLabel(unit_label);
                setEditRentDay(String(rent_due_day));
                setIsEditDialogOpen(true);
              }}
              className="px-3.5 py-2 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] text-xs font-bold rounded-xl hover:bg-[rgb(var(--ml-bg-tertiary))] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Unit
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="px-3.5 py-2 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/10 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Unit
            </button>
            <Link 
              href="/landlord/requests" 
              className="px-3.5 py-2 bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:border-transparent hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]"
            >
              View All Maintenance
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

        {/* LEFT COLUMN: Unit & Tenant Profile Floating Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="lg:col-span-1"
        >
          <div className="rounded-3xl p-6 sm:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 shadow-sm flex flex-col relative overflow-hidden group space-y-6">


            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[rgb(var(--ml-text-primary))]">Rent Details</h2>
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">Schedule & collection info</p>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              <div className="p-4 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[rgb(var(--ml-accent))]" /> Rent Due Date
                  </span>
                  <p className="text-sm font-extrabold text-[rgb(var(--ml-text-primary))]">Day {rent_due_day} of every month</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[rgb(var(--ml-accent))]" /> Lease Period
                    </span>
                    <p className="text-sm font-extrabold text-[rgb(var(--ml-text-primary))]">
                      {lease_start && lease_end
                        ? `${new Date(lease_start).toLocaleDateString()} – ${new Date(lease_end).toLocaleDateString()}`
                        : "Not Set"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditLeaseOpen(true)}
                    className="px-3 py-1.5 text-xs font-extrabold rounded-xl bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/20 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
                  >
                    {lease_start || lease_end ? "Edit" : "Set Lease"}
                  </button>
                </div>
                {isLeaseExpired && (
                  <div className="w-full flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 mt-1 shadow-inner">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold leading-snug">
                      This lease contract has expired. Please renew the lease or update the dates.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-border/40 relative z-10" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[rgb(var(--ml-text-primary))]">Tenant Information</h2>
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">Active lease holder details</p>
              </div>
            </div>

            <div className="relative z-10">
              {is_occupied ? (
                <div className="p-5 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[rgb(var(--ml-text-secondary))] mb-1">Full Name</span>
                    <span className="text-base font-extrabold text-[rgb(var(--ml-text-primary))]">{tenant_name || "N/A"}</span>
                  </div>
                  <div className="flex flex-col pt-3 border-t border-border/30">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[rgb(var(--ml-text-secondary))] mb-1">Email Address</span>
                    <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">{tenant_email || "N/A"}</span>
                  </div>
                </div>
              ) : (
                <div className="py-10 px-4 flex flex-col items-center justify-center text-center rounded-2xl bg-[rgb(var(--ml-bg-primary))]/40 border border-dashed border-border/60">
                  <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border/50 flex items-center justify-center mb-3 shadow-inner">
                    <UserIcon className="w-5 h-5 text-[rgb(var(--ml-text-secondary))]" />
                  </div>
                  <p className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">This unit is currently vacant.</p>
                  <p className="text-[11px] font-medium text-[rgb(var(--ml-text-secondary))] mt-0.5 max-w-[200px]">
                    Generate an invite link from the main Units page to onboard a tenant.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Maintenance & Documents */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          className="lg:col-span-2 space-y-8"
        >
          {/* Maintenance Section */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5 text-[rgb(var(--ml-text-primary))]">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                  <Wrench className="w-4 h-4" />
                </div>
                Maintenance Requests
              </h2>
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-extrabold text-xs bg-[rgb(var(--ml-bg-secondary))] border-border/60 text-[rgb(var(--ml-text-primary))]">
                {maintenanceRequests.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {maintenanceRequests.length === 0 ? (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl bg-[rgb(var(--ml-bg-secondary))] border border-dashed border-border/60">
                  <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--ml-bg-primary))] flex items-center justify-center mb-3 shadow-inner border border-border/40">
                    <Wrench className="w-5 h-5 text-[rgb(var(--ml-text-secondary))]" />
                  </div>
                  <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">No Active Requests</p>
                  <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">This unit is well-maintained with no recorded issues.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMaintenanceRequests.map((req, idx) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <RequestCard
                        req={req}
                        onUpdate={() => {
                          fetchAPI<MaintenanceRequest[]>(`/api/v1/landlord/maintenance?unit_id=${unitId}`)
                            .then(setMaintenanceRequests)
                            .catch(console.error);
                        }}
                      />
                    </motion.div>
                  ))}

                  {maintenanceRequests.length > MAINTENANCE_ITEMS_PER_PAGE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
                      <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                        Showing{" "}
                        <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                          {(maintenancePage - 1) * MAINTENANCE_ITEMS_PER_PAGE + 1}
                        </span>
                        –
                        <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                          {Math.min(maintenancePage * MAINTENANCE_ITEMS_PER_PAGE, maintenanceRequests.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                          {maintenanceRequests.length}
                        </span>{" "}
                        requests
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMaintenancePage((p) => Math.max(p - 1, 1))}
                          disabled={maintenancePage === 1}
                          className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-[0.98] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 transition-all duration-200 ease-out hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalMaintenancePages }, (_, i) => i + 1).map(
                            (pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => setMaintenancePage(pageNum)}
                                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center justify-center active:scale-[0.98] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 ${
                                  maintenancePage === pageNum
                                    ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-transparent shadow-sm"
                                    : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/30 hover:text-[rgb(var(--ml-text-primary))]"
                                }`}
                              >
                                {pageNum}
                              </button>
                            ),
                          )}
                        </div>

                        <button
                          onClick={() => setMaintenancePage((p) => Math.min(p + 1, totalMaintenancePages))}
                          disabled={maintenancePage === totalMaintenancePages || totalMaintenancePages === 0}
                          className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-[0.98] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 transition-all duration-200 ease-out hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                          title="Next Page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Documents Section */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5 text-[rgb(var(--ml-text-primary))]">
                <div className="p-2 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-xl border border-[rgb(var(--ml-accent))]/20">
                  <FileText className="w-4 h-4" />
                </div>
                Documents
              </h2>
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-extrabold text-xs bg-[rgb(var(--ml-bg-secondary))] border-border/60 text-[rgb(var(--ml-text-primary))]">
                {documents.length}
              </Badge>
            </div>

            <div>
              {documents.length === 0 ? (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-3xl bg-[rgb(var(--ml-bg-secondary))] border border-dashed border-border/60">
                  <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--ml-bg-primary))] flex items-center justify-center mb-3 shadow-inner border border-border/40">
                    <FileText className="w-5 h-5 text-[rgb(var(--ml-text-secondary))]" />
                  </div>
                  <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">No Documents Found</p>
                  <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">Upload leases or important files for this unit.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="p-5 rounded-3xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] flex items-start gap-4 group relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20"
                    >
                      <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm text-[rgb(var(--ml-text-primary))] truncate mb-0.5">
                          {doc.title}
                        </p>
                        <p className="text-[11px] font-semibold text-[rgb(var(--ml-text-secondary))] mb-3">
                          Added {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[rgb(var(--ml-accent))] hover:text-[rgb(var(--ml-accent-dark))] transition-colors"
                          >
                            <DownloadIcon className="w-3.5 h-3.5" /> DOWNLOAD FILE
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </motion.div>
      </div>

      {/* Edit Lease Modal Dialog */}
      <Dialog open={isEditLeaseOpen} onOpenChange={setIsEditLeaseOpen}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-border/20 pb-4">
            <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-[rgb(var(--ml-text-primary))] tracking-tight">
                Set Lease Dates
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                Contract range for Unit {unit_label}
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleUpdateLease} className="space-y-4 pt-1">
            <div>
              <label className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block mb-1.5">
                Lease Start Date
              </label>
              <DatePicker
                value={editLeaseStart}
                onChange={setEditLeaseStart}
                placeholder="Select start date"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block mb-1.5">
                Lease End Date
              </label>
              <DatePicker
                value={editLeaseEnd}
                onChange={setEditLeaseEnd}
                placeholder="Select end date"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border/30">
              <button
                type="button"
                onClick={() => setIsEditLeaseOpen(false)}
                className="flex-1 h-11 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] text-xs font-bold transition-colors cursor-pointer text-[rgb(var(--ml-text-primary))]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingLease}
                className="flex-1 h-11 rounded-xl bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)] disabled:opacity-50"
              >
                {isUpdatingLease ? "Saving..." : "Save Dates"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl outline-none ring-0">
          <form onSubmit={handleUpdateUnit}>
            <div className="p-6 sm:p-7 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0 shadow-inner">
                  <Pencil className="h-6 w-6 text-[rgb(var(--ml-accent))]" />
                </div>
                <div>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">Edit Unit</DialogTitle>
                    <DialogDescription className="mt-1 text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                      Update the unit label or monthly rent due date.
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">Unit Label</label>
                  <input 
                    required 
                    value={editLabel} 
                    onChange={e => setEditLabel(e.target.value)} 
                    placeholder="e.g. Apt 101, Basement, etc." 
                    className="w-full h-11 px-3.5 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl text-xs font-medium outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all placeholder:[rgb(var(--ml-text-secondary))]/50 text-[rgb(var(--ml-text-primary))]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">Rent Due Day</label>
                  <Select
                    value={editRentDay}
                    onValueChange={(val) => setEditRentDay(val || "1")}
                  >
                    <SelectTrigger className="w-full h-11 px-3.5 bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl text-xs font-medium outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-1 focus:ring-[rgb(var(--ml-accent))] transition-all">
                      <SelectValue placeholder="Select Day" />
                    </SelectTrigger>
                    <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl max-h-60 overflow-y-auto z-[100]">
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem
                          key={i + 1}
                          value={(i + 1).toString()}
                          className="font-semibold text-xs cursor-pointer"
                        >
                          Day {i + 1} of every month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border/30 flex gap-3 justify-end items-center">
                <button 
                  type="button"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUnit}
                  className="px-5 py-2.5 text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] rounded-xl flex-1 sm:flex-initial shadow-sm shadow-[rgba(var(--ml-accent),0.15)] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                >
                  {isUpdatingUnit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/60 shadow-2xl bg-[rgb(var(--ml-bg-secondary))] rounded-3xl outline-none ring-0">
          <div className="p-6 sm:p-7 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shrink-0 shadow-inner">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight">Delete Unit</DialogTitle>
                  <DialogDescription className="mt-1.5 text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-[rgb(var(--ml-text-primary))]">Unit {unit_label}</span>? All lease history, invitations, and related documents will be permanently removed.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-border/30 flex gap-3 justify-end items-center">
              <button 
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="px-5 py-2.5 text-xs font-bold border border-border/40 bg-[rgb(var(--ml-bg-primary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] rounded-xl transition-colors cursor-pointer flex-1 sm:flex-initial shadow-sm"
              >
                Cancel
              </button>
              <button 
                disabled={isDeletingUnit}
                onClick={handleDeleteUnit}
                className="px-5 py-2.5 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial shadow-sm shadow-red-600/20 active:scale-[0.98]"
              >
                {isDeletingUnit ? "Deleting..." : "Yes, delete unit"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
