"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, CircleAlert, ListChecks, Search } from "lucide-react";
import { contactOf, memberName } from "@/lib/api";
import {
  TASK_KIND,
  TASK_PRIORITY,
  TASK_STATUS,
  TASK_TRIGGER,
  TEAM_ROLE,
  TONE_BAR,
} from "@/lib/labels";
import { TODAY, date, dayCount, daysBetween, relativeDays } from "@/lib/format";
import type { Task, TaskPriority, TaskStatus, TeamMember } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { clsx } from "clsx";
import { AlertLine, Card, MetricTile, SearchInput } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TaskPanel } from "./TaskPanel";

type View = "queue" | "all";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function isLive(t: Task): boolean {
  return t.status === "open" || t.status === "in-progress";
}

export function TasksWorkspace({
  initialTasks,
  team,
}: {
  initialTasks: Task[];
  team: TeamMember[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<View>("queue");
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("live");

  /** Every active teammate, not just those who already carry work — otherwise
   *  you can't filter to someone to discover they have nothing queued. */
  const assignees = useMemo(
    () =>
      team
        .filter((m) => m.active)
        .map((m) => ({ value: m.id, label: `${m.name} — ${TEAM_ROLE[m.role]}` })),
    [team],
  );

  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (assigneeFilter !== "all" && t.assigneeId !== assigneeFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (contactOf(t.contactId)?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tasks, query, assigneeFilter]);

  /** Buckets by when the work is due — the only question this page answers. */
  const buckets = useMemo(() => {
    const today = TODAY.getTime();
    const weekEnd = today + 7 * 86_400_000;
    const out = {
      overdue: [] as Task[],
      today: [] as Task[],
      thisWeek: [] as Task[],
      later: [] as Task[],
      snoozed: [] as Task[],
    };

    for (const t of scoped) {
      if (t.status === "snoozed") {
        out.snoozed.push(t);
        continue;
      }
      if (!isLive(t)) continue;
      const due = new Date(t.dueAt).getTime();
      if (due < today) out.overdue.push(t);
      else if (due === today) out.today.push(t);
      else if (due < weekEnd) out.thisWeek.push(t);
      else out.later.push(t);
    }

    const byDue = (a: Task, b: Task) =>
      a.dueAt.localeCompare(b.dueAt) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    out.overdue.sort(byDue);
    out.today.sort(byDue);
    out.thisWeek.sort(byDue);
    out.later.sort(byDue);
    return out;
  }, [scoped]);

  const tableRows = useMemo(() => {
    if (statusFilter === "live") return scoped.filter(isLive);
    if (statusFilter === "all") return scoped;
    return scoped.filter((t) => t.status === statusFilter);
  }, [scoped, statusFilter]);

  const open = openId ? tasks.find((t) => t.id === openId) ?? null : null;

  function complete(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "done" as TaskStatus,
              completedAt: new Date().toISOString().slice(0, 10),
              snoozedUntil: null,
            }
          : t,
      ),
    );
  }

  function setStatus(id: string, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === "done" ? new Date().toISOString().slice(0, 10) : null,
              snoozedUntil:
                status === "snoozed"
                  ? new Date(TODAY.getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
                  : null,
            }
          : t,
      ),
    );
  }

  const columns: Column<Task>[] = [
    {
      key: "priority",
      header: "Priority",
      sortValue: (t) => PRIORITY_RANK[t.priority],
      cell: (t) => <StatusBadge spec={TASK_PRIORITY[t.priority]} dot />,
    },
    {
      key: "title",
      header: "What needs doing",
      width: "30%",
      sortValue: (t) => t.title,
      cell: (t) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-ink">{t.title}</span>
          <span className="block truncate text-micro text-muted">
            {contactOf(t.contactId)?.name} · {TASK_KIND[t.kind]}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => TASK_STATUS[t.status].label,
      cell: (t) => <StatusBadge spec={TASK_STATUS[t.status]} />,
    },
    {
      key: "due",
      header: "Due",
      align: "right",
      numeric: true,
      sortValue: (t) => t.dueAt,
      cell: (t) => {
        const overdue = isLive(t) && new Date(t.dueAt).getTime() < TODAY.getTime();
        return (
          <span className="block">
            <span className={overdue ? "block font-semibold text-danger" : "block text-ink-soft"}>
              {date(t.dueAt)}
            </span>
            <span className={overdue ? "block text-micro text-danger" : "block text-micro text-muted"}>
              {relativeDays(t.dueAt)}
            </span>
          </span>
        );
      },
    },
    {
      key: "assignee",
      header: "Owner",
      hideBelow: "md",
      sortValue: (t) => memberName(t.assigneeId),
      cell: (t) => <span className="text-sm">{memberName(t.assigneeId)}</span>,
    },
    {
      key: "trigger",
      header: "Why",
      hideBelow: "lg",
      sortValue: (t) => TASK_TRIGGER[t.trigger],
      cell: (t) => <span className="text-tiny text-muted">{TASK_TRIGGER[t.trigger]}</span>,
    },
    {
      key: "done",
      header: "",
      align: "right",
      cell: (t) =>
        isLive(t) ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              complete(t.id);
            }}
            title="Mark done"
            aria-label={`Mark done: ${t.title}`}
            className="inline-flex size-6 items-center justify-center rounded border border-rule-firm text-muted transition-colors hover:border-ok hover:bg-ok-wash hover:text-ok"
          >
            <Check className="size-3.5" strokeWidth={2.5} />
          </button>
        ) : null,
    },
  ];

  const liveCount = scoped.filter(isLive).length;

  return (
    <>
      <PageHeader
        title="Follow-ups"
        lede="Everything someone owes a customer — before the sale and long after it."
        actions={
          <Button variant="primary">
            <ListChecks className="size-4" strokeWidth={2.25} />
            Add a follow-up
          </Button>
        }
        tabs={
          <>
            <ViewTab active={view === "queue"} onClick={() => setView("queue")} count={liveCount}>
              My queue
            </ViewTab>
            <ViewTab active={view === "all"} onClick={() => setView("all")}>
              All follow-ups
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile
            label="Overdue"
            value={buckets.overdue.length}
            tone={buckets.overdue.length > 0 ? "danger" : "ok"}
            hint="Past the date we said"
          />
          <MetricTile label="Due today" value={buckets.today.length} tone="solar" />
          <MetricTile
            label="Rest of the week"
            value={buckets.thisWeek.length}
            tone="info"
            icon={CalendarClock}
          />
          <MetricTile
            label="After the sale"
            value={scoped.filter((t) => isLive(t) && t.leadId === null).length}
            hint="Check-ins, warranty, referrals"
          />
        </div>

        {buckets.overdue.length > 0 && (
          <AlertLine tone="danger" icon={CircleAlert}>
            {buckets.overdue.length} follow-{buckets.overdue.length === 1 ? "up is" : "ups are"} past
            due — the oldest by {dayCount(Math.max(...buckets.overdue.map((t) => daysBetween(t.dueAt))))}.
          </AlertLine>
        )}

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search task or customer…"
            icon={Search}
          />
          <SelectFilter
            label="Owner"
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            options={[{ value: "all", label: "Everyone" }, ...assignees]}
          />
          {view === "all" && (
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "live", label: "Still open" },
                { value: "all", label: "Everything" },
                { value: "open", label: "Open" },
                { value: "in-progress", label: "Working on it" },
                { value: "done", label: "Done" },
                { value: "snoozed", label: "Snoozed" },
                { value: "canceled", label: "Dropped" },
              ]}
            />
          )}
          <span className="tnum ml-auto text-tiny text-muted">
            {view === "queue" ? `${liveCount} open` : `${tableRows.length} shown`}
          </span>
        </TableToolbar>

        {view === "queue" ? (
          <div className="space-y-4">
            <Bucket
              title="Overdue"
              tone="danger"
              tasks={buckets.overdue}
              onOpen={setOpenId}
              onComplete={complete}
              emptyBody="Nothing is past due. Keep it that way."
            />
            <Bucket
              title="Due today"
              tone="solar"
              tasks={buckets.today}
              onOpen={setOpenId}
              onComplete={complete}
              emptyBody="Nothing due today."
            />
            <Bucket
              title="Rest of this week"
              tone="info"
              tasks={buckets.thisWeek}
              onOpen={setOpenId}
              onComplete={complete}
              emptyBody="Nothing else lands this week."
            />
            <Bucket
              title="Later"
              tone="idle"
              tasks={buckets.later}
              onOpen={setOpenId}
              onComplete={complete}
              emptyBody="Nothing queued further out."
            />
            {buckets.snoozed.length > 0 && (
              <Bucket
                title="Snoozed"
                tone="idle"
                tasks={buckets.snoozed}
                onOpen={setOpenId}
                onComplete={complete}
                emptyBody=""
              />
            )}
          </div>
        ) : (
          <DataTable
            rows={tableRows}
            columns={columns}
            rowKey={(t) => t.id}
            onRowClick={(t) => setOpenId(t.id)}
            activeRowKey={openId}
            initialSort={{ key: "due", dir: "asc" }}
            empty={
              <EmptyState
                icon={CalendarClock}
                title="No follow-ups match those filters"
                body="Clear the owner or status filter, or add a follow-up for a customer who needs a call."
                align="center"
              />
            }
          />
        )}
      </PageBody>

      <TaskPanel
        task={open}
        onClose={() => setOpenId(null)}
        onComplete={() => open && complete(open.id)}
        onStatus={(s) => open && setStatus(open.id, s)}
      />
    </>
  );
}

function Bucket({
  title,
  tone,
  tasks,
  onOpen,
  onComplete,
  emptyBody,
}: {
  title: string;
  tone: "danger" | "solar" | "info" | "idle";
  tasks: Task[];
  onOpen: (id: string) => void;
  onComplete: (id: string) => void;
  emptyBody: string;
}) {
  if (tasks.length === 0 && !emptyBody) return null;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {/* Urgency reads on the rail, but the bucket is always named. */}
          <span className={clsx("h-3.5 w-[3px] shrink-0 rounded-full", TONE_BAR[tone])} />
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          <span className="tnum shrink-0 text-tiny text-muted">{tasks.length}</span>
        </div>
      </div>
      {tasks.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted">{emptyBody}</p>
      ) : (
        <ul className="divide-y divide-rule">
          {tasks.map((t) => {
            const contact = contactOf(t.contactId);
            const overdue = new Date(t.dueAt).getTime() < TODAY.getTime() && isLive(t);
            return (
              <li key={t.id} className="flex items-start gap-3 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onComplete(t.id)}
                  title="Mark done"
                  aria-label={`Mark done: ${t.title}`}
                  className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded border border-rule-firm text-transparent transition-colors hover:border-ok hover:bg-ok-wash hover:text-ok"
                >
                  <Check className="size-3" strokeWidth={3} />
                </button>

                <button
                  type="button"
                  onClick={() => onOpen(t.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block text-sm font-medium text-ink">{t.title}</span>
                  <span className="mt-0.5 block truncate text-micro text-muted">
                    {contact?.name} · {TASK_KIND[t.kind]} · {memberName(t.assigneeId)}
                  </span>
                </button>

                <span className="flex shrink-0 items-center gap-2">
                  <StatusBadge spec={TASK_PRIORITY[t.priority]} size="sm" />
                  <span
                    className={
                      overdue
                        ? "tnum w-24 text-right text-tiny font-semibold text-danger"
                        : "tnum w-24 text-right text-tiny text-muted"
                    }
                  >
                    {t.status === "snoozed" && t.snoozedUntil
                      ? `until ${date(t.snoozedUntil)}`
                      : relativeDays(t.dueAt)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
