"use client";

import React from "react";
import Image from "next/image";
import { FileText, File, Calendar, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Document {
  id: string;
  title: string;
  file_key: string;
  file_type: string;
  created_at: string;
  unit_id?: string | null;
  unit_label?: string | null;
  property_name?: string | null;
  file_url?: string;
}

export interface DocumentCardProps {
  doc: Document;
  unitLabel: string;
  onPreview: (doc: Document) => void;
  onDownload: (fileKey: string, title: string) => void;
}

export function DocumentCard({
  doc,
  unitLabel,
  onPreview,
  onDownload,
}: DocumentCardProps) {
  const getFileBadge = (fileType: string, fileKey: string) => {
    if (fileType.startsWith("image/"))
      return {
        label: "Image",
        color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
    if (fileType === "application/pdf" || fileKey.endsWith(".pdf"))
      return {
        label: "PDF",
        color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      };
    if (fileType.includes("word") || fileType.includes("officedocument"))
      return {
        label: "Word",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      };
    return {
      label: "File",
      color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
  };

  const badge = getFileBadge(doc.file_type, doc.file_key);

  const renderPreview = () => {
    const isImage = doc.file_type.startsWith("image/");
    const isPdf =
      doc.file_type === "application/pdf" || doc.file_key.endsWith(".pdf");

    if (isImage && doc.file_url) {
      return (
        <div className="relative w-full h-full bg-muted/30 flex items-center justify-center overflow-hidden">
          <Image
            src={doc.file_url}
            alt={doc.title}
            fill
            unoptimized
            sizes="96px"
            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-rose-500/15 via-red-500/10 to-rose-950/20 text-rose-500 dark:text-rose-400 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
            <FileText className="h-6 w-6 text-rose-500" />
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase text-rose-500/90 dark:text-rose-300">
            PDF
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-indigo-950/20 text-indigo-500 dark:text-indigo-400 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
          <File className="h-6 w-6 text-indigo-500" />
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase text-indigo-500/90 dark:text-indigo-300">
          DOC
        </span>
      </div>
    );
  };

  return (
    <div className="group relative flex flex-col justify-between p-4 border border-border/60 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20">
      <div className="flex gap-4 items-start">
        {/* Thumbnail Preview */}
        <div
          onClick={() => onPreview(doc)}
          className="relative w-24 h-24 rounded-xl border border-border/60 overflow-hidden shrink-0 shadow-inner bg-[rgb(var(--ml-bg-primary))] cursor-pointer group-hover:border-[rgb(var(--ml-text-primary))]/40 transition-colors"
          title={`Click to preview ${doc.title}`}
        >
          {renderPreview()}
        </div>

        {/* Meta Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${badge.color}`}
              >
                {badge.label}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold truncate ${
                  doc.unit_id
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                }`}
              >
                {unitLabel}
              </span>
            </div>
            <h3 className="font-bold text-base text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-text-primary))]/80 transition-colors line-clamp-2 leading-tight pt-0.5">
              {doc.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium">
            <Calendar className="w-3 h-3 text-[rgb(var(--ml-text-secondary))]/70" />
            <span>
              {new Date(doc.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreview(doc)}
          className="w-full h-9 rounded-xl text-[rgb(var(--ml-text-primary))] font-semibold text-xs gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))]"
        >
          <Eye className="w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))]" />
          View
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDownload(doc.file_key, doc.title)}
          className="w-full h-9 rounded-xl bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-bold text-xs gap-1.5 cursor-pointer shadow-sm transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-accent))] hover:text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)]"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>
      </div>
    </div>
  );
}
