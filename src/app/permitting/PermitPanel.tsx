"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { memberName, type PermitProjectView } from "@/lib/api";
import { PERMIT_STATUS, PERMIT_STEP } from "@/lib/labels";
import { date, dayCount, relativeDays } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { AlertLine } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PermitPanel({
  project,
  onClose,
}: {
  project: PermitProjectView | null;
  onClose: () => void;
}) {
  if (!project) return null;

  return (
    <SlideOver
      open={Boolean(project)}
      onClose={onClose}
      title={project.contactName}
      width="lg"
      subtitle={
        <>
          {project.currentStep ? (
            <StatusBadge spec={PERMIT_STATUS[project.currentStep.status]} dot />
          ) : (
            <StatusBadge label="PTO granted" tone="ok" dot />
          )}
          <span className="tnum text-tiny text-muted">
            {project.completedCount} of 6 steps · {project.authority}
          </span>
        </>
      }
      footer={
        <>
          <Button variant="primary">Log an update</Button>
          <Link
            href={`/contacts/${project.contactId}`}
            className="ml-auto text-tiny font-medium text-solar-hot hover:underline"
          >
            Full customer record
          </Link>
        </>
      }
    >
      {(project.blocked || project.overdue || project.stalled) && (
        <div className="mb-5">
          <AlertLine tone={project.blocked ? "danger" : "warn"} icon={CircleAlert}>
            {project.blocked
              ? "This step is blocked and nothing moves until it clears."
              : project.overdue
                ? "This step is past the date the authority gave us."
                : "This step has been open longer than we'd like."}{" "}
            {dayCount(project.daysInStage)} in stage. {memberName(project.ownerId)} owns it.
          </AlertLine>
        </div>
      )}

      <PanelSection title="The six steps">
        <ol className="space-y-2">
          {project.steps.map((step) => {
            const spec = PERMIT_STEP[step.key];
            const isCurrent = project.currentStep?.id === step.id;

            return (
              <li
                key={step.id}
                className={
                  isCurrent
                    ? "rounded border border-solar bg-solar-wash/45 px-3 py-2.5"
                    : "rounded border border-rule bg-surface px-3 py-2.5"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span className="tnum flex size-5 shrink-0 items-center justify-center rounded-full border border-rule-firm bg-canvas text-micro font-bold text-muted">
                        {step.order}
                      </span>
                      {spec.label}
                    </p>
                    <p className="mt-1 pl-7 text-micro text-muted">
                      {step.authority}
                      {step.referenceNumber ? ` · ${step.referenceNumber}` : ""}
                    </p>
                  </div>
                  <StatusBadge spec={PERMIT_STATUS[step.status]} size="sm" />
                </div>

                <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 pl-7">
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-micro text-muted">Started</dt>
                    <dd className="tnum text-micro text-ink-soft">
                      {step.startedAt ? date(step.startedAt) : "—"}
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-micro text-muted">Completed</dt>
                    <dd className="tnum text-micro text-ink-soft">
                      {step.completedAt ? date(step.completedAt) : "—"}
                    </dd>
                  </div>
                  {step.dueAt && (
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-micro text-muted">Target</dt>
                      <dd className="tnum text-micro font-medium text-danger">
                        {date(step.dueAt)} ({relativeDays(step.dueAt)})
                      </dd>
                    </div>
                  )}
                </dl>

                {step.notes && (
                  <p className="mt-2 border-t border-rule pt-2 pl-7 text-tiny leading-relaxed text-ink-soft">
                    {step.notes}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </PanelSection>

      <PanelSection title="Ownership">
        <p className="rounded border border-rule bg-surface px-3 py-2.5 text-sm text-ink-soft">
          {memberName(project.ownerId)} is the permit coordinator on this job.
        </p>
      </PanelSection>
    </SlideOver>
  );
}
