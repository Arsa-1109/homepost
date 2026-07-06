"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Info, Trash2, RefreshCcw } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  confirmBtn: string;
}> = {
  danger: {
    icon: <Trash2 className="w-5 h-5 text-red-400" />,
    iconBg: "bg-red-500/10 border border-red-500/20",
    confirmBtn: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    iconBg: "bg-amber-500/10 border border-amber-500/20",
    confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20",
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-400" />,
    iconBg: "bg-blue-500/10 border border-blue-500/20",
    confirmBtn: "bg-[rgb(var(--ml-accent))] hover:opacity-90 text-white shadow-lg shadow-[rgb(var(--ml-accent))]/20",
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cfg = variantConfig[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onCancel}
          />

          {/* Dialog Wrapper (flex centered) */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
          >
            <div className="w-full max-w-sm rounded-2xl border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-secondary))] shadow-2xl p-6 flex flex-col gap-4 pointer-events-auto">
              {/* Icon + Title */}
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${cfg.iconBg}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 pt-0.5">
                  <h2 id="confirm-title" className="text-base font-semibold text-[rgb(var(--ml-text-primary))] leading-snug">
                    {title}
                  </h2>
                  <p id="confirm-desc" className="text-sm text-[rgb(var(--ml-text-secondary))] mt-1 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-[rgb(var(--ml-border))] text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))] transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${cfg.confirmBtn}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
