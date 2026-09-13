/**
 * The data seam.
 *
 * Components never import from `@/data/*` directly — they call these functions.
 * Today every one resolves from typed fixtures; swapping in a real backend
 * means changing only the bodies here (to `fetch(...)`) while every signature,
 * and therefore every component, stays exactly as it is.
 *
 * Everything is async on purpose, even though fixtures are synchronous, so the
 * call sites are already written for a network round trip.
 */

import { activityEvents } from "@/data/activity";
import { batteryPriceUsd, incentiveRates, inverters, kwhPerKwYear, panels, utilityRateUsdPerKwh } from "@/data/catalog";
import { contacts } from "@/data/contacts";
import { contracts } from "@/data/contracts";
import { installProjects } from "@/data/installs";
import { leads } from "@/data/leads";
import { fleetSummary, monitoredSystems, monitoringReadings } from "@/data/monitoring";
import { permitSteps } from "@/data/permits";
import { proposals } from "@/data/proposals";
import { referrals } from "@/data/referrals";
import { serviceTickets, warrantyRecords } from "@/data/service";
import { surveys } from "@/data/surveys";
import { tasks } from "@/data/tasks";
import { crewMembers, currentUserId, notificationPrefs, pipelineStageConfig, team } from "@/data/team";

import { PERMIT_STEP_ORDER } from "./labels";
import { daysBetween, TODAY } from "./format";
import type {
  ActivityEvent,
  Contact,
  Contract,
  ID,
  InstallProject,
  InverterSpec,
  Lead,
  LeadStage,
  MonitoredSystem,
  MonitoringReading,
  PanelSpec,
  PermitStep,
  PermitStepKey,
  Proposal,
  Referral,
  ServiceTicket,
  SiteSurvey,
  Task,
  TeamMember,
  TimelineEntry,
  WarrantyRecord,
} from "./types";

/** Clone on read so a component mutating a row can't corrupt the fixture. */
function copy<T>(value: T): T {
  return structuredClone(value);
}

async function resolve<T>(value: T): Promise<T> {
  return copy(value);
}

/* ── People ─────────────────────────────────────────────────────────────── */

export async function getTeam(): Promise<TeamMember[]> {
  return resolve(team);
}

export async function getCurrentUser(): Promise<TeamMember> {
  const me = team.find((t) => t.id === currentUserId) ?? team[0];
  return resolve(me);
}

export async function getCrew() {
  return resolve(crewMembers);
}

/** Synchronous lookup for render-time name resolution inside tables. */
export function memberName(id: ID | null): string {
  if (!id) return "Unassigned";
  return team.find((t) => t.id === id)?.name ?? "Unknown";
}

export function member(id: ID | null): TeamMember | null {
  if (!id) return null;
  return team.find((t) => t.id === id) ?? null;
}

/* ── Contacts ───────────────────────────────────────────────────────────── */

export async function getContacts(): Promise<Contact[]> {
  return resolve(contacts);
}

export async function getContact(id: ID): Promise<Contact | null> {
  return resolve(contacts.find((c) => c.id === id) ?? null);
}

export function contactName(id: ID): string {
  return contacts.find((c) => c.id === id)?.name ?? "Unknown customer";
}

export function contactOf(id: ID): Contact | null {
  return contacts.find((c) => c.id === id) ?? null;
}

/* ── Leads ──────────────────────────────────────────────────────────────── */

export async function getLeads(): Promise<Lead[]> {
  return resolve(leads);
}

export async function getLead(id: ID): Promise<Lead | null> {
  return resolve(leads.find((l) => l.id === id) ?? null);
}

/**
 * Eight-week count history per stage, for the dashboard sparklines.
 *
 * Derived from each lead's createdAt against the stage it now sits in, so the
 * line reflects real fixture data rather than invented decoration. A real API
 * would serve this from a stage-transition log.
 */
export async function getStageTrends(): Promise<Record<LeadStage, number[]>> {
  const weeks = 8;
  const out = {} as Record<LeadStage, number[]>;
  const stages: LeadStage[] = [
    "new",
    "qualified",
    "survey-scheduled",
    "proposal-sent",
    "won",
    "lost",
  ];

  for (const stage of stages) {
    const inStage = leads.filter((l) => l.stage === stage);
    const series: number[] = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const cutoff = TODAY.getTime() - w * 7 * 86_400_000;
      // How many of today's stage members already existed that week.
      series.push(inStage.filter((l) => new Date(l.createdAt).getTime() <= cutoff).length);
    }
    out[stage] = series;
  }

  return resolve(out);
}

export async function getLeadCountsByStage(): Promise<Record<LeadStage, number>> {
  const counts = {
    new: 0,
    qualified: 0,
    "survey-scheduled": 0,
    "proposal-sent": 0,
    won: 0,
    lost: 0,
  } as Record<LeadStage, number>;
  for (const l of leads) counts[l.stage] += 1;
  return counts;
}

/* ── Surveys ────────────────────────────────────────────────────────────── */

export async function getSurveys(): Promise<SiteSurvey[]> {
  return resolve(surveys);
}

export async function getSurvey(id: ID): Promise<SiteSurvey | null> {
  return resolve(surveys.find((s) => s.id === id) ?? null);
}

/** Surveys falling inside [from, to), sorted by start time. */
export async function getSurveysBetween(from: Date, to: Date): Promise<SiteSurvey[]> {
  const hit = surveys
    .filter((s) => {
      const t = new Date(s.scheduledFor).getTime();
      return t >= from.getTime() && t < to.getTime();
    })
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  return resolve(hit);
}

/* ── Proposals ──────────────────────────────────────────────────────────── */

export async function getProposals(): Promise<Proposal[]> {
  return resolve(proposals);
}

export async function getProposal(id: ID): Promise<Proposal | null> {
  return resolve(proposals.find((p) => p.id === id) ?? null);
}

export async function getPanelCatalog(): Promise<PanelSpec[]> {
  return resolve(panels);
}

export async function getInverterCatalog(): Promise<InverterSpec[]> {
  return resolve(inverters);
}

export function panelSpec(id: ID): PanelSpec | null {
  return panels.find((p) => p.id === id) ?? null;
}

export function inverterSpec(id: ID): InverterSpec | null {
  return inverters.find((i) => i.id === id) ?? null;
}

export const pricingConstants = {
  batteryPriceUsd,
  incentiveRates,
  utilityRateUsdPerKwh,
  kwhPerKwYear,
};

/* ── Contracts ──────────────────────────────────────────────────────────── */

export async function getContracts(): Promise<Contract[]> {
  return resolve(contracts);
}

export async function getContract(id: ID): Promise<Contract | null> {
  return resolve(contracts.find((c) => c.id === id) ?? null);
}

/* ── Permitting ─────────────────────────────────────────────────────────── */

export async function getPermitSteps(): Promise<PermitStep[]> {
  return resolve(permitSteps);
}

export interface PermitProjectView {
  projectId: ID;
  contactId: ID;
  contactName: string;
  steps: PermitStep[];
  /** Earliest step not yet complete — where the project actually stands. */
  currentStep: PermitStep | null;
  currentStepKey: PermitStepKey | "done";
  completedCount: number;
  /** Days the project has sat in its current step. */
  daysInStage: number;
  stalled: boolean;
  blocked: boolean;
  overdue: boolean;
  ownerId: ID;
  authority: string;
}

/** How long a step can sit before the board calls it stalled. */
const STALL_THRESHOLD_DAYS = 21;

export async function getPermitProjects(): Promise<PermitProjectView[]> {
  const byProject = new Map<string, PermitStep[]>();
  for (const s of permitSteps) {
    const list = byProject.get(s.projectId) ?? [];
    list.push(s);
    byProject.set(s.projectId, list);
  }

  const views: PermitProjectView[] = [];
  for (const [projectId, rawSteps] of byProject) {
    const steps = [...rawSteps].sort((a, b) => a.order - b.order);
    const current = steps.find((s) => s.status !== "complete") ?? null;
    const completedCount = steps.filter((s) => s.status === "complete").length;

    const since = current?.startedAt ?? steps[completedCount - 1]?.completedAt ?? null;
    const daysInStage = since ? Math.max(0, daysBetween(since)) : 0;

    views.push({
      projectId,
      contactId: steps[0].contactId,
      contactName: contactName(steps[0].contactId),
      steps,
      currentStep: current,
      currentStepKey: current?.key ?? "done",
      completedCount,
      daysInStage,
      stalled: Boolean(current) && daysInStage >= STALL_THRESHOLD_DAYS,
      blocked: current?.status === "blocked",
      overdue: Boolean(
        current?.dueAt && new Date(current.dueAt).getTime() < TODAY.getTime(),
      ),
      ownerId: steps[0].ownerId,
      authority: current?.authority ?? steps[steps.length - 1].authority,
    });
  }

  // Worst first: blocked, then overdue, then longest in stage.
  views.sort((a, b) => {
    if (a.currentStepKey === "done" && b.currentStepKey !== "done") return 1;
    if (b.currentStepKey === "done" && a.currentStepKey !== "done") return -1;
    if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return b.daysInStage - a.daysInStage;
  });

  return resolve(views);
}

export async function getPermitProject(projectId: ID): Promise<PermitProjectView | null> {
  const all = await getPermitProjects();
  return all.find((p) => p.projectId === projectId) ?? null;
}

export { PERMIT_STEP_ORDER };

/* ── Installs ───────────────────────────────────────────────────────────── */

export async function getInstallProjects(): Promise<InstallProject[]> {
  return resolve(installProjects);
}

export async function getInstallProject(id: ID): Promise<InstallProject | null> {
  return resolve(installProjects.find((p) => p.id === id) ?? null);
}

/* ── Monitoring ─────────────────────────────────────────────────────────── */

export async function getMonitoredSystems(): Promise<MonitoredSystem[]> {
  return resolve(monitoredSystems);
}

export async function getMonitoredSystem(id: ID): Promise<MonitoredSystem | null> {
  return resolve(monitoredSystems.find((s) => s.id === id) ?? null);
}

/** Daily series for one system, most recent `days` entries. */
export async function getDailyReadings(systemId: ID, days = 30): Promise<MonitoringReading[]> {
  const series = monitoringReadings
    .filter((r) => r.systemId === systemId)
    .sort((a, b) => a.date.localeCompare(b.date));
  return resolve(series.slice(-days));
}

export interface MonthlyPoint {
  month: string;
  label: string;
  producedKwh: number;
  expectedKwh: number;
}

/** Monthly roll-up for the same system, for the "monthly" chart toggle. */
export async function getMonthlyReadings(systemId: ID, months = 12): Promise<MonthlyPoint[]> {
  const buckets = new Map<string, MonthlyPoint>();
  for (const r of monitoringReadings) {
    if (r.systemId !== systemId) continue;
    const month = r.date.slice(0, 7);
    const existing = buckets.get(month);
    if (existing) {
      existing.producedKwh += r.producedKwh;
      existing.expectedKwh += r.expectedKwh;
    } else {
      buckets.set(month, {
        month,
        label: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        producedKwh: r.producedKwh,
        expectedKwh: r.expectedKwh,
      });
    }
  }
  const points = [...buckets.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-months)
    .map((p) => ({
      ...p,
      producedKwh: Math.round(p.producedKwh),
      expectedKwh: Math.round(p.expectedKwh),
    }));
  return resolve(points);
}

export async function getFleetSummary() {
  return resolve(fleetSummary());
}

/* ── Service ────────────────────────────────────────────────────────────── */

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return resolve(serviceTickets);
}

export async function getServiceTicket(id: ID): Promise<ServiceTicket | null> {
  return resolve(serviceTickets.find((t) => t.id === id) ?? null);
}

export async function getWarranties(): Promise<WarrantyRecord[]> {
  return resolve(warrantyRecords);
}

export function warrantyForContact(contactId: ID): WarrantyRecord | null {
  return warrantyRecords.find((w) => w.contactId === contactId) ?? null;
}

/* ── Tasks & follow-ups ─────────────────────────────────────────────────── */

export async function getTasks(): Promise<Task[]> {
  return resolve(tasks);
}

export async function getTask(id: ID): Promise<Task | null> {
  return resolve(tasks.find((t) => t.id === id) ?? null);
}

export function tasksForContact(contactId: ID): Task[] {
  return tasks.filter((t) => t.contactId === contactId);
}

/** A task is "live" when someone still owes the work. */
function isLive(t: Task): boolean {
  return t.status === "open" || t.status === "in-progress";
}

export interface TaskQueue {
  overdue: Task[];
  today: Task[];
  thisWeek: Task[];
  later: Task[];
  snoozed: Task[];
  /** Finished in the last 30 days, newest first — proof the queue clears. */
  recentlyDone: Task[];
}

/**
 * Buckets the queue by when the work is actually due, because "what do I owe
 * someone today" is the only question this page exists to answer.
 */
export async function getTaskQueue(assigneeId?: ID): Promise<TaskQueue> {
  const scoped = assigneeId ? tasks.filter((t) => t.assigneeId === assigneeId) : tasks;
  const today = TODAY.getTime();
  const weekEnd = today + 7 * 86_400_000;

  const queue: TaskQueue = {
    overdue: [],
    today: [],
    thisWeek: [],
    later: [],
    snoozed: [],
    recentlyDone: [],
  };

  for (const t of scoped) {
    if (t.status === "snoozed") {
      queue.snoozed.push(t);
      continue;
    }
    if (t.status === "done") {
      if (t.completedAt && daysBetween(t.completedAt) <= 30) queue.recentlyDone.push(t);
      continue;
    }
    if (t.status === "canceled") continue;

    const due = new Date(t.dueAt).getTime();
    if (due < today) queue.overdue.push(t);
    else if (due === today) queue.today.push(t);
    else if (due < weekEnd) queue.thisWeek.push(t);
    else queue.later.push(t);
  }

  const byDue = (a: Task, b: Task) => a.dueAt.localeCompare(b.dueAt);
  queue.overdue.sort(byDue);
  queue.today.sort(byDue);
  queue.thisWeek.sort(byDue);
  queue.later.sort(byDue);
  queue.snoozed.sort((a, b) => (a.snoozedUntil ?? "").localeCompare(b.snoozedUntil ?? ""));
  queue.recentlyDone.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  return resolve(queue);
}

/* ── Referrals ──────────────────────────────────────────────────────────── */

export async function getReferrals(): Promise<Referral[]> {
  return resolve(referrals);
}

export function referralsMadeBy(contactId: ID): Referral[] {
  return referrals.filter((r) => r.referrerContactId === contactId);
}

export function referralThatBrought(contactId: ID): Referral | null {
  return referrals.find((r) => r.referredContactId === contactId) ?? null;
}

export interface ReferrerStanding {
  contactId: ID;
  name: string;
  introductions: number;
  won: number;
  /** Contract value closed off this person's introductions. */
  closedValueUsd: number;
  rewardsOwedUsd: number;
  rewardsPaidUsd: number;
}

/** Who actually sends us work — the question the old notes field couldn't answer. */
export async function getReferrerStandings(): Promise<ReferrerStanding[]> {
  const byReferrer = new Map<ID, ReferrerStanding>();

  for (const r of referrals) {
    const row =
      byReferrer.get(r.referrerContactId) ??
      ({
        contactId: r.referrerContactId,
        name: contactName(r.referrerContactId),
        introductions: 0,
        won: 0,
        closedValueUsd: 0,
        rewardsOwedUsd: 0,
        rewardsPaidUsd: 0,
      } satisfies ReferrerStanding);

    row.introductions += 1;
    if (r.status === "won" || r.status === "reward-paid") {
      row.won += 1;
      row.closedValueUsd += r.closedValueUsd ?? 0;
    }
    if (r.rewardPaidAt) row.rewardsPaidUsd += r.rewardUsd;
    else if (r.status === "won") row.rewardsOwedUsd += r.rewardUsd;

    byReferrer.set(r.referrerContactId, row);
  }

  const rows = [...byReferrer.values()].sort(
    (a, b) => b.closedValueUsd - a.closedValueUsd || b.introductions - a.introductions,
  );
  return resolve(rows);
}

export async function getReferralSummary() {
  const live = referrals.filter(
    (r) => r.status !== "lost" && r.status !== "reward-paid" && r.status !== "won",
  );
  const won = referrals.filter((r) => r.status === "won" || r.status === "reward-paid");
  const closedValue = won.reduce((s, r) => s + (r.closedValueUsd ?? 0), 0);
  const owed = referrals
    .filter((r) => r.status === "won" && !r.rewardPaidAt)
    .reduce((s, r) => s + r.rewardUsd, 0);

  return resolve({
    total: referrals.length,
    live: live.length,
    won: won.length,
    /** Share of introductions that became customers. */
    conversionPct: referrals.length > 0 ? Math.round((won.length / referrals.length) * 100) : 0,
    closedValueUsd: closedValue,
    rewardsOwedUsd: owed,
    uncontacted: referrals.filter((r) => r.status === "offered").length,
  });
}

/* ── Activity ───────────────────────────────────────────────────────────── */

export async function getActivity(limit = 20): Promise<ActivityEvent[]> {
  const sorted = [...activityEvents].sort((a, b) => b.at.localeCompare(a.at));
  return resolve(sorted.slice(0, limit));
}

/* ── Settings ───────────────────────────────────────────────────────────── */

export async function getPipelineStageConfig() {
  return resolve(pipelineStageConfig);
}

export async function getNotificationPrefs() {
  return resolve(notificationPrefs);
}

/* ── Dashboard roll-up ──────────────────────────────────────────────────── */

export async function getDashboardSummary() {
  const stageCounts = await getLeadCountsByStage();
  const permits = await getPermitProjects();
  const fleet = fleetSummary();

  const weekStart = new Date("2026-09-12T00:00:00");
  const weekEnd = new Date("2026-09-19T00:00:00");

  const surveysThisWeek = surveys.filter((s) => {
    const t = new Date(s.scheduledFor).getTime();
    return t >= weekStart.getTime() && t < weekEnd.getTime();
  });

  const installsThisWeek = installProjects.filter((p) => {
    const t = new Date(`${p.scheduledDate}T00:00:00`).getTime();
    return t >= weekStart.getTime() && t < weekEnd.getTime();
  });

  const openPipelineValue = proposals
    .filter((p) => p.status === "sent" || p.status === "draft")
    .reduce((sum, p) => sum + p.netCostUsd, 0);

  const awaitingSignature = contracts.filter(
    (c) => c.status === "sent" || c.status === "signed",
  );

  const openTickets = serviceTickets.filter(
    (t) => t.status !== "resolved" && t.status !== "closed",
  );

  const liveTasks = tasks.filter(isLive);
  const overdueTasks = liveTasks.filter((t) => new Date(t.dueAt).getTime() < TODAY.getTime());
  const tasksDueToday = liveTasks.filter((t) => t.dueAt === "2026-09-12");
  const newReferrals = referrals.filter((r) => r.status === "offered");

  return resolve({
    overdueTasks,
    tasksDueToday,
    liveTaskCount: liveTasks.length,
    newReferrals,
    referralRewardsOwed: referrals
      .filter((r) => r.status === "won" && !r.rewardPaidAt)
      .reduce((s, r) => s + r.rewardUsd, 0),
    stageCounts,
    activeLeads: leads.filter((l) => l.stage !== "won" && l.stage !== "lost").length,
    surveysThisWeek,
    installsThisWeek,
    stalledPermits: permits.filter((p) => p.stalled || p.blocked || p.overdue),
    openPipelineValue,
    awaitingSignature,
    openTickets,
    urgentTickets: openTickets.filter((t) => t.priority === "urgent"),
    fleet,
    flaggedSystems: monitoredSystems.filter((s) => s.health !== "healthy"),
  });
}

/* ── Contact lifecycle timeline (the join) ──────────────────────────────── */

/**
 * Walks every fixture for one contact and returns a single ordered history.
 * This is the payoff of keying everything to contactId rather than storing a
 * denormalized blob per customer.
 */
export async function getContactTimeline(contactId: ID): Promise<TimelineEntry[]> {
  const entries: TimelineEntry[] = [];

  const lead = leads.find((l) => l.contactId === contactId);
  if (lead) {
    entries.push({
      id: `tl-lead-${lead.id}`,
      at: lead.createdAt,
      module: "lead",
      title: "Lead created",
      detail: `Came in via ${lead.source.replace(/-/g, " ")} — assigned to ${memberName(lead.assignedRepId)}.`,
      tone: "info",
      href: "/leads",
    });
    if (lead.stage === "lost" && lead.lostReason) {
      entries.push({
        id: `tl-lost-${lead.id}`,
        at: lead.lastTouchedAt,
        module: "lead",
        title: "Marked lost",
        detail: lead.lostReason,
        tone: "idle",
        href: "/leads",
      });
    }
  }

  for (const s of surveys.filter((x) => x.contactId === contactId)) {
    entries.push({
      id: `tl-survey-${s.id}`,
      at: s.scheduledFor,
      module: "survey",
      title: s.status === "complete" ? "Site survey completed" : "Site survey scheduled",
      detail:
        s.status === "complete"
          ? `${memberName(s.assignedTechId)} measured ${s.usableRoofSqft ?? "—"} sq ft of usable roof.`
          : `${memberName(s.assignedTechId)} is booked for a ${s.durationMin}-minute visit.`,
      tone: s.status === "complete" ? "ok" : s.status === "needs-revisit" ? "warn" : "info",
      href: "/surveys",
    });
  }

  for (const p of proposals.filter((x) => x.contactId === contactId)) {
    if (p.sentAt) {
      entries.push({
        id: `tl-prop-${p.id}`,
        at: p.sentAt,
        module: "proposal",
        title: "Proposal sent",
        detail: `${p.systemSizeKw} kW, ${p.panelCount} panels — ${p.financing} at $${p.netCostUsd.toLocaleString()} net.`,
        tone: "warn",
        href: "/proposals",
      });
    }
    if (p.decidedAt) {
      entries.push({
        id: `tl-propdec-${p.id}`,
        at: p.decidedAt,
        module: "proposal",
        title: p.status === "accepted" ? "Proposal accepted" : "Proposal declined",
        detail:
          p.status === "accepted"
            ? `Customer accepted the ${p.systemSizeKw} kW design.`
            : "Customer passed on this design.",
        tone: p.status === "accepted" ? "ok" : "danger",
        href: "/proposals",
      });
    }
  }

  for (const c of contracts.filter((x) => x.contactId === contactId)) {
    if (c.sentAt) {
      entries.push({
        id: `tl-cnsent-${c.id}`,
        at: c.sentAt,
        module: "contract",
        title: "Contract sent for signature",
        detail: c.documentName,
        tone: "warn",
        href: "/contracts",
      });
    }
    if (c.countersignedAt) {
      entries.push({
        id: `tl-cndone-${c.id}`,
        at: c.countersignedAt,
        module: "contract",
        title: "Contract countersigned",
        detail: `$${c.contractValueUsd.toLocaleString()} — cleared for permitting.`,
        tone: "ok",
        href: "/contracts",
      });
    }
  }

  for (const step of permitSteps.filter((x) => x.contactId === contactId)) {
    if (step.status !== "complete" || !step.completedAt) continue;
    entries.push({
      id: `tl-permit-${step.id}`,
      at: step.completedAt,
      module: "permit",
      title: PERMIT_STEP_LABEL[step.key],
      detail: step.referenceNumber
        ? `${step.authority} — ${step.referenceNumber}`
        : step.authority,
      tone: step.key === "pto-granted" ? "ok" : "info",
      href: "/permitting",
    });
  }

  for (const p of installProjects.filter((x) => x.contactId === contactId)) {
    entries.push({
      id: `tl-installsched-${p.id}`,
      at: `${p.scheduledDate}T07:00:00`,
      module: "install",
      title: p.startedAt ? "Install started" : "Install scheduled",
      detail: `${p.crewName} under ${memberName(p.crewLeadId)} — ${p.panelCount} panels, ${p.estimatedDays} days planned.`,
      tone: "solar",
      href: "/installations",
    });
    if (p.completedAt) {
      entries.push({
        id: `tl-installdone-${p.id}`,
        at: p.completedAt,
        module: "install",
        title: "Install completed",
        detail: `${p.systemSizeKw} kW on the roof.`,
        tone: "ok",
        href: "/installations",
      });
    }
  }

  const system = monitoredSystems.find((s) => s.contactId === contactId);
  if (system) {
    entries.push({
      id: `tl-comm-${system.id}`,
      at: system.commissionedAt,
      module: "monitoring",
      title: "System commissioned",
      detail: `${system.inverterModel} online — monitoring active.`,
      tone: "ok",
      href: "/monitoring",
    });
  }

  for (const task of tasks.filter((x) => x.contactId === contactId)) {
    if (task.status === "done" && task.completedAt) {
      entries.push({
        id: `tl-task-${task.id}`,
        at: task.completedAt,
        module: "task",
        title: task.title,
        detail: `${memberName(task.assigneeId)} closed this out. ${task.detail ?? ""}`.trim(),
        tone: "ok",
        href: "/tasks",
      });
    } else if (task.status === "open" || task.status === "in-progress") {
      entries.push({
        id: `tl-task-${task.id}`,
        at: task.dueAt,
        module: "task",
        title: task.title,
        detail: `Due ${task.dueAt} · ${memberName(task.assigneeId)}. ${task.detail ?? ""}`.trim(),
        tone: new Date(task.dueAt).getTime() < TODAY.getTime() ? "danger" : "warn",
        href: "/tasks",
      });
    }
  }

  // Referrals this customer made, and the one that brought them in.
  for (const r of referrals.filter((x) => x.referrerContactId === contactId)) {
    entries.push({
      id: `tl-refout-${r.id}`,
      at: r.receivedAt,
      module: "referral",
      title: `Referred ${r.referredName}`,
      detail:
        r.status === "won" || r.status === "reward-paid"
          ? `Became a customer. ${r.notes ?? ""}`.trim()
          : (r.notes ?? "Introduction given."),
      tone: r.status === "won" || r.status === "reward-paid" ? "ok" : "info",
      href: "/referrals",
    });
  }

  const broughtBy = referrals.find((x) => x.referredContactId === contactId);
  if (broughtBy) {
    entries.push({
      id: `tl-refin-${broughtBy.id}`,
      at: broughtBy.receivedAt,
      module: "referral",
      title: `Introduced by ${contactName(broughtBy.referrerContactId)}`,
      detail: broughtBy.notes ?? "Came to us as a customer referral.",
      tone: "ok",
      href: "/referrals",
    });
  }

  for (const t of serviceTickets.filter((x) => x.contactId === contactId)) {
    entries.push({
      id: `tl-tkopen-${t.id}`,
      at: t.openedAt,
      module: "service",
      title: `Ticket opened — ${t.subject}`,
      detail: t.description,
      tone: t.priority === "urgent" ? "danger" : "warn",
      href: "/service",
    });
    if (t.resolvedAt) {
      entries.push({
        id: `tl-tkdone-${t.id}`,
        at: t.resolvedAt,
        module: "service",
        title: "Ticket resolved",
        detail: t.updates[t.updates.length - 1]?.body ?? "Closed out.",
        tone: "ok",
        href: "/service",
      });
    }
  }

  entries.sort((a, b) => b.at.localeCompare(a.at));
  return resolve(entries);
}

const PERMIT_STEP_LABEL: Record<PermitStepKey, string> = {
  "permit-submitted": "Permit submitted",
  "permit-approved": "Permit approved",
  "installation-complete": "Installation complete",
  "inspection-passed": "Inspection passed",
  "interconnection-submitted": "Interconnection submitted",
  "pto-granted": "PTO granted",
};

/** Everything attached to one customer, for the Contacts detail view. */
export async function getContactDossier(contactId: ID) {
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) return null;

  const project = installProjects.find((p) => p.contactId === contactId) ?? null;

  return resolve({
    contact,
    lead: leads.find((l) => l.contactId === contactId) ?? null,
    surveys: surveys.filter((s) => s.contactId === contactId),
    proposals: proposals.filter((p) => p.contactId === contactId),
    contracts: contracts.filter((c) => c.contactId === contactId),
    project,
    permitSteps: project
      ? permitSteps.filter((s) => s.projectId === project.id).sort((a, b) => a.order - b.order)
      : [],
    system: monitoredSystems.find((s) => s.contactId === contactId) ?? null,
    tickets: serviceTickets.filter((t) => t.contactId === contactId),
    warranty: warrantyRecords.find((w) => w.contactId === contactId) ?? null,
    owner: member(contact.ownerId),
    tasks: tasks.filter((t) => t.contactId === contactId),
    referralsMade: referrals.filter((r) => r.referrerContactId === contactId),
    referredBy: referrals.find((r) => r.referredContactId === contactId) ?? null,
  });
}

export type ContactDossier = NonNullable<Awaited<ReturnType<typeof getContactDossier>>>;
