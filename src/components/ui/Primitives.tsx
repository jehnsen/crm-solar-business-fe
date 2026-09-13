import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { TONE_BAR, TONE_DOT, TONE_TEXT } from "@/lib/labels";
import type { StatusTone, TimelineEntry } from "@/lib/types";
import { dateTime } from "@/lib/format";

/* ── Surfaces ───────────────────────────────────────────────────────────── */

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-md border border-rule bg-surface", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  meta,
  action,
  icon: Icon,
}: {
  title: string;
  meta?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="size-4 shrink-0 text-muted" strokeWidth={1.9} />}
        <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
        {meta && <span className="tnum shrink-0 text-tiny text-muted">{meta}</span>}
      </div>
      {action}
    </header>
  );
}

/* ── Metrics ────────────────────────────────────────────────────────────── */

/** Left rail per tone. Colour here is an encoding of state, not decoration —
 *  a tile with no tone stays deliberately neutral. */
const TONE_RAIL: Record<StatusTone, string> = {
  ok: "before:bg-ok",
  warn: "before:bg-warn",
  danger: "before:bg-danger",
  info: "before:bg-info",
  idle: "before:bg-rule-firm",
  solar: "before:bg-solar",
};

/** Tinted icon chip, matching the rail. */
const TONE_CHIP: Record<StatusTone, string> = {
  ok: "bg-ok-wash text-ok",
  warn: "bg-warn-wash text-warn",
  danger: "bg-danger-wash text-danger",
  info: "bg-info-wash text-info",
  idle: "bg-idle-wash text-muted",
  solar: "bg-solar-wash text-solar-hot",
};

export function MetricTile({
  label,
  value,
  unit,
  delta,
  hint,
  tone,
  href,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { text: string; tone: StatusTone };
  hint?: string;
  tone?: StatusTone;
  href?: string;
  icon?: LucideIcon;
  /** Recent series for an inline sparkline — most recent value last. */
  trend?: number[];
}) {
  const rail = tone ?? "idle";

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-tiny font-medium text-muted">
          {tone && !Icon && <span className={clsx("size-1.5 rounded-full", TONE_DOT[tone])} />}
          {label}
        </p>
        {Icon && (
          <span
            className={clsx(
              "flex size-7 shrink-0 items-center justify-center rounded",
              TONE_CHIP[rail],
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </span>
        )}
      </div>

      <p className="mt-1.5 flex items-baseline gap-1">
        <span className="tnum text-metric font-semibold tracking-[-0.02em] text-ink">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </p>

      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {delta && (
            <p className={clsx("tnum text-tiny font-medium", TONE_TEXT[delta.tone])}>
              {delta.text}
            </p>
          )}
          {hint && !delta && <p className="text-tiny text-muted">{hint}</p>}
        </div>
        {trend && trend.length > 1 && (
          <Sparkline values={trend} tone={tone ?? "info"} className="shrink-0" />
        )}
      </div>
    </>
  );

  // The rail is a ::before stripe so it hugs the rounded corner cleanly.
  const shell = clsx(
    "relative block overflow-hidden rounded-md border border-rule bg-surface py-3.5 pl-[15px] pr-4 text-left transition-colors",
    "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
    TONE_RAIL[rail],
  );

  if (href) {
    return (
      <Link href={href} className={clsx(shell, "hover:border-rule-firm hover:bg-canvas-sunk/40")}>
        {body}
      </Link>
    );
  }
  return <div className={shell}>{body}</div>;
}

/* ── Sparkline ──────────────────────────────────────────────────────────── */

const TONE_STROKE: Record<StatusTone, string> = {
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
  idle: "var(--color-faint)",
  solar: "var(--color-solar)",
};

/**
 * Inline trend line. Pure SVG on purpose — a chart library for a 40px glyph
 * would drag a client bundle into otherwise-static server pages.
 */
export function Sparkline({
  values,
  tone = "info",
  width = 56,
  height = 20,
  className,
}: {
  values: number[];
  tone?: StatusTone;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    // Inset by 2px top and bottom so the stroke never clips.
    const y = height - 2 - ((v - min) / span) * (height - 4);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gradientId = `spark-${tone}`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TONE_STROKE[tone]} stopOpacity={0.22} />
          <stop offset="100%" stopColor={TONE_STROKE[tone]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={1.75} fill={TONE_STROKE[tone]} />
    </svg>
  );
}

/* ── Distribution bar ───────────────────────────────────────────────────── */

export interface DistributionSegment {
  key: string;
  label: string;
  value: number;
  tone: StatusTone;
}

/**
 * Single stacked bar showing how a population splits across stages. Every
 * segment is also listed in the legend with its written label — the bar is a
 * summary of the rows beneath it, never the only way to read them.
 */
export function DistributionBar({
  segments,
  className,
}: {
  segments: DistributionSegment[];
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;

  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-canvas-sunk">
        {segments.map((seg) => {
          const share = (seg.value / total) * 100;
          if (share <= 0) return null;
          return (
            <span
              key={seg.key}
              className={clsx("h-full first:rounded-l-full last:rounded-r-full", TONE_BAR[seg.tone])}
              style={{ width: `${share}%` }}
              title={`${seg.label}: ${seg.value}`}
            />
          );
        })}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <li key={seg.key} className="flex items-center gap-1.5">
            <span className={clsx("size-2 rounded-full", TONE_DOT[seg.tone])} />
            <span className="text-tiny text-ink-soft">{seg.label}</span>
            <span className="tnum text-tiny font-medium text-muted">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── People ─────────────────────────────────────────────────────────────── */

export function Avatar({
  initials,
  name,
  size = "md",
}: {
  initials: string;
  name?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      title={name}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-structural/15 bg-structural-hi font-semibold text-white",
        size === "sm" ? "size-5 text-[9px]" : "size-6 text-micro",
      )}
    >
      {initials}
    </span>
  );
}

export function PersonCell({
  name,
  initials,
  meta,
}: {
  name: string;
  initials: string;
  meta?: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar initials={initials} name={name} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm text-ink">{name}</span>
        {meta && <span className="block truncate text-micro text-muted">{meta}</span>}
      </span>
    </span>
  );
}

/* ── Timeline ───────────────────────────────────────────────────────────── */

const MODULE_LABEL: Record<TimelineEntry["module"], string> = {
  lead: "Lead",
  survey: "Survey",
  proposal: "Proposal",
  contract: "Contract",
  permit: "Permit",
  install: "Install",
  monitoring: "Monitoring",
  service: "Service",
  task: "Follow-up",
  referral: "Referral",
};

/** Vertical lifecycle history, built from joins across fixtures. */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative ml-2 border-l border-rule pl-5">
      {entries.map((entry) => (
        <li key={entry.id} className="relative pb-5 last:pb-0">
          <span
            className={clsx(
              "absolute -left-[25px] top-1 size-2.5 rounded-full ring-[3px] ring-canvas",
              TONE_DOT[entry.tone],
            )}
          />
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="rounded bg-canvas-sunk px-1.5 py-px text-micro font-medium text-ink-soft">
              {MODULE_LABEL[entry.module]}
            </span>
            <p className="text-sm font-semibold text-ink">{entry.title}</p>
            <time className="tnum ml-auto shrink-0 text-micro text-muted">
              {dateTime(entry.at)}
            </time>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{entry.detail}</p>
        </li>
      ))}
    </ol>
  );
}

/* ── Misc ───────────────────────────────────────────────────────────────── */

/** Inline "stalled 34 days" style callout. */
export function AlertLine({
  tone,
  children,
  icon: Icon,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  const bg =
    tone === "danger"
      ? "border-danger/25 bg-danger-wash"
      : tone === "warn"
        ? "border-warn/25 bg-warn-wash"
        : tone === "ok"
          ? "border-ok/25 bg-ok-wash"
          : "border-rule bg-canvas-sunk";

  return (
    <p
      className={clsx(
        "flex items-start gap-2 rounded border px-3 py-2 text-tiny leading-relaxed",
        bg,
        TONE_TEXT[tone],
      )}
    >
      {Icon && <Icon className="mt-px size-3.5 shrink-0" strokeWidth={2.2} />}
      <span>{children}</span>
    </p>
  );
}

export function Progress({ pct, tone = "solar" }: { pct: number; tone?: StatusTone }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-rule">
        <span
          className={clsx(
            "block h-full rounded-full",
            tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-solar",
          )}
          style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        />
      </span>
      <span className="tnum text-tiny text-muted">{pct}%</span>
    </span>
  );
}

/** Search input used above tables. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint"
          strokeWidth={2}
        />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "h-8 w-full rounded border border-rule-firm bg-surface pr-2.5 text-sm text-ink placeholder:text-faint sm:w-64",
          Icon ? "pl-8" : "pl-2.5",
        )}
      />
    </div>
  );
}
