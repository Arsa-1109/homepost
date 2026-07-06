"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI, api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, User as UserIcon, Calendar, Wrench, FileText, DownloadIcon, ChevronLeft, Building, Pencil, Trash2, AlertTriangle } from "lucide-react";
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unitData, setUnitData] = useState<UnitDetail | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

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
    async function loadData() {
      if (!unitId) return;
      try {
        const [unitRes, maintRes, docsRes] = await Promise.all([
          fetchAPI<UnitDetail>(`/api/v1/landlord/units/${unitId}`),
          fetchAPI<MaintenanceRequest[]>(`/api/v1/landlord/maintenance?unit_id=${unitId}`),
          fetchAPI<Document[]>(`/api/v1/landlord/units/${unitId}/documents`)
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
  }, [unitId]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
        {/* Back link + title row */}
        <div className="mb-8 flex flex-col gap-2">
          <div className="skeleton h-4 w-32 rounded-lg mb-2" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-40 rounded-xl" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-9 w-40 rounded-xl" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="skeleton h-4 w-4 rounded-sm" />
            <div className="skeleton h-4 w-36 rounded-lg" />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">

          {/* LEFT: Unified floating card */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl p-6 md:p-8 border border-[rgb(var(--ml-border))]/40 bg-[rgb(var(--ml-bg-secondary))] shadow-[0_20px_40px_rgba(0,0,0,0.06)] space-y-6">

              {/* Rent details header */}
              <div className="flex items-center gap-3">
                <div className="skeleton h-12 w-12 rounded-2xl" />
                <div className="skeleton h-6 w-32 rounded-lg" />
              </div>

              {/* Rent due date block */}
              <div className="rounded-2xl p-4 border border-[rgb(var(--ml-border))]/30 bg-[rgb(var(--ml-bg-primary))]/40 space-y-2">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-6 w-36 rounded-lg" />
              </div>

              {/* Divider */}
              <div className="skeleton h-px w-full rounded" />

              {/* Tenant info header */}
              <div className="flex items-center gap-3">
                <div className="skeleton h-12 w-12 rounded-2xl" />
                <div className="skeleton h-6 w-40 rounded-lg" />
              </div>

              {/* Tenant name + email block */}
              <div className="rounded-2xl p-5 border border-[rgb(var(--ml-border))]/30 bg-[rgb(var(--ml-bg-primary))]/40 space-y-4">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-6 w-44 rounded-lg" />
                </div>
                <div className="pt-3 border-t border-[rgb(var(--ml-border))]/20 space-y-2">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-5 w-52 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Maintenance + Documents */}
          <div className="lg:col-span-2 space-y-12">

            {/* Maintenance section */}
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-9 w-9 rounded-xl" />
                  <div className="skeleton h-7 w-48 rounded-xl" />
                </div>
                <div className="skeleton h-6 w-8 rounded-full" />
              </div>

              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-[rgb(var(--ml-border))]/40 bg-[rgb(var(--ml-bg-secondary))] space-y-3"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="skeleton h-9 w-9 rounded-xl" />
                        <div className="skeleton h-5 w-44 rounded-lg" />
                      </div>
                      <div className="skeleton h-5 w-16 rounded-full" />
                    </div>
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-24 rounded" />
                  </div>
                ))}
              </div>
            </section>

            {/* Documents section */}
            <section>
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-9 w-9 rounded-xl" />
                  <div className="skeleton h-7 w-32 rounded-xl" />
                </div>
                <div className="skeleton h-6 w-8 rounded-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-[rgb(var(--ml-border))]/40 bg-[rgb(var(--ml-bg-secondary))] flex items-start gap-4"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-full rounded-lg" />
                      <div className="skeleton h-3 w-28 rounded" />
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
      <div className="p-6 md:p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
          {error || "Unit not found."}
        </div>
      </div>
    );
  }

  const { unit, property_name, tenant_name, tenant_email, lease_start, lease_end } = unitData;
  const { unit_label, is_occupied, rent_due_day } = unit;

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
          rent_due_day: parseInt(editRentDay)
        })
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen relative">
      <div className="mb-8 flex flex-col gap-2 relative z-10">
        <Link href="/landlord/dashboard" className="text-sm font-medium text-[rgb(var(--ml-text-muted))] hover:text-[rgb(var(--ml-accent))] transition-colors flex items-center gap-1 w-fit mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))]">Unit {unit_label}</h1>
            {is_occupied ? (
              <Badge variant="success" className="uppercase tracking-widest text-[10px] font-bold py-1 px-2">Occupied</Badge>
            ) : (
              <Badge variant="outline" className="uppercase tracking-widest text-[10px] font-bold py-1 px-2 border-dashed">Vacant</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditLabel(unit_label);
                setEditRentDay(String(rent_due_day));
                setIsEditDialogOpen(true);
              }}
              className="px-4 py-2 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/60 text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] text-sm font-semibold rounded-xl hover:bg-[rgb(var(--ml-bg-tertiary))] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover-lift"
            >
              <Pencil className="w-4 h-4" /> Edit Unit
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="px-4 py-2 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/10 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover-lift"
            >
              <Trash2 className="w-4 h-4" /> Delete Unit
            </button>
            <Link href="/landlord/requests" className="px-4 py-2 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/60 text-[rgb(var(--ml-text-primary))] text-sm font-semibold rounded-xl hover:bg-[rgb(var(--ml-bg-tertiary))] transition-all shadow-sm flex items-center gap-1.5 hover-lift">
              View All Maintenance
            </Link>
          </div>
        </div>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
          <Building className="w-4 h-4" /> {property_name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 relative z-10">

        {/* LEFT COLUMN: Unit & Tenant Profile Floating Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="lg:col-span-1"
        >
          <div className="rounded-3xl p-6 md:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/50 shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col relative overflow-hidden group">
            {/* Decorative gradient orb */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[rgb(var(--ml-accent))]/10 rounded-full blur-[3xl] transform translate-x-1/2 -translate-y-1/3 transition-transform duration-700 group-hover:scale-110 pointer-events-none" />

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl shadow-inner border border-indigo-500/10">
                <Home className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]">Rent Details</h2>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex flex-col p-4 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/50 border border-[rgb(var(--ml-border))]/30">
                <span className="text-xs uppercase tracking-wider font-semibold text-[rgb(var(--ml-text-muted))] mb-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Rent Due Date
                </span>
                <span className="text-[rgb(var(--ml-text-primary))] font-medium text-lg">Day {rent_due_day} of month</span>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgb(var(--ml-border))] to-transparent my-8 relative z-10" />

            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl shadow-inner border border-emerald-500/10">
                <UserIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]">Tenant Information</h2>
            </div>

            <div className="relative z-10">
              {is_occupied ? (
                <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-[rgb(var(--ml-bg-primary))]/50 to-transparent border border-[rgb(var(--ml-border))]/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[rgb(var(--ml-text-muted))] mb-1">Full Name</span>
                    <span className="text-[rgb(var(--ml-text-primary))] font-semibold text-lg">{tenant_name || "N/A"}</span>
                  </div>
                  <div className="flex flex-col pt-3 border-t border-[rgb(var(--ml-border))]/30">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[rgb(var(--ml-text-muted))] mb-1">Email Address</span>
                    <span className="text-[rgb(var(--ml-text-primary))] font-medium">{tenant_email || "N/A"}</span>
                  </div>
                  <div className="flex flex-col pt-3 border-t border-[rgb(var(--ml-border))]/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[rgb(var(--ml-text-muted))] mb-1 block">Lease Period</span>
                        <span className="text-[rgb(var(--ml-text-primary))] font-semibold text-sm">
                          {lease_start && lease_end ? `${new Date(lease_start).toLocaleDateString()} to ${new Date(lease_end).toLocaleDateString()}` : "Not Set"}
                        </span>
                      </div>
                      <button 
                        onClick={() => setIsEditLeaseOpen(true)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/15 transition-all cursor-pointer"
                      >
                        {lease_start || lease_end ? "Edit" : "Set Lease"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center rounded-2xl bg-slate-500/5 border border-dashed border-[rgb(var(--ml-border))]">
                  <div className="w-12 h-12 rounded-full bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))]/50 flex items-center justify-center mb-4 shadow-sm">
                    <UserIcon className="w-5 h-5 text-[rgb(var(--ml-text-muted))]" />
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))]">This unit is currently vacant.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Maintenance & Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="lg:col-span-2 space-y-12"
        >
          {/* Maintenance Section */}
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-[rgb(var(--ml-text-primary))]">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl shadow-inner border border-orange-500/10">
                  <Wrench className="w-5 h-5" />
                </div>
                Maintenance Requests
              </h2>
              <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold text-sm">{maintenanceRequests.length}</Badge>
            </div>

            <div className="space-y-4">
              {maintenanceRequests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center rounded-3xl bg-[rgb(var(--ml-bg-secondary))] border border-dashed border-[rgb(var(--ml-border))]/60">
                  <div className="w-14 h-14 rounded-full bg-[rgb(var(--ml-bg-tertiary))] flex items-center justify-center mb-4 shadow-inner">
                    <Wrench className="w-6 h-6 text-[rgb(var(--ml-text-muted))]" />
                  </div>
                  <p className="text-base font-semibold text-[rgb(var(--ml-text-primary))] mb-1">No Active Requests</p>
                  <p className="text-sm text-[rgb(var(--ml-text-secondary))]">This unit is well-maintained with no recorded issues.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenanceRequests.map((req, idx) => (
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
                </div>
              )}
            </div>
          </section>

          {/* Documents Section */}
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-[rgb(var(--ml-text-primary))]">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl shadow-inner border border-blue-500/10">
                  <FileText className="w-5 h-5" />
                </div>
                Documents
              </h2>
              <Badge variant="secondary" className="rounded-full px-3 py-1 font-semibold text-sm">{documents.length}</Badge>
            </div>

            <div>
              {documents.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center rounded-3xl bg-[rgb(var(--ml-bg-secondary))] border border-dashed border-[rgb(var(--ml-border))]/60">
                  <div className="w-14 h-14 rounded-full bg-[rgb(var(--ml-bg-tertiary))] flex items-center justify-center mb-4 shadow-inner">
                    <FileText className="w-6 h-6 text-[rgb(var(--ml-text-muted))]" />
                  </div>
                  <p className="text-base font-semibold text-[rgb(var(--ml-text-primary))] mb-1">No Documents Found</p>
                  <p className="text-sm text-[rgb(var(--ml-text-secondary))]">Upload leases or important files for this unit.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="p-5 rounded-2xl border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] flex items-start gap-4 transition-all duration-300 hover:border-[rgb(var(--ml-accent))]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] group"
                    >
                      <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[rgb(var(--ml-text-primary))] truncate mb-1">
                          {doc.title}
                        </p>
                        <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))] mb-3">
                          Added {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[rgb(var(--ml-accent))] hover:text-opacity-80 transition-opacity"
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

      {/* Custom Edit Lease Modal */}
      <AnimatePresence>
        {isEditLeaseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditLeaseOpen(false)}
              className="absolute inset-0 bg-black/60"
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/50 rounded-3xl w-full max-w-md p-6 shadow-2xl relative z-10"
            >
              <h3 className="text-xl font-bold text-[rgb(var(--ml-text-primary))] mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[rgb(var(--ml-accent))]" /> Set Lease Dates
              </h3>
              <p className="text-sm text-[rgb(var(--ml-text-secondary))] mb-6">
                Specify the start and end dates for Unit {unit_label}&apos;s lease contract.
              </p>

              <form onSubmit={handleUpdateLease} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-widest block mb-2">
                    Lease Start Date
                  </label>
                  <input
                    type="date"
                    value={editLeaseStart}
                    onChange={(e) => setEditLeaseStart(e.target.value)}
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/50 border border-[rgb(var(--ml-border))]/40 hover:bg-[rgb(var(--ml-bg-primary))]/70 focus:border-[rgb(var(--ml-accent))] focus:outline-none transition-all px-4 h-11 rounded-xl text-sm text-[rgb(var(--ml-text-primary))]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-widest block mb-2">
                    Lease End Date
                  </label>
                  <input
                    type="date"
                    value={editLeaseEnd}
                    onChange={(e) => setEditLeaseEnd(e.target.value)}
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/50 border border-[rgb(var(--ml-border))]/40 hover:bg-[rgb(var(--ml-bg-primary))]/70 focus:border-[rgb(var(--ml-accent))] focus:outline-none transition-all px-4 h-11 rounded-xl text-sm text-[rgb(var(--ml-text-primary))]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditLeaseOpen(false)}
                    className="flex-1 h-11 rounded-xl border border-[rgb(var(--ml-border))] hover:bg-[rgb(var(--ml-bg-tertiary))]/40 text-sm font-semibold transition-colors cursor-pointer text-[rgb(var(--ml-text-primary))]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingLease}
                    className="flex-1 h-11 rounded-xl bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/90 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-[rgb(var(--ml-accent))]/10 hover:shadow-[rgb(var(--ml-accent))]/25 cursor-pointer"
                  >
                    {isUpdatingLease ? "Saving..." : "Save Dates"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Unit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-xl bg-[rgb(var(--ml-bg-secondary))] rounded-2xl animate-fade-in">
          <form onSubmit={handleUpdateUnit}>
            <div className="bg-[rgba(var(--ml-accent),0.03)] dark:bg-[rgba(var(--ml-accent),0.05)] px-6 pt-8 pb-6 flex flex-col items-center border-b border-[rgb(var(--ml-border))]/15">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(var(--ml-accent),0.12)] dark:bg-[rgba(var(--ml-accent),0.15)] mb-4 ring-8 ring-[rgba(var(--ml-accent),0.03)] dark:ring-[rgba(var(--ml-accent),0.05)]">
                <Pencil className="h-6 w-6 text-[rgb(var(--ml-accent))]" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-extrabold text-[rgb(var(--ml-text-primary))] tracking-tight">Edit Unit</DialogTitle>
                <DialogDescription className="text-center mt-2 text-pretty text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-[320px] mx-auto">
                  Update the unit label or monthly rent due date.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">Unit Label</label>
                <input 
                  required 
                  value={editLabel} 
                  onChange={e => setEditLabel(e.target.value)} 
                  placeholder="e.g. Apt 101, Basement, etc." 
                  className="w-full bg-[rgb(var(--ml-bg-secondary))]/55 border border-[rgb(var(--ml-border))]/30 rounded-xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/40 text-[rgb(var(--ml-text-primary))]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">Rent Due Day</label>
                <input 
                  required 
                  type="number"
                  min="1" max="31"
                  value={editRentDay} 
                  onChange={e => setEditRentDay(e.target.value)} 
                  className="w-full bg-[rgb(var(--ml-bg-secondary))]/55 border border-[rgb(var(--ml-border))]/30 rounded-xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all tabular-nums text-[rgb(var(--ml-text-primary))]"
                />
              </div>
            </div>
            
            <div className="bg-[rgb(var(--ml-bg-tertiary))]/50 px-6 py-4 flex gap-3 justify-end items-center border-t border-[rgb(var(--ml-border))]/15">
              <button 
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
                className="px-5 py-2.5 text-xs font-bold border border-[rgb(var(--ml-border))]/30 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingUnit}
                className="px-5 py-2.5 text-xs font-bold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent-dark))] rounded-xl transition-all w-full sm:w-auto shadow-sm shadow-[rgba(var(--ml-accent),0.15)] active:scale-[0.98] cursor-pointer hover-lift"
              >
                {isUpdatingUnit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-xl bg-[rgb(var(--ml-bg-secondary))] rounded-2xl animate-fade-in">
          <div className="bg-red-50 dark:bg-red-950/40 px-6 pt-8 pb-6 flex flex-col items-center border-b border-[rgb(var(--ml-border))]/30">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4 ring-8 ring-red-50 dark:ring-red-950">
              <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-extrabold text-[rgb(var(--ml-text-primary))] tracking-tight">Delete Unit</DialogTitle>
              <DialogDescription className="text-center mt-3 text-pretty text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-[320px] mx-auto">
                Are you sure you want to delete <span className="font-bold text-[rgb(var(--ml-text-primary))]">Unit {unit_label}</span>? All lease history, invitations, and related documents will be permanently removed. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="bg-[rgb(var(--ml-bg-secondary))] px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end items-center">
            <button 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-5 py-2.5 text-xs font-bold border border-[rgb(var(--ml-border))]/30 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
            >
              Cancel
            </button>
            <button 
              disabled={isDeletingUnit}
              onClick={handleDeleteUnit}
              className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto shadow-sm shadow-red-600/20 active:scale-[0.98]"
            >
              {isDeletingUnit ? "Deleting..." : "Yes, delete unit"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
