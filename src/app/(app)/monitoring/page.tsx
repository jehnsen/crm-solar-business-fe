import { getDailyReadings, getFleetSummary, getMonitoredSystems, getMonthlyReadings } from "@/lib/api";
import { MonitoringWorkspace } from "./MonitoringWorkspace";

export const metadata = { title: "Monitoring — Solar Ops" };

export default async function MonitoringPage() {
  const [systems, fleet] = await Promise.all([getMonitoredSystems(), getFleetSummary()]);

  // Worst performers first — that's who someone needs to look at today.
  const ordered = [...systems].sort((a, b) => {
    const rank = { fault: 0, offline: 1, underperforming: 2, healthy: 3 } as const;
    if (rank[a.health] !== rank[b.health]) return rank[a.health] - rank[b.health];
    return a.performanceRatioPct - b.performanceRatioPct;
  });

  const initial = ordered[0];
  const [daily, monthly] = await Promise.all([
    getDailyReadings(initial.id, 60),
    getMonthlyReadings(initial.id, 12),
  ]);

  return (
    <MonitoringWorkspace
      systems={ordered}
      fleet={fleet}
      initialSystemId={initial.id}
      initialDaily={daily}
      initialMonthly={monthly}
    />
  );
}
