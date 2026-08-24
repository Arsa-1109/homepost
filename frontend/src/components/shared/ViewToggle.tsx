"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import type { ViewMode } from "@/hooks/useViewPreference";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/** Segmented Grid / Compact Table control with accessible pressed states. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const options: { mode: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
    { mode: "grid", label: "Grid view", Icon: LayoutGrid },
    { mode: "table", label: "Compact table view", Icon: Table2 },
  ];

  return (
    <div
      role="group"
      aria-label="View density"
      className="inline-flex items-center rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-secondary))] p-0.5 shrink-0"
    >
      {options.map(({ mode, label, Icon }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => onChange(mode)}
            className={`p-1.5 rounded-lg cursor-pointer transition-all duration-200 ease-out ${
              active
                ? "bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] shadow-sm"
                : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
