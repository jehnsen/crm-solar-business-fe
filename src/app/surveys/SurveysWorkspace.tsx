"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { contactOf, memberName } from "@/lib/api";
import { ROOF_CONDITION, ROOF_TYPE, SURVEY_STATUS } from "@/lib/labels";
import { TODAY, date, dateWithDay, num, pct, time } from "@/lib/format";
import type { SiteSurvey } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CalendarMonth,
  CalendarWeek,
  addDays,
  startOfWeek,
  type CalendarEvent,
} from "@/components/ui/CalendarWeek";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SurveyPanel } from "./SurveyPanel";

type View = "week" | "month" | "list";

export function SurveysWorkspace({ surveys }: { surveys: SiteSurvey[] }) {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => startOfWeek(TODAY));
  const [openId, setOpenId] = useState<string | null>(null);
  const [techFilter, setTechFilter] = useState("all");

  const techs = useMemo(() => {
    const ids = [...new Set(surveys.map((s) => s.assignedTechId))];
    return ids.map((id) => ({ value: id, label: memberName(id) }));
  }, [surveys]);

  const visible = useMemo(
    () => (techFilter === "all" ? surveys : surveys.filter((s) => s.assignedTechId === techFilter)),
    [surveys, techFilter],
  );

  const events: CalendarEvent[] = useMemo(
    () =>
      visible.map((s) => ({
        id: s.id,
        start: s.scheduledFor,
        durationMin: s.durationMin,
        title: contactOf(s.contactId)?.name ?? "Survey",
        subtitle: memberName(s.assignedTechId),
        tone: SURVEY_STATUS[s.status].tone,
      })),
    [visible],
  );

  const open = openId ? surveys.find((s) => s.id === openId) ?? null : null;

  const upcoming = useMemo(
    () =>
      [...visible]
        .filter((s) => s.status === "scheduled" || s.status === "in-progress")
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [visible],
  );

  const columns: Column<SiteSurvey>[] = [
    {
      key: "when",
      header: "Scheduled",
      sortValue: (s) => s.scheduledFor,
      cell: (s) => (
        <span className="block">
          <span className="tnum block font-medium text-ink">{dateWithDay(s.scheduledFor)}</span>
          <span className="tnum block text-micro text-muted">
            {time(s.scheduledFor)} · {num(s.durationMin)} min
          </span>
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      width: "22%",
      sortValue: (s) => contactOf(s.contactId)?.name ?? "",
      cell: (s) => {
        const c = contactOf(s.contactId);
        return (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-ink">{c?.name}</span>
            <span className="block truncate text-micro text-muted">
              {c?.address.street}, {c?.address.city}
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortValue: (s) => SURVEY_STATUS[s.status].label,
      cell: (s) => <StatusBadge spec={SURVEY_STATUS[s.status]} dot />,
    },
    {
      key: "tech",
      header: "Tech",
      hideBelow: "md",
      sortValue: (s) => memberName(s.assignedTechId),
      cell: (s) => <span className="text-sm">{memberName(s.assignedTechId)}</span>,
    },
    {
      key: "roof",
      header: "Roof",
      hideBelow: "lg",
      sortValue: (s) => (s.roofType ? ROOF_TYPE[s.roofType] : "zzz"),
      cell: (s) =>
        s.roofType ? (
          <span className="block">
            <span className="block text-sm">{ROOF_TYPE[s.roofType]}</span>
            {s.roofCondition && (
              <span className="block text-micro text-muted">
                {ROOF_CONDITION[s.roofCondition].label}
                {s.roofAgeYears !== null ? ` · ${s.roofAgeYears} yrs` : ""}
              </span>
            )}
          </span>
        ) : (
          <span className="text-tiny text-faint">Not measured</span>
        ),
    },
    {
      key: "usable",
      header: "Usable roof",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (s) => s.usableRoofSqft ?? 0,
      cell: (s) => (s.usableRoofSqft ? `${num(s.usableRoofSqft)} sq ft` : "—"),
    },
    {
      key: "shade",
      header: "Shade loss",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (s) => s.shadingLossPct ?? -1,
      cell: (s) => (s.shadingLossPct !== null ? pct(s.shadingLossPct) : "—"),
    },
    {
      key: "panel",
      header: "Panel upgrade",
      align: "right",
      hideBelow: "lg",
      sortValue: (s) => (s.panelUpgradeNeeded ? 0 : 1),
      cell: (s) =>
        s.panelUpgradeNeeded ? (
          <StatusBadge label="Needed" tone="warn" size="sm" />
        ) : (
          <span className="text-tiny text-muted">No</span>
        ),
    },
  ];

  const rangeLabel =
    view === "month"
      ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : `${date(anchor)} — ${date(addDays(anchor, 6))}`;

  return (
    <>
      <PageHeader
        title="Site surveys"
        lede="Who is on a roof this week, and what they found when they got there."
        actions={
          <Button variant="primary">
            <CalendarPlus className="size-4" strokeWidth={2.25} />
            Schedule survey
          </Button>
        }
        tabs={
          <>
            <ViewTab active={view === "week"} onClick={() => setView("week")}>
              Week
            </ViewTab>
            <ViewTab active={view === "month"} onClick={() => setView("month")}>
              Month
            </ViewTab>
            <ViewTab active={view === "list"} onClick={() => setView("list")} count={visible.length}>
              List
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-3">
        <TableToolbar>
          {view !== "list" && (
            <>
              <div className="inline-flex overflow-hidden rounded border border-rule-firm">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => setAnchor((a) => addDays(a, view === "month" ? -28 : -7))}
                  className="flex size-8 items-center justify-center border-r border-rule-firm bg-surface text-muted hover:bg-canvas-sunk hover:text-ink"
                >
                  <ChevronLeft className="size-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => setAnchor((a) => addDays(a, view === "month" ? 28 : 7))}
                  className="flex size-8 items-center justify-center bg-surface text-muted hover:bg-canvas-sunk hover:text-ink"
                >
                  <ChevronRight className="size-4" strokeWidth={2} />
                </button>
              </div>
              <Button size="sm" onClick={() => setAnchor(startOfWeek(TODAY))}>
                This week
              </Button>
              <span className="tnum text-sm font-medium text-ink">{rangeLabel}</span>
            </>
          )}
          <SelectFilter
            label="Tech"
            value={techFilter}
            onChange={setTechFilter}
            options={[{ value: "all", label: "All techs" }, ...techs]}
          />
          <span className="tnum ml-auto text-tiny text-muted">
            {upcoming.length} upcoming
          </span>
        </TableToolbar>

        {view === "week" && (
          <CalendarWeek
            weekStart={anchor}
            events={events}
            onSelect={setOpenId}
            activeId={openId}
          />
        )}

        {view === "month" && (
          <CalendarMonth
            monthStart={new Date(anchor.getFullYear(), anchor.getMonth(), 1)}
            events={events}
            onSelect={setOpenId}
          />
        )}

        {view === "list" && (
          <DataTable
            rows={visible}
            columns={columns}
            rowKey={(s) => s.id}
            onRowClick={(s) => setOpenId(s.id)}
            activeRowKey={openId}
            initialSort={{ key: "when", dir: "desc" }}
            empty={
              <EmptyState
                icon={ClipboardCheck}
                title="No surveys for this tech"
                body="Switch to All techs, or schedule a visit from a qualified lead."
                align="center"
              />
            }
          />
        )}

        {view === "week" && events.length === 0 && (
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing booked this week"
            body="Use the arrows to check another week, or schedule a survey for a qualified lead."
          />
        )}
      </PageBody>

      <SurveyPanel survey={open} onClose={() => setOpenId(null)} />
    </>
  );
}
