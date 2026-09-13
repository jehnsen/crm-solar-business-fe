import { Check, CircleAlert, Clock, Minus } from "lucide-react";
import { clsx } from "clsx";
import type { StatusTone } from "@/lib/types";

export interface TrackerStep {
  key: string;
  label: string;
  state: "complete" | "current" | "blocked" | "upcoming";
  /** Right-hand detail — a date, an authority, a reference number. */
  meta?: string | null;
  note?: string | null;
}

/**
 * Horizontal status pipeline for contracts (4 states) and the compact
 * permitting read-out (6 states). Every node carries its written label — the
 * connector color alone never conveys state.
 */
export function PipelineTracker({
  steps,
  className,
}: {
  steps: TrackerStep[];
  className?: string;
}) {
  return (
    <ol className={clsx("flex flex-col gap-0 sm:flex-row", className)}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="flex flex-1 gap-2.5 sm:flex-col sm:gap-0">
            {/* Rail */}
            <div className="flex shrink-0 flex-col items-center sm:h-6 sm:w-full sm:flex-row">
              <Node state={step.state} />
              {!last && (
                <span
                  className={clsx(
                    "w-px flex-1 sm:h-px sm:w-auto sm:flex-1",
                    step.state === "complete" ? "bg-ok/50" : "bg-rule-firm",
                  )}
                />
              )}
            </div>

            {/* Label block */}
            <div className={clsx("min-w-0 pb-4 sm:pb-0 sm:pr-4 sm:pt-2", last && "sm:pr-0")}>
              <p
                className={clsx(
                  "text-tiny leading-snug",
                  step.state === "current" && "font-semibold text-ink",
                  step.state === "blocked" && "font-semibold text-danger",
                  step.state === "complete" && "font-medium text-ink-soft",
                  step.state === "upcoming" && "text-faint",
                )}
              >
                {step.label}
              </p>
              {step.meta && <p className="tnum mt-0.5 text-micro text-muted">{step.meta}</p>}
              {step.note && (
                <p className="mt-1 text-micro leading-relaxed text-muted">{step.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Node({ state }: { state: TrackerStep["state"] }) {
  const base = "flex size-6 shrink-0 items-center justify-center rounded-full border";
  if (state === "complete") {
    return (
      <span className={clsx(base, "border-ok bg-ok text-white")}>
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={clsx(base, "border-solar bg-solar text-[#241704]")}>
        <Clock className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span className={clsx(base, "border-danger bg-danger text-white")}>
        <CircleAlert className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className={clsx(base, "border-rule-firm bg-surface text-faint")}>
      <Minus className="size-3" strokeWidth={2.5} />
    </span>
  );
}

/** Compact N-of-M progress read-out for table cells. */
export function StepProgress({
  completed,
  total,
  tone = "info",
}: {
  completed: number;
  total: number;
  tone?: StatusTone;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={clsx(
              "h-3.5 w-[3px] rounded-full",
              i < completed
                ? tone === "danger"
                  ? "bg-danger"
                  : tone === "warn"
                    ? "bg-warn"
                    : "bg-ok"
                : "bg-rule-firm",
            )}
          />
        ))}
      </span>
      <span className="tnum text-tiny text-muted">
        {completed}/{total}
      </span>
    </span>
  );
}
