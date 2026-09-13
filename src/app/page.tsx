import Link from "next/link";
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HardHat,
  LifeBuoy,
  ListChecks,
  Share2,
  Stamp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { getActivity, getDashboardSummary, getStageTrends, memberName } from "@/lib/api";
import { contactName } from "@/lib/api";
import {
  LEAD_STAGE,
  LEAD_STAGE_ORDER,
  PERMIT_STEP,
  SYSTEM_HEALTH,
  TICKET_PRIORITY,
  TONE_DOT,
  TONE_TEXT,
} from "@/lib/labels";
import { dateWithDay, dayCount, kwh, num, pct, relativeDays, time, usdCompact } from "@/lib/format";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardHeader,
  DistributionBar,
  MetricTile,
  Sparkline,
  Timeline,
} from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function DashboardPage() {
  const s = await getDashboardSummary();
  const activity = await getActivity(12);
  const stageTrends = await getStageTrends();

  const flaggedTone = s.fleet.flaggedCount > 0 ? "warn" : "ok";
  const totalLeads = LEAD_STAGE_ORDER.reduce((sum, stage) => sum + s.stageCounts[stage], 0);

  // Active = everything that isn't won or lost, summed across the same weeks.
  const activeLeadTrend = stageTrends.new.map(
    (_, i) =>
      stageTrends.new[i] +
      stageTrends.qualified[i] +
      stageTrends["survey-scheduled"][i] +
      stageTrends["proposal-sent"][i],
  );

  return (
    <>
      <PageHeader
        title="Today at a glance"
        lede="Where every job stands right now, and what needs a person today."
      />

      <PageBody className="space-y-5">
        {/* Top metrics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <MetricTile
            label="Active leads"
            value={s.activeLeads}
            tone="info"
            icon={Users}
            hint="Not yet won or lost"
            href="/leads"
            trend={activeLeadTrend}
          />
          <MetricTile
            label="Open pipeline"
            value={usdCompact(s.openPipelineValue)}
            tone="solar"
            icon={FileText}
            hint="Proposals drafted or out"
            href="/proposals"
          />
          <MetricTile
            label="Overdue follow-ups"
            value={s.overdueTasks.length}
            tone={s.overdueTasks.length > 0 ? "danger" : "ok"}
            icon={ListChecks}
            hint={`${s.tasksDueToday.length} more due today`}
            href="/tasks"
          />
          <MetricTile
            label="Permits needing a nudge"
            value={s.stalledPermits.length}
            tone={s.stalledPermits.length > 0 ? "danger" : "ok"}
            icon={Stamp}
            hint="Blocked, overdue or parked"
            href="/permitting"
          />
          <MetricTile
            label="Fleet yesterday"
            value={num(s.fleet.producedYesterday)}
            unit="kWh"
            tone={s.fleet.ratioYesterday >= 95 ? "ok" : "warn"}
            icon={Activity}
            delta={{
              text: `${pct(s.fleet.ratioYesterday)} of model`,
              tone: s.fleet.ratioYesterday >= 95 ? "ok" : "warn",
            }}
            href="/monitoring"
          />
          <MetricTile
            label="Systems flagged"
            value={s.fleet.flaggedCount}
            tone={flaggedTone}
            icon={TriangleAlert}
            hint={`of ${s.fleet.systems} monitored`}
            href="/monitoring"
          />
        </div>

        {/* Pipeline by stage */}
        <Card>
          <CardHeader title="Pipeline by stage" meta={`${totalLeads} leads`} />

          <div className="border-b border-rule px-4 py-3.5">
            <DistributionBar
              segments={LEAD_STAGE_ORDER.map((stage) => ({
                key: stage,
                label: LEAD_STAGE[stage].label,
                value: s.stageCounts[stage],
                tone: LEAD_STAGE[stage].tone,
              }))}
            />
          </div>

          <ul className="divide-y divide-rule">
            {LEAD_STAGE_ORDER.map((stage) => {
              const count = s.stageCounts[stage];
              const share = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              const series = stageTrends[stage];
              const movement = series[series.length - 1] - series[0];

              return (
                <li key={stage}>
                  <Link
                    href="/leads"
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-canvas-sunk/40"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${TONE_DOT[LEAD_STAGE[stage].tone]}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {LEAD_STAGE[stage].label}
                      </span>
                      <span className="block truncate text-micro text-muted">
                        {LEAD_STAGE[stage].hint}
                      </span>
                    </span>

                    <Sparkline
                      values={series}
                      tone={LEAD_STAGE[stage].tone}
                      className="hidden shrink-0 sm:block"
                    />

                    <span className="tnum w-10 shrink-0 text-right text-sm font-semibold text-ink">
                      {count}
                    </span>
                    <span className="tnum hidden w-12 shrink-0 text-right text-tiny text-muted sm:block">
                      {pct(share, 1)}
                    </span>
                    <span
                      className={`tnum w-12 shrink-0 text-right text-tiny font-medium ${
                        movement > 0 ? TONE_TEXT.ok : movement < 0 ? TONE_TEXT.danger : "text-muted"
                      }`}
                    >
                      {movement > 0 ? "+" : ""}
                      {movement === 0 ? "—" : movement}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <div className="space-y-5">
            {/* Needs attention — the reason this page exists */}
            <Card>
              <CardHeader
                title="Needs attention"
                icon={TriangleAlert}
                meta={`${s.overdueTasks.length + s.stalledPermits.length + s.urgentTickets.length + s.fleet.flaggedCount} items`}
              />
              <ul className="divide-y divide-rule">
                {s.overdueTasks.slice(0, 4).map((t) => (
                  <li key={t.id} className="flex items-start gap-3 px-4 py-2.5">
                    <ListChecks className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.9} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{t.title}</p>
                      <p className="mt-0.5 text-tiny text-muted">
                        {contactName(t.contactId)} · due {relativeDays(t.dueAt)} ·{" "}
                        {memberName(t.assigneeId)} owns it
                      </p>
                    </div>
                    <Link
                      href="/tasks"
                      className="shrink-0 text-tiny font-medium text-solar-hot hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}

                {s.stalledPermits.slice(0, 4).map((p) => (
                  <li key={p.projectId} className="flex items-start gap-3 px-4 py-2.5">
                    <Stamp className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.9} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">
                        {p.contactName} —{" "}
                        {p.currentStep ? PERMIT_STEP[p.currentStep.key].label : "Complete"}
                      </p>
                      <p className="mt-0.5 text-tiny text-muted">
                        {p.blocked ? "Blocked" : p.overdue ? "Past its target date" : "Parked"} at{" "}
                        {p.authority} for {dayCount(p.daysInStage)}. {memberName(p.ownerId)} owns it.
                      </p>
                    </div>
                    <Link
                      href="/permitting"
                      className="shrink-0 text-tiny font-medium text-solar-hot hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}

                {s.urgentTickets.map((t) => (
                  <li key={t.id} className="flex items-start gap-3 px-4 py-2.5">
                    <LifeBuoy className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.9} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">
                        {contactName(t.contactId)} — {t.subject}
                      </p>
                      <p className="mt-0.5 text-tiny text-muted">
                        Opened {relativeDays(t.openedAt)}
                        {t.assignedTechId ? ` · ${memberName(t.assignedTechId)} assigned` : " · nobody assigned yet"}
                      </p>
                    </div>
                    <StatusBadge spec={TICKET_PRIORITY[t.priority]} size="sm" />
                  </li>
                ))}

                {s.flaggedSystems.slice(0, 3).map((sys) => (
                  <li key={sys.id} className="flex items-start gap-3 px-4 py-2.5">
                    <Activity className="mt-0.5 size-4 shrink-0 text-warn" strokeWidth={1.9} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{contactName(sys.contactId)}</p>
                      <p className="mt-0.5 text-tiny text-muted">{sys.alert}</p>
                    </div>
                    <StatusBadge spec={SYSTEM_HEALTH[sys.health]} size="sm" />
                  </li>
                ))}
              </ul>
            </Card>

            {/* This week's field work */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Card>
                <CardHeader
                  title="Surveys this week"
                  icon={ClipboardCheck}
                  meta={`${s.surveysThisWeek.length}`}
                />
                {s.surveysThisWeek.length === 0 ? (
                  <EmptyState
                    title="No surveys booked this week"
                    body="Qualified leads are waiting on a site visit — book one from the lead panel."
                    className="py-6"
                  />
                ) : (
                  <ul className="divide-y divide-rule">
                    {s.surveysThisWeek.map((sv) => (
                      <li key={sv.id} className="px-4 py-2.5">
                        <p className="text-sm font-medium text-ink">{contactName(sv.contactId)}</p>
                        <p className="tnum mt-0.5 text-tiny text-muted">
                          {dateWithDay(sv.scheduledFor)} at {time(sv.scheduledFor)} ·{" "}
                          {memberName(sv.assignedTechId)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Installs this week"
                  icon={HardHat}
                  meta={`${s.installsThisWeek.length}`}
                />
                {s.installsThisWeek.length === 0 ? (
                  <EmptyState
                    title="No installs on the calendar"
                    body="Signed jobs with approved permits are ready to schedule."
                    className="py-6"
                  />
                ) : (
                  <ul className="divide-y divide-rule">
                    {s.installsThisWeek.map((ip) => (
                      <li key={ip.id} className="px-4 py-2.5">
                        <p className="text-sm font-medium text-ink">{contactName(ip.contactId)}</p>
                        <p className="tnum mt-0.5 text-tiny text-muted">
                          {dateWithDay(ip.scheduledDate)} · {ip.crewName} ·{" "}
                          {num(ip.panelCount)} panels
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            {/* Referrals nobody has called yet */}
            {s.newReferrals.length > 0 && (
              <Card>
                <CardHeader
                  title="Referrals waiting on a call"
                  icon={Share2}
                  meta={`${s.newReferrals.length}`}
                  action={
                    s.referralRewardsOwed > 0 ? (
                      <span className="tnum text-tiny text-warn">
                        {usdCompact(s.referralRewardsOwed)} in rewards owed
                      </span>
                    ) : undefined
                  }
                />
                <ul className="divide-y divide-rule">
                  {s.newReferrals.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{r.referredName}</p>
                        <p className="mt-0.5 truncate text-tiny text-muted">
                          From {contactName(r.referrerContactId)} · {relativeDays(r.receivedAt)}
                        </p>
                      </div>
                      <Link
                        href="/referrals"
                        className="shrink-0 text-tiny font-medium text-solar-hot hover:underline"
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Contracts waiting on ink */}
            <Card>
              <CardHeader
                title="Waiting on a signature"
                icon={CalendarDays}
                meta={`${s.awaitingSignature.length}`}
              />
              {s.awaitingSignature.length === 0 ? (
                <EmptyState
                  title="Nothing out for signature"
                  body="Accepted proposals turn into contracts here."
                  className="py-6"
                />
              ) : (
                <ul className="divide-y divide-rule">
                  {s.awaitingSignature.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {contactName(c.contactId)}
                        </p>
                        <p className="mt-0.5 text-tiny text-muted">{c.awaiting}</p>
                      </div>
                      <span className="tnum shrink-0 text-sm text-ink">
                        {usdCompact(c.contractValueUsd)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Activity feed */}
          <Card className="self-start">
            <CardHeader title="Recent activity" meta="Last 12 events" />
            <div className="px-4 py-4">
              <Timeline
                entries={activity.map((a) => ({
                  id: a.id,
                  at: a.at,
                  module:
                    a.kind.startsWith("survey")
                      ? "survey"
                      : a.kind.startsWith("proposal")
                        ? "proposal"
                        : a.kind.startsWith("contract")
                          ? "contract"
                          : a.kind.startsWith("permit") || a.kind === "pto-granted"
                            ? "permit"
                            : a.kind.startsWith("install")
                              ? "install"
                              : a.kind.startsWith("ticket")
                                ? "service"
                                : "lead",
                  title: contactName(a.contactId),
                  detail: a.summary,
                  tone:
                    a.kind.includes("resolved") || a.kind.includes("approved") || a.kind === "pto-granted"
                      ? "ok"
                      : a.kind.includes("opened")
                        ? "warn"
                        : "info",
                  href: a.href,
                }))}
              />
            </div>
          </Card>
        </div>

        <p className="tnum text-tiny text-muted">
          Fleet lifetime production: {kwh(s.fleet.lifetimeKwh)} across {s.fleet.systems} systems
          ({num(s.fleet.fleetSizeKw, 1)} kW installed).
        </p>
      </PageBody>
    </>
  );
}
