import { clsx } from "clsx";
import { TONE_BADGE, TONE_DOT, type LabelSpec } from "@/lib/labels";
import type { StatusTone } from "@/lib/types";

interface StatusBadgeProps {
  /** Pass a label map entry — keeps wording identical everywhere. */
  spec?: LabelSpec;
  label?: string;
  tone?: StatusTone;
  /** Dots are an addition to the label, never a replacement for it. */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

/**
 * Labeled status pill. The brief is explicit: status is always a written
 * stage, so there is no variant of this that renders a bare color dot.
 */
export function StatusBadge({
  spec,
  label,
  tone,
  dot = false,
  size = "md",
  className,
  title,
}: StatusBadgeProps) {
  const text = spec?.label ?? label ?? "Unknown";
  const t: StatusTone = spec?.tone ?? tone ?? "idle";

  return (
    <span
      title={title ?? spec?.hint}
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-micro" : "px-2 py-[3px] text-tiny",
        TONE_BADGE[t],
        className,
      )}
    >
      {dot && <span className={clsx("size-1.5 shrink-0 rounded-full", TONE_DOT[t])} />}
      {text}
    </span>
  );
}

/** Numeric score chip — reads as data, not as a status. */
export function ScoreChip({ score }: { score: number }) {
  const tone: StatusTone = score >= 80 ? "ok" : score >= 60 ? "warn" : "danger";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tnum font-medium">{score}</span>
      <span className="h-1 w-10 overflow-hidden rounded-full bg-rule" aria-hidden="true">
        <span
          className={clsx(
            "block h-full rounded-full",
            tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-danger",
          )}
          style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
        />
      </span>
    </span>
  );
}
