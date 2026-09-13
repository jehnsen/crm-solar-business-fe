/**
 * Every enum in the domain gets a human label and a status tone here.
 *
 * Rule from the brief: status is always a labeled stage, never a bare color
 * dot. Components read these maps instead of hand-writing strings, so the
 * wording stays identical across table cells, kanban headers and detail panels.
 * Wording is what staff say out loud ("Waiting on parts", "PTO granted"), not
 * the enum key.
 */

import type {
  ContractStatus,
  FinancingKind,
  InstallStage,
  LeadSource,
  LeadStage,
  PermitStepKey,
  PermitStepStatus,
  PropertyType,
  ProposalStatus,
  QualificationStatus,
  ReferralStatus,
  RoofCondition,
  RoofType,
  StatusTone,
  SurveyStatus,
  SystemHealth,
  TaskKind,
  TaskPriority,
  TaskStatus,
  TaskTrigger,
  TeamRole,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "./types";

export interface LabelSpec {
  label: string;
  tone: StatusTone;
  /** Optional one-line gloss for tooltips and detail panels. */
  hint?: string;
}

type Dict<K extends string> = Record<K, LabelSpec>;

/* ── Leads ──────────────────────────────────────────────────────────────── */

export const LEAD_STAGE: Dict<LeadStage> = {
  new: { label: "New", tone: "info", hint: "Not yet contacted" },
  qualified: { label: "Qualified", tone: "info", hint: "Roof and usage check out" },
  "survey-scheduled": {
    label: "Survey scheduled",
    tone: "solar",
    hint: "Tech is booked for a site visit",
  },
  "proposal-sent": {
    label: "Proposal sent",
    tone: "warn",
    hint: "Waiting on the customer to decide",
  },
  won: { label: "Won", tone: "ok", hint: "Signed and handed to project management" },
  lost: { label: "Lost", tone: "idle", hint: "Closed without a sale" },
};

/** Kanban column order for the leads board. */
export const LEAD_STAGE_ORDER: LeadStage[] = [
  "new",
  "qualified",
  "survey-scheduled",
  "proposal-sent",
  "won",
  "lost",
];

export const LEAD_SOURCE: Dict<LeadSource> = {
  referral: { label: "Referral", tone: "ok" },
  "web-form": { label: "Web form", tone: "info" },
  "door-knock": { label: "Door knock", tone: "idle" },
  "trade-show": { label: "Trade show", tone: "idle" },
  "utility-partner": { label: "Utility partner", tone: "info" },
  "repeat-customer": { label: "Repeat customer", tone: "ok" },
  "inbound-call": { label: "Inbound call", tone: "info" },
};

export const QUALIFICATION: Dict<QualificationStatus> = {
  unqualified: { label: "Not screened", tone: "idle" },
  "needs-info": { label: "Needs info", tone: "warn" },
  qualified: { label: "Qualified", tone: "ok" },
  disqualified: { label: "Disqualified", tone: "danger" },
};

/* ── Surveys ────────────────────────────────────────────────────────────── */

export const SURVEY_STATUS: Dict<SurveyStatus> = {
  scheduled: { label: "Scheduled", tone: "info" },
  "in-progress": { label: "On site", tone: "solar" },
  complete: { label: "Complete", tone: "ok" },
  "needs-revisit": { label: "Needs revisit", tone: "warn" },
  canceled: { label: "Canceled", tone: "idle" },
};

export const ROOF_TYPE: Record<RoofType, string> = {
  "asphalt-shingle": "Asphalt shingle",
  tile: "Tile",
  "metal-standing-seam": "Metal, standing seam",
  "flat-tpo": "Flat TPO",
  "flat-ballasted": "Flat, ballasted",
  "wood-shake": "Wood shake",
};

export const ROOF_CONDITION: Dict<RoofCondition> = {
  excellent: { label: "Excellent", tone: "ok" },
  good: { label: "Good", tone: "ok" },
  fair: { label: "Fair", tone: "warn" },
  "needs-work": { label: "Needs work", tone: "warn" },
  "replace-first": { label: "Replace roof first", tone: "danger" },
};

/* ── Proposals ──────────────────────────────────────────────────────────── */

export const PROPOSAL_STATUS: Dict<ProposalStatus> = {
  draft: { label: "Draft", tone: "idle" },
  sent: { label: "Sent", tone: "warn" },
  accepted: { label: "Accepted", tone: "ok" },
  declined: { label: "Declined", tone: "danger" },
  expired: { label: "Expired", tone: "idle" },
};

export const FINANCING: Dict<FinancingKind> = {
  cash: { label: "Cash purchase", tone: "ok" },
  loan: { label: "Loan", tone: "info" },
  lease: { label: "Lease / PPA", tone: "info" },
};

/* ── Contracts ──────────────────────────────────────────────────────────── */

export const CONTRACT_STATUS: Dict<ContractStatus> = {
  draft: { label: "Not yet sent", tone: "idle" },
  sent: { label: "Out for signature", tone: "warn" },
  signed: { label: "Signed by customer", tone: "info" },
  countersigned: { label: "Countersigned", tone: "ok" },
};

export const CONTRACT_STATUS_ORDER: ContractStatus[] = [
  "draft",
  "sent",
  "signed",
  "countersigned",
];

/* ── Permitting ─────────────────────────────────────────────────────────── */

export const PERMIT_STEP: Record<
  PermitStepKey,
  { label: string; short: string; authorityKind: "ahj" | "utility" | "internal" }
> = {
  "permit-submitted": {
    label: "Permit submitted",
    short: "Permit filed",
    authorityKind: "ahj",
  },
  "permit-approved": {
    label: "Permit approved",
    short: "Permit approved",
    authorityKind: "ahj",
  },
  "installation-complete": {
    label: "Installation complete",
    short: "Install done",
    authorityKind: "internal",
  },
  "inspection-passed": {
    label: "Inspection passed",
    short: "Inspection",
    authorityKind: "ahj",
  },
  "interconnection-submitted": {
    label: "Interconnection submitted",
    short: "Interconnection",
    authorityKind: "utility",
  },
  "pto-granted": {
    label: "PTO granted",
    short: "PTO",
    authorityKind: "utility",
  },
};

export const PERMIT_STEP_ORDER: PermitStepKey[] = [
  "permit-submitted",
  "permit-approved",
  "installation-complete",
  "inspection-passed",
  "interconnection-submitted",
  "pto-granted",
];

export const PERMIT_STATUS: Dict<PermitStepStatus> = {
  "not-started": { label: "Not started", tone: "idle" },
  "in-progress": { label: "In progress", tone: "solar" },
  blocked: { label: "Blocked", tone: "danger" },
  complete: { label: "Complete", tone: "ok" },
};

/* ── Installs ───────────────────────────────────────────────────────────── */

export const INSTALL_STAGE: Dict<InstallStage> = {
  scheduled: { label: "Scheduled", tone: "info" },
  "in-progress": { label: "In progress", tone: "solar" },
  completed: { label: "Completed", tone: "ok" },
  "punch-list": { label: "Punch list", tone: "warn" },
};

export const INSTALL_STAGE_ORDER: InstallStage[] = [
  "scheduled",
  "in-progress",
  "completed",
  "punch-list",
];

/* ── Monitoring ─────────────────────────────────────────────────────────── */

export const SYSTEM_HEALTH: Dict<SystemHealth> = {
  healthy: { label: "Healthy", tone: "ok" },
  underperforming: { label: "Underperforming", tone: "warn" },
  offline: { label: "Offline", tone: "danger" },
  fault: { label: "Inverter fault", tone: "danger" },
};

/* ── Service ────────────────────────────────────────────────────────────── */

export const TICKET_STATUS: Dict<TicketStatus> = {
  open: { label: "Open", tone: "warn" },
  scheduled: { label: "Scheduled", tone: "info" },
  "waiting-on-parts": { label: "Waiting on parts", tone: "warn" },
  resolved: { label: "Resolved", tone: "ok" },
  closed: { label: "Closed", tone: "idle" },
};

export const TICKET_PRIORITY: Dict<TicketPriority> = {
  urgent: { label: "Urgent", tone: "danger" },
  high: { label: "High", tone: "warn" },
  normal: { label: "Normal", tone: "info" },
  low: { label: "Low", tone: "idle" },
};

export const TICKET_CATEGORY: Record<TicketCategory, string> = {
  "production-drop": "Production drop",
  "inverter-fault": "Inverter fault",
  "monitoring-offline": "Monitoring offline",
  "roof-leak": "Roof leak",
  "physical-damage": "Physical damage",
  "billing-question": "Billing question",
  "panel-cleaning": "Panel cleaning",
};

export const WARRANTY_COVER: Dict<
  "workmanship" | "equipment" | "expired" | "none"
> = {
  workmanship: { label: "Workmanship", tone: "ok" },
  equipment: { label: "Equipment", tone: "ok" },
  expired: { label: "Out of warranty", tone: "danger" },
  none: { label: "Not covered", tone: "idle" },
};

/* ── Tasks ──────────────────────────────────────────────────────────────── */

export const TASK_STATUS: Dict<TaskStatus> = {
  open: { label: "Open", tone: "info" },
  "in-progress": { label: "Working on it", tone: "solar" },
  done: { label: "Done", tone: "ok" },
  snoozed: { label: "Snoozed", tone: "idle" },
  canceled: { label: "Dropped", tone: "idle" },
};

export const TASK_PRIORITY: Dict<TaskPriority> = {
  urgent: { label: "Urgent", tone: "danger" },
  high: { label: "High", tone: "warn" },
  normal: { label: "Normal", tone: "info" },
  low: { label: "Low", tone: "idle" },
};

export const TASK_KIND: Record<TaskKind, string> = {
  call: "Call",
  email: "Email",
  "site-visit": "Site visit",
  "quote-follow-up": "Quote follow-up",
  "check-in": "Check-in",
  "warranty-outreach": "Warranty outreach",
  "referral-thank-you": "Referral thank-you",
  paperwork: "Paperwork",
};

/** Why the task showed up — worth surfacing so nobody wonders who added it. */
export const TASK_TRIGGER: Record<TaskTrigger, string> = {
  manual: "Added by hand",
  "stage-entered": "Lead changed stage",
  "proposal-sent": "Proposal went out",
  "install-completed": "Install wrapped",
  "warranty-expiring": "Warranty running out",
  "production-drop": "Production dropped",
  anniversary: "System anniversary",
  "referral-received": "Referral came in",
};

/* ── Referrals ──────────────────────────────────────────────────────────── */

export const REFERRAL_STATUS: Dict<ReferralStatus> = {
  offered: { label: "Name given", tone: "info", hint: "Nobody has called them yet" },
  contacted: { label: "Reached out", tone: "solar" },
  qualified: { label: "Qualified", tone: "solar" },
  won: { label: "Became a customer", tone: "ok" },
  lost: { label: "Didn't pan out", tone: "idle" },
  "reward-paid": { label: "Reward paid", tone: "ok" },
};

export const REFERRAL_STATUS_ORDER: ReferralStatus[] = [
  "offered",
  "contacted",
  "qualified",
  "won",
  "reward-paid",
  "lost",
];

/* ── People ─────────────────────────────────────────────────────────────── */

export const TEAM_ROLE: Record<TeamRole, string> = {
  "sales-rep": "Sales rep",
  "survey-tech": "Survey tech",
  "project-manager": "Project manager",
  "permit-coordinator": "Permit coordinator",
  "install-crew-lead": "Crew lead",
  "service-tech": "Service tech",
  admin: "Admin",
};

export const PROPERTY_TYPE: Record<PropertyType, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

/* ── Tone → classes ─────────────────────────────────────────────────────── */

/** Badge classes per tone. Solar gold appears here only for "actively moving"
 *  states, so it never competes with the accent used on primary buttons. */
export const TONE_BADGE: Record<StatusTone, string> = {
  ok: "bg-ok-wash text-ok border-ok/25",
  warn: "bg-warn-wash text-warn border-warn/25",
  danger: "bg-danger-wash text-danger border-danger/25",
  info: "bg-info-wash text-info border-info/25",
  idle: "bg-idle-wash text-muted border-rule-firm",
  solar: "bg-solar-wash text-solar-hot border-solar/35",
};

export const TONE_DOT: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  idle: "bg-faint",
  solar: "bg-solar",
};

export const TONE_BAR: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  idle: "bg-rule-firm",
  solar: "bg-solar",
};

export const TONE_TEXT: Record<StatusTone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-info",
  idle: "text-muted",
  solar: "text-solar-hot",
};
