"use client";

import { useMemo, useState } from "react";
import { CircleAlert, Plus, Search, Users } from "lucide-react";
import { LEAD_SOURCE, LEAD_STAGE, LEAD_STAGE_ORDER } from "@/lib/labels";
import { contactOf, member, memberName } from "@/lib/lookups";
import { date, isOverdue, kw, relativeDays, usd } from "@/lib/format";
import type { Lead, LeadStage } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { KanbanBoard } from "@/components/ui/KanbanBoard";
import { AlertLine, PersonCell, SearchInput } from "@/components/ui/Primitives";
import { ScoreChip, StatusBadge } from "@/components/ui/StatusBadge";
import { LeadPanel } from "./LeadPanel";

type View = "list" | "board";

export function LeadsWorkspace({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [view, setView] = useState<View>("list");
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");

  const reps = useMemo(() => {
    const ids = [...new Set(initialLeads.map((l) => l.assignedRepId))];
    return ids.map((id) => ({ value: id, label: memberName(id) }));
  }, [initialLeads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (repFilter !== "all" && l.assignedRepId !== repFilter) return false;
      if (!q) return true;
      const contact = contactOf(l.contactId);
      return (
        contact?.name.toLowerCase().includes(q) ||
        contact?.address.city.toLowerCase().includes(q) ||
        contact?.company?.toLowerCase().includes(q) ||
        false
      );
    });
  }, [leads, query, stageFilter, repFilter]);

  const open = openId ? leads.find((l) => l.id === openId) ?? null : null;

  function moveStage(leadId: string, to: LeadStage) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, stage: to, lastTouchedAt: new Date().toISOString() } : l,
      ),
    );
  }

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Customer",
      width: "22%",
      sortValue: (l) => contactOf(l.contactId)?.name ?? "",
      cell: (l) => {
        const c = contactOf(l.contactId);
        return (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-ink">{c?.name}</span>
            <span className="block truncate text-micro text-muted">
              {c?.address.city}, {c?.address.state} · {c?.propertyType === "commercial" ? "Commercial" : "Residential"}
            </span>
          </span>
        );
      },
    },
    {
      key: "stage",
      header: "Stage",
      sortValue: (l) => LEAD_STAGE_ORDER.indexOf(l.stage),
      cell: (l) => <StatusBadge spec={LEAD_STAGE[l.stage]} dot />,
    },
    {
      key: "source",
      header: "Source",
      hideBelow: "lg",
      sortValue: (l) => LEAD_SOURCE[l.source].label,
      cell: (l) => <span className="text-sm">{LEAD_SOURCE[l.source].label}</span>,
    },
    {
      key: "rep",
      header: "Assigned rep",
      hideBelow: "md",
      sortValue: (l) => memberName(l.assignedRepId),
      cell: (l) => {
        const m = member(l.assignedRepId);
        return m ? <PersonCell name={m.name} initials={m.initials} /> : "—";
      },
    },
    {
      key: "size",
      header: "Est. system",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (l) => l.estimatedSystemKw,
      cell: (l) => kw(l.estimatedSystemKw),
    },
    {
      key: "bill",
      header: "Monthly bill",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (l) => l.monthlyBillUsd,
      cell: (l) => usd(l.monthlyBillUsd),
    },
    {
      key: "score",
      header: "Eligibility",
      align: "right",
      numeric: true,
      sortValue: (l) => l.eligibilityScore,
      cell: (l) => <ScoreChip score={l.eligibilityScore} />,
    },
    {
      key: "created",
      header: "Created",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (l) => l.createdAt,
      cell: (l) => date(l.createdAt),
    },
    {
      key: "next",
      header: "Next action",
      width: "20%",
      sortValue: (l) => l.nextActionDue ?? "9999",
      cell: (l) =>
        l.nextAction ? (
          <span className="block min-w-0">
            <span className="block truncate text-sm text-ink-soft">{l.nextAction}</span>
            <span
              className={
                isOverdue(l.nextActionDue)
                  ? "tnum block text-micro font-semibold text-danger"
                  : "tnum block text-micro text-muted"
              }
            >
              {isOverdue(l.nextActionDue) ? "Overdue — due " : "Due "}
              {relativeDays(l.nextActionDue)}
            </span>
          </span>
        ) : (
          <span className="text-tiny text-faint">Nothing queued</span>
        ),
    },
  ];

  const overdueCount = filtered.filter((l) => isOverdue(l.nextActionDue)).length;

  return (
    <>
      <PageHeader
        title="Leads"
        lede="Everyone who has raised a hand, and what has to happen next for each of them."
        actions={
          <Button variant="primary">
            <Plus className="size-4" strokeWidth={2.5} />
            Add lead
          </Button>
        }
        tabs={
          <>
            <ViewTab active={view === "list"} onClick={() => setView("list")} count={filtered.length}>
              List
            </ViewTab>
            <ViewTab active={view === "board"} onClick={() => setView("board")}>
              Board
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-3">
        {overdueCount > 0 && (
          <AlertLine tone="danger" icon={CircleAlert}>
            {overdueCount} {overdueCount === 1 ? "lead has" : "leads have"} a next action past its
            due date. Sort by Next action to work through them.
          </AlertLine>
        )}

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search name, city, company…"
            icon={Search}
          />
          <SelectFilter
            label="Stage"
            value={stageFilter}
            onChange={setStageFilter}
            options={[
              { value: "all", label: "All stages" },
              ...LEAD_STAGE_ORDER.map((s) => ({ value: s, label: LEAD_STAGE[s].label })),
            ]}
          />
          <SelectFilter
            label="Rep"
            value={repFilter}
            onChange={setRepFilter}
            options={[{ value: "all", label: "Everyone" }, ...reps]}
          />
          <span className="tnum ml-auto text-tiny text-muted">
            {filtered.length} of {leads.length}
          </span>
        </TableToolbar>

        {view === "list" ? (
          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={(l) => l.id}
            onRowClick={(l) => setOpenId(l.id)}
            activeRowKey={openId}
            initialSort={{ key: "next", dir: "asc" }}
            empty={
              <EmptyState
                icon={Users}
                title="No leads match those filters"
                body="Clear the stage or rep filter to see the rest of the board, or add a lead if someone new just called in."
                align="center"
                action={
                  <Button
                    onClick={() => {
                      setStageFilter("all");
                      setRepFilter("all");
                      setQuery("");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            }
          />
        ) : (
          <KanbanBoard
            columns={LEAD_STAGE_ORDER.map((stage) => ({
              key: stage,
              label: LEAD_STAGE[stage].label,
              tone: LEAD_STAGE[stage].tone,
              meta: LEAD_STAGE[stage].hint,
            }))}
            items={filtered}
            itemKey={(l) => l.id}
            itemStage={(l) => l.stage}
            onMove={(id, to) => moveStage(id, to)}
            renderCard={(l) => {
              const c = contactOf(l.contactId);
              const m = member(l.assignedRepId);
              return (
                <button
                  type="button"
                  onClick={() => setOpenId(l.id)}
                  className="block w-full px-3 py-2.5 pr-7 text-left"
                >
                  <p className="truncate text-sm font-semibold text-ink">{c?.name}</p>
                  <p className="truncate text-micro text-muted">
                    {c?.address.city} · {LEAD_SOURCE[l.source].label}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="tnum text-tiny text-ink-soft">{kw(l.estimatedSystemKw)}</span>
                    <ScoreChip score={l.eligibilityScore} />
                  </div>
                  {l.nextAction && (
                    <p
                      className={
                        isOverdue(l.nextActionDue)
                          ? "mt-2 border-t border-rule pt-2 text-micro font-medium text-danger"
                          : "mt-2 border-t border-rule pt-2 text-micro text-muted"
                      }
                    >
                      {l.nextAction}
                    </p>
                  )}
                  {m && (
                    <p className="mt-1.5 text-micro text-faint">{m.name.split(" ")[0]}</p>
                  )}
                </button>
              );
            }}
            emptyColumn={(col) => (
              <p className="px-2 py-6 text-tiny leading-relaxed text-faint">
                Nothing in {col.label.toLowerCase()} right now. Drag a card here when it moves.
              </p>
            )}
          />
        )}
      </PageBody>

      <LeadPanel
        lead={open}
        onClose={() => setOpenId(null)}
        onStageChange={(to) => open && moveStage(open.id, to)}
      />
    </>
  );
}
