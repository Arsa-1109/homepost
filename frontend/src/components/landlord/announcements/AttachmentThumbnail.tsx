"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Eye,
  Download,
  FileText,
  FileImage,
  Video,
  FileSpreadsheet,
  File,
} from "lucide-react";
import {
  getFriendlyFileName,
  getFileTypeInfo,
  isImageUrl,
} from "@/components/LightboxModal";

export interface AttachmentThumbnailProps {
  url: string;
  onViewImage: (url: string) => void;
  className?: string;
}

export function AttachmentThumbnail({
  url,
  onViewImage,
  className = "",
}: AttachmentThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const pathOnly = url.split("?")[0];
  const isImage = isImageUrl(url) && !hasError;
  const friendlyName = getFriendlyFileName(url);
  const rawFileName = pathOnly.split("/").pop() || "Attachment";
  const fileInfo = getFileTypeInfo(url);

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewImage(url);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderFileIcon = () => {
    switch (fileInfo.category) {
      case "video":
        return <Video className="w-5 h-5 text-violet-400" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-500" />;
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "sheet":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case "image":
        return <FileImage className="w-5 h-5 text-emerald-500" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  if (isImage) {
    return (
      <div
        onClick={handleView}
        className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border/60 overflow-hidden bg-[rgb(var(--ml-bg-primary))]/40 hover:border-[rgb(var(--ml-text-primary))]/30 transition-all duration-200 cursor-pointer flex-shrink-0 shadow-sm ${className}`}
      >
        <Image
          src={url}
          alt={friendlyName}
          fill
          unoptimized
          sizes="(max-width: 640px) 80px, 96px"
          onError={() => setHasError(true)}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <button
            type="button"
            onClick={handleView}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
            title="Preview file"
            aria-label="Preview file"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <a
            href={url}
            download={friendlyName}
            onClick={handleDownload}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
            title="Download file"
            aria-label="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleView}
      className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border/60 bg-gradient-to-br ${fileInfo.gradientClass} hover:border-[rgb(var(--ml-text-primary))]/30 transition-all duration-200 flex flex-col items-center justify-between p-2.5 cursor-pointer flex-shrink-0 select-none shadow-sm ${className}`}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        <div className="p-1.5 rounded-xl bg-white/10 border border-white/10 shadow-xs">
          {renderFileIcon()}
        </div>
        <span
          className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.2 rounded-md ${fileInfo.badgeClass}`}
        >
          {fileInfo.label}
        </span>
      </div>

      <span
        className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-semibold truncate w-full text-center group-hover:text-[rgb(var(--ml-text-primary))] transition-colors"
        title={rawFileName}
      >
        {friendlyName}
      </span>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl z-10">
        <button
          type="button"
          onClick={handleView}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
          title="Preview file"
          aria-label="Preview file"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <a
          href={url}
          download={friendlyName}
          onClick={handleDownload}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/10 active:scale-95 cursor-pointer"
          title="Download file"
          aria-label="Download file"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
