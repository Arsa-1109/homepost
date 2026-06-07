"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import Link from "next/link";

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
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tenant/requests" className="text-[rgb(var(--ml-text-secondary))] hover:text-foreground transition-colors">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">New Maintenance Request</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[rgb(var(--ml-bg-secondary))] p-6 rounded-xl border border-[rgb(var(--ml-border))]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--ml-text-secondary))]">Issue Title</label>
          <input 
            required
            maxLength={255}
            value={title}
            onChange={e => setTitle(e.target.value)}
            type="text" 
            placeholder="e.g. Leaking faucet in kitchen" 
            className="w-full bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--ml-text-secondary))]">Description</label>
          <textarea 
            required
            maxLength={2000}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4} 
            placeholder="Please provide details about the issue..." 
            className="w-full bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--ml-text-secondary))]">Priority</label>
          <select 
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="w-full bg-transparent border border-[rgb(var(--ml-border))] rounded-lg p-3 outline-none focus:border-[rgb(var(--ml-accent))] transition-colors appearance-none"
          >
            <option value="low" className="bg-background">Low (Cosmetic, non-urgent)</option>
            <option value="medium" className="bg-background">Medium (Standard issue)</option>
            <option value="high" className="bg-background">High (Needs attention soon)</option>
            <option value="emergency" className="bg-background">Emergency (Immediate threat)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--ml-text-secondary))]">Attach Photo (Optional)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={e => setImage(e.target.files?.[0] || null)}
            className="w-full text-sm text-[rgb(var(--ml-text-secondary))] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[rgb(var(--ml-accent))] file:text-white hover:file:opacity-90 cursor-pointer"
          />
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full bg-[rgb(var(--ml-accent))] text-white font-medium p-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
