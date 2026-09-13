"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { IconButton } from "./Button";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Secondary line under the title — stage, id, address. */
  subtitle?: React.ReactNode;
  /** Pinned action row at the bottom. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: "md" | "lg";
}

/**
 * Right-hand detail panel. Reps triage a list without navigating away, so this
 * traps focus, closes on Escape, and restores focus to whatever opened it.
 */
export function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  width = "md",
}: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const preferred = panel?.querySelector<HTMLElement>("[data-autofocus]");
    if (preferred) preferred.focus();
    else panel?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="animate-scrim-in absolute inset-0 cursor-default bg-structural/35"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={clsx(
          "animate-panel-in relative flex h-full w-full flex-col border-l border-rule-firm bg-canvas shadow-[-8px_0_24px_rgba(16,25,43,0.13)]",
          width === "lg" ? "sm:w-[640px]" : "sm:w-[520px]",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-rule bg-surface px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>
            {subtitle && <div className="mt-1 flex flex-wrap items-center gap-2">{subtitle}</div>}
          </div>
          <IconButton label="Close panel" onClick={onClose} data-autofocus>
            <X className="size-4" strokeWidth={2} />
          </IconButton>
        </header>

        <div className="scrollbar-slim flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer && (
          <footer className="flex flex-wrap items-center gap-2 border-t border-rule bg-surface px-4 py-3 sm:px-5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/* ── Layout helpers used inside panels ──────────────────────────────────── */

export function PanelSection({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-tiny font-semibold tracking-wide text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Definition row. Values are tabular where they're numeric. */
export function Field({
  label,
  children,
  numeric = false,
}: {
  label: string;
  children: React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule/60 py-1.5 last:border-0">
      <dt className="shrink-0 text-tiny text-muted">{label}</dt>
      <dd className={clsx("text-right text-sm text-ink", numeric && "tnum")}>{children}</dd>
    </div>
  );
}

export function FieldList({ children }: { children: React.ReactNode }) {
  return <dl className="rounded border border-rule bg-surface px-3 py-1">{children}</dl>;
}
