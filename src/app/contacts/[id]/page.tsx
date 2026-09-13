import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Zap,
} from "lucide-react";
import { contactName, getContactDossier, getContactTimeline, memberName } from "@/lib/api";
import {
  CONTRACT_STATUS,
  INSTALL_STAGE,
  LEAD_STAGE,
  PERMIT_STEP,
  PROPERTY_TYPE,
  PROPOSAL_STATUS,
  REFERRAL_STATUS,
  SURVEY_STATUS,
  SYSTEM_HEALTH,
  TASK_KIND,
  TASK_PRIORITY,
  TASK_TRIGGER,
  TICKET_STATUS,
} from "@/lib/labels";
import { TODAY, date, kw, kwh, num, pct, usd } from "@/lib/format";
import { PageBody, PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, MetricTile, Timeline } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/EmptyState";
import { PipelineTracker, type TrackerStep } from "@/components/ui/PipelineTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Field, FieldList } from "@/components/ui/SlideOver";

// No generateStaticParams: contact records change while staff work, so these
// pages render per request rather than being frozen at build time.

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dossier = await getContactDossier(id);
  if (!dossier) notFound();

  const timeline = await getContactTimeline(id);
  const {
    contact,
    lead,
    surveys,
    proposals,
    contracts,
    project,
    permitSteps,
    system,
    tickets,
    warranty,
    tasks,
    referralsMade,
    referredBy,
  } = dossier;

  const liveTasks = tasks.filter((t) => t.status === "open" || t.status === "in-progress");

  const permitTracker: TrackerStep[] = permitSteps.map((step) => ({
    key: step.id,
    label: PERMIT_STEP[step.key].short,
    state:
      step.status === "complete"
        ? "complete"
        : step.status === "blocked"
          ? "blocked"
          : step.status === "in-progress"
            ? "current"
            : "upcoming",
    meta: step.completedAt ? date(step.completedAt) : step.dueAt ? `due ${date(step.dueAt)}` : null,
  }));

  const openTickets = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed");

  return (
    <>
      <PageHeader
        title={contact.name}
        lede={
          contact.company
            ? `${contact.company} · ${PROPERTY_TYPE[contact.propertyType]} account`
            : `${PROPERTY_TYPE[contact.propertyType]} customer in ${contact.address.city}`
        }
        actions={
          <Link
            href="/contacts"
            className="inline-flex h-8.5 items-center gap-1.5 rounded border border-rule-firm bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunk"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            All contacts
          </Link>
        }
      />

      <PageBody className="space-y-5">
        {/* Identity strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="px-4 py-3">
            <p className="text-tiny font-medium text-muted">Address</p>
            <p className="mt-1 flex items-start gap-2 text-sm text-ink">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={2} />
              <span>
                {contact.address.street}
                <br />
                {contact.address.city}, {contact.address.state} {contact.address.zip}
              </span>
            </p>
          </Card>

          <Card className="px-4 py-3">
            <p className="text-tiny font-medium text-muted">Reach them</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink">
              <Phone className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
              <a href={`tel:${contact.phone}`} className="tnum hover:underline">
                {contact.phone}
              </a>
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink">
              <Mail className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
              <a href={`mailto:${contact.email}`} className="truncate hover:underline">
                {contact.email}
              </a>
            </p>
          </Card>

          <Card className="px-4 py-3">
            <p className="text-tiny font-medium text-muted">Utility</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink">
              <Zap className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
              {contact.utility}
            </p>
            <p className="mt-1 text-micro text-muted">{contact.rateSchedule}</p>
          </Card>

          <Card className="px-4 py-3">
            <p className="text-tiny font-medium text-muted">Account owner</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink">
              <Building2 className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
              {memberName(contact.ownerId)}
            </p>
            <p className="tnum mt-1 text-micro text-muted">
              In the book since {date(contact.createdAt)}
            </p>
          </Card>
        </div>

        {/* Where they stand */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile
            label="Lead stage"
            value={lead ? LEAD_STAGE[lead.stage].label : "No lead"}
            hint={lead ? LEAD_STAGE[lead.stage].hint : undefined}
          />
          <MetricTile
            label="System"
            value={project ? num(project.systemSizeKw, 1) : "—"}
            unit={project ? "kW" : undefined}
            hint={project ? INSTALL_STAGE[project.stage].label : "Nothing installed"}
          />
          <MetricTile
            label="Lifetime production"
            value={system ? num(system.lifetimeKwh) : "—"}
            unit={system ? "kWh" : undefined}
            hint={system ? SYSTEM_HEALTH[system.health].label : "Not monitored"}
            tone={system ? SYSTEM_HEALTH[system.health].tone : undefined}
          />
          <MetricTile
            label="Open tickets"
            value={openTickets.length}
            tone={openTickets.length > 0 ? "warn" : "ok"}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            {/* Open follow-ups — what someone owes this customer right now */}
            <Card>
              <CardHeader
                title="Open follow-ups"
                meta={`${liveTasks.length}`}
                action={
                  <Link href="/tasks" className="text-tiny font-medium text-solar-hot hover:underline">
                    All follow-ups
                  </Link>
                }
              />
              {liveTasks.length === 0 ? (
                <EmptyState
                  title="Nothing owed to this customer"
                  body="Add a follow-up if they need a call, a quote chase, or a post-install check-in."
                  className="py-6"
                />
              ) : (
                <ul className="divide-y divide-rule">
                  {liveTasks.map((t) => {
                    const overdue = new Date(t.dueAt).getTime() < TODAY.getTime();
                    return (
                      <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">{t.title}</p>
                          <p className="tnum mt-0.5 text-micro text-muted">
                            {TASK_KIND[t.kind]} · {memberName(t.assigneeId)} ·{" "}
                            {TASK_TRIGGER[t.trigger]}
                          </p>
                        </div>
                        <span
                          className={
                            overdue
                              ? "tnum shrink-0 text-tiny font-semibold text-danger"
                              : "tnum shrink-0 text-tiny text-muted"
                          }
                        >
                          {overdue ? "overdue — " : ""}
                          {date(t.dueAt)}
                        </span>
                        <StatusBadge spec={TASK_PRIORITY[t.priority]} size="sm" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Permitting progress */}
            {permitTracker.length > 0 && (
              <Card>
                <CardHeader
                  title="Permitting & interconnection"
                  meta={`${permitSteps.filter((s) => s.status === "complete").length} of 6 complete`}
                  action={
                    <Link
                      href="/permitting"
                      className="text-tiny font-medium text-solar-hot hover:underline"
                    >
                      Open tracker
                    </Link>
                  }
                />
                <div className="px-4 py-4">
                  <PipelineTracker steps={permitTracker} />
                </div>
              </Card>
            )}

            {/* Proposals */}
            <Card>
              <CardHeader title="Proposals" meta={`${proposals.length}`} />
              {proposals.length === 0 ? (
                <EmptyState
                  title="No proposals yet"
                  body="Once the survey is in, build a proposal from the Proposals tab."
                  className="py-6"
                />
              ) : (
                <ul className="divide-y divide-rule">
                  {proposals.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {kw(p.systemSizeKw)} · {num(p.panelCount)} panels
                        </p>
                        <p className="tnum mt-0.5 text-micro text-muted">
                          {kwh(p.annualProductionKwh)}/yr · {pct(p.offsetAchievedPct)} offset ·
                          prepared {date(p.createdAt)}
                        </p>
                      </div>
                      <span className="tnum shrink-0 text-sm font-medium text-ink">
                        {usd(p.netCostUsd)}
                      </span>
                      <StatusBadge spec={PROPOSAL_STATUS[p.status]} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Contracts */}
            <Card>
              <CardHeader title="Contracts" meta={`${contracts.length}`} />
              {contracts.length === 0 ? (
                <EmptyState
                  title="Nothing signed yet"
                  body="An accepted proposal becomes a contract here."
                  className="py-6"
                />
              ) : (
                <ul className="divide-y divide-rule">
                  {contracts.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{c.documentName}</p>
                        <p className="tnum mt-0.5 text-micro text-muted">
                          {c.countersignedAt
                            ? `Fully executed ${date(c.countersignedAt)}`
                            : (c.awaiting ?? "In progress")}
                        </p>
                      </div>
                      <span className="tnum shrink-0 text-sm font-medium text-ink">
                        {usd(c.contractValueUsd)}
                      </span>
                      <StatusBadge spec={CONTRACT_STATUS[c.status]} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Surveys */}
            <Card>
              <CardHeader title="Site surveys" meta={`${surveys.length}`} />
              {surveys.length === 0 ? (
                <EmptyState
                  title="No survey on file"
                  body="Book one from the lead panel so we can size the array properly."
                  className="py-6"
                />
              ) : (
                <ul className="divide-y divide-rule">
                  {surveys.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="tnum text-sm font-medium text-ink">
                          {date(s.scheduledFor)} · {memberName(s.assignedTechId)}
                        </p>
                        <p className="mt-0.5 text-micro text-muted">
                          {s.usableRoofSqft
                            ? `${num(s.usableRoofSqft)} sq ft usable`
                            : "Not measured yet"}
                          {s.shadingLossPct !== null ? ` · ${pct(s.shadingLossPct)} shade loss` : ""}
                        </p>
                      </div>
                      <StatusBadge spec={SURVEY_STATUS[s.status]} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Service history */}
            <Card>
              <CardHeader title="Service history" meta={`${tickets.length}`} />
              {tickets.length === 0 ? (
                <EmptyState
                  title="No service calls"
                  body="Nothing has gone wrong on this one — long may it last."
                  className="py-6"
                />
              ) : (
                <ul className="divide-y divide-rule">
                  {tickets.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{t.subject}</p>
                        <p className="tnum mt-0.5 text-micro text-muted">
                          Opened {date(t.openedAt)}
                          {t.assignedTechId ? ` · ${memberName(t.assignedTechId)}` : ""}
                        </p>
                      </div>
                      <StatusBadge spec={TICKET_STATUS[t.status]} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-5">
            <Card>
              <CardHeader title="Full history" meta={`${timeline.length} events`} />
              <div className="px-4 py-4">
                {timeline.length === 0 ? (
                  <EmptyState
                    title="Nothing has happened yet"
                    body="Every stage change, survey, proposal and service call lands here."
                  />
                ) : (
                  <Timeline entries={timeline} />
                )}
              </div>
            </Card>

            {system && (
              <Card>
                <CardHeader
                  title="System health"
                  action={<StatusBadge spec={SYSTEM_HEALTH[system.health]} size="sm" dot />}
                />
                <div className="px-4 py-1">
                  <FieldList>
                    <Field label="Size" numeric>
                      {kw(system.systemSizeKw)}
                    </Field>
                    <Field label="Inverter">{system.inverterModel}</Field>
                    <Field label="Commissioned" numeric>
                      {date(system.commissionedAt)}
                    </Field>
                    <Field label="30-day ratio" numeric>
                      {pct(system.performanceRatioPct)}
                    </Field>
                    <Field label="Lifetime" numeric>
                      {kwh(system.lifetimeKwh)}
                    </Field>
                  </FieldList>
                </div>
                {system.alert && (
                  <p className="border-t border-rule px-4 py-2.5 text-tiny leading-relaxed text-warn">
                    {system.alert}
                  </p>
                )}
              </Card>
            )}

            {warranty && (
              <Card>
                <CardHeader title="Warranty" />
                <div className="px-4 py-1">
                  <FieldList>
                    <Field label="Workmanship" numeric>
                      {date(warranty.workmanshipExpiresAt)}
                    </Field>
                    <Field label="Panels" numeric>
                      {date(warranty.panelExpiresAt)}
                    </Field>
                    <Field label="Inverter" numeric>
                      {date(warranty.inverterExpiresAt)}
                    </Field>
                    <Field label="Monitoring" numeric>
                      {date(warranty.monitoringExpiresAt)}
                    </Field>
                  </FieldList>
                </div>
              </Card>
            )}

            {project && (
              <Card>
                <CardHeader title="Install" />
                <div className="px-4 py-1">
                  <FieldList>
                    <Field label="Stage">
                      <StatusBadge spec={INSTALL_STAGE[project.stage]} size="sm" />
                    </Field>
                    <Field label="Crew">{project.crewName}</Field>
                    <Field label="Crew lead">{memberName(project.crewLeadId)}</Field>
                    <Field label="Project manager">{memberName(project.projectManagerId)}</Field>
                    <Field label="Install date" numeric>
                      {date(project.scheduledDate)}
                    </Field>
                    <Field label="Completed" numeric>
                      {project.completedAt ? date(project.completedAt) : "—"}
                    </Field>
                  </FieldList>
                </div>
              </Card>
            )}

            {/* The referral graph, both directions */}
            {(referredBy || referralsMade.length > 0) && (
              <Card>
                <CardHeader
                  title="Referrals"
                  meta={referralsMade.length > 0 ? `${referralsMade.length} sent` : undefined}
                  action={
                    <Link
                      href="/referrals"
                      className="text-tiny font-medium text-solar-hot hover:underline"
                    >
                      All referrals
                    </Link>
                  }
                />

                {referredBy && (
                  <div className="border-b border-rule px-4 py-2.5">
                    <p className="text-micro text-muted">Came to us through</p>
                    <Link
                      href={`/contacts/${referredBy.referrerContactId}`}
                      className="text-sm font-medium text-ink hover:underline"
                    >
                      {contactName(referredBy.referrerContactId)}
                    </Link>
                    <p className="tnum mt-0.5 text-micro text-muted">
                      {date(referredBy.receivedAt)}
                    </p>
                  </div>
                )}

                {referralsMade.length > 0 && (
                  <ul className="divide-y divide-rule">
                    {referralsMade.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {r.referredName}
                          </p>
                          <p className="tnum mt-0.5 text-micro text-muted">
                            {date(r.receivedAt)}
                            {r.closedValueUsd ? ` · closed ${usd(r.closedValueUsd)}` : ""}
                          </p>
                        </div>
                        <StatusBadge spec={REFERRAL_STATUS[r.status]} size="sm" />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {contact.notes && (
              <Card>
                <CardHeader title="Account notes" />
                <p className="px-4 py-3 text-sm leading-relaxed text-ink-soft">{contact.notes}</p>
              </Card>
            )}

            {contact.tags.length > 0 && (
              <Card>
                <CardHeader title="Tags" />
                <div className="flex flex-wrap gap-1.5 px-4 py-3">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-rule-firm bg-canvas-sunk px-2 py-0.5 text-tiny text-ink-soft"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
