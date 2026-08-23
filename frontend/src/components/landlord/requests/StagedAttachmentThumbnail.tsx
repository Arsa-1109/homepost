"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Eye, FileText, X } from "lucide-react";

export interface StagedAttachmentThumbnailProps {
  file: File;
  onRemove: () => void;
  onViewImage: (url: string) => void;
}

export function StagedAttachmentThumbnail({
  file,
  onRemove,
  onViewImage,
}: StagedAttachmentThumbnailProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const isImg = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);

  useEffect(() => {
    if (isImg) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, isImg]);

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isImg && previewUrl) {
      onViewImage(previewUrl);
    }
  };

  return (
    <div className="relative group/staged flex-shrink-0">
      {isImg && previewUrl ? (
        <div
          onClick={handleView}
          className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-dashed border-[rgb(var(--ml-accent))] overflow-hidden bg-[rgb(var(--ml-bg-primary))]/50 hover:border-[rgb(var(--ml-text-primary))]/50 transition-all cursor-pointer shadow-sm"
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
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="View preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-dashed border-[rgb(var(--ml-accent))] bg-[rgb(var(--ml-bg-primary))]/50 flex flex-col items-center justify-between p-2 shadow-sm select-none">
          <div className="flex-1 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[rgb(var(--ml-accent))]" />
          </div>
          <span className="text-[9px] text-[rgb(var(--ml-text-secondary))] font-semibold truncate w-full text-center" title={file.name}>
            {file.name}
          </span>
          <span className="text-[8px] text-[rgb(var(--ml-text-secondary))]/70 font-bold">
            {(file.size / 1024).toFixed(0)} KB
          </span>
        </div>
      )}

      {/* Remove Button Badge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-transform active:scale-90 z-20"
        title="Remove file"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
