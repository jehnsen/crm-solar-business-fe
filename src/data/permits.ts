import { PERMIT_STEP_ORDER } from "@/lib/labels";
import type { PermitStep, PermitStepKey, PermitStepStatus } from "@/lib/types";

/**
 * Six steps per project, always in the same sequence. This is the module
 * generic CRMs don't model: a project is only as far along as its earliest
 * unfinished step, and the Permitting board surfaces exactly where each one
 * is parked and for how long.
 */

interface StepSeed {
  status: PermitStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  dueAt?: string | null;
  ref?: string | null;
  notes?: string | null;
}

interface ProjectSeed {
  projectId: string;
  contactId: string;
  ownerId: string;
  ahj: string;
  utility: string;
  steps: StepSeed[];
}

const AHJ_STEPS: Record<PermitStepKey, "ahj" | "utility" | "internal"> = {
  "permit-submitted": "ahj",
  "permit-approved": "ahj",
  "installation-complete": "internal",
  "inspection-passed": "ahj",
  "interconnection-submitted": "utility",
  "pto-granted": "utility",
};

/** All six complete — the historical jobs now producing. */
function done(
  dates: [string, string][],
  refs: { permit: string; ic: string },
): StepSeed[] {
  return PERMIT_STEP_ORDER.map((key, i) => ({
    status: "complete" as const,
    startedAt: dates[i][0],
    completedAt: dates[i][1],
    dueAt: null,
    ref:
      key === "permit-submitted" || key === "permit-approved"
        ? refs.permit
        : key === "interconnection-submitted" || key === "pto-granted"
          ? refs.ic
          : null,
    notes: null,
  }));
}

const seeds: ProjectSeed[] = [
  {
    projectId: "ip-001",
    contactId: "ct-001",
    ownerId: "tm-008",
    ahj: "Town of Gilbert",
    utility: "Salt River Project",
    steps: done(
      [
        ["2025-03-20", "2025-03-20"],
        ["2025-03-20", "2025-04-11"],
        ["2025-05-06", "2025-05-07"],
        ["2025-05-12", "2025-05-19"],
        ["2025-05-20", "2025-05-20"],
        ["2025-05-20", "2025-06-09"],
      ],
      { permit: "GLB-2025-04471", ic: "SRP-IC-882140" },
    ),
  },
  {
    projectId: "ip-002",
    contactId: "ct-002",
    ownerId: "tm-008",
    ahj: "City of Chandler",
    utility: "Arizona Public Service",
    steps: done(
      [
        ["2025-04-10", "2025-04-10"],
        ["2025-04-10", "2025-05-02"],
        ["2025-05-28", "2025-05-30"],
        ["2025-06-03", "2025-06-10"],
        ["2025-06-11", "2025-06-11"],
        ["2025-06-11", "2025-07-01"],
      ],
      { permit: "CHN-2025-11204", ic: "APS-IC-440917" },
    ),
  },
  {
    projectId: "ip-003",
    contactId: "ct-003",
    ownerId: "tm-009",
    ahj: "City of Scottsdale",
    utility: "Arizona Public Service",
    steps: done(
      [
        ["2025-03-17", "2025-03-17"],
        ["2025-03-17", "2025-04-14"],
        ["2025-04-21", "2025-04-28"],
        ["2025-05-02", "2025-05-12"],
        ["2025-05-13", "2025-05-13"],
        ["2025-05-13", "2025-06-06"],
      ],
      { permit: "SCT-2025-00891", ic: "APS-IC-441522" },
    ),
  },
  {
    projectId: "ip-004",
    contactId: "ct-004",
    ownerId: "tm-008",
    ahj: "City of Surprise",
    utility: "Arizona Public Service",
    steps: done(
      [
        ["2025-05-02", "2025-05-02"],
        ["2025-05-02", "2025-05-23"],
        ["2025-06-10", "2025-06-11"],
        ["2025-06-16", "2025-06-23"],
        ["2025-06-24", "2025-06-24"],
        ["2025-06-24", "2025-07-15"],
      ],
      { permit: "SUR-2025-03318", ic: "APS-IC-442860" },
    ),
  },
  {
    projectId: "ip-005",
    contactId: "ct-005",
    ownerId: "tm-008",
    ahj: "City of Phoenix",
    utility: "Arizona Public Service",
    steps: done(
      [
        ["2025-05-19", "2025-05-19"],
        ["2025-05-19", "2025-06-12"],
        ["2025-06-24", "2025-06-25"],
        ["2025-06-30", "2025-07-09"],
        ["2025-07-10", "2025-07-10"],
        ["2025-07-10", "2025-07-31"],
      ],
      { permit: "PHX-2025-22047", ic: "APS-IC-443915" },
    ),
  },
  {
    projectId: "ip-006",
    contactId: "ct-006",
    ownerId: "tm-009",
    ahj: "City of Phoenix",
    utility: "Salt River Project",
    steps: done(
      [
        ["2025-04-28", "2025-04-28"],
        ["2025-04-28", "2025-05-26"],
        ["2025-06-02", "2025-06-12"],
        ["2025-06-17", "2025-06-27"],
        ["2025-06-30", "2025-06-30"],
        ["2025-06-30", "2025-07-28"],
      ],
      { permit: "PHX-2025-21550", ic: "SRP-IC-884012" },
    ),
  },
  {
    projectId: "ip-007",
    contactId: "ct-007",
    ownerId: "tm-008",
    ahj: "City of Mesa",
    utility: "Salt River Project",
    steps: done(
      [
        ["2025-06-27", "2025-06-27"],
        ["2025-06-27", "2025-07-23"],
        ["2025-08-05", "2025-08-07"],
        ["2025-08-11", "2025-08-19"],
        ["2025-08-20", "2025-08-20"],
        ["2025-08-20", "2025-09-12"],
      ],
      { permit: "MSA-2025-08832", ic: "SRP-IC-885331" },
    ),
  },
  {
    projectId: "ip-008",
    contactId: "ct-008",
    ownerId: "tm-008",
    ahj: "City of Glendale",
    utility: "Arizona Public Service",
    steps: done(
      [
        ["2025-06-03", "2025-06-03"],
        ["2025-06-03", "2025-06-27"],
        ["2025-07-15", "2025-07-16"],
        ["2025-07-21", "2025-07-29"],
        ["2025-07-30", "2025-07-30"],
        ["2025-07-30", "2025-08-21"],
      ],
      { permit: "GLN-2025-05529", ic: "APS-IC-444708" },
    ),
  },
  {
    projectId: "ip-009",
    contactId: "ct-009",
    ownerId: "tm-009",
    ahj: "City of Mesa",
    utility: "Salt River Project",
    steps: done(
      [
        ["2025-06-09", "2025-06-09"],
        ["2025-06-09", "2025-07-08"],
        ["2025-07-21", "2025-07-26"],
        ["2025-07-30", "2025-08-08"],
        ["2025-08-11", "2025-08-11"],
        ["2025-08-11", "2025-09-04"],
      ],
      { permit: "MSA-2025-08104", ic: "SRP-IC-884877" },
    ),
  },
  {
    projectId: "ip-010",
    contactId: "ct-010",
    ownerId: "tm-008",
    ahj: "Town of Gilbert",
    utility: "Salt River Project",
    steps: done(
      [
        ["2025-07-16", "2025-07-16"],
        ["2025-07-16", "2025-08-06"],
        ["2025-08-19", "2025-08-20"],
        ["2025-08-25", "2025-09-02"],
        ["2025-09-03", "2025-09-03"],
        ["2025-09-03", "2025-09-24"],
      ],
      { permit: "GLB-2025-05993", ic: "SRP-IC-886204" },
    ),
  },
  {
    projectId: "ip-011",
    contactId: "ct-011",
    ownerId: "tm-008",
    ahj: "City of Phoenix",
    utility: "Arizona Public Service",
    steps: done(
      [
        ["2025-02-12", "2025-02-12"],
        ["2025-02-12", "2025-03-07"],
        ["2025-03-25", "2025-03-26"],
        ["2025-03-31", "2025-04-08"],
        ["2025-04-09", "2025-04-09"],
        ["2025-04-09", "2025-04-30"],
      ],
      { permit: "PHX-2025-18822", ic: "APS-IC-439104" },
    ),
  },
  {
    projectId: "ip-012",
    contactId: "ct-012",
    ownerId: "tm-009",
    ahj: "City of Tempe",
    utility: "Salt River Project",
    steps: done(
      [
        ["2025-08-18", "2025-08-18"],
        ["2025-08-18", "2025-09-09"],
        ["2025-09-16", "2025-09-18"],
        ["2025-09-22", "2025-10-01"],
        ["2025-10-02", "2025-10-02"],
        ["2025-10-02", "2025-10-27"],
      ],
      { permit: "TMP-2025-04416", ic: "SRP-IC-887190" },
    ),
  },
  {
    projectId: "ip-013",
    contactId: "ct-013",
    ownerId: "tm-009",
    ahj: "City of Phoenix",
    utility: "Arizona Public Service",
    steps: done(
      [
        ["2025-04-02", "2025-04-02"],
        ["2025-04-02", "2025-05-01"],
        ["2025-05-12", "2025-05-23"],
        ["2025-05-28", "2025-06-09"],
        ["2025-06-10", "2025-06-10"],
        ["2025-06-10", "2025-07-07"],
      ],
      { permit: "PHX-2025-19740", ic: "APS-IC-440266" },
    ),
  },
  {
    projectId: "ip-014",
    contactId: "ct-014",
    ownerId: "tm-008",
    ahj: "Town of Gilbert",
    utility: "Salt River Project",
    steps: done(
      [
        ["2025-07-29", "2025-07-29"],
        ["2025-07-29", "2025-08-20"],
        ["2025-09-02", "2025-09-03"],
        ["2025-09-08", "2025-09-16"],
        ["2025-09-17", "2025-09-17"],
        ["2025-09-17", "2025-10-08"],
      ],
      { permit: "GLB-2025-06247", ic: "SRP-IC-886815" },
    ),
  },

  /* ── Live, and this is where the board earns its keep ────────────────── */
  {
    // Stalled 34 days waiting on the city. The worst one on the board.
    projectId: "ip-015",
    contactId: "ct-017",
    ownerId: "tm-008",
    ahj: "City of Phoenix",
    utility: "Arizona Public Service",
    steps: [
      {
        status: "complete",
        startedAt: "2026-08-09",
        completedAt: "2026-08-09",
        ref: "PHX-2026-30188",
        notes: "Filed with the carport canopy as a separate structural sheet.",
      },
      {
        status: "blocked",
        startedAt: "2026-08-09",
        completedAt: null,
        dueAt: "2026-08-30",
        ref: "PHX-2026-30188",
        notes:
          "Plan review kicked it back twice — they want a stamped structural calc for the canopy. Engineer has it.",
      },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
    ],
  },
  {
    projectId: "ip-016",
    contactId: "ct-021",
    ownerId: "tm-009",
    ahj: "City of Mesa",
    utility: "Salt River Project",
    steps: [
      {
        status: "not-started",
        startedAt: null,
        completedAt: null,
        notes: "Holding the filing until the survey confirms all four roof areas.",
      },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
    ],
  },
  {
    // Install done, waiting on inspection — the normal happy path mid-flight.
    projectId: "ip-017",
    contactId: "ct-024",
    ownerId: "tm-008",
    ahj: "City of Chandler",
    utility: "Arizona Public Service",
    steps: [
      {
        status: "complete",
        startedAt: "2026-08-14",
        completedAt: "2026-08-14",
        ref: "CHN-2026-14822",
        notes: null,
      },
      {
        status: "complete",
        startedAt: "2026-08-14",
        completedAt: "2026-09-04",
        ref: "CHN-2026-14822",
        notes: "Approved in 21 days, about normal for Chandler.",
      },
      {
        status: "in-progress",
        startedAt: "2026-09-11",
        completedAt: null,
        notes: "Crew is on the roof now, wrapping tomorrow.",
      },
      { status: "not-started", startedAt: null, completedAt: null, dueAt: "2026-09-25" },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
    ],
  },
  {
    projectId: "ip-018",
    contactId: "ct-019",
    ownerId: "tm-008",
    ahj: "City of Phoenix",
    utility: "Arizona Public Service",
    steps: [
      {
        status: "complete",
        startedAt: "2026-08-12",
        completedAt: "2026-08-12",
        ref: "PHX-2026-30244",
        notes: null,
      },
      {
        status: "complete",
        startedAt: "2026-08-12",
        completedAt: "2026-09-02",
        ref: "PHX-2026-30244",
        notes: null,
      },
      {
        status: "in-progress",
        startedAt: "2026-09-10",
        completedAt: null,
        notes: "Needs the utility meter swap before we can commission.",
      },
      { status: "not-started", startedAt: null, completedAt: null, dueAt: "2026-09-24" },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
    ],
  },
  {
    // Inspection failed once; now stalled on the punch list. 10 days in stage.
    projectId: "ip-019",
    contactId: "ct-025",
    ownerId: "tm-009",
    ahj: "City of Peoria",
    utility: "Arizona Public Service",
    steps: [
      {
        status: "complete",
        startedAt: "2026-07-20",
        completedAt: "2026-07-20",
        ref: "PEO-2026-07731",
        notes: null,
      },
      {
        status: "complete",
        startedAt: "2026-07-20",
        completedAt: "2026-08-17",
        ref: "PEO-2026-07731",
        notes: null,
      },
      {
        status: "complete",
        startedAt: "2026-08-24",
        completedAt: "2026-08-28",
        notes: null,
      },
      {
        status: "blocked",
        startedAt: "2026-09-02",
        completedAt: null,
        dueAt: "2026-09-09",
        notes:
          "Failed first inspection: conduit strap spacing and a missing placard. Re-inspection once the punch list closes.",
      },
      { status: "not-started", startedAt: null, completedAt: null },
      { status: "not-started", startedAt: null, completedAt: null },
    ],
  },
  {
    // Waiting on the utility — interconnection submitted 19 days ago.
    projectId: "ip-020",
    contactId: "ct-020",
    ownerId: "tm-008",
    ahj: "City of Glendale",
    utility: "Arizona Public Service",
    steps: [
      {
        status: "complete",
        startedAt: "2026-07-24",
        completedAt: "2026-07-24",
        ref: "GLN-2026-06612",
        notes: null,
      },
      {
        status: "complete",
        startedAt: "2026-07-24",
        completedAt: "2026-08-18",
        ref: "GLN-2026-06612",
        notes: null,
      },
      {
        status: "complete",
        startedAt: "2026-08-31",
        completedAt: "2026-09-01",
        notes: null,
      },
      {
        status: "complete",
        startedAt: "2026-09-02",
        completedAt: "2026-08-24",
        notes: "Passed on the first visit.",
      },
      {
        status: "in-progress",
        startedAt: "2026-08-24",
        completedAt: null,
        dueAt: "2026-09-21",
        ref: "APS-IC-461903",
        notes: "Application acknowledged. APS quoted 3–4 weeks to PTO.",
      },
      { status: "not-started", startedAt: null, completedAt: null },
    ],
  },
];

export const permitSteps: PermitStep[] = seeds.flatMap((seed) =>
  seed.steps.map((step, i) => {
    const key = PERMIT_STEP_ORDER[i];
    const kind = AHJ_STEPS[key];
    return {
      id: `${seed.projectId}-pm-${i + 1}`,
      projectId: seed.projectId,
      contactId: seed.contactId,
      key,
      order: i + 1,
      status: step.status,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      dueAt: step.dueAt ?? null,
      ownerId: seed.ownerId,
      authority:
        kind === "ahj" ? seed.ahj : kind === "utility" ? seed.utility : "Brightpath Solar",
      referenceNumber: step.ref ?? null,
      notes: step.notes ?? null,
    } satisfies PermitStep;
  }),
);

export const permitStepsByProject = new Map<string, PermitStep[]>();
for (const step of permitSteps) {
  const list = permitStepsByProject.get(step.projectId) ?? [];
  list.push(step);
  permitStepsByProject.set(step.projectId, list);
}
