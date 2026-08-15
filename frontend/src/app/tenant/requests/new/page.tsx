"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Wrench, ChevronLeft, Upload, Image as ImageIcon, X, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [images, setImages] = useState<File[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (images.length + newFiles.length > 3) {
      toast.error("You can only upload a maximum of 3 attachments.");
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

    setImages((prev) => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let imageKeys: string[] = [];
      if (images.length > 0) {
        imageKeys = await Promise.all(
          images.map((img) => uploadFile(img, "maintenance"))
        );
      }

      await fetchAPI("/api/v1/tenant/maintenance", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          priority,
          image_keys: imageKeys,
        }),
      });

      router.push("/tenant/requests");
      router.refresh();
      toast.success("Maintenance request submitted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fade-slide-up">
      {/* Header Section */}
      <div className="space-y-3">
        <Link 
          href="/tenant/requests" 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] border border-border/50 hover:bg-[rgb(var(--ml-bg-primary))] hover:text-[rgb(var(--ml-text-primary))] transition-all w-fit"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Requests
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))] flex items-center gap-3">
            <Wrench className="w-7 h-7 text-orange-400 shrink-0" />
            New Maintenance Request
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-1">
            Submit details and photos regarding a repair issue in your unit.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-[rgb(var(--ml-bg-secondary))] p-6 sm:p-8 rounded-3xl border border-border/60 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <label htmlFor="issue-title" className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
            Issue Title <span className="text-red-400">*</span>
          </label>
          <input 
            id="issue-title"
            required
            maxLength={255}
            value={title}
            onChange={e => setTitle(e.target.value)}
            type="text" 
            placeholder="e.g. Leaking faucet in kitchen" 
            className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/60 rounded-xl p-3.5 text-xs sm:text-sm text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:[rgb(var(--ml-text-secondary))]/50 font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-description" className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea 
            id="issue-description"
            required
            maxLength={2000}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5} 
            placeholder="Please provide details about the issue (what is wrong, when it started, location in unit)..." 
            className="w-full bg-[rgb(var(--ml-bg-primary))] border border-border/60 rounded-xl p-3.5 text-xs sm:text-sm text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-text-primary))] focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] transition-all placeholder:[rgb(var(--ml-text-secondary))]/50 resize-none font-medium leading-relaxed"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-priority" className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
            Priority Level
          </label>
          <Select value={priority} onValueChange={(val) => setPriority(val || "medium")}>
            <SelectTrigger id="issue-priority" className="w-full bg-[rgb(var(--ml-bg-primary))] border-border/60 rounded-xl h-[46px] text-xs sm:text-sm font-medium focus:ring-1 focus:ring-[rgb(var(--ml-text-primary))] focus:border-[rgb(var(--ml-text-primary))]">
              <span className="flex flex-1 text-left line-clamp-1 truncate font-semibold">
                {priority === "low"
                  ? "Low (Cosmetic, non-urgent)"
                  : priority === "medium"
                  ? "Medium (Standard issue)"
                  : priority === "high"
                  ? "High (Needs attention soon)"
                  : "Emergency (Immediate safety or water hazard)"}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/50 rounded-xl shadow-xl">
              <SelectItem value="low" className="font-semibold text-xs sm:text-sm cursor-pointer">Low (Cosmetic, non-urgent)</SelectItem>
              <SelectItem value="medium" className="font-semibold text-xs sm:text-sm cursor-pointer">Medium (Standard issue)</SelectItem>
              <SelectItem value="high" className="font-semibold text-xs sm:text-sm cursor-pointer text-orange-400">High (Needs attention soon)</SelectItem>
              <SelectItem value="urgent" className="font-semibold text-xs sm:text-sm cursor-pointer text-red-400">Emergency (Immediate safety or water hazard)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Upload Dropzone */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-extrabold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider block">
              Attach Photos (Optional)
            </label>
            <span className="text-[10px] font-bold text-[rgb(var(--ml-text-secondary))]/70 uppercase tracking-wider">
              {images.length} / 3 Uploaded
            </span>
          </div>

          <div className="space-y-3">
            {/* Display Selected Images */}
            {images.length > 0 && (
              <div className="grid gap-3">
                {images.map((img, index) => (
                  <div key={index} className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[rgb(var(--ml-bg-primary))] border border-border/60 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] shrink-0">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[rgb(var(--ml-text-primary))] truncate">
                          {img.name}
                        </p>
                        <p className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium">
                          {(img.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 rounded-xl text-[rgb(var(--ml-text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone (Only show if less than 3 images) */}
            {images.length < 3 && (
              <div className="relative border-2 border-dashed border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 bg-[rgb(var(--ml-bg-primary))]/30 hover:bg-[rgb(var(--ml-bg-primary))]/60 p-6 sm:p-8 rounded-2xl text-center cursor-pointer group transition-all duration-200 ease-out">
                <input 
                  id="issue-photos"
                  type="file" 
                  accept="image/*,application/pdf,.doc,.docx,video/mp4,video/quicktime,video/webm"
                  multiple
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="p-3 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-secondary))] group-hover:text-[rgb(var(--ml-text-primary))] group-hover:scale-110 transition-all border border-border/40">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                      Click or drag files to upload
                    </p>
                    <p className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium">
                      Photos, docs, or videos up to 10MB (Max 3 files)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold py-3.5 px-6 text-xs sm:text-sm rounded-xl shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[rgb(var(--ml-bg-primary))] border-t-transparent animate-spin inline-block" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
