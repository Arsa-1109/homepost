"use client";

import React from "react";
import Image from "next/image";
import {
  FileText,
  FileImage,
  Video,
  FileSpreadsheet,
  File,
  Calendar,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFileTypeInfo, isImageUrl } from "@/components/LightboxModal";

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
  isHighlighted?: boolean;
}

export function DocumentCard({
  doc,
  unitLabel,
  onPreview,
  onDownload,
  isHighlighted = false,
}: DocumentCardProps) {
  const fileInfo = getFileTypeInfo(doc.file_url || doc.file_key, doc.file_type);

  const renderFileIcon = () => {
    switch (fileInfo.category) {
      case "video":
        return <Video className="h-6 w-6 text-violet-400" />;
      case "pdf":
        return <FileText className="h-6 w-6 text-rose-500" />;
      case "doc":
        return <FileText className="h-6 w-6 text-blue-500" />;
      case "sheet":
        return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />;
      case "image":
        return <FileImage className="h-6 w-6 text-emerald-500" />;
      default:
        return <File className="h-6 w-6 text-slate-400" />;
    }
  };

  const renderPreview = () => {
    const isImg = isImageUrl(doc.file_url || doc.file_key, doc.file_type);

    if (isImg && doc.file_url) {
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

    return (
      <div className={`w-full h-full bg-gradient-to-br ${fileInfo.gradientClass} flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105`}>
        <div className="p-2 rounded-xl bg-white/10 border border-white/10 shadow-sm">
          {renderFileIcon()}
        </div>
        <span className={`text-[10px] font-black tracking-widest uppercase ${fileInfo.colorClass}`}>
          {fileInfo.label}
        </span>
      </div>
    );
  };

  return (
    <div
      id={`document-${doc.id}`}
      className={`group relative flex flex-col justify-between p-4 border rounded-2xl bg-[rgb(var(--ml-bg-secondary))] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:border-[rgb(var(--ml-text-primary))]/20 ${
        isHighlighted
          ? "border-[rgb(var(--ml-accent))] ring-2 ring-[rgb(var(--ml-accent))] shadow-[0_0_28px_rgba(var(--ml-accent),0.35)] scale-[1.01]"
          : "border-border/60"
      }`}
    >
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
                className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider ${fileInfo.badgeClass}`}
              >
                {fileInfo.label}
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
