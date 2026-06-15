"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const accentThemes = [
  { name: "Amber (Default)", rgb: "245 158 11", hex: "#f59e0b" },
  { name: "True Orange", rgb: "249 115 22", hex: "#f97316" },
  { name: "Sunset Coral", rgb: "255 107 53", hex: "#ff6b35" },
  { name: "Bronze Rust", rgb: "180 83 9", hex: "#b45309" },
  { name: "Neon Peach", rgb: "251 146 60", hex: "#fb923c" },
  { name: "Solar Flare", rgb: "253 186 116", hex: "#fdba74" },
  { name: "Mandarin Spice", rgb: "243 90 4", hex: "#f35a04" },
  { name: "Chardonnay Gold", rgb: "253 224 71", hex: "#fde047" },
  { name: "Azure Blue", rgb: "59 130 246", hex: "#3b82f6" },
  { name: "Electric Cyan", rgb: "6 182 212", hex: "#06b6d4" },
  { name: "Cyber Turquoise", rgb: "34 211 238", hex: "#22d3ee" },
  { name: "Ocean Teal", rgb: "13 148 136", hex: "#0d9488" },
  { name: "Emerald Green", rgb: "16 185 129", hex: "#10b981" },
  { name: "Mint Glow", rgb: "52 211 153", hex: "#34d399" },
  { name: "Lime Glow", rgb: "132 204 22", hex: "#84cc16" },
  { name: "Neon Lime", rgb: "163 230 53", hex: "#a3e635" },
  { name: "Amethyst", rgb: "139 92 246", hex: "#8b5cf6" },
  { name: "Electric Indigo", rgb: "99 102 241", hex: "#6366f1" },
  { name: "Deep Orchid", rgb: "168 85 247", hex: "#a855f7" },
  { name: "Cosmic Lavender", rgb: "216 180 254", hex: "#d8b4fe" },
  { name: "Fuchsia Pink", rgb: "217 70 239", hex: "#d946ef" },
  { name: "Rose Gold", rgb: "244 63 94", hex: "#f43f5e" },
  { name: "Wild Orchid", rgb: "236 72 153", hex: "#ec4899" },
  { name: "Crimson Red", rgb: "220 38 38", hex: "#dc2626" },
  { name: "Lunar Silver", rgb: "228 228 231", hex: "#e4e4e7" },
];

export function ThemeColorSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAccent, setActiveAccent] = useState(accentThemes[0].rgb);

  const updateThemeStyles = (accentRgb: string) => {
    let styleEl = document.getElementById("theme-selector-overrides");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "theme-selector-overrides";
      document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
      :root {
        --ml-accent: ${accentRgb};
        --accent: rgb(${accentRgb});
      }
    `;
    
    // Clean up any old inline styles that might be breaking the mode switch
    document.documentElement.style.removeProperty("--ml-accent");
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--ml-bg-primary");
    document.documentElement.style.removeProperty("--background");
    document.body.style.removeProperty("background-color");
  };

  const applyAccent = (rgb: string) => {
    setActiveAccent(rgb);
    updateThemeStyles(rgb);
  };

  // Run once on mount to apply initial theme override if necessary
  useEffect(() => {
    updateThemeStyles(activeAccent);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[999] flex flex-col items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.03)] overflow-hidden w-[300px]"
          >
            <div className="p-4 border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4" style={{ color: `rgb(${activeAccent})` }} />
                Theme Accent Color
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 font-sans">
                Select from 25 premium accent glows to customize your experience.
              </p>
            </div>
            
            <div className="p-2 flex flex-col max-h-[320px] overflow-y-auto custom-scrollbar">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Accent Glow Options
              </div>
              {accentThemes.map((theme) => (
                <button
                  key={theme.rgb}
                  type="button"
                  onClick={() => applyAccent(theme.rgb)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 w-full text-left group",
                    activeAccent === theme.rgb
                      ? "bg-accent/10 font-medium"
                      : "text-foreground hover:bg-muted/50"
                  )}
                  style={{ 
                    color: activeAccent === theme.rgb ? `rgb(${theme.rgb})` : undefined 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/10"
                      style={{ backgroundColor: theme.hex }}
                    />
                    <span>{theme.name}</span>
                  </div>
                  {activeAccent === theme.rgb && (
                    <motion.div
                      layoutId="themeSelectorCheckAccent"
                      className="text-white p-1 rounded-full shadow-sm"
                      style={{ backgroundColor: `rgb(${theme.rgb})` }}
                    >
                      <Check className="w-3 h-3" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-3.5 bg-card/90 backdrop-blur-md border border-border shadow-xl rounded-full text-sm font-medium hover:bg-card hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Palette className="w-4 h-4" style={{ color: `rgb(${activeAccent})` }} />
        <span className="hidden sm:inline tracking-tight font-semibold">Theme Color</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp className="w-4 h-4 opacity-50" />
        </motion.div>
      </button>
    </div>
  );
}
