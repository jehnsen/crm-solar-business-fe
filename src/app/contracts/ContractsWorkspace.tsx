"use client";

import { useMemo, useState } from "react";
import { FileSignature, Search } from "lucide-react";
import { contactOf, memberName } from "@/lib/lookups";
import { CONTRACT_STATUS, CONTRACT_STATUS_ORDER } from "@/lib/labels";
import { date, relativeDays, usd } from "@/lib/format";
import type { Contract, ContractStatus } from "@/lib/types";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricTile, SearchInput } from "@/components/ui/Primitives";
import { StepProgress } from "@/components/ui/PipelineTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ContractPanel } from "./ContractPanel";

export function ContractsWorkspace({ contracts }: { contracts: Contract[] }) {
  const [rows, setRows] = useState(contracts);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (contactOf(c.contactId)?.name.toLowerCase().includes(q) ?? false) ||
        c.documentName.toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  const open = openId ? rows.find((c) => c.id === openId) ?? null : null;

  function advance(id: string) {
    setRows((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const i = CONTRACT_STATUS_ORDER.indexOf(c.status);
        if (i >= CONTRACT_STATUS_ORDER.length - 1) return c;
        const next = CONTRACT_STATUS_ORDER[i + 1];
        const stamp = new Date().toISOString();
        return {
          ...c,
          status: next,
          sentAt: next === "sent" ? stamp : c.sentAt,
          signedAt: next === "signed" ? stamp : c.signedAt,
          countersignedAt: next === "countersigned" ? stamp : c.countersignedAt,
          awaiting:
            next === "sent"
              ? "Customer signature"
              : next === "signed"
                ? "Our countersignature"
                : null,
        };
      }),
    );
  }

  const counts = useMemo(() => {
    const out = { draft: 0, sent: 0, signed: 0, countersigned: 0 } as Record<
      ContractStatus,
      number
    >;
    for (const c of rows) out[c.status] += 1;
    return out;
  }, [rows]);

  const outForSignature = rows.filter((c) => c.status === "sent" || c.status === "signed");
  const outValue = outForSignature.reduce((s, c) => s + c.contractValueUsd, 0);

  const columns: Column<Contract>[] = [
    {
      key: "customer",
      header: "Customer",
      width: "20%",
      sortValue: (c) => contactOf(c.contactId)?.name ?? "",
      cell: (c) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-ink">
            {contactOf(c.contactId)?.name}
          </span>
          <span className="block truncate text-micro text-muted">{c.documentName}</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "E-sign status",
      sortValue: (c) => CONTRACT_STATUS_ORDER.indexOf(c.status),
      cell: (c) => <StatusBadge spec={CONTRACT_STATUS[c.status]} dot />,
    },
    {
      key: "progress",
      header: "Progress",
      hideBelow: "md",
      sortValue: (c) => CONTRACT_STATUS_ORDER.indexOf(c.status),
      cell: (c) => (
        <StepProgress
          completed={CONTRACT_STATUS_ORDER.indexOf(c.status) + 1}
          total={4}
          tone={c.status === "countersigned" ? "ok" : "warn"}
        />
      ),
    },
    {
      key: "value",
      header: "Contract value",
      align: "right",
      numeric: true,
      sortValue: (c) => c.contractValueUsd,
      cell: (c) => <span className="font-medium text-ink">{usd(c.contractValueUsd)}</span>,
    },
    {
      key: "awaiting",
      header: "Waiting on",
      width: "18%",
      hideBelow: "lg",
      sortValue: (c) => c.awaiting ?? "zzz",
      cell: (c) =>
        c.awaiting ? (
          <span className="text-sm text-ink-soft">{c.awaiting}</span>
        ) : (
          <span className="text-tiny text-ok">Fully executed</span>
        ),
    },
    {
      key: "deposit",
      header: "Deposit",
      hideBelow: "lg",
      sortValue: (c) => (c.depositCollected ? 0 : 1),
      cell: (c) =>
        c.depositCollected ? (
          <StatusBadge label="Collected" tone="ok" size="sm" />
        ) : (
          <StatusBadge label="Not yet" tone="idle" size="sm" />
        ),
    },
    {
      key: "sent",
      header: "Sent",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (c) => c.sentAt ?? "0",
      cell: (c) =>
        c.sentAt ? (
          <span className="block">
            <span className="block">{date(c.sentAt)}</span>
            <span className="block text-micro text-muted">{relativeDays(c.sentAt)}</span>
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "prepared",
      header: "Prepared by",
      hideBelow: "lg",
      sortValue: (c) => memberName(c.preparedById),
      cell: (c) => <span className="text-sm">{memberName(c.preparedById)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Contracts"
        lede="Who still owes a signature, and what is cleared to hand to permitting."
      />

      <PageBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile label="Not yet sent" value={counts.draft} tone="idle" />
          <MetricTile label="Out for signature" value={counts.sent} tone="warn" />
          <MetricTile
            label="Signed, needs our ink"
            value={counts.signed}
            tone={counts.signed > 0 ? "warn" : "ok"}
          />
          <MetricTile label="Value out for signature" value={usd(outValue)} tone="solar" />
        </div>

        <div>
          <TableToolbar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search customer or document…"
              icon={Search}
            />
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                ...CONTRACT_STATUS_ORDER.map((s) => ({
                  value: s,
                  label: CONTRACT_STATUS[s].label,
                })),
              ]}
            />
            <span className="tnum ml-auto text-tiny text-muted">
              {filtered.length} of {rows.length}
            </span>
          </TableToolbar>

          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={(c) => c.id}
            onRowClick={(c) => setOpenId(c.id)}
            activeRowKey={openId}
            initialSort={{ key: "status", dir: "asc" }}
            empty={
              <EmptyState
                icon={FileSignature}
                title="No contracts match those filters"
                body="Accepted proposals become contracts — check the Proposals list if you expected one here."
                align="center"
              />
            }
          />
        </div>
      </PageBody>

      <ContractPanel
        contract={open}
        onClose={() => setOpenId(null)}
        onAdvance={() => open && advance(open.id)}
      />
    </>
  );
}
