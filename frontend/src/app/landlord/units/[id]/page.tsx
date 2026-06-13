"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, User as UserIcon, Calendar, Wrench, FileText, DownloadIcon, ChevronLeft, Building } from "lucide-react";
import { MaintenanceRequest, RequestCard } from "@/app/landlord/requests/page";
import { motion } from "framer-motion";
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
            <div className="rounded-3xl p-6 md:p-8 border border-[rgb(var(--ml-border))]/40 bg-[rgb(var(--ml-bg-secondary))]/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.06)] space-y-6">

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
                    className="p-5 rounded-2xl border border-[rgb(var(--ml-border))]/40 bg-[rgb(var(--ml-bg-secondary))]/60 backdrop-blur-sm space-y-3"
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
                    className="p-5 rounded-2xl border border-[rgb(var(--ml-border))]/40 bg-[rgb(var(--ml-bg-secondary))]/60 backdrop-blur-sm flex items-start gap-4"
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

  const { unit, property_name, tenant_name, tenant_email } = unitData;
  const { unit_label, is_occupied, rent_due_day } = unit;

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
          <Link href="/landlord/requests" className="px-4 py-2 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] text-[rgb(var(--ml-text-primary))] text-sm font-medium rounded-xl hover:bg-[rgb(var(--ml-bg-tertiary))] transition-colors shadow-sm">
            View All Maintenance
          </Link>
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
          <div className="rounded-3xl p-6 md:p-8 backdrop-blur-xl bg-[rgb(var(--ml-bg-secondary))]/60 border border-[rgb(var(--ml-border))]/50 shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col relative overflow-hidden group">
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
                <div className="py-12 flex flex-col items-center justify-center text-center rounded-3xl bg-[rgb(var(--ml-bg-secondary))]/30 border border-dashed border-[rgb(var(--ml-border))]/60 backdrop-blur-sm">
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
                <div className="py-12 flex flex-col items-center justify-center text-center rounded-3xl bg-[rgb(var(--ml-bg-secondary))]/30 border border-dashed border-[rgb(var(--ml-border))]/60 backdrop-blur-sm">
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
                      className="p-5 rounded-2xl border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))]/60 backdrop-blur-sm flex items-start gap-4 transition-all duration-300 hover:border-[rgb(var(--ml-accent))]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] group"
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
    </div>
  );
}
