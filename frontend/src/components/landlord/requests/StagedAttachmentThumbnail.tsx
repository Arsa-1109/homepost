"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Eye,
  FileText,
  FileImage,
  Video,
  FileSpreadsheet,
  File,
  X,
} from "lucide-react";
import { getFileTypeInfo, isImageUrl, isVideoUrl } from "@/components/LightboxModal";

export interface StagedAttachmentThumbnailProps {
  file: File;
  onRemove: () => void;
  onViewImage: (url: string) => void;
  className?: string;
}

export function StagedAttachmentThumbnail({
  file,
  onRemove,
  onViewImage,
  className = "",
}: StagedAttachmentThumbnailProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const isImg = isImageUrl(file.name, file.type);
  const isVid = isVideoUrl(file.name, file.type);
  const fileInfo = getFileTypeInfo(file.name, file.type);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewUrl) {
      onViewImage(previewUrl);
    }
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

  return (
    <div className={`relative group/staged flex-shrink-0 ${className}`}>
      {isImg && previewUrl ? (
        <div
          onClick={handleView}
          className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-dashed border-[rgb(var(--ml-accent))] overflow-hidden bg-[rgb(var(--ml-bg-primary))]/50 hover:border-[rgb(var(--ml-text-primary))]/50 transition-all duration-200 cursor-pointer shadow-sm"
        >
          <Image
            src={previewUrl}
            alt={file.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleView}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer active:scale-95"
              title="Preview file"
              aria-label="Preview file"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleView}
          className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-dashed border-[rgb(var(--ml-accent))] bg-gradient-to-br ${fileInfo.gradientClass} hover:border-[rgb(var(--ml-text-primary))]/50 transition-all duration-200 flex flex-col items-center justify-between p-2.5 cursor-pointer shadow-sm select-none`}
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
            className="text-[9px] text-[rgb(var(--ml-text-secondary))] font-semibold truncate w-full text-center group-hover:text-[rgb(var(--ml-text-primary))] transition-colors"
            title={file.name}
          >
            {file.name}
          </span>

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 rounded-2xl z-10">
            <button
              type="button"
              onClick={handleView}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer active:scale-95"
              title="Preview file"
              aria-label="Preview file"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Remove Button Badge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-transform active:scale-90 z-20 cursor-pointer"
        title="Remove file"
        aria-label="Remove file"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
