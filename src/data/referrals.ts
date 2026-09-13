import type { Referral } from "@/lib/types";

/**
 * The referral graph.
 *
 * The first three back the prose that used to live in `Contact.notes`
 * ("Referred by the Whitmores", "Referred by Tomas Reyes") — now they're rows
 * you can query, so "who sends us work" is answerable. The rest are names
 * given but not yet closed, which is the state most referrals actually sit in.
 */
export const referrals: Referral[] = [
  {
    id: "rf-001",
    referrerContactId: "ct-001",
    referredContactId: "ct-005",
    referredName: "Angela Ibarra",
    referredPhone: "(480) 555-0204",
    referredEmail: "angela.ibarra@protonmail.com",
    status: "reward-paid",
    receivedAt: "2025-03-28",
    leadId: "ld-005",
    closedValueUsd: 25256,
    rewardUsd: 500,
    rewardPaidAt: "2025-06-01",
    notes: "Harold gave us her name at his own install. Closed inside six weeks.",
  },
  {
    id: "rf-002",
    referrerContactId: "ct-008",
    referredContactId: "ct-019",
    referredName: "Adaeze Nwosu",
    referredPhone: "(602) 555-0341",
    referredEmail: "ada.nwosu@gmail.com",
    status: "won",
    receivedAt: "2026-08-28",
    leadId: "ld-019",
    closedValueUsd: 30800,
    rewardUsd: 500,
    rewardPaidAt: null,
    notes:
      "Tomas is an HVAC contractor — his word carries. Install is in progress; reward due once it's commissioned.",
  },
  {
    id: "rf-003",
    referrerContactId: "ct-001",
    referredContactId: null,
    referredName: "Ray Whitmore (Harold's brother)",
    referredPhone: "(480) 555-0188",
    referredEmail: null,
    status: "offered",
    receivedAt: "2026-09-06",
    leadId: null,
    closedValueUsd: null,
    rewardUsd: 500,
    rewardPaidAt: null,
    notes: "Same street, similar roof. Harold says to call after 11am.",
  },
  {
    id: "rf-004",
    referrerContactId: "ct-011",
    referredContactId: null,
    referredName: "Dennis Pruitt",
    referredPhone: "(602) 555-0422",
    referredEmail: "dpruitt@cox.net",
    status: "contacted",
    receivedAt: "2026-08-24",
    leadId: null,
    closedValueUsd: null,
    rewardUsd: 500,
    rewardPaidAt: null,
    notes: "Left a voicemail Sep 2. Greg says he's serious but slow to call back.",
  },
  {
    id: "rf-005",
    referrerContactId: "ct-003",
    referredContactId: null,
    referredName: "Kestrel Family Dentistry",
    referredPhone: "(480) 555-0437",
    referredEmail: "office@kestreldental.com",
    status: "qualified",
    receivedAt: "2026-08-12",
    leadId: null,
    closedValueUsd: null,
    rewardUsd: 1500,
    rewardPaidAt: null,
    notes:
      "Cheryl passed us to another practice in the same building. Commercial reward tier. Flat roof, same vintage.",
  },
  {
    id: "rf-006",
    referrerContactId: "ct-007",
    referredContactId: null,
    referredName: "Marta Quintero",
    referredPhone: "(480) 555-0449",
    referredEmail: null,
    status: "lost",
    receivedAt: "2026-06-18",
    leadId: null,
    closedValueUsd: null,
    rewardUsd: 500,
    rewardPaidAt: null,
    notes: "Renting, so it was never going to work. Told Ruth we'd keep the name for later.",
  },
  {
    id: "rf-007",
    referrerContactId: "ct-013",
    referredContactId: null,
    referredName: "Southwest Fleet Repair",
    referredPhone: "(623) 555-0455",
    referredEmail: "shop@swfleetrepair.com",
    status: "offered",
    receivedAt: "2026-09-09",
    leadId: null,
    closedValueUsd: null,
    rewardUsd: 1500,
    rewardPaidAt: null,
    notes: "Another body shop across the yard. High daytime load, same profile as Northgate.",
  },
  {
    id: "rf-008",
    referrerContactId: "ct-005",
    referredContactId: null,
    referredName: "Bev Tanaka",
    referredPhone: "(480) 555-0461",
    referredEmail: "bev.tanaka@gmail.com",
    status: "contacted",
    receivedAt: "2026-09-01",
    leadId: null,
    closedValueUsd: null,
    rewardUsd: 500,
    rewardPaidAt: null,
    notes: "Angela was herself a referral — this is the second hop off the Whitmores.",
  },
];

export const referralById = new Map(referrals.map((r) => [r.id, r]));

/** Referrals grouped by who made them, for the contact record. */
export const referralsByReferrer = new Map<string, Referral[]>();
for (const r of referrals) {
  const list = referralsByReferrer.get(r.referrerContactId) ?? [];
  list.push(r);
  referralsByReferrer.set(r.referrerContactId, list);
}
