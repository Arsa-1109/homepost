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
} from "lucide-react";
import { MaintenanceRequest, RequestCard } from "@/components/landlord/requests/RequestCard";
import { motion } from "framer-motion";
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
        fetchAPI<MaintenanceRequest[]>(`/api/v1/landlord/maintenance?unit_id=${unitId}`, { signal }, token),
        fetchAPI<Document[]>(`/api/v1/landlord/units/${unitId}/documents`, { signal }, token),
      ]);
      return {
        unitData: unitRes,
        maintenanceRequests: Array.isArray(maintRes) ? maintRes : [],
        documents: Array.isArray(docsRes) ? docsRes : [],
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
      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        <div className="space-y-4">
          <div className="skeleton h-5 w-32 rounded-full" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="skeleton h-9 w-44 rounded-xl" />
            <div className="skeleton h-9 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !unitData) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6">
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
          <Link
            href="/landlord/units"
            className="hover:text-[rgb(var(--ml-text-primary))] transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Units
          </Link>
          <span>/</span>
          <span className="text-[rgb(var(--ml-text-primary))] font-bold">
            Unit {unit.unit_label}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
              Unit {unit.unit_label}
            </h1>
            <Badge
              variant="outline"
              className={`capitalize text-xs font-extrabold px-3 py-1 rounded-full border ${
                unit.is_occupied
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}
            >
              {unit.is_occupied ? "Occupied" : "Vacant"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-10 px-4 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-xs font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Unit</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-10 px-4 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-500 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Unit</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
          <Building className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
          {property_name}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tenant & Lease Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl p-6 border border-border/60 bg-[rgb(var(--ml-bg-secondary))] shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/40">
              <div className="p-3 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                  Tenant Details
                </h3>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  {unit.is_occupied ? "Active Resident" : "No tenant assigned"}
                </p>
              </div>
            </div>

            {unit.is_occupied ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                    Name
                  </span>
                  <p className="font-bold text-sm text-[rgb(var(--ml-text-primary))]">
                    {tenant_name || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
                    Email
                  </span>
                  <p className="font-semibold text-[rgb(var(--ml-text-primary))]">
                    {tenant_email || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                Generate an invite link from the Units page to onboard a tenant.
              </p>
            )}

            {/* Lease Information */}
            <div className="pt-4 border-t border-border/40 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                  Lease Terms
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditLeaseOpen(true)}
                  className="text-[11px] font-bold text-[rgb(var(--ml-accent))] hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--ml-text-secondary))]">Rent Due Day:</span>
                  <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                    Day {unit.rent_due_day} of month
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--ml-text-secondary))]">Lease Start:</span>
                  <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                    {lease_start ? new Date(lease_start).toLocaleDateString() : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[rgb(var(--ml-text-secondary))]">Lease End:</span>
                  <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                    {lease_end ? new Date(lease_end).toLocaleDateString() : "Not set"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Maintenance Requests & Documents */}
        <div className="lg:col-span-2 space-y-8">
          {/* Maintenance Requests Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                Maintenance Requests ({maintenanceRequests.length})
              </h2>
            </div>

            {maintenanceRequests.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] text-xs text-[rgb(var(--ml-text-secondary))]">
                No maintenance requests reported for this unit.
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
                      className="p-2 rounded-xl border border-border/60 text-xs font-semibold disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium">
                      Page {maintenancePage} of {totalMaintenancePages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMaintenancePage((p) => Math.min(totalMaintenancePages, p + 1))}
                      disabled={maintenancePage === totalMaintenancePages}
                      className="p-2 rounded-xl border border-border/60 text-xs font-semibold disabled:opacity-40"
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
            <h2 className="text-base font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
              Unit Documents ({documents.length})
            </h2>

            {documents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] text-xs text-[rgb(var(--ml-text-secondary))]">
                No documents uploaded for this unit yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                      <p className="font-bold text-xs truncate text-[rgb(var(--ml-text-primary))]">
                        {doc.title}
                      </p>
                    </div>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[rgb(var(--ml-accent))] hover:underline"
                      >
                        <DownloadIcon className="w-3 h-3" /> Download
                      </a>
                    )}
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
