"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X 
} from "lucide-react";
import { format, parse, isValid, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");

  useEffect(() => {
    if (isOpen && containerRef.current && popoverRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      
      const spaceBelow = window.innerHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;
      
      if (spaceBelow < 340 && spaceAbove > spaceBelow) {
        setPosition("top");
      } else {
        setPosition("bottom");
      }
    }
  }, [isOpen]);

  // Parse initial selected date
  const selectedDate = value && isValid(parse(value, "yyyy-MM-dd", new Date()))
    ? parse(value, "yyyy-MM-dd", new Date())
    : null;

  const [currentMonth, setCurrentMonth] = useState<Date>(
    selectedDate || new Date()
  );

  // Sync currentMonth when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 0 = Sun, 1 = Mon ... adjust for Mon start
  let startDay = getDay(monthStart); 
  const paddingDays = startDay === 0 ? 6 : startDay - 1; // Mon-start grid

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-[rgb(var(--ml-bg-primary))]/60 focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/30 focus:outline-none px-4 h-11 rounded-xl text-sm font-medium cursor-pointer shadow-inner transition-all duration-200 ease-out active:scale-[0.98] border border-border/60 hover:border-[rgb(var(--ml-text-primary))]/40 hover:bg-[rgb(var(--ml-bg-tertiary))]",
          selectedDate ? "text-[rgb(var(--ml-text-primary))]" : "text-[rgb(var(--ml-text-secondary))]/60",
          className
        )}
      >
        <span className="truncate">
          {selectedDate ? format(selectedDate, "dd-MM-yyyy") : placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 text-[rgb(var(--ml-text-secondary))]">
          {selectedDate && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-white/10 hover:text-[rgb(var(--ml-text-primary))] transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <CalendarIcon className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
        </div>
      </button>

      {/* Premium Dark Glass Popover */}
      {isOpen && (
        <div 
          ref={popoverRef}
          className={cn(
            "absolute left-0 z-[150] w-[300px] max-w-[calc(100vw-2rem)] p-4 rounded-2xl bg-[rgb(var(--ml-bg-secondary))] border border-border/80 shadow-2xl shadow-black/90 backdrop-blur-2xl animate-scaleIn select-none",
            position === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          )}
        >
          {/* Calendar Header: Month + Nav */}
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-sm font-extrabold text-[rgb(var(--ml-text-primary))] tracking-wide">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg text-[rgb(var(--ml-text-secondary))] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg text-[rgb(var(--ml-text-secondary))] cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[11px] font-bold text-[rgb(var(--ml-text-secondary))] opacity-60 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty padding slots */}
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="w-9 h-9" />
            ))}

            {/* Month Days */}
            {daysInMonth.map((day) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold shadow-md shadow-[rgba(var(--ml-accent),0.35)] scale-105"
                      : isCurrentDay
                      ? "border border-[rgb(var(--ml-accent))]/60 text-[rgb(var(--ml-accent))] font-bold hover:bg-[rgb(var(--ml-accent))]/15"
                      : "text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-accent))]"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action */}
          <div className="mt-4 pt-3 border-t border-border/30 flex justify-between items-center px-1">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleSelectDay(today);
              }}
              className="text-xs font-bold text-[rgb(var(--ml-accent))] hover:underline cursor-pointer"
            >
              Today
            </button>
            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-xs font-bold text-[rgb(var(--ml-text-secondary))] hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
