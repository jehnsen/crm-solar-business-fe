"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { TODAY } from "@/lib/format";

export interface CalendarEvent {
  id: string;
  /** ISO timestamp. */
  start: string;
  durationMin: number;
  title: string;
  subtitle?: string;
  tone: "ok" | "warn" | "danger" | "info" | "idle" | "solar";
}

const TONE_EVENT: Record<CalendarEvent["tone"], string> = {
  ok: "border-l-ok bg-ok-wash/85 text-ok",
  warn: "border-l-warn bg-warn-wash/85 text-warn",
  danger: "border-l-danger bg-danger-wash/85 text-danger",
  info: "border-l-info bg-info-wash/85 text-info",
  idle: "border-l-faint bg-idle-wash text-muted",
  solar: "border-l-solar bg-solar-wash text-solar-hot",
};

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;
const HOUR_PX = 52;

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  // Monday-first: the crew week starts Monday.
  const day = out.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Week grid, 7 columns × working hours. Primary view for site surveys. */
export function CalendarWeek({
  weekStart,
  events,
  onSelect,
  activeId,
}: {
  weekStart: Date;
  events: CalendarEvent[];
  onSelect?: (id: string) => void;
  activeId?: string | null;
}) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    [],
  );

  return (
    <div className="scrollbar-slim overflow-x-auto rounded-md border border-rule bg-surface">
      <div className="min-w-[820px]">
        {/* Day headers */}
        <div className="sticky top-0 z-10 grid grid-cols-[56px_repeat(7,1fr)] border-b border-rule bg-canvas-sunk/70">
          <div className="border-r border-rule" />
          {days.map((day) => {
            const isToday = sameDay(day, TODAY);
            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  "border-r border-rule px-2 py-2 text-center last:border-r-0",
                  isToday && "bg-solar-wash/70",
                )}
              >
                <p className="text-micro font-medium uppercase tracking-wide text-muted">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  className={clsx(
                    "tnum text-lg leading-tight",
                    isToday ? "font-bold text-ink" : "font-semibold text-ink-soft",
                  )}
                >
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Hour grid */}
        <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div className="border-r border-rule">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="relative border-b border-rule/60 last:border-b-0"
              >
                <span className="tnum absolute -top-1.5 right-1.5 text-micro text-faint">
                  {h % 12 === 0 ? 12 : h % 12}
                  {h < 12 ? "a" : "p"}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = events.filter((e) => sameDay(new Date(e.start), day));
            const isToday = sameDay(day, TODAY);
            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  "relative border-r border-rule last:border-r-0",
                  isToday && "bg-solar-wash/20",
                )}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_PX }}
                    className="border-b border-rule/60 last:border-b-0"
                  />
                ))}

                {dayEvents.map((ev) => {
                  const start = new Date(ev.start);
                  const minutesFromTop =
                    (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes();
                  const top = (minutesFromTop / 60) * HOUR_PX;
                  const height = Math.max(26, (ev.durationMin / 60) * HOUR_PX - 3);
                  const active = activeId === ev.id;

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={onSelect ? () => onSelect(ev.id) : undefined}
                      style={{ top, height }}
                      className={clsx(
                        "absolute left-1 right-1 overflow-hidden rounded border border-l-[3px] px-1.5 py-1 text-left transition-shadow",
                        TONE_EVENT[ev.tone],
                        "border-y-rule/50 border-r-rule/50",
                        active && "ring-2 ring-solar",
                        onSelect && "hover:shadow-[0_2px_6px_rgba(16,25,43,0.14)]",
                      )}
                    >
                      <p className="tnum truncate text-micro font-semibold">
                        {start.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="truncate text-tiny font-medium text-ink">{ev.title}</p>
                      {ev.subtitle && height > 46 && (
                        <p className="truncate text-micro text-muted">{ev.subtitle}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Month grid — the alternate calendar scale. */
export function CalendarMonth({
  monthStart,
  events,
  onSelect,
}: {
  monthStart: Date;
  events: CalendarEvent[];
  onSelect?: (id: string) => void;
}) {
  const gridStart = startOfWeek(monthStart);
  const cells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart],
  );
  const month = monthStart.getMonth();

  return (
    <div className="overflow-hidden rounded-md border border-rule bg-surface">
      <div className="grid grid-cols-7 border-b border-rule bg-canvas-sunk/70">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="border-r border-rule px-2 py-1.5 text-center text-micro font-medium uppercase tracking-wide text-muted last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const dayEvents = events.filter((e) => sameDay(new Date(e.start), day));
          const outside = day.getMonth() !== month;
          const isToday = sameDay(day, TODAY);
          return (
            <div
              key={day.toISOString()}
              className={clsx(
                "min-h-[96px] border-b border-r border-rule p-1.5 last:border-r-0",
                outside && "bg-canvas-sunk/40",
                isToday && "bg-solar-wash/35",
              )}
            >
              <p
                className={clsx(
                  "tnum mb-1 text-tiny",
                  isToday ? "font-bold text-ink" : outside ? "text-faint" : "font-medium text-ink-soft",
                )}
              >
                {day.getDate()}
              </p>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={onSelect ? () => onSelect(ev.id) : undefined}
                    className={clsx(
                      "block w-full truncate rounded border-l-[3px] px-1.5 py-0.5 text-left text-micro font-medium",
                      TONE_EVENT[ev.tone],
                    )}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="tnum px-1 text-micro text-muted">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
