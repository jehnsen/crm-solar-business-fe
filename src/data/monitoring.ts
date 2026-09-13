import { rngFrom } from "@/lib/rng";
import type { MonitoredSystem, MonitoringReading } from "@/lib/types";

/**
 * Fleet of commissioned systems, plus a generated daily production series.
 *
 * Readings are produced from a seeded generator so the charts are identical on
 * server and client. The shape is deliberately physical: a seasonal envelope
 * (long summer days in Arizona), a weather-driven daily wobble, and a
 * per-system derate that makes underperformers visibly diverge from their
 * modeled line rather than just carrying a bad label.
 */

interface SystemSeed {
  id: string;
  contactId: string;
  projectId: string;
  commissionedAt: string;
  systemSizeKw: number;
  inverterModel: string;
  health: MonitoredSystem["health"];
  /** Actual output as a fraction of modeled. 1.0 = exactly on model. */
  derate: number;
  alert: string | null;
}

const seeds: SystemSeed[] = [
  {
    id: "sy-001",
    contactId: "ct-001",
    projectId: "ip-001",
    commissionedAt: "2025-06-09",
    systemSizeKw: 9.2,
    inverterModel: "Volterra VX-11.4 String",
    health: "healthy",
    derate: 1.02,
    alert: null,
  },
  {
    id: "sy-002",
    contactId: "ct-002",
    projectId: "ip-002",
    commissionedAt: "2025-07-01",
    systemSizeKw: 11.6,
    inverterModel: "Volterra VX-11.4 String",
    health: "healthy",
    derate: 1.0,
    alert: null,
  },
  {
    id: "sy-003",
    contactId: "ct-003",
    projectId: "ip-003",
    commissionedAt: "2025-06-06",
    systemSizeKw: 48,
    inverterModel: "Volterra VX-50 Commercial",
    health: "underperforming",
    derate: 0.84,
    alert: "Running 16% under model for 3 weeks — soiling on the east array is the likely cause.",
  },
  {
    id: "sy-004",
    contactId: "ct-004",
    projectId: "ip-004",
    commissionedAt: "2025-07-15",
    systemSizeKw: 7.5,
    inverterModel: "Volterra VX-7.6 String",
    health: "healthy",
    derate: 0.99,
    alert: null,
  },
  {
    id: "sy-005",
    contactId: "ct-005",
    projectId: "ip-005",
    commissionedAt: "2025-07-31",
    systemSizeKw: 8.8,
    inverterModel: "Volterra VX-11.4 String",
    health: "healthy",
    derate: 1.01,
    alert: null,
  },
  {
    id: "sy-006",
    contactId: "ct-006",
    projectId: "ip-006",
    commissionedAt: "2025-07-28",
    systemSizeKw: 62,
    inverterModel: "Volterra VX-50 Commercial",
    health: "healthy",
    derate: 0.97,
    alert: null,
  },
  {
    id: "sy-007",
    contactId: "ct-007",
    projectId: "ip-007",
    commissionedAt: "2025-09-12",
    systemSizeKw: 10.1,
    inverterModel: "Northgate NG-Hybrid 10",
    health: "healthy",
    derate: 1.0,
    alert: null,
  },
  {
    id: "sy-008",
    contactId: "ct-008",
    projectId: "ip-008",
    commissionedAt: "2025-08-21",
    systemSizeKw: 8.4,
    inverterModel: "Volterra VX-11.4 String",
    health: "healthy",
    derate: 1.03,
    alert: null,
  },
  {
    id: "sy-009",
    contactId: "ct-009",
    projectId: "ip-009",
    commissionedAt: "2025-09-04",
    systemSizeKw: 38,
    inverterModel: "Volterra VX-50 Commercial",
    health: "fault",
    derate: 0.61,
    alert: "Inverter reporting ground-fault since Sep 9. One of three strings is offline.",
  },
  {
    id: "sy-010",
    contactId: "ct-010",
    projectId: "ip-010",
    commissionedAt: "2025-09-24",
    systemSizeKw: 7.9,
    inverterModel: "Volterra VX-7.6 String",
    health: "healthy",
    derate: 0.98,
    alert: null,
  },
  {
    id: "sy-011",
    contactId: "ct-011",
    projectId: "ip-011",
    commissionedAt: "2025-04-30",
    systemSizeKw: 10.8,
    inverterModel: "Volterra VX-11.4 String",
    health: "healthy",
    derate: 1.0,
    alert: null,
  },
  {
    id: "sy-012",
    contactId: "ct-012",
    projectId: "ip-012",
    commissionedAt: "2025-10-27",
    systemSizeKw: 6.4,
    inverterModel: "Volterra VX-7.6 String",
    health: "underperforming",
    derate: 0.88,
    alert: "12% under model. Ash tree on the east side has grown into the morning window.",
  },
  {
    id: "sy-013",
    contactId: "ct-013",
    projectId: "ip-013",
    commissionedAt: "2025-07-07",
    systemSizeKw: 74,
    inverterModel: "Volterra VX-50 Commercial",
    health: "healthy",
    derate: 1.01,
    alert: null,
  },
  {
    id: "sy-014",
    contactId: "ct-014",
    projectId: "ip-014",
    commissionedAt: "2025-10-08",
    systemSizeKw: 9.6,
    inverterModel: "Volterra VX-11.4 String",
    health: "offline",
    derate: 0.0,
    alert: "No data since Sep 6. Monitoring gateway looks to have dropped off the home wifi.",
  },
];

/** kWh per installed kW for a given day of year — the seasonal envelope. */
function seasonalYieldPerKw(dayOfYear: number): number {
  // Peaks late June, troughs late December. Phoenix-ish amplitude.
  const phase = ((dayOfYear - 172) / 365) * Math.PI * 2;
  return 4.45 + 1.35 * Math.cos(phase);
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

const SERIES_DAYS = 365;
const SERIES_END = new Date("2026-09-12T00:00:00Z");

function buildReadings(): MonitoringReading[] {
  const out: MonitoringReading[] = [];

  seeds.forEach((seed, sIdx) => {
    const rng = rngFrom(7919 + sIdx * 131);
    const commissioned = new Date(`${seed.commissionedAt}T00:00:00Z`);

    for (let back = SERIES_DAYS - 1; back >= 0; back--) {
      const day = new Date(SERIES_END.getTime() - back * 86_400_000);
      if (day < commissioned) continue;

      const perKw = seasonalYieldPerKw(dayOfYear(day));
      const expected = perKw * seed.systemSizeKw;

      // Weather: mostly clear, with occasional monsoon-season cloud days.
      const month = day.getUTCMonth();
      const stormy = month >= 6 && month <= 8 ? 0.22 : 0.08;
      const weather = rng.chance(stormy) ? rng.float(0.35, 0.75) : rng.float(0.94, 1.05);

      let actual = expected * seed.derate * weather;

      // The offline system stops reporting entirely partway through.
      if (seed.health === "offline") {
        const offlineFrom = new Date("2026-09-06T00:00:00Z");
        actual = day >= offlineFrom ? 0 : expected * rng.float(0.96, 1.02);
      }
      // The faulted system loses a string on a known date.
      if (seed.health === "fault") {
        const faultFrom = new Date("2026-09-09T00:00:00Z");
        actual = day >= faultFrom ? expected * rng.float(0.58, 0.66) : expected * rng.float(0.95, 1.02);
      }

      const producedKwh = Math.max(0, Math.round(actual * 10) / 10);
      const sunHours = Math.round(rng.float(9.4, 13.6) * 10) / 10;

      out.push({
        id: `${seed.id}-rd-${day.toISOString().slice(0, 10)}`,
        systemId: seed.id,
        contactId: seed.contactId,
        projectId: seed.projectId,
        date: day.toISOString().slice(0, 10),
        producedKwh,
        expectedKwh: Math.round(expected * 10) / 10,
        peakKw: Math.round(Math.min(seed.systemSizeKw, (producedKwh / 5.2)) * 10) / 10,
        sunHours,
      });
    }
  });

  return out;
}

export const monitoringReadings: MonitoringReading[] = buildReadings();

const readingsBySystem = new Map<string, MonitoringReading[]>();
for (const r of monitoringReadings) {
  const list = readingsBySystem.get(r.systemId) ?? [];
  list.push(r);
  readingsBySystem.set(r.systemId, list);
}
export { readingsBySystem };

/** Rolling-30-day performance ratio and lifetime total, derived from readings. */
export const monitoredSystems: MonitoredSystem[] = seeds.map((seed) => {
  const series = readingsBySystem.get(seed.id) ?? [];
  const last30 = series.slice(-30);
  const actual = last30.reduce((s, r) => s + r.producedKwh, 0);
  const expected = last30.reduce((s, r) => s + r.expectedKwh, 0);
  const lifetime = series.reduce((s, r) => s + r.producedKwh, 0);
  const last = series[series.length - 1];

  return {
    id: seed.id,
    contactId: seed.contactId,
    projectId: seed.projectId,
    health: seed.health,
    commissionedAt: seed.commissionedAt,
    systemSizeKw: seed.systemSizeKw,
    performanceRatioPct: expected > 0 ? Math.round((actual / expected) * 100) : 0,
    lifetimeKwh: Math.round(lifetime),
    lastReportAt:
      seed.health === "offline" ? "2026-09-05T18:40:00" : `${last?.date ?? "2026-09-12"}T19:05:00`,
    inverterModel: seed.inverterModel,
    alert: seed.alert,
  };
});

export const systemById = new Map(monitoredSystems.map((s) => [s.id, s]));
export const systemByContactId = new Map(monitoredSystems.map((s) => [s.contactId, s]));

/** Fleet roll-up for the dashboard tile. */
export function fleetSummary() {
  const sizeKw = monitoredSystems.reduce((s, x) => s + x.systemSizeKw, 0);
  const lifetimeKwh = monitoredSystems.reduce((s, x) => s + x.lifetimeKwh, 0);
  const flagged = monitoredSystems.filter((s) => s.health !== "healthy");

  // Yesterday's fleet production, so the number is always a full day.
  const yesterday = "2026-09-11";
  const producedYesterday = monitoringReadings
    .filter((r) => r.date === yesterday)
    .reduce((s, r) => s + r.producedKwh, 0);
  const expectedYesterday = monitoringReadings
    .filter((r) => r.date === yesterday)
    .reduce((s, r) => s + r.expectedKwh, 0);

  return {
    systems: monitoredSystems.length,
    fleetSizeKw: Math.round(sizeKw * 10) / 10,
    lifetimeKwh,
    flaggedCount: flagged.length,
    producedYesterday: Math.round(producedYesterday),
    expectedYesterday: Math.round(expectedYesterday),
    ratioYesterday:
      expectedYesterday > 0 ? Math.round((producedYesterday / expectedYesterday) * 100) : 0,
  };
}
