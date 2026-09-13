"use client";

import Link from "next/link";
import { CircleCheck, Wrench } from "lucide-react";
import { contactOf, memberName, warrantyForContact } from "@/lib/api";
import {
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  TICKET_STATUS,
  WARRANTY_COVER,
} from "@/lib/labels";
import { date, dateTime, dayCount, daysBetween, relativeDays } from "@/lib/format";
import type { ServiceTicket } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, FieldList, PanelSection, SlideOver } from "@/components/ui/SlideOver";
import { AlertLine, Avatar } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function TicketPanel({
  ticket,
  onClose,
  onResolve,
}: {
  ticket: ServiceTicket | null;
  onClose: () => void;
  onResolve: () => void;
}) {
  if (!ticket) return null;

  const contact = contactOf(ticket.contactId);
  const warranty = warrantyForContact(ticket.contactId);
  const isOpen = ticket.status !== "resolved" && ticket.status !== "closed";

  return (
    <SlideOver
      open={Boolean(ticket)}
      onClose={onClose}
      title={ticket.subject}
      width="lg"
      subtitle={
        <>
          <StatusBadge spec={TICKET_PRIORITY[ticket.priority]} dot />
          <StatusBadge spec={TICKET_STATUS[ticket.status]} size="sm" />
          <span className="text-tiny text-muted">{contact?.name}</span>
        </>
      }
      footer={
        <>
          {isOpen && (
            <Button variant="primary" onClick={onResolve}>
              <CircleCheck className="size-4" strokeWidth={2.25} />
              Mark resolved
            </Button>
          )}
          {isOpen && !ticket.assignedTechId && <Button>Assign a tech</Button>}
          <Link
            href={`/contacts/${ticket.contactId}`}
            className="ml-auto text-tiny font-medium text-solar-hot hover:underline"
          >
            Full customer record
          </Link>
        </>
      }
    >
      {ticket.priority === "urgent" && isOpen && (
        <div className="mb-5">
          <AlertLine tone="danger">
            Urgent — open {dayCount(daysBetween(ticket.openedAt))}.{" "}
            {ticket.scheduledFor
              ? `A tech is booked for ${date(ticket.scheduledFor)}.`
              : "Nothing is booked yet."}
          </AlertLine>
        </div>
      )}

      <PanelSection title="What's wrong">
        <p className="rounded border border-rule bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
          {ticket.description}
        </p>
      </PanelSection>

      <PanelSection title="Details">
        <FieldList>
          <Field label="Category">{TICKET_CATEGORY[ticket.category]}</Field>
          <Field label="Priority">
            <StatusBadge spec={TICKET_PRIORITY[ticket.priority]} size="sm" />
          </Field>
          <Field label="Status">
            <StatusBadge spec={TICKET_STATUS[ticket.status]} size="sm" />
          </Field>
          <Field label="Opened" numeric>
            {dateTime(ticket.openedAt)} ({relativeDays(ticket.openedAt)})
          </Field>
          <Field label="Scheduled" numeric>
            {ticket.scheduledFor ? dateTime(ticket.scheduledFor) : "Not booked"}
          </Field>
          <Field label="Resolved" numeric>
            {ticket.resolvedAt ? dateTime(ticket.resolvedAt) : "—"}
          </Field>
          <Field label="Assigned tech">
            {ticket.assignedTechId ? memberName(ticket.assignedTechId) : "Nobody yet"}
          </Field>
        </FieldList>
      </PanelSection>

      <PanelSection title="Warranty">
        <div className="rounded border border-rule bg-surface px-3 py-2.5">
          <p className="mb-2 flex items-center gap-2 text-sm text-ink">
            <Wrench className="size-3.5 shrink-0 text-muted" strokeWidth={2} />
            This repair falls under:{" "}
            <StatusBadge spec={WARRANTY_COVER[ticket.warrantyCoveredBy]} size="sm" />
          </p>
          {warranty ? (
            <dl className="space-y-1 border-t border-rule pt-2">
              <WarrantyRow label="Workmanship" iso={warranty.workmanshipExpiresAt} />
              <WarrantyRow label="Panels" iso={warranty.panelExpiresAt} />
              <WarrantyRow label="Inverter" iso={warranty.inverterExpiresAt} />
              <WarrantyRow label="Monitoring" iso={warranty.monitoringExpiresAt} />
            </dl>
          ) : (
            <p className="border-t border-rule pt-2 text-tiny text-muted">
              No warranty record on file for this customer.
            </p>
          )}
        </div>
      </PanelSection>

      <PanelSection title={`Updates (${ticket.updates.length})`}>
        {ticket.updates.length === 0 ? (
          <p className="rounded border border-dashed border-rule-firm bg-canvas-sunk/40 px-3 py-4 text-sm text-muted">
            No updates logged yet. Add one after the first call or site visit so the next person
            picks up where you left off.
          </p>
        ) : (
          <ol className="space-y-2">
            {[...ticket.updates].reverse().map((u) => (
              <li key={u.id} className="rounded border border-rule bg-surface px-3 py-2.5">
                <div className="mb-1.5 flex items-center gap-2">
                  <Avatar
                    initials={memberName(u.authorId)
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                    name={memberName(u.authorId)}
                    size="sm"
                  />
                  <span className="text-tiny font-medium text-ink">{memberName(u.authorId)}</span>
                  <time className="tnum ml-auto text-micro text-muted">{dateTime(u.at)}</time>
                </div>
                <p className="text-sm leading-relaxed text-ink-soft">{u.body}</p>
              </li>
            ))}
          </ol>
        )}
      </PanelSection>
    </SlideOver>
  );
}

function WarrantyRow({ label, iso }: { label: string; iso: string }) {
  const daysLeft = -daysBetween(iso);
  const expired = daysLeft <= 0;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-tiny text-muted">{label}</dt>
      <dd
        className={
          expired ? "tnum text-tiny font-medium text-danger" : "tnum text-tiny text-ink-soft"
        }
      >
        {date(iso)} {expired ? "· expired" : `· ${Math.floor(daysLeft / 365)} yrs left`}
      </dd>
    </div>
  );
}
