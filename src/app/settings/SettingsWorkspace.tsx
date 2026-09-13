"use client";

import { useState } from "react";
import { GripVertical, Lock, Plus, Trash2 } from "lucide-react";
import { TEAM_ROLE } from "@/lib/labels";
import { dayCount } from "@/lib/format";
import type { NotificationPref, PipelineStageConfig, TeamMember } from "@/lib/types";
import { PageBody, PageHeader, ViewTab } from "@/components/ui/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { Card, CardHeader, PersonCell } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Tab = "team" | "pipeline" | "notifications";

export function SettingsWorkspace({
  team,
  stages,
  prefs,
}: {
  team: TeamMember[];
  stages: PipelineStageConfig[];
  prefs: NotificationPref[];
}) {
  const [tab, setTab] = useState<Tab>("team");
  const [stageRows, setStageRows] = useState(stages);
  const [prefRows, setPrefRows] = useState(prefs);

  function setStale(id: string, days: number) {
    setStageRows((prev) =>
      prev.map((s) => (s.id === id ? { ...s, staleAfterDays: Math.max(0, days) } : s)),
    );
  }

  function togglePref(id: string, channel: "email" | "push" | "digest") {
    setPrefRows((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [channel]: !p[channel] } : p)),
    );
  }

  const teamColumns: Column<TeamMember>[] = [
    {
      key: "name",
      header: "Name",
      width: "26%",
      sortValue: (m) => m.name,
      cell: (m) => <PersonCell name={m.name} initials={m.initials} meta={m.team} />,
    },
    {
      key: "role",
      header: "Role",
      sortValue: (m) => TEAM_ROLE[m.role],
      cell: (m) => <span className="text-sm">{TEAM_ROLE[m.role]}</span>,
    },
    {
      key: "email",
      header: "Email",
      hideBelow: "md",
      sortValue: (m) => m.email,
      cell: (m) => (
        <a href={`mailto:${m.email}`} className="truncate text-sm hover:underline">
          {m.email}
        </a>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      numeric: true,
      hideBelow: "lg",
      sortValue: (m) => m.phone,
      cell: (m) => (
        <a href={`tel:${m.phone}`} className="text-sm hover:underline">
          {m.phone}
        </a>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      sortValue: (m) => (m.active ? 0 : 1),
      cell: (m) =>
        m.active ? (
          <StatusBadge label="Active" tone="ok" size="sm" />
        ) : (
          <StatusBadge label="Inactive" tone="idle" size="sm" />
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        lede="Who's on the team, how the pipeline is shaped, and what the system pings you about."
        tabs={
          <>
            <ViewTab active={tab === "team"} onClick={() => setTab("team")} count={team.length}>
              Team members
            </ViewTab>
            <ViewTab active={tab === "pipeline"} onClick={() => setTab("pipeline")}>
              Pipeline stages
            </ViewTab>
            <ViewTab active={tab === "notifications"} onClick={() => setTab("notifications")}>
              Notifications
            </ViewTab>
          </>
        }
      />

      <PageBody className="space-y-4">
        {tab === "team" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="max-w-prose text-sm text-muted">
                Everyone with a login. Deactivating someone keeps their history on past jobs but
                takes them out of the assignment lists.
              </p>
              <Button variant="primary">
                <Plus className="size-4" strokeWidth={2.5} />
                Invite a teammate
              </Button>
            </div>

            <DataTable
              rows={team}
              columns={teamColumns}
              rowKey={(m) => m.id}
              initialSort={{ key: "role", dir: "asc" }}
              empty={<p className="p-6 text-sm text-muted">Nobody on the team yet.</p>}
            />
          </>
        )}

        {tab === "pipeline" && (
          <>
            <p className="max-w-prose text-sm text-muted">
              These are the columns on the Leads board, in order. A lead sitting in a stage longer
              than its stale threshold gets flagged on the Dashboard.
            </p>

            <Card className="max-w-3xl">
              <CardHeader title="Lead stages" meta={`${stageRows.length} stages`} />
              <ul className="divide-y divide-rule">
                {stageRows.map((stage) => (
                  <li key={stage.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-faint" aria-hidden="true">
                      <GripVertical className="size-4" strokeWidth={2} />
                    </span>

                    <span className="tnum w-5 shrink-0 text-tiny font-semibold text-muted">
                      {stage.order}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{stage.label}</span>
                        {stage.locked && (
                          <span
                            title="Built-in stage — the pipeline needs an entry and two exits"
                            className="inline-flex items-center gap-1 rounded bg-canvas-sunk px-1.5 py-px text-micro text-muted"
                          >
                            <Lock className="size-2.5" strokeWidth={2.5} />
                            Built in
                          </span>
                        )}
                      </span>
                    </span>

                    <label className="flex shrink-0 items-center gap-2 text-tiny text-muted">
                      <span className="hidden sm:inline">Flag as stale after</span>
                      <input
                        type="number"
                        value={stage.staleAfterDays}
                        min={0}
                        max={120}
                        onChange={(e) => setStale(stage.id, Number(e.target.value))}
                        disabled={stage.key === "won" || stage.key === "lost"}
                        className="tnum h-8 w-16 rounded border border-rule-firm bg-surface px-2 text-sm text-ink disabled:bg-canvas-sunk disabled:text-faint"
                      />
                      <span className="hidden sm:inline">days</span>
                    </label>

                    <IconButton
                      label={`Remove ${stage.label}`}
                      disabled={stage.locked}
                      className="disabled:opacity-30"
                    >
                      <Trash2 className="size-3.5" strokeWidth={2} />
                    </IconButton>
                  </li>
                ))}
              </ul>
              <div className="border-t border-rule px-4 py-3">
                <Button>
                  <Plus className="size-4" strokeWidth={2.25} />
                  Add a stage
                </Button>
              </div>
            </Card>

            <p className="tnum max-w-prose text-tiny text-muted">
              Current thresholds:{" "}
              {stageRows
                .filter((s) => s.staleAfterDays > 0)
                .map((s) => `${s.label} after ${dayCount(s.staleAfterDays)}`)
                .join(", ")}
              .
            </p>
          </>
        )}

        {tab === "notifications" && (
          <>
            <p className="max-w-prose text-sm text-muted">
              What reaches you, and how. Digest items are bundled into the Monday morning email
              instead of arriving one at a time.
            </p>

            <Card className="max-w-4xl">
              <CardHeader title="Notify me when" meta={`${prefRows.length} events`} />
              <div className="scrollbar-slim overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-rule bg-canvas-sunk/60">
                      <th scope="col" className="px-4 py-2 text-tiny font-semibold text-ink-soft">
                        Event
                      </th>
                      <th scope="col" className="w-20 px-3 py-2 text-center text-tiny font-semibold text-ink-soft">
                        Email
                      </th>
                      <th scope="col" className="w-20 px-3 py-2 text-center text-tiny font-semibold text-ink-soft">
                        Push
                      </th>
                      <th scope="col" className="w-20 px-3 py-2 text-center text-tiny font-semibold text-ink-soft">
                        Digest
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {prefRows.map((pref) => (
                      <tr key={pref.id}>
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-ink">{pref.label}</p>
                          <p className="mt-0.5 text-micro text-muted">{pref.description}</p>
                        </td>
                        {(["email", "push", "digest"] as const).map((channel) => (
                          <td key={channel} className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={pref[channel]}
                              onChange={() => togglePref(pref.id, channel)}
                              aria-label={`${pref.label} — ${channel}`}
                              className="size-4 accent-solar"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 border-t border-rule px-4 py-3">
                <Button variant="primary">Save preferences</Button>
                <span className="text-tiny text-muted">
                  Changes apply to your account only.
                </span>
              </div>
            </Card>
          </>
        )}
      </PageBody>
    </>
  );
}
