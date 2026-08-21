"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI, api } from "@/lib/api";
import { 
  Building2, 
  Check, 
  X, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Mail, 
  Home, 
  Clock,
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@clerk/nextjs";

interface TenantRequest {
  id: string;
  full_name: string;
  email: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  property_id: string;
  unit_label: string;
  is_occupied: boolean;
  has_pending: boolean;
}

function AccessRequestCard({ 
  tenant, 
  properties, 
  onApprove, 
  onDeny 
}: { 
  tenant: TenantRequest; 
  properties: Property[]; 
  onApprove: (tenantId: string) => void; 
  onDeny: (tenantId: string) => void; 
}) {
  const { isLoaded, getToken } = useAuth();
  const [propertyId, setPropertyId] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseTenureType, setLeaseTenureType] = useState("12");
  const [customLeaseTenure, setCustomLeaseTenure] = useState("12");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !propertyId) {
      setUnits([]);
      setUnitId("");
      return;
    }
    async function loadUnits() {
      setLoadingUnits(true);
      setUnitId("");
      try {
        const token = await getToken();
        const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${propertyId}/units`, {}, token);
        setUnits(data || []);
      } catch (err) {
        console.error("Failed to load units:", err);
        toast.error("Failed to load units for selected property.");
      } finally {
        setLoadingUnits(false);
      }
    }
    loadUnits();
  }, [propertyId, isLoaded, getToken]);

  const handleApprove = async () => {
    if (!unitId) {
      toast.error("Please select a unit to assign to this tenant.");
      return;
    }
    setIsSubmitting(true);
    try {
      let lease_start: string | null = null;
      let lease_end: string | null = null;

      if (leaseStart) {
        lease_start = leaseStart;
        const finalTenureMonths =
          leaseTenureType === "custom"
            ? parseInt(customLeaseTenure)
            : parseInt(leaseTenureType);

        if (!isNaN(finalTenureMonths) && finalTenureMonths >= 1) {
          const startDate = new Date(leaseStart);
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + finalTenureMonths);
            lease_end = endDate.toISOString().split("T")[0];
          }
        }
      }

      await api.post("/api/v1/landlord/approve-tenant", {
        user_id: tenant.id,
        unit_id: unitId,
        lease_start,
        lease_end,
      });
      toast.success(`${tenant.full_name || tenant.email} approved successfully!`);
      onApprove(tenant.id);
    } catch (err) {
      console.error("Failed to approve tenant:", err);
      toast.error("Failed to approve tenant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/landlord/deny-tenant", {
        user_id: tenant.id
      });
      toast.success(`Request from ${tenant.full_name || tenant.email} denied.`);
      onDeny(tenant.id);
    } catch (err) {
      console.error("Failed to deny tenant:", err);
      toast.error("Failed to deny request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vacantUnits = useMemo(() => units.filter(u => !u.is_occupied), [units]);
  const hasNoVacantUnits = Boolean(propertyId && !loadingUnits && vacantUnits.length === 0);

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "TR";
  };

  return (
    <div className="p-6 border border-border/60 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between group/card shadow-sm relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Left: Applicant Information */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="p-3.5 bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] rounded-2xl border border-[rgb(var(--ml-accent))]/20 shrink-0 shadow-inner group-hover/card:scale-105 transition-transform duration-300 flex items-center justify-center font-black text-sm size-12">
            {getInitials(tenant.full_name, tenant.email)}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-base sm:text-lg tracking-tight text-[rgb(var(--ml-text-primary))] break-words leading-tight">
                {tenant.full_name || "New Applicant"}
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </Badge>
            </div>
            <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5 break-all">
              <Mail className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))] shrink-0" />
              <span>{tenant.email}</span>
            </p>
          </div>
        </div>

        {/* Middle: Property & Unit Selectors + Lease Terms */}
        <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[440px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Property Selector */}
            <div>
              <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">
                Property
              </span>
              <Select value={propertyId} onValueChange={(val) => setPropertyId(val || "")}>
                <SelectTrigger className="w-full h-10 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl px-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] hover:border-[rgb(var(--ml-text-primary))]/30 transition-all">
                  <span className="truncate text-left">
                    {propertyId 
                      ? properties.find(p => p.id === propertyId)?.name || "Select Property" 
                      : "Select Property"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border rounded-xl">
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id} className="rounded-lg text-xs font-medium">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Selector */}
            <div>
              <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">
                Assign Unit
              </span>
              <Select 
                value={unitId} 
                onValueChange={(val) => setUnitId(val || "")} 
                disabled={!propertyId || loadingUnits}
              >
                <SelectTrigger className="w-full h-10 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl px-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] hover:border-[rgb(var(--ml-text-primary))]/30 transition-all disabled:opacity-40">
                  <span className="truncate text-left">
                    {!propertyId 
                      ? "Select property first" 
                      : loadingUnits 
                      ? "Loading units..." 
                      : unitId 
                      ? `Unit ${units.find(u => u.id === unitId)?.unit_label || unitId}` 
                      : vacantUnits.length > 0 
                      ? `Choose Unit (${vacantUnits.length} vacant)` 
                      : "No vacant units"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border rounded-xl">
                  {vacantUnits.map(u => (
                    <SelectItem key={u.id} value={u.id} className="rounded-lg text-xs font-medium">
                      Unit {u.unit_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasNoVacantUnits && (
                <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-1">
                  <ShieldAlert className="w-3 h-3 shrink-0" /> No vacant units in this building.
                </p>
              )}
            </div>
          </div>

          {/* Lease Start Date & Tenure Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[rgb(var(--ml-accent))]" /> Lease Start (Opt)
              </span>
              <DatePicker
                value={leaseStart}
                onChange={(dateStr) => setLeaseStart(dateStr)}
                placeholder="Start Date"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-wider">
                Lease Tenure
              </span>
              <Select
                value={leaseTenureType}
                onValueChange={(val) => setLeaseTenureType(val || "12")}
              >
                <SelectTrigger className="w-full h-10 bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl px-3 text-xs font-medium text-[rgb(var(--ml-text-primary))]">
                  <span className="truncate">
                    {leaseTenureType === "3" ? "3 Months" :
                     leaseTenureType === "6" ? "6 Months" :
                     leaseTenureType === "12" ? "12 Months (1 Yr)" :
                     leaseTenureType === "24" ? "24 Months (2 Yrs)" : "Custom..."}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border rounded-xl">
                  <SelectItem value="3" className="text-xs">3 Months</SelectItem>
                  <SelectItem value="6" className="text-xs">6 Months</SelectItem>
                  <SelectItem value="12" className="text-xs">12 Months (1 Year)</SelectItem>
                  <SelectItem value="24" className="text-xs">24 Months (2 Years)</SelectItem>
                  <SelectItem value="custom" className="text-xs">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {leaseTenureType === "custom" && (
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customLeaseTenure}
                    onChange={(e) => setCustomLeaseTenure(e.target.value)}
                    placeholder="Months"
                    className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-1.5 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none"
                  />
                  <span className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))] shrink-0">Mo</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 pt-2 lg:pt-5 shrink-0">
          <Button
            variant="outline"
            onClick={handleDeny}
            isLoading={isSubmitting}
            className="flex-1 sm:flex-initial h-10 px-4 rounded-xl border border-border/60 bg-transparent text-[rgb(var(--ml-text-primary))] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <X className="w-4 h-4" /> Deny
          </Button>

          <Button
            variant="default"
            onClick={handleApprove}
            isLoading={isSubmitting}
            disabled={!unitId}
            className="flex-1 sm:flex-initial h-10 px-5 rounded-xl text-xs font-extrabold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] dark:text-black hover:bg-[rgb(var(--ml-accent))] hover:brightness-105 shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)] disabled:opacity-40 transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <Check className="w-4 h-4" /> Approve
          </Button>
        </div>

      </div>
    </div>
  );
}

export default function AccessRequestsPage() {
  const { isLoaded, getToken } = useAuth();
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  async function loadData() {
    if (!isLoaded) return;
    try {
      const token = await getToken();
      const [pendingRes, propsRes] = await Promise.all([
        fetchAPI<TenantRequest[]>("/api/v1/landlord/pending-tenants", {}, token),
        fetchAPI<Property[]>("/api/v1/landlord/properties", {}, token)
      ]);
      setRequests(pendingRes || []);
      setProperties(propsRes || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load access requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
  }, [isLoaded, getToken]);

  const handleRemove = (tenantId: string) => {
    setRequests(prev => prev.filter(t => t.id !== tenantId));
  };

  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return requests.slice(start, start + ITEMS_PER_PAGE);
  }, [requests, currentPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <Link 
          href="/landlord/dashboard" 
          className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors flex items-center gap-1 w-fit mb-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Access Requests
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">
          Review pending requests from tenants seeking access to your properties.
        </p>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="space-y-4"
          >
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="p-6 rounded-3xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] flex flex-col lg:flex-row justify-between gap-6 animate-pulse"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="size-12 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))]"></div>
                  <div className="space-y-2 flex-1 max-w-xs">
                    <div className="h-5 w-3/4 bg-[rgb(var(--ml-bg-tertiary))] rounded-md"></div>
                    <div className="h-3.5 w-1/2 bg-[rgb(var(--ml-bg-tertiary))] rounded-md"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 lg:max-w-[400px]">
                  <div className="h-10 bg-[rgb(var(--ml-bg-tertiary))] rounded-xl"></div>
                  <div className="h-10 bg-[rgb(var(--ml-bg-tertiary))] rounded-xl"></div>
                </div>
                <div className="flex gap-2.5 shrink-0 pt-5">
                  <div className="h-10 w-20 bg-[rgb(var(--ml-bg-tertiary))] rounded-xl"></div>
                  <div className="h-10 w-24 bg-[rgb(var(--ml-bg-tertiary))] rounded-xl"></div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : requests.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={Users}
              title="No Pending Requests"
              description="All tenant requests have been processed. New requests will appear here when tenants apply."
            />
          </motion.div>
        ) : (
          <motion.div 
            key={`page-${currentPage}`}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
            className="space-y-4"
          >
            {paginatedRequests.map(tenant => (
              <motion.div 
                key={tenant.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <AccessRequestCard 
                  tenant={tenant} 
                  properties={properties} 
                  onApprove={handleRemove} 
                  onDeny={handleRemove} 
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls Bar */}
      {!loading && requests.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40">
          <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
            Showing{" "}
            <span className="font-bold text-[rgb(var(--ml-text-primary))]">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>
            –
            <span className="font-bold text-[rgb(var(--ml-text-primary))]">
              {Math.min(currentPage * ITEMS_PER_PAGE, requests.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[rgb(var(--ml-text-primary))]">
              {requests.length}
            </span>{" "}
            requests
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center justify-center ${
                      currentPage === pageNum
                        ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-transparent shadow-sm"
                        : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:border-border hover:text-[rgb(var(--ml-text-primary))]"
                    }`}
                  >
                    {pageNum}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

