"use client";

import { useEffect } from "react";
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
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 focus:outline-none border border-white/10"
        aria-label="Close preview"
      >
        <X className="w-5 h-5" />
      </button>

      <div 
        className="relative max-w-[90vw] max-h-[80vh] md:max-w-[80vw] md:max-h-[85vh] flex flex-col items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.img 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
          src={url} 
          alt="Full resolution attachment" 
          className="object-contain max-w-full max-h-[75vh] rounded-lg shadow-2xl border border-white/10 select-none"
        />
        
        <div className="mt-4 flex items-center gap-4 bg-[#1a1a1a]/95 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-lg">
          <span className="text-xs text-white/80 font-medium truncate max-w-[200px] sm:max-w-xs" title={url.split('?')[0].split('/').pop() || "Attachment"}>
            {friendlyName}
          </span>
          <div className="w-[1px] h-3 bg-white/25" />
          <a 
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--ml-accent))] hover:text-foreground font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
    </motion.div>
  );
}
