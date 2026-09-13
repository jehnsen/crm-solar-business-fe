/**
 * Domain model for the solar ops CRM.
 *
 * Every entity carries the foreign keys needed to walk a customer's whole
 * lifecycle: Contact -> Lead -> SiteSurvey -> Proposal -> Contract ->
 * InstallProject -> (PermitStep[], MonitoringReading[], ServiceTicket[]).
 * The Contacts timeline is built by joining across fixtures on contactId,
 * never from one flattened record.
 */

export type ID = string;

/** ISO-8601 date (YYYY-MM-DD) or full timestamp. Kept as string so fixtures
 *  serialize exactly as a real JSON API would. */
export type ISODate = string;

/* ── Shared vocabulary ──────────────────────────────────────────────────── */

export type StatusTone = "ok" | "warn" | "danger" | "info" | "idle" | "solar";

export type PropertyType = "residential" | "commercial";

export type LeadStage =
  | "new"
  | "qualified"
  | "survey-scheduled"
  | "proposal-sent"
  | "won"
  | "lost";

export type LeadSource =
  | "referral"
  | "web-form"
  | "door-knock"
  | "trade-show"
  | "utility-partner"
  | "repeat-customer"
  | "inbound-call";

export type QualificationStatus =
  | "unqualified"
  | "needs-info"
  | "qualified"
  | "disqualified";

export type RoofType =
  | "asphalt-shingle"
  | "tile"
  | "metal-standing-seam"
  | "flat-tpo"
  | "flat-ballasted"
  | "wood-shake";

export type RoofCondition = "excellent" | "good" | "fair" | "needs-work" | "replace-first";

/* ── People ─────────────────────────────────────────────────────────────── */

export type TeamRole =
  | "sales-rep"
  | "survey-tech"
  | "project-manager"
  | "permit-coordinator"
  | "install-crew-lead"
  | "service-tech"
  | "admin";

export interface TeamMember {
  id: ID;
  name: string;
  initials: string;
  role: TeamRole;
  email: string;
  phone: string;
  /** Crew or office this person reports to. */
  team: string;
  active: boolean;
}

/** The unified customer record. Everything else points back here. */
export interface Contact {
  id: ID;
  name: string;
  /** Set for commercial accounts; null for homeowners. */
  company: string | null;
  propertyType: PropertyType;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  utility: string;
  /** Rate schedule the savings math assumes, as the utility names it. */
  rateSchedule: string;
  createdAt: ISODate;
  ownerId: ID;
  /** Who sent them our way, when it was a named customer introduction. */
  referredByContactId: ID | null;
  tags: string[];
  notes: string | null;
}

/* ── Lead ───────────────────────────────────────────────────────────────── */

export interface Lead {
  id: ID;
  contactId: ID;
  stage: LeadStage;
  source: LeadSource;
  assignedRepId: ID;
  createdAt: ISODate;
  lastTouchedAt: ISODate;
  /** 0–100 composite of roof, shading, credit and usage signals. */
  eligibilityScore: number;
  qualification: QualificationStatus;
  /** Monthly utility spend the homeowner reported, in USD. */
  monthlyBillUsd: number;
  estimatedSystemKw: number;
  roofNotes: string | null;
  /** Why it was lost — only set on stage "lost". */
  lostReason: string | null;
  nextAction: string | null;
  nextActionDue: ISODate | null;
}

/* ── Site survey ────────────────────────────────────────────────────────── */

export type SurveyStatus = "scheduled" | "in-progress" | "complete" | "needs-revisit" | "canceled";

export interface SurveyPhoto {
  id: ID;
  /** Placeholder — no real upload target in the frontend build. */
  label: string;
  kind: "roof" | "panel" | "attic" | "meter" | "site" | "obstruction";
  capturedAt: ISODate | null;
}

export interface SiteSurvey {
  id: ID;
  contactId: ID;
  leadId: ID;
  status: SurveyStatus;
  scheduledFor: ISODate;
  /** Minutes budgeted on site. */
  durationMin: number;
  assignedTechId: ID;
  completedAt: ISODate | null;

  roofType: RoofType | null;
  roofCondition: RoofCondition | null;
  roofAgeYears: number | null;
  /** Usable plane area in square feet. */
  usableRoofSqft: number | null;
  roofPitchDegrees: number | null;
  azimuthDegrees: number | null;

  shadingObstructions: string[];
  /** Annual solar access, percent. */
  shadingLossPct: number | null;

  mainPanelAmps: number | null;
  panelMakeModel: string | null;
  panelUpgradeNeeded: boolean;
  electricalNotes: string | null;

  photos: SurveyPhoto[];
  accessNotes: string | null;
}

/* ── Proposal ───────────────────────────────────────────────────────────── */

export type ProposalStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
export type FinancingKind = "cash" | "loan" | "lease";

export interface PanelSpec {
  id: ID;
  make: string;
  model: string;
  watts: number;
  efficiencyPct: number;
  warrantyYears: number;
  pricePerWatt: number;
  /** Shown in the catalog so a rep can explain the upcharge. */
  note: string;
}

export interface InverterSpec {
  id: ID;
  make: string;
  model: string;
  kind: "string" | "microinverter" | "hybrid";
  capacityKw: number;
  efficiencyPct: number;
  warrantyYears: number;
  price: number;
  note: string;
}

export interface Proposal {
  id: ID;
  contactId: ID;
  leadId: ID;
  surveyId: ID | null;
  status: ProposalStatus;
  createdAt: ISODate;
  sentAt: ISODate | null;
  decidedAt: ISODate | null;
  preparedById: ID;

  /* Step 1 — sizing */
  roofAreaSqft: number;
  targetOffsetPct: number;
  systemSizeKw: number;
  panelCount: number;
  annualProductionKwh: number;

  /* Step 2 — equipment */
  panelId: ID;
  inverterId: ID;
  includesBattery: boolean;

  /* Step 3 — financing */
  financing: FinancingKind;
  grossCostUsd: number;
  incentivesUsd: number;
  netCostUsd: number;
  /** Null for cash deals. */
  monthlyPaymentUsd: number | null;
  aprPct: number | null;
  termYears: number | null;

  /* Step 4 — generated summary */
  annualSavingsUsd: number;
  lifetimeSavingsUsd: number;
  paybackYears: number;
  offsetAchievedPct: number;
}

/* ── Contract ───────────────────────────────────────────────────────────── */

export type ContractStatus = "draft" | "sent" | "signed" | "countersigned";

export interface Contract {
  id: ID;
  contactId: ID;
  proposalId: ID;
  status: ContractStatus;
  contractValueUsd: number;
  createdAt: ISODate;
  sentAt: ISODate | null;
  signedAt: ISODate | null;
  countersignedAt: ISODate | null;
  /** Who still owes a signature, in plain language. */
  awaiting: string | null;
  documentName: string;
  preparedById: ID;
  depositCollected: boolean;
  notes: string | null;
}

/* ── Permitting & interconnection ───────────────────────────────────────── */

export type PermitStepKey =
  | "permit-submitted"
  | "permit-approved"
  | "installation-complete"
  | "inspection-passed"
  | "interconnection-submitted"
  | "pto-granted";

export type PermitStepStatus = "not-started" | "in-progress" | "blocked" | "complete";

export interface PermitStep {
  id: ID;
  projectId: ID;
  contactId: ID;
  key: PermitStepKey;
  /** Position in the fixed six-stage sequence, 1-based. */
  order: number;
  status: PermitStepStatus;
  /** When this step was entered — drives the "stalled for N days" math. */
  startedAt: ISODate | null;
  completedAt: ISODate | null;
  /** Target date from the AHJ or utility, when one was given. */
  dueAt: ISODate | null;
  ownerId: ID;
  /** Authority having jurisdiction, or the utility, depending on step. */
  authority: string;
  referenceNumber: string | null;
  notes: string | null;
}

/* ── Installation ───────────────────────────────────────────────────────── */

export type InstallStage = "scheduled" | "in-progress" | "completed" | "punch-list";

export interface MaterialItem {
  id: ID;
  name: string;
  quantity: number;
  unit: string;
  staged: boolean;
}

export interface PunchListItem {
  id: ID;
  description: string;
  resolved: boolean;
  raisedAt: ISODate;
}

export interface InstallProject {
  id: ID;
  contactId: ID;
  contractId: ID;
  proposalId: ID;
  stage: InstallStage;
  systemSizeKw: number;
  panelCount: number;

  scheduledDate: ISODate;
  /** Working days budgeted. */
  estimatedDays: number;
  startedAt: ISODate | null;
  completedAt: ISODate | null;

  projectManagerId: ID;
  crewLeadId: ID;
  crewMemberIds: ID[];
  crewName: string;

  materials: MaterialItem[];
  punchList: PunchListItem[];
  /** 0–100, crew-reported. */
  progressPct: number;
  notes: string | null;
}

/* ── Monitoring ─────────────────────────────────────────────────────────── */

export interface MonitoringReading {
  id: ID;
  systemId: ID;
  contactId: ID;
  projectId: ID;
  date: ISODate;
  producedKwh: number;
  /** Modeled output for the same day, for the variance chart. */
  expectedKwh: number;
  peakKw: number;
  sunHours: number;
}

export type SystemHealth = "healthy" | "underperforming" | "offline" | "fault";

export interface MonitoredSystem {
  id: ID;
  contactId: ID;
  projectId: ID;
  health: SystemHealth;
  commissionedAt: ISODate;
  systemSizeKw: number;
  /** Rolling 30-day actual vs expected, as a percentage. */
  performanceRatioPct: number;
  lifetimeKwh: number;
  lastReportAt: ISODate;
  inverterModel: string;
  /** Plain-language reason shown in the alert list. */
  alert: string | null;
}

/* ── Service & warranty ─────────────────────────────────────────────────── */

export type TicketPriority = "urgent" | "high" | "normal" | "low";
export type TicketStatus = "open" | "scheduled" | "waiting-on-parts" | "resolved" | "closed";
export type TicketCategory =
  | "production-drop"
  | "inverter-fault"
  | "monitoring-offline"
  | "roof-leak"
  | "physical-damage"
  | "billing-question"
  | "panel-cleaning";

export interface TicketUpdate {
  id: ID;
  at: ISODate;
  authorId: ID;
  body: string;
}

export interface ServiceTicket {
  id: ID;
  contactId: ID;
  projectId: ID;
  systemId: ID | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  openedAt: ISODate;
  scheduledFor: ISODate | null;
  resolvedAt: ISODate | null;
  assignedTechId: ID | null;
  /** Snapshot of warranty state at open time. */
  warrantyCoveredBy: "workmanship" | "equipment" | "expired" | "none";
  updates: TicketUpdate[];
}

export interface WarrantyRecord {
  id: ID;
  contactId: ID;
  projectId: ID;
  workmanshipExpiresAt: ISODate;
  panelExpiresAt: ISODate;
  inverterExpiresAt: ISODate;
  monitoringExpiresAt: ISODate;
}

/* ── Tasks & follow-ups ─────────────────────────────────────────────────── */

/**
 * A piece of work someone owes a customer.
 *
 * Deliberately keyed to `contactId` rather than `leadId`: the whole point is
 * that follow-ups outlive the sale. `Lead.nextAction` stays as the
 * lead-specific shorthand shown on the Leads table; this is the general
 * mechanism that also covers post-install check-ins, warranty outreach and
 * referral thank-yous.
 */
export type TaskKind =
  | "call"
  | "email"
  | "site-visit"
  | "quote-follow-up"
  | "check-in"
  | "warranty-outreach"
  | "referral-thank-you"
  | "paperwork";

export type TaskStatus = "open" | "in-progress" | "done" | "snoozed" | "canceled";

export type TaskPriority = "urgent" | "high" | "normal" | "low";

/** Why the task exists — drives which module it shows up alongside. */
export type TaskTrigger =
  | "manual"
  | "stage-entered"
  | "proposal-sent"
  | "install-completed"
  | "warranty-expiring"
  | "production-drop"
  | "anniversary"
  | "referral-received";

export interface Task {
  id: ID;
  contactId: ID;
  /** Set when the task came out of an active lead; null for customer work. */
  leadId: ID | null;
  /** Set when the task is about a specific install. */
  projectId: ID | null;
  kind: TaskKind;
  status: TaskStatus;
  priority: TaskPriority;
  trigger: TaskTrigger;
  /** Imperative, in the voice staff use: "Call Harold about the battery quote". */
  title: string;
  detail: string | null;
  assigneeId: ID;
  createdAt: ISODate;
  dueAt: ISODate;
  completedAt: ISODate | null;
  /** Set while status is "snoozed". */
  snoozedUntil: ISODate | null;
}

/* ── Referrals ──────────────────────────────────────────────────────────── */

/**
 * A named introduction from one customer to a prospect.
 *
 * `LeadSource: "referral"` only ever said *that* a lead was referred. This
 * models *who* referred *whom*, so "which customers send us work" becomes a
 * query instead of a note someone has to read.
 */
export type ReferralStatus =
  | "offered"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "reward-paid";

export interface Referral {
  id: ID;
  /** The existing customer making the introduction. */
  referrerContactId: ID;
  /** The person introduced — set once they exist as a contact. */
  referredContactId: ID | null;
  /** Captured before the prospect is in the book. */
  referredName: string;
  referredPhone: string | null;
  referredEmail: string | null;
  status: ReferralStatus;
  receivedAt: ISODate;
  /** Lead created off the back of this introduction, once there is one. */
  leadId: ID | null;
  /** Contract value if it closed, for measuring referral yield. */
  closedValueUsd: number | null;
  rewardUsd: number;
  rewardPaidAt: ISODate | null;
  notes: string | null;
}

/* ── Activity feed ──────────────────────────────────────────────────────── */

export type ActivityKind =
  | "lead-created"
  | "stage-changed"
  | "survey-scheduled"
  | "survey-completed"
  | "proposal-sent"
  | "proposal-accepted"
  | "contract-signed"
  | "permit-filed"
  | "permit-approved"
  | "install-scheduled"
  | "install-completed"
  | "pto-granted"
  | "ticket-opened"
  | "ticket-resolved"
  | "task-completed"
  | "referral-received"
  | "note-added";

export interface ActivityEvent {
  id: ID;
  kind: ActivityKind;
  at: ISODate;
  actorId: ID;
  contactId: ID;
  /** Pre-written in the voice staff actually use. */
  summary: string;
  /** Where clicking through should land. */
  href: string | null;
}

/* ── Settings ───────────────────────────────────────────────────────────── */

export interface PipelineStageConfig {
  id: ID;
  key: LeadStage;
  label: string;
  /** Days after which a lead sitting here is flagged stale. */
  staleAfterDays: number;
  order: number;
  /** Locked stages can't be removed — the pipeline needs an entry and exits. */
  locked: boolean;
}

export interface NotificationPref {
  id: ID;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  digest: boolean;
}

/* ── Timeline (derived, not stored) ─────────────────────────────────────── */

/** One row of a contact's lifecycle, produced by joining the fixtures. */
export interface TimelineEntry {
  id: string;
  at: ISODate;
  module:
    | "lead"
    | "survey"
    | "proposal"
    | "contract"
    | "permit"
    | "install"
    | "monitoring"
    | "service"
    | "task"
    | "referral";
  title: string;
  detail: string;
  tone: StatusTone;
  href: string | null;
}
