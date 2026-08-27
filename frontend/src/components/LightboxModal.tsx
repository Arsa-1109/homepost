"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  FileImage,
  Video,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function isVideoUrl(url: string, fileType?: string): boolean {
  if (fileType?.startsWith("video/")) return true;
  if (!url) return false;
  if (url.startsWith("data:video/")) return true;
  const lowerUrl = url.toLowerCase();
  const pathPart = lowerUrl.split("?")[0];
  return (
    /\.(mp4|webm|mov|m4v|ogv|ogg|3gp|mkv|avi)$/i.test(pathPart) ||
    lowerUrl.includes("/video/") ||
    lowerUrl.includes("/videos/") ||
    lowerUrl.includes("video=") ||
    lowerUrl.includes("type=video")
  );
}

export function isImageUrl(url: string, fileType?: string): boolean {
  if (fileType?.startsWith("image/")) return true;
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  const pathPart = url.split("?")[0].toLowerCase();

  // Explicit non-image extension check to prevent false positives
  if (
    pathPart.match(
      /\.(pdf|doc|docx|xls|xlsx|csv|txt|mp4|webm|mov|m4v|ogv|ogg|3gp|mkv|zip|rar)$/i,
    )
  ) {
    return false;
  }

  // Image extension check
  if (pathPart.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff|heic|heif|avif)$/i)) {
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

export function isSpreadsheetUrl(url: string, fileType?: string): boolean {
  if (
    fileType?.includes("spreadsheet") ||
    fileType?.includes("excel") ||
    fileType === "text/csv"
  ) {
    return true;
  }
  if (!url) return false;
  const pathPart = url.split("?")[0].toLowerCase();
  return /\.(xlsx|xls|csv)$/i.test(pathPart);
}

export function isDocUrl(url: string, fileType?: string): boolean {
  if (
    fileType?.includes("word") ||
    fileType?.includes("officedocument") ||
    fileType?.includes("msword") ||
    fileType?.includes("opendocument") ||
    fileType?.startsWith("text/")
  ) {
    return true;
  }
  if (!url) return false;
  const pathPart = url.split("?")[0].toLowerCase();
  return /\.(doc|docx|odt|pages|rtf|txt)$/i.test(pathPart);
}

export type FileCategory =
  | "image"
  | "video"
  | "pdf"
  | "doc"
  | "sheet"
  | "file";

export interface FileTypeInfo {
  category: FileCategory;
  label: string;
  colorClass: string;
  badgeClass: string;
  gradientClass: string;
}

export function getFileTypeInfo(url: string, fileType?: string): FileTypeInfo {
  if (isVideoUrl(url, fileType)) {
    return {
      category: "video",
      label: "VIDEO",
      colorClass: "text-violet-400",
      badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      gradientClass: "from-violet-500/15 via-purple-500/10 to-violet-950/20",
    };
  }

  if (isPdfUrl(url, fileType)) {
    return {
      category: "pdf",
      label: "PDF",
      colorClass: "text-rose-500",
      badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      gradientClass: "from-rose-500/15 via-red-500/10 to-rose-950/20",
    };
  }

  if (isImageUrl(url, fileType)) {
    return {
      category: "image",
      label: "Image",
      colorClass: "text-emerald-500",
      badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      gradientClass: "from-emerald-500/15 via-green-500/10 to-emerald-950/20",
    };
  }

  if (isDocUrl(url, fileType)) {
    return {
      category: "doc",
      label: "DOC",
      colorClass: "text-blue-500",
      badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      gradientClass: "from-blue-500/15 via-sky-500/10 to-blue-950/20",
    };
  }

  if (isSpreadsheetUrl(url, fileType)) {
    return {
      category: "sheet",
      label: "SHEET",
      colorClass: "text-emerald-400",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      gradientClass: "from-emerald-500/15 via-teal-500/10 to-emerald-950/20",
    };
  }

  return {
    category: "file",
    label: "File",
    colorClass: "text-slate-400",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    gradientClass: "from-slate-500/15 via-zinc-500/10 to-slate-950/20",
  };
}

export function getFriendlyFileName(url: string, fileType?: string) {
  try {
    const fileInfo = getFileTypeInfo(url, fileType);
    const pathPart = url.split("?")[0];
    const decodedPath = decodeURIComponent(pathPart);
    const baseName = decodedPath.split("/").pop() || "";

    const lastDot = baseName.lastIndexOf(".");
    const ext = lastDot > -1 ? baseName.substring(lastDot) : "";

    const getDefaultFallback = () => {
      switch (fileInfo.category) {
        case "image":
          return `Image${ext || ".jpg"}`;
        case "video":
          return `Video${ext || ".mp4"}`;
        case "pdf":
          return `Document${ext || ".pdf"}`;
        case "doc":
          return `Document${ext || ".docx"}`;
        case "sheet":
          return `Spreadsheet${ext || ".xlsx"}`;
        default:
          return `File${ext}`;
      }
    };

    if (!baseName) return getDefaultFallback();

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
        return getDefaultFallback();
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
    const fileInfo = getFileTypeInfo(url, fileType);
    switch (fileInfo.category) {
      case "image":
        return "Image.jpg";
      case "video":
        return "Video.mp4";
      case "pdf":
        return "Document.pdf";
      case "doc":
        return "Document.docx";
      case "sheet":
        return "Spreadsheet.xlsx";
      default:
        return "File";
    }
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
  const displayTitle = title || getFriendlyFileName(url, fileType);
  const fileInfo = getFileTypeInfo(url, fileType);
  const isImage = isImageUrl(url, fileType);
  const isVideo = isVideoUrl(url, fileType);
  const isPdf = isPdfUrl(url, fileType);

  // Zoom & Pan state for images
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);

  // Mobile Touch gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const initialDistanceRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const [swipeOffsetY, setSwipeOffsetY] = useState(0);

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
    setSwipeOffsetY(0);
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

  // Mobile Touch Event Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      // Double-tap zoom toggle
      if (now - lastTapRef.current < 300 && isImage) {
        if (zoom > 1) {
          handleResetZoom();
        } else {
          setZoom(2);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      touchStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
        time: now,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2 && isImage) {
      // 2-Finger Pinch start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (zoom > 1) {
        // Pan image when zoomed
        setPosition({
          x: touch.clientX - touchStartRef.current.x,
          y: touch.clientY - touchStartRef.current.y,
        });
      } else if (zoom === 1) {
        // Swipe down to dismiss gesture when unzoomed
        const deltaY = touch.clientY - touchStartRef.current.y;
        if (deltaY > 0) {
          setSwipeOffsetY(deltaY);
        }
      }
    } else if (e.touches.length === 2 && initialDistanceRef.current !== null && isImage) {
      // 2-Finger Pinch scaling
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / initialDistanceRef.current;
      setZoom((prev) => Math.min(Math.max(Number((prev * scaleFactor).toFixed(2)), 0.5), 3));
      initialDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialDistanceRef.current = null;
    if (zoom === 1 && swipeOffsetY > 100) {
      onClose();
    } else {
      setSwipeOffsetY(0);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (isImage) {
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-" || e.key === "_") handleZoomOut();
      if (e.key === "0") handleResetZoom();
    }
  }, [onClose, isImage, handleZoomIn, handleZoomOut, handleResetZoom]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [handleKeyDown]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/92 backdrop-blur-md p-3 sm:p-6 cursor-pointer touch-none select-none"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl flex items-center justify-between gap-2.5 sm:gap-4 z-50 py-2 px-3 sm:px-5 rounded-2xl bg-[#151515]/95 border border-white/10 backdrop-blur-md text-white shadow-xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
            {fileInfo.category === "image" ? (
              <FileImage className="w-4 h-4 text-emerald-400" />
            ) : fileInfo.category === "video" ? (
              <Video className="w-4 h-4 text-violet-400" />
            ) : fileInfo.category === "pdf" ? (
              <FileText className="w-4 h-4 text-rose-400" />
            ) : fileInfo.category === "doc" ? (
              <FileText className="w-4 h-4 text-blue-400" />
            ) : fileInfo.category === "sheet" ? (
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            ) : (
              <File className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-xs sm:text-sm font-bold truncate text-white"
              title={displayTitle}
            >
              {displayTitle}
            </h3>
            <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold truncate">
              {fileInfo.category === "image"
                ? "Image Preview"
                : fileInfo.category === "video"
                  ? "Video Preview"
                  : fileInfo.category === "pdf"
                    ? "PDF Document"
                    : fileInfo.category === "doc"
                      ? "Word Document"
                      : fileInfo.category === "sheet"
                        ? "Spreadsheet"
                        : "File"}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom controls for image - Desktop only */}
          {isImage && (
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                title="Zoom Out (-)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={handleResetZoom}
                className="px-2 text-[11px] font-bold text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Reset Zoom (0)"
                aria-label="Reset zoom"
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
                aria-label="Zoom in"
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
            className="size-8 sm:size-9 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer touch-manipulation"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open raw file in new tab"
              aria-label="Open raw file in new tab"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>

          {/* Download Button */}
          {onDownload ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="size-8 sm:size-9 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer touch-manipulation"
              title="Download file"
              aria-label="Download file"
            >
              <Download className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 sm:size-9 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer touch-manipulation"
            >
              <a
                href={url}
                download={displayTitle}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Download file"
                aria-label="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            </Button>
          )}

          {/* Close Modal Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 sm:size-9 text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer touch-manipulation"
            title="Close viewer (Esc)"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
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
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              src={url}
              alt={displayTitle}
              className={`object-contain max-w-full max-h-[78vh] w-auto h-auto rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-white/10 ${
                zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              }`}
              style={{
                transform: `translate(${position.x}px, ${position.y + swipeOffsetY}px) scale(${zoom})`,
                opacity: swipeOffsetY > 0 ? Math.max(1 - swipeOffsetY / 300, 0.4) : 1,
                transition: isDragging ? "none" : "transform 0.15s ease-out, opacity 0.15s ease-out",
                willChange: "transform, opacity",
              }}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : isVideo ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center max-h-[82vh] max-w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] max-w-full rounded-2xl outline-none"
            >
              Your browser does not support the video tag.
            </video>
          </motion.div>
        ) : isPdf ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full max-h-[82vh] rounded-2xl overflow-hidden bg-[#1e1e1e] border border-white/10 shadow-2xl flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-2xl border-0 bg-white"
              title={displayTitle}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
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
                    onClick={(e) => e.stopPropagation()}
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

      {/* Mobile Floating Zoom Reset Pill (only when zoomed) */}
      {isImage && zoom !== 1 && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            handleResetZoom();
          }}
          className="sm:hidden absolute bottom-14 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151515]/95 border border-white/20 text-xs font-bold text-white shadow-xl backdrop-blur-md cursor-pointer animate-in fade-in zoom-in-95 duration-200"
        >
          <span>{Math.round(zoom * 100)}%</span>
          <span className="text-white/40">•</span>
          <span className="text-[rgb(var(--ml-accent))] text-[11px] font-semibold">Tap to Reset</span>
        </div>
      )}

      {/* Responsive Bottom Instruction Hint */}
      <div className="text-[11px] font-medium text-white/50 text-center py-1 select-none pointer-events-none px-4">
        <span className="hidden sm:inline">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[10px]">
            Esc
          </kbd>{" "}
          or click background to close
        </span>
        <span className="sm:hidden">
          {isImage
            ? "Pinch / double-tap to zoom • Swipe down to close"
            : "Tap background to close"}
        </span>
      </div>
    </motion.div>,
    document.body,
  );
}
