"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Share2, UserPlus } from "lucide-react";
import { contactOf } from "@/lib/api";
import type { ReferrerStanding } from "@/lib/api";
import { REFERRAL_STATUS, REFERRAL_STATUS_ORDER } from "@/lib/labels";
import { date, pct, relativeDays, usd, usdCompact } from "@/lib/format";
import type { Referral, ReferralStatus } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Column, DataTable, SelectFilter, TableToolbar } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertLine, Card, CardHeader, MetricTile, SearchInput } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Summary {
  total: number;
  live: number;
  won: number;
  conversionPct: number;
  closedValueUsd: number;
  rewardsOwedUsd: number;
  uncontacted: number;
}

type View = "introductions" | "referrers";

export function ReferralsWorkspace({
  referrals,
  standings,
  summary,
}: {
  referrals: Referral[];
  standings: ReferrerStanding[];
  summary: Summary;
}) {
  const [rows, setRows] = useState(referrals);
  const [view, setView] = useState<View>("introductions");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.referredName.toLowerCase().includes(q) ||
        (contactOf(r.referrerContactId)?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query, statusFilter]);

  function advance(id: string, to: ReferralStatus) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: to,
              rewardPaidAt:
                to === "reward-paid"
                  ? (r.rewardPaidAt ?? new Date().toISOString().slice(0, 10))
                  : r.rewardPaidAt,
            }
          : r,
      ),
    );
  }

  const referralColumns: Column<Referral>[] = [
    {
      key: "referred",
      header: "Who was introduced",
      width: "22%",
      sortValue: (r) => r.referredName,
      cell: (r) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-ink">{r.referredName}</span>
          <span className="tnum block truncate text-micro text-muted">
            {r.referredPhone ?? r.referredEmail ?? "No contact details yet"}
          </span>
        </span>
      ),
    },
    {
      key: "referrer",
      header: "Referred by",
      width: "18%",
      sortValue: (r) => contactOf(r.referrerContactId)?.name ?? "",
      cell: (r) => (
        <Link
          href={`/contacts/${r.referrerContactId}`}
          onClick={(e) => e.stopPropagation()}
          className="block truncate text-sm text-ink hover:underline"
        >
          {contactOf(r.referrerContactId)?.name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => REFERRAL_STATUS_ORDER.indexOf(r.status),
      cell: (r) => <StatusBadge spec={REFERRAL_STATUS[r.status]} dot />,
    },
    {
      key: "received",
      header: "Came in",
      align: "right",
      numeric: true,
      sortValue: (r) => r.receivedAt,
      cell: (r) => (
        <span className="block">
          <span className="block">{date(r.receivedAt)}</span>
          <span className="block text-micro text-muted">{relativeDays(r.receivedAt)}</span>
        </span>
      ),
    },
    {
      key: "value",
      header: "Closed value",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (r) => r.closedValueUsd ?? 0,
      cell: (r) =>
        r.closedValueUsd ? (
          <span className="font-medium text-ink">{usd(r.closedValueUsd)}</span>
        ) : (
          <span className="text-tiny text-faint">—</span>
        ),
    },
    {
      key: "reward",
      header: "Reward",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (r) => (r.rewardPaidAt ? 0 : r.rewardUsd),
      cell: (r) =>
        r.rewardPaidAt ? (
          <span className="text-tiny text-ok">Paid {date(r.rewardPaidAt)}</span>
        ) : r.status === "won" ? (
          <StatusBadge label={`${usd(r.rewardUsd)} owed`} tone="warn" size="sm" />
        ) : (
          <span className="tnum text-tiny text-muted">{usd(r.rewardUsd)}</span>
        ),
    },
    {
      key: "next",
      header: "",
      align: "right",
      cell: (r) => {
        const i = REFERRAL_STATUS_ORDER.indexOf(r.status);
        const next =
          r.status === "won"
            ? "reward-paid"
            : i >= 0 && i < 3
              ? REFERRAL_STATUS_ORDER[i + 1]
              : null;
        if (!next) return null;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              advance(r.id, next as ReferralStatus);
            }}
            className="rounded border border-rule-firm bg-surface px-2 py-0.5 text-micro font-medium text-ink-soft transition-colors hover:bg-canvas-sunk"
          >
            {next === "reward-paid" ? "Pay reward" : `→ ${REFERRAL_STATUS[next as ReferralStatus].label}`}
          </button>
        );
      },
    },
  ];

  const standingColumns: Column<ReferrerStanding>[] = [
    {
      key: "name",
      header: "Customer",
      width: "28%",
      sortValue: (s) => s.name,
      cell: (s) => (
        <Link
          href={`/contacts/${s.contactId}`}
          className="block truncate font-medium text-ink hover:underline"
        >
          {s.name}
        </Link>
      ),
    },
    {
      key: "intros",
      header: "Introductions",
      align: "right",
      numeric: true,
      sortValue: (s) => s.introductions,
      cell: (s) => s.introductions,
    },
    {
      key: "won",
      header: "Became customers",
      align: "right",
      numeric: true,
      sortValue: (s) => s.won,
      cell: (s) => (
        <span className={s.won > 0 ? "font-medium text-ok" : "text-muted"}>{s.won}</span>
      ),
    },
    {
      key: "value",
      header: "Value closed",
      align: "right",
      numeric: true,
      sortValue: (s) => s.closedValueUsd,
      cell: (s) =>
        s.closedValueUsd > 0 ? (
          <span className="font-semibold text-ink">{usd(s.closedValueUsd)}</span>
        ) : (
          <span className="text-tiny text-faint">—</span>
        ),
    },
    {
      key: "owed",
      header: "Reward owed",
      align: "right",
      numeric: true,
      hideBelow: "md",
      sortValue: (s) => s.rewardsOwedUsd,
      cell: (s) =>
        s.rewardsOwedUsd > 0 ? (
          <StatusBadge label={usd(s.rewardsOwedUsd)} tone="warn" size="sm" />
        ) : (
          <span className="text-tiny text-muted">—</span>
        ),
    },
    {
      key: "paid",
      header: "Paid to date",
      align: "right",
      numeric: true,
      hideBelow: "lg",
      sortValue: (s) => s.rewardsPaidUsd,
      cell: (s) => (s.rewardsPaidUsd > 0 ? usd(s.rewardsPaidUsd) : "—"),
    },
  ];

  return (
    <>
      <PageHeader
        title="Referrals"
        lede="Who sends us work, who they sent, and what we still owe them for it."
        actions={
          <Button variant="primary">
            <UserPlus className="size-4" strokeWidth={2.25} />
            Log a referral
          </Button>
        }
        tabs={
          <>
            <ViewTab
              active={view === "introductions"}
              onClick={() => setView("introductions")}
              count={rows.length}
            >
              Introductions
            </ViewTab>
            <ViewTab
              active={view === "referrers"}
              onClick={() => setView("referrers")}
              count={standings.length}
            >
              Who refers us
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricTile label="Introductions" value={summary.total} tone="info" icon={Share2} />
          <MetricTile label="Still in play" value={summary.live} tone="solar" />
          <MetricTile
            label="Became customers"
            value={summary.won}
            delta={{ text: `${pct(summary.conversionPct)} conversion`, tone: "ok" }}
          />
          <MetricTile
            label="Value closed"
            value={usdCompact(summary.closedValueUsd)}
            tone="ok"
          />
          <MetricTile
            label="Rewards owed"
            value={usd(summary.rewardsOwedUsd)}
            tone={summary.rewardsOwedUsd > 0 ? "warn" : "ok"}
          />
        </div>

        {summary.uncontacted > 0 && (
          <AlertLine tone="warn" icon={Share2}>
            {summary.uncontacted} {summary.uncontacted === 1 ? "name has" : "names have"} been given
            to us and nobody has called yet. A referral goes cold faster than a web lead — the
            customer already vouched for you.
          </AlertLine>
        )}

        <TableToolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search either name…"
            icon={Search}
          />
          {view === "introductions" && (
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All statuses" },
                ...REFERRAL_STATUS_ORDER.map((s) => ({
                  value: s,
                  label: REFERRAL_STATUS[s].label,
                })),
              ]}
            />
          )}
          <span className="tnum ml-auto text-tiny text-muted">
            {view === "introductions" ? `${filtered.length} of ${rows.length}` : `${standings.length} customers`}
          </span>
        </TableToolbar>

        {view === "introductions" ? (
          <DataTable
            rows={filtered}
            columns={referralColumns}
            rowKey={(r) => r.id}
            initialSort={{ key: "received", dir: "desc" }}
            empty={
              <EmptyState
                icon={Share2}
                title="No introductions match those filters"
                body="Ask a happy customer at their install walkthrough — that's when they're most likely to give you a name."
                align="center"
              />
            }
          />
        ) : (
          <>
            <DataTable
              rows={standings}
              columns={standingColumns}
              rowKey={(s) => s.contactId}
              initialSort={{ key: "value", dir: "desc" }}
              empty={
                <EmptyState
                  icon={Share2}
                  title="Nobody has referred anyone yet"
                  body="Log an introduction and the customer who made it shows up here."
                  align="center"
                />
              }
            />
            <Card>
              <CardHeader title="Why this list matters" />
              <p className="px-4 py-3 text-sm leading-relaxed text-muted">
                Referral source used to be a single dropdown value, which meant &ldquo;who sends us
                work&rdquo; lived in notes nobody could query. These rows are the graph — the
                customer, everyone they introduced, and the money that came of it.
              </p>
            </Card>
          </>
        )}
      </PageBody>
    </>
  );
}
