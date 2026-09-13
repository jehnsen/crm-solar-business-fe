"use client";

import { useMemo, useState } from "react";
import { HardHat, Search } from "lucide-react";
import { contactOf, memberName } from "@/lib/api";
import { INSTALL_STAGE, INSTALL_STAGE_ORDER } from "@/lib/labels";
import { date, dateWithDay, kw, num } from "@/lib/format";
import type { InstallProject, InstallStage } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { KanbanBoard } from "@/components/ui/KanbanBoard";
import { MetricTile, Progress, SearchInput } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InstallPanel } from "./InstallPanel";

type View = "board" | "list";

export function InstallsWorkspace({
  projects,
  crew,
}: {
  projects: InstallProject[];
  crew: { id: string; name: string; trade: string }[];
}) {
  const [rows, setRows] = useState(projects);
  const [view, setView] = useState<View>("board");
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [crewFilter, setCrewFilter] = useState("all");

  const crews = useMemo(() => {
    const names = [...new Set(projects.map((p) => p.crewName))];
    return names.map((n) => ({ value: n, label: n }));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (crewFilter !== "all" && p.crewName !== crewFilter) return false;
      if (!q) return true;
      return contactOf(p.contactId)?.name.toLowerCase().includes(q) ?? false;
    });
  }, [rows, query, crewFilter]);

  const open = openId ? rows.find((p) => p.id === openId) ?? null : null;

  function moveStage(id: string, to: InstallStage) {
    setRows((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const stamp = new Date().toISOString().slice(0, 10);
        return {
          ...p,
          stage: to,
          startedAt: to === "scheduled" ? null : (p.startedAt ?? stamp),
          completedAt: to === "completed" ? (p.completedAt ?? stamp) : p.completedAt,
          progressPct: to === "completed" ? 100 : to === "scheduled" ? 0 : p.progressPct,
        };
      }),
    );
  }

  function toggleMaterial(projectId: string, materialId: string) {
    setRows((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              materials: p.materials.map((m) =>
                m.id === materialId ? { ...m, staged: !m.staged } : m,
              ),
            }
          : p,
      ),
    );
  }

  function togglePunch(projectId: string, itemId: string) {
    setRows((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              punchList: p.punchList.map((i) =>
                i.id === itemId ? { ...i, resolved: !i.resolved } : i,
              ),
            }
          : p,
      ),
    );
  }

  const active = filtered.filter((p) => p.stage !== "completed");
  const openPunch = filtered.reduce(
    (sum, p) => sum + p.punchList.filter((i) => !i.resolved).length,
    0,
  );
  const kwScheduled = filtered
    .filter((p) => p.stage === "scheduled")
    .reduce((s, p) => s + p.systemSizeKw, 0);

  const columns: Column<InstallProject>[] = [
    {
      key: "customer",
      header: "Job",
      width: "20%",
      sortValue: (p) => contactOf(p.contactId)?.name ?? "",
      cell: (p) => {
        const c = contactOf(p.contactId);
        return (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-ink">{c?.name}</span>
            <span className="block truncate text-micro text-muted">
              {c?.address.city} · {num(p.panelCount)} panels
            </span>
          </span>
        );
      },
    },
    {
      key: "stage",
      header: "Stage",
      sortValue: (p) => INSTALL_STAGE_ORDER.indexOf(p.stage),
      cell: (p) => <StatusBadge spec={INSTALL_STAGE[p.stage]} dot />,
    },
    {
      key: "scheduled",
      header: "Install date",
      align: "right",
      numeric: true,
      sortValue: (p) => p.scheduledDate,
      cell: (p) => (
        <span className="block">
          <span className="block">{date(p.scheduledDate)}</span>
          <span className="block text-micro text-muted">{p.estimatedDays}-day job</span>
        </span>
      ),
    },
    {
      key: "size",
      header: "System",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (p) => p.systemSizeKw,
      cell: (p) => kw(p.systemSizeKw),
    },
    {
      key: "crew",
      header: "Crew",
      hideBelow: "md",
      sortValue: (p) => p.crewName,
      cell: (p) => (
        <span className="block">
          <span className="block text-sm">{p.crewName}</span>
          <span className="block text-micro text-muted">{memberName(p.crewLeadId)}</span>
        </span>
      ),
    },
    {
      key: "pm",
      header: "PM",
      hideBelow: "lg",
      sortValue: (p) => memberName(p.projectManagerId),
      cell: (p) => <span className="text-sm">{memberName(p.projectManagerId)}</span>,
    },
    {
      key: "materials",
      header: "Materials",
      hideBelow: "lg",
      sortValue: (p) => p.materials.filter((m) => m.staged).length / p.materials.length,
      cell: (p) => {
        const staged = p.materials.filter((m) => m.staged).length;
        const all = staged === p.materials.length;
        return (
          <span className={all ? "tnum text-tiny text-ok" : "tnum text-tiny text-warn"}>
            {staged}/{p.materials.length} staged
          </span>
        );
      },
    },
    {
      key: "progress",
      header: "Progress",
      align: "right",
      hideBelow: "md",
      sortValue: (p) => p.progressPct,
      cell: (p) => (
        <Progress
          pct={p.progressPct}
          tone={p.stage === "completed" ? "ok" : p.stage === "punch-list" ? "warn" : "solar"}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Installations"
        lede="Which crew is where, what is staged, and what still has to be closed out."
        tabs={
          <>
            <ViewTab active={view === "board"} onClick={() => setView("board")}>
              Board
            </ViewTab>
            <ViewTab active={view === "list"} onClick={() => setView("list")} count={filtered.length}>
              List
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile label="Jobs in flight" value={active.length} hint="Not yet completed" />
          <MetricTile
            label="Scheduled capacity"
            value={num(kwScheduled, 1)}
            unit="kW"
            hint="Waiting to start"
          />
          <MetricTile
            label="Open punch items"
            value={openPunch}
            tone={openPunch > 0 ? "warn" : "ok"}
          />
          <MetricTile
            label="On the roof now"
            value={filtered.filter((p) => p.stage === "in-progress").length}
            tone="solar"
          />
        </div>

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search customer…"
            icon={Search}
          />
          <SelectFilter
            label="Crew"
            value={crewFilter}
            onChange={setCrewFilter}
            options={[{ value: "all", label: "All crews" }, ...crews]}
          />
          <span className="tnum ml-auto text-tiny text-muted">
            {filtered.length} of {rows.length}
          </span>
        </TableToolbar>

        {view === "board" ? (
          <KanbanBoard
            columns={INSTALL_STAGE_ORDER.map((stage) => ({
              key: stage,
              label: INSTALL_STAGE[stage].label,
              tone: INSTALL_STAGE[stage].tone,
              meta:
                stage === "punch-list"
                  ? "Needs closing out before inspection"
                  : stage === "scheduled"
                    ? "Crew and materials assigned"
                    : undefined,
            }))}
            items={filtered}
            itemKey={(p) => p.id}
            itemStage={(p) => p.stage}
            onMove={(id, to) => moveStage(id, to)}
            renderCard={(p) => {
              const c = contactOf(p.contactId);
              const staged = p.materials.filter((m) => m.staged).length;
              const openItems = p.punchList.filter((i) => !i.resolved).length;
              return (
                <button
                  type="button"
                  onClick={() => setOpenId(p.id)}
                  className="block w-full px-3 py-2.5 pr-7 text-left"
                >
                  <p className="truncate text-sm font-semibold text-ink">{c?.name}</p>
                  <p className="tnum truncate text-micro text-muted">
                    {dateWithDay(p.scheduledDate)} · {kw(p.systemSizeKw)}
                  </p>

                  <p className="mt-2 truncate text-micro text-ink-soft">
                    {p.crewName} · {memberName(p.crewLeadId).split(" ")[0]}
                  </p>

                  {p.stage !== "scheduled" && (
                    <div className="mt-2">
                      <Progress
                        pct={p.progressPct}
                        tone={p.stage === "completed" ? "ok" : p.stage === "punch-list" ? "warn" : "solar"}
                      />
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-rule pt-2">
                    <span
                      className={
                        staged === p.materials.length
                          ? "tnum text-micro text-ok"
                          : "tnum text-micro text-warn"
                      }
                    >
                      {staged}/{p.materials.length} staged
                    </span>
                    {openItems > 0 && (
                      <StatusBadge
                        label={`${openItems} punch ${openItems === 1 ? "item" : "items"}`}
                        tone="warn"
                        size="sm"
                      />
                    )}
                  </div>
                </button>
              );
            }}
            emptyColumn={(col) => (
              <p className="px-2 py-6 text-tiny leading-relaxed text-faint">
                {col.key === "punch-list"
                  ? "No punch items outstanding. Good."
                  : `Nothing at ${col.label.toLowerCase()} right now.`}
              </p>
            )}
          />
        ) : (
          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={(p) => p.id}
            onRowClick={(p) => setOpenId(p.id)}
            activeRowKey={openId}
            initialSort={{ key: "scheduled", dir: "desc" }}
            empty={
              <EmptyState
                icon={HardHat}
                title="No installs match those filters"
                body="Jobs land here once the contract is countersigned and the permit is approved."
                align="center"
              />
            }
          />
        )}
      </PageBody>

      <InstallPanel
        project={open}
        crew={crew}
        onClose={() => setOpenId(null)}
        onToggleMaterial={(mid) => open && toggleMaterial(open.id, mid)}
        onTogglePunch={(iid) => open && togglePunch(open.id, iid)}
        onStageChange={(to) => open && moveStage(open.id, to)}
      />
    </>
  );
}
