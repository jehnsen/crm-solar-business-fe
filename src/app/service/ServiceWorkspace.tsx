"use client";

import { useMemo, useState } from "react";
import { LifeBuoy, Plus, Search, ShieldCheck } from "lucide-react";
import { contactOf, memberName } from "@/lib/api";
import {
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  TICKET_STATUS,
  WARRANTY_COVER,
} from "@/lib/labels";
import { TODAY, date, daysBetween, dayCount, relativeDays } from "@/lib/format";
import type { ServiceTicket, TicketPriority, WarrantyRecord } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricTile, SearchInput } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TicketPanel } from "./TicketPanel";

type View = "tickets" | "warranty";

const PRIORITY_RANK: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export function ServiceWorkspace({
  tickets,
  warranties,
}: {
  tickets: ServiceTicket[];
  warranties: WarrantyRecord[];
}) {
  const [rows, setRows] = useState(tickets);
  const [view, setView] = useState<View>("tickets");
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open-only");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((t) => {
      if (statusFilter === "open-only" && (t.status === "resolved" || t.status === "closed"))
        return false;
      if (statusFilter !== "all" && statusFilter !== "open-only" && t.status !== statusFilter)
        return false;
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        (contactOf(t.contactId)?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, statusFilter]);

  const open = openId ? rows.find((t) => t.id === openId) ?? null : null;

  function resolveTicket(id: string) {
    setRows((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "resolved" as const, resolvedAt: new Date().toISOString() }
          : t,
      ),
    );
  }

  const openTickets = rows.filter((t) => t.status !== "resolved" && t.status !== "closed");
  const urgent = openTickets.filter((t) => t.priority === "urgent");
  const unassigned = openTickets.filter((t) => !t.assignedTechId);
  const waitingParts = openTickets.filter((t) => t.status === "waiting-on-parts");

  const ticketColumns: Column<ServiceTicket>[] = [
    {
      key: "priority",
      header: "Priority",
      sortValue: (t) => PRIORITY_RANK[t.priority],
      cell: (t) => <StatusBadge spec={TICKET_PRIORITY[t.priority]} dot />,
    },
    {
      key: "subject",
      header: "Issue",
      width: "26%",
      sortValue: (t) => t.subject,
      cell: (t) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-ink">{t.subject}</span>
          <span className="block truncate text-micro text-muted">
            {contactOf(t.contactId)?.name} · {TICKET_CATEGORY[t.category]}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => TICKET_STATUS[t.status].label,
      cell: (t) => <StatusBadge spec={TICKET_STATUS[t.status]} />,
    },
    {
      key: "age",
      header: "Open for",
      align: "right",
      numeric: true,
      sortValue: (t) => -daysBetween(t.openedAt),
      cell: (t) => {
        const days = daysBetween(t.openedAt);
        const stale = days > 7 && t.status !== "resolved" && t.status !== "closed";
        return (
          <span className={stale ? "font-semibold text-warn" : "text-ink-soft"}>
            {dayCount(days)}
          </span>
        );
      },
    },
    {
      key: "tech",
      header: "Assigned",
      hideBelow: "md",
      sortValue: (t) => (t.assignedTechId ? memberName(t.assignedTechId) : "zzz"),
      cell: (t) =>
        t.assignedTechId ? (
          <span className="text-sm">{memberName(t.assignedTechId)}</span>
        ) : (
          <StatusBadge label="Nobody yet" tone="warn" size="sm" />
        ),
    },
    {
      key: "scheduled",
      header: "Scheduled",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (t) => t.scheduledFor ?? "9999",
      cell: (t) =>
        t.scheduledFor ? (
          <span className="block">
            <span className="block">{date(t.scheduledFor)}</span>
            <span className="block text-micro text-muted">{relativeDays(t.scheduledFor)}</span>
          </span>
        ) : (
          <span className="text-tiny text-faint">Not booked</span>
        ),
    },
    {
      key: "warranty",
      header: "Covered by",
      hideBelow: "lg",
      sortValue: (t) => t.warrantyCoveredBy,
      cell: (t) => <StatusBadge spec={WARRANTY_COVER[t.warrantyCoveredBy]} size="sm" />,
    },
  ];

  const warrantyColumns: Column<WarrantyRecord>[] = [
    {
      key: "customer",
      header: "Customer",
      width: "24%",
      sortValue: (w) => contactOf(w.contactId)?.name ?? "",
      cell: (w) => {
        const c = contactOf(w.contactId);
        return (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-ink">{c?.name}</span>
            <span className="block truncate text-micro text-muted">
              {c?.address.city}, {c?.address.state}
            </span>
          </span>
        );
      },
    },
    {
      key: "workmanship",
      header: "Workmanship",
      align: "right",
      numeric: true,
      sortValue: (w) => w.workmanshipExpiresAt,
      cell: (w) => <WarrantyCell iso={w.workmanshipExpiresAt} />,
    },
    {
      key: "panels",
      header: "Panels",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (w) => w.panelExpiresAt,
      cell: (w) => <WarrantyCell iso={w.panelExpiresAt} />,
    },
    {
      key: "inverter",
      header: "Inverter",
      align: "right",
      numeric: true,
      sortValue: (w) => w.inverterExpiresAt,
      cell: (w) => <WarrantyCell iso={w.inverterExpiresAt} />,
    },
    {
      key: "monitoring",
      header: "Monitoring",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (w) => w.monitoringExpiresAt,
      cell: (w) => <WarrantyCell iso={w.monitoringExpiresAt} />,
    },
    {
      key: "tickets",
      header: "Tickets",
      align: "right",
      hideBelow: "md",
      sortValue: (w) => rows.filter((t) => t.contactId === w.contactId).length,
      cell: (w) => {
        const count = rows.filter((t) => t.contactId === w.contactId).length;
        const openCount = rows.filter(
          (t) => t.contactId === w.contactId && t.status !== "resolved" && t.status !== "closed",
        ).length;
        return (
          <span className="tnum text-tiny text-muted">
            {count} total{openCount > 0 ? `, ${openCount} open` : ""}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Service & warranty"
        lede="Every open issue, who owns it, and whether the fix is on us or on the manufacturer."
        actions={
          <Button variant="primary">
            <Plus className="size-4" strokeWidth={2.5} />
            Open a ticket
          </Button>
        }
        tabs={
          <>
            <ViewTab
              active={view === "tickets"}
              onClick={() => setView("tickets")}
              count={openTickets.length}
            >
              Tickets
            </ViewTab>
            <ViewTab
              active={view === "warranty"}
              onClick={() => setView("warranty")}
              count={warranties.length}
            >
              Warranty coverage
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-4">
        {view === "tickets" ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricTile
                label="Open tickets"
                value={openTickets.length}
                tone="info"
                icon={LifeBuoy}
              />
              <MetricTile
                label="Urgent"
                value={urgent.length}
                tone={urgent.length > 0 ? "danger" : "ok"}
              />
              <MetricTile
                label="Nobody assigned"
                value={unassigned.length}
                tone={unassigned.length > 0 ? "warn" : "ok"}
              />
              <MetricTile label="Waiting on parts" value={waitingParts.length} tone="warn" />
            </div>

            <div>
              <TableToolbar>
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search issue or customer…"
                  icon={Search}
                />
                <SelectFilter
                  label="Show"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "open-only", label: "Open tickets" },
                    { value: "all", label: "Everything" },
                    { value: "open", label: "Open" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "waiting-on-parts", label: "Waiting on parts" },
                    { value: "resolved", label: "Resolved" },
                    { value: "closed", label: "Closed" },
                  ]}
                />
                <span className="tnum ml-auto text-tiny text-muted">
                  {filtered.length} shown
                </span>
              </TableToolbar>

              <DataTable
                rows={filtered}
                columns={ticketColumns}
                rowKey={(t) => t.id}
                onRowClick={(t) => setOpenId(t.id)}
                activeRowKey={openId}
                initialSort={{ key: "priority", dir: "asc" }}
                empty={
                  <EmptyState
                    icon={LifeBuoy}
                    title="Nothing open right now"
                    body="Every ticket is resolved or closed. Switch Show to Everything to review the history."
                    align="center"
                    action={<Button onClick={() => setStatusFilter("all")}>Show everything</Button>}
                  />
                }
              />
            </div>
          </>
        ) : (
          <div>
            <TableToolbar>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search customer…"
                icon={Search}
              />
              <span className="tnum ml-auto text-tiny text-muted">
                {warranties.length} installs under warranty tracking
              </span>
            </TableToolbar>

            <DataTable
              rows={warranties.filter((w) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;
                return contactOf(w.contactId)?.name.toLowerCase().includes(q) ?? false;
              })}
              columns={warrantyColumns}
              rowKey={(w) => w.id}
              initialSort={{ key: "workmanship", dir: "asc" }}
              empty={
                <EmptyState
                  icon={ShieldCheck}
                  title="No warranty records match"
                  body="Warranty clocks start when a system is commissioned. Clear the search to see all of them."
                  align="center"
                />
              }
            />
          </div>
        )}
      </PageBody>

      <TicketPanel
        ticket={open}
        onClose={() => setOpenId(null)}
        onResolve={() => open && resolveTicket(open.id)}
      />
    </>
  );
}

/** Expiry date plus how long is left, colored by urgency. */
function WarrantyCell({ iso }: { iso: string }) {
  const daysLeft = -daysBetween(iso, TODAY);
  const years = daysLeft / 365;
  const expired = daysLeft <= 0;

  return (
    <span className="block">
      <span
        className={
          expired
            ? "block font-semibold text-danger"
            : years < 2
              ? "block font-medium text-warn"
              : "block text-ink-soft"
        }
      >
        {date(iso)}
      </span>
      <span className="block text-micro text-muted">
        {expired ? "Expired" : `${Math.floor(years)} yrs left`}
      </span>
    </span>
  );
}
