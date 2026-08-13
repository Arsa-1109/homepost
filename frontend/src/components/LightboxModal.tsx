"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  FileText,
  File,
  FileCode,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function isImageUrl(url: string, fileType?: string): boolean {
  if (fileType?.startsWith("image/")) return true;
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  const pathPart = url.split("?")[0].toLowerCase();

  // Explicit non-image extension check to prevent false positives
  if (
    pathPart.match(
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|txt|csv|json|xml)$/i,
    )
  ) {
    return false;
  }

  // Image extension check
  if (pathPart.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff|avif)$/i)) {
    return true;
  }

  return (
    pathPart.includes("/image/") ||
    pathPart.includes("/images/") ||
    pathPart.includes("image=")
  );
}

export function isPdfUrl(url: string, fileType?: string): boolean {
  if (fileType === "application/pdf") return true;
  if (!url) return false;
  const pathPart = url.split("?")[0].toLowerCase();
  return (
    pathPart.endsWith(".pdf") ||
    pathPart.includes("/pdf/") ||
    pathPart.includes("type=pdf")
  );
}

export function isTextUrl(url: string, fileType?: string): boolean {
  if (fileType?.startsWith("text/")) return true;
  if (!url) return false;
  const pathPart = url.split("?")[0].toLowerCase();
  return /\.(txt|csv|json|log|md|xml)$/i.test(pathPart);
}

export function getFriendlyFileName(url: string) {
  try {
    const pathPart = url.split("?")[0];
    const decodedPath = decodeURIComponent(pathPart);
    const baseName = decodedPath.split("/").pop() || "";
    if (!baseName) return "Document";

    const lastDot = baseName.lastIndexOf(".");
    const ext = lastDot > -1 ? baseName.substring(lastDot) : "";

    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = baseName.match(uuidRegex);

    if (match) {
      const uuidStr = match[0];
      let nameWithoutUuid = baseName.replace(uuidStr, "");

      if (ext && nameWithoutUuid.endsWith(ext)) {
        nameWithoutUuid = nameWithoutUuid.slice(0, -ext.length);
      }

      nameWithoutUuid = nameWithoutUuid.replace(/^[-_.]+|[-_.]+$/g, "");

      if (!nameWithoutUuid.trim()) {
        const isImg = isImageUrl(url);
        return isImg ? `Photo${ext}` : `Document${ext}`;
      }

      if (nameWithoutUuid.length > 20) {
        return `${nameWithoutUuid.substring(0, 18)}...${ext}`;
      }
      return `${nameWithoutUuid}${ext}`;
    }

    const namePart = lastDot > -1 ? baseName.substring(0, lastDot) : baseName;
    if (namePart.length > 20) {
      return `${namePart.substring(0, 18)}...${ext}`;
    }
    return baseName;
  } catch (e) {
    return "Document";
  }
}

export interface LightboxModalProps {
  url: string;
  title?: string;
  fileType?: string;
  onClose: () => void;
  onDownload?: () => void;
}

export function LightboxModal({
  url,
  title,
  fileType,
  onClose,
  onDownload,
}: LightboxModalProps) {
  const displayTitle = title || getFriendlyFileName(url);
  const isImage = isImageUrl(url, fileType);
  const isPdf = isPdfUrl(url, fileType);
  const isText = isTextUrl(url, fileType);

  // Zoom & Pan state for images
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);

  const handleZoomIn = () =>
    setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3));
  const handleZoomOut = () =>
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragDistance.current = 0;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    dragDistance.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (isImage) {
        if (e.key === "+" || e.key === "=") handleZoomIn();
        if (e.key === "-" || e.key === "_") handleZoomOut();
        if (e.key === "0") handleResetZoom();
      }
    };

    // Lock body scroll while lightbox is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose, isImage]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/92 backdrop-blur-md p-3 sm:p-6 cursor-pointer"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl flex items-center justify-between gap-4 z-50 py-2 px-3 sm:px-5 rounded-2xl bg-[#151515]/90 border border-white/10 backdrop-blur-md text-white shadow-xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
            {isImage ? (
              <FileImage className="w-4 h-4 text-emerald-400" />
            ) : isPdf ? (
              <FileText className="w-4 h-4 text-rose-400" />
            ) : isText ? (
              <FileCode className="w-4 h-4 text-blue-400" />
            ) : (
              <File className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="min-w-0">
            <h3
              className="text-xs sm:text-sm font-bold truncate text-white"
              title={displayTitle}
            >
              {displayTitle}
            </h3>
            <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
              {isImage
                ? "Image Preview"
                : isPdf
                  ? "PDF Document"
                  : isText
                    ? "Text Document"
                    : "File"}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom controls for image */}
          {isImage && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={handleResetZoom}
                className="px-2 text-[11px] font-bold text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Reset Zoom (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Open in New Window */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open raw file in new tab"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>

          {/* Download Button */}
          {onDownload ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="h-8 sm:h-9 px-3 gap-1.5 text-xs font-bold text-[rgb(var(--ml-accent))] hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 sm:h-9 px-3 gap-1.5 text-xs font-bold text-[rgb(var(--ml-accent))] hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
            >
              <a
                href={url}
                download={displayTitle}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            </Button>
          )}

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20 rounded-xl bg-white/10 cursor-pointer"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Main Content Area — clicking anywhere outside the actual media elements closes the modal */}
      <div
        className="relative flex-1 w-full max-w-6xl flex items-center justify-center py-3 overflow-hidden cursor-pointer"
        onClick={onClose}
      >
        {isImage ? (
          <div
            className="relative flex items-center justify-center w-full h-full select-none cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
            onMouseDown={handleMouseDown}
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: zoom }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              src={url}
              alt={displayTitle}
              className={`object-contain max-w-full max-h-[78vh] w-auto h-auto rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-white/10 ${
                zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              }`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
                willChange: "transform",
              }}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : isPdf ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full max-h-[82vh] rounded-2xl overflow-hidden bg-[#1e1e1e] border border-white/10 shadow-2xl flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-2xl border-0 bg-white"
              title={displayTitle}
            />
          </motion.div>
        ) : isText ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full max-h-[82vh] rounded-2xl overflow-hidden bg-[#181818] border border-white/10 shadow-2xl p-4 sm:p-6 text-white cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={url}
              className="w-full h-full rounded-xl border-0 bg-white/5 text-white"
              title={displayTitle}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md p-8 rounded-3xl bg-[#181818] border border-white/10 shadow-2xl text-center space-y-5 text-white cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
              <File className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4
                className="text-lg font-bold text-white truncate px-2"
                title={displayTitle}
              >
                {displayTitle}
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Direct in-browser preview is not supported for this file format.
                You can download the file to view it on your device.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              {onDownload ? (
                <Button
                  onClick={onDownload}
                  className="w-full rounded-xl bg-[rgb(var(--ml-accent))] text-black font-bold text-xs gap-2 h-10 hover:bg-[rgb(var(--ml-accent))]/90 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full rounded-xl bg-[rgb(var(--ml-accent))] text-black font-bold text-xs gap-2 h-10 hover:bg-[rgb(var(--ml-accent))]/90 cursor-pointer shadow-md"
                >
                  <a
                    href={url}
                    download={displayTitle}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Subtle Bottom Instruction Hint */}
      <div className="text-[11px] font-medium text-white/40 text-center py-1 select-none pointer-events-none">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[10px]">
          Esc
        </kbd>{" "}
        or click background to close
      </div>
    </motion.div>,
    document.body,
  );
}
