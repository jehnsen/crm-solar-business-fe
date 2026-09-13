/**
 * The data seam.
 *
 * Components never talk to the backend directly — they call these functions.
 * Every one now resolves from the Laravel API (see `http.ts`); the signatures
 * are unchanged from the fixture-backed version, which is the whole point of
 * having had a seam: swapping the source touched only this file.
 *
 * Async getters fetch live, server-side, with the API token. The handful of
 * *synchronous* lookups (`contactOf`, `memberName`, `panelSpec`, …) are called
 * during client render and cannot await, so they read the reference tables in
 * `reference.ts`, which are hydrated from the same live API.
 */

import { apiGet } from "./http";
import { PERMIT_STEP_ORDER } from "./labels";
import { setReference, type ReferenceData } from "./reference";

/**
 * The synchronous lookups and the shared view types live in `lookups.ts`, which
 * has no path to the token-bearing `http.ts`. They are re-exported here so the
 * seam still presents one surface to server components; client components must
 * import them from `@/lib/lookups` directly, and the `server-only` guard in
 * `http.ts` fails the build if they ever don't.
 */
export {
  contactName,
  contactOf,
  inverterSpec,
  member,
  memberName,
  panelSpec,
  referralThatBrought,
  referralsMadeBy,
  tasksForContact,
  warrantyForContact,
} from "./lookups";

export type {
  FleetSummary,
  MonthlyPoint,
  PermitProjectView,
  PricingConstants,
  ReferralSummary,
  ReferrerStanding,
  TaskQueue,
} from "./lookups";

// `export type ... from` re-exports without binding the names locally, and the
// signatures below refer to them.
import type {
  FleetSummary,
  MonthlyPoint,
  PermitProjectView,
  PricingConstants,
  ReferralSummary,
  ReferrerStanding,
  TaskQueue,
} from "./lookups";
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
  NotificationPref,
  PanelSpec,
  PermitStep,
  PipelineStageConfig,
  Proposal,
  Referral,
  ServiceTicket,
  SiteSurvey,
  Task,
  TeamMember,
  TimelineEntry,
  WarrantyRecord,
} from "./types";

/* ── Reference data ─────────────────────────────────────────────────────── */

/**
 * Everything the synchronous lookups need, in one round trip.
 *
 * The root layout awaits this and passes the result to ReferenceProvider, so
 * both the server render and the browser share one consistent snapshot.
 */
export async function getReferenceData(): Promise<ReferenceData> {
  const [team, contacts, panels, inverters, warranties, tasks, referrals, me] = await Promise.all([
    apiGet<TeamMember[]>("team"),
    apiGet<Contact[]>("contacts"),
    apiGet<PanelSpec[]>("catalog/panels"),
    apiGet<InverterSpec[]>("catalog/inverters"),
    apiGet<WarrantyRecord[]>("service/warranties"),
    apiGet<Task[]>("tasks"),
    apiGet<Referral[]>("referrals"),
    apiGet<TeamMember>("me"),
  ]);

  const data: ReferenceData = {
    team,
    contacts,
    panels,
    inverters,
    warranties,
    tasks,
    referrals,
    currentUserId: me?.id ?? "tm-006",
  };

  // Fill the server-side copy too, so server components rendering in this same
  // request can use the synchronous lookups.
  setReference(data);

  return data;
}

/* ── People ─────────────────────────────────────────────────────────────── */

export async function getTeam(): Promise<TeamMember[]> {
  return apiGet<TeamMember[]>("team");
}

export async function getCurrentUser(): Promise<TeamMember> {
  return apiGet<TeamMember>("me");
}

export async function getCrew(): Promise<{ id: string; name: string; trade: string }[]> {
  return apiGet<{ id: string; name: string; trade: string }[]>("team/crew");
}

/* ── Contacts ───────────────────────────────────────────────────────────── */

export async function getContacts(): Promise<Contact[]> {
  return apiGet<Contact[]>("contacts");
}

export async function getContact(id: ID): Promise<Contact | null> {
  return apiGet<Contact>(`contacts/${id}`).catch(() => null);
}

/* ── Leads ──────────────────────────────────────────────────────────────── */

export async function getLeads(): Promise<Lead[]> {
  return apiGet<Lead[]>("leads");
}

export async function getLead(id: ID): Promise<Lead | null> {
  return apiGet<Lead>(`leads/${id}`).catch(() => null);
}

/** Eight-week count history per stage, for the dashboard sparklines. */
export async function getStageTrends(): Promise<Record<LeadStage, number[]>> {
  return apiGet<Record<LeadStage, number[]>>("leads/stage-trends");
}

export async function getLeadCountsByStage(): Promise<Record<LeadStage, number>> {
  return apiGet<Record<LeadStage, number>>("leads/stage-counts");
}

/* ── Surveys ────────────────────────────────────────────────────────────── */

export async function getSurveys(): Promise<SiteSurvey[]> {
  return apiGet<SiteSurvey[]>("surveys");
}

export async function getSurvey(id: ID): Promise<SiteSurvey | null> {
  return apiGet<SiteSurvey>(`surveys/${id}`).catch(() => null);
}

/** Surveys falling inside [from, to), sorted by start time. */
export async function getSurveysBetween(from: Date, to: Date): Promise<SiteSurvey[]> {
  return apiGet<SiteSurvey[]>("surveys", {
    query: { from: from.toISOString(), to: to.toISOString() },
  });
}

/* ── Proposals ──────────────────────────────────────────────────────────── */

export async function getProposals(): Promise<Proposal[]> {
  return apiGet<Proposal[]>("proposals");
}

export async function getProposal(id: ID): Promise<Proposal | null> {
  return apiGet<Proposal>(`proposals/${id}`).catch(() => null);
}

export async function getPanelCatalog(): Promise<PanelSpec[]> {
  return apiGet<PanelSpec[]>("catalog/panels");
}

export async function getInverterCatalog(): Promise<InverterSpec[]> {
  return apiGet<InverterSpec[]>("catalog/inverters");
}

export async function getPricingConstants(): Promise<PricingConstants> {
  return apiGet<PricingConstants>("catalog/pricing");
}

/* ── Contracts ──────────────────────────────────────────────────────────── */

export async function getContracts(): Promise<Contract[]> {
  return apiGet<Contract[]>("contracts");
}

export async function getContract(id: ID): Promise<Contract | null> {
  return apiGet<Contract>(`contracts/${id}`).catch(() => null);
}

/* ── Permitting ─────────────────────────────────────────────────────────── */

export async function getPermitSteps(): Promise<PermitStep[]> {
  return apiGet<PermitStep[]>("permitting/steps");
}

/**
 * Each project's derived position. The derivation lives in the backend seam
 * (PermitBoardService) rather than here or in a component.
 */
export async function getPermitProjects(): Promise<PermitProjectView[]> {
  return apiGet<PermitProjectView[]>("permitting/projects");
}

export async function getPermitProject(projectId: ID): Promise<PermitProjectView | null> {
  return apiGet<PermitProjectView>(`permitting/projects/${projectId}`).catch(() => null);
}

export { PERMIT_STEP_ORDER };

/* ── Installs ───────────────────────────────────────────────────────────── */

export async function getInstallProjects(): Promise<InstallProject[]> {
  return apiGet<InstallProject[]>("installations");
}

export async function getInstallProject(id: ID): Promise<InstallProject | null> {
  return apiGet<InstallProject>(`installations/${id}`).catch(() => null);
}

/* ── Monitoring ─────────────────────────────────────────────────────────── */

export async function getMonitoredSystems(): Promise<MonitoredSystem[]> {
  return apiGet<MonitoredSystem[]>("monitoring/systems");
}

export async function getMonitoredSystem(id: ID): Promise<MonitoredSystem | null> {
  return apiGet<MonitoredSystem>(`monitoring/systems/${id}`).catch(() => null);
}

/** Daily series for one system, most recent `days` entries. */
export async function getDailyReadings(systemId: ID, days = 30): Promise<MonitoringReading[]> {
  return apiGet<MonitoringReading[]>(`monitoring/systems/${systemId}/daily`, {
    query: { days },
  });
}

/** Monthly roll-up for the same system, for the "monthly" chart toggle. */
export async function getMonthlyReadings(systemId: ID, months = 12): Promise<MonthlyPoint[]> {
  return apiGet<MonthlyPoint[]>(`monitoring/systems/${systemId}/monthly`, {
    query: { months },
  });
}

export async function getFleetSummary(): Promise<FleetSummary> {
  return apiGet<FleetSummary>("monitoring/fleet");
}

/* ── Service ────────────────────────────────────────────────────────────── */

export async function getServiceTickets(): Promise<ServiceTicket[]> {
  return apiGet<ServiceTicket[]>("service/tickets");
}

export async function getServiceTicket(id: ID): Promise<ServiceTicket | null> {
  return apiGet<ServiceTicket>(`service/tickets/${id}`).catch(() => null);
}

export async function getWarranties(): Promise<WarrantyRecord[]> {
  return apiGet<WarrantyRecord[]>("service/warranties");
}

/* ── Tasks & follow-ups ─────────────────────────────────────────────────── */

export async function getTasks(): Promise<Task[]> {
  return apiGet<Task[]>("tasks");
}

export async function getTask(id: ID): Promise<Task | null> {
  return apiGet<Task>(`tasks/${id}`).catch(() => null);
}

/**
 * The queue bucketed by when the work is actually due, because "what do I owe
 * someone today" is the only question that page exists to answer. Bucketing
 * happens in the backend seam.
 */
export async function getTaskQueue(assigneeId?: ID): Promise<TaskQueue> {
  return apiGet<TaskQueue>("tasks/queue", { query: { assigneeId } });
}

/* ── Referrals ──────────────────────────────────────────────────────────── */

export async function getReferrals(): Promise<Referral[]> {
  return apiGet<Referral[]>("referrals");
}

/** Who actually sends us work. */
export async function getReferrerStandings(): Promise<ReferrerStanding[]> {
  return apiGet<ReferrerStanding[]>("referrals/standings");
}

export async function getReferralSummary(): Promise<ReferralSummary> {
  return apiGet<ReferralSummary>("referrals/summary");
}

/* ── Activity ───────────────────────────────────────────────────────────── */

export async function getActivity(limit = 20): Promise<ActivityEvent[]> {
  return apiGet<ActivityEvent[]>("activity", { query: { limit } });
}

/* ── Settings ───────────────────────────────────────────────────────────── */

export async function getPipelineStageConfig(): Promise<PipelineStageConfig[]> {
  return apiGet<PipelineStageConfig[]>("settings/pipeline-stages");
}

export async function getNotificationPrefs(): Promise<NotificationPref[]> {
  return apiGet<NotificationPref[]>("settings/notification-prefs");
}

/* ── Dashboard roll-up ──────────────────────────────────────────────────── */

export interface DashboardSummary {
  overdueTasks: Task[];
  tasksDueToday: Task[];
  liveTaskCount: number;
  newReferrals: Referral[];
  referralRewardsOwed: number;
  stageCounts: Record<LeadStage, number>;
  activeLeads: number;
  surveysThisWeek: SiteSurvey[];
  installsThisWeek: InstallProject[];
  stalledPermits: PermitProjectView[];
  openPipelineValue: number;
  awaitingSignature: Contract[];
  openTickets: ServiceTicket[];
  urgentTickets: ServiceTicket[];
  fleet: FleetSummary;
  flaggedSystems: MonitoredSystem[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>("dashboard");
}

/* ── Contact lifecycle ──────────────────────────────────────────────────── */

/**
 * One contact's whole history, ordered. Built backend-side by walking every
 * table on contactId — the payoff of keying everything to the contact rather
 * than denormalizing a blob per customer.
 */
export async function getContactTimeline(contactId: ID): Promise<TimelineEntry[]> {
  return apiGet<TimelineEntry[]>(`contacts/${contactId}/timeline`);
}

export interface ContactDossier {
  contact: Contact;
  lead: Lead | null;
  surveys: SiteSurvey[];
  proposals: Proposal[];
  contracts: Contract[];
  project: InstallProject | null;
  permitSteps: PermitStep[];
  system: MonitoredSystem | null;
  tickets: ServiceTicket[];
  warranty: WarrantyRecord | null;
  owner: TeamMember | null;
  tasks: Task[];
  referralsMade: Referral[];
  referredBy: Referral | null;
}

/** Everything attached to one customer, for the Contacts detail view. */
export async function getContactDossier(contactId: ID): Promise<ContactDossier | null> {
  return apiGet<ContactDossier>(`contacts/${contactId}/dossier`).catch(() => null);
}
