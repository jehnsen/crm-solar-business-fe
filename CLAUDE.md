# Solar Ops CRM

Internal CRM for a residential/commercial solar installation company. Users are
staff — sales reps, survey techs, project managers, permit coordinators, admins —
not homeowner customers. It is an operations tool: dense tables, kanban boards,
detail panels. No marketing surfaces, no centered hero anywhere.

The job it does: carry a lead from first contact → site survey → proposal →
contract → permitting/interconnection → installation → monitoring → service, in
one pipeline.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict
- **Tailwind v4** — CSS-first. Tokens live in `@theme` in `src/app/globals.css`.
  There is no `tailwind.config.ts`; do not add one.
- Recharts 3 for monitoring charts (client components only)
- `@dnd-kit` for kanban drag-and-drop (keyboard sensor included — keep it)
- lucide-react for icons

## Commands

```bash
npm run dev     # dev server
npm run build   # production build; also runs TypeScript
npm run lint    # eslint
npx tsc --noEmit
```

## Architecture

### The data seam — this is the important part

No backend exists. **Components never import from `src/data/*`.** They call
async functions in `src/lib/api.ts`, which today resolve from typed fixtures.
Swapping in a real API means editing only those function bodies to `fetch(...)`;
every signature, and therefore every component, stays as-is.

```
src/lib/types.ts    domain interfaces; every entity keyed to contactId
src/lib/api.ts      the seam — async getters, joins, derived views
src/lib/labels.ts   enum → { label, tone } maps. Wording lives here, once.
src/lib/format.ts   usd/kwh/kw/pct/date + TODAY
src/data/*.ts       fixtures only, reached through the seam
```

`src/lib/format.ts` exports `TODAY` — a **fixed** date (2026-09-12). Fixtures and
all relative-date math key off it so "stalled 34 days" stays stable and server
and client markup never diverge. Don't replace it with `new Date()`.

Fixture randomness (monitoring series) uses the seeded generator in
`src/lib/rng.ts` for the same reason. Keep it deterministic.

### Tasks vs `Lead.nextAction` — both, on purpose

`Task` ([types.ts](src/lib/types.ts)) is the general follow-up mechanism and is
keyed to **`contactId`**, not `leadId`, so follow-ups outlive the sale — that's
the whole point, and it's what post-install check-ins, warranty outreach and
referral thank-yous hang off.

`Lead.nextAction` / `nextActionDue` **stays** as the lead-specific shorthand
rendered on the Leads table, kanban card and panel. It was not migrated: ripping
it out would churn three call sites for no user-visible gain. Treat `Task` as the
queue and `nextAction` as the lead's own one-liner. If you ever do unify them,
`nextAction` is the thing to delete — not `Task.leadId`.

### Referrals are a graph, not an enum

`LeadSource: "referral"` only ever recorded *that* someone was referred.
`Referral` records **who referred whom**, and `Contact.referredByContactId` is
the FK. `getReferrerStandings()` is what makes "which customers send us work"
answerable. Don't put referral attribution back into `Contact.notes`.

### Joins, not denormalized records

Every entity carries `contactId`. The Contacts timeline
(`getContactTimeline`) and dossier (`getContactDossier`) are built by walking
across fixtures. Add a new lifecycle module by keying it to `contactId` and
extending those two functions — don't flatten history onto `Contact`.

`getPermitProjects()` derives each project's real position: earliest
non-complete step, days in stage, and the blocked/overdue/stalled flags the
board sorts by. That derivation belongs in the seam, not in components.

## Conventions that are deliberate

- **Status is always a written label**, never a bare color dot. `StatusBadge`
  takes a `LabelSpec` from `labels.ts`; `dot` is additive only. Don't add a
  dot-only variant.
- **Solar gold (`--color-solar`) is reserved** for primary actions and active
  nav. Status colors are off that ramp so a warning never reads as a CTA.
- **Numbered steps appear in exactly one place** — the proposal builder, which
  is a real sequence. Don't number anything else.
- **Tabular numerals** on every currency/kWh/date column: `tnum`, or a `<table>`
  (styled globally).
- Empty states name what's missing and the action that fills it, in the voice
  staff use. No "No data available".
- Copy uses office vocabulary: "Out for signature", "Waiting on parts",
  "PTO granted", "Needs revisit".
- Functional motion only (panel slide-in, kanban drag). `prefers-reduced-motion`
  is honored globally in `globals.css`.

## Shared components (build once, reuse)

`src/components/ui/` — `DataTable` (sort/filter/status columns), `SlideOver`
(focus-trapped right panel), `KanbanBoard` (dnd-kit), `Wizard` (proposal only),
`PipelineTracker` + `StepProgress` (permitting, contracts), `CalendarWeek` /
`CalendarMonth` (surveys), `StatusBadge`, `EmptyState`, `Primitives`
(MetricTile, Timeline, AlertLine, …).

`src/components/shell/AppShell.tsx` — sidebar + top bar; sidebar collapses to a
drawer under `lg`. The drawer closes via `onNavigate` on the links, **not** an
effect on `pathname` — setState-in-effect cascades a render and the lint rule
correctly rejects it.

## Page pattern

Server `page.tsx` awaits the seam and passes plain data to a `"use client"`
`*Workspace` component that owns view toggles, filters, and panel state. Detail
panels are separate `*Panel.tsx` files. Follow this split for new modules.
