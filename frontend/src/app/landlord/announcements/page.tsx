"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, 
  Search, 
  Plus, 
  Calendar, 
  Building, 
  X,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  Eye,
  DownloadIcon,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LightboxModal, getFriendlyFileName, isImageUrl } from "@/components/LightboxModal";
import { useAuth } from "@clerk/nextjs";

type Property = { id: string; name: string };
type Unit = { id: string; unit_label: string };
type Announcement = {
  id: string;
  property_id: string;
  unit_id?: string | null;
  title: string;
  body: string;
  attachment_keys?: string[];
  attachment_urls?: string[];
  created_at: string;
};

function AttachmentThumbnail({ 
  url, 
  onViewImage 
}: { 
  url: string; 
  onViewImage: (url: string) => void; 
}) {
  const pathOnly = url.split("?")[0];
  const isImage = isImageUrl(url);
  const friendlyName = getFriendlyFileName(url);
  const rawFileName = pathOnly.split("/").pop() || "Attachment";

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isImage) {
      onViewImage(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isImage) {
    return (
      <div 
        onClick={handleView}
        className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-border/60 overflow-hidden bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-text-primary))]/30 transition-all cursor-pointer flex-shrink-0 shadow-sm"
      >
        <img 
          src={url} 
          alt={friendlyName} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <button 
            onClick={handleView}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
            title="View full size"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <a 
            href={url} 
            download 
            onClick={handleDownload}
            target="_blank" 
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
            title="Download"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleView}
      className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-text-primary))]/30 transition-all flex flex-col items-center justify-between p-2.5 cursor-pointer flex-shrink-0 select-none shadow-sm"
    >
      <div className="flex-1 flex items-center justify-center">
        <FileText className="w-6 h-6 text-[rgb(var(--ml-accent))]" />
      </div>
      <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-semibold truncate w-full text-center" title={rawFileName}>
        {friendlyName}
      </span>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl z-10">
        <button 
          onClick={handleView}
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
          title="Open file"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <a 
          href={url} 
          download 
          onClick={handleDownload}
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10"
          title="Download"
        >
          <DownloadIcon className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function LandlordAnnouncementsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold text-[rgb(var(--ml-text-secondary))]">Loading...</div>}>
      <LandlordAnnouncementsContent />
    </Suspense>
  );
}

function LandlordAnnouncementsContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const router = useRouter();
  const { isLoaded, getToken } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit & Delete State
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editUnitId, setEditUnitId] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "RECENT" | "PROPERTY" | "UNIT">("ALL");

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProperty, selectedFilter, searchQuery]);

  async function loadData() {
    if (!isLoaded) return;
    try {
      const token = await getToken();
      const [props, anns] = await Promise.all([
        fetchAPI<Property[]>("/api/v1/landlord/properties", {}, token),
        fetchAPI<Announcement[]>("/api/v1/landlord/announcements", {}, token)
      ]);
      setProperties(props);
      if (props.length > 0) setSelectedProperty(props[0].id);
      setAnnouncements(anns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !selectedProperty) return;
    async function loadUnits() {
      try {
        const token = await getToken();
        const data = await fetchAPI<Unit[]>(`/api/v1/landlord/properties/${selectedProperty}/units`, {}, token);
        const sorted = (data || []).slice().sort((a, b) =>
          (a.unit_label || "").localeCompare(b.unit_label || "", undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
        setUnits(sorted);
      } catch (err) {
        console.error(err);
      }
    }
    setSelectedUnit("");
    loadUnits();
  }, [selectedProperty, isLoaded, getToken]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (attachments.length + newFiles.length > 3) {
      toast.error("You can only attach a maximum of 3 files.");
      e.target.value = "";
      return;
    }

    const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".pdf", ".doc", ".docx", ".mp4", ".mov", ".webm", ".m4v"];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    for (const file of newFiles) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        toast.error(`"${file.name}" has an unsupported format. Supported formats: Images, PDFs, Docs, and Videos.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" exceeds the 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        e.target.value = "";
        return;
      }
    }

    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    
    setIsSubmitting(true);
    try {
      let attachmentKeys: string[] = [];
      if (attachments.length > 0) {
        attachmentKeys = await Promise.all(
          attachments.map(file => uploadFile(file, "announcements"))
        );
      }

      const payload: any = { property_id: selectedProperty, title, body };
      if (selectedUnit) payload.unit_id = selectedUnit;
      if (attachmentKeys.length > 0) payload.attachment_keys = attachmentKeys;
      
      await fetchAPI("/api/v1/landlord/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTitle("");
      setBody("");
      setSelectedUnit("");
      setAttachments([]);
      setShowUploadForm(false);
      toast.success("Announcement posted successfully!");
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to post announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setEditTitle(ann.title);
    setEditBody(ann.body);
    setEditUnitId(ann.unit_id || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;

    setIsEditSubmitting(true);
    try {
      const payload: any = { title: editTitle, body: editBody };
      payload.unit_id = editUnitId ? editUnitId : null;

      await fetchAPI(`/api/v1/landlord/announcements/${editingAnnouncement.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.success("Announcement updated successfully!");
      setEditingAnnouncement(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update announcement. Please try again.");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAnnouncement) return;
    setIsDeleteSubmitting(true);
    try {
      await fetchAPI(`/api/v1/landlord/announcements/${deletingAnnouncement.id}`, {
        method: "DELETE",
      });
      toast.success("Announcement deleted successfully!");
      setDeletingAnnouncement(null);
      loadData();
    } catch (err) {
      toast.error("Failed to delete announcement.");
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const [nowTimestamp, setNowTimestamp] = useState<number>(0);

  useEffect(() => {
    setNowTimestamp(Date.now());
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // Property Filter
      if (selectedProperty && ann.property_id !== selectedProperty) {
        return false;
      }

      // ID Filter
      if (idParam && ann.id !== idParam) {
        return false;
      }

      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        ann.title.toLowerCase().includes(query) || 
        ann.body.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (selectedFilter === "RECENT") {
        const sevenDaysAgo = nowTimestamp - 7 * 24 * 60 * 60 * 1000;
        return new Date(ann.created_at).getTime() >= sevenDaysAgo;
      }
      if (selectedFilter === "PROPERTY") {
        return !ann.unit_id;
      }
      if (selectedFilter === "UNIT") {
        return !!ann.unit_id;
      }
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [announcements, searchQuery, selectedFilter, nowTimestamp, idParam, selectedProperty]);

  const totalPages = Math.ceil(filteredAnnouncements.length / ITEMS_PER_PAGE) || 1;

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAnnouncements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAnnouncements, currentPage]);

  const selectedPropertyName = properties.find(p => p.id === selectedProperty)?.name || "Property";

  const getUnitLabel = (unitId: string | null | undefined) => {
    if (!unitId) return "Property-Wide";
    const unit = units.find(u => u.id === unitId);
    return unit ? `Unit ${unit.unit_label}` : "Unit Specific";
  };

  return (
    <>
      <AnimatePresence>
        {previewUrl && (
          <LightboxModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        )}
      </AnimatePresence>

      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border border-border/80">
                Tenant Communications
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
                Announcements
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] font-bold border border-border">
                  {announcements.length}
                </span>
              </h1>
              <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                Broadcast notices, policy updates, and maintenance reminders to tenants.
              </p>
            </div>

            {/* Action & Property Selector Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Property Switcher */}
              <div className="relative flex-1 sm:w-56">
                {loading ? (
                  <div className="w-full bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl h-11 flex items-center px-3">
                    <div className="skeleton h-4 w-32 rounded-md" />
                  </div>
                ) : properties.length > 0 ? (
                  <Select value={selectedProperty} onValueChange={(val) => setSelectedProperty(val as string)}>
                    <SelectTrigger className="w-full bg-[rgb(var(--ml-bg-secondary))] border-border/60 rounded-xl h-11">
                      <span className="flex items-center gap-2 font-bold text-xs text-[rgb(var(--ml-text-primary))] truncate">
                        {selectedPropertyName}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                      {properties.map(p => (
                        <SelectItem key={p.id} value={p.id} className="font-semibold text-xs">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>

              {/* Toggle Post Announcement Form Button */}
              <Button
                onClick={() => setShowUploadForm(prev => !prev)}
                className="h-11 px-4 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:border-transparent hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.25)]"
              >
                {showUploadForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{showUploadForm ? "Hide Form" : "Post Announcement"}</span>
              </Button>
            </div>
          </div>

          {/* Search & Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap pb-1 sm:pb-0">
              {(["ALL", "RECENT", "PROPERTY", "UNIT"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                    selectedFilter === filter
                      ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] border-[rgb(var(--ml-text-primary))] shadow-sm"
                      : "bg-[rgb(var(--ml-bg-secondary))] hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:text-[rgb(var(--ml-text-primary))]"
                  }`}
                >
                  {filter === "ALL" && "All Notices"}
                  {filter === "RECENT" && "Last 7 Days"}
                  {filter === "PROPERTY" && "Property-Wide"}
                  {filter === "UNIT" && "Unit-Specific"}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--ml-text-secondary))]" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[rgb(var(--ml-bg-secondary))] border border-border/60 rounded-xl text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 focus:outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>
          </div>

          {idParam && (
            <div className="mt-4 flex items-center bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold px-4 py-2 rounded-xl">
              <span>Showing a specific announcement.</span>
              <button 
                onClick={() => router.replace('/landlord/announcements')}
                className="ml-auto underline decoration-blue-500/30 hover:decoration-blue-500 underline-offset-2"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {!loading && properties.length === 0 ? (
          <div className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-3">
            <Building className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No Properties Found</h3>
            <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
              Please add a property first before posting announcements.
            </p>
          </div>
        ) : (
          <>
            {/* Post Form (Collapsible with Framer Motion) */}
            <AnimatePresence>
              {showUploadForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <form 
                    onSubmit={handleCreate} 
                    className="p-6 sm:p-8 bg-[rgb(var(--ml-bg-secondary))] border border-border rounded-3xl space-y-5 shadow-md mb-8"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
                          <Megaphone className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                          Post New Announcement
                        </h2>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                          Broadcasting to <span className="font-semibold text-[rgb(var(--ml-text-primary))]">{selectedPropertyName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                          Target Property
                        </label>
                        <Select value={selectedProperty} onValueChange={(val) => setSelectedProperty(val as string)}>
                          <SelectTrigger className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11">
                            <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-xs text-[rgb(var(--ml-text-primary))]">
                              {selectedPropertyName}
                            </span>
                          </SelectTrigger>
                          <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                            {properties.map(p => (
                              <SelectItem key={p.id} value={p.id} className="font-semibold text-xs">{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                          Target Scope / Unit (Optional)
                        </label>
                        <Select value={selectedUnit || "all"} onValueChange={(val) => setSelectedUnit(val === "all" ? "" : val as string)}>
                          <SelectTrigger className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11">
                            <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-xs text-[rgb(var(--ml-text-primary))]">
                              {selectedUnit === "all" || !selectedUnit 
                                ? "All Units (Property-wide)" 
                                : `Unit ${units.find(u => u.id === selectedUnit)?.unit_label}`}
                            </span>
                          </SelectTrigger>
                          <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                            <SelectItem value="all" className="font-semibold text-xs">All Units (Property-wide)</SelectItem>
                            {units.map(u => (
                              <SelectItem key={u.id} value={u.id} className="font-semibold text-xs">Unit {u.unit_label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                        Announcement Title
                      </label>
                      <input 
                        required 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="e.g. Scheduled Water Maintenance" 
                        className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                        Notice Details
                      </label>
                      <textarea 
                        required 
                        value={body} 
                        onChange={e => setBody(e.target.value)} 
                        placeholder="Write your announcement details here..." 
                        rows={4}
                        className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:text-[rgb(var(--ml-text-secondary))]/50 resize-y"
                      />
                    </div>

                    {/* File Attachment Dropzone */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] block">
                          Attach Files (Optional)
                        </label>
                        <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))]/70 uppercase tracking-wider">
                          {attachments.length} / 3 Uploaded
                        </span>
                      </div>

                      <div className="space-y-3">
                        {attachments.length > 0 && (
                          <div className="grid gap-2">
                            {attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 shadow-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Paperclip className="w-4 h-4 text-[rgb(var(--ml-accent))] shrink-0" />
                                  <span className="text-xs font-semibold text-[rgb(var(--ml-text-primary))] truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] shrink-0">
                                    ({(file.size / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(idx)}
                                  className="p-1 rounded-lg text-[rgb(var(--ml-text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {attachments.length < 3 && (
                          <div className="relative border-2 border-dashed border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 bg-[rgb(var(--ml-bg-primary))]/30 hover:bg-[rgb(var(--ml-bg-primary))]/60 p-5 rounded-2xl text-center cursor-pointer transition-all duration-200 ease-out group">
                            <input 
                              type="file" 
                              multiple
                              accept="image/*,application/pdf,.doc,.docx,video/mp4,video/quicktime,video/webm"
                              onChange={handleAttachmentChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex items-center justify-center gap-3 pointer-events-none">
                              <div className="p-2 rounded-xl bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-text-primary))] transition-all border border-border/40">
                                <Upload className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                  Click or drag files to attach
                                </p>
                                <p className="text-[10px] text-[rgb(var(--ml-text-secondary))]">
                                  Photos, docs, or videos up to 10MB (Max 3)
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowUploadForm(false)}
                        className="rounded-xl text-xs font-bold"
                      >
                        Cancel
                      </Button>
                      <Button 
                        isLoading={isSubmitting}
                        type="submit" 
                        className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-6 py-2.5 cursor-pointer shadow-sm flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                      >
                        <span>Post Announcement</span>
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Announcements List Container */}
            <div className="space-y-4">
              {announcements.length > 0 && (
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                    Notice Feed ({filteredAnnouncements.length})
                  </h2>
                </div>
              )}

              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div key={`skel-${i}`} className="p-6 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-3 relative">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="skeleton h-5 w-24 rounded-md" />
                            <div className="skeleton h-5 w-20 rounded-md" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="skeleton h-4 w-16 rounded-md" />
                          </div>
                        </div>
                        <div className="space-y-2 pt-1">
                          <div className="skeleton h-6 w-3/4 rounded-lg" />
                          <div className="skeleton h-4 w-full rounded-md mt-2" />
                          <div className="skeleton h-4 w-5/6 rounded-md" />
                        </div>
                      </div>
                    ))
                  ) : announcements.length === 0 ? (
                    <motion.div
                      key="empty-all"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-md mx-auto space-y-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-center mx-auto text-[rgb(var(--ml-text-secondary))]">
                        <Megaphone className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[rgb(var(--ml-text-primary))]">No announcements yet</h3>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-xs mx-auto">
                          Keep your tenants informed with property updates, maintenance notices, and important reminders.
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowUploadForm(true)}
                        className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-5 py-2 cursor-pointer inline-flex items-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Post announcement</span>
                      </Button>
                    </motion.div>
                  ) : filteredAnnouncements.length === 0 ? (
                    <motion.div
                      key="empty-search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-center py-16 px-6 border border-border/40 rounded-3xl bg-[rgb(var(--ml-bg-secondary))] shadow-sm max-w-sm mx-auto space-y-3"
                    >
                      <Search className="w-8 h-8 text-[rgb(var(--ml-text-secondary))] mx-auto opacity-50" />
                      <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">No announcements found</p>
                      <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Try a different search or filter.</p>
                    </motion.div>
                  ) : (
                    paginatedAnnouncements.map((ann) => {
                      const propertyName = properties.find(p => p.id === ann.property_id)?.name || "Property";
                      const isUnitSpecific = !!ann.unit_id;
                      const unitLabel = getUnitLabel(ann.unit_id);

                      return (
                        <motion.div
                          key={ann.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                          className="p-6 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-3 relative group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-md border font-bold uppercase tracking-wider ${
                                isUnitSpecific
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              }`}>
                                {unitLabel}
                              </span>
                              <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] flex items-center gap-1">
                                <Building className="w-3 h-3 opacity-60" />
                                {propertyName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--ml-text-secondary))] font-medium">
                                <Calendar className="w-3.5 h-3.5 opacity-60" />
                                <span>
                                  {new Date(ann.created_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleStartEdit(ann)}
                                  title="Edit Announcement"
                                  className="p-1.5 rounded-lg text-[rgb(var(--ml-text-secondary))] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingAnnouncement(ann)}
                                  title="Delete Announcement"
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-bold text-lg text-[rgb(var(--ml-text-primary))] leading-snug">
                              {ann.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap leading-relaxed">
                              {ann.body}
                            </p>
                          </div>

                          {ann.attachment_urls && ann.attachment_urls.length > 0 && (
                            <div className="pt-2 border-t border-border/30 space-y-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/70 block">
                                Attachments ({ann.attachment_urls.length})
                              </span>
                              <div className="flex flex-wrap gap-2.5">
                                {ann.attachment_urls.map((url, idx) => (
                                  <AttachmentThumbnail key={idx} url={url} onViewImage={setPreviewUrl} />
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>

                {/* Pagination Controls Bar */}
                {!loading && filteredAnnouncements.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-border/40">
                    <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
                      Showing{" "}
                      <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                      </span>
                      –
                      <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                        {Math.min(
                          currentPage * ITEMS_PER_PAGE,
                          filteredAnnouncements.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-[rgb(var(--ml-text-primary))]">
                        {filteredAnnouncements.length}
                      </span>{" "}
                      announcements
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
                                  : "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))] border-border/60 hover:border-[rgb(var(--ml-text-primary))]/30 hover:text-[rgb(var(--ml-text-primary))]"
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
            </div>
          </>
        )}
      </div>

      {/* Edit Modal Dialog */}
      <Dialog open={!!editingAnnouncement} onOpenChange={(val) => !val && setEditingAnnouncement(null)}>
        <DialogContent className="sm:max-w-lg p-6 sm:p-8 space-y-5">
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
              Edit Announcement
            </DialogTitle>
            <DialogDescription className="text-xs text-[rgb(var(--ml-text-secondary))]">
              Updating notice for <span className="font-semibold text-[rgb(var(--ml-text-primary))]">{properties.find(p => p.id === editingAnnouncement?.property_id)?.name || "Property"}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Target Scope / Unit (Optional)
              </label>
              <Select value={editUnitId || "all"} onValueChange={(val) => setEditUnitId(val === "all" ? "" : val as string)}>
                <SelectTrigger className="bg-[rgb(var(--ml-bg-primary))]/80 border-border/60 rounded-xl h-11">
                  <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold text-xs text-[rgb(var(--ml-text-primary))]">
                    {editUnitId === "all" || !editUnitId 
                      ? "All Units (Property-wide)" 
                      : `Unit ${units.find(u => u.id === editUnitId)?.unit_label || "Selected"}`}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/40 rounded-xl">
                  <SelectItem value="all" className="font-semibold text-xs">All Units (Property-wide)</SelectItem>
                  {units.map(u => (
                    <SelectItem key={u.id} value={u.id} className="font-semibold text-xs">Unit {u.unit_label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Announcement Title
              </label>
              <input 
                required 
                value={editTitle} 
                onChange={e => setEditTitle(e.target.value)} 
                className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Notice Details
              </label>
              <textarea 
                required 
                value={editBody} 
                onChange={e => setEditBody(e.target.value)} 
                rows={4}
                className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/60 rounded-xl p-3 text-xs font-medium text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setEditingAnnouncement(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button 
                isLoading={isEditSubmitting}
                type="submit" 
                className="rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs px-6 py-2.5 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal Dialog */}
      <Dialog open={!!deletingAnnouncement} onOpenChange={(val) => !val && setDeletingAnnouncement(null)}>
        <DialogContent className="sm:max-w-md p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-bold text-[rgb(var(--ml-text-primary))]">
                Delete Announcement
              </DialogTitle>
              <DialogDescription className="text-xs text-[rgb(var(--ml-text-secondary))]">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>

          <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed bg-[rgb(var(--ml-bg-primary))]/60 p-3.5 rounded-xl border border-border/40">
            Are you sure you want to delete <span className="font-semibold text-[rgb(var(--ml-text-primary))]">"{deletingAnnouncement?.title}"</span>? Tenants will no longer be able to view this notice.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingAnnouncement(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              isLoading={isDeleteSubmitting}
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 transition-all cursor-pointer shadow-sm"
            >
              Delete Notice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
