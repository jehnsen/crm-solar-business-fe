"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Contact as ContactIcon, Search } from "lucide-react";
import { memberName } from "@/lib/api";
import { INSTALL_STAGE, LEAD_STAGE, PROPERTY_TYPE } from "@/lib/labels";
import { date, kw } from "@/lib/format";
import type { Contact, InstallStage, LeadStage } from "@/lib/types";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricTile, SearchInput } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface ContactRow {
  contact: Contact;
  stage: LeadStage | null;
  systemSizeKw: number | null;
  installStage: InstallStage | null;
  openTickets: number;
  isCustomer: boolean;
}

export function ContactsWorkspace({ rows }: { rows: ContactRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter === "customers" && !r.isCustomer) return false;
      if (typeFilter === "prospects" && r.isCustomer) return false;
      if (typeFilter === "commercial" && r.contact.propertyType !== "commercial") return false;
      if (typeFilter === "residential" && r.contact.propertyType !== "residential") return false;
      if (!q) return true;
      const c = r.contact;
      return (
        c.name.toLowerCase().includes(q) ||
        c.address.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, typeFilter]);

  const customers = rows.filter((r) => r.isCustomer).length;
  const commercial = rows.filter((r) => r.contact.propertyType === "commercial").length;
  const withOpenTickets = rows.filter((r) => r.openTickets > 0).length;

  const columns: Column<ContactRow>[] = [
    {
      key: "name",
      header: "Customer",
      width: "24%",
      sortValue: (r) => r.contact.name,
      cell: (r) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-ink">{r.contact.name}</span>
          <span className="block truncate text-micro text-muted">
            {r.contact.company ?? PROPERTY_TYPE[r.contact.propertyType]} ·{" "}
            {r.contact.address.city}, {r.contact.address.state}
          </span>
        </span>
      ),
    },
    {
      key: "relationship",
      header: "Relationship",
      sortValue: (r) => (r.isCustomer ? 0 : 1),
      cell: (r) =>
        r.isCustomer ? (
          <StatusBadge label="Customer" tone="ok" dot />
        ) : r.stage ? (
          <StatusBadge spec={LEAD_STAGE[r.stage]} dot />
        ) : (
          <StatusBadge label="Prospect" tone="idle" dot />
        ),
    },
    {
      key: "system",
      header: "System",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (r) => r.systemSizeKw ?? 0,
      cell: (r) =>
        r.systemSizeKw !== null ? (
          <span className="block">
            <span className="block">{kw(r.systemSizeKw)}</span>
            {r.installStage && (
              <span className="block text-micro text-muted">
                {INSTALL_STAGE[r.installStage].label}
              </span>
            )}
          </span>
        ) : (
          <span className="text-tiny text-faint">Not sold yet</span>
        ),
    },
    {
      key: "utility",
      header: "Utility",
      hideBelow: "lg",
      sortValue: (r) => r.contact.utility,
      cell: (r) => (
        <span className="block">
          <span className="block text-sm">{r.contact.utility}</span>
          <span className="block text-micro text-muted">{r.contact.rateSchedule}</span>
        </span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      hideBelow: "lg",
      sortValue: (r) => memberName(r.contact.ownerId),
      cell: (r) => <span className="text-sm">{memberName(r.contact.ownerId)}</span>,
    },
    {
      key: "tickets",
      header: "Open tickets",
      align: "right",
      hideBelow: "md",
      sortValue: (r) => r.openTickets,
      cell: (r) =>
        r.openTickets > 0 ? (
          <StatusBadge label={`${r.openTickets} open`} tone="warn" size="sm" />
        ) : (
          <span className="text-tiny text-muted">None</span>
        ),
    },
    {
      key: "since",
      header: "Customer since",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (r) => r.contact.createdAt,
      cell: (r) => date(r.contact.createdAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="Contacts"
        lede="One record per customer, with their whole history from first call to last service visit."
      />

      <PageBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile label="All contacts" value={rows.length} tone="info" icon={ContactIcon} />
          <MetricTile
            label="Customers"
            value={customers}
            tone="ok"
            hint="Have an install on file"
          />
          <MetricTile label="Commercial accounts" value={commercial} tone="idle" />
          <MetricTile
            label="With open tickets"
            value={withOpenTickets}
            tone={withOpenTickets > 0 ? "warn" : "ok"}
          />
        </div>

        <div>
          <TableToolbar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search name, company, city, email…"
              icon={Search}
            />
            <SelectFilter
              label="Show"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "Everyone" },
                { value: "customers", label: "Customers" },
                { value: "prospects", label: "Prospects" },
                { value: "residential", label: "Residential" },
                { value: "commercial", label: "Commercial" },
              ]}
            />
            <span className="tnum ml-auto text-tiny text-muted">
              {filtered.length} of {rows.length}
            </span>
          </TableToolbar>

          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={(r) => r.contact.id}
            onRowClick={(r) => router.push(`/contacts/${r.contact.id}`)}
            initialSort={{ key: "name", dir: "asc" }}
            empty={
              <EmptyState
                icon={ContactIcon}
                title="Nobody matches that search"
                body="Try a last name or a city, or clear the filter to see the whole book."
                align="center"
              />
            }
          />
        </div>
      </PageBody>
    </>
  );
}
