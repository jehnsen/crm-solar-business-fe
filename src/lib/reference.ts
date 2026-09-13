/**
 * Reference tables behind the seam's synchronous lookups.
 *
 * `contactOf`, `memberName`, `panelSpec` and friends are called *during render*
 * inside client components — table sorters, filter predicates, panel fields.
 * They cannot become `fetch` calls: a component can't await mid-render, and the
 * API token must never reach the browser.
 *
 * So the small, non-secret reference data (staff, customers, equipment
 * catalog, warranties) is fetched live server-side and handed to the client
 * once, through ReferenceProvider in the root layout. The lookup signatures
 * stay exactly as they were, which is what keeps the seam's contract intact.
 */

import type {
  Contact,
  ID,
  InverterSpec,
  PanelSpec,
  Referral,
  Task,
  TeamMember,
  WarrantyRecord,
} from "./types";

export interface ReferenceData {
  team: TeamMember[];
  contacts: Contact[];
  panels: PanelSpec[];
  inverters: InverterSpec[];
  warranties: WarrantyRecord[];
  tasks: Task[];
  referrals: Referral[];
  currentUserId: ID;
}

const EMPTY: ReferenceData = {
  team: [],
  contacts: [],
  panels: [],
  inverters: [],
  warranties: [],
  tasks: [],
  referrals: [],
  currentUserId: "tm-006",
};

/**
 * Module-level so the synchronous lookups can read it without a hook. On the
 * server this is filled per-request by the seam; in the browser it is filled
 * once by ReferenceProvider before any workspace renders.
 */
let store: ReferenceData = EMPTY;

export function setReference(next: Partial<ReferenceData>): void {
  store = { ...store, ...next };
}

export function reference(): ReferenceData {
  return store;
}

/* ── The lookups themselves ─────────────────────────────────────────────── */

export function lookupMember(id: ID | null): TeamMember | null {
  if (!id) return null;
  return store.team.find((t) => t.id === id) ?? null;
}

export function lookupMemberName(id: ID | null): string {
  if (!id) return "Unassigned";
  return store.team.find((t) => t.id === id)?.name ?? "Unknown";
}

export function lookupContact(id: ID): Contact | null {
  return store.contacts.find((c) => c.id === id) ?? null;
}

export function lookupContactName(id: ID): string {
  return store.contacts.find((c) => c.id === id)?.name ?? "Unknown customer";
}

export function lookupPanel(id: ID): PanelSpec | null {
  return store.panels.find((p) => p.id === id) ?? null;
}

export function lookupInverter(id: ID): InverterSpec | null {
  return store.inverters.find((i) => i.id === id) ?? null;
}

export function lookupWarranty(contactId: ID): WarrantyRecord | null {
  return store.warranties.find((w) => w.contactId === contactId) ?? null;
}

export function lookupTasksFor(contactId: ID): Task[] {
  return store.tasks.filter((t) => t.contactId === contactId);
}

export function lookupReferralsBy(contactId: ID): Referral[] {
  return store.referrals.filter((r) => r.referrerContactId === contactId);
}

export function lookupReferralThatBrought(contactId: ID): Referral | null {
  return store.referrals.find((r) => r.referredContactId === contactId) ?? null;
}
