"use client";

import { Camera, Check, MapPin, Zap } from "lucide-react";
import { contactOf, memberName } from "@/lib/api";
import { ROOF_CONDITION, ROOF_TYPE, SURVEY_STATUS } from "@/lib/labels";
import { dateWithDay, num, pct, time } from "@/lib/format";
import type { SiteSurvey } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, FieldList, PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { AlertLine } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function SurveyPanel({
  survey,
  onClose,
}: {
  survey: SiteSurvey | null;
  onClose: () => void;
}) {
  if (!survey) return null;
  const contact = contactOf(survey.contactId);
  const measured = survey.roofType !== null;

  return (
    <SlideOver
      open={Boolean(survey)}
      onClose={onClose}
      title={contact?.name ?? "Survey"}
      width="lg"
      subtitle={
        <>
          <StatusBadge spec={SURVEY_STATUS[survey.status]} dot />
          <span className="tnum text-tiny text-muted">
            {dateWithDay(survey.scheduledFor)} at {time(survey.scheduledFor)}
          </span>
          <span className="text-tiny text-muted">· {memberName(survey.assignedTechId)}</span>
        </>
      }
      footer={
        <>
          <Button variant="primary">
            {survey.status === "complete" ? "Send to pricing" : "Mark complete"}
          </Button>
          <Button>Reschedule</Button>
        </>
      }
    >
      {survey.status === "needs-revisit" && (
        <div className="mb-5">
          <AlertLine tone="warn">
            This one needs a second trip. {survey.electricalNotes ?? ""}
          </AlertLine>
        </div>
      )}

      <PanelSection title="Site">
        <div className="space-y-2 rounded border border-rule bg-surface px-3 py-2.5">
          <p className="flex items-start gap-2 text-sm text-ink">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={2} />
            {contact?.address.street}, {contact?.address.city} {contact?.address.state}{" "}
            {contact?.address.zip}
          </p>
          {survey.accessNotes && (
            <p className="border-t border-rule pt-2 text-tiny leading-relaxed text-muted">
              <span className="font-semibold text-ink-soft">Access: </span>
              {survey.accessNotes}
            </p>
          )}
        </div>
      </PanelSection>

      <PanelSection title="Roof">
        {measured ? (
          <FieldList>
            <Field label="Roof type">{survey.roofType ? ROOF_TYPE[survey.roofType] : "—"}</Field>
            <Field label="Condition">
              {survey.roofCondition ? (
                <StatusBadge spec={ROOF_CONDITION[survey.roofCondition]} size="sm" />
              ) : (
                "—"
              )}
            </Field>
            <Field label="Age" numeric>
              {survey.roofAgeYears !== null ? `${survey.roofAgeYears} years` : "—"}
            </Field>
            <Field label="Usable area" numeric>
              {survey.usableRoofSqft !== null ? `${num(survey.usableRoofSqft)} sq ft` : "—"}
            </Field>
            <Field label="Pitch" numeric>
              {survey.roofPitchDegrees !== null ? `${survey.roofPitchDegrees}°` : "—"}
            </Field>
            <Field label="Azimuth" numeric>
              {survey.azimuthDegrees !== null ? `${survey.azimuthDegrees}°` : "—"}
            </Field>
          </FieldList>
        ) : (
          <p className="rounded border border-dashed border-rule-firm bg-canvas-sunk/50 px-3 py-4 text-sm text-muted">
            Nothing measured yet — these fill in when the tech closes out on site.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Shading">
        <div className="rounded border border-rule bg-surface px-3 py-2.5">
          {survey.shadingObstructions.length > 0 ? (
            <ul className="space-y-1.5">
              {survey.shadingObstructions.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warn" />
                  {o}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No obstructions noted.</p>
          )}
          {survey.shadingLossPct !== null && (
            <p className="tnum mt-2.5 border-t border-rule pt-2.5 text-sm text-ink">
              Annual shading loss:{" "}
              <strong
                className={
                  survey.shadingLossPct > 8 ? "font-semibold text-warn" : "font-semibold text-ok"
                }
              >
                {pct(survey.shadingLossPct)}
              </strong>
            </p>
          )}
        </div>
      </PanelSection>

      <PanelSection title="Electrical">
        <FieldList>
          <Field label="Main panel">{survey.panelMakeModel ?? "Not recorded"}</Field>
          <Field label="Service size" numeric>
            {survey.mainPanelAmps !== null ? `${survey.mainPanelAmps} A` : "—"}
          </Field>
          <Field label="Upgrade needed">
            {survey.panelUpgradeNeeded ? (
              <StatusBadge label="Yes — quote the upgrade" tone="warn" size="sm" />
            ) : (
              <span className="text-sm text-ok">No</span>
            )}
          </Field>
        </FieldList>
        {survey.electricalNotes && (
          <p className="mt-2 flex items-start gap-2 rounded border border-rule bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            <Zap className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={2} />
            {survey.electricalNotes}
          </p>
        )}
      </PanelSection>

      <PanelSection title={`Photos (${survey.photos.filter((p) => p.capturedAt).length}/${survey.photos.length})`}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {survey.photos.map((photo) => {
            const captured = Boolean(photo.capturedAt);
            return (
              <li
                key={photo.id}
                className={
                  captured
                    ? "flex flex-col gap-1.5 rounded border border-rule bg-surface p-2"
                    : "flex flex-col gap-1.5 rounded border border-dashed border-rule-firm bg-canvas-sunk/40 p-2"
                }
              >
                <span
                  className={
                    captured
                      ? "flex aspect-4/3 items-center justify-center rounded bg-structural-hi text-slate-400"
                      : "flex aspect-4/3 items-center justify-center rounded bg-canvas-sunk text-faint"
                  }
                >
                  {captured ? (
                    <Check className="size-5 text-ok" strokeWidth={2.5} />
                  ) : (
                    <Camera className="size-5" strokeWidth={1.75} />
                  )}
                </span>
                <span className="text-micro font-medium leading-tight text-ink-soft">
                  {photo.label}
                </span>
                <span className="text-micro text-faint">
                  {captured ? "Captured" : "Not taken yet"}
                </span>
              </li>
            );
          })}
        </ul>
      </PanelSection>
    </SlideOver>
  );
}
