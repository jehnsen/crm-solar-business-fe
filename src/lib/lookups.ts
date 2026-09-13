/**
 * The client-safe half of the seam.
 *
 * `contactOf`, `memberName`, `panelSpec` and friends are called *during render*
 * inside client components — table sorters, filter predicates, panel fields —
 * so they cannot await a fetch. They read the reference tables in
 * `reference.ts`, hydrated once per request by the root layout.
 *
 * This module exists separately from `api.ts` on purpose: `api.ts` imports the
 * token-bearing `http.ts`, which is `server-only`. Anything a client component
 * needs lives here instead, so the credential can never be pulled into the
 * browser bundle. The split is enforced by the build, not by convention.
 */

import {
  lookupContact,
  lookupContactName,
  lookupInverter,
  lookupMember,
  lookupMemberName,
  lookupPanel,
  lookupReferralThatBrought,
  lookupReferralsBy,
  lookupTasksFor,
  lookupWarranty,
} from "./reference";
import type {
  Contact,
  ID,
  InverterSpec,
  PanelSpec,
  PermitStep,
  Referral,
  Task,
  TeamMember,
  WarrantyRecord,
} from "./types";

/* ── People ─────────────────────────────────────────────────────────────── */

/** Synchronous lookup for render-time name resolution inside tables. */
export function memberName(id: ID | null): string {
  return lookupMemberName(id);
}

export function member(id: ID | null): TeamMember | null {
  return lookupMember(id);
}

/* ── Contacts ───────────────────────────────────────────────────────────── */

export function contactName(id: ID): string {
  return lookupContactName(id);
}

export function contactOf(id: ID): Contact | null {
  return lookupContact(id);
}

/* ── Catalog ────────────────────────────────────────────────────────────── */

export function panelSpec(id: ID): PanelSpec | null {
  return lookupPanel(id);
}

export function inverterSpec(id: ID): InverterSpec | null {
  return lookupInverter(id);
}

/* ── Service ────────────────────────────────────────────────────────────── */

export function warrantyForContact(contactId: ID): WarrantyRecord | null {
  return lookupWarranty(contactId);
}

/* ── Tasks & referrals ──────────────────────────────────────────────────── */

export function tasksForContact(contactId: ID): Task[] {
  return lookupTasksFor(contactId);
}

export function referralsMadeBy(contactId: ID): Referral[] {
  return lookupReferralsBy(contactId);
}

export function referralThatBrought(contactId: ID): Referral | null {
  return lookupReferralThatBrought(contactId);
}

/* ── Shared view types ──────────────────────────────────────────────────── */
/* Derived server-side, but named in client component props — so they live on
   this side of the split where both halves can import them. */

export interface PermitProjectView {
  projectId: ID;
  contactId: ID;
  contactName: string;
  steps: PermitStep[];
  /** Earliest step not yet complete — where the project actually stands. */
  currentStep: PermitStep | null;
  currentStepKey: PermitStep["key"] | "done";
  completedCount: number;
  /** Days the project has sat in its current step. */
  daysInStage: number;
  stalled: boolean;
  blocked: boolean;
  overdue: boolean;
  ownerId: ID;
  authority: string;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  producedKwh: number;
  expectedKwh: number;
}

export interface FleetSummary {
  systems: number;
  fleetSizeKw: number;
  lifetimeKwh: number;
  flaggedCount: number;
  producedYesterday: number;
  expectedYesterday: number;
  ratioYesterday: number;
}

export interface PricingConstants {
  batteryPriceUsd: number;
  incentiveRates: { federalCreditPct: number; stateCreditUsd: number };
  financingTerms: {
    loan: { aprPct: number; termYears: number };
    lease: { aprPct: number; termYears: number; escalatorPct: number };
  };
  utilityRateUsdPerKwh: number;
  utilityEscalationPct: number;
  kwhPerKwYear: number;
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

export interface ReferralSummary {
  total: number;
  live: number;
  won: number;
  conversionPct: number;
  closedValueUsd: number;
  rewardsOwedUsd: number;
  uncontacted: number;
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
