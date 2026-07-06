"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, DoorOpen, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Property = {
  id: string;
  name: string;
};

type Unit = {
  id: string;
  property_id: string;
  unit_label: string;
  rent_due_day: number;
  is_occupied: boolean;
  has_pending: boolean;
};

function UnitCard({ u, onRefresh }: { u: Unit; onRefresh: () => void }) {
  const [keepData, setKeepData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveTenant = async () => {
    setIsRemoving(true);
    try {
      await fetchAPI(`/api/v1/landlord/units/${u.id}/tenant`, { method: "DELETE" });
      toast.success("Tenant removed successfully.");
      setIsRemoveDialogOpen(false);
      onRefresh();
    } catch (err) {
      toast.error("Failed to remove tenant.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="p-5 border border-[rgb(var(--ml-border))]/50 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between hover-lift transition-all duration-300 group/card min-h-[190px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[rgb(var(--ml-accent))]/40">
      <div>
        <div className="flex justify-between items-start gap-2">
          <Link href={`/landlord/units/${u.id}`} className="font-extrabold text-lg tracking-tight text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] transition-colors truncate block max-w-[150px]">
            {u.unit_label}
          </Link>
          <Badge variant={u.is_occupied ? "success" : "outline"} className="capitalize tracking-wider text-[9px] font-extrabold px-2 py-0.5 shrink-0">
            {u.is_occupied ? "Occupied" : "Vacant"}
          </Badge>
        </div>
        <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-1 mb-4">Rent due on day {u.rent_due_day}</p>
      </div>
      
      <div className="mt-auto flex flex-col gap-2">
        <Link href={`/landlord/units/${u.id}`} className="text-xs text-center font-bold border border-[rgb(var(--ml-border))]/60 text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] px-3 py-2.5 rounded-xl transition-all w-full cursor-pointer hover-lift shadow-sm">
          View Details
        </Link>
        {u.is_occupied ? (
          <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
            <DialogTrigger className="text-xs text-center font-bold text-red-600 dark:text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-3 py-2.5 rounded-xl transition-all w-full cursor-pointer hover-lift">
              Remove Tenant
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-xl bg-[rgb(var(--ml-bg-secondary))] rounded-2xl">
              <div className="bg-red-50 dark:bg-red-950/40 px-6 pt-8 pb-6 flex flex-col items-center border-b border-[rgb(var(--ml-border))]/30">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4 ring-8 ring-red-50 dark:ring-red-950">
                  <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-extrabold text-[rgb(var(--ml-text-primary))] tracking-tight">Remove Tenant</DialogTitle>
                  <DialogDescription className="text-center mt-3 text-pretty text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-[320px] mx-auto">
                    Are you sure you want to remove the tenant from <span className="font-bold text-[rgb(var(--ml-text-primary))]">Unit {u.unit_label}</span>? This action is permanent and cannot be undone.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="bg-[rgb(var(--ml-bg-secondary))] px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end items-center">
                <button 
                  onClick={() => setIsRemoveDialogOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold border border-[rgb(var(--ml-border))]/30 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  disabled={isRemoving}
                  onClick={handleRemoveTenant}
                  className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto shadow-sm shadow-red-600/20 active:scale-[0.98]"
                >
                  {isRemoving ? "Removing..." : "Yes, remove tenant"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="text-xs text-center bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-3 py-2.5 rounded-xl hover:bg-[rgb(var(--ml-accent-dark))] transition-all w-full cursor-pointer hover-lift shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)]">
              Invite Tenant
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-0 shadow-xl bg-[rgb(var(--ml-bg-secondary))] rounded-2xl">
              <div className="bg-[rgba(var(--ml-accent),0.03)] dark:bg-[rgba(var(--ml-accent),0.05)] px-6 pt-8 pb-6 flex flex-col items-center border-b border-[rgb(var(--ml-border))]/15">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(var(--ml-accent),0.12)] dark:bg-[rgba(var(--ml-accent),0.15)] mb-4 ring-8 ring-[rgba(var(--ml-accent),0.03)] dark:ring-[rgba(var(--ml-accent),0.05)]">
                  <DoorOpen className="h-7 w-7 text-[rgb(var(--ml-accent))]" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-extrabold text-[rgb(var(--ml-text-primary))] tracking-tight">Invite Tenant</DialogTitle>
                  <DialogDescription className="text-center mt-2 text-pretty text-xs font-semibold text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-[320px] mx-auto">
                    Generate a unique, secure invite link for your new tenant moving into <span className="font-bold text-[rgb(var(--ml-text-primary))]">Unit {u.unit_label}</span>.
                  </DialogDescription>
                </DialogHeader>
              </div>
              
              <div className="bg-[rgb(var(--ml-bg-tertiary))]/50">
                <div className="px-6 py-5 border-b border-[rgb(var(--ml-border))]/15">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[rgb(var(--ml-border))]/25 bg-[rgb(var(--ml-bg-secondary))]/60 cursor-pointer hover:border-[rgb(var(--ml-accent))]/30 transition-all group">
                    <div className="mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={keepData}
                        onChange={(e) => setKeepData(e.target.checked)}
                        className="w-4 h-4 rounded border-[rgb(var(--ml-border))]/30 text-[rgb(var(--ml-accent))] focus:ring-[rgb(var(--ml-accent))] cursor-pointer accent-[rgb(var(--ml-accent))]"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">Retain Previous Data</p>
                      <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">Keep the previous tenant's documents and history attached to this unit.</p>
                    </div>
                  </label>
                </div>
                
                <div className="px-6 py-4 flex gap-3 justify-end items-center">
                  <button 
                    onClick={() => setIsDialogOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold border border-[rgb(var(--ml-border))]/30 bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-xl transition-colors cursor-pointer w-full sm:w-auto shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetchAPI<{ token: string }>("/api/v1/landlord/generate-invite", {
                          method: "POST",
                          body: JSON.stringify({ unit_id: u.id, clear_data: !keepData })
                        });
                        const link = `${window.location.origin}/join/${res.token}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Invite link copied to clipboard!");
                        setIsDialogOpen(false);
                        onRefresh();
                      } catch (err) {
                        toast.error("Failed to generate invite.");
                      }
                    }}
                    className="px-5 py-2.5 text-xs font-bold bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent-dark))] rounded-xl transition-all w-full sm:w-auto shadow-sm shadow-[rgba(var(--ml-accent),0.15)] active:scale-[0.98] cursor-pointer hover-lift"
                  >
                    Generate Link
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}


export default function LandlordUnitsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);
  
  const [unitLabel, setUnitLabel] = useState("");
  const [rentDay, setRentDay] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProps() {
      try {
        const data = await fetchAPI<Property[]>("/api/v1/landlord/properties");
        setProperties(data);
        if (data.length > 0) {
          setSelectedProperty(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProps();
  }, []);

  const loadUnits = async () => {
    if (!selectedProperty) return;
    setUnitsLoading(true);
    try {
      const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${selectedProperty}/units`);
      setUnits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [selectedProperty]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    
    setIsSubmitting(true);
    try {
      const newUnit = await fetchAPI<Unit>("/api/v1/landlord/units", {
        method: "POST",
        body: JSON.stringify({ 
          property_id: selectedProperty, 
          unit_label: unitLabel, 
          rent_due_day: parseInt(rentDay) 
        }),
      });
      setUnits(prev => [...prev, newUnit]);
      setUnitLabel("");
      setRentDay("1");
      toast.success("Unit created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create unit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-8 max-w-4xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-9 w-40 bg-[rgb(var(--ml-border))]/40 rounded-xl mb-2"></div>
        <div className="h-4 w-64 bg-[rgb(var(--ml-border))]/40 rounded-lg"></div>
      </div>
      
      {/* Property Selector Skeleton */}
      <div className="flex gap-4 items-center">
        <div className="h-5 w-28 bg-[rgb(var(--ml-border))]/40 rounded"></div>
        <div className="h-10 w-48 bg-[rgb(var(--ml-bg-secondary))]/30 border border-[rgb(var(--ml-border))]/25 rounded-xl"></div>
      </div>

      {/* Add Unit Form Skeleton */}
      <div className="p-6 bg-[rgb(var(--ml-bg-secondary))]/30 border border-[rgb(var(--ml-border))]/25 rounded-2xl space-y-4 shadow-sm">
        <div className="h-7 w-32 bg-[rgb(var(--ml-border))]/40 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[46px] w-full bg-[rgb(var(--ml-bg-secondary))]/30 border border-[rgb(var(--ml-border))]/25 rounded-xl"></div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 bg-[rgb(var(--ml-border))]/40 rounded"></div>
            <div className="h-[46px] w-24 bg-[rgb(var(--ml-bg-secondary))]/30 border border-[rgb(var(--ml-border))]/25 rounded-xl"></div>
          </div>
        </div>
        <div className="h-[42px] w-32 bg-[rgb(var(--ml-border))]/40 rounded-xl"></div>
      </div>

      {/* Units Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 w-full bg-[rgb(var(--ml-bg-secondary))]/30 border border-[rgb(var(--ml-border))]/25 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div className="h-6 w-24 bg-[rgb(var(--ml-border))]/40 rounded"></div>
                <div className="h-6 w-16 bg-[rgb(var(--ml-border))]/40 rounded-full"></div>
              </div>
              <div className="h-4 w-32 bg-[rgb(var(--ml-border))]/40 rounded mt-2"></div>
            </div>
            <div className="h-8 w-full bg-[rgb(var(--ml-border))]/40 rounded-xl mt-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-slide-up">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/10 shadow-inner">
            <DoorOpen className="w-6 h-6" />
          </div>
          Units
        </h1>
        <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] pl-1 mt-2">
          Set up property units, manage occupancy, and generate tenant invite links.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12 border border-[rgb(var(--ml-border))]/25 bg-[rgb(var(--ml-bg-secondary))] rounded-2xl text-balance text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">
          Please add a property first before managing units.
        </div>
      ) : (
        <>
          <div className="flex gap-4 items-center bg-[rgb(var(--ml-bg-secondary))] p-4 rounded-2xl border border-[rgb(var(--ml-border))]/15 shadow-sm max-w-max">
            <span className="font-bold text-xs uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] select-none">Select Property:</span>
            <Select value={selectedProperty} onValueChange={(val) => setSelectedProperty(val || "")}>
              <SelectTrigger className="w-48 bg-[rgb(var(--ml-bg-secondary))]/60 border-border/30 rounded-xl">
                <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-sm">
                  {selectedProperty ? properties.find(p => p.id === selectedProperty)?.name : "Select Property"}
                </span>
              </SelectTrigger>
              <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/30 rounded-xl">
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-semibold text-sm">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form onSubmit={handleCreate} className="p-6 bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))]/25 rounded-2xl space-y-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[rgb(var(--ml-text-primary))] tracking-tight">Add New Unit</h2>
              <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] mt-0.5">Define a unit identifier and set the recurring monthly rent due date.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                required 
                value={unitLabel} 
                onChange={e => setUnitLabel(e.target.value)} 
                placeholder="Unit Label (e.g. Apt 101, Basement, etc.)" 
                className="w-full bg-[rgb(var(--ml-bg-secondary))]/55 border border-[rgb(var(--ml-border))]/30 rounded-xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/40"
              />
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] select-none">Rent Due Day:</span>
                <input 
                  required 
                  type="number"
                  min="1" max="31"
                  value={rentDay} 
                  onChange={e => setRentDay(e.target.value)} 
                  className="bg-[rgb(var(--ml-bg-secondary))]/55 border border-[rgb(var(--ml-border))]/30 rounded-xl p-3 text-sm outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all w-24 tabular-nums"
                />
              </div>
            </div>
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-6 py-2.5 text-sm rounded-xl hover:bg-[rgb(var(--ml-accent-dark))] hover-lift transition-all shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Add Unit"}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence mode="wait">
            {unitsLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="col-span-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 w-full bg-[rgb(var(--ml-bg-secondary))]/30 border border-[rgb(var(--ml-border))]/25 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="h-6 w-24 bg-[rgb(var(--ml-border))]/40 rounded"></div>
                        <div className="h-6 w-16 bg-[rgb(var(--ml-border))]/40 rounded-full"></div>
                      </div>
                      <div className="h-4 w-32 bg-[rgb(var(--ml-border))]/40 rounded mt-2"></div>
                    </div>
                    <div className="h-8 w-full bg-[rgb(var(--ml-border))]/40 rounded-xl mt-auto"></div>
                  </div>
                ))}
              </motion.div>
            ) : units.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center py-10 text-xs font-semibold text-[rgb(var(--ml-text-secondary))] border border-dashed border-[rgb(var(--ml-border))]/25 rounded-2xl bg-[rgb(var(--ml-bg-secondary))]/10"
              >
                No units in this property yet.
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="col-span-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {units.map(u => (
                  <motion.div 
                    key={u.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <UnitCard u={u} onRefresh={loadUnits} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
