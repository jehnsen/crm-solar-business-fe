"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Search, Stamp, TriangleAlert } from "lucide-react";
import { memberName, type PermitProjectView } from "@/lib/api";
import { PERMIT_STATUS, PERMIT_STEP, PERMIT_STEP_ORDER } from "@/lib/labels";
import { date, dayCount, relativeDays } from "@/lib/format";
import type { PermitStepKey } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { KanbanBoard } from "@/components/ui/KanbanBoard";
import { AlertLine, MetricTile, SearchInput } from "@/components/ui/Primitives";
import { StepProgress } from "@/components/ui/PipelineTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PermitPanel } from "./PermitPanel";

type View = "board" | "list";

/** Board columns are the six real steps, plus a terminal column for PTO'd jobs. */
const BOARD_COLUMNS: (PermitStepKey | "done")[] = [...PERMIT_STEP_ORDER, "done"];

export function PermittingWorkspace({ projects }: { projects: PermitProjectView[] }) {
  const [rows, setRows] = useState(projects);
  const [view, setView] = useState<View>("board");
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const owners = useMemo(() => {
    const ids = [...new Set(projects.map((p) => p.ownerId))];
    return ids.map((id) => ({ value: id, label: memberName(id) }));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (ownerFilter !== "all" && p.ownerId !== ownerFilter) return false;
      if (!q) return true;
      return (
        p.contactName.toLowerCase().includes(q) ||
        p.authority.toLowerCase().includes(q) ||
        p.steps.some((s) => s.referenceNumber?.toLowerCase().includes(q))
      );
    });
  }, [rows, query, ownerFilter]);

  const open = openId ? rows.find((p) => p.projectId === openId) ?? null : null;

  const needsAttention = filtered.filter((p) => p.blocked || p.overdue || p.stalled);
  const inFlight = filtered.filter((p) => p.currentStepKey !== "done");

  /** Dragging a card marks every step up to the target complete. */
  function moveToStep(projectId: string, target: PermitStepKey | "done") {
    setRows((prev) =>
      prev.map((p) => {
        if (p.projectId !== projectId) return p;
        const targetIndex =
          target === "done" ? PERMIT_STEP_ORDER.length : PERMIT_STEP_ORDER.indexOf(target);
        const stamp = new Date().toISOString().slice(0, 10);

        const steps = p.steps.map((s, i) => {
          if (i < targetIndex) {
            return {
              ...s,
              status: "complete" as const,
              startedAt: s.startedAt ?? stamp,
              completedAt: s.completedAt ?? stamp,
            };
          }
          if (i === targetIndex) {
            return {
              ...s,
              status: "in-progress" as const,
              startedAt: s.startedAt ?? stamp,
              completedAt: null,
            };
          }
          return { ...s, status: "not-started" as const, startedAt: null, completedAt: null };
        });

        const current = steps.find((s) => s.status !== "complete") ?? null;
        return {
          ...p,
          steps,
          currentStep: current,
          currentStepKey: current?.key ?? "done",
          completedCount: steps.filter((s) => s.status === "complete").length,
          daysInStage: 0,
          stalled: false,
          blocked: false,
          overdue: false,
        };
      }),
    );
  }

  const columns: Column<PermitProjectView>[] = [
    {
      key: "customer",
      header: "Project",
      width: "20%",
      sortValue: (p) => p.contactName,
      cell: (p) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-ink">{p.contactName}</span>
          <span className="block truncate text-micro text-muted">{p.authority}</span>
        </span>
      ),
    },
    {
      key: "step",
      header: "Current step",
      sortValue: (p) =>
        p.currentStepKey === "done" ? 99 : PERMIT_STEP_ORDER.indexOf(p.currentStepKey),
      cell: (p) =>
        p.currentStep ? (
          <span className="block">
            <span className="block text-sm font-medium text-ink">
              {PERMIT_STEP[p.currentStep.key].label}
            </span>
            <StatusBadge spec={PERMIT_STATUS[p.currentStep.status]} size="sm" className="mt-1" />
          </span>
        ) : (
          <StatusBadge label="PTO granted — done" tone="ok" size="sm" />
        ),
    },
    {
      key: "progress",
      header: "Steps done",
      hideBelow: "md",
      sortValue: (p) => p.completedCount,
      cell: (p) => (
        <StepProgress
          completed={p.completedCount}
          total={6}
          tone={p.blocked ? "danger" : p.stalled ? "warn" : "ok"}
        />
      ),
    },
    {
      key: "days",
      header: "In this stage",
      align: "right",
      numeric: true,
      sortValue: (p) => (p.currentStepKey === "done" ? -1 : p.daysInStage),
      cell: (p) =>
        p.currentStepKey === "done" ? (
          <span className="text-tiny text-muted">—</span>
        ) : (
          <span
            className={
              p.stalled || p.blocked ? "font-semibold text-danger" : "text-ink-soft"
            }
          >
            {dayCount(p.daysInStage)}
          </span>
        ),
    },
    {
      key: "due",
      header: "Target date",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (p) => p.currentStep?.dueAt ?? "9999",
      cell: (p) =>
        p.currentStep?.dueAt ? (
          <span className={p.overdue ? "font-semibold text-danger" : "text-ink-soft"}>
            {date(p.currentStep.dueAt)}
            <span className="block text-micro font-normal text-muted">
              {relativeDays(p.currentStep.dueAt)}
            </span>
          </span>
        ) : (
          <span className="text-tiny text-faint">None set</span>
        ),
    },
    {
      key: "ref",
      header: "Reference",
      hideBelow: "lg",
      sortValue: (p) => p.steps.find((s) => s.referenceNumber)?.referenceNumber ?? "",
      cell: (p) => {
        const ref = p.currentStep?.referenceNumber ?? p.steps.find((s) => s.referenceNumber)?.referenceNumber;
        return ref ? (
          <span className="tnum text-tiny text-ink-soft">{ref}</span>
        ) : (
          <span className="text-tiny text-faint">—</span>
        );
      },
    },
    {
      key: "owner",
      header: "Coordinator",
      hideBelow: "md",
      sortValue: (p) => memberName(p.ownerId),
      cell: (p) => <span className="text-sm">{memberName(p.ownerId)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Permitting & interconnection"
        lede="Six steps from filing to permission to operate. This board exists to show you what is stuck and for how long."
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
          <MetricTile
            label="In flight"
            value={inFlight.length}
            tone="info"
            icon={Stamp}
            hint="Not yet PTO'd"
          />
          <MetricTile
            label="Blocked"
            value={filtered.filter((p) => p.blocked).length}
            tone="danger"
            hint="Waiting on a correction"
          />
          <MetricTile
            label="Past target date"
            value={filtered.filter((p) => p.overdue).length}
            tone="warn"
          />
          <MetricTile
            label="Parked over 21 days"
            value={filtered.filter((p) => p.stalled).length}
            tone="warn"
          />
        </div>

        {needsAttention.length > 0 && (
          <div className="space-y-2">
            {needsAttention.slice(0, 3).map((p) => (
              <AlertLine
                key={p.projectId}
                tone={p.blocked ? "danger" : "warn"}
                icon={p.blocked ? CircleAlert : TriangleAlert}
              >
                <strong className="font-semibold">{p.contactName}</strong> —{" "}
                {p.currentStep ? PERMIT_STEP[p.currentStep.key].label : ""} at {p.authority},{" "}
                {dayCount(p.daysInStage)} in this stage.{" "}
                {p.currentStep?.notes ?? ""}{" "}
                <button
                  type="button"
                  onClick={() => setOpenId(p.projectId)}
                  className="font-semibold underline"
                >
                  Open the tracker
                </button>
              </AlertLine>
            ))}
          </div>
        )}

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search customer, city or permit number…"
            icon={Search}
          />
          <SelectFilter
            label="Coordinator"
            value={ownerFilter}
            onChange={setOwnerFilter}
            options={[{ value: "all", label: "Everyone" }, ...owners]}
          />
          <span className="tnum ml-auto text-tiny text-muted">
            {filtered.length} projects
          </span>
        </TableToolbar>

        {view === "board" ? (
          <KanbanBoard
            columns={BOARD_COLUMNS.map((key) => ({
              key,
              label: key === "done" ? "PTO granted" : PERMIT_STEP[key].short,
              tone: key === "done" ? "ok" : "info",
              meta:
                key === "done"
                  ? "Producing and signed off"
                  : PERMIT_STEP[key].authorityKind === "ahj"
                    ? "City / county"
                    : PERMIT_STEP[key].authorityKind === "utility"
                      ? "Utility"
                      : "Our crew",
            }))}
            items={filtered}
            itemKey={(p) => p.projectId}
            itemStage={(p) => p.currentStepKey}
            onMove={(id, to) => moveToStep(id, to as PermitStepKey | "done")}
            renderCard={(p) => (
              <button
                type="button"
                onClick={() => setOpenId(p.projectId)}
                className="block w-full px-3 py-2.5 pr-7 text-left"
              >
                <p className="truncate text-sm font-semibold text-ink">{p.contactName}</p>
                <p className="truncate text-micro text-muted">{p.authority}</p>

                <div className="mt-2">
                  <StepProgress
                    completed={p.completedCount}
                    total={6}
                    tone={p.blocked ? "danger" : p.stalled ? "warn" : "ok"}
                  />
                </div>

                {p.currentStepKey !== "done" && (
                  <p
                    className={
                      p.blocked || p.stalled
                        ? "tnum mt-2 text-micro font-semibold text-danger"
                        : "tnum mt-2 text-micro text-muted"
                    }
                  >
                    {dayCount(p.daysInStage)} in this stage
                    {p.overdue ? " · past target" : ""}
                  </p>
                )}

                {p.currentStep?.status === "blocked" && p.currentStep.notes && (
                  <p className="mt-1.5 line-clamp-3 border-t border-rule pt-1.5 text-micro leading-relaxed text-danger">
                    {p.currentStep.notes}
                  </p>
                )}

                <p className="mt-1.5 text-micro text-faint">
                  {memberName(p.ownerId).split(" ")[0]}
                </p>
              </button>
            )}
            emptyColumn={(col) => (
              <p className="px-2 py-6 text-tiny leading-relaxed text-faint">
                No jobs sitting at {col.label.toLowerCase()}.
              </p>
            )}
          />
        ) : (
          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={(p) => p.projectId}
            onRowClick={(p) => setOpenId(p.projectId)}
            activeRowKey={openId}
            empty={
              <EmptyState
                icon={Stamp}
                title="No permits match those filters"
                body="Signed contracts show up here once a coordinator files the first permit."
                align="center"
              />
            }
          />
        )}
      </PageBody>

      <PermitPanel project={open} onClose={() => setOpenId(null)} />
    </>
  );
}
