"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ArrowLeftRight, 
  LogOut, 
  ChevronDown, 
  Building2,
  Home
} from "lucide-react";
import { startDemoSession, exitDemoSession } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

interface DemoHeaderMenuProps {
  role: "landlord" | "tenant";
  name: string;
  email: string;
  initials: string;
  isMobile?: boolean;
}

export function DemoHeaderMenu({
  role,
  name,
  email,
  initials,
  isMobile = false,
}: DemoHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLandlord = role === "landlord";
  const targetRole = isLandlord ? "tenant" : "owner";
  const targetRoleLabel = isLandlord ? "Switch to Resident Demo" : "Switch to Owner Demo";
  const roleDisplayTitle = isLandlord ? "Property Owner" : "Resident";
  const RoleIcon = isLandlord ? Building2 : Home;

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSwitchPersona = () => {
    setIsOpen(false);
    startDemoSession(targetRole);
    window.location.href = isLandlord ? "/tenant/dashboard" : "/landlord/dashboard";
  };

  const handleExitDemo = () => {
    setIsOpen(false);
    exitDemoSession();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Demo mode options"
        className={cn(
          "flex items-center gap-2 rounded-full border transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ml-accent))] active:scale-[0.98]",
          "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800",
          isMobile ? "pl-1 pr-2 py-0.5" : "pl-1.5 pr-2.5 py-1"
        )}
      >
        {/* Avatar Circle */}
        <div
          className={cn(
            "rounded-full text-white font-bold flex items-center justify-center bg-gradient-to-tr shadow-inner shrink-0",
            isMobile ? "w-6 h-6 text-[10px]" : "w-6 h-6 text-[10px]",
            isLandlord ? "from-amber-500 to-orange-500" : "from-purple-500 to-indigo-500"
          )}
        >
          {initials}
        </div>

        {/* Desktop Name */}
        {!isMobile && (
          <span className="font-semibold text-[rgb(var(--ml-text-primary))] text-xs leading-none max-w-[110px] truncate hidden sm:inline">
            {name}
          </span>
        )}

        {/* DEMO Tag */}
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border leading-none shrink-0",
            isLandlord
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
              : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
          )}
        >
          DEMO
        </span>

        {/* Dropdown Chevron */}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-[rgb(var(--ml-text-secondary))] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-[rgb(var(--ml-text-primary))]"
          )}
        />
      </button>

      {/* Popover / Dropdown Menu (Solid opaque background, no glassmorphism) */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-[100] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          {/* Persona Details Header */}
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 relative">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isLandlord ? "bg-amber-400" : "bg-purple-400")} />
                <span className={cn("relative inline-flex rounded-full h-2 w-2", isLandlord ? "bg-amber-500" : "bg-purple-500")} />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Demo Session Active
              </span>
            </div>
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <RoleIcon className={cn("w-3.5 h-3.5", isLandlord ? "text-amber-500" : "text-purple-400")} />
              <span>{name}</span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {email}
            </div>
            <div className="mt-1.5">
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700">
                Viewing as {roleDisplayTitle}
              </span>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="p-1.5 space-y-1 bg-white dark:bg-zinc-900">
            <button
              type="button"
              role="menuitem"
              onClick={handleSwitchPersona}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[rgb(var(--ml-accent))] rounded-xl transition-colors cursor-pointer text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 group-hover:border-[rgb(var(--ml-accent))]/40">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">{targetRoleLabel}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                  {isLandlord ? "Switch to Sarah Jenkins (Resident)" : "Switch to Marcus Vance (Owner)"}
                </span>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleExitDemo}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/20">
                <LogOut className="w-3.5 h-3.5 text-red-500" />
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">Exit Demo Mode</span>
                <span className="text-[10px] text-red-500/70 dark:text-red-400/70 font-normal">
                  Return to homepage
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
