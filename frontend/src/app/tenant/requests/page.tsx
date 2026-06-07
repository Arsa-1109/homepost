"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "emergency";
  created_at: string;
  updated_at: string;
  image_urls?: string[];
  landlord_notes?: string;
  landlord_image_urls?: string[];
};

function TenantRequestsContent() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get("requestId");

  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (requestIdParam) {
      async function loadRequestDetail() {
        setLoadingDetail(true);
        setIsDetailOpen(true);
        try {
          const data = await fetchAPI<MaintenanceRequest>(`/api/v1/tenant/maintenance/${requestIdParam}`);
          setSelectedRequest(data);
        } catch (err) {
          console.error("Failed to load request details", err);
        } finally {
          setLoadingDetail(false);
        }
      }
      loadRequestDetail();
    } else {
      setIsDetailOpen(false);
      setSelectedRequest(null);
    }
  }, [requestIdParam]);

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedRequest(null);
    window.history.replaceState(null, "", "/tenant/requests");
  };

  useEffect(() => {
    async function loadAll() {
      try {
        const [reqs, prof] = await Promise.all([
          fetchAPI<MaintenanceRequest[]>("/api/v1/tenant/maintenance"),
          fetchAPI<any>("/api/v1/tenant/profile")
        ]);
        setRequests(reqs);
        setProfile(prof);
      } catch (err) {
        console.error("Failed to load requests", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const handleReopen = async (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm("Are you sure you want to reopen this maintenance request?")) {
      return;
    }
    try {
      const updatedReq = await fetchAPI<MaintenanceRequest>(`/api/v1/tenant/maintenance/${requestId}/reopen`, {
        method: "POST"
      });
      setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));
    } catch (err: any) {
      alert(err.message || "Failed to reopen request.");
    }
  };

  const canReopen = (req: MaintenanceRequest) => {
    if (req.status !== "resolved") return false;
    const resolvedDate = new Date(req.updated_at || req.created_at);
    const today = new Date();
    const diffTime = today.getTime() - resolvedDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "in_progress": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "resolved": return "bg-green-500/20 text-green-500 border-green-500/30";
      case "closed": return "bg-gray-500/20 text-gray-500 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        {profile?.is_active && (
          <Link 
            href="/tenant/requests/new" 
            className="bg-[rgb(var(--ml-accent))] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + New Request
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="h-6 w-1/3 bg-[rgb(var(--ml-border))] rounded-md"></div>
                <div className="h-6 w-24 bg-[rgb(var(--ml-border))] rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-[rgb(var(--ml-border))] rounded-md"></div>
                <div className="h-4 w-2/3 bg-[rgb(var(--ml-border))] rounded-md"></div>
              </div>
              <div className="mt-6 flex gap-4">
                <div className="h-3 w-20 bg-[rgb(var(--ml-border))] rounded-md"></div>
                <div className="h-3 w-20 bg-[rgb(var(--ml-border))] rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))]">
          <p className="text-[rgb(var(--ml-text-secondary))]">No maintenance requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req.id}
              onClick={() => router.push(`/tenant/requests?requestId=${req.id}`, { scroll: false })}
              className="p-4 border border-[rgb(var(--ml-border))] rounded-xl bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg group-hover:text-[rgb(var(--ml-accent))] transition-colors">{req.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-bold ${getStatusColor(req.status)}`}>
                  {req.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-[rgb(var(--ml-text-secondary))] line-clamp-2">{req.description}</p>
              
              {req.landlord_notes && (
                <div className="mt-3 p-3 bg-[rgb(var(--ml-bg-primary))] rounded-lg border border-[rgb(var(--ml-border))]">
                  <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block mb-1">Landlord Note:</span>
                  <p className="text-sm text-[rgb(var(--ml-text-primary))] whitespace-pre-wrap">{req.landlord_notes}</p>
                </div>
              )}
              
              {req.image_urls && req.image_urls.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block">Your Attachments:</span>
                  <div className="flex flex-wrap gap-2">
                    {req.image_urls.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/img block overflow-hidden rounded border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-colors bg-slate-900"
                        onClick={(e) => e.stopPropagation()} // Prevent card click trigger
                      >
                        <div className="relative w-20 h-16 flex items-center justify-center overflow-hidden">
                          <img 
                            src={url} 
                            alt={`Attachment ${idx + 1}`} 
                            className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'text-[10px] text-[rgb(var(--ml-text-secondary))] p-1 text-center font-medium';
                                placeholder.innerText = 'View';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {req.landlord_image_urls && req.landlord_image_urls.length > 0 && (
                <div className="mt-3 space-y-2 p-3 bg-[rgb(var(--ml-bg-primary))] rounded-lg border border-[rgb(var(--ml-border))]">
                  <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block">Landlord Attachments:</span>
                  <div className="flex flex-wrap gap-2">
                    {req.landlord_image_urls.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/img block overflow-hidden rounded border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-colors bg-slate-900"
                        onClick={(e) => e.stopPropagation()} // Prevent card click trigger
                      >
                        <div className="relative w-20 h-16 flex items-center justify-center overflow-hidden">
                          <img 
                            src={url} 
                            alt={`Landlord Attachment ${idx + 1}`} 
                            className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) {
                                const placeholder = document.createElement('div');
                                placeholder.className = 'text-[10px] text-[rgb(var(--ml-text-secondary))] p-1 text-center font-medium';
                                placeholder.innerText = 'View';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-[rgb(var(--ml-text-secondary))] space-x-4">
                  <span>Priority: {req.priority.toUpperCase()}</span>
                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                {canReopen(req) && (
                  <button
                    onClick={(e) => handleReopen(req.id, e)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                  >
                    Reopen Request
                  </button>
                )}
                {req.status === "resolved" && !canReopen(req) && (
                  <span className="text-xs text-[rgb(var(--ml-text-secondary))] italic">
                    Resolved &gt; 14 days ago (Cannot reopen)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => { if (!open) handleCloseDetail(); }}>
        <DialogContent className="overflow-y-auto max-h-[90vh] sm:max-w-md bg-[rgb(var(--ml-bg-secondary))] border-[rgb(var(--ml-border))]">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              View full details of the maintenance request.
            </DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="py-8 text-center animate-pulse text-[rgb(var(--ml-text-secondary))]">
              Loading details...
            </div>
          ) : selectedRequest ? (
            <div className="space-y-6 mt-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{selectedRequest.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border uppercase tracking-wider font-bold ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-[rgb(var(--ml-text-primary))] whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              {selectedRequest.landlord_notes && (
                <div className="p-3 bg-[rgb(var(--ml-bg-primary))] rounded-lg border border-[rgb(var(--ml-border))]">
                  <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block mb-1">Landlord Note:</span>
                  <p className="text-sm text-[rgb(var(--ml-text-primary))] whitespace-pre-wrap">{selectedRequest.landlord_notes}</p>
                </div>
              )}

              {selectedRequest.image_urls && selectedRequest.image_urls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block">Your Attachments:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.image_urls.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/img block overflow-hidden rounded border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-colors bg-slate-900"
                      >
                        <div className="relative w-24 h-20 flex items-center justify-center overflow-hidden">
                          <img 
                            src={url} 
                            alt={`Attachment ${idx + 1}`} 
                            className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-200"
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.landlord_image_urls && selectedRequest.landlord_image_urls.length > 0 && (
                <div className="space-y-2 p-3 bg-[rgb(var(--ml-bg-primary))] rounded-lg border border-[rgb(var(--ml-border))]">
                  <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wide block">Landlord Attachments:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.landlord_image_urls.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/img block overflow-hidden rounded border border-[rgb(var(--ml-border))] hover:border-[rgb(var(--ml-accent))] transition-colors bg-slate-900"
                      >
                        <div className="relative w-24 h-20 flex items-center justify-center overflow-hidden">
                          <img 
                            src={url} 
                            alt={`Landlord Attachment ${idx + 1}`} 
                            className="object-cover w-full h-full group-hover/img:scale-105 transition-transform duration-200"
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-[rgb(var(--ml-text-secondary))]">
                <span>Priority: {selectedRequest.priority.toUpperCase()}</span>
                <span>Created: {new Date(selectedRequest.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[rgb(var(--ml-text-secondary))]">
              Failed to load request.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TenantRequestsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-[rgb(var(--ml-text-secondary))] animate-pulse">Loading requests...</div>}>
      <TenantRequestsContent />
    </Suspense>
  );
}
