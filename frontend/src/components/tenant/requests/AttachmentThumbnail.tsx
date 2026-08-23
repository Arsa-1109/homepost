"use client";

import React from "react";
import Image from "next/image";
import { Eye, DownloadIcon, FileText } from "lucide-react";
import { getFriendlyFileName, isImageUrl } from "@/components/LightboxModal";

export interface AttachmentThumbnailProps {
  url: string;
  onViewImage: (url: string) => void;
}

export function AttachmentThumbnail({ url, onViewImage }: AttachmentThumbnailProps) {
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
        <Image
          src={url}
          alt={friendlyName}
          fill
          sizes="(max-width: 640px) 80px, 96px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
          <button
            type="button"
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
      <span
        className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-semibold truncate w-full text-center"
        title={rawFileName}
      >
        {friendlyName}
      </span>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl z-10">
        <button
          type="button"
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
