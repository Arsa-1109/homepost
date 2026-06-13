"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchAPI, api } from "@/lib/api";
import { Building, Check, X, ShieldAlert, ChevronLeft, Users, InfoIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

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
  const [propertyId, setPropertyId] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadUnits() {
      if (!propertyId) {
        setUnits([]);
        setUnitId("");
        return;
      }
      setLoadingUnits(true);
      setUnitId("");
      try {
        const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${propertyId}/units`);
        setUnits(data);
      } catch (err) {
        console.error("Failed to load units:", err);
        toast.error("Failed to load units for selected property.");
      } finally {
        setLoadingUnits(false);
      }
    }
    loadUnits();
  }, [propertyId]);

  const handleApprove = async () => {
    if (!unitId) {
      toast.error("Please select a unit to assign to this tenant.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/landlord/approve-tenant", {
        user_id: tenant.id,
        unit_id: unitId
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

  const vacantUnits = units.filter(u => !u.is_occupied);

  return (
    <div className="rounded-3xl backdrop-blur-xl bg-[rgb(var(--ml-bg-secondary))]/60 border border-[rgb(var(--ml-border))]/50 shadow-[0_15px_35px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 transition-all hover:border-[rgb(var(--ml-accent))]/30 group">
      
      {/* Left: Tenant Profile Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/10 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300">
          <Users className="w-5.5 h-5.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold truncate text-[rgb(var(--ml-text-primary))]">{tenant.full_name || "New Tenant"}</h3>
          <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] truncate mt-0.5">{tenant.email}</p>
        </div>
      </div>

      {/* Middle: Selection of Property & Unit */}
      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0 z-20">
        <div className="w-full sm:w-48">
          <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-widest">Property</span>
          <Select value={propertyId} onValueChange={(val) => setPropertyId(val || "")}>
            <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/40 border-[rgb(var(--ml-border))]/40 hover:bg-[rgb(var(--ml-bg-primary))]/70 transition-colors h-10 rounded-xl">
              <span className="flex flex-1 text-left line-clamp-1 truncate text-sm">
                {propertyId ? properties.find(p => p.id === propertyId)?.name : "Select Property"}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-[rgb(var(--ml-border))] rounded-xl">
              {properties.map(p => (
                <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))] mb-1.5 block uppercase tracking-widest">Assign Unit</span>
          <Select 
            value={unitId} 
            onValueChange={(val) => setUnitId(val || "")} 
            disabled={!propertyId || loadingUnits}
          >
            <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-primary))]/40 border-[rgb(var(--ml-border))]/40 hover:bg-[rgb(var(--ml-bg-primary))]/70 transition-colors h-10 rounded-xl disabled:opacity-40">
              <span className="flex flex-1 text-left line-clamp-1 truncate text-sm">
                {loadingUnits ? "Loading..." : unitId ? (units.find(u => u.id === unitId)?.unit_label ? `Unit ${units.find(u => u.id === unitId)?.unit_label}` : "Select Unit") : "Select Unit"}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-[rgb(var(--ml-border))] rounded-xl">
              {vacantUnits.map(u => (
                <SelectItem key={u.id} value={u.id} className="rounded-lg">Unit {u.unit_label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {propertyId && !loadingUnits && vacantUnits.length === 0 && (
            <p className="text-[10px] text-amber-500 font-semibold mt-1 px-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> No vacant units.
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 md:pt-4">
        <button
          onClick={handleDeny}
          disabled={isSubmitting}
          className="flex-1 md:flex-initial h-10 px-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
        >
          <X className="w-4 h-4" /> Deny
        </button>

        <button
          onClick={handleApprove}
          disabled={isSubmitting || !unitId}
          className="flex-1 md:flex-initial h-10 px-5 rounded-xl bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent))]/90 text-white text-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[rgb(var(--ml-accent))]/10 hover:shadow-[rgb(var(--ml-accent))]/20 active:scale-[0.98] disabled:opacity-40 disabled:scale-100 disabled:shadow-none cursor-pointer"
        >
          <Check className="w-4 h-4" /> Approve
        </button>
      </div>

    </div>
  );
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [pendingRes, propsRes] = await Promise.all([
        fetchAPI<TenantRequest[]>("/api/v1/landlord/pending-tenants"),
        fetchAPI<Property[]>("/api/v1/landlord/properties")
      ]);
      setRequests(pendingRes);
      setProperties(propsRes);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load access requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRemove = (tenantId: string) => {
    setRequests(prev => prev.filter(t => t.id !== tenantId));
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-screen relative">
      {/* Background orbs */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[rgb(var(--ml-accent))]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-8 flex flex-col gap-2 relative z-10">
        <Link href="/landlord/dashboard" className="text-sm font-medium text-[rgb(var(--ml-text-muted))] hover:text-[rgb(var(--ml-accent))] transition-colors flex items-center gap-1 w-fit mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-2xl shadow-inner border border-blue-500/10">
            <Users className="w-6 h-6" />
          </div>
          Access Requests
        </h1>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] pl-1">
          Review pending requests from tenants seeking access to your properties.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="space-y-6"
          >
            {[1, 2].map(i => (
              <div key={i} className="p-6 rounded-3xl border border-[rgb(var(--ml-border))]/50 bg-[rgb(var(--ml-bg-secondary))]/40 flex flex-col md:flex-row gap-6 animate-pulse">
                <div className="flex-1 space-y-4">
                  <div className="h-6 w-1/3 bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                  <div className="h-4 w-1/2 bg-[rgb(var(--ml-border))]/40 rounded-md"></div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-48 bg-[rgb(var(--ml-border))]/40 rounded-xl"></div>
                  <div className="h-10 w-48 bg-[rgb(var(--ml-border))]/40 rounded-xl"></div>
                  <div className="h-10 w-32 bg-[rgb(var(--ml-border))]/40 rounded-xl"></div>
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
              description="All tenant requests have been processed."
            />
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="space-y-6"
          >
            {requests.map(tenant => (
              <motion.div 
                key={tenant.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
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
    </div>
  );
}
