"use client";

import { useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { contactOf, memberName } from "@/lib/api";
import { FINANCING, PROPOSAL_STATUS } from "@/lib/labels";
import { date, kw, kwh, num, pct, usd } from "@/lib/format";
import type { InverterSpec, PanelSpec, Proposal } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProposalBuilder } from "./ProposalBuilder";
import { ProposalPanel } from "./ProposalPanel";

type View = "list" | "builder";

export function ProposalsWorkspace({
  proposals,
  panels,
  inverters,
}: {
  proposals: Proposal[];
  panels: PanelSpec[];
  inverters: InverterSpec[];
}) {
  const [view, setView] = useState<View>("list");
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proposals.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return contactOf(p.contactId)?.name.toLowerCase().includes(q) ?? false;
    });
  }, [proposals, query, statusFilter]);

  const open = openId ? proposals.find((p) => p.id === openId) ?? null : null;

  const columns: Column<Proposal>[] = [
    {
      key: "customer",
      header: "Customer",
      width: "20%",
      sortValue: (p) => contactOf(p.contactId)?.name ?? "",
      cell: (p) => {
        const c = contactOf(p.contactId);
        return (
          <span className="block min-w-0">
            <span className="block truncate font-medium text-ink">{c?.name}</span>
            <span className="block truncate text-micro text-muted">
              {c?.address.city} · prepared by {memberName(p.preparedById).split(" ")[0]}
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => PROPOSAL_STATUS[p.status].label,
      cell: (p) => <StatusBadge spec={PROPOSAL_STATUS[p.status]} dot />,
    },
    {
      key: "size",
      header: "System",
      align: "right",
      numeric: true,
      sortValue: (p) => p.systemSizeKw,
      cell: (p) => (
        <span className="block">
          <span className="block">{kw(p.systemSizeKw)}</span>
          <span className="block text-micro text-muted">{num(p.panelCount)} panels</span>
        </span>
      ),
    },
    {
      key: "production",
      header: "Annual production",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (p) => p.annualProductionKwh,
      cell: (p) => kwh(p.annualProductionKwh),
    },
    {
      key: "offset",
      header: "Offset",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (p) => p.offsetAchievedPct,
      cell: (p) => pct(p.offsetAchievedPct),
    },
    {
      key: "financing",
      header: "Financing",
      hideBelow: "md",
      sortValue: (p) => FINANCING[p.financing].label,
      cell: (p) => (
        <span className="block">
          <span className="block text-sm">{FINANCING[p.financing].label}</span>
          {p.monthlyPaymentUsd !== null && (
            <span className="tnum block text-micro text-muted">
              {usd(p.monthlyPaymentUsd)}/mo
            </span>
          )}
        </span>
      ),
    },
    {
      key: "net",
      header: "Net cost",
      align: "right",
      numeric: true,
      sortValue: (p) => p.netCostUsd,
      cell: (p) => <span className="font-medium text-ink">{usd(p.netCostUsd)}</span>,
    },
    {
      key: "payback",
      header: "Payback",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (p) => p.paybackYears,
      cell: (p) => (p.paybackYears > 0 ? `${num(p.paybackYears, 1)} yrs` : "—"),
    },
    {
      key: "created",
      header: "Created",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (p) => p.createdAt,
      cell: (p) => date(p.createdAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="Proposals"
        lede="Size the array, pick the equipment, land on a number the customer can say yes to."
        actions={
          view === "list" ? (
            <Button variant="primary" onClick={() => setView("builder")}>
              <Plus className="size-4" strokeWidth={2.5} />
              Build a proposal
            </Button>
          ) : (
            <Button onClick={() => setView("list")}>Back to list</Button>
          )
        }
        tabs={
          <>
            <ViewTab active={view === "list"} onClick={() => setView("list")} count={proposals.length}>
              All proposals
            </ViewTab>
            <ViewTab active={view === "builder"} onClick={() => setView("builder")}>
              Builder
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-3">
        {view === "builder" ? (
          <ProposalBuilder panels={panels} inverters={inverters} />
        ) : (
          <>
            <TableToolbar>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search customer…"
                icon={Search}
              />
              <SelectFilter
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "sent", label: "Sent" },
                  { value: "accepted", label: "Accepted" },
                  { value: "declined", label: "Declined" },
                  { value: "expired", label: "Expired" },
                ]}
              />
              <span className="tnum ml-auto text-tiny text-muted">
                {filtered.length} of {proposals.length}
              </span>
            </TableToolbar>

            <DataTable
              rows={filtered}
              columns={columns}
              rowKey={(p) => p.id}
              onRowClick={(p) => setOpenId(p.id)}
              activeRowKey={openId}
              initialSort={{ key: "created", dir: "desc" }}
              empty={
                <EmptyState
                  icon={FileText}
                  title="No proposals match those filters"
                  body="Clear the status filter, or build a proposal for a lead whose survey is done."
                  align="center"
                  action={
                    <Button variant="primary" onClick={() => setView("builder")}>
                      Build a proposal
                    </Button>
                  }
                />
              }
            />
          </>
        )}
      </PageBody>

      <ProposalPanel proposal={open} onClose={() => setOpenId(null)} />
    </>
  );
}
