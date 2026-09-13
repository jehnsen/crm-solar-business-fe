"use client";

import { Send } from "lucide-react";
import { contactOf, inverterSpec, memberName, panelSpec } from "@/lib/lookups";
import { FINANCING, PROPOSAL_STATUS } from "@/lib/labels";
import { date, kw, kwh, num, pct, usd } from "@/lib/format";
import type { Proposal } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, FieldList, PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ProposalPanel({
  proposal,
  onClose,
}: {
  proposal: Proposal | null;
  onClose: () => void;
}) {
  if (!proposal) return null;

  const contact = contactOf(proposal.contactId);
  const panel = panelSpec(proposal.panelId);
  const inverter = inverterSpec(proposal.inverterId);

  return (
    <SlideOver
      open={Boolean(proposal)}
      onClose={onClose}
      title={contact?.name ?? "Proposal"}
      subtitle={
        <>
          <StatusBadge spec={PROPOSAL_STATUS[proposal.status]} dot />
          <span className="tnum text-tiny text-muted">
            {kw(proposal.systemSizeKw)} · {usd(proposal.netCostUsd)} net
          </span>
        </>
      }
      footer={
        proposal.status === "draft" ? (
          <Button variant="primary">
            <Send className="size-4" strokeWidth={2.25} />
            Send to customer
          </Button>
        ) : proposal.status === "sent" ? (
          <>
            <Button variant="primary">Mark accepted</Button>
            <Button>Log a follow-up</Button>
          </>
        ) : (
          <Button>Duplicate as new draft</Button>
        )
      }
    >
      <PanelSection title="System">
        <FieldList>
          <Field label="System size" numeric>
            {kw(proposal.systemSizeKw)}
          </Field>
          <Field label="Panels" numeric>
            {num(proposal.panelCount)} × {panel?.watts ?? "—"} W
          </Field>
          <Field label="Panel model">
            {panel ? `${panel.make} ${panel.model}` : "—"}
          </Field>
          <Field label="Inverter">
            {inverter ? `${inverter.make} ${inverter.model}` : "—"}
          </Field>
          <Field label="Battery">{proposal.includesBattery ? "Included" : "Not included"}</Field>
          <Field label="Roof area used" numeric>
            {num(proposal.roofAreaSqft)} sq ft
          </Field>
        </FieldList>
      </PanelSection>

      <PanelSection title="Production">
        <FieldList>
          <Field label="Annual production" numeric>
            {kwh(proposal.annualProductionKwh)}
          </Field>
          <Field label="Target offset" numeric>
            {pct(proposal.targetOffsetPct)}
          </Field>
          <Field label="Offset achieved" numeric>
            {pct(proposal.offsetAchievedPct)}
          </Field>
        </FieldList>
      </PanelSection>

      <PanelSection title="Money">
        <FieldList>
          <Field label="Financing">
            <StatusBadge spec={FINANCING[proposal.financing]} size="sm" />
          </Field>
          <Field label="Gross cost" numeric>
            {usd(proposal.grossCostUsd)}
          </Field>
          <Field label="Incentives" numeric>
            {proposal.incentivesUsd > 0 ? `− ${usd(proposal.incentivesUsd)}` : usd(0)}
          </Field>
          <Field label="Net cost" numeric>
            <strong className="font-semibold">{usd(proposal.netCostUsd)}</strong>
          </Field>
          {proposal.monthlyPaymentUsd !== null && (
            <Field label="Monthly payment" numeric>
              {usd(proposal.monthlyPaymentUsd)}/mo
              {proposal.aprPct ? ` at ${num(proposal.aprPct, 2)}%` : ""}
            </Field>
          )}
          {proposal.termYears !== null && (
            <Field label="Term" numeric>
              {proposal.termYears} years
            </Field>
          )}
          <Field label="First-year savings" numeric>
            {usd(proposal.annualSavingsUsd)}
          </Field>
          <Field label="25-year savings" numeric>
            {usd(proposal.lifetimeSavingsUsd)}
          </Field>
          <Field label="Payback" numeric>
            {proposal.paybackYears > 0 ? `${num(proposal.paybackYears, 1)} years` : "—"}
          </Field>
        </FieldList>
      </PanelSection>

      <PanelSection title="History">
        <FieldList>
          <Field label="Prepared by">{memberName(proposal.preparedById)}</Field>
          <Field label="Created" numeric>
            {date(proposal.createdAt)}
          </Field>
          <Field label="Sent" numeric>
            {date(proposal.sentAt)}
          </Field>
          <Field label="Decided" numeric>
            {date(proposal.decidedAt)}
          </Field>
        </FieldList>
      </PanelSection>
    </SlideOver>
  );
}
