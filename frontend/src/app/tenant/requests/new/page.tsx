"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { Wrench, ChevronLeft } from "lucide-react";

export default function NewRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let imageKey = null;
      if (image) {
        imageKey = await uploadFile(image, "maintenance");
      }

      await fetchAPI("/api/v1/tenant/maintenance", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          priority,
          image_keys: imageKey ? [imageKey] : [],
        }),
      });

      router.push("/tenant/requests");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-slide-up">
      <div className="mb-6 flex flex-col gap-2">
        <Link href="/tenant/requests" className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-accent))] transition-colors flex items-center gap-1 w-fit mb-1">
          <ChevronLeft className="w-4 h-4" /> Back to Requests
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))]">
          New Maintenance Request
        </h1>
        <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] pl-1">
          Submit details and photos regarding a repair issue in your unit.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-[rgb(var(--ml-bg-secondary))] p-6 rounded-2xl border border-border/25 shadow-sm">
        <div className="space-y-1.5">
          <label htmlFor="issue-title" className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider">Issue Title</label>
          <input 
            id="issue-title"
            required
            maxLength={255}
            value={title}
            onChange={e => setTitle(e.target.value)}
            type="text" 
            placeholder="e.g. Leaking faucet in kitchen" 
            className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 rounded-xl p-3 text-sm text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/40"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-description" className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider">Description</label>
          <textarea 
            id="issue-description"
            required
            maxLength={2000}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4} 
            placeholder="Please provide details about the issue..." 
            className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border border-border/40 rounded-xl p-3 text-sm text-[rgb(var(--ml-text-primary))] outline-none focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/25 transition-all placeholder-[rgb(var(--ml-text-secondary))]/40 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-priority" className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider">Priority</label>
          <Select value={priority} onValueChange={(val) => setPriority(val || "medium")}>
            <SelectTrigger id="issue-priority" className="w-full bg-[rgb(var(--ml-bg-primary))]/80 border-border/40 rounded-xl h-[46px]">
              <span className="flex flex-1 text-left line-clamp-1 truncate text-sm font-semibold">
                {priority === "low"
                  ? "Low (Cosmetic, non-urgent)"
                  : priority === "medium"
                  ? "Medium (Standard issue)"
                  : priority === "high"
                  ? "High (Needs attention soon)"
                  : "Emergency (Immediate threat)"}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-[rgb(var(--ml-bg-secondary))] border-border/30 rounded-xl">
              <SelectItem value="low" className="font-semibold text-sm">Low (Cosmetic, non-urgent)</SelectItem>
              <SelectItem value="medium" className="font-semibold text-sm">Medium (Standard issue)</SelectItem>
              <SelectItem value="high" className="font-semibold text-sm">High (Needs attention soon)</SelectItem>
              <SelectItem value="urgent" className="font-semibold text-sm">Emergency (Immediate threat)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="issue-photo" className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] uppercase tracking-wider">Attach Photo (Optional)</label>
          <input 
            id="issue-photo"
            type="file" 
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] || null)}
            className="w-full text-xs text-[rgb(var(--ml-text-secondary))] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[rgb(var(--ml-accent))] file:text-[rgb(var(--ml-bg-primary))] hover:file:opacity-90 cursor-pointer"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold py-3 px-6 text-sm rounded-xl hover:bg-[rgb(var(--ml-accent-dark))] hover-lift transition-all shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
