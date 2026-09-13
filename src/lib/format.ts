/**
 * Display formatters. Everything numeric that lands in a table column goes
 * through here so tabular figures line up and units are written the way the
 * office says them ("8.4 kW", "12,410 kWh", "$31,200").
 */

/** Fixed "today" so fixtures and derived date math stay stable across renders
 *  and never drift between server and client. */
export const TODAY = new Date("2026-09-12T09:00:00");

const DAY_MS = 86_400_000;

export function usd(n: number, opts?: { cents?: boolean }): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  });
}

/** Compact money for tiles — $1.24M / $318K / $940. */
export function usdCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 10_000) return `$${Math.round(n / 1000)}K`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export function num(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function kwh(n: number, decimals = 0): string {
  return `${num(n, decimals)} kWh`;
}

export function kw(n: number, decimals = 1): string {
  return `${num(n, decimals)} kW`;
}

export function pct(n: number, decimals = 0): string {
  return `${num(n, decimals)}%`;
}

/** Signed percentage for variance readouts — +4% / −11%. */
export function pctDelta(n: number, decimals = 0): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${num(Math.abs(n), decimals)}%`;
}

function parse(d: string | Date): Date {
  return typeof d === "string" ? new Date(d) : d;
}

/** Sep 12, 2026 */
export function date(d: string | Date | null): string {
  if (!d) return "—";
  return parse(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Sep 12 — for dense columns where the year is obvious. */
export function dateShort(d: string | Date | null): string {
  if (!d) return "—";
  return parse(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Sat, Sep 12 */
export function dateWithDay(d: string | Date | null): string {
  if (!d) return "—";
  return parse(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** 2:30 PM */
export function time(d: string | Date | null): string {
  if (!d) return "—";
  return parse(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Sep 12, 2:30 PM */
export function dateTime(d: string | Date | null): string {
  if (!d) return "—";
  return `${dateShort(d)}, ${time(d)}`;
}

export function daysBetween(a: string | Date, b: string | Date = TODAY): number {
  const ms = parse(b).getTime() - parse(a).getTime();
  return Math.floor(ms / DAY_MS);
}

/** "today" / "3 days ago" / "in 5 days" — for next-action and stall columns. */
export function relativeDays(d: string | Date | null, from: Date = TODAY): string {
  if (!d) return "—";
  const days = daysBetween(d, from);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  if (days > 1) return `${days} days ago`;
  return `in ${Math.abs(days)} days`;
}

/** "14 days" — duration only, for "stalled for" readouts. */
export function dayCount(n: number): string {
  return `${num(n)} ${Math.abs(n) === 1 ? "day" : "days"}`;
}

/** True when a due date has passed. */
export function isOverdue(due: string | null, from: Date = TODAY): boolean {
  if (!due) return false;
  return parse(due).getTime() < from.getTime();
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Slug for building hrefs from ids without importing a router helper. */
export function titleCase(s: string): string {
  return s.replace(/(^|[\s-])(\w)/g, (_, sep, ch) => `${sep === "-" ? " " : sep}${ch.toUpperCase()}`);
}
