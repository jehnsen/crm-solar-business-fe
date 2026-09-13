"use client";

import Link from "next/link";
import { Check, MapPin, Package } from "lucide-react";
import { contactOf, member } from "@/lib/api";
import { INSTALL_STAGE, INSTALL_STAGE_ORDER } from "@/lib/labels";
import { date, kw, num } from "@/lib/format";
import type { InstallProject, InstallStage } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, FieldList, PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { AlertLine, PersonCell, Progress } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function InstallPanel({
  project,
  crew,
  onClose,
  onToggleMaterial,
  onTogglePunch,
  onStageChange,
}: {
  project: InstallProject | null;
  crew: { id: string; name: string; trade: string }[];
  onClose: () => void;
  onToggleMaterial: (materialId: string) => void;
  onTogglePunch: (itemId: string) => void;
  onStageChange: (to: InstallStage) => void;
}) {
  if (!project) return null;

  const contact = contactOf(project.contactId);
  const lead = member(project.crewLeadId);
  const pm = member(project.projectManagerId);
  const staged = project.materials.filter((m) => m.staged).length;
  const openPunch = project.punchList.filter((i) => !i.resolved);
  const assigned = crew.filter((c) => project.crewMemberIds.includes(c.id));

  const stageIndex = INSTALL_STAGE_ORDER.indexOf(project.stage);
  const nextStage =
    stageIndex >= 0 && stageIndex < INSTALL_STAGE_ORDER.length - 1
      ? INSTALL_STAGE_ORDER[stageIndex + 1]
      : null;

  return (
    <SlideOver
      open={Boolean(project)}
      onClose={onClose}
      title={contact?.name ?? "Install"}
      width="lg"
      subtitle={
        <>
          <StatusBadge spec={INSTALL_STAGE[project.stage]} dot />
          <span className="tnum text-tiny text-muted">
            {kw(project.systemSizeKw)} · {num(project.panelCount)} panels ·{" "}
            {date(project.scheduledDate)}
          </span>
        </>
      }
      footer={
        <>
          {nextStage && (
            <Button variant="primary" onClick={() => onStageChange(nextStage)}>
              Move to {INSTALL_STAGE[nextStage].label}
            </Button>
          )}
          <Link
            href={`/contacts/${project.contactId}`}
            className="ml-auto text-tiny font-medium text-solar-hot hover:underline"
          >
            Full customer record
          </Link>
        </>
      }
    >
      {openPunch.length > 0 && (
        <div className="mb-5">
          <AlertLine tone="warn">
            {openPunch.length} punch {openPunch.length === 1 ? "item" : "items"} still open. The
            job cannot be called for inspection until these are closed.
          </AlertLine>
        </div>
      )}

      <PanelSection title="Site">
        <p className="flex items-start gap-2 rounded border border-rule bg-surface px-3 py-2.5 text-sm text-ink">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={2} />
          {contact?.address.street}, {contact?.address.city} {contact?.address.state}{" "}
          {contact?.address.zip}
        </p>
      </PanelSection>

      <PanelSection title="Schedule & progress">
        <FieldList>
          <Field label="Install date" numeric>
            {date(project.scheduledDate)}
          </Field>
          <Field label="Planned duration" numeric>
            {project.estimatedDays} working {project.estimatedDays === 1 ? "day" : "days"}
          </Field>
          <Field label="Started" numeric>
            {project.startedAt ? date(project.startedAt) : "Not started"}
          </Field>
          <Field label="Completed" numeric>
            {project.completedAt ? date(project.completedAt) : "—"}
          </Field>
          <Field label="Crew-reported progress">
            <Progress
              pct={project.progressPct}
              tone={project.stage === "completed" ? "ok" : "solar"}
            />
          </Field>
        </FieldList>
      </PanelSection>

      <PanelSection title="Crew">
        <div className="space-y-2 rounded border border-rule bg-surface px-3 py-2.5">
          {pm && (
            <div className="flex items-center justify-between gap-3">
              <PersonCell name={pm.name} initials={pm.initials} meta="Project manager" />
            </div>
          )}
          {lead && (
            <div className="flex items-center justify-between gap-3 border-t border-rule pt-2">
              <PersonCell name={lead.name} initials={lead.initials} meta={`Crew lead · ${project.crewName}`} />
            </div>
          )}
          {assigned.length > 0 && (
            <ul className="border-t border-rule pt-2">
              {assigned.map((c) => (
                <li key={c.id} className="flex items-baseline justify-between gap-3 py-0.5">
                  <span className="text-sm text-ink-soft">{c.name}</span>
                  <span className="text-micro text-muted">{c.trade}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PanelSection>

      <PanelSection
        title={`Materials — ${staged} of ${project.materials.length} staged`}
        action={
          staged === project.materials.length ? (
            <StatusBadge label="Truck is loaded" tone="ok" size="sm" />
          ) : (
            <StatusBadge label="Still pulling" tone="warn" size="sm" />
          )
        }
      >
        <ul className="divide-y divide-rule rounded border border-rule bg-surface">
          {project.materials.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-canvas-sunk/50">
                <input
                  type="checkbox"
                  checked={m.staged}
                  onChange={() => onToggleMaterial(m.id)}
                  className="size-4 shrink-0 accent-solar"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{m.name}</span>
                <span className="tnum shrink-0 text-tiny text-muted">
                  {num(m.quantity)} {m.unit}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </PanelSection>

      <PanelSection title={`Punch list (${openPunch.length} open)`}>
        {project.punchList.length === 0 ? (
          <p className="rounded border border-dashed border-rule-firm bg-canvas-sunk/40 px-3 py-4 text-sm text-muted">
            Nothing on the punch list. Add an item if the crew or inspector flags something.
          </p>
        ) : (
          <ul className="divide-y divide-rule rounded border border-rule bg-surface">
            {project.punchList.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-canvas-sunk/50">
                  <input
                    type="checkbox"
                    checked={item.resolved}
                    onChange={() => onTogglePunch(item.id)}
                    className="mt-0.5 size-4 shrink-0 accent-solar"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        item.resolved
                          ? "block text-sm text-muted line-through"
                          : "block text-sm text-ink"
                      }
                    >
                      {item.description}
                    </span>
                    <span className="tnum block text-micro text-muted">
                      Raised {date(item.raisedAt)}
                    </span>
                  </span>
                  {item.resolved && (
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" strokeWidth={2.5} />
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      {project.notes && (
        <PanelSection title="Notes">
          <p className="flex items-start gap-2 rounded border border-rule bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            <Package className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={2} />
            {project.notes}
          </p>
        </PanelSection>
      )}
    </SlideOver>
  );
}
