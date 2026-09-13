"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Search, TriangleAlert } from "lucide-react";
import { contactOf } from "@/lib/lookups";
import { SYSTEM_HEALTH } from "@/lib/labels";
import { date, dateTime, kwh, num, pct, pctDelta } from "@/lib/format";
import type { MonitoredSystem, MonitoringReading } from "@/lib/types";
import type { FleetSummary, MonthlyPoint } from "@/lib/lookups";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AlertLine,
  Card,
  CardHeader,
  MetricTile,
  SearchInput,
} from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductionChart } from "./ProductionChart";

type Scale = "daily" | "monthly";

export function MonitoringWorkspace({
  systems,
  fleet,
  initialSystemId,
  initialDaily,
  initialMonthly,
}: {
  systems: MonitoredSystem[];
  /** Fleet roll-up, derived server-side from the live readings. */
  fleet: FleetSummary;
  initialSystemId: string;
  initialDaily: MonitoringReading[];
  initialMonthly: MonthlyPoint[];
}) {
  const [selectedId, setSelectedId] = useState(initialSystemId);
  const [scale, setScale] = useState<Scale>("daily");
  const [query, setQuery] = useState("");

  // The series for the system the page opened on arrive as props; switching
  // systems fetches the next one rather than shipping every reading to the
  // browser.
  const [series, setSeries] = useState<Record<string, { daily: MonitoringReading[]; monthly: MonthlyPoint[] }>>({
    [initialSystemId]: { daily: initialDaily, monthly: initialMonthly },
  });

  const selected = systems.find((s) => s.id === selectedId) ?? systems[0];
  const loaded = series[selected.id];

  useEffect(() => {
    if (loaded) return;

    // setState happens in the response callback, never synchronously in the
    // effect body — the latter cascades a render and the lint rule is right to
    // reject it.
    const controller = new AbortController();

    fetch(`/api/monitoring/${selected.id}?days=60&months=12`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { daily: MonitoringReading[]; monthly: MonthlyPoint[] }) => {
        setSeries((prev) => ({ ...prev, [selected.id]: body }));
      })
      .catch(() => {
        /* Leaving it unloaded shows an empty chart rather than stale numbers. */
      });

    return () => controller.abort();
  }, [selected.id, loaded]);

  const daily = useMemo(() => loaded?.daily ?? [], [loaded]);
  const monthly = useMemo(() => loaded?.monthly ?? [], [loaded]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return systems;
    return systems.filter(
      (s) => contactOf(s.contactId)?.name.toLowerCase().includes(q) ?? false,
    );
  }, [systems, query]);

  const flagged = systems.filter((s) => s.health !== "healthy");

  const chartData =
    scale === "daily"
      ? daily.map((r) => ({
          label: date(r.date).replace(/, \d{4}$/, ""),
          produced: r.producedKwh,
          expected: r.expectedKwh,
        }))
      : monthly.map((m) => ({
          label: m.label,
          produced: m.producedKwh,
          expected: m.expectedKwh,
        }));

  const selectedContact = contactOf(selected.contactId);

  return (
    <>
      <PageHeader
        title="Monitoring"
        lede="Fleet production against model, and which systems are not holding up their end."
        tabs={
          <>
            <ViewTab active={scale === "daily"} onClick={() => setScale("daily")}>
              Daily
            </ViewTab>
            <ViewTab active={scale === "monthly"} onClick={() => setScale("monthly")}>
              Monthly
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricTile label="Systems monitored" value={systems.length} tone="info" icon={Activity} />
          <MetricTile label="Fleet size" value={num(fleet.fleetSizeKw, 1)} unit="kW" tone="solar" />
          <MetricTile
            label="Produced yesterday"
            value={num(fleet.producedYesterday)}
            unit="kWh"
            delta={{
              text: `${pct(fleet.ratioYesterday)} of model`,
              tone:
                fleet.ratioYesterday >= 95 ? "ok" : fleet.ratioYesterday >= 85 ? "warn" : "danger",
            }}
          />
          <MetricTile
            label="Flagged"
            value={flagged.length}
            tone={flagged.length > 0 ? "warn" : "ok"}
            hint="Needs a look"
          />
          <MetricTile
            label="Lifetime production"
            value={num(fleet.lifetimeKwh)}
            unit="kWh"
            tone="ok"
          />
        </div>

        {flagged.length > 0 && (
          <Card>
            <CardHeader
              title="Underperforming and offline"
              icon={TriangleAlert}
              meta={`${flagged.length} of ${systems.length}`}
            />
            <ul className="divide-y divide-rule">
              {flagged.map((s) => {
                const c = contactOf(s.contactId);
                return (
                  <li key={s.id} className="flex flex-wrap items-start gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className="text-sm font-semibold text-ink hover:underline"
                        >
                          {c?.name}
                        </button>
                        <StatusBadge spec={SYSTEM_HEALTH[s.health]} size="sm" dot />
                      </p>
                      <p className="mt-1 text-tiny leading-relaxed text-muted">{s.alert}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={
                          s.performanceRatioPct < 80
                            ? "tnum text-lg font-semibold text-danger"
                            : "tnum text-lg font-semibold text-warn"
                        }
                      >
                        {pct(s.performanceRatioPct)}
                      </p>
                      <p className="text-micro text-muted">of model, 30 days</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          {/* Chart for the selected system */}
          <Card>
            <CardHeader
              title={`${selectedContact?.name ?? "System"} — production vs model`}
              meta={scale === "daily" ? "Last 60 days" : "Last 12 months"}
              icon={Activity}
              action={<StatusBadge spec={SYSTEM_HEALTH[selected.health]} size="sm" dot />}
            />

            <div className="px-2 py-4 sm:px-4">
              <ProductionChart data={chartData} />
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-rule px-4 py-3 sm:grid-cols-4">
              <Stat label="System size" value={`${num(selected.systemSizeKw, 1)} kW`} />
              <Stat label="30-day ratio" value={pct(selected.performanceRatioPct)} />
              <Stat label="Lifetime" value={kwh(selected.lifetimeKwh)} />
              <Stat label="Last report" value={dateTime(selected.lastReportAt)} />
            </div>

            {selected.alert && (
              <div className="px-4 pb-4">
                <AlertLine tone={selected.health === "fault" || selected.health === "offline" ? "danger" : "warn"}>
                  {selected.alert}
                </AlertLine>
              </div>
            )}
          </Card>

          {/* System picker */}
          <Card className="self-start">
            <CardHeader title="Fleet" meta={`${filtered.length}`} />
            <div className="border-b border-rule px-3 py-2.5">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Find a customer…"
                icon={Search}
              />
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="No systems by that name"
                body="Try the customer's last name, or clear the search to see the whole fleet."
                className="py-6"
              />
            ) : (
              <ul className="scrollbar-slim max-h-[560px] divide-y divide-rule overflow-y-auto">
                {filtered.map((s) => {
                  const c = contactOf(s.contactId);
                  const active = s.id === selected.id;
                  const delta = s.performanceRatioPct - 100;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        aria-current={active ? "true" : undefined}
                        className={
                          active
                            ? "flex w-full items-center gap-2 bg-solar-wash px-3 py-2 text-left"
                            : "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-canvas-sunk/60"
                        }
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {c?.name}
                          </span>
                          <span className="tnum block text-micro text-muted">
                            {num(s.systemSizeKw, 1)} kW · commissioned {date(s.commissionedAt)}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span
                            className={
                              s.performanceRatioPct >= 95
                                ? "tnum block text-sm font-semibold text-ok"
                                : s.performanceRatioPct >= 85
                                  ? "tnum block text-sm font-semibold text-warn"
                                  : "tnum block text-sm font-semibold text-danger"
                            }
                          >
                            {pct(s.performanceRatioPct)}
                          </span>
                          <span className="tnum block text-micro text-muted">
                            {pctDelta(delta)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <p className="text-tiny text-muted">
          Modeled output assumes {num(1620)} kWh per installed kW per year for this service
          territory, adjusted for season. A system under 90% of model for a week opens a service
          ticket automatically —{" "}
          <Link href="/service" className="font-medium text-solar-hot hover:underline">
            see open tickets
          </Link>
          .
        </p>
      </PageBody>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-micro text-muted">{label}</p>
      <p className="tnum text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
