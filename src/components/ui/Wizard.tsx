"use client";

import { Check } from "lucide-react";
import { clsx } from "clsx";

export interface WizardStep {
  key: string;
  label: string;
  /** Short gloss shown under the label on the active step. */
  hint?: string;
}

/**
 * Numbered step rail. The brief permits numbers in exactly one place — a real
 * sequence — and the proposal builder is it.
 */
export function WizardRail({
  steps,
  current,
  onJump,
  className,
}: {
  steps: WizardStep[];
  current: number;
  /** Only completed steps are re-enterable. */
  onJump?: (index: number) => void;
  className?: string;
}) {
  return (
    <ol
      className={clsx(
        "flex flex-col gap-1 sm:flex-row sm:items-stretch sm:gap-0",
        className,
      )}
    >
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const reachable = done && Boolean(onJump);

        return (
          <li key={step.key} className="flex-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={reachable ? () => onJump!(i) : undefined}
              aria-current={active ? "step" : undefined}
              className={clsx(
                "flex w-full items-center gap-2.5 border-b-2 px-3 py-2.5 text-left transition-colors",
                active && "border-solar bg-solar-wash/45",
                done && "border-ok/45 hover:bg-canvas-sunk",
                !active && !done && "border-rule",
                !reachable && !active && "cursor-default",
              )}
            >
              <span
                className={clsx(
                  "tnum flex size-6 shrink-0 items-center justify-center rounded-full text-tiny font-bold",
                  active && "bg-solar text-[#241704]",
                  done && "bg-ok text-white",
                  !active && !done && "border border-rule-firm bg-surface text-faint",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={clsx(
                    "block truncate text-sm",
                    active ? "font-semibold text-ink" : done ? "font-medium text-ink-soft" : "text-muted",
                  )}
                >
                  {step.label}
                </span>
                {active && step.hint && (
                  <span className="mt-0.5 block text-micro text-muted">{step.hint}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Form row used inside wizard steps. */
export function WizardField({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-tiny text-muted">{hint}</p>}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  id?: string;
}) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded border border-rule-firm bg-surface focus-within:border-solar">
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tnum h-9 w-28 bg-transparent px-2.5 text-sm text-ink outline-none"
      />
      {suffix && (
        <span className="border-l border-rule bg-canvas-sunk px-2.5 py-2 text-tiny text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function RangeInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  id?: string;
}) {
  return (
    <input
      id={id}
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full max-w-sm cursor-pointer appearance-none rounded-full bg-rule accent-solar"
      style={{
        background: `linear-gradient(to right, var(--color-solar) 0%, var(--color-solar) ${
          ((value - min) / (max - min)) * 100
        }%, var(--color-rule) ${((value - min) / (max - min)) * 100}%, var(--color-rule) 100%)`,
      }}
    />
  );
}

/** Selectable equipment/financing card. */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  subtitle,
  right,
  note,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        "w-full rounded border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-solar bg-solar-wash/55 ring-1 ring-solar/35"
          : "border-rule bg-surface hover:border-rule-firm hover:bg-canvas-sunk/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={clsx("truncate text-sm", selected ? "font-semibold text-ink" : "font-medium text-ink")}>
            {title}
          </p>
          {subtitle && <p className="tnum mt-0.5 text-tiny text-muted">{subtitle}</p>}
        </div>
        {right && <div className="tnum shrink-0 text-right text-sm text-ink">{right}</div>}
      </div>
      {note && <p className="mt-1.5 text-tiny leading-relaxed text-muted">{note}</p>}
    </button>
  );
}
