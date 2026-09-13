"use client";

import Link from "next/link";
import { ArrowRight, CalendarPlus, Mail, MapPin, Phone } from "lucide-react";
import { contactOf, member } from "@/lib/api";
import {
  LEAD_SOURCE,
  LEAD_STAGE,
  LEAD_STAGE_ORDER,
  PROPERTY_TYPE,
  QUALIFICATION,
} from "@/lib/labels";
import { date, isOverdue, kw, relativeDays, usd } from "@/lib/format";
import type { Lead, LeadStage } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, FieldList, PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { AlertLine, PersonCell } from "@/components/ui/Primitives";
import { ScoreChip, StatusBadge } from "@/components/ui/StatusBadge";

export function LeadPanel({
  lead,
  onClose,
  onStageChange,
}: {
  lead: Lead | null;
  onClose: () => void;
  onStageChange: (to: LeadStage) => void;
}) {
  if (!lead) return null;

  const contact = contactOf(lead.contactId);
  const rep = member(lead.assignedRepId);
  const stageIndex = LEAD_STAGE_ORDER.indexOf(lead.stage);
  const nextStage =
    stageIndex >= 0 && stageIndex < 3 ? LEAD_STAGE_ORDER[stageIndex + 1] : null;

  return (
    <SlideOver
      open={Boolean(lead)}
      onClose={onClose}
      title={contact?.name ?? "Lead"}
      subtitle={
        <>
          <StatusBadge spec={LEAD_STAGE[lead.stage]} dot />
          <StatusBadge spec={QUALIFICATION[lead.qualification]} size="sm" />
          <span className="text-tiny text-muted">
            {contact ? PROPERTY_TYPE[contact.propertyType] : ""}
          </span>
        </>
      }
      footer={
        <>
          {nextStage && (
            <Button variant="primary" onClick={() => onStageChange(nextStage)}>
              Move to {LEAD_STAGE[nextStage].label}
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </Button>
          )}
          <Button>
            <CalendarPlus className="size-4" strokeWidth={2} />
            Book survey
          </Button>
          <Link
            href={`/contacts/${lead.contactId}`}
            className="ml-auto text-tiny font-medium text-solar-hot hover:underline"
          >
            Full customer record
          </Link>
        </>
      }
    >
      {lead.nextAction && (
        <div className="mb-5">
          <AlertLine tone={isOverdue(lead.nextActionDue) ? "danger" : "info"}>
            <strong className="font-semibold">Next: </strong>
            {lead.nextAction} — due {relativeDays(lead.nextActionDue)}.
          </AlertLine>
        </div>
      )}

      <PanelSection title="Contact">
        <div className="space-y-2 rounded border border-rule bg-surface px-3 py-2.5">
          {contact && (
            <>
              <p className="flex items-center gap-2 text-sm text-ink">
                <MapPin className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
                {contact.address.street}, {contact.address.city} {contact.address.state}{" "}
                {contact.address.zip}
              </p>
              <p className="flex items-center gap-2 text-sm text-ink">
                <Phone className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
                <a href={`tel:${contact.phone}`} className="tnum hover:underline">
                  {contact.phone}
                </a>
              </p>
              <p className="flex items-center gap-2 text-sm text-ink">
                <Mail className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
                <a href={`mailto:${contact.email}`} className="truncate hover:underline">
                  {contact.email}
                </a>
              </p>
            </>
          )}
        </div>
      </PanelSection>

      <PanelSection title="Qualification">
        <FieldList>
          <Field label="Eligibility score">
            <ScoreChip score={lead.eligibilityScore} />
          </Field>
          <Field label="Status">
            <StatusBadge spec={QUALIFICATION[lead.qualification]} size="sm" />
          </Field>
          <Field label="Monthly utility bill" numeric>
            {usd(lead.monthlyBillUsd)}
          </Field>
          <Field label="Estimated system" numeric>
            {kw(lead.estimatedSystemKw)}
          </Field>
          <Field label="Utility">{contact?.utility ?? "—"}</Field>
          <Field label="Rate schedule">{contact?.rateSchedule ?? "—"}</Field>
        </FieldList>
      </PanelSection>

      <PanelSection title="Roof & eligibility notes">
        <p className="rounded border border-rule bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
          {lead.roofNotes ?? "No roof notes yet — the survey tech fills these in on site."}
        </p>
      </PanelSection>

      <PanelSection title="Ownership">
        <FieldList>
          <Field label="Assigned rep">
            {rep ? <PersonCell name={rep.name} initials={rep.initials} meta={rep.team} /> : "Unassigned"}
          </Field>
          <Field label="Source">{LEAD_SOURCE[lead.source].label}</Field>
          <Field label="Created" numeric>
            {date(lead.createdAt)}
          </Field>
          <Field label="Last touched" numeric>
            {date(lead.lastTouchedAt)} ({relativeDays(lead.lastTouchedAt)})
          </Field>
        </FieldList>
      </PanelSection>

      {lead.lostReason && (
        <PanelSection title="Why we lost it">
          <AlertLine tone="idle">{lead.lostReason}</AlertLine>
        </PanelSection>
      )}

      {contact?.notes && (
        <PanelSection title="Account notes">
          <p className="rounded border border-rule bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            {contact.notes}
          </p>
        </PanelSection>
      )}

      <PanelSection title="Move to stage">
        <div className="flex flex-wrap gap-1.5">
          {LEAD_STAGE_ORDER.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => onStageChange(stage)}
              disabled={stage === lead.stage}
              className="rounded border border-rule-firm bg-surface px-2.5 py-1 text-tiny font-medium text-ink-soft transition-colors hover:bg-canvas-sunk disabled:border-solar disabled:bg-solar-wash disabled:text-solar-hot"
            >
              {LEAD_STAGE[stage].label}
            </button>
          ))}
        </div>
      </PanelSection>
    </SlideOver>
  );
}
