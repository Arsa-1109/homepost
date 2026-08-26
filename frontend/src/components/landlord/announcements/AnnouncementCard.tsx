"use client";

import React from "react";
import { motion } from "motion/react";
import { Building, Calendar, Pencil, Trash2 } from "lucide-react";
import { AttachmentThumbnail } from "./AttachmentThumbnail";

export interface Announcement {
  id: string;
  property_id: string;
  unit_id?: string | null;
  unit_label?: string | null;
  property_name?: string | null;
  title: string;
  body: string;
  attachment_keys?: string[];
  attachment_urls?: string[];
  created_at: string;
}

export interface AnnouncementCardProps {
  announcement: Announcement;
  propertyName: string;
  unitLabel?: string | null;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
  onViewImage: (url: string) => void;
  isHighlighted?: boolean;
}

export function AnnouncementCard({
  announcement,
  propertyName,
  unitLabel,
  onEdit,
  onDelete,
  onViewImage,
  isHighlighted = false,
}: AnnouncementCardProps) {
  const isUnitSpecific = !!announcement.unit_id;

  return (
    <motion.div
      id={`announcement-${announcement.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
      className={`p-6 border rounded-2xl bg-[rgb(var(--ml-bg-secondary))] space-y-3 relative group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20 ${
        isHighlighted
          ? "border-[rgb(var(--ml-accent))] ring-2 ring-[rgb(var(--ml-accent))] shadow-[0_0_28px_rgba(var(--ml-accent),0.35)] scale-[1.01]"
          : "border-border/60"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {unitLabel ? (
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-md border font-bold uppercase tracking-wider ${
                isUnitSpecific
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              }`}
            >
              {unitLabel}
            </span>
          ) : (
            <span
              className={`inline-block h-5 w-16 rounded-md animate-pulse ${
                isUnitSpecific ? "bg-emerald-500/20" : "bg-blue-500/20"
              }`}
            />
          )}
          <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] flex items-center gap-1">
            <Building className="w-3 h-3 opacity-60" />
            {propertyName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--ml-text-secondary))] font-medium">
            <Calendar className="w-3.5 h-3.5 opacity-60" />
            <span>
              {new Date(announcement.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(announcement)}
              title="Edit Announcement"
              className="p-1.5 rounded-lg text-[rgb(var(--ml-text-secondary))] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(announcement)}
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
          {announcement.title}
        </h3>
        <p className="text-xs sm:text-sm text-[rgb(var(--ml-text-secondary))] whitespace-pre-wrap leading-relaxed">
          {announcement.body}
        </p>
      </div>

      {announcement.attachment_urls && announcement.attachment_urls.length > 0 && (
        <div className="pt-2 border-t border-border/30 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]/70 block">
            Attachments ({announcement.attachment_urls.length})
          </span>
          <div className="flex flex-wrap gap-2.5">
            {announcement.attachment_urls.map((url, idx) => (
              <AttachmentThumbnail key={idx} url={url} onViewImage={onViewImage} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
