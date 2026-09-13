"use client";

import Link from "next/link";
import { FileText, Send } from "lucide-react";
import { contactOf, memberName } from "@/lib/api";
import { CONTRACT_STATUS, CONTRACT_STATUS_ORDER } from "@/lib/labels";
import { date, dateTime, usd } from "@/lib/format";
import type { Contract } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, FieldList, PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { AlertLine } from "@/components/ui/Primitives";
import { PipelineTracker, type TrackerStep } from "@/components/ui/PipelineTracker";
import { StatusBadge } from "@/components/ui/StatusBadge";

const NEXT_LABEL: Record<string, string> = {
  draft: "Send for signature",
  sent: "Mark customer signed",
  signed: "Countersign",
};

export function ContractPanel({
  contract,
  onClose,
  onAdvance,
}: {
  contract: Contract | null;
  onClose: () => void;
  onAdvance: () => void;
}) {
  if (!contract) return null;

  const contact = contactOf(contract.contactId);
  const currentIndex = CONTRACT_STATUS_ORDER.indexOf(contract.status);

  const stamps: Record<string, string | null> = {
    draft: contract.createdAt,
    sent: contract.sentAt,
    signed: contract.signedAt,
    countersigned: contract.countersignedAt,
  };

  const steps: TrackerStep[] = CONTRACT_STATUS_ORDER.map((status, i) => ({
    key: status,
    label: CONTRACT_STATUS[status].label,
    state: i < currentIndex ? "complete" : i === currentIndex ? "current" : "upcoming",
    meta: stamps[status] ? date(stamps[status]) : null,
  }));

  const nextLabel = NEXT_LABEL[contract.status];

  return (
    <SlideOver
      open={Boolean(contract)}
      onClose={onClose}
      title={contact?.name ?? "Contract"}
      width="lg"
      subtitle={
        <>
          <StatusBadge spec={CONTRACT_STATUS[contract.status]} dot />
          <span className="tnum text-tiny text-muted">{usd(contract.contractValueUsd)}</span>
        </>
      }
      footer={
        <>
          {nextLabel && (
            <Button variant="primary" onClick={onAdvance}>
              <Send className="size-4" strokeWidth={2.25} />
              {nextLabel}
            </Button>
          )}
          <Link
            href={`/contacts/${contract.contactId}`}
            className="ml-auto text-tiny font-medium text-solar-hot hover:underline"
          >
            Full customer record
          </Link>
        </>
      }
    >
      <PanelSection title="Signature status">
        <div className="rounded border border-rule bg-surface px-3 py-4">
          <PipelineTracker steps={steps} />
        </div>
        {contract.awaiting && (
          <div className="mt-2">
            <AlertLine tone={contract.status === "signed" ? "warn" : "info"}>
              Waiting on: {contract.awaiting}
            </AlertLine>
          </div>
        )}
      </PanelSection>

      <PanelSection title="Document">
        <p className="flex items-center gap-2 rounded border border-rule bg-surface px-3 py-2.5 text-sm text-ink">
          <FileText className="size-4 shrink-0 text-muted" strokeWidth={1.9} />
          <span className="truncate">{contract.documentName}</span>
        </p>
      </PanelSection>

      <PanelSection title="Terms">
        <FieldList>
          <Field label="Contract value" numeric>
            <strong className="font-semibold">{usd(contract.contractValueUsd)}</strong>
          </Field>
          <Field label="Deposit">
            {contract.depositCollected ? (
              <StatusBadge label="Collected" tone="ok" size="sm" />
            ) : (
              <StatusBadge label="Not collected" tone="idle" size="sm" />
            )}
          </Field>
          <Field label="Prepared by">{memberName(contract.preparedById)}</Field>
        </FieldList>
      </PanelSection>

      <PanelSection title="Timestamps">
        <FieldList>
          <Field label="Drafted" numeric>
            {date(contract.createdAt)}
          </Field>
          <Field label="Sent" numeric>
            {contract.sentAt ? dateTime(contract.sentAt) : "Not yet sent"}
          </Field>
          <Field label="Customer signed" numeric>
            {contract.signedAt ? dateTime(contract.signedAt) : "Not yet"}
          </Field>
          <Field label="Countersigned" numeric>
            {contract.countersignedAt ? dateTime(contract.countersignedAt) : "Not yet"}
          </Field>
        </FieldList>
      </PanelSection>

      {contract.notes && (
        <PanelSection title="Notes">
          <p className="rounded border border-rule bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            {contract.notes}
          </p>
        </PanelSection>
      )}
    </SlideOver>
  );
}
