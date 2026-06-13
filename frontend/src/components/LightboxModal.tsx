"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, Download } from "lucide-react";

export function getFriendlyFileName(url: string) {
  try {
    const pathPart = url.split('?')[0];
    const decodedPath = decodeURIComponent(pathPart);
    const baseName = decodedPath.split('/').pop() || '';
    if (!baseName) return 'Document';
    
    const lastDot = baseName.lastIndexOf('.');
    const ext = lastDot > -1 ? baseName.substring(lastDot) : '';
    
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = baseName.match(uuidRegex);
    
    if (match) {
      const uuidStr = match[0];
      let nameWithoutUuid = baseName.replace(uuidStr, '');
      
      if (ext && nameWithoutUuid.endsWith(ext)) {
        nameWithoutUuid = nameWithoutUuid.slice(0, -ext.length);
      }
      
      nameWithoutUuid = nameWithoutUuid.replace(/^[-_.]+|[-_.]+$/g, '');
      
      if (!nameWithoutUuid.trim()) {
        const isImg = ext.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
        return isImg ? `Photo${ext}` : `Document${ext}`;
      }
      
      if (nameWithoutUuid.length > 12) {
        return `${nameWithoutUuid.substring(0, 10)}...${ext}`;
      }
      return `${nameWithoutUuid}${ext}`;
    }
    
    let namePart = lastDot > -1 ? baseName.substring(0, lastDot) : baseName;
    if (namePart.length > 12) {
      return `${namePart.substring(0, 10)}...${ext}`;
    }
    return baseName;
  } catch (e) {
    return 'Document';
  }
}

export function LightboxModal({ url, onClose }: { url: string; onClose: () => void }) {
  const friendlyName = getFriendlyFileName(url);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Lock body scroll while lightbox is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 focus:outline-none border border-white/10 backdrop-blur-sm"
        aria-label="Close preview"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image container — fills all available space, stops click from bubbling */}
      <div
        className="relative flex flex-col items-center justify-center w-full h-full px-6 py-16 gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ duration: 0.22, type: "spring", stiffness: 280, damping: 26 }}
          src={url}
          alt="Full resolution attachment"
          className="object-contain max-w-full max-h-[80vh] w-auto h-auto rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] border border-white/10 select-none"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Pill toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.2 }}
          className="flex items-center gap-4 bg-[#111]/90 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-sm shadow-xl min-w-[180px]"
        >
          <span
            className="text-xs text-white/75 font-medium truncate max-w-[180px] sm:max-w-[280px]"
            title={url.split("?")[0].split("/").pop() || "Attachment"}
          >
            {friendlyName}
          </span>
          <div className="w-px h-3.5 bg-white/20 shrink-0" />
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--ml-accent))] hover:text-white font-semibold transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}

