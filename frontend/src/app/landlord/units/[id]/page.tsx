"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  User as UserIcon,
  Calendar,
  Wrench,
  FileText,
  DownloadIcon,
  ChevronLeft,
  ChevronRight,
  Building,
  Pencil,
  Trash2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { MaintenanceRequest, RequestCard } from "@/components/landlord/requests/RequestCard";
import { motion } from "motion/react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  EditLeaseModal,
  EditUnitModal,
  DeleteUnitModal,
} from "@/components/landlord/units/UnitModals";

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

interface UnitPageData {
  unitData: UnitDetail;
  maintenanceRequests: MaintenanceRequest[];
  documents: Document[];
}

export default function UnitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;
  const { isLoaded, getToken } = useAuth();

  const [isEditLeaseOpen, setIsEditLeaseOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [maintenancePage, setMaintenancePage] = useState(1);
  const MAINTENANCE_ITEMS_PER_PAGE = 3;

  const fetchUnitPageData = useCallback(
    async (signal: AbortSignal): Promise<UnitPageData> => {
      const token = await getToken();
      const [unitRes, maintRes, docsRes] = await Promise.all([
        fetchAPI<UnitDetail>(`/api/v1/landlord/units/${unitId}`, { signal }, token),
        fetchAPI<{ items: MaintenanceRequest[] } | MaintenanceRequest[]>(
          `/api/v1/landlord/maintenance?unit_id=${unitId}`,
          { signal },
          token
        ),
        fetchAPI<{ items: Document[] } | Document[]>(
          `/api/v1/landlord/units/${unitId}/documents`,
          { signal },
          token
        ),
      ]);
      const maintList = Array.isArray(maintRes)
        ? maintRes
        : (maintRes as { items: MaintenanceRequest[] })?.items || [];
      const docsList = Array.isArray(docsRes)
        ? docsRes
        : (docsRes as { items: Document[] })?.items || [];
      return {
        unitData: unitRes,
        maintenanceRequests: maintList,
        documents: docsList,
      };
    },
    [unitId, getToken]
  );

  const { data, isLoading: loading, error, refetch } = useApiQuery<UnitPageData>(
    isLoaded && unitId ? fetchUnitPageData : null,
    [isLoaded, unitId, fetchUnitPageData]
  );

  const unitData = data?.unitData ?? null;
  const maintenanceRequests = useMemo(() => data?.maintenanceRequests ?? [], [data]);
  const documents = useMemo(() => data?.documents ?? [], [data]);

  const totalMaintenancePages = Math.ceil(
    maintenanceRequests.length / MAINTENANCE_ITEMS_PER_PAGE
  );
  const currentMaintenanceRequests = maintenanceRequests.slice(
    (maintenancePage - 1) * MAINTENANCE_ITEMS_PER_PAGE,
    maintenancePage * MAINTENANCE_ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
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

              <div className="rounded-2xl p-4 border border-border/40 bg-[rgb(var(--ml-bg-primary))]/50 space-y-3">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-5 w-36 rounded-lg" />
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
      <div className="max-w-7xl mx-auto py-12 px-6">
        <ErrorBanner message={error || "Unit not found"} onRetry={refetch} />
        <Link
          href="/landlord/units"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[rgb(var(--ml-text-primary))]"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Units
        </Link>
      </div>
    );
  }

  const { unit, property_name, tenant_name, tenant_email, lease_start, lease_end } =
    unitData;

  const isLeaseExpired = lease_end
    ? new Date(new Date(lease_end).setHours(23, 59, 59, 999)) < new Date()
    : false;

  const unitLabel = unit.unit_label.trim();
  const displayUnitTitle = unitLabel.toLowerCase().startsWith("unit")
    ? unitLabel
    : `Unit ${unitLabel}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Hero Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80 shadow-xs mb-1">
              <Building className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" /> {property_name}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
              {displayUnitTitle}
              {unit.is_occupied ? (
                <Badge
                  variant="outline"
                  className="uppercase tracking-wider text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Occupied
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="uppercase tracking-wider text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Vacant
                </Badge>
              )}
            </h1>
            <Link
              href="/landlord/units"
              className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors inline-flex items-center gap-1 pt-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Units List
            </Link>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditDialogOpen(true)}
              className="px-3.5 py-2 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] text-xs font-bold rounded-xl hover:bg-[rgb(var(--ml-bg-tertiary))] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Unit
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="px-3.5 py-2 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/10 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Unit
            </button>
            <Link
              href="/landlord/requests"
              className="px-3.5 py-2 bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]"
            >
              View All Maintenance
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* LEFT COLUMN: Unit & Tenant Profile Floating Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="lg:col-span-1"
        >
          <div className="rounded-3xl p-6 sm:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-border/60 shadow-sm flex flex-col relative overflow-hidden group space-y-6">
            {/* Rent Details Section */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                  Rent Details
                </h2>
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                  Schedule & collection info
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              <div className="p-4 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[rgb(var(--ml-accent))]" /> Rent Due Date
                  </span>
                  <p className="text-sm font-extrabold text-[rgb(var(--ml-text-primary))] tabular-nums">
                    Day {unit.rent_due_day} of every month
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[rgb(var(--ml-accent))]" /> Lease Period
                    </span>
                    <p className="text-sm font-extrabold text-[rgb(var(--ml-text-primary))] tabular-nums">
                      {lease_start && lease_end
                        ? `${new Date(lease_start).toLocaleDateString()} – ${new Date(lease_end).toLocaleDateString()}`
                        : "Not Set"}
                    </p>
                  </div>
                  <button
                    type="button"
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

            {/* Tenant Details Section */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                  Tenant Information
                </h2>
                <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                  Active lease holder details
                </p>
              </div>
            </div>

            <div className="relative z-10">
              {unit.is_occupied ? (
                <div className="p-5 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[rgb(var(--ml-text-secondary))] mb-1">
                      Full Name
                    </span>
                    <span className="text-base font-extrabold text-[rgb(var(--ml-text-primary))]">
                      {tenant_name || "N/A"}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border/20 flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[rgb(var(--ml-text-secondary))] mb-1">
                      Email Address
                    </span>
                    <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] break-all">
                      {tenant_email || "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 text-center space-y-3">
                  <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    No tenant currently assigned to this unit.
                  </p>
                  <Link
                    href={`/landlord/units?property_id=${unit.property_id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all shadow-sm"
                  >
                    Generate Invite Link
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Maintenance Requests & Documents Grid */}
        <div className="lg:col-span-2 space-y-8">
          {/* Maintenance Requests Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                Maintenance Requests
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border tabular-nums">
                  {maintenanceRequests.length}
                </span>
              </h2>
            </div>

            {maintenanceRequests.length === 0 ? (
              <div className="p-8 sm:p-10 text-center border border-dashed border-border/70 rounded-3xl bg-[rgb(var(--ml-bg-secondary))]/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                  <Wrench className="size-5" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="font-extrabold text-sm text-[rgb(var(--ml-text-primary))]">
                    All Clear — No Open Requests
                  </h3>
                  <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    No active maintenance issues or repair tickets have been submitted for this unit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentMaintenanceRequests.map((req) => (
                  <RequestCard key={req.id} req={req} onUpdate={refetch} />
                ))}

                {totalMaintenancePages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setMaintenancePage((p) => Math.max(1, p - 1))}
                      disabled={maintenancePage === 1}
                      className="p-2 rounded-xl border border-border/60 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium tabular-nums">
                      Page {maintenancePage} of {totalMaintenancePages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMaintenancePage((p) => Math.min(totalMaintenancePages, p + 1))
                      }
                      disabled={maintenancePage === totalMaintenancePages}
                      className="p-2 rounded-xl border border-border/60 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Unit Documents Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                Unit Documents
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border tabular-nums">
                  {documents.length}
                </span>
              </h2>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 sm:p-10 text-center border border-dashed border-border/70 rounded-3xl bg-[rgb(var(--ml-bg-secondary))]/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                <div className="size-12 rounded-2xl bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] flex items-center justify-center border border-[rgb(var(--ml-accent))]/20 shadow-xs">
                  <FileText className="size-5" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="font-extrabold text-sm text-[rgb(var(--ml-text-primary))]">
                    No Documents Uploaded
                  </h3>
                  <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                    Lease agreements, property notices, and compliance records for this unit will appear here.
                  </p>
                </div>
                <Link
                  href={`/landlord/documents`}
                  className="mt-1 px-4 py-2 bg-[rgb(var(--ml-bg-primary))] border border-border/70 hover:border-[rgb(var(--ml-accent))] text-[rgb(var(--ml-text-primary))] text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer hover:bg-[rgb(var(--ml-bg-tertiary))]"
                >
                  <FileText className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                  <span>Upload Document</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] flex items-start gap-4 shadow-sm hover:border-[rgb(var(--ml-text-primary))]/20 transition-all"
                  >
                    <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p
                        className="font-bold text-xs sm:text-sm truncate text-[rgb(var(--ml-text-primary))]"
                        title={doc.title}
                      >
                        {doc.title}
                      </p>
                      <p className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))] tabular-nums">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.file_url && (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline pt-1"
                        >
                          <DownloadIcon className="w-3.5 h-3.5" /> Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modals */}
      <EditLeaseModal
        open={isEditLeaseOpen}
        onOpenChange={setIsEditLeaseOpen}
        unitId={unitId}
        unitLabel={unit.unit_label}
        initialStart={lease_start || ""}
        initialEnd={lease_end || ""}
        onSuccess={refetch}
      />

      <EditUnitModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        unitId={unitId}
        initialLabel={unit.unit_label}
        initialRentDay={String(unit.rent_due_day)}
        onSuccess={refetch}
      />

      <DeleteUnitModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        unitId={unitId}
        unitLabel={unit.unit_label}
        onSuccess={() => router.push("/landlord/units")}
      />
    </div>
  );
}
